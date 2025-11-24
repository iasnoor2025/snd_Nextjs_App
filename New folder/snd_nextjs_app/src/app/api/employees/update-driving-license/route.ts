import { db } from '@/lib/db';
import { employees } from '@/lib/drizzle/schema';
import { withPermission } from '@/lib/rbac/api-middleware';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/employees/update-driving-license - Update driving license numbers from iqama numbers
export const POST = async (request: NextRequest) => {
  try {
    console.log('Starting driving license update process...');
    
    // Find employees who have iqama numbers but missing driving license numbers
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

    console.log(`Found ${employeesToUpdate.length} employees to update`);

    if (employeesToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No employees need to be updated.',
        data: {
          totalProcessed: 0,
          updatedCount: 0,
          failedCount: 0,
          updatedEmployees: [],
        },
      });
    }

    // Update each employee
    let updatedCount = 0;
    const updatedEmployees: any[] = [];

    for (const employee of employeesToUpdate) {
      try {
        console.log(`Updating employee ${employee.id}: ${employee.firstName} ${employee.lastName}`);
        
        await db
          .update(employees)
          .set({
            drivingLicenseNumber: employee.iqamaNumber,
            updatedAt: new Date(),
          })
          .where(sql`${employees.id} = ${employee.id}`);

        updatedEmployees.push({
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          fileNumber: employee.fileNumber,
          iqamaNumber: employee.iqamaNumber,
          drivingLicenseNumber: employee.iqamaNumber,
        });
        updatedCount++;
        console.log(`Successfully updated employee ${employee.id}`);
      } catch (error) {
        console.error(`Failed to update employee ${employee.id}:`, error);
      }
    }

    const failedCount = employeesToUpdate.length - updatedCount;

    console.log(`Update completed: ${updatedCount} successful, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} out of ${employeesToUpdate.length} employees.`,
      data: {
        totalProcessed: employeesToUpdate.length,
        updatedCount,
        failedCount,
        updatedEmployees,
      },
    });

  } catch (error) {
    console.error('Error updating driving license numbers:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update driving license numbers',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};
