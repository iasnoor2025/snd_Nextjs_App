import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    const customers = await DatabaseService.getCustomers()
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const customer = await DatabaseService.createCustomer(body)
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
