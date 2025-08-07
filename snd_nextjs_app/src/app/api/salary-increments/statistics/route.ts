import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from_date = searchParams.get('from_date');
    const to_date = searchParams.get('to_date');

    const where: any = {};

    if (from_date) {
      where.created_at = { gte: new Date(from_date) };
    }

    if (to_date) {
      where.created_at = {
        ...where.created_at,
        lte: new Date(to_date)
      };
    }

    const baseQuery = { where };

    // Get basic statistics
    const [
      totalIncrements,
      pendingIncrements,
      approvedIncrements,
      rejectedIncrements,
      appliedIncrements,
      totalIncrementAmount,
      averageIncrementPercentage,
      byType,
    ] = await Promise.all([
      prisma.salaryIncrement.count(baseQuery),
      prisma.salaryIncrement.count({ ...baseQuery, where: { ...where, status: 'pending' } }),
      prisma.salaryIncrement.count({ ...baseQuery, where: { ...where, status: 'approved' } }),
      prisma.salaryIncrement.count({ ...baseQuery, where: { ...where, status: 'rejected' } }),
      prisma.salaryIncrement.count({ ...baseQuery, where: { ...where, status: 'applied' } }),
      prisma.salaryIncrement.aggregate({
        ...baseQuery,
        where: { ...where, status: { in: ['pending', 'approved', 'applied'] } },
        _sum: {
          new_base_salary: true,
          new_food_allowance: true,
          new_housing_allowance: true,
          new_transport_allowance: true,
          current_base_salary: true,
          current_food_allowance: true,
          current_housing_allowance: true,
          current_transport_allowance: true,
        },
      }),
      prisma.salaryIncrement.aggregate({
        ...baseQuery,
        where: { ...where, status: 'applied' },
        _avg: {
          increment_percentage: true,
        },
      }),
      prisma.salaryIncrement.groupBy({
        by: ['increment_type'],
        where: { ...where, status: 'applied' },
        _count: {
          id: true,
        },
        _avg: {
          increment_percentage: true,
        },
      }),
    ]);

    // Calculate total increment amount
    const totalNewSalary = (totalIncrementAmount._sum.new_base_salary || 0) +
      (totalIncrementAmount._sum.new_food_allowance || 0) +
      (totalIncrementAmount._sum.new_housing_allowance || 0) +
      (totalIncrementAmount._sum.new_transport_allowance || 0);

    const totalCurrentSalary = (totalIncrementAmount._sum.current_base_salary || 0) +
      (totalIncrementAmount._sum.current_food_allowance || 0) +
      (totalIncrementAmount._sum.current_housing_allowance || 0) +
      (totalIncrementAmount._sum.current_transport_allowance || 0);

    const totalIncrementAmountValue = totalNewSalary - totalCurrentSalary;

    // Format by type data
    const byTypeFormatted = byType.reduce((acc, item) => {
      acc[item.increment_type] = {
        count: item._count.id,
        avg_percentage: item._avg.increment_percentage,
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      data: {
        total_increments: totalIncrements,
        pending_increments: pendingIncrements,
        approved_increments: approvedIncrements,
        rejected_increments: rejectedIncrements,
        applied_increments: appliedIncrements,
        total_increment_amount: totalIncrementAmountValue,
        average_increment_percentage: averageIncrementPercentage._avg.increment_percentage || 0,
        by_type: byTypeFormatted,
      },
    });
  } catch (error) {
    console.error('Error fetching salary increment statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
