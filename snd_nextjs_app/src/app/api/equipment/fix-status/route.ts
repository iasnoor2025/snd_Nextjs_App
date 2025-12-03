import { db } from '@/lib/drizzle';
import { rentalItems, equipmentRentalHistory, rentals, equipment } from '@/lib/drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { EquipmentStatusService } from '@/lib/services/equipment-status-service';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

async function handleFixStatus(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Step 1: Backfill completedDate for rental items that are completed but missing completedDate
    const completedItemsWithoutDate = await db
      .select({
        id: rentalItems.id,
        rentalId: rentalItems.rentalId,
        equipmentId: rentalItems.equipmentId,
      })
      .from(rentalItems)
      .where(
        and(
          eq(rentalItems.status, 'completed'),
          isNull(rentalItems.completedDate)
        )
      );
    let backfilledCount = 0;
    for (const item of completedItemsWithoutDate) {
      // Try to get completion date from rental's actualEndDate
      const rental = await db
        .select({ actualEndDate: rentals.actualEndDate })
        .from(rentals)
        .where(eq(rentals.id, item.rentalId))
        .limit(1);

      // Try to get completion date from equipment assignment endDate
      const assignment = await db
        .select({ endDate: equipmentRentalHistory.endDate })
        .from(equipmentRentalHistory)
        .where(
          and(
            eq(equipmentRentalHistory.rentalId, item.rentalId),
            eq(equipmentRentalHistory.equipmentId, item.equipmentId),
            eq(equipmentRentalHistory.status, 'completed')
          )
        )
        .limit(1);

      // Use rental's actualEndDate, assignment's endDate, or current date
      const completedDate = 
        rental[0]?.actualEndDate || 
        assignment[0]?.endDate?.split('T')[0] || 
        new Date().toISOString().split('T')[0];

      await db
        .update(rentalItems)
        .set({
          completedDate: completedDate,
          updatedAt: completedDate,
        })
        .where(eq(rentalItems.id, item.id));

      backfilledCount++;
    }
    // Step 2: Update equipment statuses for all equipment
    const allEquipment = await db
      .select({ id: equipment.id })
      .from(equipment);

    let updatedCount = 0;
    for (const equip of allEquipment) {
      const result = await EquipmentStatusService.updateEquipmentStatusImmediately(equip.id);
      if (result.success && result.previousStatus !== result.newStatus) {
        updatedCount++;
      }
    }
    return NextResponse.json({
      success: true,
      message: 'Equipment status fix completed',
      backfilled: backfilledCount,
      updated: updatedCount,
      total: allEquipment.length,
    });
  } catch (error) {
    console.error('Error fixing equipment status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix equipment status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = withPermission(PermissionConfigs.equipment.update)(handleFixStatus);
export const GET = withPermission(PermissionConfigs.equipment.read)(handleFixStatus);
