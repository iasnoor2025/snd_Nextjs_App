import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

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
    const action = searchParams.get('action');

    if (action === 'sync') {
      return await syncEquipmentFromERPNext();
    }

    // Default: fetch equipment from ERPNext - simplified for testing
    const endpoint = `/api/resource/Item?limit_page_length=10`;

    console.log('Making ERPNext request to:', endpoint);
    const data = await makeERPNextRequest(endpoint);
    console.log('ERPNext response received, data length:', data.data?.length || 0);

    return NextResponse.json({
      success: true,
      data: data.data || [],
      count: data.data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching ERPNext equipment:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch equipment'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'sync') {
      return await syncEquipmentFromERPNext();
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid action specified'
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing ERPNext equipment request:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process request'
      },
      { status: 500 }
    );
  }
}

async function syncEquipmentFromERPNext() {
  try {
    console.log('Starting ERPNext equipment sync...');

    // Fetch equipment from ERPNext
    const filters = encodeURIComponent(JSON.stringify([["item_group", "=", "Equipment"]]));
    const endpoint = `/api/resource/Item?filters=${filters}&limit_page_length=1000&fields=["name","item_code","item_name","description","item_group","stock_uom","disabled","standard_rate","last_purchase_rate","valuation_rate","stock_qty","model","serial_no","manufacturer"]`;

    const erpData = await makeERPNextRequest(endpoint);
    const equipmentItems = erpData.data || [];

    console.log(`Found ${equipmentItems.length} equipment items in ERPNext`);

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Process each equipment item
    for (const item of equipmentItems) {
      try {
        // Skip disabled items
        if (item.disabled) {
          continue;
        }

        const equipmentData = {
          name: item.item_name || item.item_code,
          description: item.description || '',
          manufacturer: item.manufacturer || '',
          model_number: item.model || '',
          serial_number: item.serial_no || '',
          erpnext_id: item.item_code,
          daily_rate: item.standard_rate ? parseFloat(item.standard_rate) : null,
          status: 'available',
          is_active: true,
        };

        // Check if equipment already exists
        const existingEquipment = await prisma.equipment.findFirst({
          where: {
            OR: [
              { erpnext_id: item.item_code },
              { serial_number: item.serial_no }
            ]
          }
        });

        if (existingEquipment) {
          // Update existing equipment
          await prisma.equipment.update({
            where: { id: existingEquipment.id },
            data: equipmentData
          });
          updatedCount++;
        } else {
          // Create new equipment
          await prisma.equipment.create({
            data: equipmentData
          });
          createdCount++;
        }
      } catch (error) {
        console.error(`Error processing equipment item ${item.item_code}:`, error);
        errorCount++;
      }
    }

    console.log(`ERPNext equipment sync completed: ${createdCount} created, ${updatedCount} updated, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Equipment sync completed successfully`,
      data: {
        total_processed: equipmentItems.length,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('Error syncing equipment from ERPNext:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync equipment from ERPNext'
      },
      { status: 500 }
    );
  }
} 