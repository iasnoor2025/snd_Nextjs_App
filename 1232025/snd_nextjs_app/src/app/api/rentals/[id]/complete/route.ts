import { db } from '@/lib/db';
import { rentals, rentalItems, equipmentRentalHistory, employeeAssignments } from '@/lib/drizzle/schema';
import { RentalService } from '@/lib/services/rental-service';
import { EquipmentStatusService } from '@/lib/services/equipment-status-service';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rental = await RentalService.getRental(parseInt(id));

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (rental.status !== 'active') {
      return NextResponse.json(
        { error: 'Rental must be active before completion' },
        { status: 400 }
      );
    }

    // Compute completion date once
    const completionDate = new Date().toISOString().split('T')[0];

    // Update rental with completion information
    const updatedRentalResult = await db
      .update(rentals)
      .set({
        actualEndDate: completionDate,
        status: 'completed',
        completedAt: completionDate,
      })
      .where(eq(rentals.id, parseInt(id)))
      .returning();

    const updatedRental = updatedRentalResult[0];

    // Also mark all rental items for this rental as completed
    await db
      .update(rentalItems)
      .set({
        status: 'completed',
        completedDate: completionDate,
        updatedAt: completionDate,
      })
      .where(and(eq(rentalItems.rentalId, parseInt(id)), eq(rentalItems.status, 'active')));

    // Update equipment rental history assignments for this rental
    await db
      .update(equipmentRentalHistory)
      .set({
        status: 'completed',
        endDate: completionDate,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(equipmentRentalHistory.rentalId, parseInt(id)),
          eq(equipmentRentalHistory.status, 'active')
        )
      );

    // Update employee assignments for this rental
    await db
      .update(employeeAssignments)
      .set({
        status: 'completed',
        endDate: completionDate,
        updatedAt: completionDate,
      })
      .where(
        and(
          eq(employeeAssignments.rentalId, parseInt(id)),
          eq(employeeAssignments.status, 'active')
        )
      );

    // Update equipment status for all equipment in this rental
    const completedItems = await db
      .select({ equipmentId: rentalItems.equipmentId })
      .from(rentalItems)
      .where(eq(rentalItems.rentalId, parseInt(id)));

    // Update status for each equipment
    for (const item of completedItems) {
      if (item.equipmentId) {
        await EquipmentStatusService.updateEquipmentStatusImmediately(item.equipmentId);
      }
    }

    return NextResponse.json({
      message: 'Rental completed successfully',
      rental: updatedRental,
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to complete rental' }, { status: 500 });
  }
}
