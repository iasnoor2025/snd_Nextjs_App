import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
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

    // Get total employee count
    const totalEmployees = await prisma.employee.count();
    console.log('Total employees:', totalEmployees);

    // Get employees with current assignments - more efficient approach
    const currentlyAssigned = await prisma.employee.count({
      where: {
        employee_assignments: {
          some: {
            status: 'active'
          }
        }
      }
    });
    console.log('Currently assigned:', currentlyAssigned);

    // Count project assignments
    const projectAssignments = await prisma.employee.count({
      where: {
        employee_assignments: {
          some: {
            status: 'active',
            type: 'project'
          }
        }
      }
    });
    console.log('Project assignments:', projectAssignments);

    // Count rental assignments
    const rentalAssignments = await prisma.employee.count({
      where: {
        employee_assignments: {
          some: {
            status: 'active',
            type: 'rental'
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
} 