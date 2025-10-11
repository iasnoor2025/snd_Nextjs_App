#!/usr/bin/env tsx

/**
 * Check MinIO Files Script
 * 
 * This script lists all files in MinIO to see what actually exists
 */

require('dotenv').config({ path: '.env.local' });

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

console.log('🔍 Check MinIO Files Script');
console.log('===========================\n');

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

async function checkMinIOFiles() {
  try {
    console.log('🔌 Connecting to MinIO...');
    
    // List all files in employee-documents bucket
    console.log('📋 Listing files in employee-documents bucket...');
    
    const command = new ListObjectsV2Command({
      Bucket: 'employee-documents',
      MaxKeys: 1000, // Adjust if you have more files
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ No files found in employee-documents bucket');
      return;
    }
    
    console.log(`Found ${response.Contents.length} files:`);
    console.log('');
    
    // Group files by folder
    const filesByFolder: { [key: string]: any[] } = {};
    
    response.Contents.forEach((file, index) => {
      const key = file.Key || '';
      const folder = key.split('/')[0] || 'root';
      
      if (!filesByFolder[folder]) {
        filesByFolder[folder] = [];
      }
      
      filesByFolder[folder].push({
        key,
        size: file.Size,
        lastModified: file.LastModified
      });
    });
    
    // Display files grouped by folder
    Object.keys(filesByFolder).sort().forEach(folder => {
      const folderFiles = filesByFolder[folder];
      if (folderFiles) {
        console.log(`📁 ${folder}/ (${folderFiles.length} files)`);
        folderFiles.forEach(file => {
          const sizeKB = Math.round((file.size || 0) / 1024);
          const date = file.lastModified ? new Date(file.lastModified).toLocaleDateString() : 'Unknown';
          console.log(`  📄 ${file.key} (${sizeKB}KB, ${date})`);
        });
        console.log('');
      }
    });
    
    // Summary
    console.log('📊 Summary:');
    console.log(`  Total Files: ${response.Contents.length}`);
    console.log(`  Folders: ${Object.keys(filesByFolder).length}`);
    
    const employeeFolders = Object.keys(filesByFolder).filter(f => f.startsWith('employee-'));
    console.log(`  Employee Folders: ${employeeFolders.length}`);
    
    if (employeeFolders.length > 0) {
      console.log('\n📋 Employee Folders:');
      employeeFolders.forEach(folder => {
        const folderFiles = filesByFolder[folder];
        const fileCount = folderFiles ? folderFiles.length : 0;
        console.log(`  ${folder}: ${fileCount} files`);
      });
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

// Run the check
checkMinIOFiles().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
