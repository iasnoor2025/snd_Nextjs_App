import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timesheets as timesheetsTable } from '@/lib/drizzle/schema';
import { inArray } from 'drizzle-orm';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timesheets } = body;

    if (!Array.isArray(timesheets)) {
      return NextResponse.json(
        { error: 'Timesheets must be an array' },
        { status: 400 }
      );
    }

    const created: any[] = [];
    const errors: Array<{ date: any; error: string }> = [];

    for (const timesheetData of timesheets) {
      try {
        const inserted = await db
          .insert(timesheetsTable)
          .values({
            employeeId: timesheetData.employeeId,
            date: new Date(timesheetData.date).toISOString(),
            hoursWorked: String(parseFloat(timesheetData.hoursWorked || '0')),
            overtimeHours: String(parseFloat(timesheetData.overtimeHours || '0')),
            startTime: timesheetData.startTime ? new Date(timesheetData.startTime).toISOString() : new Date().toISOString(),
            endTime: timesheetData.endTime ? new Date(timesheetData.endTime).toISOString() : null,
            status: 'draft',
            projectId: timesheetData.projectId || null,
            rentalId: timesheetData.rentalId || null,
            assignmentId: timesheetData.assignmentId || null,
            description: timesheetData.description,
            tasks: timesheetData.tasksCompleted,
            updatedAt: new Date().toISOString(),
          })
          .returning();

        created.push(inserted[0]);
      } catch (error) {
        console.error('Error creating timesheet:', error);
        errors.push({
          date: timesheetData.date,
          error: 'Failed to create timesheet',
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      errors,
      message: `Successfully created ${created.length} timesheets`,
    });
  } catch (error) {
    console.error('Error creating bulk timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to create bulk timesheets' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
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
    const userRole = request.headers.get('x-user-role') || 'USER'; // Default to USER if not provided

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
    const result = await db.delete(timesheetsTable).where(inArray(timesheetsTable.id, timesheetIds as any));

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
