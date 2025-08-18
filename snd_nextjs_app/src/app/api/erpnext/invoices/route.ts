import { NextRequest, NextResponse } from 'next/server';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET;

async function makeERPNextRequest(endpoint: string, options: RequestInit = {}) {
  if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
    throw new Error('ERPNext configuration is missing. Please check your environment variables.');
  }

  const url = `${ERPNEXT_URL}${endpoint}`;

  const defaultHeaders = {
    Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
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

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);
    const filters = searchParams.get('filters');

    let endpoint = '/api/resource/Sales Invoice?limit_page_length=1000';
    if (filters) {
      endpoint = `/api/resource/Sales Invoice?filters=${filters}&limit_page_length=1000`;
    }

    const data = await makeERPNextRequest(endpoint);

    return NextResponse.json({
      success: true,
      data: data.data || [],
      count: data.data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching ERPNext invoices:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch invoices',
      },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const invoiceData = await _request.json();

    const response = await makeERPNextRequest('/api/resource/Sales Invoice', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });

    return NextResponse.json({
      success: true,
      data: response.data || response,
      message: 'Invoice created successfully',
    });
  } catch (error) {
    console.error('Error creating ERPNext invoice:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create invoice',
      },
      { status: 500 }
    );
  }
}
