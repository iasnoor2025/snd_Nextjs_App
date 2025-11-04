import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectSubcontractors } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subcontractorId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, subcontractorId } = await params;

    // Validate IDs
    if (!projectId || !subcontractorId || isNaN(parseInt(projectId)) || isNaN(parseInt(subcontractorId))) {
      return NextResponse.json({ error: 'Invalid project ID or subcontractor ID' }, { status: 400 });
    }

    // Delete subcontractor
    await db
      .delete(projectSubcontractors)
      .where(
        and(
          eq(projectSubcontractors.id, parseInt(subcontractorId)),
          eq(projectSubcontractors.projectId, parseInt(projectId))
        )
      );

    return NextResponse.json({ 
      success: true,
      message: 'Subcontractor deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting subcontractor:', error);
    return NextResponse.json({ error: 'Failed to delete subcontractor' }, { status: 500 });
  }
}
