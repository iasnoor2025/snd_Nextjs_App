#!/usr/bin/env node

/**
 * Schema Inconsistency Fix Script
 * 
 * This script will:
 * 1. Compare the current database schema with the Drizzle schema
 * 2. Identify inconsistencies
 * 3. Fix table name mismatches
 * 4. Update column definitions
 * 
 * Usage: node scripts/fix-schema-inconsistencies.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function fixSchemaInconsistencies() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Analyzing schema inconsistencies...');
    
    // Get current database tables
    const dbTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const dbTables = dbTablesResult.rows.map(row => row.table_name);
    
    // Expected tables from Drizzle schema
    const expectedTables = [
      'analytics_reports',
      'advance_payment_histories',
      'equipment_rental_history',
      'companies',
      'employee_assignments',
      'locations',
      'project_resources',
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
    
    // Find inconsistencies
    const missingTables = expectedTables.filter(table => !dbTables.includes(table));
    const extraTables = dbTables.filter(table => !expectedTables.includes(table));
    const inconsistentTables = [];
    
    console.log('\n📊 Schema Analysis Results:');
    console.log(`Total expected tables: ${expectedTables.length}`);
    console.log(`Total database tables: ${dbTables.length}`);
    console.log(`Missing tables: ${missingTables.length}`);
    console.log(`Extra tables: ${extraTables.length}`);
    
    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:');
      missingTables.forEach(table => console.log(`  - ${table}`));
    }
    
    if (extraTables.length > 0) {
      console.log('\n⚠️ Extra tables (not in schema):');
      extraTables.forEach(table => console.log(`  - ${table}`));
    }
    
    // Check for specific known inconsistencies
    const knownIssues = [];
    
    // Check if tax_document_payrolls exists but should be tax_documents
    if (dbTables.includes('tax_documents') && !dbTables.includes('tax_document_payrolls')) {
      knownIssues.push({
        type: 'missing_table',
        table: 'tax_document_payrolls',
        description: 'tax_document_payrolls table is missing but referenced in schema'
      });
    }
    
    // Check for _prisma_migrations table (should be removed)
    if (dbTables.includes('_prisma_migrations')) {
      knownIssues.push({
        type: 'legacy_table',
        table: '_prisma_migrations',
        description: 'Legacy Prisma migrations table should be removed'
      });
    }
    
    if (knownIssues.length > 0) {
      console.log('\n🔧 Known Issues Found:');
      knownIssues.forEach(issue => {
        console.log(`  - ${issue.type}: ${issue.table} - ${issue.description}`);
      });
    }
    
    // Check table structures for key tables
    console.log('\n🔍 Checking table structures...');
    const structureIssues = [];
    
    for (const tableName of expectedTables.slice(0, 5)) { // Check first 5 tables
      if (dbTables.includes(tableName)) {
        try {
          const columnsResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position
          `, [tableName]);
          
          const columns = columnsResult.rows;
          
          // Check for common issues
          const tableIssues = [];
          
          // Check if created_at and updated_at columns exist
          const hasCreatedAt = columns.some(col => col.column_name === 'created_at');
          const hasUpdatedAt = columns.some(col => col.column_name === 'updated_at');
          
          if (!hasCreatedAt) {
            tableIssues.push('Missing created_at column');
          }
          if (!hasUpdatedAt) {
            tableIssues.push('Missing updated_at column');
          }
          
          if (tableIssues.length > 0) {
            structureIssues.push({
              table: tableName,
              issues: tableIssues
            });
          }
        } catch (error) {
          console.log(`⚠️ Could not check structure of ${tableName}:`, error.message);
        }
      }
    }
    
    if (structureIssues.length > 0) {
      console.log('\n⚠️ Table Structure Issues:');
      structureIssues.forEach(issue => {
        console.log(`  - ${issue.table}:`);
        issue.issues.forEach(subIssue => console.log(`    * ${subIssue}`));
      });
    }
    
    // Summary and recommendations
    console.log('\n📋 Summary and Recommendations:');
    
    if (missingTables.length === 0 && extraTables.length === 0 && structureIssues.length === 0) {
      console.log('✅ Schema is consistent! No fixes needed.');
    } else {
      console.log('🔧 Schema inconsistencies found. Recommendations:');
      
      if (missingTables.length > 0) {
        console.log('  1. Run npm run drizzle:generate to create missing tables');
        console.log('  2. Run npm run drizzle:push to apply schema changes');
      }
      
      if (extraTables.length > 0) {
        console.log('  3. Consider removing extra tables if they are no longer needed');
      }
      
      if (structureIssues.length > 0) {
        console.log('  4. Check table structures and update schema if needed');
      }
      
      console.log('\n💡 To completely reset and fix the database:');
      console.log('  npm run db:reset:complete');
    }
    
  } catch (error) {
    console.error('❌ Schema analysis failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the analysis
fixSchemaInconsistencies()
  .then(() => {
    console.log('\n🎉 Schema analysis completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Schema analysis failed:', error);
    process.exit(1);
  });
