import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await DatabaseService.getCustomerById(params.id)
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const customer = await DatabaseService.updateCustomer(params.id, body)
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await DatabaseService.deleteCustomer(params.id)
    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
