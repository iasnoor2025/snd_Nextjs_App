import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectManpower, projects } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; manpowerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, manpowerId } = await params;

    // Validate IDs
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (!manpowerId || isNaN(parseInt(manpowerId))) {
      return NextResponse.json({ error: 'Invalid manpower ID' }, { status: 400 });
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

    // Verify manpower exists and belongs to the project
    const existingManpower = await db
      .select()
      .from(projectManpower)
      .where(
        and(
          eq(projectManpower.id, parseInt(manpowerId)),
          eq(projectManpower.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (existingManpower.length === 0) {
      return NextResponse.json({ error: 'Manpower resource not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      employeeId,
      jobTitle,
      dailyRate,
      startDate,
      endDate,
      totalDays,
      actualDays,
      status,
      notes,
    } = body;

    // Update manpower
    const [updatedManpower] = await db
      .update(projectManpower)
      .set({
        ...(employeeId !== undefined && { employeeId: employeeId ? parseInt(employeeId) : null }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(dailyRate !== undefined && { dailyRate: parseFloat(dailyRate) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : undefined }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : null }),
        ...(totalDays !== undefined && { totalDays: totalDays ? parseInt(totalDays) : null }),
        ...(actualDays !== undefined && { actualDays: actualDays ? parseInt(actualDays) : null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }), 
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(projectManpower.id, parseInt(manpowerId)))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedManpower,
      message: 'Manpower resource updated successfully'
    });
  } catch (error) {
    console.error('Error updating project manpower:', error);
    return NextResponse.json({ error: 'Failed to update project manpower' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; manpowerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, manpowerId } = await params;

    // Validate IDs
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (!manpowerId || isNaN(parseInt(manpowerId))) {
      return NextResponse.json({ error: 'Invalid manpower ID' }, { status: 400 });
    }

    // Verify manpower exists and belongs to the project
    const existingManpower = await db
      .select()
      .from(projectManpower)
      .where(
        and(
          eq(projectManpower.id, parseInt(manpowerId)),
          eq(projectManpower.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (existingManpower.length === 0) {
      return NextResponse.json({ error: 'Manpower resource not found' }, { status: 404 });
    }

    // Delete manpower
    await db
      .delete(projectManpower)
      .where(eq(projectManpower.id, parseInt(manpowerId)));

    return NextResponse.json({
      success: true,
      message: 'Manpower resource deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project manpower:', error);
    return NextResponse.json({ error: 'Failed to delete project manpower' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; manpowerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, manpowerId } = await params;

    // Validate IDs
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (!manpowerId || isNaN(parseInt(manpowerId))) {
      return NextResponse.json({ error: 'Invalid manpower ID' }, { status: 400 });
    }

    // Get manpower
    const manpower = await db
      .select()
      .from(projectManpower)
      .where(
        and(
          eq(projectManpower.id, parseInt(manpowerId)),
          eq(projectManpower.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (manpower.length === 0) {
      return NextResponse.json({ error: 'Manpower resource not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: manpower[0]
    });
  } catch (error) {
    console.error('Error fetching project manpower:', error);
    return NextResponse.json({ error: 'Failed to fetch project manpower' }, { status: 500 });
  }
}
