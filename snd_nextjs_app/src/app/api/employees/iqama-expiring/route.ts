import { db } from '@/lib/db';
import { departments, designations, employees as employeesTable } from '@/lib/drizzle/schema';
import { PermissionConfigs, withReadPermission } from '@/lib/rbac/api-middleware';
import { and, asc, eq, gte, ilike, inArray, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withReadPermission('Employee')(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get('days') || '30', 10);
    const range = (searchParams.get('range') || 'next').toLowerCase(); // 'next' | 'past'
    const includeExpired = searchParams.get('includeExpired') === '1';
    const includeMissing = searchParams.get('includeMissing') === '1';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const search = (searchParams.get('search') || '').trim();

    const now = new Date();
    const end = new Date();
    const days = isNaN(daysParam) ? 30 : daysParam;
    end.setDate(end.getDate() + days);
    const start = new Date();
    start.setDate(start.getDate() - days);

    // Build time window filters
    const windowExpr =
      range === 'past'
        ? and(
            gte(employeesTable.iqamaExpiry, start.toISOString()),
            lte(employeesTable.iqamaExpiry, now.toISOString())
          )
        : and(
            gte(employeesTable.iqamaExpiry, now.toISOString()),
            lte(employeesTable.iqamaExpiry, end.toISOString())
          );

    const optionalExprs: any[] = [windowExpr];
    if (includeExpired) optionalExprs.push(lt(employeesTable.iqamaExpiry, now.toISOString()));
    if (includeMissing) optionalExprs.push(isNull(employeesTable.iqamaExpiry));

    const statusExpr = inArray(employeesTable.status, ['active', 'on_leave']);

    const baseFilters: any[] = [statusExpr, or(...optionalExprs)];

    // Search filters
    if (search) {
      const s = `%${search}%`;
      baseFilters.push(
        or(
          ilike(employeesTable.firstName, s),
          ilike(employeesTable.middleName, s),
          ilike(employeesTable.lastName, s),
          ilike(employeesTable.fileNumber, s),
          ilike(employeesTable.iqamaNumber, s),
          ilike(departments.name, s),
          ilike(designations.name, s)
        )
      );
    }

    const whereExpr = and(...baseFilters);

    // Total count
    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(employeesTable)
      .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
      .leftJoin(designations, eq(designations.id, employeesTable.designationId))
      .where(whereExpr);
    const totalCount = Number((totalRow as any)[0]?.count ?? 0);

    // Page rows
    const rows = await db
      .select({
        id: employeesTable.id,
        first_name: employeesTable.firstName,
        middle_name: employeesTable.middleName,
        last_name: employeesTable.lastName,
        file_number: employeesTable.fileNumber,
        employee_id: employeesTable.id,
        iqama_number: employeesTable.iqamaNumber,
        iqama_expiry: employeesTable.iqamaExpiry,
        department_name: departments.name,
        designation_name: designations.name,
      })
      .from(employeesTable)
      .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
      .leftJoin(designations, eq(designations.id, employeesTable.designationId))
      .where(whereExpr)
      .orderBy(asc(employeesTable.iqamaExpiry), asc(employeesTable.id))
      .offset((page - 1) * limit)
      .limit(limit);

    // Post-sort: expired first, then expiring, then missing; within each by date asc
    const nowMs = now.getTime();
    const data = rows.map(e => {
      const fullName = [e.first_name, e.middle_name, e.last_name].filter(Boolean).join(' ');
      const iqamaDate = e.iqama_expiry ? new Date(e.iqama_expiry as unknown as string) : null;
      const hasDate = !!iqamaDate;
      const isExpired = hasDate && iqamaDate! < now;
      const status = !hasDate ? 'missing' : isExpired ? 'expired' : 'expiring';
      const daysRemaining = hasDate
        ? Math.ceil(((iqamaDate as Date).getTime() - nowMs) / (1000 * 60 * 60 * 24))
        : null;
      return {
        id: e.id,
        name: fullName,
        file_number: e.file_number,
        employee_id: e.employee_id,
        department: e.department_name || null,
        designation: e.designation_name || null,
        iqama_number: e.iqama_number,
        iqama_expiry: iqamaDate,
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
      },
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
});
