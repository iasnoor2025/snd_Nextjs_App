import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const created = [];
    const errors = [];

    for (const timesheetData of timesheets) {
      try {
        const timesheet = await prisma.timesheet.create({
          data: {
            employeeId: timesheetData.employeeId,
            date: new Date(timesheetData.date),
            hoursWorked: parseFloat(timesheetData.hoursWorked || '0'),
            overtimeHours: parseFloat(timesheetData.overtimeHours || '0'),
            startTime: timesheetData.startTime || '08:00',
            endTime: timesheetData.endTime,
            status: 'draft',
            projectId: timesheetData.projectId || null,
            rentalId: timesheetData.rentalId || null,
            assignmentId: timesheetData.assignmentId || null,
            description: timesheetData.description,
            tasksCompleted: timesheetData.tasksCompleted,
          },
        });

        created.push(timesheet);
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
    const timesheets = await prisma.timesheet.findMany({
      where: {
        id: { in: timesheetIds }
      },
      select: {
        id: true,
        status: true
      }
    });

    const nonDraftTimesheets = timesheets.filter(t => t.status !== 'draft');

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
    const result = await prisma.timesheet.deleteMany({
      where: {
        id: { in: timesheetIds }
      }
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} timesheets`,
    });
  } catch (error) {
    console.error('Error deleting bulk timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to delete bulk timesheets' },
      { status: 500 }
    );
  }
}
