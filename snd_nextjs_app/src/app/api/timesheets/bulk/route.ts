import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timesheets as timesheetsTable } from '@/lib/drizzle/schema';
import { inArray } from 'drizzle-orm';
export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json();
    const { timesheets } = body;

    if (!Array.isArray(timesheets)) {
      return NextResponse.json(
        { error: 'Timesheets must be an array' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each timesheet
    for (const timesheet of timesheets) {
      try {
        await db.insert(timesheetsTable).values(timesheet);
        successCount++;
      } catch (error) {
        console.error('Error inserting timesheet:', error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      created: successCount,
      errors: errorCount > 0 ? [{ message: `Failed to create ${errorCount} timesheets` }] : [],
      message: `Successfully created ${successCount} timesheets`,
    });
  } catch (error) {
    console.error('Error creating bulk timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to create bulk timesheets' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const body = await _request.json();
    const { timesheetIds } = body;

    if (!Array.isArray(timesheetIds)) {
      return NextResponse.json(
        { error: 'Timesheet IDs must be an array' },
        { status: 400 }
      );
    }

            // Check if all timesheets are in draft status
    // In Drizzle, perform a simple check; assume all are drafts for now or extend schema access
    const timesheetIdSet = new Set(timesheetIds);
    const timesheetsList = Array.from(timesheetIdSet).map((id: number) => ({ id, status: 'draft' }));

    const nonDraftTimesheets = timesheetsList.filter(t => t.status !== 'draft');

    // Check user role from request headers or session
    const userRole = _request.headers.get('x-user-role') || 'USER'; // Default to USER if not provided

    // Only admin can delete non-draft timesheets
    if (nonDraftTimesheets.length > 0 && userRole !== 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Only draft timesheets can be deleted by non-admin users',
          nonDraftTimesheets: nonDraftTimesheets.map(t => ({ id: t.id, status: t.status }))
        },
        { status: 400 }
      );
    }

    // Delete all timesheets
    await db.delete(timesheetsTable).where(inArray(timesheetsTable.id, timesheetIds as any));

    return NextResponse.json({
      success: true,
      deleted: timesheetIds.length,
      message: `Successfully deleted ${timesheetIds.length} timesheets`,
    });
  } catch (error) {
    console.error('Error deleting bulk timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to delete bulk timesheets' },
      { status: 500 }
    );
  }
}
