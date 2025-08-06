import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';

const getSimpleEmployeesHandler = async (request: NextRequest) => {
  try {
    console.log('Simple employees API called');

    // Test basic count
    const count = await prisma.employee.count();
    console.log(`Total employees: ${count}`);

    let employees;
    let whereClause: any = {};

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;
    
    // For employee users, only show their own record
    if (user?.role === 'EMPLOYEE') {
      // Find employee record that matches user's national_id
      const ownEmployee = await prisma.employee.findFirst({
        where: { iqama_number: user.national_id },
        select: { id: true },
      });
      if (ownEmployee) {
        whereClause.id = ownEmployee.id;
      }
    }

    // Test simple findMany without any complex options
    employees = await prisma.employee.findMany({
      where: whereClause,
      take: 5,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      } as any
    });

    console.log(`Found ${employees.length} employees`);

    return NextResponse.json({
      success: true,
      message: 'Simple query works',
      data: {
        totalCount: count,
        employees: employees
      }
    });
  } catch (error) {
    console.error('Simple API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Simple query failed: ' + (error as Error).message,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};

export const GET = withAuth(getSimpleEmployeesHandler);
