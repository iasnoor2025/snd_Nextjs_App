import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withReadPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withReadPermission(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
      const search = (searchParams.get('search') || '').trim();

      const where: any = {
        status: 'active',
        deleted_at: null,
      };

      if (search) {
        where.AND = where.AND || [];
        where.AND.push({
          OR: [
            { rental_number: { contains: search, mode: 'insensitive' } },
            { equipment_name: { contains: search, mode: 'insensitive' } },
            { customer: { is: { name: { contains: search, mode: 'insensitive' } } } },
            { project: { is: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        });
      }

      const total = await prisma.rental.count({ where });
      const items = await prisma.rental.findMany({
        where,
        orderBy: [{ start_date: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          rental_number: true,
          equipment_name: true,
          start_date: true,
          expected_end_date: true,
          status: true,
          customer: { select: { name: true } },
          project: { select: { name: true } },
        },
      });

      const data = items.map((r) => ({
        id: r.id,
        rental_number: r.rental_number,
        customer: r.customer?.name || null,
        project: r.project?.name || null,
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
      console.error('Error fetching active rentals:', error);
      return NextResponse.json({ error: 'Failed to fetch active rentals' }, { status: 500 });
    }
  },
  PermissionConfigs.rental.read
);


