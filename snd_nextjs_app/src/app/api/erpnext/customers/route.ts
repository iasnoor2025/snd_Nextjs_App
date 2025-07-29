import { NextRequest, NextResponse } from 'next/server';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

async function makeERPNextRequest(endpoint: string, options: RequestInit = {}) {
  if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
    throw new Error('ERPNext configuration is missing. Please check your environment variables.');
  }

  const url = `${ERPNEXT_URL}${endpoint}`;

  const defaultHeaders = {
    'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`ERPNext API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = searchParams.get('filters');

    let endpoint = '/api/resource/Customer?limit_page_length=1000';
    if (filters) {
      endpoint = `/api/resource/Customer?filters=${filters}&limit_page_length=1000`;
    }

    const data = await makeERPNextRequest(endpoint);
    const customers = [];

    if (data.data) {
      for (const item of data.data) {
        if (item.name) {
          const detailResponse = await makeERPNextRequest(`/api/resource/Customer/${encodeURIComponent(item.name)}`);
          if (detailResponse.data) {
            customers.push(detailResponse.data);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('Error fetching ERPNext customers:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch customers'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const customerData = await request.json();

    // Check if customer exists
    const name = customerData.customer_name || customerData.name;
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'customer_name is required for ERPNext customer creation'
        },
        { status: 400 }
      );
    }

    const filters = encodeURIComponent(JSON.stringify([["name", "=", name]]));
    const existingResponse = await makeERPNextRequest(`/api/resource/Customer?filters=${filters}`);

    let response;
    if (existingResponse.data && existingResponse.data.length > 0) {
      // Update existing customer
      const existingCustomer = existingResponse.data[0];
      response = await makeERPNextRequest(`/api/resource/Customer/${encodeURIComponent(existingCustomer.name)}`, {
        method: 'PUT',
        body: JSON.stringify(customerData),
      });
    } else {
      // Create new customer
      response = await makeERPNextRequest('/api/resource/Customer', {
        method: 'POST',
        body: JSON.stringify(customerData),
      });
    }

    return NextResponse.json({
      success: true,
      data: response.data || response,
      message: 'Customer created/updated successfully'
    });
  } catch (error) {
    console.error('Error creating/updating ERPNext customer:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create/update customer'
      },
      { status: 500 }
    );
  }
}
