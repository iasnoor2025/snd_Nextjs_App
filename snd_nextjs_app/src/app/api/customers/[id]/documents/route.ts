import { db } from '@/lib/drizzle';
import { customerDocuments, customers } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq, and, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
  
  if (request.method === 'DELETE') {
    return await deleteDocumentsHandler(request, { params: resolvedParams });
  }
  
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
};

const getDocumentsHandler = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {

    if (!params || !params.id) {
      console.error('❌ Invalid route parameters');
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = params;
    const customerId = parseInt(id);

    if (!customerId) {
      console.error('❌ Invalid customer ID');
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    // Check if customer exists
    const customerResult = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customerResult[0]) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get documents from database

    const documents = await db
      .select()
      .from(customerDocuments)
      .where(eq(customerDocuments.customerId, customerId))
      .orderBy(desc(customerDocuments.createdAt));

        // Transform documents for response
    const transformedDocuments = documents.map(doc => {
      // Create a user-friendly display name from the document type
      const displayName = doc.documentType
        ? doc.documentType.replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        : 'Unknown Document';

      // Use relative proxy endpoint for preview
      const previewUrl = `/api/customers/${customerId}/documents/${doc.id}/preview`;
      const isImage = doc.mimeType?.startsWith('image/');

      return {
        id: doc.id,
        name: displayName, // Use the friendly display name instead of filename
        file_name: doc.fileName || 'Unknown Document',
        file_type: doc.mimeType || 'application/octet-stream', // Return mime type, not extension
        fileType: doc.mimeType?.split('/')[1]?.toUpperCase() || 'UNKNOWN', // For backward compatibility
        size: doc.fileSize || 0,
        url: isImage ? previewUrl : ensureHttps(doc.filePath), // Use proxy for images, direct URL for others
        mime_type: doc.mimeType || '',
        mimeType: doc.mimeType || 'application/octet-stream',
        document_type: doc.documentType || '',
        documentType: doc.documentType,
        description: doc.description || '',
        created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        createdAt: doc.createdAt,
        updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
        updatedAt: doc.updatedAt,
        // Also include the original field names for backward compatibility
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        typeLabel: displayName,
      };
    });

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
    const customerId = parseInt(id);

    if (!customerId) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    // Check if customer exists
    const customerResult = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customerResult[0]) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

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
    const shouldOverwriteDocument = (documentType: string): boolean => {
      const generalDocumentTypes = ['general', 'other', 'misc', 'miscellaneous'];
      if (generalDocumentTypes.includes(documentType.toLowerCase())) {
        return false;
      }
      
      const specificDocumentTypes = [
        'contract', 'license', 'certificate', 'insurance',
        'commercial_registration', 'tax_certificate', 'vat_certificate',
        'bank_details', 'credit_agreement', 'purchase_order'
      ];
      
      return specificDocumentTypes.includes(documentType.toLowerCase());
    };
    
    const shouldOverwrite = shouldOverwriteDocument(rawDocumentType);
    
    // If this is a specific document type, check for existing documents and delete them
    if (shouldOverwrite) {
      try {
        const existingDocuments = await db
          .select()
          .from(customerDocuments)
          .where(
            and(
              eq(customerDocuments.customerId, customerId),
              eq(customerDocuments.documentType, rawDocumentType)
            )
          );

        if (existingDocuments.length > 0) {
                    // Delete files from MinIO
          try {
            const s3Client = new S3Client({
              endpoint: process.env.S3_ENDPOINT!,
              region: process.env.AWS_REGION || 'us-east-1',
              credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
              },
              forcePathStyle: true,
            });

            for (const doc of existingDocuments) {
              try {
                const urlObj = new URL(doc.filePath);
                let key = urlObj.pathname.substring(1); // Remove leading /
                
                // Remove the bucket name from the key if it exists
                const bucketName = 'customer-documents';
                if (key.startsWith(`${bucketName}/`)) {
                  key = key.substring(bucketName.length + 1);
                }

                const deleteCommand = new DeleteObjectCommand({
                  Bucket: bucketName,
                  Key: key,
                });

                await s3Client.send(deleteCommand);

              } catch (minioError) {
                console.error('Error deleting from MinIO for document:', doc.id, minioError);
                // Continue with other deletions
              }
            }
          } catch (minioError) {
            console.error('Error deleting from MinIO:', minioError);
          }
          
          // Delete from database
          await db
            .delete(customerDocuments)
            .where(
              and(
                eq(customerDocuments.customerId, customerId),
                eq(customerDocuments.documentType, rawDocumentType)
              )
            );

                  }
      } catch (error) {
        console.error('Error deleting existing documents:', error);
      }
    }

    // Generate filename
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
        .replace(/\.(pdf|jpg|jpeg|png|doc|docx)$/i, '')
        .replace(/^-+|-+$/g, '');
      
      const documentNameLower = cleanDocumentName.toLowerCase();
      const documentTypeLower = formattedDocumentType.toLowerCase();
      
      if (documentNameLower.includes(documentTypeLower)) {
        descriptiveFilename = `${cleanDocumentName}.${extension}`;
      } else {
        descriptiveFilename = `${formattedDocumentType}-${cleanDocumentName}.${extension}`;
      }
      
      if (!shouldOverwrite) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].substring(0, 8);
        const baseFilename = descriptiveFilename.replace(/\.[^/.]+$/, '');
        const fileExtension = descriptiveFilename.split('.').pop() || 'pdf';
        descriptiveFilename = `${baseFilename}-${timestamp}.${fileExtension}`;
      }
    } else {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExtension = file.name.split('.').pop();
      const formattedDocumentType = rawDocumentType
        .replace(/_/g, '-')
        .replace(/\b\w/g, l => l.toUpperCase());
      descriptiveFilename = `${formattedDocumentType}-${timestamp}.${fileExtension}`;
    }
    
    // Create folder path based on customer ID
    const path = `customer-${customerId}`;
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

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload file to MinIO
    const command = new PutObjectCommand({
      Bucket: 'customer-documents',
      Key: fullPath,
      Body: fileBuffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Generate MinIO public URL - Force HTTPS for production
    const baseUrl = process.env.S3_ENDPOINT?.replace(/\/$/, '');
    const secureUrl = baseUrl?.replace(/^http:\/\//, 'https://') || baseUrl;
    const minioUrl = `${secureUrl}/customer-documents/${fullPath}`;

    // Save document record to database
    const documentResult = await db
      .insert(customerDocuments)
      .values({
        customerId: customerId,
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
      throw new Error('Failed to insert document into database');
    }

    // Invalidate cache
    const cacheKey = `customer:${customerId}:documents`;
    try {
      await cacheService.delete(cacheKey, 'documents');

    } catch (error) {
      console.error('Cache invalidation error:', error);
    }

    const responseData = {
      success: true,
      message: shouldOverwrite 
        ? `Document uploaded successfully. Previous ${rawDocumentType} document(s) have been replaced.`
        : 'Document uploaded successfully.',
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

const deleteDocumentsHandler = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const customerId = parseInt(id);
    
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const docId = parseInt(documentId);
    
    // Get document to delete
    const documentResult = await db
      .select()
      .from(customerDocuments)
      .where(eq(customerDocuments.id, docId))
      .limit(1);

    if (!documentResult[0]) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const document = documentResult[0];

    // Delete from MinIO
    try {
      const s3Client = new S3Client({
        endpoint: process.env.S3_ENDPOINT!,
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
      });

      // Extract the key from the full URL
      const urlObj = new URL(document.filePath);
      let key = urlObj.pathname.substring(1); // Remove leading /
      
      // Remove the bucket name from the key if it exists
      // URL format: https://minio.example.com/customer-documents/customer-1/document.pdf
      // We need: customer-1/document.pdf
      const bucketName = 'customer-documents';
      if (key.startsWith(`${bucketName}/`)) {
        key = key.substring(bucketName.length + 1); // Remove "customer-documents/"
      }

      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(deleteCommand);

    } catch (minioError) {
      console.error('❌ Error deleting from MinIO:', minioError);
      // Continue with database deletion even if MinIO deletion fails
    }

    // Delete from database
    await db
      .delete(customerDocuments)
      .where(eq(customerDocuments.id, docId));

    // Invalidate cache
    const cacheKey = `customer:${customerId}:documents`;
    try {
      await cacheService.delete(cacheKey, 'documents');
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs['customer-document'].create)(handler);
export const GET = withPermission(PermissionConfigs['customer-document'].read)(handler);
export const DELETE = withPermission(PermissionConfigs['customer-document'].delete)(handler);
