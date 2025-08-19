import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeSkill } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

// PUT /api/employee/[id]/skills/[skillId] - Update employee skill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId, skillId } = await params;
    const body = await request.json();
    const { proficiencyLevel, certified, certificationDate } = body;

    const [updatedEmployeeSkill] = await db
      .update(employeeSkill)
      .set({
        proficiencyLevel,
        certified: certified || false,
        certificationDate: certificationDate ? new Date(certificationDate) : null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(employeeSkill.employeeId, parseInt(employeeId)),
        eq(employeeSkill.skillId, parseInt(skillId))
      ))
      .returning();

    if (!updatedEmployeeSkill) {
      return NextResponse.json({ error: 'Employee skill not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedEmployeeSkill,
      message: 'Employee skill updated successfully'
    });
  } catch (error) {
    console.error('Error updating employee skill:', error);
    return NextResponse.json({ error: 'Failed to update employee skill' }, { status: 500 });
  }
}

// DELETE /api/employee/[id]/skills/[skillId] - Remove skill from employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId, skillId } = await params;

    const [deletedEmployeeSkill] = await db
      .delete(employeeSkill)
      .where(and(
        eq(employeeSkill.employeeId, parseInt(employeeId)),
        eq(employeeSkill.skillId, parseInt(skillId))
      ))
      .returning();

    if (!deletedEmployeeSkill) {
      return NextResponse.json({ error: 'Employee skill not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Skill removed from employee successfully'
    });
  } catch (error) {
    console.error('Error removing employee skill:', error);
    return NextResponse.json({ error: 'Failed to remove employee skill' }, { status: 500 });
  }
}
