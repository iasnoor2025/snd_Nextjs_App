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

    let endpoint = '/api/resource/Item?limit_page_length=1000';
    if (filters) {
      endpoint = `/api/resource/Item?filters=${filters}&limit_page_length=1000`;
    }

    const data = await makeERPNextRequest(endpoint);

    return NextResponse.json({
      success: true,
      data: data.data || [],
      count: data.data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching ERPNext items:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch items'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const itemData = await request.json();

    // Check if item exists
    const itemCode = itemData.item_code;
    if (!itemCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'item_code is required for ERPNext item creation'
        },
        { status: 400 }
      );
    }

    const filters = encodeURIComponent(JSON.stringify([["item_code", "=", itemCode]]));
    const existingResponse = await makeERPNextRequest(`/api/resource/Item?filters=${filters}`);

    let response;
    if (existingResponse.data && existingResponse.data.length > 0) {
      // Update existing item
      const existingItem = existingResponse.data[0];
      response = await makeERPNextRequest(`/api/resource/Item/${encodeURIComponent(existingItem.name)}`, {
        method: 'PUT',
        body: JSON.stringify(itemData),
      });
    } else {
      // Create new item
      response = await makeERPNextRequest('/api/resource/Item', {
        method: 'POST',
        body: JSON.stringify(itemData),
      });
    }

    return NextResponse.json({
      success: true,
      data: response.data || response,
      message: 'Item created/updated successfully'
    });
  } catch (error) {
    console.error('Error creating/updating ERPNext item:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create/update item'
      },
      { status: 500 }
    );
  }
}
