import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withReadPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withReadPermission(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const daysParam = parseInt(searchParams.get('days') || '30', 10);
      const range = (searchParams.get('range') || 'next').toLowerCase(); // 'next' | 'past'
      const includeExpired = searchParams.get('includeExpired') === '1';
      const includeMissing = searchParams.get('includeMissing') === '1';
      const expiredDaysParam = parseInt(searchParams.get('expiredDays') || '30', 10);

      const now = new Date();
      const end = new Date();
      const days = isNaN(daysParam) ? 30 : daysParam;
      end.setDate(end.getDate() + days);
      const start = new Date();
      start.setDate(start.getDate() - days);

      // Build OR conditions for next window, expired window, and missing
      const orConditions: any[] = [];

      // Always include the selected range (default: next window)
      if (range === 'past') {
        orConditions.push({ iqama_expiry: { gte: start, lte: now } });
      } else {
        orConditions.push({ iqama_expiry: { gte: now, lte: end } });
      }

      // Optionally include expired window (last expiredDays)
      if (includeExpired) {
        const expiredStart = new Date();
        expiredStart.setDate(expiredStart.getDate() - (isNaN(expiredDaysParam) ? 30 : expiredDaysParam));
        orConditions.push({ iqama_expiry: { gte: expiredStart, lt: now } });
      }

      // Optionally include missing dates
      if (includeMissing) {
        orConditions.push({ iqama_expiry: null });
      }

      const where: any = {
        status: { in: ['active', 'on_leave'] },
        OR: orConditions,
      };

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

      // Post-sort: expired first, then expiring, then missing; within each by date asc
      const nowMs = now.getTime();
      const data = employees
        .map((e) => {
        const fullName = [e.first_name, e.middle_name, e.last_name]
          .filter(Boolean)
          .join(' ');
          const hasDate = !!e.iqama_expiry;
          const isExpired = hasDate && e.iqama_expiry! < now;
          const status = !hasDate ? 'missing' : isExpired ? 'expired' : 'expiring';
          const daysRemaining = hasDate
            ? Math.ceil((e.iqama_expiry!.getTime() - nowMs) / (1000 * 60 * 60 * 24))
            : null;
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
        })
        .sort((a, b) => {
          const orderRank = (s: string) => (s === 'expired' ? 0 : s === 'expiring' ? 1 : 2);
          const rA = orderRank(a.status);
          const rB = orderRank(b.status);
          if (rA !== rB) return rA - rB;
          const aTime = a.iqama_expiry ? new Date(a.iqama_expiry).getTime() : Infinity;
          const bTime = b.iqama_expiry ? new Date(b.iqama_expiry).getTime() : Infinity;
          return aTime - bTime;
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


