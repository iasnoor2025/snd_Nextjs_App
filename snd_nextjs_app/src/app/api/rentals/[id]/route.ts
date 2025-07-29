import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rental = await DatabaseService.getRental(id)

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rental)
  } catch (error) {
    console.error('Error fetching rental:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rental' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()

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

    // Set update data
    const updateData = {
      customerId: body.customerId,
      rentalNumber: body.rentalNumber,
      startDate: new Date(body.startDate),
      expectedEndDate: body.expectedEndDate ? new Date(body.expectedEndDate) : null,
      actualEndDate: body.actualEndDate ? new Date(body.actualEndDate) : null,
      status: body.status || 'pending',
      paymentStatus: body.paymentStatus || 'pending',
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

    const rental = await DatabaseService.updateRental(id, updateData)

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rental)
  } catch (error) {
    console.error('Error updating rental:', error)
    return NextResponse.json(
      { error: 'Failed to update rental' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await DatabaseService.deleteRental(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Rental deleted successfully' })
  } catch (error) {
    console.error('Error deleting rental:', error)
    return NextResponse.json(
      { error: 'Failed to delete rental' },
      { status: 500 }
    )
  }
}
