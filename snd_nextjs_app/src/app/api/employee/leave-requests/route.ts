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
    const { employee_id, leave_type, start_date, end_date, reason } = body

    // Validate required fields
    if (!employee_id || !leave_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate number of days
    const start = new Date(start_date)
    const end = new Date(end_date)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Create leave request
    const leaveRequest = await prisma.employeeLeave.create({
      data: {
        employee_id: parseInt(employee_id),
        leave_type,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        reason: reason || '',
        days,
        status: 'pending'
      }
    })

    return NextResponse.json({
      message: 'Leave request submitted successfully',
      leaveRequest
    })

  } catch (error) {
    console.error('Error creating leave request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
