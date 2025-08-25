import { db } from '@/lib/drizzle';
import { media } from '@/lib/drizzle/schema';
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

    // Find the document
    const document = await db
      .select()
      .from(media)
      .where(
        and(
          eq(media.id, docId),
          eq(media.modelType, 'Equipment'),
          eq(media.modelId, equipmentId),
          eq(media.collection, 'documents')
        )
      )
      .limit(1);

    if (!document.length) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    const documentData = document[0];
    if (!documentData) {
      return NextResponse.json(
        { success: false, error: 'Document data not found' },
        { status: 404 }
      );
    }

    // Delete file from Supabase storage if it's a Supabase URL
    if (documentData.filePath && documentData.filePath.startsWith('http')) {
      try {
        // Extract the file path from the Supabase URL
        // URL format: https://domain.com/storage/v1/object/public/bucket-name/path/to/file
        const urlParts = documentData.filePath.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const bucketAndPath = urlParts[1];
          if (bucketAndPath) {
            const pathParts = bucketAndPath.split('/');
            if (pathParts.length > 1) {
              const bucketName = pathParts[0];
              const filePathParts = pathParts.slice(1);
              const filePath = filePathParts.join('/');
              
              if (bucketName && filePath) {
                console.log('Deleting equipment document from Supabase:', { bucket: bucketName, path: filePath });
                
                // Delete from Supabase storage
                const deleteResult = await SupabaseStorageService.deleteFile(bucketName, filePath);
                if (!deleteResult.success) {
                  console.warn('Failed to delete file from Supabase:', deleteResult.message);
                  // Continue with database deletion even if file deletion fails
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error deleting file from Supabase:', error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await db.delete(media).where(eq(media.id, docId));

    // Invalidate cache for this equipment's documents and general documents
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
