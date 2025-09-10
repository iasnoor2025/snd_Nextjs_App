import { db } from '@/lib/drizzle';
import { timesheets as timesheetsTable } from '@/lib/drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      employeeFileNumber, 
      date, 
      overtimeHours, 
      hoursWorked 
    } = body;

    console.log('Google Sheets Update API called with:', { 
      employeeFileNumber, 
      date, 
      overtimeHours, 
      hoursWorked 
    });

    // Validate required fields
    if (!employeeFileNumber || !date) {
      return NextResponse.json({ 
        error: 'Employee file number and date are required' 
      }, { status: 400 });
    }

    // Find the timesheet record to update
    const existingTimesheet = await db
      .select({
        id: timesheetsTable.id,
        employeeId: timesheetsTable.employeeId,
        date: timesheetsTable.date,
        hoursWorked: timesheetsTable.hoursWorked,
        overtimeHours: timesheetsTable.overtimeHours,
      })
      .from(timesheetsTable)
      .where(
        and(
          sql`EXTRACT(YEAR FROM ${timesheetsTable.date}) = ${new Date(date).getFullYear()}`,
          sql`EXTRACT(MONTH FROM ${timesheetsTable.date}) = ${new Date(date).getMonth() + 1}`,
          sql`EXTRACT(DAY FROM ${timesheetsTable.date}) = ${new Date(date).getDate()}`
        )
      )
      .limit(1);

    if (existingTimesheet.length === 0) {
      return NextResponse.json({ 
        error: 'Timesheet record not found for the specified date' 
      }, { status: 404 });
    }

    const timesheetId = existingTimesheet[0].id;

    // Update the timesheet record
    const updateData: any = {};
    
    if (overtimeHours !== undefined) {
      updateData.overtimeHours = parseFloat(overtimeHours.toString());
    }
    
    if (hoursWorked !== undefined) {
      updateData.hoursWorked = parseFloat(hoursWorked.toString());
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update' 
      }, { status: 400 });
    }

    // Add updated timestamp
    updateData.updatedAt = new Date();

    const updatedTimesheet = await db
      .update(timesheetsTable)
      .set(updateData)
      .where(eq(timesheetsTable.id, timesheetId))
      .returning({
        id: timesheetsTable.id,
        date: timesheetsTable.date,
        hoursWorked: timesheetsTable.hoursWorked,
        overtimeHours: timesheetsTable.overtimeHours,
        updatedAt: timesheetsTable.updatedAt,
      });

    console.log('Timesheet updated successfully:', updatedTimesheet[0]);

    return NextResponse.json({
      success: true,
      message: 'Timesheet updated successfully',
      data: updatedTimesheet[0]
    });

  } catch (error: any) {
    console.error('Error updating timesheet:', error);
    return NextResponse.json({ 
      error: error.message, 
      code: 'UPDATE_ERROR' 
    }, { status: 500 });
  }
}
