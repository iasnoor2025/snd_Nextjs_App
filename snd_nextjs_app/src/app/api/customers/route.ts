import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware'

export const GET = withPermission(
  async (request: NextRequest) => {
    try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') ?? undefined
    const status = searchParams.get('status') ?? undefined
    const sortBy = searchParams.get('sortBy') ?? undefined
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') ?? undefined

    const params: any = { page, limit };
    if (search) params.search = search;
    if (status) params.status = status;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const result = await DatabaseService.getCustomers(params)

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
  },
  PermissionConfigs.customer.read
);

export const POST = withPermission(
  async (request: NextRequest) => {
    try {
    const body = await request.json()
    
    // Map the request body to match the database schema
    const customerData: any = {
      name: body.name,
      is_active: body.isActive !== undefined ? body.isActive : true,
    };
    
    if (body.contactPerson || body.contact_person) customerData.contact_person = body.contactPerson || body.contact_person;
    if (body.email) customerData.email = body.email;
    if (body.phone) customerData.phone = body.phone;
    if (body.address) customerData.address = body.address;
    if (body.city) customerData.city = body.city;
    if (body.state) customerData.state = body.state;
    if (body.postal_code) customerData.postal_code = body.postal_code;
    if (body.country) customerData.country = body.country;
    if (body.website) customerData.website = body.website;
    if (body.tax_number) customerData.tax_number = body.tax_number;
    if (body.credit_limit) customerData.credit_limit = parseFloat(body.credit_limit);
    if (body.payment_terms) customerData.payment_terms = body.payment_terms;
    if (body.notes) customerData.notes = body.notes;
    if (body.companyName || body.company_name) customerData.company_name = body.companyName || body.company_name;
    if (body.erpnext_id) customerData.erpnext_id = body.erpnext_id;
    
    const customer = await DatabaseService.createCustomer(customerData)
        return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
  },
  PermissionConfigs.customer.create
);
