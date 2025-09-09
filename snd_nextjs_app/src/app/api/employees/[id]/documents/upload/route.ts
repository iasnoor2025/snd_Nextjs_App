import { db } from '@/lib/drizzle';
import { employeeDocuments, employees } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { cacheService } from '@/lib/redis/cache-service';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig({ path: '.env.local' });

const uploadDocumentsHandler = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  let rawDocumentType = 'general';
  let employeeId = 0;
  let shouldOverwrite = false;
  
  try {
    if (!params || !params.id) {
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = params;
    employeeId = parseInt(id);

    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Check if employee exists
    const employeeResult = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!employeeResult[0]) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = employeeResult[0];
    const fileNumber = employee.fileNumber || String(employeeId);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    rawDocumentType = (formData.get('document_type') as string) || 'general';
    const documentName = (formData.get('document_name') as string) || '';
    const description = formData.get('description') as string;
    
    console.log(`📋 Upload request details:`, {
      employeeId,
      rawDocumentType,
      documentName,
      description,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Helper function to check if a document type should overwrite existing ones
    // These document types are unique per employee and should replace old versions
    // General documents should NOT overwrite - allow multiple general documents
    const shouldOverwriteDocument = (documentType: string): boolean => {
      // First check if it's a general document type - these should NEVER overwrite
      const generalDocumentTypes = ['general', 'other', 'misc', 'miscellaneous'];
      if (generalDocumentTypes.includes(documentType.toLowerCase())) {
        console.log(`Document type '${documentType}' is general - will NOT overwrite`);
        return false;
      }
      
      // Then check if it's a specific document type that should overwrite
      const specificDocumentTypes = [
        'passport', 'iqama', 'driving_license', 'operator_license', 
        'spsp_license', 'tuv_certification', 'contract', 'medical',
        'visa', 'work_permit', 'training_certificate', 'safety_certificate',
        'insurance_card', 'bank_details', 'emergency_contact'
      ];
      
      const result = specificDocumentTypes.includes(documentType.toLowerCase());
      console.log(`Document type '${documentType}' should overwrite: ${result}`);
      return result;
    };
    
    shouldOverwrite = shouldOverwriteDocument(rawDocumentType);
    console.log(`Overwrite decision for '${rawDocumentType}': ${shouldOverwrite}`);

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error(`File too large: ${file.size} bytes (max: ${maxSize})`);
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    console.log(`File validation passed: type=${file.type}, size=${file.size}`);

    // If this is a specific document type, check for existing documents and delete them
    if (shouldOverwrite) {
      try {
        console.log(`Checking for existing ${rawDocumentType} documents for employee ${employeeId}`);
        
        // Find existing documents of the same type for this employee
        const existingDocuments = await db
          .select()
          .from(employeeDocuments)
          .where(
            and(
              eq(employeeDocuments.employeeId, employeeId),
              eq(employeeDocuments.documentType, rawDocumentType)
            )
          );

        console.log(`Found ${existingDocuments.length} existing ${rawDocumentType} documents`);

        // Delete existing documents from database
        if (existingDocuments.length > 0) {
          console.log(`🗑️ Deleting existing documents:`, existingDocuments.map(d => ({ id: d.id, fileName: d.fileName })));
          
          await db
            .delete(employeeDocuments)
            .where(
              and(
                eq(employeeDocuments.employeeId, employeeId),
                eq(employeeDocuments.documentType, rawDocumentType)
              )
            );

          // Note: MinIO files will be overwritten automatically when uploading with the same key
          // No need to manually delete old files from MinIO storage
          console.log(`MinIO will automatically overwrite existing files with the same key`);

          console.log(`✅ Successfully deleted ${existingDocuments.length} existing ${rawDocumentType} document(s) for employee ${employeeId}`);
        }
      } catch (error) {
        console.error('Error deleting existing documents:', error);
        // Continue with upload even if deletion fails
      }
    } else {
      console.log(`Document type '${rawDocumentType}' is general - no overwriting needed`);
    }

    console.log('Starting file upload process...');

    // Generate path for MinIO storage based on employee file number
    const toTitleCase = (s: string) =>
      s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const baseLabel =
      documentName.trim() || toTitleCase((rawDocumentType || 'Document').replace(/_/g, ' '));
    
    // Generate descriptive filename using the user-provided document name
    // Check if the document name already contains the document type to avoid duplication
    let descriptiveFilename: string;
    if (documentName.trim()) {
      const extension = file.name.split('.').pop();
      
      // Format document type for comparison (remove emojis and normalize)
      const formattedDocumentType = rawDocumentType
        .replace(/_/g, '-')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      // Clean the document name (remove emojis, special chars, etc.)
      const cleanDocumentName = documentName.trim()
        .replace(/[^\w\s-]/g, '') // Remove emojis and special chars except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/\.(pdf|jpg|jpeg|png|doc|docx)$/i, '') // Remove common file extensions
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      
      // Check if the document name already contains the document type
      const documentNameLower = cleanDocumentName.toLowerCase();
      const documentTypeLower = formattedDocumentType.toLowerCase();
      
      if (documentNameLower.includes(documentTypeLower)) {
        // Document name already contains the type, use it as is
        descriptiveFilename = `${cleanDocumentName}.${extension}`;
      } else {
        // Document name doesn't contain the type, add it as prefix
        descriptiveFilename = `${formattedDocumentType}-${cleanDocumentName}.${extension}`;
      }
      
      // Check if a document with the same name already exists
      // Skip this check for general documents to allow multiple uploads
      if (shouldOverwrite) {
        const existingDocWithSameName = await db
          .select()
          .from(employeeDocuments)
          .where(
            and(
              eq(employeeDocuments.employeeId, employeeId),
              eq(employeeDocuments.fileName, descriptiveFilename)
            )
          )
          .limit(1);
        
        if (existingDocWithSameName.length > 0) {
          return NextResponse.json(
            { 
              error: `A document with the name "${documentName.trim()}" already exists. Please choose a different name or delete the existing document first.` 
            },
            { status: 409 }
          );
        }
      } else {
        console.log(`Skipping duplicate filename check for general document type: ${rawDocumentType}`);
        // Add timestamp to general documents to make them unique
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].substring(0, 8);
        const baseFilename = descriptiveFilename.replace(/\.[^/.]+$/, ''); // Remove extension
        const fileExtension = descriptiveFilename.split('.').pop() || 'pdf';
        descriptiveFilename = `${baseFilename}-${timestamp}.${fileExtension}`;
        console.log(`Updated general document filename to: ${descriptiveFilename}`);
      }
    } else {
      // Fallback to descriptive filename based on document type
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExtension = file.name.split('.').pop();
      const formattedDocumentType = rawDocumentType
        .replace(/_/g, '-')
        .replace(/\b\w/g, l => l.toUpperCase());
      descriptiveFilename = `${formattedDocumentType}-${timestamp}.${fileExtension}`;
    }
    
    // Create folder path based on employee file number for better organization
    // This creates a folder structure like: employee-documents/employee-1/ or employee-documents/employee-12345/
    const path = `employee-${fileNumber}`;
    const fullPath = `${path}/${descriptiveFilename}`;

    console.log(`Uploading file: ${file.name} as ${descriptiveFilename} to path: ${fullPath}`);
    console.log(`File details: name=${file.name}, type=${file.type}, size=${file.size}`);

    // Initialize MinIO S3 client
    const s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT!,
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload file to MinIO
    const command = new PutObjectCommand({
      Bucket: 'employee-documents',
      Key: fullPath,
      Body: fileBuffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Generate MinIO public URL
    const minioUrl = `${process.env.S3_ENDPOINT}/employee-documents/${fullPath}`;

    console.log('File uploaded successfully to MinIO, saving to database...');
    console.log('MinIO URL:', minioUrl);

    // Save document record to database
    console.log('Attempting to save document to database...');
    console.log('Document data:', {
      employeeId: employeeId,
      documentType: rawDocumentType,
      filePath: minioUrl,
      fileName: descriptiveFilename,
      fileSize: file.size,
      mimeType: file.type,
      description: description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const documentResult = await db
      .insert(employeeDocuments)
      .values({
        employeeId: employeeId,
        documentType: rawDocumentType,
        filePath: minioUrl,
        fileName: descriptiveFilename,
        fileSize: file.size,
        mimeType: (file.type || 'application/octet-stream') as string,
        description: description || null,
        createdAt: new Date().toISOString().split('T')[0], // Convert to date format
        updatedAt: new Date().toISOString().split('T')[0], // Convert to date format
      })
      .returning();

    const document = documentResult[0];

    if (!document) {
      console.error('Failed to insert document into database - no document returned');
      throw new Error('Failed to insert document into database');
    }

    console.log('Document saved to database successfully:', document);

    // Invalidate cache for this employee's documents
    const cacheKey = `employee:${employeeId}:documents`;
    try {
      await cacheService.delete(cacheKey, 'documents');
      console.log(`Invalidated cache for employee ${employeeId} documents`);
      
      // Also invalidate any related caches
      await cacheService.delete(`employee:${employeeId}:*`, 'documents');
      console.log(`Invalidated all caches for employee ${employeeId}`);
      
      // Additional cache invalidation for better reliability
      console.log(`Completed cache invalidation for employee ${employeeId}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }

    const responseData = {
      success: true,
      message: shouldOverwrite 
        ? `Document uploaded successfully to MinIO. Previous ${rawDocumentType} document(s) have been replaced.`
        : 'Document uploaded successfully to MinIO',
      data: {
        id: document.id,
        name: baseLabel,
        fileName: document.fileName,
        fileType: document.mimeType?.split('/')[1]?.toUpperCase() || 'UNKNOWN',
        size: document.fileSize,
        url: document.filePath,
        mimeType: document.mimeType,
        documentType: document.documentType,
        description: document.description,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        overwritten: shouldOverwrite,
      },
    };

    console.log('Upload completed successfully:', responseData.message);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error uploading document:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload document';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Unknown error type',
        documentType: rawDocumentType,
        employeeId: employeeId,
        shouldOverwrite: shouldOverwrite
      },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs.employee.update)(uploadDocumentsHandler);
export const GET = withPermission(PermissionConfigs.employee.read)(uploadDocumentsHandler);

// Simple test endpoint to debug upload issues
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const employeeId = parseInt(id);
    
    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }
    
    // Test basic functionality
    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      employeeId: employeeId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}

// Minimal upload test - bypasses all complex logic
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const employeeId = parseInt(id);
    
    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Simple test - just return file info without uploading
    return NextResponse.json({
      success: true,
      message: 'File received successfully',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      employeeId: employeeId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Minimal upload test failed:', error);
    return NextResponse.json({ 
      error: 'Minimal upload test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
