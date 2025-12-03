#!/usr/bin/env tsx

/**
 * Check Migration Status Script
 * 
 * This script checks the current migration status and identifies
 * files that still need to be migrated from Supabase to MinIO
 */

require('dotenv').config({ path: '.env.local' });

import { db } from '../src/lib/drizzle';
import { employeeDocuments, equipmentDocuments, media } from '../src/lib/drizzle/schema';
import { sql } from 'drizzle-orm';

console.log('🔍 Migration Status Check Script');
console.log('=================================\n');

async function checkMigrationStatus() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Check all file URLs in employee_documents
    console.log('📄 Checking employee_documents migration status...');
    const employeeStatus = await db.execute(sql`
      SELECT 
        COUNT(*) as total_files,
        SUM(CASE WHEN file_path LIKE 'https://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as minio_files,
        SUM(CASE WHEN file_path LIKE 'https://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as supabase_files,
        SUM(CASE WHEN file_path LIKE 'http://%' THEN 1 ELSE 0 END) as http_files,
        SUM(CASE WHEN file_path IS NULL OR file_path = '' THEN 1 ELSE 0 END) as empty_files
      FROM employee_documents;
    `);
    
    const empStatus = employeeStatus.rows[0] as any;
    console.log(`📊 Employee Documents Status:`);
    console.log(`  Total Files: ${empStatus.total_files}`);
    console.log(`  MinIO Files: ${empStatus.minio_files} ✅`);
    console.log(`  Supabase Files: ${empStatus.supabase_files} ⚠️`);
    console.log(`  HTTP Files: ${empStatus.http_files} ❌`);
    console.log(`  Empty Files: ${empStatus.empty_files} ❌`);
    console.log('');

    // Check all file URLs in equipment_documents
    console.log('📄 Checking equipment_documents migration status...');
    const equipmentStatus = await db.execute(sql`
      SELECT 
        COUNT(*) as total_files,
        SUM(CASE WHEN file_path LIKE 'https://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as minio_files,
        SUM(CASE WHEN file_path LIKE 'https://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as supabase_files,
        SUM(CASE WHEN file_path LIKE 'http://%' THEN 1 ELSE 0 END) as http_files,
        SUM(CASE WHEN file_path IS NULL OR file_path = '' THEN 1 ELSE 0 END) as empty_files
      FROM equipment_documents;
    `);
    
    const eqStatus = equipmentStatus.rows[0] as any;
    console.log(`📊 Equipment Documents Status:`);
    console.log(`  Total Files: ${eqStatus.total_files}`);
    console.log(`  MinIO Files: ${eqStatus.minio_files} ✅`);
    console.log(`  Supabase Files: ${eqStatus.supabase_files} ⚠️`);
    console.log(`  HTTP Files: ${eqStatus.http_files} ❌`);
    console.log(`  Empty Files: ${eqStatus.empty_files} ❌`);
    console.log('');

    // Check all file URLs in media
    console.log('📄 Checking media migration status...');
    const mediaStatus = await db.execute(sql`
      SELECT 
        COUNT(*) as total_files,
        SUM(CASE WHEN file_path LIKE 'https://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as minio_files,
        SUM(CASE WHEN file_path LIKE 'https://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as supabase_files,
        SUM(CASE WHEN file_path LIKE 'http://%' THEN 1 ELSE 0 END) as http_files,
        SUM(CASE WHEN file_path IS NULL OR file_path = '' THEN 1 ELSE 0 END) as empty_files
      FROM media;
    `);
    
    const medStatus = mediaStatus.rows[0] as any;
    console.log(`📊 Media Status:`);
    console.log(`  Total Files: ${medStatus.total_files}`);
    console.log(`  MinIO Files: ${medStatus.minio_files} ✅`);
    console.log(`  Supabase Files: ${medStatus.supabase_files} ⚠️`);
    console.log(`  HTTP Files: ${medStatus.http_files} ❌`);
    console.log(`  Empty Files: ${medStatus.empty_files} ❌`);
    console.log('');

    // Show detailed Supabase files that need migration
    console.log('📋 Supabase Files Requiring Migration:');
    
    const supabaseFiles = await db.execute(sql`
      SELECT 'employee_documents' as table_name, id, file_name, file_path, document_type, created_at
      FROM employee_documents 
      WHERE file_path LIKE '%supabasekong.snd-ksa.online%'
      
      UNION ALL
      
      SELECT 'equipment_documents' as table_name, id, file_name, file_path, document_type, created_at
      FROM equipment_documents 
      WHERE file_path LIKE '%supabasekong.snd-ksa.online%'
      
      UNION ALL
      
      SELECT 'media' as table_name, id, file_name, file_path, 'media' as document_type, created_at
      FROM media 
      WHERE file_path LIKE '%supabasekong.snd-ksa.online%'
      
      ORDER BY created_at DESC;
    `);
    
    if (supabaseFiles.rows.length > 0) {
      console.log(`Found ${supabaseFiles.rows.length} Supabase files that can be migrated:`);
      supabaseFiles.rows.forEach((row: any, index) => {
        console.log(`${index + 1}. [${row.table_name}] ID: ${row.id}`);
        console.log(`   File: ${row.file_name}`);
        console.log(`   Type: ${row.document_type}`);
        console.log(`   Created: ${row.created_at}`);
        console.log(`   URL: ${row.file_path.substring(0, 80)}...`);
        console.log('');
      });
    } else {
      console.log('✅ No Supabase files found - migration is complete!');
    }

    // Show any HTTP files that still need HTTPS conversion
    console.log('📋 HTTP Files Requiring HTTPS Conversion:');
    
    const httpFiles = await db.execute(sql`
      SELECT 'employee_documents' as table_name, id, file_name, file_path, document_type
      FROM employee_documents 
      WHERE file_path LIKE 'http://%'
      
      UNION ALL
      
      SELECT 'equipment_documents' as table_name, id, file_name, file_path, document_type
      FROM equipment_documents 
      WHERE file_path LIKE 'http://%'
      
      UNION ALL
      
      SELECT 'media' as table_name, id, file_name, file_path, 'media' as document_type
      FROM media 
      WHERE file_path LIKE 'http://%'
      
      ORDER BY table_name, id;
    `);
    
    if (httpFiles.rows.length > 0) {
      console.log(`❌ Found ${httpFiles.rows.length} HTTP files that need HTTPS conversion:`);
      httpFiles.rows.forEach((row: any, index) => {
        console.log(`${index + 1}. [${row.table_name}] ID: ${row.id}`);
        console.log(`   File: ${row.file_name}`);
        console.log(`   URL: ${row.file_path}`);
        console.log('');
      });
    } else {
      console.log('✅ No HTTP files found - HTTPS conversion is complete!');
    }

    // Summary
    const totalFiles = parseInt(empStatus.total_files) + parseInt(eqStatus.total_files) + parseInt(medStatus.total_files);
    const totalMinioFiles = parseInt(empStatus.minio_files) + parseInt(eqStatus.minio_files) + parseInt(medStatus.minio_files);
    const totalSupabaseFiles = parseInt(empStatus.supabase_files) + parseInt(eqStatus.supabase_files) + parseInt(medStatus.supabase_files);
    const totalHttpFiles = parseInt(empStatus.http_files) + parseInt(eqStatus.http_files) + parseInt(medStatus.http_files);

    console.log('📊 Overall Migration Summary:');
    console.log(`  Total Files: ${totalFiles}`);
    console.log(`  MinIO Files: ${totalMinioFiles} (${Math.round(totalMinioFiles/totalFiles*100)}%) ✅`);
    console.log(`  Supabase Files: ${totalSupabaseFiles} (${Math.round(totalSupabaseFiles/totalFiles*100)}%) ⚠️`);
    console.log(`  HTTP Files: ${totalHttpFiles} (${Math.round(totalHttpFiles/totalFiles*100)}%) ❌`);

    if (totalHttpFiles > 0) {
      console.log('\n🚨 Action Required: Run HTTPS conversion first!');
    } else if (totalSupabaseFiles > 0) {
      console.log('\n💡 Optional: Migrate Supabase files to MinIO for complete migration');
    } else {
      console.log('\n🎉 Migration Complete: All files are in MinIO with HTTPS!');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

// Run the check
checkMigrationStatus().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
