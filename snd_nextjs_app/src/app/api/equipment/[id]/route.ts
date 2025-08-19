import { db } from '@/lib/db';
import { equipment } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid equipment ID' }, { status: 400 });
    }

    const [equipmentData] = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        status: equipment.status,
      })
      .from(equipment)
      .where(eq(equipment.id, id))
      .limit(1);

    if (!equipmentData) {
      return NextResponse.json({ success: false, error: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: equipmentData,
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
