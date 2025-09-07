import { db } from '@/lib/drizzle';
import { equipmentDocuments, equipment } from '@/lib/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { cacheService } from '@/lib/redis/cache-service';
import { withPermission } from '@/lib/rbac/api-middleware';
import { PermissionConfigs } from '@/lib/rbac/api-middleware';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig({ path: '.env.local' });

// DELETE /api/equipment/[id]/documents/[documentId]
export const DELETE = withPermission(PermissionConfigs['equipment-document'].delete)(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string; documentId: string }> }
  ) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, documentId } = await params;
    const equipmentId = parseInt(id);
    const docId = parseInt(documentId);

    if (isNaN(equipmentId) || isNaN(docId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID or document ID' },
        { status: 400 }
      );
    }

    // Check if equipment exists
    const equipmentResult = await db
      .select()
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);

    if (!equipmentResult[0]) {
      return NextResponse.json({ success: false, error: 'Equipment not found' }, { status: 404 });
    }

    // Find the document
    const document = await db
      .select()
      .from(equipmentDocuments)
      .where(
        and(
          eq(equipmentDocuments.id, docId),
          eq(equipmentDocuments.equipmentId, equipmentId)
        )
      )
      .limit(1);

    if (!document.length) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    const documentData = document[0];
    if (!documentData) {
      return NextResponse.json({ success: false, error: 'Document data not found' }, { status: 404 });
    }

    // Delete file from MinIO storage if it exists
    if (documentData.filePath) {
      try {
        // Extract the file path from the MinIO URL
        // URL format: http://minio.snd-ksa.online/bucket-name/path/to/file
        let filePath = '';
        
        if (documentData.filePath.startsWith('http')) {
          const urlParts = documentData.filePath.split('/equipment-documents/');
          if (urlParts.length > 1) {
            filePath = urlParts[1];
          }
        }
        
        // Fallback: construct path from equipment ID and filename
        if (!filePath) {
          filePath = `equipment-${equipmentId}/${documentData.fileName}`;
        }

        console.log('Deleting file from MinIO:', {
          bucket: 'equipment-documents',
          path: filePath,
          document: documentData
        });

        // Initialize MinIO S3 client
        const s3Client = new S3Client({
          endpoint: process.env.S3_ENDPOINT,
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
          forcePathStyle: true,
        });

        // Delete from MinIO storage
        const deleteCommand = new DeleteObjectCommand({
          Bucket: 'equipment-documents',
          Key: filePath,
        });

        await s3Client.send(deleteCommand);
        console.log('Successfully deleted file from MinIO storage');
      } catch (error) {
        console.error('Error deleting file from MinIO storage:', error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete document from database
    await db
      .delete(equipmentDocuments)
      .where(
        and(
          eq(equipmentDocuments.id, docId),
          eq(equipmentDocuments.equipmentId, equipmentId)
        )
      );

    // Invalidate cache for this equipment's documents
    const equipmentCacheKey = `equipment:${equipmentId}:documents`;
    await cacheService.delete(equipmentCacheKey, 'documents');
    
    // Also invalidate general document caches
    await cacheService.clearByTags(['documents', 'equipment']);
    
    console.log(`Invalidated cache for equipment ${equipmentId} documents after deletion`);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Document deleted successfully from MinIO and database',
      },
    });
  } catch (error) {
    console.error('Error deleting equipment document:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete equipment document',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
