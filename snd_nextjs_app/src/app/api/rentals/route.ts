import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { PaymentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const paymentStatus = searchParams.get('paymentStatus')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const filters: any = {}
    if (search) filters.search = search
    if (status && status !== 'all') filters.status = status
    if (customerId) filters.customerId = customerId
    if (paymentStatus && paymentStatus !== 'all') filters.paymentStatus = paymentStatus
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate

    const rentals = await DatabaseService.getRentals(filters)
    return NextResponse.json(rentals)
  } catch (error) {
    console.error('Error fetching rentals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rentals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate rental number if not provided
    if (!body.rentalNumber) {
      const timestamp = Date.now()
      body.rentalNumber = `RENT-${timestamp}`
    }

    // Validate required fields
    if (!body.customerId) {
      return NextResponse.json(
        { error: 'Customer is required' },
        { status: 400 }
      )
    }

    if (!body.startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      )
    }

    // Set default values
    const rentalData = {
      customerId: body.customerId,
      rentalNumber: body.rentalNumber,
      startDate: new Date(body.startDate),
      expectedEndDate: body.expectedEndDate ? new Date(body.expectedEndDate) : undefined,
      actualEndDate: body.actualEndDate ? new Date(body.actualEndDate) : undefined,
      status: body.status || 'pending',
      paymentStatus: (body.paymentStatus || 'pending') as PaymentStatus,
      subtotal: parseFloat(body.subtotal) || 0,
      taxAmount: parseFloat(body.taxAmount) || 0,
      totalAmount: parseFloat(body.totalAmount) || 0,
      discount: parseFloat(body.discount) || 0,
      tax: parseFloat(body.tax) || 0,
      finalAmount: parseFloat(body.finalAmount) || 0,
      depositAmount: parseFloat(body.depositAmount) || 0,
      paymentTermsDays: parseInt(body.paymentTermsDays) || 30,
      hasTimesheet: body.hasTimesheet || false,
      hasOperators: body.hasOperators || false,
      notes: body.notes || '',
      rentalItems: body.rentalItems || [],
    }

    const rental = await DatabaseService.createRental(rentalData)
    return NextResponse.json(rental, { status: 201 })
  } catch (error) {
    console.error('Error creating rental:', error)
    return NextResponse.json(
      { error: 'Failed to create rental' },
      { status: 500 }
    )
  }
}
