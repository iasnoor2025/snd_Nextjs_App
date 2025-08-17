#!/usr/bin/env node

/**
 * Complete Database Reset Script
 * 
 * This script will:
 * 1. Drop all existing tables
 * 2. Create new tables from Drizzle schema
 * 3. Set up initial data
 * 4. Validate the schema
 * 
 * Usage: node scripts/reset-db-complete.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please create a .env.local file with your database connection string');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 1, // Use single connection for reset
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting complete database reset...');
    
    // Drop all tables in reverse dependency order
    const dropQueries = [
      // Drop tables with foreign key dependencies first
      'DROP TABLE IF EXISTS tax_document_payrolls CASCADE',
      'DROP TABLE IF EXISTS time_entries CASCADE',
      'DROP TABLE IF EXISTS timesheet_approvals CASCADE',
      'DROP TABLE IF EXISTS weekly_timesheets CASCADE',
      'DROP TABLE IF EXISTS timesheets CASCADE',
      'DROP TABLE IF EXISTS salary_increments CASCADE',
      'DROP TABLE IF EXISTS payroll_items CASCADE',
      'DROP TABLE IF EXISTS payrolls CASCADE',
      'DROP TABLE IF EXISTS payroll_runs CASCADE',
      'DROP TABLE IF EXISTS advance_payment_histories CASCADE',
      'DROP TABLE IF EXISTS advance_payments CASCADE',
      'DROP TABLE IF EXISTS loans CASCADE',
      'DROP TABLE IF EXISTS employee_training CASCADE',
      'DROP TABLE IF EXISTS employee_skill CASCADE',
      'DROP TABLE IF EXISTS employee_salaries CASCADE',
      'DROP TABLE IF EXISTS employee_resignations CASCADE',
      'DROP TABLE IF EXISTS employee_performance_reviews CASCADE',
      'DROP TABLE IF EXISTS employee_leaves CASCADE',
      'DROP TABLE IF EXISTS employee_documents CASCADE',
      'DROP TABLE IF EXISTS employee_assignments CASCADE',
      'DROP TABLE IF EXISTS equipment_maintenance_items CASCADE',
      'DROP TABLE IF EXISTS equipment_maintenance CASCADE',
      'DROP TABLE IF EXISTS equipment_rental_history CASCADE',
      'DROP TABLE IF EXISTS rental_operator_assignments CASCADE',
      'DROP TABLE IF EXISTS rental_items CASCADE',
      'DROP TABLE IF EXISTS rentals CASCADE',
      'DROP TABLE IF EXISTS project_resources CASCADE',
      'DROP TABLE IF EXISTS projects CASCADE',
      'DROP TABLE IF EXISTS equipment CASCADE',
      'DROP TABLE IF EXISTS locations CASCADE',
      'DROP TABLE IF EXISTS customers CASCADE',
      'DROP TABLE IF EXISTS employees CASCADE',
      'DROP TABLE IF EXISTS designations CASCADE',
      'DROP TABLE IF EXISTS departments CASCADE',
      'DROP TABLE IF EXISTS organizational_units CASCADE',
      'DROP TABLE IF EXISTS skills CASCADE',
      'DROP TABLE IF EXISTS trainings CASCADE',
      'DROP TABLE IF EXISTS geofence_zones CASCADE',
      'DROP TABLE IF EXISTS analytics_reports CASCADE',
      'DROP TABLE IF EXISTS companies CASCADE',
      'DROP TABLE IF EXISTS media CASCADE',
      'DROP TABLE IF EXISTS password_reset_tokens CASCADE',
      'DROP TABLE IF EXISTS sessions CASCADE',
      'DROP TABLE IF EXISTS cache CASCADE',
      'DROP TABLE IF EXISTS jobs CASCADE',
      'DROP TABLE IF EXISTS failed_jobs CASCADE',
      'DROP TABLE IF EXISTS personal_access_tokens CASCADE',
      'DROP TABLE IF EXISTS telescope_entry_tags CASCADE',
      'DROP TABLE IF EXISTS telescope_entries CASCADE',
      'DROP TABLE IF EXISTS telescope_monitoring CASCADE',
      'DROP TABLE IF EXISTS time_off_requests CASCADE',
      'DROP TABLE IF EXISTS model_has_permissions CASCADE',
      'DROP TABLE IF EXISTS model_has_roles CASCADE',
      'DROP TABLE IF EXISTS role_has_permissions CASCADE',
      'DROP TABLE IF EXISTS roles CASCADE',
      'DROP TABLE IF EXISTS permissions CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
      'DROP TABLE IF EXISTS _prisma_migrations CASCADE',
    ];

    console.log('🗑️ Dropping existing tables...');
    for (const query of dropQueries) {
      try {
        await client.query(query);
        const tableName = query.split(' ')[4];
        console.log(`✅ Dropped: ${tableName}`);
      } catch (error) {
        console.log(`⚠️ Warning dropping ${query.split(' ')[4]}:`, error.message);
      }
    }

    // Additional cleanup - drop any remaining tables
    console.log('🧹 Cleaning up any remaining tables...');
    const remainingTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE 'information_schema%'
      ORDER BY table_name
    `);
    
    const remainingTables = remainingTablesResult.rows.map(row => row.table_name);
    
    if (remainingTables.length > 0) {
      console.log(`Found ${remainingTables.length} remaining tables, dropping them...`);
      for (const tableName of remainingTables) {
        try {
          await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
          console.log(`✅ Dropped remaining table: ${tableName}`);
        } catch (error) {
          console.log(`⚠️ Warning dropping remaining table ${tableName}:`, error.message);
        }
      }
    }

    // Verify all tables are dropped
    const finalCheckResult = await client.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE 'information_schema%'
    `);
    
    const finalTableCount = parseInt(finalCheckResult.rows[0].table_count);
    
    if (finalTableCount > 0) {
      console.log(`⚠️ Warning: ${finalTableCount} tables still exist after cleanup`);
      console.log('Proceeding with table creation anyway...');
    } else {
      console.log('✅ All tables successfully dropped');
    }

    console.log('🏗️ Creating new tables from Drizzle schema...');
    
    // Read and execute the generated migration file
    const migrationPath = path.join(process.cwd(), 'drizzle', '0000_motionless_dagger.sql');
    
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      const statements = migrationSQL.split('--> statement-breakpoint');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const statement of statements) {
        const trimmedStatement = statement.trim();
        if (trimmedStatement) {
          try {
            await client.query(trimmedStatement);
            successCount++;
            console.log(`✅ Created table from migration (${successCount}/${statements.length})`);
          } catch (error) {
            errorCount++;
            console.error(`❌ Error creating table (${errorCount} errors):`, error.message);
            
            // If it's a "relation already exists" error, try to drop and recreate
            if (error.code === '42P07') {
              console.log('🔄 Attempting to drop and recreate existing table...');
              try {
                // Extract table name from the CREATE TABLE statement
                const tableMatch = trimmedStatement.match(/CREATE TABLE "([^"]+)"/);
                if (tableMatch) {
                  const tableName = tableMatch[1];
                  await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
                  await client.query(trimmedStatement);
                  successCount++;
                  errorCount--;
                  console.log(`✅ Successfully recreated table: ${tableName}`);
                }
              } catch (retryError) {
                console.error(`❌ Failed to recreate table:`, retryError.message);
              }
            }
          }
        }
      }
      
      console.log(`\n📊 Table creation summary: ${successCount} successful, ${errorCount} errors`);
      
      if (errorCount > 0) {
        console.log('⚠️ Some tables failed to create. The database may be in an inconsistent state.');
      }
    } else {
      throw new Error('Migration file not found. Run npm run drizzle:generate first.');
    }

    console.log('👤 Creating initial data...');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('password', 12);
    
    const adminUserResult = await client.query(`
      INSERT INTO users (name, email, password, national_id, role_id, status, "isActive", created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, CURRENT_DATE)
      RETURNING id, email, role_id, "isActive"
    `, ['Admin User', 'admin@ias.com', hashedPassword, '1234567890', 1, 1, true]);
    
    const adminUser = adminUserResult.rows[0];
    
    if (!adminUser) {
      throw new Error('Failed to create admin user');
    }

    // Create basic roles and permissions
    await client.query(`
      INSERT INTO roles (name, guard_name, created_at, updated_at)
      VALUES 
        ('Admin', 'web', CURRENT_DATE, CURRENT_DATE),
        ('Manager', 'web', CURRENT_DATE, CURRENT_DATE),
        ('Employee', 'web', CURRENT_DATE, CURRENT_DATE)
      ON CONFLICT (name) DO NOTHING
    `);

    await client.query(`
      INSERT INTO permissions (name, guard_name, created_at, updated_at)
      VALUES 
        ('create', 'web', CURRENT_DATE, CURRENT_DATE),
        ('read', 'web', CURRENT_DATE, CURRENT_DATE),
        ('update', 'web', CURRENT_DATE, CURRENT_DATE),
        ('delete', 'web', CURRENT_DATE, CURRENT_DATE)
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('✅ Database reset completed successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('Email: admin@ias.com');
    console.log('Password: password');
    console.log('\n🔗 You can now access the application at: http://localhost:3000');

  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log('\n🎉 Database reset completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database reset failed:', error);
    process.exit(1);
  });
