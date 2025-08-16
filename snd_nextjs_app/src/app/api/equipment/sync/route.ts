import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { equipment } from '@/lib/drizzle/schema';
import { eq, or, count } from 'drizzle-orm';

export async function POST() {
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
        },
        { status: 500 }
      );
    }

    // Test database connection
    try {
      // Test with a simple query
      await db.select({ count: count() }).from(equipment).limit(1);
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }

    // Check if database has existing equipment
    const existingEquipmentResult = await db.select({ count: count() }).from(equipment);
    const existingEquipmentCount = existingEquipmentResult[0]?.count || 0;
    console.log(`Database has ${existingEquipmentCount} existing equipment`);

    // Fetch all items from ERPNext (using only working fields)
    console.log('Fetching items from ERPNext...');
    const erpnextResponse = await fetch(`${ERPNEXT_URL}/api/resource/Item?limit_page_length=1000&fields=["name","item_code","item_name","description","item_group","stock_uom","disabled","standard_rate","last_purchase_rate","valuation_rate"]`, {
      headers: {
        'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!erpnextResponse.ok) {
      const errorText = await erpnextResponse.text();
      console.error('ERPNext API Error Response:', errorText);
      throw new Error(`ERPNext API error: ${erpnextResponse.status} ${erpnextResponse.statusText} - ${errorText}`);
    }

    const erpnextData = await erpnextResponse.json();
    console.log(`Found ${erpnextData.data?.length || 0} total items in ERPNext`);

    if (!erpnextData.data || erpnextData.data.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No items found in ERPNext',
        syncedCount: 0,
        newCount: 0,
        updatedCount: 0,
        totalErpnextCount: 0,
        existingCount: existingEquipmentCount,
      });
    }

    // Filter equipment items
    const allItems = erpnextData.data;
    const equipmentItems = allItems.filter((item: any) => 
      item.item_group === 'Equipment'
    );

    console.log(`Found ${equipmentItems.length} equipment items out of ${allItems.length} total items`);

    if (equipmentItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No equipment items found in ERPNext',
        syncedCount: 0,
        newCount: 0,
        updatedCount: 0,
        totalErpnextCount: 0,
        existingCount: existingEquipmentCount,
        debug: {
          totalItems: allItems.length,
          availableItemGroups: [...new Set(allItems.map((item: any) => item.item_group).filter(Boolean))],
          sampleItems: allItems.slice(0, 3).map((item: any) => ({
            name: item.name,
            item_group: item.item_group,
            item_code: item.item_code
          }))
        }
      });
    }

    // Process equipment items
    const syncedEquipment: any[] = [];
    const updatedEquipment: any[] = [];
    const newEquipment: any[] = [];
    const errors: Array<{equipment: string, error: string}> = [];

    console.log(`Processing ${equipmentItems.length} equipment items...`);

    for (const erpEquipmentItem of equipmentItems) {
      try {
        // Skip disabled items
        if (erpEquipmentItem.disabled) {
          console.log(`Skipping disabled equipment: ${erpEquipmentItem.item_code}`);
          continue;
        }

        // Check if equipment already exists
        const existingEquipmentResult = await db.select().from(equipment).where(
          or(
            eq(equipment.erpnextId, erpEquipmentItem.item_code),
            eq(equipment.serialNumber, erpEquipmentItem.serial_no)
          )
        ).limit(1);
        const existingEquipment = existingEquipmentResult[0];

        const equipmentData = {
          name: erpEquipmentItem.item_name || erpEquipmentItem.item_code,
          description: erpEquipmentItem.description || '',
          manufacturer: '', // Not available in API response
          modelNumber: '', // Not available in API response
          serialNumber: '', // Not available in API response
          erpnextId: erpEquipmentItem.item_code,
          dailyRate: erpEquipmentItem.standard_rate ? String(parseFloat(erpEquipmentItem.standard_rate)) : null,
          status: 'available',
          isActive: true,
          updatedAt: new Date().toISOString(),
        };

        if (existingEquipment) {
          // Check if data has changed
          const hasChanges =
            existingEquipment.name !== equipmentData.name ||
            existingEquipment.description !== equipmentData.description ||
            existingEquipment.manufacturer !== equipmentData.manufacturer ||
            existingEquipment.modelNumber !== equipmentData.modelNumber ||
            existingEquipment.serialNumber !== equipmentData.serialNumber ||
            existingEquipment.erpnextId !== equipmentData.erpnextId ||
            existingEquipment.dailyRate?.toString() !== (equipmentData.dailyRate?.toString() || 'null') ||
            existingEquipment.status !== equipmentData.status ||
            existingEquipment.isActive !== equipmentData.isActive;

          if (hasChanges) {
            console.log('Updating existing equipment:', existingEquipment.id);
            const updatedEquipmentItem = await db.update(equipment)
              .set(equipmentData)
              .where(eq(equipment.id, existingEquipment.id))
              .returning();
            const updatedItem = updatedEquipmentItem[0];
            syncedEquipment.push(updatedItem);
            updatedEquipment.push(updatedItem);
          } else {
            console.log('Equipment unchanged, skipping:', existingEquipment.id);
            syncedEquipment.push(existingEquipment);
          }
        } else {
          console.log('Creating new equipment:', equipmentData.name);
          const newEquipmentItem = await db.insert(equipment)
            .values(equipmentData)
            .returning();
          const newItem = newEquipmentItem[0];
          syncedEquipment.push(newItem);
          newEquipment.push(newItem);
        }
      } catch (error) {
        console.error(`Error processing equipment ${erpEquipmentItem.item_code}:`, error);
        errors.push({
          equipment: erpEquipmentItem.item_code,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Prepare response message based on sync results
    let message = '';
    if (existingEquipmentCount === 0) {
      message = `Initial sync completed: ${syncedEquipment.length} equipment imported from ERPNext`;
    } else if (newEquipment.length > 0 && updatedEquipment.length > 0) {
      message = `Sync completed: ${newEquipment.length} new equipment added, ${updatedEquipment.length} equipment updated`;
    } else if (newEquipment.length > 0) {
      message = `Sync completed: ${newEquipment.length} new equipment added`;
    } else if (updatedEquipment.length > 0) {
      message = `Sync completed: ${updatedEquipment.length} equipment updated`;
    } else {
      message = 'Sync completed: No new data to sync (all equipment are up to date)';
    }

    return NextResponse.json({
      success: true,
      message,
      syncedCount: syncedEquipment.length,
      newCount: newEquipment.length,
      updatedCount: updatedEquipment.length,
      totalErpnextCount: equipmentItems.length,
      existingCount: existingEquipmentCount,
      errors: errors.length > 0 ? errors : undefined,
      performance: {
        totalEquipment: equipmentItems.length,
        successfulSyncs: syncedEquipment.length,
        syncErrors: errors.length,
      }
    });

  } catch (error) {
    console.error('Error syncing equipment:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync equipment',
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
