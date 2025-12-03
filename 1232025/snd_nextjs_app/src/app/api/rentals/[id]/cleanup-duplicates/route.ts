import { db } from '@/lib/db';
import { rentalItems } from '@/lib/drizzle/schema';
import { RentalService } from '@/lib/services/rental-service';
import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rentalId = parseInt(id);

    // Check if rental exists
    const rental = await RentalService.getRental(rentalId);
    if (!rental) {
      return NextResponse.json({ error: `Rental with ID ${rentalId} not found` }, { status: 404 });
    }

    // Find duplicate rental items (same equipment ID)
    const duplicates = await db
      .select({
        equipmentId: rentalItems.equipmentId,
        count: sql<number>`count(*)`.as('count'),
        ids: sql<string>`array_agg(${rentalItems.id})`.as('ids'),
      })
      .from(rentalItems)
      .where(eq(rentalItems.rentalId, rentalId))
      .groupBy(rentalItems.equipmentId)
      .having(sql`count(*) > 1`);

    let removedCount = 0;

    // Remove duplicates, keeping only the first one
    for (const duplicate of duplicates) {
      const ids = duplicate.ids.split(',').map(id => parseInt(id.trim()));
      const idsToRemove = ids.slice(1); // Keep first, remove rest

      for (const idToRemove of idsToRemove) {
        await db.delete(rentalItems).where(eq(rentalItems.id, idToRemove));
        removedCount++;
      }
    }

    // Recalculate rental totals
    await RentalService.recalculateRentalTotals(rentalId);

    return NextResponse.json({
      success: true,
      message: `Removed ${removedCount} duplicate rental items`,
      removedDuplicates: removedCount,
      duplicateGroups: duplicates.length,
    });

  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    return NextResponse.json(
      {
        error: 'Failed to clean up duplicates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
