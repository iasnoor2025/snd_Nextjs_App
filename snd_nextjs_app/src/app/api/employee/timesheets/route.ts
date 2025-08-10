import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth-config'
import { timesheets } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user has EMPLOYEE role
    if (session.user.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Access denied. Employee role required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    // Support both field names for compatibility
    const employee_id = body.employee_id || body.employeeId
    const { date, hours_worked, overtime_hours, start_time, end_time, description } = body

    // Validate required fields
    if (!employee_id || !date || !hours_worked) {
      return NextResponse.json(
        { error: 'Missing required fields: employee_id/employeeId, date, and hours_worked are required' },
        { status: 400 }
      )
    }

    // Validate hours
    const regularHours = parseFloat(hours_worked)
    const overtimeHours = parseFloat(overtime_hours || '0')
    
    if (isNaN(regularHours) || regularHours < 0) {
      return NextResponse.json(
        { error: 'Invalid regular hours' },
        { status: 400 }
      )
    }

    if (isNaN(overtimeHours) || overtimeHours < 0) {
      return NextResponse.json(
        { error: 'Invalid overtime hours' },
        { status: 400 }
      )
    }

    // Check if timesheet already exists for this date using Drizzle
    const existingTimesheetRows = await db
      .select({ id: timesheets.id })
      .from(timesheets)
      .where(
        and(
          eq(timesheets.employeeId, parseInt(employee_id)),
          eq(timesheets.date, new Date(date).toISOString())
        )
      )
      .limit(1);

    if (existingTimesheetRows.length > 0) {
      return NextResponse.json(
        { error: 'Timesheet already exists for this date' },
        { status: 400 }
      )
    }

    // Create timesheet using Drizzle
    const timesheetRows = await db
      .insert(timesheets)
      .values({
        employeeId: parseInt(employee_id),
        date: new Date(date).toISOString(),
        hoursWorked: regularHours.toString(),
        overtimeHours: overtimeHours.toString(),
        startTime: start_time ? new Date(start_time).toISOString() : new Date(date).toISOString(),
        endTime: end_time ? new Date(end_time).toISOString() : null,
        description: description || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const timesheet = timesheetRows[0];

    return NextResponse.json({
      message: 'Timesheet submitted successfully',
      timesheet
    })

  } catch (error) {
    console.error('Error creating timesheet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
