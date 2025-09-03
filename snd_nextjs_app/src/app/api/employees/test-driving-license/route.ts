import { db } from '@/lib/db';
import { employees } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/employees/test-driving-license - Test endpoint to check employees
export const GET = async (request: NextRequest) => {
  try {
    console.log('Testing driving license update query...');
    
    // First, let's see all employees with iqama numbers
    const allEmployeesWithIqama = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        fileNumber: employees.fileNumber,
        iqamaNumber: employees.iqamaNumber,
        drivingLicenseNumber: employees.drivingLicenseNumber,
      })
      .from(employees)
      .where(sql`${employees.iqamaNumber} IS NOT NULL AND ${employees.iqamaNumber} != ''`);

    console.log(`Found ${allEmployeesWithIqama.length} employees with iqama numbers`);

    // Now find employees who need updating
    const employeesToUpdate = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        fileNumber: employees.fileNumber,
        iqamaNumber: employees.iqamaNumber,
        drivingLicenseNumber: employees.drivingLicenseNumber,
      })
      .from(employees)
      .where(
        sql`${employees.iqamaNumber} IS NOT NULL 
        AND ${employees.iqamaNumber} != '' 
        AND (${employees.drivingLicenseNumber} IS NULL 
        OR ${employees.drivingLicenseNumber} = '')`
      );

    console.log(`Found ${employeesToUpdate.length} employees that need updating`);

    return NextResponse.json({
      success: true,
      data: {
        totalEmployeesWithIqama: allEmployeesWithIqama.length,
        employeesToUpdate: employeesToUpdate.length,
        employeesWithIqama: allEmployeesWithIqama,
        employeesToUpdateList: employeesToUpdate,
      },
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error in test endpoint',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};
