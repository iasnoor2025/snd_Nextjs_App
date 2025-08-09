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
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
      const search = (searchParams.get('search') || '').trim();

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

      // Optionally include ALL expired (any date before now)
      if (includeExpired) {
        orConditions.push({ iqama_expiry: { lt: now } });
      }

      // Optionally include missing dates
      if (includeMissing) {
        orConditions.push({ iqama_expiry: null });
      }

      const where: any = {
        status: { in: ['active', 'on_leave'] },
      };

      const andConditions: any[] = [];
      andConditions.push({ OR: orConditions });

      if (search) {
        const s = search;
        const searchOr: any[] = [
          { first_name: { contains: s, mode: 'insensitive' } },
          { middle_name: { contains: s, mode: 'insensitive' } },
          { last_name: { contains: s, mode: 'insensitive' } },
          { file_number: { contains: s, mode: 'insensitive' } },
          { employee_id: { contains: s, mode: 'insensitive' } },
          { iqama_number: { contains: s, mode: 'insensitive' } },
          { department: { name: { contains: s, mode: 'insensitive' } } },
          { designation: { name: { contains: s, mode: 'insensitive' } } },
        ];
        andConditions.push({ OR: searchOr });
      }

      if (andConditions.length) {
        where.AND = andConditions;
      }

      // Prioritize iqama_number matches when searching
      let totalCount = 0;
      let employees: Array<any> = [];

      if (search) {
        const s = search;
        const whereIqama = {
          AND: [
            where,
            { iqama_number: { contains: s, mode: 'insensitive' } },
          ],
        } as any;

        const whereOthers = {
          AND: [
            where,
            { NOT: { iqama_number: { contains: s, mode: 'insensitive' } } },
            {
              OR: [
                { first_name: { contains: s, mode: 'insensitive' } },
                { middle_name: { contains: s, mode: 'insensitive' } },
                { last_name: { contains: s, mode: 'insensitive' } },
                { file_number: { contains: s, mode: 'insensitive' } },
                { employee_id: { contains: s, mode: 'insensitive' } },
                { department: { name: { contains: s, mode: 'insensitive' } } },
                { designation: { name: { contains: s, mode: 'insensitive' } } },
              ],
            },
          ],
        } as any;

        const [countIqama, countOthers] = await Promise.all([
          prisma.employee.count({ where: whereIqama }),
          prisma.employee.count({ where: whereOthers }),
        ]);
        totalCount = countIqama + countOthers;

        const offset = (page - 1) * limit;
        const takeFromIqama = Math.max(0, Math.min(limit, countIqama - Math.min(offset, countIqama)));
        const skipIqama = Math.min(offset, countIqama);
        const remaining = Math.max(0, limit - takeFromIqama);
        const skipOthers = Math.max(0, offset - countIqama);

        const [iqamaRows, otherRows] = await Promise.all([
          takeFromIqama > 0
            ? prisma.employee.findMany({
                where: whereIqama,
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
                orderBy: [{ iqama_expiry: 'asc' }, { id: 'asc' }],
                skip: skipIqama,
                take: takeFromIqama,
              })
            : Promise.resolve([]),
          remaining > 0
            ? prisma.employee.findMany({
                where: whereOthers,
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
                orderBy: [{ iqama_expiry: 'asc' }, { id: 'asc' }],
                skip: skipOthers,
                take: remaining,
              })
            : Promise.resolve([]),
        ]);

        employees = [...iqamaRows, ...otherRows];
      } else {
        totalCount = await prisma.employee.count({ where });
        employees = await prisma.employee.findMany({
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
          orderBy: [{ iqama_expiry: 'asc' }, { id: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        });
      }

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
        });

      const totalPages = Math.ceil(totalCount / limit) || 1;
      return NextResponse.json({ 
        success: true, 
        data, 
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      });
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


