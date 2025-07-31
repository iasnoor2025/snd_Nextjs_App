import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test environment variables
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
    const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
    const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json({
        success: false,
        message: 'ERPNext configuration is missing',
        env: {
          hasUrl: !!ERPNEXT_URL,
          hasKey: !!ERPNEXT_API_KEY,
          hasSecret: !!ERPNEXT_API_SECRET
        }
      }, { status: 500 });
    }

    // Test basic ERPNext request
    const url = `${ERPNEXT_URL}/api/resource/Item?limit_page_length=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `ERPNext API error: ${response.status} ${response.statusText}`,
        status: response.status
      }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'ERPNext connection test successful',
      data: {
        itemCount: data.data?.length || 0,
        sampleItem: data.data?.[0] || null
      }
    });

  } catch (error) {
    console.error('Error testing ERPNext equipment:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test ERPNext equipment'
      },
      { status: 500 }
    );
  }
} 