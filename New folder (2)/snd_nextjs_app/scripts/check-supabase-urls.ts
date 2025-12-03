#!/usr/bin/env tsx

/**
 * Check Supabase URLs Script
 * 
 * This script shows what Supabase URLs are still in the database
 */

require('dotenv').config({ path: '.env.local' });

import { db } from '../src/lib/drizzle';
import { employeeDocuments, equipmentDocuments, media } from '../src/lib/drizzle/schema';
import { sql } from 'drizzle-orm';

console.log('🔍 Supabase URLs Check Script');
console.log('=============================\n');

async function checkSupabaseUrls() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Check employee documents with Supabase URLs
    console.log('📄 Checking employee_documents for Supabase URLs...');
    const employeeSupabaseUrls = await db.execute(sql`
      SELECT id, file_name, file_path, document_type, created_at
      FROM employee_documents 
      WHERE file_path LIKE '%supabasekong.snd-ksa.online%'
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    console.log(`Found ${employeeSupabaseUrls.rows.length} Supabase URLs in employee_documents:`);
    employeeSupabaseUrls.rows.forEach((row: any, index) => {
      console.log(`${index + 1}. ID: ${row.id}, File: ${row.file_name}`);
      console.log(`   URL: ${row.file_path}`);
      console.log(`   Type: ${row.document_type}, Created: ${row.created_at}`);
      console.log('');
    });

    // Check equipment documents with Supabase URLs
    console.log('📄 Checking equipment_documents for Supabase URLs...');
    const equipmentSupabaseUrls = await db.execute(sql`
      SELECT id, file_name, file_path, document_type, created_at
      FROM equipment_documents 
      WHERE file_path LIKE '%supabasekong.snd-ksa.online%'
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    console.log(`Found ${equipmentSupabaseUrls.rows.length} Supabase URLs in equipment_documents:`);
    equipmentSupabaseUrls.rows.forEach((row: any, index) => {
      console.log(`${index + 1}. ID: ${row.id}, File: ${row.file_name}`);
      console.log(`   URL: ${row.file_path}`);
      console.log(`   Type: ${row.document_type}, Created: ${row.created_at}`);
      console.log('');
    });

    // Check media table with Supabase URLs
    console.log('📄 Checking media for Supabase URLs...');
    const mediaSupabaseUrls = await db.execute(sql`
      SELECT id, file_name, file_path, created_at
      FROM media 
      WHERE file_path LIKE '%supabasekong.snd-ksa.online%'
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    console.log(`Found ${mediaSupabaseUrls.rows.length} Supabase URLs in media:`);
    mediaSupabaseUrls.rows.forEach((row: any, index) => {
      console.log(`${index + 1}. ID: ${row.id}, File: ${row.file_name}`);
      console.log(`   URL: ${row.file_path}`);
      console.log(`   Created: ${row.created_at}`);
      console.log('');
    });

    // Summary
    const totalSupabaseUrls = employeeSupabaseUrls.rows.length + equipmentSupabaseUrls.rows.length + mediaSupabaseUrls.rows.length;
    console.log(`\n📊 Summary:`);
    console.log(`Total Supabase URLs found: ${totalSupabaseUrls}`);
    console.log(`- Employee Documents: ${employeeSupabaseUrls.rows.length}`);
    console.log(`- Equipment Documents: ${equipmentSupabaseUrls.rows.length}`);
    console.log(`- Media: ${mediaSupabaseUrls.rows.length}`);

    if (totalSupabaseUrls > 0) {
      console.log('\n💡 These are existing files that were uploaded to Supabase before migrating to MinIO.');
      console.log('   They need to be either:');
      console.log('   1. Migrated to MinIO (download from Supabase, upload to MinIO)');
      console.log('   2. Or manually re-uploaded through your application');
      console.log('   3. Or the URLs can be left as-is if Supabase is still accessible');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

// Run the check
checkSupabaseUrls().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
