import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== EQUIPMENT SYNC NO DB TEST START ===');
    
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

    // Test ERPNext API call for equipment
    console.log('Testing ERPNext API call for equipment...');
    const filters = encodeURIComponent(JSON.stringify([["item_group", "=", "Equipment"]]));
    const endpoint = `/api/resource/Item?filters=${filters}&limit_page_length=10&fields=["name","item_code","item_name","description","item_group","stock_uom","disabled","standard_rate","last_purchase_rate","valuation_rate","stock_qty","model","serial_no","manufacturer"]`;
    
    console.log('Calling ERPNext URL:', `${ERPNEXT_URL}${endpoint}`);
    
    const response = await fetch(`${ERPNEXT_URL}${endpoint}`, {
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

    // Process equipment data (without database operations)
    const equipmentItems = data.data || [];
    const processedItems = equipmentItems.map((item: any) => ({
      name: item.item_name || item.item_code,
      description: item.description || '',
      manufacturer: item.manufacturer || '',
      model_number: item.model || '',
      serial_number: item.serial_no || '',
      erpnext_id: item.item_code,
      daily_rate: item.standard_rate ? parseFloat(item.standard_rate) : null,
      status: 'available',
      is_active: true,
    }));

    console.log('Processed items:', processedItems.length);
    console.log('Sample processed item:', processedItems[0]);

    return NextResponse.json({
      success: true,
      message: 'Equipment sync test successful (no database operations)',
      data: {
        status: response.status,
        itemCount: equipmentItems.length,
        processedCount: processedItems.length,
        items: processedItems.slice(0, 3), // Show first 3 items
        responseKeys: Object.keys(data)
      }
    });

  } catch (error) {
    console.error('Error in equipment sync no-db test:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test equipment sync',
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        }
      },
      { status: 500 }
    );
  } finally {
    console.log('=== EQUIPMENT SYNC NO DB TEST END ===');
  }
} 