import { db } from '@/lib/db';
import { employees as employeesTable } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🔍 Finding duplicate employees...');
    
    // Find duplicates by file_number
    const duplicateFileNumbers = await db
      .select({
        fileNumber: employeesTable.fileNumber,
        count: sql<number>`count(*)`,
        ids: sql<string>`array_agg(id::text ORDER BY updated_at DESC)`,
        erpnextIds: sql<string>`array_agg(COALESCE(erpnext_id, 'NULL'))`
      })
      .from(employeesTable)
      .where(sql`file_number IS NOT NULL`)
      .groupBy(employeesTable.fileNumber)
      .having(sql`count(*) > 1`);

    console.log(`Found ${duplicateFileNumbers.length} duplicate file numbers`);
    
    // Find duplicates by erpnext_id
    const duplicateErpnextIds = await db
      .select({
        erpnextId: employeesTable.erpnextId,
        count: sql<number>`count(*)`,
        ids: sql<string>`array_agg(id::text ORDER BY updated_at DESC)`,
        fileNumbers: sql<string>`array_agg(COALESCE(file_number, 'NULL'))`
      })
      .from(employeesTable)
      .where(sql`erpnext_id IS NOT NULL`)
      .groupBy(employeesTable.erpnextId)
      .having(sql`count(*) > 1`);

    console.log(`Found ${duplicateErpnextIds.length} duplicate ERPNext IDs`);
    
    // Find duplicates by name combination
    const duplicateNames = await db
      .select({
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        count: sql<number>`count(*)`,
        ids: sql<string>`array_agg(id ORDER BY 
          CASE 
            WHEN file_number IS NOT NULL THEN 1 
            ELSE 0 
          END DESC,
          updated_at DESC
        )`,
        fileNumbers: sql<string>`array_agg(COALESCE(file_number, 'NULL'))`
      })
      .from(employeesTable)
      .where(sql`first_name IS NOT NULL AND last_name IS NOT NULL`)
      .groupBy(employeesTable.firstName, employeesTable.lastName)
      .having(sql`count(*) > 1`);

    console.log(`Found ${duplicateNames.length} duplicate names`);

    let removedCount = 0;
    
    // Remove duplicates by file_number (keep most recent)
    for (const dup of duplicateFileNumbers) {
      const ids = dup.ids as string[];
      const keepId = ids[0]; // Keep the most recent
      const removeIds = ids.slice(1);
      
      console.log(`📁 File Number: ${dup.fileNumber} - Keeping ID: ${keepId}, Removing: ${removeIds.join(', ')}`);
      
      for (const removeId of removeIds) {
        try {
          // First, clear references from related tables
          await db.execute(sql`UPDATE advance_payment_histories SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE advance_payments SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_assignments SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_documents SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_leaves SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_performance_reviews SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_resignations SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_salaries SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_skill SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_training SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE loans SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE payrolls SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE salary_increments SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE time_entries SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE timesheets SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE time_off_requests SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE tax_documents SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE weekly_timesheets SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE project_manpower SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE equipment_rental_history SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE equipment_maintenance SET assigned_to_employee_id = NULL WHERE assigned_to_employee_id = ${parseInt(removeId)}`);
          
          // Now delete the employee
          await db
            .delete(employeesTable)
            .where(sql`id = ${parseInt(removeId)}`);
          
          removedCount++;
        } catch (error) {
          console.error(`Failed to remove employee ${removeId}:`, error);
        }
      }
    }

    // Remove duplicates by erpnext_id (keep most recent)
    for (const dup of duplicateErpnextIds) {
      const ids = dup.ids as string[];
      const keepId = ids[0]; // Keep the most recent
      const removeIds = ids.slice(1);
      
      console.log(`🔄 ERPNext ID: ${dup.erpnextId} - Keeping ID: ${keepId}, Removing: ${removeIds.join(', ')}`);
      
      for (const removeId of removeIds) {
        try {
          // First, clear references from related tables
          await db.execute(sql`UPDATE advance_payment_histories SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE advance_payments SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_assignments SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_documents SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_leaves SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_performance_reviews SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_resignations SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_salaries SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_skill SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_training SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE loans SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE payrolls SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE salary_increments SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE time_entries SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE timesheets SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE time_off_requests SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE tax_documents SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE weekly_timesheets SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE project_manpower SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE equipment_rental_history SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE equipment_maintenance SET assigned_to_employee_id = NULL WHERE assigned_to_employee_id = ${parseInt(removeId)}`);
          
          // Now delete the employee
          await db
            .delete(employeesTable)
            .where(sql`id = ${parseInt(removeId)}`);
          
          removedCount++;
        } catch (error) {
          console.error(`Failed to remove employee ${removeId}:`, error);
        }
      }
    }

    // Remove duplicates by name (keep the one with file_number or most recent)
    for (const dup of duplicateNames) {
      const ids = dup.ids as string[];
      const keepId = ids[0]; // Keep the one with file_number or most recent
      const removeIds = ids.slice(1);
      
      console.log(`👤 Name: ${dup.firstName} ${dup.lastName} - Keeping ID: ${keepId}, Removing: ${removeIds.join(', ')}`);
      
      for (const removeId of removeIds) {
        try {
          // First, clear references from related tables
          await db.execute(sql`UPDATE advance_payment_histories SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE advance_payments SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_assignments SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_documents SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_leaves SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_performance_reviews SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_resignations SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_salaries SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_skill SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE employee_training SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE loans SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE payrolls SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE salary_increments SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE time_entries SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE timesheets SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE time_off_requests SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE tax_documents SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE weekly_timesheets SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE project_manpower SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE equipment_rental_history SET employee_id = NULL WHERE employee_id = ${parseInt(removeId)}`);
          await db.execute(sql`UPDATE equipment_maintenance SET assigned_to_employee_id = NULL WHERE assigned_to_employee_id = ${parseInt(removeId)}`);
          
          // Now delete the employee
          await db
            .delete(employeesTable)
            .where(sql`id = ${parseInt(removeId)}`);
          
          removedCount++;
        } catch (error) {
          console.error(`Failed to remove employee ${removeId}:`, error);
        }
      }
    }

    // Clear all remaining employees for fresh sync
    console.log('\n🧹 Clearing all remaining employees for fresh sync...');
    
    try {
      // First, clear all employee references from related tables
      await db.execute(sql`UPDATE advance_payment_histories SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE advance_payments SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE employee_assignments SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE employee_documents SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE employee_leaves SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE employee_performance_reviews SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE employee_resignations SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE employee_salaries SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE employee_skill SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE employee_training SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE loans SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE payrolls SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE salary_increments SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE time_entries SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE timesheets SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE time_off_requests SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE tax_documents SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE weekly_timesheets SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE project_manpower SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE equipment_rental_history SET employee_id = NULL WHERE employee_id IS NOT NULL`);
      await db.execute(sql`UPDATE equipment_maintenance SET assigned_to_employee_id = NULL WHERE assigned_to_employee_id IS NOT NULL`);
      
      // Now delete all employees
      await db.delete(employeesTable);
      
      const totalCleared = removedCount;

      console.log(`✅ Total employees processed: ${totalCleared}`);
      console.log(`   - Duplicates removed: ${removedCount}`);
      console.log(`   - All employees cleared for fresh sync`);

      return NextResponse.json({
        success: true,
        message: `Employee duplicates fixed and data cleared for fresh sync`,
        summary: {
          duplicateFileNumbers: duplicateFileNumbers.length,
          duplicateErpnextIds: duplicateErpnextIds.length,
          duplicateNames: duplicateNames.length,
          duplicatesRemoved: removedCount,
          totalCleared: totalCleared
        },
        nextStep: 'Run the sync API endpoint to import fresh data from ERPNext'
      });
    } catch (error) {
      console.error('Error clearing remaining employees:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fixing duplicates:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fix employee duplicates',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
