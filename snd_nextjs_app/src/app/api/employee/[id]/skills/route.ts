import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeSkill, skills, employees } from '@/lib/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/employee/[id]/skills - Get employee skills
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;

    const employeeSkills = await db
      .select({
        id: employeeSkill.id,
        proficiencyLevel: employeeSkill.proficiencyLevel,
        certified: employeeSkill.certified,
        certificationDate: employeeSkill.certificationDate,
        createdAt: employeeSkill.createdAt,
        updatedAt: employeeSkill.updatedAt,
        skill: {
          id: skills.id,
          name: skills.name,
          description: skills.description,
          category: skills.category,
          requiredLevel: skills.requiredLevel,
          certificationRequired: skills.certificationRequired,
        }
      })
      .from(employeeSkill)
      .innerJoin(skills, eq(employeeSkill.skillId, skills.id))
      .where(eq(employeeSkill.employeeId, parseInt(employeeId)))
      .orderBy(desc(employeeSkill.createdAt));

    return NextResponse.json({
      success: true,
      data: employeeSkills
    });
  } catch (error) {
    console.error('Error fetching employee skills:', error);
    return NextResponse.json({ error: 'Failed to fetch employee skills' }, { status: 500 });
  }
}

// POST /api/employee/[id]/skills - Add skill to employee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;
    const body = await request.json();
    const { skillId, proficiencyLevel, certified, certificationDate } = body;

    if (!skillId) {
      return NextResponse.json({ error: 'Skill ID is required' }, { status: 400 });
    }

    // Check if employee exists
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, parseInt(employeeId)))
      .limit(1);

    if (employee.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if skill already exists for this employee
    const existingSkill = await db
      .select()
      .from(employeeSkill)
      .where(and(
        eq(employeeSkill.employeeId, parseInt(employeeId)),
        eq(employeeSkill.skillId, parseInt(skillId))
      ))
      .limit(1);

    if (existingSkill.length > 0) {
      return NextResponse.json({ error: 'Employee already has this skill' }, { status: 400 });
    }

    const [newEmployeeSkill] = await db
      .insert(employeeSkill)
      .values({
        employeeId: parseInt(employeeId),
        skillId: parseInt(skillId),
        proficiencyLevel,
        certified: certified || false,
        certificationDate: certificationDate ? new Date(certificationDate) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newEmployeeSkill,
      message: 'Skill added to employee successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding skill to employee:', error);
    return NextResponse.json({ error: 'Failed to add skill to employee' }, { status: 500 });
  }
}
