import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
    const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
    const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

    console.log('Testing ERPNext API directly...');
    console.log('Config:', {
      url: ERPNEXT_URL,
      hasKey: !!ERPNEXT_API_KEY,
      hasSecret: !!ERPNEXT_API_SECRET
    });

    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json({
        success: false,
        message: 'Missing ERPNext configuration',
        config: { hasUrl: !!ERPNEXT_URL, hasKey: !!ERPNEXT_API_KEY, hasSecret: !!ERPNEXT_API_SECRET }
      });
    }

    // Test different ERPNext endpoints
    const endpoints = [
      '/api/resource/Employee?limit_page_length=1',
      '/api/resource/Employee?limit_page_length=10',
      '/api/resource/Employee',
      '/api/method/frappe.client.get_list?doctype=Employee&limit_page_length=10'
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        const response = await fetch(`${ERPNEXT_URL}${endpoint}`, {
          headers: {
            'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        const data = await response.json();
        results.push({
          endpoint,
          status: response.status,
          ok: response.ok,
          dataKeys: Object.keys(data),
          dataLength: data.data?.length || 0,
          hasData: !!data.data,
          sample: data.data?.[0] || null
        });

        console.log(`Endpoint ${endpoint} result:`, {
          status: response.status,
          dataKeys: Object.keys(data),
          dataLength: data.data?.length || 0
        });

      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`Error testing ${endpoint}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'ERPNext API test completed',
      results,
      config: {
        url: ERPNEXT_URL,
        hasKey: !!ERPNEXT_API_KEY,
        hasSecret: !!ERPNEXT_API_SECRET
      }
    });

  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Test failed',
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 