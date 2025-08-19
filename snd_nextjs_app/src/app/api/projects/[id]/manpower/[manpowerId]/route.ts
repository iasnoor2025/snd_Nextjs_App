import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectManpower } from '@/lib/drizzle/schema';
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
    if (!projectId || !manpowerId || isNaN(parseInt(projectId)) || isNaN(parseInt(manpowerId))) {
      return NextResponse.json({ error: 'Invalid project ID or manpower ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      employeeId,
      jobTitle,
      dailyRate,
      startDate,
      endDate,
      totalDays,
      notes,
      status,
    } = body;

    // Validation
    if (!jobTitle || !startDate || !dailyRate) {
      return NextResponse.json({ error: 'Job title, start date, and daily rate are required' }, { status: 400 });
    }

    // Update manpower assignment
    const [updatedManpower] = await db
      .update(projectManpower)
      .set({
        employeeId: employeeId ? parseInt(employeeId) : null,
        jobTitle,
        dailyRate: parseFloat(dailyRate),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        totalDays: totalDays ? parseInt(totalDays) : null,
        status: status || 'active',
        notes,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectManpower.id, parseInt(manpowerId)),
          eq(projectManpower.projectId, parseInt(projectId))
        )
      )
      .returning();

    return NextResponse.json({ 
      success: true,
      data: updatedManpower,
      message: 'Manpower assignment updated successfully' 
    });
  } catch (error) {
    console.error('Error updating manpower assignment:', error);
    return NextResponse.json({ error: 'Failed to update manpower assignment' }, { status: 500 });
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
    if (!projectId || !manpowerId || isNaN(parseInt(projectId)) || isNaN(parseInt(manpowerId))) {
      return NextResponse.json({ error: 'Invalid project ID or manpower ID' }, { status: 400 });
    }

    // Delete manpower assignment
    await db
      .delete(projectManpower)
      .where(
        and(
          eq(projectManpower.id, parseInt(manpowerId)),
          eq(projectManpower.projectId, parseInt(projectId))
        )
      );

    return NextResponse.json({ 
      success: true,
      message: 'Manpower assignment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting manpower assignment:', error);
    return NextResponse.json({ error: 'Failed to delete manpower assignment' }, { status: 500 });
  }
}
