import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
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
      'equipment_maintenance',
      'employees'
    ];

    let totalCleared = 0;
    
    // Clear each table in order
    for (const table of tablesToClear) {
      try {
        if (table === 'equipment_maintenance') {
          // Special case for equipment_maintenance which uses assigned_to_employee_id
          await db.execute(sql`DELETE FROM ${sql.identifier(table)} WHERE assigned_to_employee_id IS NOT NULL`);
        } else if (table === 'employees') {
          // Clear the main employees table
          await db.execute(sql`DELETE FROM ${sql.identifier(table)}`);
        } else {
          // Clear tables that reference employee_id
          await db.execute(sql`DELETE FROM ${sql.identifier(table)} WHERE employee_id IS NOT NULL`);
        }
        totalCleared++;
      } catch (error) {
        console.warn(`⚠️ Could not clear table ${table}:`, error);
      }
    }
    return NextResponse.json({
      success: true,
      message: 'Database reset completed successfully. All employee data has been cleared.',
      tablesCleared: totalCleared,
      nextStep: 'Run the sync API endpoint to import fresh data from ERPNext'
    });

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reset database',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
