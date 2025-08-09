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
            { name: { contains: search, mode: 'insensitive' } },
            { customer: { is: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        });
      }

      const total = await prisma.project.count({ where });
      const items = await prisma.project.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          start_date: true,
          end_date: true,
          status: true,
          customer: { select: { name: true } },
        },
      });

      const data = items.map((p) => ({
        id: p.id,
        name: p.name,
        customer: p.customer?.name || null,
        start_date: p.start_date,
        end_date: p.end_date,
        status: p.status,
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
      console.error('Error fetching active projects:', error);
      return NextResponse.json({ error: 'Failed to fetch active projects' }, { status: 500 });
    }
  },
  PermissionConfigs.project.read
);


