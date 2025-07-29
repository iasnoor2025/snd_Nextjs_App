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
      credit_limit: body.credit_limit ? parseFloat(body.credit_limit) : null,
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
