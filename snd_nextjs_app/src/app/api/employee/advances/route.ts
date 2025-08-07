import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth-config'

export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      console.log('GET /api/employee/advances - Not authenticated')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      console.log('GET /api/employee/advances - Employee ID is required')
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    console.log(`GET /api/employee/advances - Fetching advances for employee ${employeeId}`)

    // Check if user has permission to view this employee's advances
    if (session.user.role === 'EMPLOYEE') {
      // For employees, they can only view their own advances
      const employee = await prisma.employee.findFirst({
        where: { iqama_number: session.user.national_id },
        select: { id: true }
      })
      
      if (!employee || employee.id !== parseInt(employeeId)) {
        console.log(`GET /api/employee/advances - Access denied for employee ${employeeId}`)
        return NextResponse.json(
          { error: 'Access denied. You can only view your own advances.' },
          { status: 403 }
        )
      }
    }

    // Fetch advances for the specified employee
    const advances = await prisma.advancePayment.findMany({
      where: {
        employee_id: parseInt(employeeId),
        deleted_at: null
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_id: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    console.log(`GET /api/employee/advances - Found ${advances.length} advances for employee ${employeeId}`)

    const responseData = {
      success: true,
      advances: advances.map(advance => ({
        id: advance.id,
        amount: Number(advance.amount),
        reason: advance.reason || advance.purpose,
        status: advance.status,
        created_at: advance.created_at,
        monthly_deduction: advance.monthly_deduction ? Number(advance.monthly_deduction) : null,
        repaid_amount: Number(advance.repaid_amount),
        remaining_balance: Number(advance.amount) - Number(advance.repaid_amount),
        type: 'advance'
      }))
    }

    console.log('GET /api/employee/advances - Returning response:', responseData)
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching advances:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

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
    const { employee_id, amount, reason } = body

    // Validate required fields
    if (!employee_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    const amountValue = parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Create advance request
    const advance = await prisma.advancePayment.create({
      data: {
        employee_id,
        amount: amountValue,
        purpose: reason || '',
        status: 'pending'
      }
    })

    return NextResponse.json({
      message: 'Advance request submitted successfully',
      advance
    })

  } catch (error) {
    console.error('Error creating advance request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 