import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locations as locationsTable } from '@/lib/drizzle/schema';
import { and, or, ilike, eq, asc } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(
  async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const city = searchParams.get('city') || undefined;

    // Build where clause (Drizzle)
    const filters: any[] = [];
    if (search) {
      filters.push(
        or(
          ilike(locationsTable.name, `%${search}%`),
          ilike(locationsTable.address, `%${search}%`),
          ilike(locationsTable.city, `%${search}%`),
          ilike(locationsTable.state, `%${search}%`)
        )
      );
    }
    if (status) {
      filters.push(eq(locationsTable.isActive, status === 'active'));
    }
    if (city) {
      filters.push(ilike(locationsTable.city, city));
    }
    const whereExpr = filters.length ? and(...filters) : undefined;

    // Get total count for pagination
    const totalRows = await db
      .select({ id: locationsTable.id })
      .from(locationsTable)
      .where(whereExpr as any);
    const totalCount = totalRows.length;

    // Get paginated results
    const locations = await db
      .select()
      .from(locationsTable)
      .where(whereExpr as any)
      .orderBy(asc(locationsTable.name))
      .offset((page - 1) * limit)
      .limit(limit);

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
    
    const inserted = await db
      .insert(locationsTable)
      .values({
        name: body.name,
        description: body.description ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        zipCode: body.zip_code ?? null,
        country: body.country ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        isActive: body.is_active !== undefined ? body.is_active : true,
          updatedAt: new Date().toISOString(),
      })
      .returning();
    const location = inserted[0];

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