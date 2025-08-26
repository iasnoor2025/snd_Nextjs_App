import { db } from '@/lib/drizzle';
import { equipmentDocuments, equipment } from '@/lib/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';
import { cacheService } from '@/lib/redis/cache-service';

// DELETE /api/equipment/[id]/documents/[documentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete equipment documents
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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

    // Delete file from Supabase storage if it exists
    if (documentData.filePath) {
      try {
        // Extract the file path from the Supabase URL
        // URL format: https://domain.com/storage/v1/object/public/bucket-name/path/to/file
        let filePath = '';
        
        if (documentData.filePath.startsWith('http')) {
          const urlParts = documentData.filePath.split('/storage/v1/object/public/');
          if (urlParts.length > 1) {
            const bucketAndPath = urlParts[1];
            if (bucketAndPath) {
              const pathParts = bucketAndPath.split('/');
              if (pathParts.length > 1) {
                // Remove the bucket name from the path
                const bucketName = pathParts[0];
                const filePathParts = pathParts.slice(1);
                filePath = filePathParts.join('/');
              }
            }
          }
        }
        
        // Fallback: construct path from equipment ID and filename
        if (!filePath) {
          filePath = `equipment-${equipmentId}/${documentData.fileName}`;
        }

        console.log('Deleting file from Supabase:', {
          bucket: 'equipment-documents',
          path: filePath,
          document: documentData
        });

        // Delete from Supabase storage
        const deleteResult = await SupabaseStorageService.deleteFile('equipment-documents', filePath);
        if (deleteResult.success) {
          console.log('Successfully deleted file from Supabase storage');
        } else {
          console.warn('Failed to delete file from Supabase storage:', deleteResult.error);
          // Continue with database deletion even if file deletion fails
        }
      } catch (error) {
        console.error('Error deleting file from Supabase storage:', error);
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
        message: 'Document deleted successfully',
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
}
