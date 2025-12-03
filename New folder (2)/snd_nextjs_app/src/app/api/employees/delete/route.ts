import { db } from '@/lib/db';
import { employees as employeesTable } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, id } = await request.json();
    
    if (!firstName && !lastName && !id) {
      return NextResponse.json(
        { success: false, message: 'Please provide firstName, lastName, or id' },
        { status: 400 }
      );
    }

    // First, find the employee to get their ID
    let employeeId: number;
    
    if (id) {
      employeeId = id;
    } else if (firstName && lastName) {
      const employee = await db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(sql`first_name = ${firstName} AND last_name = ${lastName}`);
      
      if (employee.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Employee not found' },
          { status: 404 }
        );
      }
      employeeId = employee[0].id;
    } else {
      return NextResponse.json(
        { success: false, message: 'Please provide both firstName and lastName, or id' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting employee ID: ${employeeId} and all related data...`);

    // List of all tables that reference employees (in order of dependency)
    const tablesToClear = [
      'advance_payment_histories',
      'advance_payments',
      'employee_assignments',
      'employee_documents',
      'employee_leaves',
      'employee_performance_reviews',
      'employee_resignations',
      'employee_salaries',
      'employee_skill',
      'employee_training',
      'loans',
      'payrolls',
      'salary_increments',
      'time_entries',
      'timesheets',
      'time_off_requests',
      'tax_documents',
      'weekly_timesheets',
      'project_manpower',
      'equipment_rental_history',
      'equipment_maintenance'
    ];

    let relatedDataDeleted = 0;
    
    // Delete all related data first
    for (const table of tablesToClear) {
      try {
        if (table === 'equipment_maintenance') {
          // Special case for equipment_maintenance which uses assigned_to_employee_id
          const result = await db.execute(sql`DELETE FROM ${sql.identifier(table)} WHERE assigned_to_employee_id = ${employeeId}`);
          if (result.rowCount && result.rowCount > 0) {
            relatedDataDeleted += result.rowCount;
            console.log(`✅ Deleted ${result.rowCount} records from ${table}`);
          }
        } else {
          // Delete from tables that reference employee_id
          const result = await db.execute(sql`DELETE FROM ${sql.identifier(table)} WHERE employee_id = ${employeeId}`);
          if (result.rowCount && result.rowCount > 0) {
            relatedDataDeleted += result.rowCount;
            console.log(`✅ Deleted ${result.rowCount} records from ${table}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not delete from table ${table}:`, error);
      }
    }

    // Now delete the employee
    const result = await db
      .delete(employeesTable)
      .where(sql`id = ${employeeId}`)
      .returning({ id: employeesTable.id, firstName: employeesTable.firstName, lastName: employeesTable.lastName });
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Employee deleted successfully`);

    return NextResponse.json({
      success: true,
      message: 'Employee and all related data deleted successfully',
      deletedEmployee: result[0],
      relatedDataDeleted: relatedDataDeleted,
      summary: `Deleted employee ID ${employeeId} and ${relatedDataDeleted} related records`
    });

  } catch (error) {
    console.error('❌ Error deleting employee:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete employee',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
