import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Debugging employee 073 assignments...');

    // Test database connection
    await prisma.$connect();
    console.log('Database connection successful');

    // Find employee 073
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { file_number: '073' },
          { employee_id: '073' }
        ]
      }
    });

    console.log('Employee 073 found:', employee);

    if (!employee) {
      return NextResponse.json({
        success: false,
        message: 'Employee 073 not found'
      }, { status: 404 });
    }

    // Get all assignments for this employee
    const assignments = await prisma.employeeAssignment.findMany({
      where: {
        employee_id: employee.id
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        rental: {
          select: {
            id: true,
            rental_number: true,
            customer: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        start_date: 'desc'
      }
    });

    console.log('Employee 073 assignments:', assignments);

    // Also check equipment assignments that might involve this employee
    const equipmentAssignments = await prisma.equipmentRentalHistory.findMany({
      where: {
        employee_id: employee.id
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        rental: {
          select: {
            id: true,
            rental_number: true
          }
        }
      },
      orderBy: {
        start_date: 'desc'
      }
    });

    console.log('Employee 073 equipment assignments:', equipmentAssignments);

    return NextResponse.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          file_number: employee.file_number,
          employee_id: employee.employee_id,
          name: `${employee.first_name} ${employee.last_name}`
        },
        employeeAssignments: assignments,
        equipmentAssignments: equipmentAssignments
      },
      message: 'Employee 073 assignment debug data retrieved'
    });
  } catch (error) {
    console.error('Error debugging employee 073 assignments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to debug employee 073 assignments: ' + (error as Error).message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 