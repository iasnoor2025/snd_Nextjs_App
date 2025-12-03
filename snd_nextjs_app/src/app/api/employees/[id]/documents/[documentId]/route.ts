
import { db } from '@/lib/drizzle';
import { employeeDocuments } from '@/lib/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { cacheService } from '@/lib/redis/cache-service';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig({ path: '.env.local' });

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession();
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

    // Delete file from MinIO storage if it's a MinIO URL
    if (documentRecord.filePath && documentRecord.filePath.startsWith('http')) {
      try {
        // Extract the file path from the MinIO URL
        // URL format: http://minio.snd-ksa.online/bucket-name/path/to/file
        const urlParts = documentRecord.filePath.split('/employee-documents/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          
          if (filePath) {
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
              Bucket: 'employee-documents',
              Key: filePath,
            });

            await s3Client.send(deleteCommand);
          }
        }
      } catch (error) {
        console.error('Error deleting file from MinIO:', error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete document from database
    await db.delete(employeeDocuments).where(eq(employeeDocuments.id, documentId));

    // Invalidate cache for this employee's documents and general documents
    const employeeCacheKey = `employee:${employeeId}:documents`;
    await cacheService.delete(employeeCacheKey, 'documents');
    
    // Also invalidate general document caches
    await cacheService.clearByTags(['documents', 'employee']);
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully from MinIO and database',
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
