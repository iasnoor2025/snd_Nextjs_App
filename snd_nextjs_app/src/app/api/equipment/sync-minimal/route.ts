import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== MINIMAL EQUIPMENT SYNC TEST ===');
    
    // Check environment variables
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
    const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
    const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json({
        success: false,
        message: 'ERPNext configuration is missing',
      }, { status: 500 });
    }

    // Test with minimal fields first
    console.log('Testing with minimal fields...');
    const response = await fetch(`${ERPNEXT_URL}/api/resource/Item?limit_page_length=5&fields=["name","item_code","item_name","item_group"]`, {
      headers: {
        'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return NextResponse.json({
        success: false,
        message: `ERPNext API error: ${response.status} ${response.statusText}`,
        error: errorText
      }, { status: 500 });
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    // Filter equipment items
    const allItems = data.data || [];
    const equipmentItems = allItems.filter((item: any) => 
      item.item_group === 'Equipment'
    );

    return NextResponse.json({
      success: true,
      message: 'Minimal equipment sync test successful',
      data: {
        status: response.status,
        allItemCount: allItems.length,
        equipmentItemCount: equipmentItems.length,
        equipmentItems: equipmentItems,
        sampleItems: allItems.slice(0, 3)
      }
    });

  } catch (error) {
    console.error('Error in minimal equipment sync test:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test minimal equipment sync',
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        }
      },
      { status: 500 }
    );
  }
} 