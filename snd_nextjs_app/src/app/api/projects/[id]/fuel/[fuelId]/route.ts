import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectFuel } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fuelId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, fuelId } = await params;

    // Validate IDs
    if (!projectId || !fuelId || isNaN(parseInt(projectId)) || isNaN(parseInt(fuelId))) {
      return NextResponse.json({ error: 'Invalid project ID or fuel ID' }, { status: 400 });
    }

    // Delete fuel record
    await db
      .delete(projectFuel)
      .where(
        and(
          eq(projectFuel.id, parseInt(fuelId)),
          eq(projectFuel.projectId, parseInt(projectId))
        )
      );

    return NextResponse.json({ 
      success: true,
      message: 'Fuel record deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting fuel record:', error);
    return NextResponse.json({ error: 'Failed to delete fuel record' }, { status: 500 });
  }
}
