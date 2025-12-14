import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/drizzle';
import { projectDocuments, projects } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Shared handler for both GET and POST (POST used to bypass IDM interception)
async function handleDownload(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  console.log('🔵🔵🔵 PROJECT DOCUMENT DOWNLOAD: Handler STARTED', request.url);
  
  try {
    const session = await getServerSession();
    console.log('🔵 PROJECT DOCUMENT DOWNLOAD: Session exists?', !!session?.user);
    if (!session?.user) {
      console.log('🔴 PROJECT DOCUMENT DOWNLOAD: No session, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, documentId } = await params;
    const projectIdNum = parseInt(projectId);
    const documentIdNum = parseInt(documentId);
    
    if (!projectIdNum || !documentIdNum) {
      return NextResponse.json({ error: 'Invalid project ID or document ID' }, { status: 400 });
    }

    // Get document record from database
    const documentResult = await db
      .select()
      .from(projectDocuments)
      .where(eq(projectDocuments.id, documentIdNum))
      .limit(1);

    if (!documentResult[0]) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const documentRecord = documentResult[0];

    // Verify the document belongs to the project
    if (documentRecord.projectId !== projectIdNum) {
      return NextResponse.json({ error: 'Document does not belong to this project' }, { status: 403 });
    }

    // Check if user has permission to access this document
    if (session.user.role !== 'SUPER_ADMIN' && 
        session.user.role !== 'ADMIN' && 
        session.user.role !== 'MANAGER' &&
        session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get project information
    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectIdNum))
      .limit(1);

    if (!projectResult[0]) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectResult[0];

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
        const bucketName = 'project-documents';
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
        
        console.log('🔵 PROJECT DOCUMENT DOWNLOAD: Buffer size', buffer.length, 'bytes');
        console.log('🔵 PROJECT DOCUMENT DOWNLOAD: MIME type', documentRecord.mimeType);
        
        if (!buffer || buffer.length === 0) {
          console.error('🔴 PROJECT DOCUMENT DOWNLOAD: Empty buffer!');
          return NextResponse.json(
            { error: 'Document file is empty' },
            { status: 500 }
          );
        }
        
        // Generate filename with project info
        const fileExtension = documentRecord.fileName?.split('.').pop() || 'pdf';
        const documentType = documentRecord.documentType || 'document';
        const formattedDocumentType = documentType
          .replace(/_/g, '-')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        const downloadFileName = `${project.name || 'Project'}-${formattedDocumentType}.${fileExtension}`;
        
        // Return the file with proper headers
        const url = new URL(request.url);
        const isPreview = !url.searchParams.has('download');
        
        console.log('🔵 PROJECT DOCUMENT DOWNLOAD: About to return response', {
          bufferLength: buffer.length,
          contentType: documentRecord.mimeType,
          isPreview,
        });
        
        // For preview mode (thumbnails), use application/octet-stream to bypass
        // download managers like IDM that intercept application/pdf
        const contentType = isPreview 
          ? 'application/octet-stream'
          : (documentRecord.mimeType || 'application/octet-stream');
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': isPreview 
              ? `inline; filename="${encodeURIComponent(downloadFileName)}"`
              : `attachment; filename="${encodeURIComponent(downloadFileName)}"`,
            'Content-Length': buffer.length.toString(),
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
    console.error('Error downloading project document:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}

// GET handler for normal downloads and browser access
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  return handleDownload(request, context);
}

// POST handler to bypass IDM interception (IDM only intercepts GET requests)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  return handleDownload(request, context);
}
