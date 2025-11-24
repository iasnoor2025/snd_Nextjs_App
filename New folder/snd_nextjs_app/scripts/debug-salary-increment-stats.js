const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function debugSalaryIncrementStats() {
  try {
    console.log('🔍 Debugging Salary Increment Statistics...\n');

    // 1. Check all records
    console.log('1. All Salary Increment Records:');
    const allRecords = await sql`
      SELECT id, status, increment_type, increment_amount, increment_percentage, effective_date
      FROM salary_increments 
      ORDER BY id
    `;
    
    if (allRecords.length === 0) {
      console.log('   No records found');
    } else {
      allRecords.forEach(record => {
        console.log(`   ID: ${record.id}, Status: ${record.status}, Type: ${record.increment_type}, Amount: ${record.increment_amount || 'N/A'}, Percentage: ${record.increment_percentage || 'N/A'}`);
      });
    }

    // 2. Check status counts
    console.log('\n2. Status Counts:');
    const statusCounts = await sql`
      SELECT status, count(*) as count
      FROM salary_increments 
      GROUP BY status
      ORDER BY status
    `;
    
    statusCounts.forEach(item => {
      console.log(`   ${item.status}: ${item.count}`);
    });

    // 3. Check total count
    console.log('\n3. Total Count:');
    const totalCount = await sql`
      SELECT count(*) as total
      FROM salary_increments
    `;
    console.log(`   Total: ${totalCount[0].total}`);

    // 4. Check for any NULL or unexpected values
    console.log('\n4. Data Quality Check:');
    const nullStatus = await sql`
      SELECT count(*) as count
      FROM salary_increments 
      WHERE status IS NULL
    `;
    console.log(`   Records with NULL status: ${nullStatus[0].count}`);

    const invalidStatus = await sql`
      SELECT count(*) as count
      FROM salary_increments 
      WHERE status NOT IN ('pending', 'approved', 'rejected', 'applied')
    `;
    console.log(`   Records with invalid status: ${invalidStatus[0].count}`);

    // 5. Check for any hidden characters or formatting issues
    console.log('\n5. Status Values (with length):');
    const statusValues = await sql`
      SELECT DISTINCT status, length(status) as status_length
      FROM salary_increments 
      ORDER BY status
    `;
    
    statusValues.forEach(item => {
      console.log(`   Status: "${item.status}" (length: ${item.status_length})`);
    });

    // 6. Calculate what the frontend should show
    console.log('\n6. Expected Frontend Display:');
    const expectedStats = {
      total_increments: totalCount[0].total,
      pending_increments: statusCounts.find(s => s.status === 'pending')?.count || 0,
      applied_increments: statusCounts.find(s => s.status === 'applied')?.count || 0,
      approved_increments: statusCounts.find(s => s.status === 'approved')?.count || 0,
      rejected_increments: statusCounts.find(s => s.status === 'rejected')?.count || 0,
    };
    
    console.log(`   Total Increments: ${expectedStats.total_increments}`);
    console.log(`   Pending: ${expectedStats.pending_increments}`);
    console.log(`   Applied: ${expectedStats.applied_increments}`);
    console.log(`   Approved: ${expectedStats.approved_increments}`);
    console.log(`   Rejected: ${expectedStats.rejected_increments}`);
    
    // 7. Check if there are any deleted records
    console.log('\n7. Check for deleted records:');
    const deletedRecords = await sql`
      SELECT count(*) as count
      FROM salary_increments 
      WHERE deleted_at IS NOT NULL
    `;
    console.log(`   Records with deleted_at: ${deletedRecords[0].count}`);

  } catch (error) {
    console.error('Error debugging salary increment stats:', error);
  } finally {
    await sql.end();
  }
}

debugSalaryIncrementStats();
