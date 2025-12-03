import { db } from '@/lib/db';
import { equipmentRentalHistory, rentalItems, equipment } from '@/lib/drizzle/schema';
import { RentalService } from '@/lib/services/rental-service';
import { and, eq } from 'drizzle-orm';
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

    // Get all equipment assignments for this rental
    const equipmentAssignments = await db
      .select({
        id: equipmentRentalHistory.id,
        equipmentId: equipmentRentalHistory.equipmentId,
        dailyRate: equipmentRentalHistory.dailyRate,
        totalAmount: equipmentRentalHistory.totalAmount,
        startDate: equipmentRentalHistory.startDate,
        endDate: equipmentRentalHistory.endDate,
        status: equipmentRentalHistory.status,
        notes: equipmentRentalHistory.notes,
        equipmentName: equipment.name,
        equipmentDoorNumber: equipment.doorNumber,
      })
      .from(equipmentRentalHistory)
      .leftJoin(equipment, eq(equipmentRentalHistory.equipmentId, equipment.id))
      .where(
        and(
          eq(equipmentRentalHistory.rentalId, rentalId),
          eq(equipmentRentalHistory.status, 'active')
        )
      );

    const syncedItems = [];

    // Convert each equipment assignment to a rental item
    for (const assignment of equipmentAssignments) {
      // Check if rental item already exists for this equipment
      const existingRentalItems = await db
        .select()
        .from(rentalItems)
        .where(
          and(
            eq(rentalItems.rentalId, rentalId),
            eq(rentalItems.equipmentId, assignment.equipmentId)
          )
        );

      if (existingRentalItems.length === 0) {
        // Create rental item from equipment assignment
        const equipmentName = assignment.equipmentName || 
          (assignment.equipmentDoorNumber ? `${assignment.equipmentDoorNumber}-EQUIPMENT` : `Equipment ${assignment.equipmentId}`);

        const rentalItem = await RentalService.addRentalItem({
          rentalId: rentalId,
          equipmentId: assignment.equipmentId,
          equipmentName: equipmentName,
          unitPrice: parseFloat(assignment.dailyRate?.toString() || '0'),
          totalPrice: parseFloat(assignment.totalAmount?.toString() || '0'),
          rateType: 'daily',
          status: 'active',
          notes: assignment.notes || `Synced from equipment assignment`,
        });

        syncedItems.push(rentalItem);
      } else {
        // Update existing rental item with current assignment data
        const existingItem = existingRentalItems[0];
        const equipmentName = assignment.equipmentName || 
          (assignment.equipmentDoorNumber ? `${assignment.equipmentDoorNumber}-EQUIPMENT` : `Equipment ${assignment.equipmentId}`);

        await RentalService.updateRentalItem(existingItem.id, {
          equipmentName: equipmentName,
          unitPrice: parseFloat(assignment.dailyRate?.toString() || '0'),
          totalPrice: parseFloat(assignment.totalAmount?.toString() || '0'),
          rateType: 'daily',
          status: 'active',
          notes: assignment.notes || `Updated from equipment assignment`,
        });

        syncedItems.push({ ...existingItem, updated: true });
      }
    }

    // Recalculate rental totals
    await RentalService.recalculateRentalTotals(rentalId);

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedItems.length} equipment assignments to rental items`,
      syncedItems: syncedItems.length,
      totalAssignments: equipmentAssignments.length,
    });

  } catch (error) {
    console.error('Error syncing equipment assignments:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync equipment assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
