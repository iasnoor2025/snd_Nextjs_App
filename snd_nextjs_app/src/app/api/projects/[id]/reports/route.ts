import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { 
  projects, 
  projectTasks, 
  projectMilestones, 
  projectRisks,
  projectMaterials,
  employees,
  timesheets 
} from '@/lib/drizzle/schema';
import { eq, and, desc, asc, count, sum, avg, sql } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';
    const dateRange = searchParams.get('date_range') || 'all';

    // Verify project exists
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const selectedProject = project[0];

    // Build date filter conditions
    const dateConditions = [];
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      dateConditions.push(sql`${projectTasks.createdAt} >= ${startDate.toISOString()}`);
    }

    let reportData: any = {};

    switch (reportType) {
      case 'overview':
        // Get project overview statistics
        const [taskStats, milestoneStats, resourceStats, riskStats] = await Promise.all([
          // Task statistics
          db
            .select({
              total: count(projectTasks.id),
              completed: count(sql`CASE WHEN ${projectTasks.status} = 'completed' THEN 1 END`),
              inProgress: count(sql`CASE WHEN ${projectTasks.status} = 'in_progress' THEN 1 END`),
              pending: count(sql`CASE WHEN ${projectTasks.status} = 'pending' THEN 1 END`),
              avgCompletion: avg(projectTasks.completionPercentage),
            })
            .from(projectTasks)
            .where(eq(projectTasks.projectId, parseInt(projectId))),

          // Milestone statistics
          db
            .select({
              total: count(projectMilestones.id),
              completed: count(sql`CASE WHEN ${projectMilestones.status} = 'completed' THEN 1 END`),
              pending: count(sql`CASE WHEN ${projectMilestones.status} = 'pending' THEN 1 END`),
            })
            .from(projectMilestones)
            .where(eq(projectMilestones.projectId, parseInt(projectId))),

          // Resource statistics - using project materials as resources
          db
            .select({
              total: count(projectMaterials.id),
              totalCost: sum(projectMaterials.totalCost),
              avgCost: avg(projectMaterials.totalCost),
            })
            .from(projectMaterials)
            .where(eq(projectMaterials.projectId, parseInt(projectId))),

          // Risk statistics
          db
            .select({
              total: count(projectRisks.id),
              high: count(sql`CASE WHEN ${projectRisks.severity} = 'high' THEN 1 END`),
              medium: count(sql`CASE WHEN ${projectRisks.severity} = 'medium' THEN 1 END`),
              low: count(sql`CASE WHEN ${projectRisks.severity} = 'low' THEN 1 END`),
            })
            .from(projectRisks)
            .where(eq(projectRisks.projectId, parseInt(projectId))),
        ]);

        reportData = {
          project: selectedProject,
          tasks: taskStats[0],
          milestones: milestoneStats[0],
          resources: resourceStats[0],
          risks: riskStats[0],
        };
        break;

      case 'progress':
        // Get detailed progress data
        const progressData = await db
          .select({
            taskId: projectTasks.id,
            taskName: projectTasks.name,
            status: projectTasks.status,
            completionPercentage: projectTasks.completionPercentage,
            assignedTo: employees.firstName,
            dueDate: projectTasks.dueDate,
            estimatedHours: projectTasks.estimatedHours,
            actualHours: projectTasks.actualHours,
          })
          .from(projectTasks)
          .leftJoin(employees, eq(projectTasks.assignedToId, employees.id))
          .where(eq(projectTasks.projectId, parseInt(projectId)))
          .orderBy(asc(projectTasks.order));

        reportData = {
          project: selectedProject,
          progress: progressData,
        };
        break;

      case 'cost':
        // Get cost analysis
        const costData = await db
          .select({
            resourceId: projectMaterials.id,
            type: projectMaterials.category,
            name: projectMaterials.name,
            totalCost: projectMaterials.totalCost,
            date: projectMaterials.createdAt,
            status: projectMaterials.status,
          })
          .from(projectMaterials)
          .where(eq(projectMaterials.projectId, parseInt(projectId)))
          .orderBy(desc(projectMaterials.totalCost));

        const costSummary = await db
          .select({
            totalCost: sum(projectMaterials.totalCost),
            avgCost: avg(projectMaterials.totalCost),
            resourceCount: count(projectMaterials.id),
          })
          .from(projectMaterials)
          .where(eq(projectMaterials.projectId, parseInt(projectId)));

        reportData = {
          project: selectedProject,
          costs: costData,
          summary: costSummary[0],
        };
        break;

      case 'timeline':
        // Get timeline and milestone data
        const timelineData = await db
          .select()
          .from(projectMilestones)
          .where(eq(projectMilestones.projectId, parseInt(projectId)))
          .orderBy(asc(projectMilestones.dueDate));

        const taskTimeline = await db
          .select({
            taskId: projectTasks.id,
            taskName: projectTasks.name,
            startDate: projectTasks.startDate,
            dueDate: projectTasks.dueDate,
            status: projectTasks.status,
            completionPercentage: projectTasks.completionPercentage,
          })
          .from(projectTasks)
          .where(eq(projectTasks.projectId, parseInt(projectId)))
          .orderBy(asc(projectTasks.startDate));

        reportData = {
          project: selectedProject,
          milestones: timelineData,
          tasks: taskTimeline,
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating project report:', error);
    return NextResponse.json({ error: 'Failed to generate project report' }, { status: 500 });
  }
}
