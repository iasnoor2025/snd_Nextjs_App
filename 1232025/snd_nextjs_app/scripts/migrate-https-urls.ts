#!/usr/bin/env tsx

/**
 * HTTPS URL Migration Script
 * 
 * This script updates all HTTP URLs to HTTPS in your database
 * Uses your existing database connection setup
 */

import { db } from '../src/lib/drizzle';
import { employeeDocuments, equipmentDocuments, media } from '../src/lib/drizzle/schema';
import { sql } from 'drizzle-orm';

console.log('🔧 HTTPS URL Migration Script');
console.log('=============================\n');

async function migrateHttpsUrls() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Update employee documents
    console.log('📄 Updating employee_documents table...');
    const employeeResult = await db.execute(sql`
      UPDATE employee_documents 
      SET file_path = REPLACE(file_path, 'http://minio.snd-ksa.online', 'https://minio.snd-ksa.online')
      WHERE file_path LIKE 'http://minio.snd-ksa.online%';
    `);
    console.log(`✅ Updated employee documents: ${employeeResult.rowCount || 0} records`);

    const employeeSupabaseResult = await db.execute(sql`
      UPDATE employee_documents 
      SET file_path = REPLACE(file_path, 'http://supabasekong.snd-ksa.online', 'https://supabasekong.snd-ksa.online')
      WHERE file_path LIKE 'http://supabasekong.snd-ksa.online%';
    `);
    console.log(`✅ Updated employee documents (Supabase): ${employeeSupabaseResult.rowCount || 0} records`);

    // Update equipment documents
    console.log('📄 Updating equipment_documents table...');
    const equipmentResult = await db.execute(sql`
      UPDATE equipment_documents 
      SET file_path = REPLACE(file_path, 'http://minio.snd-ksa.online', 'https://minio.snd-ksa.online')
      WHERE file_path LIKE 'http://minio.snd-ksa.online%';
    `);
    console.log(`✅ Updated equipment documents: ${equipmentResult.rowCount || 0} records`);

    const equipmentSupabaseResult = await db.execute(sql`
      UPDATE equipment_documents 
      SET file_path = REPLACE(file_path, 'http://supabasekong.snd-ksa.online', 'https://supabasekong.snd-ksa.online')
      WHERE file_path LIKE 'http://supabasekong.snd-ksa.online%';
    `);
    console.log(`✅ Updated equipment documents (Supabase): ${equipmentSupabaseResult.rowCount || 0} records`);

    // Update media table
    console.log('📄 Updating media table...');
    const mediaResult = await db.execute(sql`
      UPDATE media 
      SET file_path = REPLACE(file_path, 'http://minio.snd-ksa.online', 'https://minio.snd-ksa.online')
      WHERE file_path LIKE 'http://minio.snd-ksa.online%';
    `);
    console.log(`✅ Updated media: ${mediaResult.rowCount || 0} records`);

    const mediaSupabaseResult = await db.execute(sql`
      UPDATE media 
      SET file_path = REPLACE(file_path, 'http://supabasekong.snd-ksa.online', 'https://supabasekong.snd-ksa.online')
      WHERE file_path LIKE 'http://supabasekong.snd-ksa.online%';
    `);
    console.log(`✅ Updated media (Supabase): ${mediaSupabaseResult.rowCount || 0} records`);

    // Verify the changes
    console.log('\n🔍 Verification Results:');
    
    const verificationResult = await db.execute(sql`
      SELECT 
        'employee_documents' as table_name,
        COUNT(*) as total_records,
        SUM(CASE WHEN file_path LIKE 'https://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as https_minio_records,
        SUM(CASE WHEN file_path LIKE 'http://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as http_minio_records,
        SUM(CASE WHEN file_path LIKE 'https://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as https_supabase_records,
        SUM(CASE WHEN file_path LIKE 'http://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as http_supabase_records
      FROM employee_documents 
      
      UNION ALL
      
      SELECT 
        'equipment_documents' as table_name,
        COUNT(*) as total_records,
        SUM(CASE WHEN file_path LIKE 'https://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as https_minio_records,
        SUM(CASE WHEN file_path LIKE 'http://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as http_minio_records,
        SUM(CASE WHEN file_path LIKE 'https://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as https_supabase_records,
        SUM(CASE WHEN file_path LIKE 'http://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as http_supabase_records
      FROM equipment_documents 
      
      UNION ALL
      
      SELECT 
        'media' as table_name,
        COUNT(*) as total_records,
        SUM(CASE WHEN file_path LIKE 'https://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as https_minio_records,
        SUM(CASE WHEN file_path LIKE 'http://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as http_minio_records,
        SUM(CASE WHEN file_path LIKE 'https://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as https_supabase_records,
        SUM(CASE WHEN file_path LIKE 'http://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as http_supabase_records
      FROM media;
    `);

    verificationResult.rows.forEach((row: any) => {
      console.log(`\n📊 ${row.table_name}:`);
      console.log(`  Total Records: ${row.total_records}`);
      console.log(`  HTTPS MinIO: ${row.https_minio_records}`);
      console.log(`  HTTP MinIO: ${row.http_minio_records}`);
      console.log(`  HTTPS Supabase: ${row.https_supabase_records}`);
      console.log(`  HTTP Supabase: ${row.http_supabase_records}`);
    });

    // Check for any remaining HTTP URLs
    console.log('\n🔍 Final Check - Remaining HTTP URLs:');
    const remainingHttpResult = await db.execute(sql`
      SELECT 'employee_documents' as table_name, COUNT(*) as http_count
      FROM employee_documents 
      WHERE file_path LIKE 'http://%'
      
      UNION ALL
      
      SELECT 'equipment_documents' as table_name, COUNT(*) as http_count
      FROM equipment_documents 
      WHERE file_path LIKE 'http://%'
      
      UNION ALL
      
      SELECT 'media' as table_name, COUNT(*) as http_count
      FROM media 
      WHERE file_path LIKE 'http://%';
    `);

    let totalRemainingHttp = 0;
    remainingHttpResult.rows.forEach((row: any) => {
      const count = parseInt(row.http_count);
      totalRemainingHttp += count;
      if (count > 0) {
        console.log(`⚠️  ${row.table_name}: ${count} HTTP URLs remaining`);
      } else {
        console.log(`✅ ${row.table_name}: No HTTP URLs remaining`);
      }
    });

    if (totalRemainingHttp === 0) {
      console.log('\n🎉 Migration completed successfully! All HTTP URLs have been converted to HTTPS.');
    } else {
      console.log(`\n⚠️  Total HTTP URLs remaining: ${totalRemainingHttp}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateHttpsUrls().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
