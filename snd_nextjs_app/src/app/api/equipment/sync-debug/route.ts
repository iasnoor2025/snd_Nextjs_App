import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export async function POST(request: NextRequest) {
  try {
    console.log('=== EQUIPMENT SYNC DEBUG START ===');
    
    // Step 1: Check environment variables
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
    const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
    const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

    console.log('Step 1: Environment variables check');
    console.log('ERPNEXT_URL:', ERPNEXT_URL);
    console.log('ERPNEXT_API_KEY exists:', !!ERPNEXT_API_KEY);
    console.log('ERPNEXT_API_SECRET exists:', !!ERPNEXT_API_SECRET);

    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json({
        success: false,
        message: 'ERPNext configuration is missing',
        step: 'environment_check'
      }, { status: 500 });
    }

    // Step 2: Test database connection
    console.log('Step 2: Testing database connection...');
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        step: 'database_connection'
      }, { status: 500 });
    }

    // Step 3: Check existing equipment
    console.log('Step 3: Checking existing equipment...');
    const existingEquipmentCount = await prisma.equipment.count();
    console.log(`Existing equipment count: ${existingEquipmentCount}`);

    // Step 4: Fetch equipment from ERPNext
    console.log('Step 4: Fetching equipment from ERPNext...');
    const filters = encodeURIComponent(JSON.stringify([["item_group", "=", "Equipment"]]));
    const endpoint = `/api/resource/Item?filters=${filters}&limit_page_length=10&fields=["name","item_code","item_name","description","item_group","stock_uom","disabled","standard_rate","last_purchase_rate","valuation_rate","stock_qty","model","serial_no","manufacturer"]`;
    
    console.log('ERPNext URL:', `${ERPNEXT_URL}${endpoint}`);
    
    const erpnextResponse = await fetch(`${ERPNEXT_URL}${endpoint}`, {
      headers: {
        'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('ERPNext Response Status:', erpnextResponse.status);
    console.log('ERPNext Response Headers:', Object.fromEntries(erpnextResponse.headers.entries()));

    if (!erpnextResponse.ok) {
      const errorText = await erpnextResponse.text();
      console.error('ERPNext API Error Response:', errorText);
      return NextResponse.json({
        success: false,
        message: `ERPNext API error: ${erpnextResponse.status} ${erpnextResponse.statusText}`,
        error: errorText,
        step: 'erpnext_fetch'
      }, { status: 500 });
    }

    const erpnextData = await erpnextResponse.json();
    console.log('ERPNext Response Data:', JSON.stringify(erpnextData, null, 2));
    console.log(`Found ${erpnextData.data?.length || 0} equipment items in ERPNext`);

    if (!erpnextData.data || erpnextData.data.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No equipment found in ERPNext',
        step: 'no_equipment_found',
        data: {
          existingCount: existingEquipmentCount,
          erpnextCount: 0
        }
      });
    }

    // Step 5: Process first equipment item as a test
    console.log('Step 5: Processing first equipment item as test...');
    const firstItem = erpnextData.data[0];
    console.log('First item:', JSON.stringify(firstItem, null, 2));

    try {
      // Check if equipment already exists
      const existingEquipment = await prisma.equipment.findFirst({
        where: {
          OR: [
            { erpnext_id: firstItem.item_code },
            { serial_number: firstItem.serial_no }
          ]
        }
      });

      console.log('Existing equipment found:', !!existingEquipment);

      const equipmentData = {
        name: firstItem.item_name || firstItem.item_code,
        description: firstItem.description || '',
        manufacturer: firstItem.manufacturer || '',
        model_number: firstItem.model || '',
        serial_number: firstItem.serial_no || '',
        erpnext_id: firstItem.item_code,
        daily_rate: firstItem.standard_rate ? parseFloat(firstItem.standard_rate) : null,
        status: 'available',
        is_active: true,
      };

      console.log('Equipment data to save:', JSON.stringify(equipmentData, null, 2));

      let result;
      if (existingEquipment) {
        console.log('Updating existing equipment...');
        result = await prisma.equipment.update({
          where: { id: existingEquipment.id },
          data: equipmentData,
        });
        console.log('Equipment updated successfully');
      } else {
        console.log('Creating new equipment...');
        result = await prisma.equipment.create({
          data: equipmentData,
        });
        console.log('Equipment created successfully');
      }

      console.log('Result:', JSON.stringify(result, null, 2));

      return NextResponse.json({
        success: true,
        message: 'Equipment sync debug completed successfully',
        step: 'test_sync_completed',
        data: {
          existingCount: existingEquipmentCount,
          erpnextCount: erpnextData.data.length,
          testItem: firstItem,
          result: result
        }
      });

    } catch (error) {
      console.error('Error processing test equipment:', error);
      return NextResponse.json({
        success: false,
        message: 'Error processing test equipment',
        error: error instanceof Error ? error.message : 'Unknown error',
        step: 'test_sync_failed',
        data: {
          testItem: firstItem
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in equipment sync debug:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to debug equipment sync',
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    console.log('=== EQUIPMENT SYNC DEBUG END ===');
  }
} 