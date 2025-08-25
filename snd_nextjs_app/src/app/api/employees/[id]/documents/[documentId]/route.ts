import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeDocuments } from '@/lib/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);
    const documentId = parseInt(resolvedParams.documentId);

    if (!employeeId || !documentId) {
      return NextResponse.json({ error: 'Invalid employee ID or document ID' }, { status: 400 });
    }

    // Get document from database
    const document = await db
      .select()
      .from(employeeDocuments)
      .where(
        and(eq(employeeDocuments.id, documentId), eq(employeeDocuments.employeeId, employeeId))
      )
      .limit(1);

    const documentRecord = document[0];

    if (!documentRecord) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete file from Supabase storage if it's a Supabase URL
    if (documentRecord.filePath && documentRecord.filePath.startsWith('http')) {
      try {
        // Extract the file path from the Supabase URL
        // URL format: https://domain.com/storage/v1/object/public/bucket-name/path/to/file
        const urlParts = documentRecord.filePath.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const bucketAndPath = urlParts[1];
          if (bucketAndPath) {
            const pathParts = bucketAndPath.split('/');
            if (pathParts.length > 1) {
              const bucketName = pathParts[0];
              const filePathParts = pathParts.slice(1);
              const filePath = filePathParts.join('/');
              
              if (bucketName && filePath) {
                console.log('Deleting file from Supabase:', { bucket: bucketName, path: filePath });
                
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

    // Delete document from database
    await db.delete(employeeDocuments).where(eq(employeeDocuments.id, documentId));

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete document: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
