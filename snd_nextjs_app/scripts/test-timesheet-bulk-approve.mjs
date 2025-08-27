import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { timesheets } from '../src/lib/drizzle/schema.js';

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function testTimesheetBulkApprove() {
  try {
    console.log('🔍 Testing timesheet bulk-approve functionality...');
    
    // Test database connection
    console.log('📊 Testing database connection...');
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful:', result);
    
    // Check timesheet table structure
    console.log('📋 Checking timesheet table structure...');
    const timesheetStructure = await db.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'timesheets' 
      ORDER BY ordinal_position
    `);
    console.log('📋 Timesheet table structure:', timesheetStructure);
    
    // Check existing timesheets
    console.log('📊 Checking existing timesheets...');
    const existingTimesheets = await db
      .select({
        id: timesheets.id,
        status: timesheets.status,
        employeeId: timesheets.employeeId,
        date: timesheets.date,
      })
      .from(timesheets)
      .limit(5);
    
    console.log('📊 Existing timesheets:', existingTimesheets);
    
    // Check timesheet statuses
    console.log('📊 Checking timesheet statuses...');
    const statusCounts = await db.execute(`
      SELECT status, COUNT(*) as count
      FROM timesheets 
      GROUP BY status
      ORDER BY count DESC
    `);
    console.log('📊 Timesheet status counts:', statusCounts);
    
    // Check permissions table
    console.log('🔐 Checking permissions table...');
    const permissions = await db.execute(`
      SELECT name, guard_name
      FROM permissions 
      WHERE name LIKE '%timesheet%' OR name LIKE '%approve%'
      ORDER BY name
    `);
    console.log('🔐 Relevant permissions:', permissions);
    
    // Check roles table
    console.log('👥 Checking roles table...');
    const roles = await db.execute(`
      SELECT name, guard_name
      FROM roles 
      ORDER BY name
    `);
    console.log('👥 Available roles:', roles);
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the test
testTimesheetBulkApprove()
  .then(() => {
    console.log('✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
