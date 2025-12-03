import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectMaterials } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, materialId } = await params;

    // Validate IDs
    if (!projectId || !materialId || isNaN(parseInt(projectId)) || isNaN(parseInt(materialId))) {
      return NextResponse.json({ error: 'Invalid project ID or material ID' }, { status: 400 });
    }

    // Delete material
    await db
      .delete(projectMaterials)
      .where(
        and(
          eq(projectMaterials.id, parseInt(materialId)),
          eq(projectMaterials.projectId, parseInt(projectId))
        )
      );

    return NextResponse.json({ 
      success: true,
      message: 'Material deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
  }
}
