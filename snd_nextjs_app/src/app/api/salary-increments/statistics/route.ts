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
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    const where: any = {};
    
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = new Date(fromDate);
      if (toDate) where.created_at.lte = new Date(toDate);
    }

    // Get counts for different statuses
    const [total, pending, approved, rejected, applied] = await Promise.all([
      prisma.salaryIncrement.count({ where }),
      prisma.salaryIncrement.count({ where: { ...where, status: 'pending' } }),
      prisma.salaryIncrement.count({ where: { ...where, status: 'approved' } }),
      prisma.salaryIncrement.count({ where: { ...where, status: 'rejected' } }),
      prisma.salaryIncrement.count({ where: { ...where, status: 'applied' } }),
    ]);

    // Get total increment amount (sum of all applied increments)
    const appliedIncrements = await prisma.salaryIncrement.findMany({
      where: { ...where, status: 'applied' },
      select: {
        current_base_salary: true,
        current_food_allowance: true,
        current_housing_allowance: true,
        current_transport_allowance: true,
        new_base_salary: true,
        new_food_allowance: true,
        new_housing_allowance: true,
        new_transport_allowance: true,
      },
    });

    const totalIncrementAmount = appliedIncrements.reduce((sum, increment) => {
      const currentTotal = parseFloat(String(increment.current_base_salary || 0)) +
                         parseFloat(String(increment.current_food_allowance || 0)) +
                         parseFloat(String(increment.current_housing_allowance || 0)) +
                         parseFloat(String(increment.current_transport_allowance || 0));
      
      const newTotal = parseFloat(String(increment.new_base_salary || 0)) +
                      parseFloat(String(increment.new_food_allowance || 0)) +
                      parseFloat(String(increment.new_housing_allowance || 0)) +
                      parseFloat(String(increment.new_transport_allowance || 0));
      
      return sum + (newTotal - currentTotal);
    }, 0);

    // Get average increment percentage
    const percentageIncrements = await prisma.salaryIncrement.findMany({
      where: { ...where, increment_type: 'percentage', increment_percentage: { not: null } },
      select: { increment_percentage: true },
    });

    const averageIncrementPercentage = percentageIncrements.length > 0
      ? percentageIncrements.reduce((sum, inc) => sum + parseFloat(String(inc.increment_percentage || 0)), 0) / percentageIncrements.length
      : 0;

    // Get statistics by type
    const typeStats = await prisma.salaryIncrement.groupBy({
      by: ['increment_type'],
      where,
      _count: { increment_type: true },
      _avg: { increment_percentage: true },
    });

    const byType: Record<string, { count: number; avg_percentage: number }> = {};
    typeStats.forEach(stat => {
      byType[stat.increment_type] = {
        count: stat._count.increment_type,
        avg_percentage: parseFloat(String(stat._avg.increment_percentage || 0)),
      };
    });

    const statistics = {
      total_increments: total,
      pending_increments: pending,
      approved_increments: approved,
      rejected_increments: rejected,
      applied_increments: applied,
      total_increment_amount: totalIncrementAmount,
      average_increment_percentage: averageIncrementPercentage,
      by_type: byType,
    };

    return NextResponse.json({ data: statistics }, { status: 200 });
  } catch (error) {
    console.error('Error fetching salary increment statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
