import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locations } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const locationId = parseInt(id);
    
    if (isNaN(locationId)) {
      return NextResponse.json(
        { error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    const locationRows = await db
      .select()
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);

    if (locationRows.length === 0) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    const location = locationRows[0];
    return NextResponse.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const locationId = parseInt(id);
    
    if (isNaN(locationId)) {
      return NextResponse.json(
        { error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const locationRows = await db
      .update(locations)
      .set({
        name: body.name,
        description: body.description,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zip_code,
        country: body.country,
        latitude: body.latitude,
        longitude: body.longitude,
        isActive: body.is_active !== undefined ? body.is_active : true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(locations.id, locationId))
      .returning();

    const location = locationRows[0];

    return NextResponse.json({
      success: true,
      data: location,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const locationId = parseInt(id);
    
    if (isNaN(locationId)) {
      return NextResponse.json(
        { error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    await db
      .delete(locations)
      .where(eq(locations.id, locationId));

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
} 