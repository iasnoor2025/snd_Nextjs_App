import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIMPLE FILTER TEST START ===');
    
    // Check environment variables
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
    const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
    const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

    console.log('Environment check:');
    console.log('ERPNEXT_URL:', ERPNEXT_URL);
    console.log('ERPNEXT_API_KEY exists:', !!ERPNEXT_API_KEY);
    console.log('ERPNEXT_API_SECRET exists:', !!ERPNEXT_API_SECRET);

    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json({
        success: false,
        message: 'ERPNext configuration is missing',
      }, { status: 500 });
    }

    // Test ERPNext API call with specific fields
    console.log('Testing ERPNext API call with specific fields...');
    const url = `${ERPNEXT_URL}/api/resource/Item?limit_page_length=50&fields=["name","item_code","item_name","description","item_group","stock_uom","disabled","standard_rate","last_purchase_rate","valuation_rate","stock_qty","model","serial_no","manufacturer"]`;
    
    console.log('Calling ERPNext URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

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
    console.log('Response data keys:', Object.keys(data));
    console.log('Data length:', data.data?.length || 0);

    // Analyze all items
    const allItems = data.data || [];
    const itemGroups = [...new Set(allItems.map((item: any) => item.item_group).filter(Boolean))];
    const equipmentItems = allItems.filter((item: any) => 
      item.item_group === 'Equipment'
    );

    console.log('All items count:', allItems.length);
    console.log('Available item groups:', itemGroups);
    console.log('Equipment items count:', equipmentItems.length);
    console.log('Sample equipment item:', equipmentItems[0]);

    return NextResponse.json({
      success: true,
      message: 'Simple filter test successful',
      data: {
        status: response.status,
        allItemCount: allItems.length,
        itemGroups: itemGroups,
        equipmentItemCount: equipmentItems.length,
        equipmentItems: equipmentItems.slice(0, 3), // Show first 3 items
        sampleItems: allItems.slice(0, 5).map((item: any) => ({
          name: item.name,
          item_group: item.item_group,
          item_code: item.item_code,
          item_name: item.item_name
        })),
        responseKeys: Object.keys(data)
      }
    });

  } catch (error) {
    console.error('Error in simple filter test:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test simple filter',
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        }
      },
      { status: 500 }
    );
  } finally {
    console.log('=== SIMPLE FILTER TEST END ===');
  }
} 