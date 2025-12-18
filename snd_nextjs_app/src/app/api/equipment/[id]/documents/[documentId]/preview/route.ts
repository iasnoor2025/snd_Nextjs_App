import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/drizzle';
import { equipmentDocuments, equipment } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Preview endpoint - returns document data for inline preview
// Uses different path from /download to avoid IDM interception
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  console.log('🔵🔵🔵 EQUIPMENT DOCUMENT PREVIEW: Handler STARTED', request.url);
  
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: equipmentId, documentId } = await params;
    const equipmentIdNum = parseInt(equipmentId);
    const documentIdNum = parseInt(documentId);
    
    if (!equipmentIdNum || !documentIdNum) {
      return NextResponse.json({ error: 'Invalid equipment ID or document ID' }, { status: 400 });
    }

    // Get document record from database
    const documentResult = await db
      .select()
      .from(equipmentDocuments)
      .where(eq(equipmentDocuments.id, documentIdNum))
      .limit(1);

    if (!documentResult[0]) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const documentRecord = documentResult[0];

    // Verify the document belongs to the equipment
    if (documentRecord.equipmentId !== equipmentIdNum) {
      return NextResponse.json({ error: 'Document does not belong to this equipment' }, { status: 403 });
    }

    // Check if user has permission to access this document
    if (session.user.role !== 'SUPER_ADMIN' && 
        session.user.role !== 'ADMIN' && 
        session.user.role !== 'MANAGER' &&
        session.user.role !== 'SUPERVISOR' &&
        session.user.role !== 'OPERATOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get equipment information
    const equipmentResult = await db
      .select()
      .from(equipment)
      .where(eq(equipment.id, equipmentIdNum))
      .limit(1);

    if (!equipmentResult[0]) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const equipmentItem = equipmentResult[0];

    // If the document is stored in MinIO/S3 (URL starts with http/https)
    if (documentRecord.filePath && documentRecord.filePath.startsWith('http')) {
      try {
        // Initialize S3 client
        const s3Client = new S3Client({
          endpoint: process.env.S3_ENDPOINT!,
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
          forcePathStyle: true,
        });

        // Extract the key from the URL
        const urlObj = new URL(documentRecord.filePath);
        let key = urlObj.pathname.substring(1); // Remove leading /
        
        // Remove the bucket name from the key if it exists
        const bucketName = 'equipment-documents';
        if (key.startsWith(`${bucketName}/`)) {
          key = key.substring(bucketName.length + 1);
        }

        // Get the object from S3
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });

        const s3Response = await s3Client.send(command);
        
        if (!s3Response.Body) {
          throw new Error('No body in response');
        }

        const buffer = await s3Response.Body.transformToByteArray();
        
        console.log('🔵 EQUIPMENT DOCUMENT PREVIEW: Buffer size', buffer.length, 'bytes');
        
        if (!buffer || buffer.length === 0) {
          console.error('🔴 EQUIPMENT DOCUMENT PREVIEW: Empty buffer!');
          return NextResponse.json(
            { error: 'Document file is empty' },
            { status: 500 }
          );
        }
        
        // Generate filename with equipment info
        const fileExtension = documentRecord.fileName?.split('.').pop() || 'pdf';
        const documentType = documentRecord.documentType || 'document';
        const formattedDocumentType = documentType
          .replace(/_/g, '-')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        const previewFileName = `${equipmentItem.name || 'Equipment'}-${formattedDocumentType}.${fileExtension}`;
        
        // Check if client requested base64 format (for bypassing IDM)
        const url = new URL(request.url);
        const wantsBase64 = url.searchParams.has('base64');
        
        if (wantsBase64) {
          // Return as base64 JSON - IDM won't intercept JSON responses
          const base64Data = Buffer.from(buffer).toString('base64');
          return NextResponse.json({
            data: base64Data,
            mimeType: documentRecord.mimeType || 'application/pdf',
            fileName: previewFileName,
            size: buffer.length,
          });
        }
        
        // Return the file with proper headers for inline preview
        // Use the actual MIME type so the browser can render it correctly
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': documentRecord.mimeType || 'application/octet-stream',
            'Content-Disposition': `inline; filename="${encodeURIComponent(previewFileName)}"`,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'private, max-age=300',
          },
        });
      } catch (error) {
        console.error('Error fetching document from MinIO:', error);
        return NextResponse.json(
          { error: 'Failed to fetch document from storage' },
          { status: 500 }
        );
      }
    }

    // Fallback for any remaining local files
    return NextResponse.json({ 
      error: 'Document not accessible',
      message: 'Document is not stored in the expected location'
    }, { status: 404 });

  } catch (error) {
    console.error('Error previewing equipment document:', error);
    return NextResponse.json(
      { error: 'Failed to preview document' },
      { status: 500 }
    );
  }
}

// POST handler - same as GET, used to bypass IDM interception
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  return GET(request, context);
}

