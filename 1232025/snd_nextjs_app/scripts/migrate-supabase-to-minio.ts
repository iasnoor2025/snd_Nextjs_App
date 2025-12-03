#!/usr/bin/env tsx

/**
 * Supabase to MinIO Migration Script
 * 
 * This script downloads files from Supabase and uploads them to MinIO,
 * then updates the database URLs to point to MinIO
 */

require('dotenv').config({ path: '.env.local' });

import { db } from '../src/lib/drizzle';
import { employeeDocuments, equipmentDocuments, media } from '../src/lib/drizzle/schema';
import { sql, eq } from 'drizzle-orm';
import { MinIOStorageService } from '../src/lib/minio/storage-service';
import { createClient } from '@supabase/supabase-js';

console.log('🔄 Supabase to MinIO Migration Script');
console.log('====================================\n');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration!');
  console.error('Required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FileToMigrate {
  id: number;
  tableName: string;
  fileName: string;
  filePath: string;
  documentType: string;
  employeeId?: number;
  equipmentId?: number;
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
        // Extract file path from Supabase URL
        const urlParts = file.filePath.split('/storage/v1/object/public/');
        if (urlParts.length !== 2) {
          throw new Error(`Invalid Supabase URL format: ${file.filePath}`);
        }
        
        const supabaseFilePath = urlParts[1];
        console.log(`  📥 Downloading from Supabase: ${supabaseFilePath}`);
        
        // Download file from Supabase
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('employee-documents')
          .download(supabaseFilePath);
          
        if (downloadError) {
          throw new Error(`Supabase download failed: ${downloadError.message}`);
        }
        
        if (!fileData) {
          throw new Error('No file data received from Supabase');
        }
        
        console.log(`  ✅ Downloaded ${fileData.size} bytes`);
        
        // Convert Blob to File
        const fileBlob = new File([fileData], file.fileName, {
          type: fileData.type || 'application/octet-stream'
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
    }
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some files failed to migrate. You may need to:');
      console.log('1. Check Supabase access permissions');
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
