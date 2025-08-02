import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing employee assignments...');

    // Test database connection
    await prisma.$connect();
    console.log('Database connection successful');

    // Get total assignments count
    const totalAssignments = await prisma.employeeAssignment.count();
    console.log('Total assignments:', totalAssignments);

    // Get active assignments
    const activeAssignments = await prisma.employeeAssignment.count({
      where: {
        status: 'active'
      }
    });
    console.log('Active assignments:', activeAssignments);

    // Get a few sample assignments
    const sampleAssignments = await prisma.employeeAssignment.findMany({
      take: 5,
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            file_number: true
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
      }
    });

    console.log('Sample assignments:', sampleAssignments);

    return NextResponse.json({
      success: true,
      data: {
        totalAssignments,
        activeAssignments,
        sampleAssignments
      },
      message: 'Assignment test completed'
    });
  } catch (error) {
    console.error('Error testing assignments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test assignments: ' + (error as Error).message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 