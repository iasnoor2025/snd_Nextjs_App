import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
    const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
    const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: 'ERPNext configuration is missing. Please check your environment variables.',
          details: {
            hasUrl: !!ERPNEXT_URL,
            hasKey: !!ERPNEXT_API_KEY,
            hasSecret: !!ERPNEXT_API_SECRET
          }
        },
        { status: 500 }
      );
    }

    // Test ERPNext connection with a simple API call
    const response = await fetch(`${ERPNEXT_URL}/api/resource/Employee?limit_page_length=1`, {
      headers: {
        'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          message: `ERPNext API error: ${response.status} ${response.statusText}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText
          }
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'ERPNext connection successful',
      data: {
        url: ERPNEXT_URL,
        employeeCount: data.data ? data.data.length : 0,
        hasData: !!data.data
      }
    });
  } catch (error) {
    console.error('ERPNext connection test failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'ERPNext connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
