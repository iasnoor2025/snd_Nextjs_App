import { db } from '../src/lib/db';
import { employees as employeesTable } from '../src/lib/drizzle/schema';
import { sql } from 'drizzle-orm';

async function findAndFixDuplicates() {
  console.log('🔍 Finding duplicate employees...');
  
  try {
    // Find duplicates by file_number
    const duplicateFileNumbers = await db
      .select({
        fileNumber: employeesTable.fileNumber,
        count: sql<number>`count(*)`,
        ids: sql<string>`array_agg(id::text)`,
        erpnextIds: sql<string>`array_agg(COALESCE(erpnext_id, 'NULL'))`
      })
      .from(employeesTable)
      .where(sql`file_number IS NOT NULL`)
      .groupBy(employeesTable.fileNumber)
      .having(sql`count(*) > 1`);

    console.log(`Found ${duplicateFileNumbers.length} duplicate file numbers:`);
    
    for (const dup of duplicateFileNumbers) {
      console.log(`\n📁 File Number: ${dup.fileNumber}`);
      console.log(`   Count: ${dup.count}`);
      console.log(`   IDs: ${dup.ids}`);
      console.log(`   ERPNext IDs: ${dup.erpnextIds}`);
    }

    // Find duplicates by erpnext_id
    const duplicateErpnextIds = await db
      .select({
        erpnextId: employeesTable.erpnextId,
        count: sql<number>`count(*)`,
        ids: sql<string>`array_agg(id::text)`,
        fileNumbers: sql<string>`array_agg(COALESCE(file_number, 'NULL'))`
      })
      .from(employeesTable)
      .where(sql`erpnext_id IS NOT NULL`)
      .groupBy(employeesTable.erpnextId)
      .having(sql`count(*) > 1`);

    console.log(`\nFound ${duplicateErpnextIds.length} duplicate ERPNext IDs:`);
    
    for (const dup of duplicateErpnextIds) {
      console.log(`\n🔄 ERPNext ID: ${dup.erpnextId}`);
      console.log(`   Count: ${dup.count}`);
      console.log(`   IDs: ${dup.ids}`);
      console.log(`   File Numbers: ${dup.fileNumbers}`);
    }

    // Find duplicates by name combination
    const duplicateNames = await db
      .select({
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        count: sql<number>`count(*)`,
        ids: sql<string>`array_agg(id::text)`,
        fileNumbers: sql<string>`array_agg(COALESCE(file_number, 'NULL'))`
      })
      .from(employeesTable)
      .where(sql`first_name IS NOT NULL AND last_name IS NOT NULL`)
      .groupBy(employeesTable.firstName, employeesTable.lastName)
      .having(sql`count(*) > 1`);

    console.log(`\nFound ${duplicateNames.length} duplicate names:`);
    
    for (const dup of duplicateNames) {
      console.log(`\n👤 Name: ${dup.firstName} ${dup.lastName}`);
      console.log(`   Count: ${dup.count}`);
      console.log(`   IDs: ${dup.ids}`);
      console.log(`   File Numbers: ${dup.fileNumbers}`);
    }

    return {
      duplicateFileNumbers,
      duplicateErpnextIds,
      duplicateNames
    };
  } catch (error) {
    console.error('❌ Error finding duplicates:', error);
    throw error;
  }
}

async function removeDuplicates() {
  console.log('\n🗑️ Removing duplicate employees...');
  
  try {
    // Strategy: Keep the most recent record for each duplicate
    // For file_number duplicates
    const duplicateFileNumbers = await db
      .select({
        fileNumber: employeesTable.fileNumber,
        count: sql<number>`count(*)`,
        ids: sql<string>`array_agg(id ORDER BY updated_at DESC)`
      })
      .from(employeesTable)
      .where(sql`file_number IS NOT NULL`)
      .groupBy(employeesTable.fileNumber)
      .having(sql`count(*) > 1`);

    let removedCount = 0;
    
    for (const dup of duplicateFileNumbers) {
      const ids = dup.ids as string[];
      const keepId = ids[0]; // Keep the most recent (first in DESC order)
      const removeIds = ids.slice(1);
      
      console.log(`\n📁 File Number: ${dup.fileNumber}`);
      console.log(`   Keeping ID: ${keepId}`);
      console.log(`   Removing IDs: ${removeIds.join(', ')}`);
      
      // Remove duplicates
      for (const removeId of removeIds) {
        await db
          .delete(employeesTable)
          .where(sql`id = ${parseInt(removeId)}`);
        removedCount++;
      }
    }

    // For erpnext_id duplicates
    const duplicateErpnextIds = await db
      .select({
        erpnextId: employeesTable.erpnextId,
        count: sql<number>`count(*)`,
        ids: sql<string>`array_agg(id ORDER BY updated_at DESC)`
      })
      .from(employeesTable)
      .where(sql`erpnext_id IS NOT NULL`)
      .groupBy(employeesTable.erpnextId)
      .having(sql`count(*) > 1`);

    for (const dup of duplicateErpnextIds) {
      const ids = dup.ids as string[];
      const keepId = ids[0]; // Keep the most recent
      const removeIds = ids.slice(1);
      
      console.log(`\n🔄 ERPNext ID: ${dup.erpnextId}`);
      console.log(`   Keeping ID: ${keepId}`);
      console.log(`   Removing IDs: ${removeIds.join(', ')}`);
      
      // Remove duplicates
      for (const removeId of removeIds) {
        await db
          .delete(employeesTable)
          .where(sql`id = ${parseInt(removeId)}`);
        removedCount++;
      }
    }

    // For name duplicates (keep the one with most complete data)
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
        )`
      })
      .from(employeesTable)
      .where(sql`first_name IS NOT NULL AND last_name IS NOT NULL`)
      .groupBy(employeesTable.firstName, employeesTable.lastName)
      .having(sql`count(*) > 1`);

    for (const dup of duplicateNames) {
      const ids = dup.ids as string[];
      const keepId = ids[0]; // Keep the one with file_number or most recent
      const removeIds = ids.slice(1);
      
      console.log(`\n👤 Name: ${dup.firstName} ${dup.lastName}`);
      console.log(`   Keeping ID: ${keepId}`);
      console.log(`   Removing IDs: ${removeIds.join(', ')}`);
      
      // Remove duplicates
      for (const removeId of removeIds) {
        await db
          .delete(employeesTable)
          .where(sql`id = ${parseInt(removeId)}`);
        removedCount++;
      }
    }

    console.log(`\n✅ Removed ${removedCount} duplicate employees`);
    return removedCount;
  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
    throw error;
  }
}

async function clearAllEmployees() {
  console.log('\n🧹 Clearing all existing employees for fresh sync...');
  
  try {
    const result = await db
      .delete(employeesTable)
      .returning({ id: employeesTable.id });
    
    console.log(`✅ Cleared ${result.length} employees from database`);
    return result.length;
  } catch (error) {
    console.error('❌ Error clearing employees:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Employee Duplicate Fix and Fresh Sync Script');
  console.log('==============================================\n');
  
  try {
    // Step 1: Find duplicates
    const duplicates = await findAndFixDuplicates();
    
    if (duplicates.duplicateFileNumbers.length === 0 && 
        duplicates.duplicateErpnextIds.length === 0 && 
        duplicates.duplicateNames.length === 0) {
      console.log('\n✅ No duplicates found!');
    } else {
      // Step 2: Remove duplicates
      const removedCount = await removeDuplicates();
      
      if (removedCount > 0) {
        console.log('\n🔄 Duplicates removed. Now clearing all employees for fresh sync...');
        
        // Step 3: Clear all employees for fresh sync
        await clearAllEmployees();
        
        console.log('\n🎯 Ready for fresh ERPNext sync!');
        console.log('Run the sync API endpoint to import fresh data from ERPNext.');
      }
    }
    
    console.log('\n✨ Script completed successfully!');
  } catch (error) {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
