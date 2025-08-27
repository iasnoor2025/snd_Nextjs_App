import { db } from '@/lib/drizzle';
import { equipmentDocuments, equipment } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';
import { cacheService } from '@/lib/redis/cache-service';
import { ensureHttps } from '@/lib/utils/url-utils';

const handler = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  if (request.method === 'GET') {
    return await getDocumentsHandler(request, { params });
  }
  
  if (request.method === 'POST') {
    return await uploadDocumentsHandler(request, { params });
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
      .orderBy(equipmentDocuments.createdAt);

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

          // Delete old files from Supabase storage
          for (const existingDoc of existingDocuments) {
            if (existingDoc.filePath) {
              try {
                // Extract the filename from the filePath
                const fileName = existingDoc.filePath.split('/').pop();
                if (fileName) {
                  console.log(`Deleting file from Supabase: equipment-${equipmentId}/${fileName}`);
                  const deleteResult = await SupabaseStorageService.deleteFile('equipment-documents', `equipment-${equipmentId}/${fileName}`);
                  if (deleteResult.success) {
                    console.log(`Successfully deleted file: ${fileName}`);
                  } else {
                    console.error(`Failed to delete file ${fileName}:`, deleteResult.error);
                  }
                }
              } catch (deleteError) {
                console.error(`Error deleting file ${existingDoc.filePath}:`, deleteError);
              }
            }
          }

          console.log(`Deleted ${existingDocuments.length} existing ${rawDocumentType} document(s) for equipment ${equipmentId}`);
        }
      } catch (error) {
        console.error('Error deleting existing documents:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Generate path for Supabase storage
    const toTitleCase = (s: string) =>
      s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const baseLabel =
      documentName.trim() || toTitleCase((rawDocumentType || 'Document').replace(/_/g, ' '));
    const equipmentName = equipmentItem.name || `Equipment-${equipmentId}`;
    
    // Generate descriptive filename using the user-provided document name
    // This ensures the file is saved in Supabase with the user's chosen name
    let descriptiveFilename: string;
    if (documentName.trim()) {
      // Use the user-provided document name as the filename
      const extension = file.name.split('.').pop();
      const cleanDocumentName = documentName.trim()
        .replace(/\.(pdf|jpg|jpeg|png|doc|docx)$/i, '') // Remove common file extensions
        .replace(/[^a-zA-Z0-9\-_]/g, '-') // Replace special chars with hyphens (keep hyphens and underscores)
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      descriptiveFilename = `${cleanDocumentName}.${extension}`;
      
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
      descriptiveFilename = SupabaseStorageService.generateDescriptiveFilename(
        rawDocumentType || 'document',
        equipmentName,
        file.name
      );
    }
    
    const path = `equipment-${equipmentId}`;

    // Upload file to Supabase storage
    const uploadResult = await SupabaseStorageService.uploadFile(
      file,
      'equipment-documents',
      path,
      descriptiveFilename
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadResult.message}` },
        { status: 500 }
      );
    }

    // Save document record to database
    const documentResult = await db
      .insert(equipmentDocuments)
      .values({
        equipmentId: equipmentId,
        documentType: rawDocumentType,
        filePath: uploadResult.url || '',
        fileName: descriptiveFilename,
        fileSize: file.size,
        mimeType: file.type,
        description: description || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        ? `Document uploaded successfully. Previous ${rawDocumentType} document(s) have been replaced.`
        : 'Document uploaded successfully',
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

export const POST = withPermission(PermissionConfigs.equipment.update)(handler);
export const GET = withPermission(PermissionConfigs.equipment.read)(handler);