import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectManpower, projects, employees } from '@/lib/drizzle/schema';
import { eq, and, desc, asc, like } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
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
    const search = searchParams.get('search');

    // Build where conditions
    let whereConditions = [eq(projectManpower.projectId, parseInt(projectId))];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(projectManpower.status, status));
    }

    // Fetch manpower with related data
    const manpower = await db
      .select({
        id: projectManpower.id,
        projectId: projectManpower.projectId,
        employeeId: projectManpower.employeeId,
        workerName: projectManpower.workerName,
        jobTitle: projectManpower.jobTitle,
        dailyRate: projectManpower.dailyRate,
        startDate: projectManpower.startDate,
        endDate: projectManpower.endDate,
        totalDays: projectManpower.totalDays,
        actualDays: projectManpower.actualDays,
        status: projectManpower.status,
        notes: projectManpower.notes,
        assignedBy: projectManpower.assignedBy,
        createdAt: projectManpower.createdAt,
        updatedAt: projectManpower.updatedAt,
        employeeName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeFileNumber: employees.fileNumber,
      })
      .from(projectManpower)
      .leftJoin(employees, eq(projectManpower.employeeId, employees.id))
      .where(and(...whereConditions))
      .orderBy(desc(projectManpower.createdAt));

    return NextResponse.json({ 
      success: true,
      data: manpower 
    });
  } catch (error) {
    console.error('Error fetching project manpower:', error);
    return NextResponse.json({ error: 'Failed to fetch project manpower' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
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
      employeeId,
      workerName, // Use workerName instead of name
      jobTitle,
      dailyRate,
      startDate,
      endDate,
      totalDays,
      notes,
    } = body;

    // Validation - allow either employeeId OR workerName (for workers)
    if ((!employeeId && !workerName) || !jobTitle || !dailyRate || !startDate) {
      return NextResponse.json({ error: 'Either Employee ID or Worker Name, job title, daily rate, and start date are required' }, { status: 400 });
    }

    // Create manpower assignment
    const [newManpower] = await db
      .insert(projectManpower)
      .values({
        projectId: parseInt(projectId),
        employeeId: employeeId ? parseInt(employeeId) : null,
        workerName: workerName || null,
        jobTitle,
        dailyRate: parseFloat(dailyRate),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        totalDays: totalDays ? parseInt(totalDays) : null,
        status: 'active',
        notes,
        assignedBy: session.user.id ? parseInt(session.user.id) : null,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ 
      success: true,
      data: newManpower,
      message: 'Manpower assigned successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error assigning manpower:', error);
    return NextResponse.json({ error: 'Failed to assign manpower' }, { status: 500 });
  }
}
