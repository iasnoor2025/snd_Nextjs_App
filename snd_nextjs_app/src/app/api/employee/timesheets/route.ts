import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth-config'

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
    const { employee_id, date, hours_worked, overtime_hours, start_time, end_time, description } = body

    // Validate required fields
    if (!employee_id || !date || !hours_worked) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check if timesheet already exists for this date
    const existingTimesheet = await prisma.timesheet.findFirst({
      where: {
        employee_id,
        date: new Date(date)
      }
    })

    if (existingTimesheet) {
      return NextResponse.json(
        { error: 'Timesheet already exists for this date' },
        { status: 400 }
      )
    }

    // Create timesheet
    const timesheet = await prisma.timesheet.create({
      data: {
        employee_id: parseInt(employee_id),
        date: new Date(date),
        hours_worked: regularHours,
        overtime_hours: overtimeHours,
        start_time: start_time ? new Date(start_time) : new Date(date),
        end_time: end_time ? new Date(end_time) : null,
        description: description || '',
        status: 'pending',
        created_by: parseInt(session.user.id)
      }
    })

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
