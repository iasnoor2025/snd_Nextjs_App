import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
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

    const { employeeId } = await params
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    if (!month) {
      return NextResponse.json(
        { error: 'Month parameter is required' },
        { status: 400 }
      )
    }

    // Parse month parameter (format: YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number)
    if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      )
    }

    // Calculate date range for the month
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0)

    // Fetch timesheets for the employee in the specified month
    const timesheets = await prisma.timesheet.findMany({
      where: {
        employee_id: parseInt(employeeId),
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      },
      select: {
        id: true,
        date: true,
        hours_worked: true,
        overtime_hours: true,
        status: true,
        start_time: true,
        end_time: true,
        description: true
      }
    })

    // Calculate summary statistics
    const totalRegularHours = timesheets.reduce((sum, t) => sum + Number(t.hours_worked), 0)
    const totalOvertimeHours = timesheets.reduce((sum, t) => sum + Number(t.overtime_hours), 0)
    const approvedCount = timesheets.filter(t => t.status === 'approved').length
    const pendingCount = timesheets.filter(t => t.status === 'pending').length
    const rejectedCount = timesheets.filter(t => t.status === 'rejected').length

    return NextResponse.json({
      timesheets: timesheets.map(t => ({
        ...t,
        date: t.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        hours_worked: Number(t.hours_worked).toString(),
        overtime_hours: Number(t.overtime_hours).toString()
      })),
      summary: {
        totalRegularHours,
        totalOvertimeHours,
        totalHours: totalRegularHours + totalOvertimeHours,
        approvedCount,
        pendingCount,
        rejectedCount,
        totalEntries: timesheets.length
      },
      month: {
        year,
        month: monthNum,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    })

  } catch (error) {
    console.error('Error fetching employee timesheets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timesheet data' },
      { status: 500 }
    )
  }
}
