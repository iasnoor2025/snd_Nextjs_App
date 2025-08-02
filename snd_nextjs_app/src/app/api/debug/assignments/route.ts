import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Debugging assignment data...');

    // Get all employees with their assignments
    const employees = await prisma.employee.findMany({
      include: {
        employee_assignments: {
          where: {
            status: 'active'
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
        }
      },
      take: 10 // Limit to first 10 for debugging
    });

    // Analyze assignment data
    const assignmentAnalysis = employees.map(emp => ({
      id: emp.id,
      file_number: emp.file_number,
      name: `${emp.first_name} ${emp.last_name}`,
      assignmentCount: emp.employee_assignments.length,
      assignments: emp.employee_assignments.map(assignment => ({
        id: assignment.id,
        type: assignment.type,
        name: assignment.name,
        status: assignment.status,
        start_date: assignment.start_date,
        project: assignment.project,
        rental: assignment.rental
      }))
    }));

    // Count statistics
    const totalEmployees = employees.length;
    const employeesWithAssignments = employees.filter(emp => emp.employee_assignments.length > 0).length;
    const employeesWithoutAssignments = employees.filter(emp => emp.employee_assignments.length === 0).length;

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        employeesWithAssignments,
        employeesWithoutAssignments,
        assignmentAnalysis
      },
      message: 'Assignment debug data retrieved'
    });
  } catch (error) {
    console.error('Error debugging assignments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to debug assignments: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
} 