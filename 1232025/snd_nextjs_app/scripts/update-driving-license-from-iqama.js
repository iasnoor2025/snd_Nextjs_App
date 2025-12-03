const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { employees } = require('../src/lib/drizzle/schema');

// Database connection
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function updateDrivingLicenseFromIqama() {
  try {
    console.log('Starting to update driving license numbers from iqama numbers...');
    
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

    console.log(`Found ${employeesToUpdate.length} employees with iqama numbers but missing driving license numbers.`);

    if (employeesToUpdate.length === 0) {
      console.log('No employees need to be updated.');
      return;
    }

    // Update each employee
    let updatedCount = 0;
    for (const employee of employeesToUpdate) {
      try {
        await db
          .update(employees)
          .set({
            drivingLicenseNumber: employee.iqamaNumber,
            updatedAt: new Date(),
          })
          .where(sql`${employees.id} = ${employee.id}`);

        console.log(`✅ Updated employee: ${employee.firstName} ${employee.lastName} (${employee.fileNumber}) - Iqama: ${employee.iqamaNumber} → Driving License: ${employee.iqamaNumber}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Failed to update employee ${employee.id}:`, error);
      }
    }

    console.log(`\n🎉 Update completed!`);
    console.log(`Total employees processed: ${employeesToUpdate.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Failed to update: ${employeesToUpdate.length - updatedCount}`);

  } catch (error) {
    console.error('Error updating driving license numbers:', error);
  } finally {
    await sql.end();
  }
}

// Run the update
updateDrivingLicenseFromIqama();
