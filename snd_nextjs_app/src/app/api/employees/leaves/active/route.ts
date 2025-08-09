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

      const now = new Date();

      const where: any = {
        status: 'approved',
        start_date: { lte: now },
        OR: [
          { end_date: { gte: now } },
          { end_date: null },
        ],
        employee: {
          is: { deleted_at: null },
        },
      };

      if (search) {
        where.AND = where.AND || [];
        where.AND.push({
          OR: [
            { employee: { is: { first_name: { contains: search, mode: 'insensitive' } } } },
            { employee: { is: { middle_name: { contains: search, mode: 'insensitive' } } } },
            { employee: { is: { last_name: { contains: search, mode: 'insensitive' } } } },
            { employee: { is: { file_number: { contains: search, mode: 'insensitive' } } } },
            { employee: { is: { employee_id: { contains: search, mode: 'insensitive' } } } },
            { employee: { is: { iqama_number: { contains: search, mode: 'insensitive' } } } },
            { employee: { is: { department: { is: { name: { contains: search, mode: 'insensitive' } } } } } },
            { employee: { is: { designation: { is: { name: { contains: search, mode: 'insensitive' } } } } } },
            { leave_type: { contains: search, mode: 'insensitive' } },
          ],
        });
      }

      const total = await prisma.employeeLeave.count({ where });
      const items = await prisma.employeeLeave.findMany({
        where,
        orderBy: [{ end_date: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          employee_id: true,
          leave_type: true,
          start_date: true,
          end_date: true,
          days: true,
          status: true,
          employee: {
            select: {
              id: true,
              first_name: true,
              middle_name: true,
              last_name: true,
              file_number: true,
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
        },
      });

      const data = items.map((it) => {
        const fullName = [it.employee?.first_name, it.employee?.middle_name, it.employee?.last_name]
          .filter(Boolean)
          .join(' ');
        const daysLeft = it.end_date ? Math.max(0, Math.ceil((it.end_date.getTime() - now.getTime()) / (1000*60*60*24))) : null;
        return {
          id: it.id,
          employee_id: it.employee?.id,
          name: fullName,
          file_number: it.employee?.file_number || null,
          department: it.employee?.department?.name || null,
          designation: it.employee?.designation?.name || null,
          leave_type: it.leave_type,
          start_date: it.start_date,
          end_date: it.end_date,
          days_left: daysLeft,
          status: it.status,
        };
      });

      const totalPages = Math.ceil(total / limit) || 1;
      return NextResponse.json({
        success: true,
        data,
        count: total,
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
      console.error('Error fetching active leaves:', error);
      return NextResponse.json({ error: 'Failed to fetch active leaves' }, { status: 500 });
    }
  },
  PermissionConfigs.leave.read
);


