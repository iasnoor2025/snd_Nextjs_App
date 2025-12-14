import { db } from '@/lib/drizzle';
import { projectDocuments, projects } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { cacheService } from '@/lib/redis/cache-service';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig({ path: '.env.local' });

const uploadDocumentsHandler = async (
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) => {
  let rawDocumentType = 'general';
  let projectId = 0;
  
  try {
    const { id } = await ctx.params;
    projectId = parseInt(id);

    if (!projectId) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Check if project exists
    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!projectResult[0]) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const maybeFile = formData.get('file');
    if (!maybeFile || !(maybeFile instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const file = maybeFile as File;
    rawDocumentType = (formData.get('document_type') as string) || 'general';
    const documentName = (formData.get('document_name') as string) || '';
    const description = formData.get('description') as string;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, and WEBP files are allowed.' },
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

    // Generate descriptive filename
    const toTitleCase = (s: string) =>
      s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const baseLabel =
      documentName.trim() || toTitleCase((rawDocumentType || 'Document').replace(/_/g, ' '));
    
    let descriptiveFilename: string;
    if (documentName.trim()) {
      const extension = file.name.split('.').pop();
      const formattedDocumentType = rawDocumentType
        .replace(/_/g, '-')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      const cleanDocumentName = documentName.trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/\.(pdf|jpg|jpeg|png|doc|docx|xls|xlsx)$/i, '')
        .replace(/^-+|-+$/g, '');
      
      const documentNameLower = cleanDocumentName.toLowerCase();
      const documentTypeLower = formattedDocumentType.toLowerCase();
      
      if (documentNameLower.includes(documentTypeLower)) {
        descriptiveFilename = `${cleanDocumentName}.${extension}`;
      } else {
        descriptiveFilename = `${formattedDocumentType}-${cleanDocumentName}.${extension}`;
      }
      
      // Add timestamp to make filename unique
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].substring(0, 8);
      const baseFilename = descriptiveFilename.replace(/\.[^/.]+$/, '');
      const fileExtension = descriptiveFilename.split('.').pop() || 'pdf';
      descriptiveFilename = `${baseFilename}-${timestamp}.${fileExtension}`;
    } else {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExtension = file.name.split('.').pop();
      const formattedDocumentType = rawDocumentType
        .replace(/_/g, '-')
        .replace(/\b\w/g, l => l.toUpperCase());
      descriptiveFilename = `${formattedDocumentType}-${timestamp}.${fileExtension}`;
    }
    
    // Create folder path based on project ID
    const path = `project-${projectId}`;
    const fullPath = `${path}/${descriptiveFilename}`;

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

    const bucketName = 'project-documents';
    
    // Ensure bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (error: any) {
      // If bucket doesn't exist (404), create it
      if (error?.$metadata?.httpStatusCode === 404 || error?.Code === 'NotFound') {
        try {
          await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        } catch (createError) {
          // Bucket might have been created by another request, ignore if it already exists
          if (createError && typeof createError === 'object' && 'Code' in createError && createError.Code !== 'BucketAlreadyExists') {
            console.error('Error creating bucket:', createError);
            throw createError;
          }
        }
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload file to MinIO
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fullPath,
      Body: fileBuffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Generate MinIO public URL - Force HTTPS for production
    const baseUrl = process.env.S3_ENDPOINT?.replace(/\/$/, '');
    const secureUrl = baseUrl?.replace(/^http:\/\//, 'https://') || baseUrl;
    const minioUrl = `${secureUrl}/project-documents/${fullPath}`;

    // Save document record to database
    const documentResult = await db
      .insert(projectDocuments)
      .values({
        projectId: projectId,
        documentType: rawDocumentType,
        filePath: minioUrl,
        fileName: descriptiveFilename,
        fileSize: file.size,
        mimeType: (file.type || 'application/octet-stream') as string,
        description: description || null,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    const document = documentResult[0];

    if (!document) {
      console.error('Failed to insert document into database - no document returned');
      throw new Error('Failed to insert document into database');
    }

    // Invalidate cache for this project's documents
    const cacheKey = `project:${projectId}:documents`;
    try {
      await cacheService.delete(cacheKey, 'documents');
      await cacheService.delete(`project:${projectId}:*`, 'documents');
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }

    const responseData = {
      success: true,
      message: 'Document uploaded successfully',
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
      },
    };
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error uploading document:', error);
    
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
        projectId: projectId,
      },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs.project.update)(uploadDocumentsHandler);
