import { db } from '../../src/lib/db';
import { sql } from 'drizzle-orm';

export async function addExternalEmployeeCompanyName() {
  try {
    // Add is_external column
    await db.execute(sql`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false NOT NULL;
    `);
    console.log('✅ Added is_external column to employees table');

    // Add company_name column
    await db.execute(sql`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS company_name TEXT;
    `);
    console.log('✅ Added company_name column to employees table');
  } catch (error) {
    console.error('❌ Error adding external employee fields:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addExternalEmployeeCompanyName()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

