import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing leave data retrieval...');
    
    // Check if there are any leave records at all
    const allLeaves = await db
      .select({
        id: employeeLeaves.id,
        employeeId: employeeLeaves.employeeId,
        leaveType: employeeLeaves.leaveType,
        startDate: employeeLeaves.startDate,
        endDate: employeeLeaves.endDate,
        days: employeeLeaves.days,
        status: employeeLeaves.status,
        reason: employeeLeaves.reason,
        createdAt: employeeLeaves.createdAt,
      })
      .from(employeeLeaves)
      .orderBy(desc(employeeLeaves.createdAt))
      .limit(10);

    console.log('All leaves found:', allLeaves.length);
    console.log('Sample leave data:', allLeaves[0]);

    // Check if there are any employees
    const allEmployees = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeId: employees.employeeId,
      })
      .from(employees)
      .limit(5);

    console.log('All employees found:', allEmployees.length);
    console.log('Sample employee data:', allEmployees[0]);

    // Try to get leaves for a specific employee if any exist
    let employeeLeavesData = [];
    if (allEmployees.length > 0) {
      const firstEmployeeId = allEmployees[0].id;
      employeeLeavesData = await db
        .select({
          id: employeeLeaves.id,
          employeeId: employeeLeaves.employeeId,
          leaveType: employeeLeaves.leaveType,
          startDate: employeeLeaves.startDate,
          endDate: employeeLeaves.endDate,
          days: employeeLeaves.days,
          status: employeeLeaves.status,
          reason: employeeLeaves.reason,
          createdAt: employeeLeaves.createdAt,
        })
        .from(employeeLeaves)
        .where(eq(employeeLeaves.employeeId, firstEmployeeId))
        .orderBy(desc(employeeLeaves.createdAt));
    }

    return NextResponse.json({
      success: true,
      data: {
        totalLeaves: allLeaves.length,
        totalEmployees: allEmployees.length,
        sampleLeave: allLeaves[0] || null,
        sampleEmployee: allEmployees[0] || null,
        employeeLeaves: employeeLeavesData,
        allLeaves: allLeaves
      },
      message: 'Leave data test completed'
    });
  } catch (error) {
    console.error('Error testing leave data:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test leave data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
