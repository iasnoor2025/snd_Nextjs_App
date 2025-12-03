#!/usr/bin/env tsx

/**
 * Fix MinIO Folder Structure Script
 * 
 * This script moves files from employee-{id} folders to employee-{fileNumber} folders
 * to match the application's expected folder structure
 */

require('dotenv').config({ path: '.env.local' });

import { db } from '../src/lib/drizzle';
import { employeeDocuments, employees } from '../src/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { S3Client, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

console.log('🔧 Fix MinIO Folder Structure Script');
console.log('====================================\n');

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

interface FileToMove {
  id: number;
  employeeId: number;
  fileName: string;
  filePath: string;
  currentPath: string;
  newPath: string;
  fileNumber: string;
}

async function fixMinIOFolderStructure() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Get all employee documents that were migrated with wrong folder structure
    console.log('📋 Finding files with incorrect folder structure...');
    
    const filesToFix = await db.execute(sql`
      SELECT 
        ed.id,
        ed.employee_id,
        ed.file_name,
        ed.file_path,
        e.file_number
      FROM employee_documents ed
      JOIN employees e ON ed.employee_id = e.id
      WHERE ed.file_path LIKE 'https://minio.snd-ksa.online/employee-documents/employee-%'
      AND ed.file_path NOT LIKE 'https://minio.snd-ksa.online/employee-documents/employee-' || e.file_number || '/%'
      ORDER BY ed.employee_id;
    `);
    
    if (filesToFix.rows.length === 0) {
      console.log('✅ No files found with incorrect folder structure!');
      return;
    }
    
    console.log(`Found ${filesToFix.rows.length} files to fix:`);
    
    const filesToMove: FileToMove[] = filesToFix.rows.map((row: any) => {
      const currentPath = row.file_path.replace('https://minio.snd-ksa.online/employee-documents/', '');
      const newPath = currentPath.replace(/^employee-\d+/, `employee-${row.file_number}`);
      
      return {
        id: row.id,
        employeeId: row.employee_id,
        fileName: row.file_name,
        filePath: row.file_path,
        currentPath,
        newPath,
        fileNumber: row.file_number
      };
    });
    
    filesToMove.forEach((file, index) => {
      console.log(`${index + 1}. Employee ${file.employeeId} (File# ${file.fileNumber}): ${file.fileName}`);
      console.log(`   From: ${file.currentPath}`);
      console.log(`   To:   ${file.newPath}`);
    });
    
    console.log('\n🔄 Starting file moves...');
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each file
    for (let i = 0; i < filesToMove.length; i++) {
      const file = filesToMove[i];
      console.log(`\n📄 Processing ${i + 1}/${filesToMove.length}: ${file.fileName}`);
      
      try {
        // Check if source file exists
        console.log(`  🔍 Checking source file: ${file.currentPath}`);
        const headCommand = new HeadObjectCommand({
          Bucket: 'employee-documents',
          Key: file.currentPath,
        });
        
        await s3Client.send(headCommand);
        console.log(`  ✅ Source file exists`);
        
        // Copy file to new location
        console.log(`  📋 Copying to: ${file.newPath}`);
        const copyCommand = new CopyObjectCommand({
          Bucket: 'employee-documents',
          CopySource: `employee-documents/${file.currentPath}`,
          Key: file.newPath,
        });
        
        await s3Client.send(copyCommand);
        console.log(`  ✅ File copied successfully`);
        
        // Delete old file
        console.log(`  🗑️  Deleting old file: ${file.currentPath}`);
        const deleteCommand = new DeleteObjectCommand({
          Bucket: 'employee-documents',
          Key: file.currentPath,
        });
        
        await s3Client.send(deleteCommand);
        console.log(`  ✅ Old file deleted`);
        
        // Update database with new path
        console.log(`  💾 Updating database record ID: ${file.id}`);
        const newFilePath = `https://minio.snd-ksa.online/employee-documents/${file.newPath}`;
        
        await db.update(employeeDocuments)
          .set({ filePath: newFilePath })
          .where(eq(employeeDocuments.id, file.id));
        
        console.log(`  ✅ Database updated successfully`);
        successCount++;
        
      } catch (error) {
        const errorMsg = `Failed to move ${file.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`  ❌ ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n📊 Fix Summary:');
    console.log(`  Total Files: ${filesToMove.length}`);
    console.log(`  Successful: ${successCount} ✅`);
    console.log(`  Failed: ${errorCount} ❌`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (successCount > 0) {
      console.log('\n🎉 Folder structure fix completed!');
      console.log('Files are now organized by employee file numbers as expected by the application.');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixMinIOFolderStructure().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
