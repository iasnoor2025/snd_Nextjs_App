import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('🔍 Validating database schema...');
    
    // Get all tables from the database
    const dbTablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const dbTables = (dbTablesResult as any).map((row: any) => row.table_name);
    
    // Get expected tables from Drizzle schema
    const expectedTables = [
      'analytics_reports',
      'advance_payment_histories',
      'equipment_rental_history',
      'companies',
      'employee_assignments',
      'locations',
      'project_resources',
      'prisma_migrations',
      'salary_increments',
      'equipment_maintenance',
      'equipment_maintenance_items',
      'geofence_zones',
      'media',
      'password_reset_tokens',
      'sessions',
      'cache',
      'jobs',
      'failed_jobs',
      'personal_access_tokens',
      'telescope_entries',
      'telescope_entry_tags',
      'telescope_monitoring',
      'rentals',
      'departments',
      'designations',
      'employee_documents',
      'employee_leaves',
      'employee_performance_reviews',
      'employee_resignations',
      'employee_salaries',
      'employee_skill',
      'employee_training',
      'employees',
      'loans',
      'organizational_units',
      'payroll_items',
      'payroll_runs',
      'payrolls',
      'projects',
      'skills',
      'tax_document_payrolls',
      'tax_documents',
      'timesheets',
      'trainings',
      'users',
      'time_entries',
      'customers',
      'equipment',
      'permissions',
      'rental_items',
      'rental_operator_assignments',
      'roles',
      'time_off_requests',
      'timesheet_approvals',
      'weekly_timesheets',
      'model_has_roles',
      'role_has_permissions',
      'model_has_permissions',
      'advance_payments'
    ];
    
    // Find missing and extra tables
    const missingTables = expectedTables.filter(table => !dbTables.includes(table));
    const extraTables = dbTables.filter((table: string) => !expectedTables.includes(table));
    
    // Check table structures for key tables
    const tableStructureChecks: any[] = [];
    
    for (const tableName of expectedTables.slice(0, 10)) { // Check first 10 tables
      try {
        const columnsResult = await db.execute(sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = ${tableName}
          ORDER BY ordinal_position
        `);
        
        tableStructureChecks.push({
          table: tableName,
          columns: (columnsResult as any).map((col: any) => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default
          }))
        });
      } catch (error) {
        tableStructureChecks.push({
          table: tableName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Check foreign key constraints
    const foreignKeyChecks = await db.execute(sql`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    const validationResult = {
      success: true,
      message: 'Schema validation completed',
      summary: {
        totalExpectedTables: expectedTables.length,
        totalDbTables: dbTables.length,
        missingTables: missingTables.length,
        extraTables: extraTables.length
      },
      details: {
        missingTables,
        extraTables,
        tableStructures: tableStructureChecks,
        foreignKeys: (foreignKeyChecks as any).map((fk: any) => ({
          table: fk.table_name,
          column: fk.column_name,
          references: `${fk.foreign_table_name}.${fk.foreign_column_name}`
        }))
      }
    };
    
    // Check if there are critical issues
    const hasCriticalIssues = missingTables.length > 0 || extraTables.length > 0;
    
    if (hasCriticalIssues) {
      validationResult.message = 'Schema validation completed with issues found';
      console.log('⚠️ Schema validation found issues:', validationResult);
    } else {
      console.log('✅ Schema validation completed successfully');
    }
    
    return NextResponse.json(validationResult);
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Schema validation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
