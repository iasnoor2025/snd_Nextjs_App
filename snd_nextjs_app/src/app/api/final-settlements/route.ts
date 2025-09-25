import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { finalSettlements, employees, users } from '@/lib/drizzle/schema';
import { eq, desc, and, like, or } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-config';

// GET: Fetch all final settlements with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const employeeId = searchParams.get('employeeId');

    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];
    
    if (status) {
      conditions.push(eq(finalSettlements.status, status));
    }
    
    if (employeeId) {
      conditions.push(eq(finalSettlements.employeeId, parseInt(employeeId)));
    }
    
    if (search) {
      conditions.push(
        or(
          like(finalSettlements.employeeName, `%${search}%`),
          like(finalSettlements.settlementNumber, `%${search}%`),
          like(finalSettlements.fileNumber, `%${search}%`),
          like(finalSettlements.iqamaNumber, `%${search}%`)
        )
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch settlements with pagination
    const settlements = await db
      .select({
        id: finalSettlements.id,
        settlementNumber: finalSettlements.settlementNumber,
        employeeId: finalSettlements.employeeId,
        employeeName: finalSettlements.employeeName,
        fileNumber: finalSettlements.fileNumber,
        iqamaNumber: finalSettlements.iqamaNumber,
        nationality: finalSettlements.nationality,
        designation: finalSettlements.designation,
        department: finalSettlements.department,
        hireDate: finalSettlements.hireDate,
        lastWorkingDate: finalSettlements.lastWorkingDate,
        totalServiceYears: finalSettlements.totalServiceYears,
        totalServiceMonths: finalSettlements.totalServiceMonths,
        unpaidSalaryMonths: finalSettlements.unpaidSalaryMonths,
        unpaidSalaryAmount: finalSettlements.unpaidSalaryAmount,
        endOfServiceBenefit: finalSettlements.endOfServiceBenefit,
        grossAmount: finalSettlements.grossAmount,
        totalDeductions: finalSettlements.totalDeductions,
        netAmount: finalSettlements.netAmount,
        status: finalSettlements.status,
        preparedAt: finalSettlements.preparedAt,
        approvedAt: finalSettlements.approvedAt,
        paidAt: finalSettlements.paidAt,
        currency: finalSettlements.currency,
        createdAt: finalSettlements.createdAt,
      })
      .from(finalSettlements)
      .where(whereCondition)
      .orderBy(desc(finalSettlements.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: finalSettlements.id })
      .from(finalSettlements)
      .where(whereCondition);

    const total = totalResult.length;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: settlements,
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
    console.error('Error fetching final settlements:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch final settlements',
      },
      { status: 500 }
    );
  }
}
