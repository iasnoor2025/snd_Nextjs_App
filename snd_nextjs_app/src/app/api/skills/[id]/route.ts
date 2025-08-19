import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { skills } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// PUT /api/skills/[id] - Update a skill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: skillId } = await params;
    const body = await request.json();
    const { name, description, category, requiredLevel, certificationRequired } = body;

    if (!name) {
      return NextResponse.json({ error: 'Skill name is required' }, { status: 400 });
    }

    const [updatedSkill] = await db
      .update(skills)
      .set({
        name,
        description,
        category,
        requiredLevel,
        certificationRequired: certificationRequired || false,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, parseInt(skillId)))
      .returning();

    if (!updatedSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedSkill,
      message: 'Skill updated successfully'
    });
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

// DELETE /api/skills/[id] - Delete a skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: skillId } = await params;

    const [deletedSkill] = await db
      .delete(skills)
      .where(eq(skills.id, parseInt(skillId)))
      .returning();

    if (!deletedSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Skill deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}
