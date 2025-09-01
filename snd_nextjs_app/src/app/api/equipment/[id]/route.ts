import { db } from '@/lib/drizzle';
import { equipment } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth-config';
import { getServerSession } from 'next-auth';
import { withPermission } from '@/lib/rbac/api-middleware';
import { PermissionConfigs } from '@/lib/rbac/api-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid equipment ID' }, { status: 400 });
    }

    const [equipmentData] = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        status: equipment.status,
        model_number: equipment.modelNumber,
        manufacturer: equipment.manufacturer,
        daily_rate: equipment.dailyRate,
        weekly_rate: equipment.weeklyRate,
        monthly_rate: equipment.monthlyRate,
        serial_number: equipment.serialNumber,
        chassis_number: equipment.chassisNumber,
        description: equipment.description,
        door_number: equipment.doorNumber,
        erpnext_id: equipment.erpnextId,
        istimara: equipment.istimara,
        istimara_expiry_date: equipment.istimaraExpiryDate,
        category_id: equipment.categoryId,
      })
      .from(equipment)
      .where(eq(equipment.id, id))
      .limit(1);

    if (!equipmentData) {
      return NextResponse.json({ success: false, error: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: equipmentData,
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
  }

export const PUT = withPermission(PermissionConfigs.equipment.update)(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid equipment ID' }, { status: 400 });
    }

    const body = await request.json();
    console.log('Equipment update request body:', body);
    const { istimara_expiry_date, istimara } = body;

    // Validate required fields
    if (!istimara_expiry_date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Istimara expiry date is required' 
      }, { status: 400 });
    }

    // Update equipment data
    const updateData: any = {};
    
    if (istimara_expiry_date) {
      updateData.istimaraExpiryDate = new Date(istimara_expiry_date);
    }
    
    if (istimara) {
      updateData.istimara = istimara;
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
