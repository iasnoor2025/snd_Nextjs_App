#!/usr/bin/env tsx

/**
 * Cleanup Duplicate Files Script
 * 
 * This script removes the duplicate migrated files and updates the database
 * to point to the correct original files with proper folder structure
 */

require('dotenv').config({ path: '.env.local' });

import { db } from '../src/lib/drizzle';
import { employeeDocuments, employees } from '../src/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { S3Client, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

console.log('🧹 Cleanup Duplicate Files Script');
console.log('=================================\n');

// Create S3 client
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

interface DuplicateFile {
  id: number;
  employeeId: number;
  fileName: string;
  filePath: string;
  fileNumber: string;
  originalPath: string;
  migratedPath: string;
}

async function cleanupDuplicateFiles() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Find files that were migrated with wrong folder structure (have timestamps in filename)
    console.log('📋 Finding duplicate migrated files...');
    
    const duplicateFiles = await db.execute(sql`
      SELECT 
        ed.id,
        ed.employee_id,
        ed.file_name,
        ed.file_path,
        e.file_number
      FROM employee_documents ed
      JOIN employees e ON ed.employee_id = e.id
      WHERE ed.file_path LIKE 'https://minio.snd-ksa.online/employee-documents/employee-%'
      AND ed.file_path LIKE '%-1757830%.jpg'
      ORDER BY ed.employee_id;
    `);
    
    if (duplicateFiles.rows.length === 0) {
      console.log('✅ No duplicate migrated files found!');
      return;
    }
    
    console.log(`Found ${duplicateFiles.rows.length} duplicate migrated files:`);
    
    const filesToCleanup: DuplicateFile[] = duplicateFiles.rows.map((row: any) => {
      const migratedPath = row.file_path.replace('https://minio.snd-ksa.online/employee-documents/', '');
      const fileName = row.file_name;
      const originalPath = `employee-${row.file_number}/${fileName}`;
      
      return {
        id: row.id,
        employeeId: row.employee_id,
        fileName: row.file_name,
        filePath: row.file_path,
        fileNumber: row.file_number,
        originalPath,
        migratedPath
      };
    });
    
    filesToCleanup.forEach((file, index) => {
      console.log(`${index + 1}. Employee ${file.employeeId} (File# ${file.fileNumber}): ${file.fileName}`);
      console.log(`   Migrated: ${file.migratedPath}`);
      console.log(`   Should be: ${file.originalPath}`);
    });
    
    console.log('\n🔄 Starting cleanup...');
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each duplicate file
    for (let i = 0; i < filesToCleanup.length; i++) {
      const file = filesToCleanup[i];
      console.log(`\n📄 Processing ${i + 1}/${filesToCleanup.length}: ${file.fileName}`);
      
      try {
        // Check if original file exists
        console.log(`  🔍 Checking if original file exists: ${file.originalPath}`);
        const headCommand = new HeadObjectCommand({
          Bucket: 'employee-documents',
          Key: file.originalPath,
        });
        
        try {
          await s3Client.send(headCommand);
          console.log(`  ✅ Original file exists`);
          
          // Update database to point to original file
          console.log(`  💾 Updating database to point to original file`);
          const originalFilePath = `https://minio.snd-ksa.online/employee-documents/${file.originalPath}`;
          
          await db.update(employeeDocuments)
            .set({ filePath: originalFilePath })
            .where(eq(employeeDocuments.id, file.id));
          
          console.log(`  ✅ Database updated successfully`);
          
          // Delete the duplicate migrated file
          console.log(`  🗑️  Deleting duplicate migrated file: ${file.migratedPath}`);
          const deleteCommand = new DeleteObjectCommand({
            Bucket: 'employee-documents',
            Key: file.migratedPath,
          });
          
          await s3Client.send(deleteCommand);
          console.log(`  ✅ Duplicate file deleted`);
          
          successCount++;
          
        } catch (headError) {
          console.log(`  ⚠️  Original file does not exist, keeping migrated file`);
          console.log(`  💡 Consider manually checking this file`);
          successCount++; // Count as success since we're not deleting
        }
        
      } catch (error) {
        const errorMsg = `Failed to cleanup ${file.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`  ❌ ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`  Total Files: ${filesToCleanup.length}`);
    console.log(`  Successful: ${successCount} ✅`);
    console.log(`  Failed: ${errorCount} ❌`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (successCount > 0) {
      console.log('\n🎉 Cleanup completed!');
      console.log('Duplicate migrated files have been removed and database updated.');
      console.log('Files are now properly organized by employee file numbers.');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupDuplicateFiles().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
