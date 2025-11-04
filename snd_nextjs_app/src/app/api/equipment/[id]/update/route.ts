import { db } from '@/lib/drizzle';
import { equipment } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

import { getServerSession } from '@/lib/auth';
import { withPermission } from '@/lib/rbac/api-middleware';
import { PermissionConfigs } from '@/lib/rbac/api-middleware';
import { autoExtractDoorNumber } from '@/lib/utils/equipment-utils';

export const PUT = withPermission(PermissionConfigs.equipment.update)(
  async (
    request: NextRequest,
    ...args: unknown[]
  ) => {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { params } = (args[0] as { params: Promise<{ id: string }> }) || { params: Promise.resolve({ id: '' }) };
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid equipment ID' }, { status: 400 });
    }

    const body = await request.json();
    console.log('Equipment update request body:', body);

    // Update equipment data
    const updateData: any = {};
    
    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.model_number !== undefined) {
      updateData.modelNumber = body.model_number;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.manufacturer !== undefined) {
      updateData.manufacturer = body.manufacturer;
    }
    if (body.daily_rate !== undefined) {
      updateData.dailyRate = body.daily_rate ? parseFloat(body.daily_rate) : null;
    }
    if (body.weekly_rate !== undefined) {
      updateData.weeklyRate = body.weekly_rate ? parseFloat(body.weekly_rate) : null;
    }
    if (body.monthly_rate !== undefined) {
      updateData.monthlyRate = body.monthly_rate ? parseFloat(body.monthly_rate) : null;
    }
    if (body.serial_number !== undefined) {
      updateData.serialNumber = body.serial_number;
    }
    if (body.chassis_number !== undefined) {
      updateData.chassisNumber = body.chassis_number;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    
    // Handle door number with auto-extraction
    if (body.door_number !== undefined || body.name !== undefined) {
      const currentName = body.name || (await db.select({ name: equipment.name }).from(equipment).where(eq(equipment.id, id)).limit(1))[0]?.name;
      const currentDoorNumber = body.door_number !== undefined ? body.door_number : (await db.select({ doorNumber: equipment.doorNumber }).from(equipment).where(eq(equipment.id, id)).limit(1))[0]?.doorNumber;
      
      if (currentName) {
        const finalDoorNumber = autoExtractDoorNumber(currentName, currentDoorNumber);
        updateData.doorNumber = finalDoorNumber;
      }
    }
    
    if (body.istimara !== undefined) {
      updateData.istimara = body.istimara;
    }
    if (body.istimara_expiry_date !== undefined) {
      updateData.istimaraExpiryDate = body.istimara_expiry_date ? new Date(body.istimara_expiry_date) : null;
    }

    console.log('Updating equipment with data:', updateData);
    
    // Update the equipment in the database
    const [updatedEquipment] = await db
      .update(equipment)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(equipment.id, id))
      .returning();

    if (!updatedEquipment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Equipment not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Equipment updated successfully',
      data: updatedEquipment,
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
