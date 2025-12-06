import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/drizzle';
import { rentalEquipmentTimesheets, rentalItems, rentalTimesheetReceived } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

interface EquipmentTimesheetImportData {
  rentalItemId: number;
  month: string; // YYYY-MM
  dailyHours: Array<{
    date: string; // YYYY-MM-DD
    regularHours: number | string; // Can be number or "F" for Friday/off
    overtimeHours: number;
  }>;
}

const importEquipmentTimesheetHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const rentalId = parseInt(id);
    const body = await request.json();
    const { rentalItemId, month, dailyHours } = body as EquipmentTimesheetImportData;

    if (!rentalItemId || !month || !dailyHours || !Array.isArray(dailyHours)) {
      return NextResponse.json(
        { error: 'rentalItemId, month, and dailyHours array are required' },
        { status: 400 }
      );
    }

    // Validate month format
    const [year, monthNum] = month.split('-').map(Number);
    if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    // Calculate expected month date range
    const expectedMonthStart = new Date(year, monthNum - 1, 1);
    const expectedMonthEnd = new Date(year, monthNum, 0);

    // Verify rental item belongs to this rental
    const rentalItem = await db
      .select()
      .from(rentalItems)
      .where(
        and(
          eq(rentalItems.id, rentalItemId),
          eq(rentalItems.rentalId, rentalId)
        )
      )
      .limit(1);

    if (rentalItem.length === 0) {
      return NextResponse.json(
        { error: 'Rental item not found or does not belong to this rental' },
        { status: 404 }
      );
    }

    const item = rentalItem[0];

    // Process each day's hours
    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const dayData of dailyHours) {
      try {
        const date = new Date(dayData.date);
        
        // Validate that the date belongs to the specified month
        const dateYear = date.getFullYear();
        const dateMonth = date.getMonth() + 1; // getMonth() returns 0-11
        
        if (dateYear !== year || dateMonth !== monthNum) {
          results.errors.push(`Date ${dayData.date} does not belong to month ${month}. Skipping.`);
          continue; // Skip this date
        }
        
        // Handle "F" for Friday/off days - set hours to 0
        let regularHours = 0;
        if (dayData.regularHours === 'F' || dayData.regularHours === 'Fri' || dayData.regularHours === '' || dayData.regularHours === null || dayData.regularHours === undefined) {
          regularHours = 0;
        } else {
          regularHours = parseFloat(dayData.regularHours.toString()) || 0;
        }
        
        const overtimeHours = parseFloat(dayData.overtimeHours.toString()) || 0;

        // Check if equipment timesheet already exists for this date and rental item
        const existing = await db
          .select()
          .from(rentalEquipmentTimesheets)
          .where(
            and(
              eq(rentalEquipmentTimesheets.rentalItemId, rentalItemId),
              eq(rentalEquipmentTimesheets.date, date.toISOString().split('T')[0])
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update existing equipment timesheet
          await db
            .update(rentalEquipmentTimesheets)
            .set({
              regularHours: regularHours.toString(),
              overtimeHours: overtimeHours.toString(),
              updatedAt: new Date(),
            })
            .where(eq(rentalEquipmentTimesheets.id, existing[0].id));
          results.updated++;
        } else {
          // Create new equipment timesheet
          await db.insert(rentalEquipmentTimesheets).values({
            rentalItemId: rentalItemId,
            rentalId: rentalId,
            equipmentId: item.equipmentId,
            date: date.toISOString().split('T')[0],
            regularHours: regularHours.toString(),
            overtimeHours: overtimeHours.toString(),
            createdBy: parseInt(session.user.id),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push(`Error processing ${dayData.date}: ${error.message}`);
      }
    }

    // Mark timesheet as received for this rental item and month
    const existingReceived = await db
      .select()
      .from(rentalTimesheetReceived)
      .where(
        and(
          eq(rentalTimesheetReceived.rentalId, rentalId),
          eq(rentalTimesheetReceived.rentalItemId, rentalItemId),
          eq(rentalTimesheetReceived.month, month)
        )
      )
      .limit(1);

    if (existingReceived.length > 0) {
      await db
        .update(rentalTimesheetReceived)
        .set({
          received: true,
          receivedBy: parseInt(session.user.id),
          receivedAt: new Date().toISOString(),
          updatedAt: new Date(),
        })
        .where(eq(rentalTimesheetReceived.id, existingReceived[0].id));
    } else {
      await db.insert(rentalTimesheetReceived).values({
        rentalId: rentalId,
        rentalItemId: rentalItemId,
        month: month,
        received: true,
        receivedBy: parseInt(session.user.id),
        receivedAt: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Recalculate rental item total and rental totals for all rate types
    // This will use calculateItemTotalWithActualHours which handles all rate conversions
    try {
      const { RentalService } = await import('@/lib/services/rental-service');
      
      // Recalculate rental totals - this will update all items including this one
      await RentalService.recalculateRentalTotals(rentalId);
    } catch (error) {
      console.error('Error recalculating rental totals after timesheet import:', error);
      // Don't fail the import if recalculation fails
    }

    return NextResponse.json({
      success: true,
      rentalId,
      rentalItemId,
      month,
      results,
    });
  } catch (error: any) {
    console.error('Error importing equipment timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to import equipment timesheet', details: error.message },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs.rental.update)(importEquipmentTimesheetHandler);

