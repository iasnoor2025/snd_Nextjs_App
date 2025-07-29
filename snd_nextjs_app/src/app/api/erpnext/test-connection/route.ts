import { NextRequest, NextResponse } from 'next/server';

const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

export async function GET(request: NextRequest) {
  try {
    console.log('Testing ERPNext connection...');
    console.log('Configuration:', {
      hasUrl: !!ERPNEXT_URL,
      hasKey: !!ERPNEXT_API_KEY,
      hasSecret: !!ERPNEXT_API_SECRET,
      url: ERPNEXT_URL,
      keyLength: ERPNEXT_API_KEY?.length || 0,
      secretLength: ERPNEXT_API_SECRET?.length || 0
    });

    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json({
        success: false,
        message: 'ERPNext configuration is missing',
        config: {
          hasUrl: !!ERPNEXT_URL,
          hasKey: !!ERPNEXT_API_KEY,
          hasSecret: !!ERPNEXT_API_SECRET
        }
      }, { status: 500 });
    }

    // Test basic connection
    console.log('Testing basic connection...');
    const response = await fetch(`${ERPNEXT_URL}/api/resource/Employee?limit_page_length=1`, {
      headers: {
        'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return NextResponse.json({
        success: false,
        message: `ERPNext API error: ${response.status} ${response.statusText}`,
        error: errorText,
        config: {
          url: ERPNEXT_URL,
          keyLength: ERPNEXT_API_KEY?.length || 0,
          secretLength: ERPNEXT_API_SECRET?.length || 0
        }
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    // Test with larger limit to see if we can get more data
    console.log('Testing with larger limit...');
    const largeResponse = await fetch(`${ERPNEXT_URL}/api/resource/Employee?limit_page_length=1000`, {
      headers: {
        'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (largeResponse.ok) {
      const largeData = await largeResponse.json();
      console.log('Large response data count:', largeData.data?.length || 0);
      
      return NextResponse.json({
        success: true,
        message: 'ERPNext connection successful',
        data: {
          employeeCount: largeData.data?.length || 0,
          hasData: !!largeData.data,
          sampleEmployee: largeData.data?.[0] || null
        },
        config: {
          url: ERPNEXT_URL,
          keyLength: ERPNEXT_API_KEY?.length || 0,
          secretLength: ERPNEXT_API_SECRET?.length || 0
        }
      });
    } else {
      const errorText = await largeResponse.text();
      return NextResponse.json({
        success: false,
        message: `ERPNext API error with large limit: ${largeResponse.status} ${largeResponse.statusText}`,
        error: errorText
      }, { status: largeResponse.status });
    }

  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed',
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      },
      config: {
        url: ERPNEXT_URL,
        keyLength: ERPNEXT_API_KEY?.length || 0,
        secretLength: ERPNEXT_API_SECRET?.length || 0
      }
    }, { status: 500 });
  }
}
