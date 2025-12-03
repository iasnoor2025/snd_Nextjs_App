#!/usr/bin/env tsx

import { db } from '../src/lib/drizzle';
import { sql } from 'drizzle-orm';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function checkDatabaseContent() {
  console.log('🔍 Checking Database Content');
  console.log('============================\n');

  try {
    // Check total records
    console.log('📄 Checking total records...');
    const totalRecords = await db.execute(sql`
      SELECT COUNT(*) as count FROM employee_documents
    `);
    
    console.log(`📄 Total records: ${(totalRecords as any)[0]?.count || 0}`);

    // Check sample records
    console.log('\n📄 Sample records:');
    const sampleRecords = await db.execute(sql`
      SELECT id, employee_id, file_path, file_name, document_type
      FROM employee_documents 
      ORDER BY id
      LIMIT 10
    `);

    const records = sampleRecords as unknown as any[];
    if (records && records.length > 0) {
      records.forEach((record, index) => {
        console.log(`  ${index + 1}. ID ${record.id}: ${record.file_path}`);
        console.log(`     Employee: ${record.employee_id}, File: ${record.file_name}`);
      });
    } else {
      console.log('  No records found');
    }

    // Check URL patterns
    console.log('\n📄 URL patterns:');
    const urlPatterns = await db.execute(sql`
      SELECT 
        CASE 
          WHEN file_path LIKE '%minio%' THEN 'MinIO'
          WHEN file_path LIKE '%supabase%' THEN 'Supabase'
          WHEN file_path IS NULL OR file_path = '' THEN 'Empty'
          ELSE 'Other'
        END as url_type,
        COUNT(*) as count
      FROM employee_documents 
      GROUP BY url_type
    `);

    const patterns = urlPatterns as unknown as any[];
    if (patterns && patterns.length > 0) {
      patterns.forEach((pattern) => {
        console.log(`  ${pattern.url_type}: ${pattern.count} records`);
      });
    }

  } catch (error: any) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabaseContent().catch(console.error);
