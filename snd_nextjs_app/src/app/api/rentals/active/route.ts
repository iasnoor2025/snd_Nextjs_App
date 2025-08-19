import { db } from '@/lib/db';
import { rentals as rentalsTable } from '@/lib/drizzle/schema';
import { PermissionConfigs, withReadPermission } from '@/lib/rbac/api-middleware';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withReadPermission(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const search = (searchParams.get('search') || '').trim();

    const filters: any[] = [eq(rentalsTable.status, 'active' as any)];
    if (search) {
      const s = `%${search}%`;
      filters.push(ilike(rentalsTable.rentalNumber, s));
    }
    const whereExpr = and(...filters);

    const totalRows = await db.select({ id: rentalsTable.id }).from(rentalsTable).where(whereExpr);
    const total = totalRows.length;
    const items = await db
      .select({
        id: rentalsTable.id,
        rental_number: rentalsTable.rentalNumber,
        equipment_name: rentalsTable.equipmentName,
        start_date: rentalsTable.startDate,
        expected_end_date: rentalsTable.expectedEndDate,
        status: rentalsTable.status,
      })
      .from(rentalsTable)
      .where(whereExpr)
      .orderBy(desc(rentalsTable.startDate), desc(rentalsTable.id))
      .offset((page - 1) * limit)
      .limit(limit);

    const data = items.map(r => ({
      id: r.id,
      rental_number: r.rental_number,
      customer: null,
      project: null,
      equipment_name: r.equipment_name || null,
      start_date: r.start_date,
      expected_end_date: r.expected_end_date,
      status: r.status,
    }));

    const totalPages = Math.ceil(total / limit) || 1;
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to fetch active rentals' }, { status: 500 });
  }
}, PermissionConfigs.rental.read);
