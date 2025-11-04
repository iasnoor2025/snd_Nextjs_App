import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectMilestones, projects } from '@/lib/drizzle/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const status = searchParams.get('status');

    // Build where conditions
    const whereConditions = [eq(projectMilestones.projectId, parseInt(projectId))];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(projectMilestones.status, status));
    }

    // Fetch milestones
    const milestones = await db
      .select()
      .from(projectMilestones)
      .where(and(...whereConditions))
      .orderBy(asc(projectMilestones.order), asc(projectMilestones.dueDate));

    return NextResponse.json({ 
      success: true,
      data: milestones 
    });
  } catch (error) {
    console.error('Error fetching project milestones:', error);
    return NextResponse.json({ error: 'Failed to fetch project milestones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      dueDate,
      status = 'pending',
      order = 0,
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json({ error: 'Milestone name is required' }, { status: 400 });
    }
    if (!dueDate) {
      return NextResponse.json({ error: 'Due date is required' }, { status: 400 });
    }

    // Create milestone
    const [newMilestone] = await db
      .insert(projectMilestones)
      .values({
        projectId: parseInt(projectId),
        name,
        description,
        dueDate: new Date(dueDate).toISOString().split('T')[0],
        status,
        order,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    return NextResponse.json({ 
      success: true,
      data: newMilestone,
      message: 'Milestone created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project milestone:', error);
    return NextResponse.json({ error: 'Failed to create project milestone' }, { status: 500 });
  }
}
