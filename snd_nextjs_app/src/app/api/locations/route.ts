import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(
  async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.is_active = status === 'active';
    }

    // Get total count for pagination
    const totalCount = await prisma.location.count({ where });

    // Get paginated results
    const locations = await prisma.location.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: locations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.location.read
);

export const POST = withPermission(
  async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    const location = await prisma.location.create({
      data: {
        name: body.name,
        description: body.description,
        address: body.address,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        country: body.country,
        latitude: body.latitude,
        longitude: body.longitude,
        is_active: body.is_active !== undefined ? body.is_active : true,
      }
    });

    return NextResponse.json({
      success: true,
      data: location,
      message: 'Location created successfully'
    }, { status: 201     });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.location.create
); 