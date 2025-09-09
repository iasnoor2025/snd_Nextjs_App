import { db } from '@/lib/drizzle';
import { equipmentDocuments, equipment } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq, and, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { cacheService } from '@/lib/redis/cache-service';
import { ensureHttps } from '@/lib/utils/url-utils';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig({ path: '.env.local' });

const handler = async (
  request: NextRequest,
  ...args: unknown[]
) => {
  const { params } = args[0] as { params: Promise<{ id: string }> };
  const resolvedParams = await params;
  
  if (request.method === 'GET') {
    return await getDocumentsHandler(request, { params: resolvedParams });
  }
  
  if (request.method === 'POST') {
    return await uploadDocumentsHandler(request, { params: resolvedParams });
  }
  
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
};

const getDocumentsHandler = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!params || !params.id) {
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = params;
    const equipmentId = parseInt(id);

    if (!equipmentId) {
      return NextResponse.json({ error: 'Invalid equipment ID' }, { status: 400 });
    }

    // Check if equipment exists
    const equipmentResult = await db
      .select()
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);

    if (!equipmentResult[0]) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    // Get documents from database
    const documents = await db
      .select()
      .from(equipmentDocuments)
      .where(eq(equipmentDocuments.equipmentId, equipmentId))
      .orderBy(desc(equipmentDocuments.createdAt));

    // Transform documents for response
    const transformedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.fileName,
      fileName: doc.fileName,
      fileType: doc.mimeType?.split('/')[1]?.toUpperCase() || 'UNKNOWN',
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
              url: ensureHttps(doc.filePath), // Force HTTPS to prevent Mixed Content errors
      filePath: doc.filePath,
      documentType: doc.documentType,
      description: doc.description,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      documents: transformedDocuments,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
};

const uploadDocumentsHandler = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!params || !params.id) {
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = params;
    const equipmentId = parseInt(id);

    if (!equipmentId) {
      return NextResponse.json({ error: 'Invalid equipment ID' }, { status: 400 });
    }

    // Check if equipment exists
    const equipmentResult = await db
      .select()
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);

    if (!equipmentResult[0]) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const equipmentItem = equipmentResult[0];
    const _doorNumber = equipmentItem.doorNumber || String(equipmentId);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const rawDocumentType = (formData.get('document_type') as string) || 'general';
    const documentName = (formData.get('document_name') as string) || '';
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

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
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Helper function to check if a document type should overwrite existing ones
    // These document types are unique per equipment and should replace old versions
    const shouldOverwriteDocument = (documentType: string): boolean => {
      const specificDocumentTypes = [
        'manual', 'warranty', 'certification', 'inspection_report',
        'maintenance_record', 'safety_certificate', 'training_certificate',
        'insurance_document', 'purchase_invoice', 'service_history'
      ];
      return specificDocumentTypes.includes(documentType);
    };
    
    const shouldOverwrite = shouldOverwriteDocument(rawDocumentType);
    
    // If this is a specific document type, check for existing documents and delete them
    if (shouldOverwrite) {
      try {
        // Find existing documents of the same type for this equipment
        const existingDocuments = await db
          .select()
          .from(equipmentDocuments)
          .where(
            and(
              eq(equipmentDocuments.equipmentId, equipmentId),
              eq(equipmentDocuments.documentType, rawDocumentType)
            )
          );

        // Delete existing documents from database
        if (existingDocuments.length > 0) {
          await db
            .delete(equipmentDocuments)
            .where(
              and(
                eq(equipmentDocuments.equipmentId, equipmentId),
                eq(equipmentDocuments.documentType, rawDocumentType)
              )
            );

          // Note: MinIO files will be overwritten automatically when uploading with the same key
          // No need to manually delete old files from MinIO storage
          console.log(`MinIO will automatically overwrite existing files with the same key`);

          console.log(`Deleted ${existingDocuments.length} existing ${rawDocumentType} document(s) for equipment ${equipmentId}`);
        }
      } catch (error) {
        console.error('Error deleting existing documents:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Generate path for MinIO storage
    const toTitleCase = (s: string) =>
      s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const baseLabel =
      documentName.trim() || toTitleCase((rawDocumentType || 'Document').replace(/_/g, ' '));
    const _equipmentName = equipmentItem.name || `Equipment-${equipmentId}`;
    
    // Generate descriptive filename using the user-provided document name with document type
    // This ensures the file is saved in MinIO with the user's chosen name and document type
    let descriptiveFilename: string;
    if (documentName.trim()) {
      // Use the user-provided document name as the filename with document type prefix
      const extension = file.name.split('.').pop();
      const cleanDocumentName = documentName.trim()
        .replace(/\.(pdf|jpg|jpeg|png|doc|docx)$/i, '') // Remove common file extensions
        .replace(/[^a-zA-Z0-9\-_]/g, '-') // Replace special chars with hyphens (keep hyphens and underscores)
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      
      // Format document type for filename (replace underscores with hyphens, capitalize)
      const formattedDocumentType = rawDocumentType
        .replace(/_/g, '-')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      descriptiveFilename = `${formattedDocumentType}-${cleanDocumentName}.${extension}`;
      
      // Check if a document with the same name already exists
      const existingDocWithSameName = await db
        .select()
        .from(equipmentDocuments)
        .where(
          and(
            eq(equipmentDocuments.equipmentId, equipmentId),
            eq(equipmentDocuments.fileName, descriptiveFilename)
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
      // Fallback to descriptive filename based on document type
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExtension = file.name.split('.').pop();
      const formattedDocumentType = rawDocumentType
        .replace(/_/g, '-')
        .replace(/\b\w/g, l => l.toUpperCase());
      descriptiveFilename = `${formattedDocumentType}-${timestamp}.${fileExtension}`;
    }
    
    // Create folder path based on equipment ID for better organization
    // This creates a folder structure like: equipment-documents/equipment-14/ or equipment-documents/equipment-180/
    const path = `equipment-${equipmentId}`;
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
      Bucket: 'equipment-documents',
      Key: fullPath,
      Body: fileBuffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Generate MinIO public URL
    const minioUrl = `${process.env.S3_ENDPOINT}/equipment-documents/${fullPath}`;

    console.log('File uploaded successfully to MinIO, saving to database...');
    console.log('MinIO URL:', minioUrl);

    // Save document record to database
    const documentResult = await db
      .insert(equipmentDocuments)
      .values({
        equipmentId: equipmentId,
        documentType: rawDocumentType,
        filePath: minioUrl,
        fileName: descriptiveFilename,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        description: description || null,
        createdAt: new Date().toISOString().split('T')[0], // Convert to date format
        updatedAt: new Date().toISOString().split('T')[0], // Convert to date format
      })
      .returning();

    const document = documentResult[0];

    if (!document) {
      throw new Error('Failed to insert document into database');
    }

    // Invalidate cache for this equipment's documents
    const cacheKey = `equipment:${equipmentId}:documents`;
    await cacheService.delete(cacheKey, 'documents');
    console.log(`Invalidated cache for equipment ${equipmentId} documents`);

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

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs['equipment-document'].create)(handler);
export const GET = withPermission(PermissionConfigs['equipment-document'].read)(handler);