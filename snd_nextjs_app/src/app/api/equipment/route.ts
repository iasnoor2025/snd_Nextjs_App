import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const syncERPNext = searchParams.get('sync_erpnext');
    const source = searchParams.get('source');

    // If sync_erpnext is requested, trigger ERPNext sync first
    if (syncERPNext === 'true') {
      try {
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/erpnext/equipment?action=sync`, {
          method: 'GET'
        });
        
        if (syncResponse.ok) {
          const syncResult = await syncResponse.json();
          console.log('ERPNext sync result:', syncResult);
        }
      } catch (error) {
        console.error('Error syncing from ERPNext:', error);
      }
    }

    // If source is erpnext, fetch from ERPNext API
    if (source === 'erpnext') {
      try {
        const erpResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/erpnext/equipment`);
        if (erpResponse.ok) {
          const erpData = await erpResponse.json();
          return NextResponse.json({ 
            success: true,
            data: erpData.data || [],
            source: 'erpnext',
            count: erpData.count || 0
          });
        }
      } catch (error) {
        console.error('Error fetching from ERPNext:', error);
      }
    }

    // Default: fetch from local database
    const equipment = await prisma.equipment.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        model_number: true,
        status: true,
        category_id: true,
        manufacturer: true,
        daily_rate: true,
        weekly_rate: true,
        monthly_rate: true,
        erpnext_id: true,
        serial_number: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ 
      success: true,
      data: equipment,
      source: 'local',
      count: equipment.length
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch equipment' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const equipment = await prisma.equipment.create({
      data: {
        name: body.name,
        description: body.description,
        category_id: body.categoryId,
        manufacturer: body.manufacturer,
        model_number: body.modelNumber,
        serial_number: body.serialNumber,
        purchase_date: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchase_price: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
        status: body.status || 'available',
        daily_rate: body.dailyRate ? parseFloat(body.dailyRate) : null,
        weekly_rate: body.weeklyRate ? parseFloat(body.weeklyRate) : null,
        monthly_rate: body.monthlyRate ? parseFloat(body.monthlyRate) : null,
        is_active: true
      }
    });

    return NextResponse.json({ success: true, data: equipment }, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create equipment' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      categoryId,
      manufacturer,
      modelNumber,
      serialNumber,
      purchaseDate,
      purchasePrice,
      status,
      locationId,
      notes,
      dailyRate,
      weeklyRate,
      monthlyRate,
    } = body;

    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        name,
        description,
        category_id: categoryId,
        manufacturer,
        model_number: modelNumber,
        serial_number: serialNumber,
        purchase_date: purchaseDate ? new Date(purchaseDate) : null,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        status,
        location_id: locationId,
        notes,
        daily_rate: dailyRate ? parseFloat(dailyRate) : null,
        weekly_rate: weeklyRate ? parseFloat(weeklyRate) : null,
        monthly_rate: monthlyRate ? parseFloat(monthlyRate) : null,
      },
    });

    return NextResponse.json({ success: true, data: equipment });
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update equipment' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    await prisma.equipment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete equipment' 
      },
      { status: 500 }
    );
  }
}
