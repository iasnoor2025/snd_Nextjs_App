import { db } from '@/lib/drizzle';
import { salaryIncrements } from '@/lib/drizzle/schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac/api-middleware';
import { PermissionConfigs } from '@/lib/rbac/api-middleware';

async function getStatisticsHandler(_request: NextRequest) {
  try {

    const { searchParams } = new URL(_request.url);
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    // Build where conditions for date filtering
    const whereConditions: any[] = [];

    if (fromDate) {
      whereConditions.push(gte(salaryIncrements.effectiveDate, fromDate));
    }

    if (toDate) {
      whereConditions.push(lte(salaryIncrements.effectiveDate, toDate));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total counts by status
    const statusCounts = await db
      .select({
        status: salaryIncrements.status,
        count: sql<number>`count(*)`,
      })
      .from(salaryIncrements)
      .where(whereClause)
      .groupBy(salaryIncrements.status);

    // Get total increment amount
    const totalAmountResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(COALESCE(increment_amount, 0)), 0)`,
      })
      .from(salaryIncrements)
      .where(
        whereClause
          ? and(whereClause, eq(salaryIncrements.status, 'applied'))
          : eq(salaryIncrements.status, 'applied')
      );

    // Get average increment percentage
    const avgPercentageResult = await db
      .select({
        avg: sql<number>`COALESCE(AVG(COALESCE(increment_percentage, 0)), 0)`,
      })
      .from(salaryIncrements)
      .where(
        whereClause
          ? and(whereClause, eq(salaryIncrements.status, 'applied'))
          : eq(salaryIncrements.status, 'applied')
      );

    // Get counts by increment type
    const typeCounts = await db
      .select({
        increment_type: salaryIncrements.incrementType,
        count: sql<number>`count(*)`,
        avg_percentage: sql<number>`COALESCE(AVG(COALESCE(increment_percentage, 0)), 0)`,
      })
      .from(salaryIncrements)
      .where(whereClause)
      .groupBy(salaryIncrements.incrementType);

    // Transform status counts into a more usable format
    const statusCountsMap = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item.count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Transform type counts into the expected format
    const byType = typeCounts.reduce(
      (acc, item) => {
        acc[item.increment_type] = {
          count: item.count,
          avg_percentage: Number(item.avg_percentage),
        };
        return acc;
      },
      {} as Record<string, { count: number; avg_percentage: number }>
    );

    const statistics = {
      total_increments: statusCounts.reduce((sum, item) => sum + item.count, 0),
      pending_increments: statusCountsMap.pending || 0,
      approved_increments: statusCountsMap.approved || 0,
      rejected_increments: statusCountsMap.rejected || 0,
      applied_increments: statusCountsMap.applied || 0,
      total_increment_amount: Number(totalAmountResult[0]?.total || 0),
      average_increment_percentage: Number(avgPercentageResult[0]?.avg || 0),
      by_type: byType,
    };

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withPermission(PermissionConfigs.salaryIncrement.read)(getStatisticsHandler);
