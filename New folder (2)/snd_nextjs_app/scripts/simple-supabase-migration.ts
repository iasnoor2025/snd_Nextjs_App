#!/usr/bin/env tsx

/**
 * Simple Supabase to MinIO Migration Script
 * 
 * This script downloads files from Supabase URLs and uploads them to MinIO,
 * then updates the database URLs to point to MinIO
 */

require('dotenv').config({ path: '.env.local' });

import { db } from '../src/lib/drizzle';
import { employeeDocuments, equipmentDocuments, media } from '../src/lib/drizzle/schema';
import { sql, eq } from 'drizzle-orm';
import { MinIOStorageService } from '../src/lib/minio/storage-service';

console.log('🔄 Simple Supabase to MinIO Migration Script');
console.log('============================================\n');

interface FileToMigrate {
  id: number;
  tableName: string;
  fileName: string;
  filePath: string;
  documentType: string;
  employeeId?: number;
  equipmentId?: number;
}

async function downloadFileFromUrl(url: string): Promise<{ data: Buffer; contentType: string }> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  
  return { data: buffer, contentType };
}

async function migrateSupabaseToMinIO() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Get all Supabase files that need migration
    console.log('📋 Finding Supabase files to migrate...');
    const supabaseFiles = await db.execute(sql`
      SELECT 'employee_documents' as table_name, id, file_name, file_path, document_type, employee_id, null as equipment_id
      FROM employee_documents 
      WHERE file_path LIKE '%supabasekong.snd-ksa.online%'
      
      UNION ALL
      
      SELECT 'equipment_documents' as table_name, id, file_name, file_path, document_type, null as employee_id, equipment_id
      FROM equipment_documents 
      WHERE file_path LIKE '%supabasekong.snd-ksa.online%'
      
      UNION ALL
      
      SELECT 'media' as table_name, id, file_name, file_path, 'media' as document_type, null as employee_id, null as equipment_id
      FROM media 
      WHERE file_path LIKE '%supabasekong.snd-ksa.online%'
      
      ORDER BY table_name, id;
    `);
    
    const filesToMigrate: FileToMigrate[] = supabaseFiles.rows.map((row: any) => ({
      id: row.id,
      tableName: row.table_name,
      fileName: row.file_name,
      filePath: row.file_path,
      documentType: row.document_type,
      employeeId: row.employee_id,
      equipmentId: row.equipment_id
    }));
    
    console.log(`Found ${filesToMigrate.length} files to migrate:`);
    filesToMigrate.forEach((file, index) => {
      console.log(`${index + 1}. [${file.tableName}] ${file.fileName} (ID: ${file.id})`);
    });
    console.log('');
    
    if (filesToMigrate.length === 0) {
      console.log('✅ No Supabase files found - migration is complete!');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each file
    for (let i = 0; i < filesToMigrate.length; i++) {
      const file = filesToMigrate[i];
      console.log(`\n📄 Processing ${i + 1}/${filesToMigrate.length}: ${file.fileName}`);
      
      try {
        console.log(`  📥 Downloading from Supabase: ${file.filePath}`);
        
        // Download file from Supabase URL
        const { data: fileBuffer, contentType } = await downloadFileFromUrl(file.filePath);
        
        console.log(`  ✅ Downloaded ${fileBuffer.length} bytes (${contentType})`);
        
        // Convert Buffer to File
        const fileBlob = new File([fileBuffer], file.fileName, {
          type: contentType
        });
        
        // Determine MinIO bucket and path
        let bucket: string;
        let minioPath: string;
        
        if (file.tableName === 'employee_documents') {
          bucket = 'employee-documents';
          minioPath = `employee-${file.employeeId}`;
        } else if (file.tableName === 'equipment_documents') {
          bucket = 'equipment-documents';
          minioPath = `equipment-${file.equipmentId}`;
        } else {
          bucket = 'general';
          minioPath = 'migrated';
        }
        
        console.log(`  📤 Uploading to MinIO: ${bucket}/${minioPath}/${file.fileName}`);
        
        // Upload to MinIO
        const uploadResult = await MinIOStorageService.uploadFile(
          fileBlob,
          bucket,
          minioPath,
          file.fileName
        );
        
        if (!uploadResult.success) {
          throw new Error(`MinIO upload failed: ${uploadResult.message}`);
        }
        
        console.log(`  ✅ Uploaded to MinIO: ${uploadResult.url}`);
        
        // Update database with new MinIO URL
        console.log(`  💾 Updating database record ID: ${file.id}`);
        
        if (file.tableName === 'employee_documents') {
          await db.update(employeeDocuments)
            .set({ filePath: uploadResult.url })
            .where(eq(employeeDocuments.id, file.id));
        } else if (file.tableName === 'equipment_documents') {
          await db.update(equipmentDocuments)
            .set({ filePath: uploadResult.url })
            .where(eq(equipmentDocuments.id, file.id));
        } else if (file.tableName === 'media') {
          await db.update(media)
            .set({ filePath: uploadResult.url })
            .where(eq(media.id, file.id));
        }
        
        console.log(`  ✅ Database updated successfully`);
        successCount++;
        
      } catch (error) {
        const errorMsg = `Failed to migrate ${file.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`  ❌ ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`  Total Files: ${filesToMigrate.length}`);
    console.log(`  Successful: ${successCount} ✅`);
    console.log(`  Failed: ${errorCount} ❌`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (successCount > 0) {
      console.log('\n🎉 Migration completed! Some files have been successfully migrated to MinIO.');
      
      // Verify the migration
      console.log('\n🔍 Verifying migration...');
      const verificationResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_files,
          SUM(CASE WHEN file_path LIKE 'https://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as minio_files,
          SUM(CASE WHEN file_path LIKE 'https://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as supabase_files
        FROM employee_documents;
      `);
      
      const verification = verificationResult.rows[0] as any;
      console.log(`📊 Final Status:`);
      console.log(`  Total Files: ${verification.total_files}`);
      console.log(`  MinIO Files: ${verification.minio_files} ✅`);
      console.log(`  Supabase Files: ${verification.supabase_files} ⚠️`);
    }
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some files failed to migrate. You may need to:');
      console.log('1. Check Supabase URL accessibility');
      console.log('2. Verify MinIO configuration');
      console.log('3. Manually re-upload failed files');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateSupabaseToMinIO().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
