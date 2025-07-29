import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const sortBy = searchParams.get('sortBy') || undefined
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || undefined

    const result = await DatabaseService.getCustomers({
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder
    })

    // Get customer statistics for the summary cards
    const statistics = await DatabaseService.getCustomerStatistics()

    return NextResponse.json({
      ...result,
      statistics
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Map the request body to match the database schema
    const customerData = {
      name: body.name,
      contact_person: body.contactPerson || body.contact_person,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      state: body.state,
      postal_code: body.postal_code,
      country: body.country,
      website: body.website,
      tax_number: body.tax_number,
      credit_limit: body.credit_limit ? parseFloat(body.credit_limit) : undefined,
      payment_terms: body.payment_terms,
      notes: body.notes,
      is_active: body.isActive !== undefined ? body.isActive : true,
      company_name: body.companyName || body.company_name,
      erpnext_id: body.erpnext_id,
    }
    
    const customer = await DatabaseService.createCustomer(customerData)
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
