import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { db } from '@/lib/db';
import { timesheets } from '@/lib/drizzle/schema';
import { eq, and, gte, lte, asc, sql } from 'drizzle-orm';

export const GET = withPermission(PermissionConfigs.timesheet.read)(async (request: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) => {
    try {
      const { employeeId } = await params;
      const { searchParams } = new URL(request.url);
      const month = searchParams.get('month');
      if (!month) {
        return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 });
      }

      // Parse month parameter (format: YYYY-MM)
      const [year, monthNum] = month.split('-').map(Number);
      if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
        return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
      }
      // Calculate date range for the month
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0);

            // Test database connection first
      try {
        await db.select({ test: sql`1` }).from(timesheets).limit(1);
      } catch (dbError) {
        console.error('Database connection test failed:', dbError);
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
      }

      // Fetch timesheets for the employee in the specified month using Drizzle
      const timesheetsData = await db
        .select({
          id: timesheets.id,
          date: timesheets.date,
          hoursWorked: timesheets.hoursWorked,
          overtimeHours: timesheets.overtimeHours,
          status: timesheets.status,
          startTime: timesheets.startTime,
          endTime: timesheets.endTime,
          description: timesheets.description,
        })
        .from(timesheets)
        .where(
          and(
            eq(timesheets.employeeId, parseInt(employeeId)),
            gte(timesheets.date, startDate.toISOString().split('T')[0] || ''),
            lte(timesheets.date, endDate.toISOString().split('T')[0] || '')
          )
        )
        .orderBy(asc(timesheets.date));
      // Calculate summary - properly handle Decimal types
      const totalRegularHours = timesheetsData.reduce((sum: number, t: any) => {
        const hours =
          typeof t.hoursWorked === 'string'
            ? parseFloat(t.hoursWorked)
            : Number(t.hoursWorked) || 0;
        return sum + hours;
      }, 0);
      const totalOvertimeHours = timesheetsData.reduce((sum: number, t: any) => {
        const hours =
          typeof t.overtimeHours === 'string'
            ? parseFloat(t.overtimeHours)
            : Number(t.overtimeHours) || 0;
        return sum + hours;
      }, 0);
      const approvedCount = timesheetsData.filter((t: any) => t.status === 'approved').length;
      const pendingCount = timesheetsData.filter((t: any) => t.status === 'pending').length;
      const rejectedCount = timesheetsData.filter((t: any) => t.status === 'rejected').length;

      return NextResponse.json({
        timesheets: timesheetsData.map(t => ({
          ...t,
          date: t.date ? String(t.date).split('T')[0] : '', // Format as YYYY-MM-DD
          hours_worked: Number(t.hoursWorked).toString(),
          overtime_hours: Number(t.overtimeHours).toString(),
        })),
        summary: {
          totalRegularHours,
          totalOvertimeHours,
          totalHours: totalRegularHours + totalOvertimeHours,
          approvedCount,
          pendingCount,
          rejectedCount,
          totalEntries: timesheetsData.length,
        },
        month: {
          year,
          month: monthNum,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      });
    } catch (error) {
      console.error('Timesheet fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch timesheet data' }, { status: 500 });
    }
  }
);
