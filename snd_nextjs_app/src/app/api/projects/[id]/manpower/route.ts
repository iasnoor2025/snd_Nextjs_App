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

    // Fetch manpower with related data - now with proper JOIN
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
        // Employee info from JOIN (only if employee_id exists)
        employeeName: employees.lastName, // Use lastName since first_name doesn't exist in DB
        employeeLastName: employees.lastName,
        employeeFileNumber: employees.fileNumber,
      })
      .from(projectManpower)
      .leftJoin(employees, eq(projectManpower.employeeId, employees.id))
      .where(eq(projectManpower.projectId, parseInt(projectId)))
      .orderBy(desc(projectManpower.createdAt));

    // Calculate total cost for each manpower entry
    const manpowerWithCost = manpower.map(item => {
      const daysWorked = item.actualDays || item.totalDays || 0;
      const dailyRate = Number(item.dailyRate) || 0;
      const totalCost = daysWorked * dailyRate;
      
      return {
        ...item,
        total_cost: totalCost,
        type: 'manpower' // Add type for frontend categorization
      };
    });

    // Return simple response without complex JOIN
    return NextResponse.json({ 
      success: true,
      data: manpowerWithCost 
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

    // Auto-assign supervisor to employee if they are assigned to a project with a supervisor
    if (employeeId) {
      try {
        // Get project supervisor
        const projectWithSupervisor = await db
          .select({ supervisorId: projects.supervisorId })
          .from(projects)
          .where(eq(projects.id, parseInt(projectId)))
          .limit(1);

        if (projectWithSupervisor.length > 0 && projectWithSupervisor[0].supervisorId) {
          // Update employee's supervisor to match project supervisor
          await db
            .update(employees)
            .set({ 
              supervisor: projectWithSupervisor[0].supervisorId.toString(),
              updatedAt: new Date().toISOString().split('T')[0]
            })
            .where(eq(employees.id, parseInt(employeeId)));

          console.log(`Auto-assigned supervisor ${projectWithSupervisor[0].supervisorId} to employee ${employeeId} for project ${projectId}`);
        }
      } catch (supervisorError) {
        console.error('Error auto-assigning supervisor to employee:', supervisorError);
        // Don't fail the main operation if supervisor assignment fails
      }
    }

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
