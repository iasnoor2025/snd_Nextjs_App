import { db } from '@/lib/db';
import { employees as employeesTable } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { employeeIds, fileNumbers, names } = await request.json();
    
    if (!employeeIds && !fileNumbers && !names) {
      return NextResponse.json(
        { success: false, message: 'Please provide employeeIds, fileNumbers, or names array' },
        { status: 400 }
      );
    }

    let employeeIdsToDelete: number[] = [];
    
    // Get employee IDs based on the provided criteria
    if (employeeIds && Array.isArray(employeeIds)) {
      employeeIdsToDelete = employeeIds;
    } else if (fileNumbers && Array.isArray(fileNumbers)) {
      const employees = await db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(sql`file_number = ANY(${fileNumbers})`);
      employeeIdsToDelete = employees.map(e => e.id);
    } else if (names && Array.isArray(names)) {
      const nameConditions = names.map(name => {
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ');
        return sql`(first_name = ${firstName} AND last_name = ${lastName})`;
      });
      
      const employees = await db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(sql`(${sql.join(nameConditions, sql` OR `)})`);
      employeeIdsToDelete = employees.map(e => e.id);
    }

    if (employeeIdsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No employees found to delete' },
        { status: 404 }
      );
    }
    // List of all tables that reference employees
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

    let totalRelatedDataDeleted = 0;
    
    // Delete all related data first
    for (const table of tablesToClear) {
      try {
        if (table === 'equipment_maintenance') {
          // Special case for equipment_maintenance which uses assigned_to_employee_id
          const result = await db.execute(sql`DELETE FROM ${sql.identifier(table)} WHERE assigned_to_employee_id = ANY(${employeeIdsToDelete})`);
          if (result.rowCount && result.rowCount > 0) {
            totalRelatedDataDeleted += result.rowCount;
          }
        } else {
          // Delete from tables that reference employee_id
          const result = await db.execute(sql`DELETE FROM ${sql.identifier(table)} WHERE employee_id = ANY(${employeeIdsToDelete})`);
          if (result.rowCount && result.rowCount > 0) {
            totalRelatedDataDeleted += result.rowCount;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not delete from table ${table}:`, error);
      }
    }

    // Now delete the employees
    const deletedEmployees = await db
      .delete(employeesTable)
      .where(sql`id = ANY(${employeeIdsToDelete})`)
      .returning({ id: employeesTable.id, firstName: employeesTable.firstName, lastName: employeesTable.lastName, fileNumber: employeesTable.fileNumber });
    return NextResponse.json({
      success: true,
      message: `Bulk delete completed successfully. ${deletedEmployees.length} employees and all related data deleted.`,
      deletedEmployees: deletedEmployees,
      totalEmployeesDeleted: deletedEmployees.length,
      relatedDataDeleted: totalRelatedDataDeleted,
      summary: `Deleted ${deletedEmployees.length} employees and ${totalRelatedDataDeleted} related records`
    });

  } catch (error) {
    console.error('❌ Error bulk deleting employees:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to bulk delete employees',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
