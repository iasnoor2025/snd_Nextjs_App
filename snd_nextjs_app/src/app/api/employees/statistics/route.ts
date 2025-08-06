import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';

const getEmployeeStatisticsHandler = async (request: NextRequest) => {
  try {
    console.log('Employee Statistics API called');

    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;
    
    // For employee users, only show statistics for their own record
    let whereClause: any = {};
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

    // Get total employee count (filtered for employee users)
    const totalEmployees = await prisma.employee.count({ where: whereClause });
    console.log('Total employees:', totalEmployees);

    // Get employees with current assignments (filtered for employee users)
    const currentlyAssigned = await prisma.employee.count({
      where: {
        ...whereClause,
        employee_assignments: {
          some: {
            status: 'active'
          }
        }
      }
    });
    console.log('Currently assigned:', currentlyAssigned);

    // Count project assignments (filtered for employee users)
    const projectAssignments = await prisma.employee.count({
      where: {
        ...whereClause,
        employee_assignments: {
          some: {
            status: 'active',
            type: 'project'
          }
        }
      }
    });
    console.log('Project assignments:', projectAssignments);

    // Count rental assignments (filtered for employee users)
    const rentalAssignments = await prisma.employee.count({
      where: {
        ...whereClause,
        employee_assignments: {
          some: {
            status: 'active',
            type: {
              in: ['rental', 'rental_item']
            }
          }
        }
      }
    });
    console.log('Rental assignments:', rentalAssignments);

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        currentlyAssigned,
        projectAssignments,
        rentalAssignments
      },
      message: 'Employee statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/employees/statistics:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch employee statistics: ' + (error as Error).message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};

export const GET = withAuth(getEmployeeStatisticsHandler); 