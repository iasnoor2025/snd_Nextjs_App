import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employeeLeaves, employees as employeesTable, departments, designations } from '@/lib/drizzle/schema';
import { and, asc, eq, gte, ilike, isNull, lte, or, sql } from 'drizzle-orm';
import { withReadPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withReadPermission(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
      const search = (searchParams.get('search') || '').trim();

      const now = new Date();

      const baseFilters: any[] = [
        eq(employeeLeaves.status, 'approved' as any),
        lte(employeeLeaves.startDate, now.toISOString()),
        or(gte(employeeLeaves.endDate, now.toISOString()), isNull(employeeLeaves.endDate)),
      ];

      if (search) {
        const s = `%${search}%`;
        baseFilters.push(
          or(
            ilike(employeesTable.firstName, s),
            ilike(employeesTable.middleName, s),
            ilike(employeesTable.lastName, s),
            ilike(employeesTable.fileNumber, s),
            ilike(employeesTable.employeeId, s),
            ilike(employeesTable.iqamaNumber, s),
            ilike(departments.name, s),
            ilike(designations.name, s),
            ilike(employeeLeaves.leaveType, s),
          )
        );
      }

      const whereExpr = and(...baseFilters);

      const totalRow = await db
        .select({ count: sql<number>`count(*)` })
        .from(employeeLeaves)
        .leftJoin(employeesTable, eq(employeesTable.id, employeeLeaves.employeeId))
        .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
        .leftJoin(designations, eq(designations.id, employeesTable.designationId))
        .where(whereExpr);
      const total = Number((totalRow as any)[0]?.count ?? 0);

      const items = await db
        .select({
          id: employeeLeaves.id,
          employee_id: employeeLeaves.employeeId,
          leave_type: employeeLeaves.leaveType,
          start_date: employeeLeaves.startDate,
          end_date: employeeLeaves.endDate,
          days: employeeLeaves.days,
          status: employeeLeaves.status,
          emp_id: employeesTable.id,
          first_name: employeesTable.firstName,
          middle_name: employeesTable.middleName,
          last_name: employeesTable.lastName,
          file_number: employeesTable.fileNumber,
          department_name: departments.name,
          designation_name: designations.name,
        })
        .from(employeeLeaves)
        .leftJoin(employeesTable, eq(employeesTable.id, employeeLeaves.employeeId))
        .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
        .leftJoin(designations, eq(designations.id, employeesTable.designationId))
        .where(whereExpr)
        .orderBy(asc(employeeLeaves.endDate), asc(employeeLeaves.id))
        .offset((page - 1) * limit)
        .limit(limit);

      const data = items.map((it) => {
        const fullName = [it.first_name, it.middle_name, it.last_name]
          .filter(Boolean)
          .join(' ');
        const endDate = it.end_date ? new Date(it.end_date as unknown as string) : null;
        const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000*60*60*24))) : null;
        return {
          id: it.id,
          employee_id: it.employee_id,
          name: fullName,
          file_number: it.file_number || null,
          department: it.department_name || null,
          designation: it.designation_name || null,
          leave_type: it.leave_type,
          start_date: it.start_date,
          end_date: endDate,
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


