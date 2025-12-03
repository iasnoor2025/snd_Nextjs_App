import { db } from '@/lib/drizzle';
import { timesheets, rentalTimesheetReceived } from '@/lib/drizzle/schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const getTimesheetStatusHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM

    if (!month) {
      return NextResponse.json(
        { error: 'Month parameter is required (format: YYYY-MM)' },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split('-').map(Number);
    if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    // Calculate date range for the month
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Check if any timesheets exist for this rental in this month
    const timesheetCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(timesheets)
      .where(
        and(
          eq(timesheets.rentalId, parseInt(id)),
          gte(timesheets.date, startDate.toISOString()),
          lte(timesheets.date, endDate.toISOString())
        )
      );

    const hasTimesheets = (timesheetCount[0]?.count || 0) > 0;

    // Check manual timesheet received status (per item)
    // For backward compatibility, also check month-level status
    const manualStatus = await db
      .select()
      .from(rentalTimesheetReceived)
      .where(
        and(
          eq(rentalTimesheetReceived.rentalId, parseInt(id)),
          eq(rentalTimesheetReceived.month, month)
        )
      );

    // Return all item statuses
    const itemStatuses: Record<string, boolean> = {};
    manualStatus.forEach((status) => {
      if (status.rentalItemId) {
        itemStatuses[status.rentalItemId.toString()] = status.received;
      }
    });
    
    // For backward compatibility, check if month-level status exists
    const monthLevelStatus = manualStatus.find(s => !s.rentalItemId);
    const manualReceived = monthLevelStatus?.received || false;

    return NextResponse.json({
      success: true,
      rentalId: parseInt(id),
      month,
      hasTimesheets,
      count: timesheetCount[0]?.count || 0,
      manualReceived, // For backward compatibility
      itemStatuses, // Per-item statuses
    });
  } catch (error) {
    console.error('Error checking timesheet status:', error);
    return NextResponse.json(
      { error: 'Failed to check timesheet status' },
      { status: 500 }
    );
  }
};

const updateTimesheetStatusHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      // This should not happen as withPermission handles auth, but keep for safety
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { month, itemId, received } = body; // month: YYYY-MM, itemId: optional, received: boolean

    console.log('Update timesheet status request:', { rentalId: id, month, itemId, received, body });

    if (!month) {
      return NextResponse.json(
        { error: 'Month parameter is required (format: YYYY-MM)' },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split('-').map(Number);
    if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    if (typeof received !== 'boolean') {
      return NextResponse.json(
        { error: 'Received must be a boolean' },
        { status: 400 }
      );
    }

    // Parse itemId - handle both string and number
    let rentalItemId: number | null = null;
    if (itemId !== undefined && itemId !== null && itemId !== '') {
      const parsed = typeof itemId === 'string' ? parseInt(itemId) : itemId;
      if (!isNaN(parsed) && parsed > 0) {
        rentalItemId = parsed;
      }
    }

    // Check if record exists
    const whereConditions = [
      eq(rentalTimesheetReceived.rentalId, parseInt(id)),
      eq(rentalTimesheetReceived.month, month),
    ];
    
    if (rentalItemId !== null) {
      whereConditions.push(eq(rentalTimesheetReceived.rentalItemId, rentalItemId));
    } else {
      whereConditions.push(sql`${rentalTimesheetReceived.rentalItemId} IS NULL`);
    }

    const existing = await db
      .select()
      .from(rentalTimesheetReceived)
      .where(and(...whereConditions))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(rentalTimesheetReceived)
        .set({
          received,
          receivedBy: received ? parseInt(session.user.id) : null,
          receivedAt: received ? new Date().toISOString() : null,
          updatedAt: new Date(),
        })
        .where(eq(rentalTimesheetReceived.id, existing[0].id));
    } else {
      // Create new record
      try {
        await db.insert(rentalTimesheetReceived).values({
          rentalId: parseInt(id),
          rentalItemId,
          month,
          received,
          receivedBy: received ? parseInt(session.user.id) : null,
          receivedAt: received ? new Date().toISOString() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (insertError: any) {
        console.error('Error inserting timesheet received record:', insertError);
        // If it's a unique constraint violation, try to update instead
        if (insertError?.code === '23505' || insertError?.message?.includes('unique')) {
          // Record might have been created between check and insert, try update
          const retryExisting = await db
            .select()
            .from(rentalTimesheetReceived)
            .where(and(...whereConditions))
            .limit(1);
          
          if (retryExisting.length > 0) {
            await db
              .update(rentalTimesheetReceived)
              .set({
                received,
                receivedBy: received ? parseInt(session.user.id) : null,
                receivedAt: received ? new Date().toISOString() : null,
                updatedAt: new Date(),
              })
              .where(eq(rentalTimesheetReceived.id, retryExisting[0].id));
          } else {
            throw insertError;
          }
        } else {
          throw insertError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      rentalId: parseInt(id),
      month,
      itemId: rentalItemId,
      received,
    });
  } catch (error) {
    console.error('Error updating timesheet received status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update timesheet received status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Export GET handler with permission check
export const GET = withPermission(PermissionConfigs.rental.read)(getTimesheetStatusHandler);

// Export PUT handler with permission check (update permission for rental)
export const PUT = withPermission(PermissionConfigs.rental.update)(updateTimesheetStatusHandler);

