import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withReadPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withReadPermission(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const daysParam = parseInt(searchParams.get('days') || '30', 10);
      const includeExpired = searchParams.get('includeExpired') === '1';

      const now = new Date();
      const end = new Date();
      end.setDate(end.getDate() + (isNaN(daysParam) ? 30 : daysParam));

      const where: any = {
        iqama_expiry: { not: null },
        status: { in: ['active', 'on_leave'] },
      };

      if (includeExpired) {
        where.iqama_expiry = { lte: end };
      } else {
        where.iqama_expiry = { gte: now, lte: end };
      }

      const employees = await prisma.employee.findMany({
        where,
        select: {
          id: true,
          first_name: true,
          middle_name: true,
          last_name: true,
          file_number: true,
          employee_id: true,
          iqama_number: true,
          iqama_expiry: true,
          department: { select: { name: true } },
          designation: { select: { name: true } },
        },
        orderBy: { iqama_expiry: 'asc' },
      });

      const data = employees.map((e) => {
        const fullName = [e.first_name, e.middle_name, e.last_name]
          .filter(Boolean)
          .join(' ');
        const daysRemaining = e.iqama_expiry
          ? Math.ceil((e.iqama_expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const status = e.iqama_expiry && e.iqama_expiry < now ? 'expired' : 'expiring';
        return {
          id: e.id,
          name: fullName,
          file_number: e.file_number,
          employee_id: e.employee_id,
          department: e.department?.name || null,
          designation: e.designation?.name || null,
          iqama_number: e.iqama_number,
          iqama_expiry: e.iqama_expiry,
          days_remaining: daysRemaining,
          status,
        };
      });

      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error('Error fetching iqama expiring employees:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      );
    }
  },
  PermissionConfigs.employee.read
);


