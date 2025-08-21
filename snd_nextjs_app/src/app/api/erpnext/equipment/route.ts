import { db } from '@/lib/drizzle';
import { equipment } from '@/lib/drizzle/schema';
import { eq, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// ERPNext configuration - check both NEXT_PUBLIC_ and non-NEXT_PUBLIC_ versions
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || process.env.ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY || process.env.ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET || process.env.ERPNEXT_API_SECRET;

async function makeERPNextRequest(endpoint: string, options: RequestInit = {}) {
  // Enhanced logging for production debugging

  if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
    const missingVars: string[] = [];
    if (!ERPNEXT_URL) missingVars.push('ERPNEXT_URL (or NEXT_PUBLIC_ERPNEXT_URL)');
    if (!ERPNEXT_API_KEY) missingVars.push('ERPNEXT_API_KEY (or NEXT_PUBLIC_ERPNEXT_API_KEY)');
    if (!ERPNEXT_API_SECRET) missingVars.push('ERPNEXT_API_SECRET (or NEXT_PUBLIC_ERPNEXT_API_SECRET)');

    throw new Error(`ERPNext configuration is missing: ${missingVars.join(', ')}. Please check your environment variables.`);
  }

  const url = `${ERPNEXT_URL}${endpoint}`;

  const defaultHeaders = {
    Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    throw new Error(`ERPNext API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);
    const action = searchParams.get('action');

    if (action === 'sync') {
      return await syncEquipmentFromERPNext();
    }

    // Default: fetch equipment from ERPNext - simplified for testing
    const endpoint = `/api/resource/Item?limit_page_length=10`;

    const data = await makeERPNextRequest(endpoint);

    return NextResponse.json({
      success: true,
      data: data.data || [],
      count: data.data?.length || 0,
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch equipment',
      },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json();
    const { action } = body;

    if (action === 'sync') {
      return await syncEquipmentFromERPNext();
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid action specified',
      },
      { status: 400 }
    );
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process request',
      },
      { status: 500 }
    );
  }
}

async function syncEquipmentFromERPNext() {
  try {

    // Fetch equipment from ERPNext
    const filters = encodeURIComponent(JSON.stringify([['item_group', '=', 'Equipment']]));
    const endpoint = `/api/resource/Item?filters=${filters}&limit_page_length=1000&fields=["name","item_code","item_name","description","item_group","stock_uom","disabled","standard_rate","last_purchase_rate","valuation_rate","stock_qty","model","serial_no","manufacturer"]`;

    const erpData = await makeERPNextRequest(endpoint);
    const equipmentItems = erpData.data || [];

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
          modelNumber: item.model || '',
          serialNumber: item.serial_no || '',
          erpnextId: item.item_code,
          dailyRate: item.standard_rate ? item.standard_rate.toString() : null,
          status: 'available',
          isActive: true,
          createdAt: new Date().toISOString().split('T')[0] || null as string,
          updatedAt: new Date().toISOString().split('T')[0] || null as string,
        };

        // Check if equipment already exists using Drizzle
        const existingEquipmentRows = await db
          .select({
            id: equipment.id,
          })
          .from(equipment)
          .where(
            or(eq(equipment.erpnextId, item.item_code), eq(equipment.serialNumber, item.serial_no))
          )
          .limit(1);

        if (existingEquipmentRows.length > 0) {
          // Update existing equipment using Drizzle
          await db
            .update(equipment)
            .set({
              name: equipmentData.name,
              description: equipmentData.description,
              manufacturer: equipmentData.manufacturer,
              modelNumber: equipmentData.modelNumber,
              serialNumber: equipmentData.serialNumber,
              erpnextId: equipmentData.erpnextId,
              dailyRate: equipmentData.dailyRate,
              status: equipmentData.status,
              isActive: equipmentData.isActive,
              updatedAt: new Date().toISOString().split('T')[0] || null,
            })
            .where(eq(equipment.id, existingEquipmentRows[0]!.id));
          updatedCount++;
        } else {
          // Create new equipment using Drizzle
          await db.insert(equipment).values(equipmentData);
          createdCount++;
        }
      } catch (error) {
        
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Equipment sync completed successfully`,
      data: {
        total_processed: equipmentItems.length,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync equipment from ERPNext',
      },
      { status: 500 }
    );
  }
}
