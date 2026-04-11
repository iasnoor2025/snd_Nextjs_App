import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectDocuments, projects } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';

// Shared handler for both GET and POST (POST used to bypass IDM interception).
// Uses project.read (same as GET /documents list) — not a narrow role whitelist.
async function handleDownload(
  request: NextRequest,
  ...args: unknown[]
) {
  try {
    const { params } = args[0] as { params: Promise<{ id: string; documentId: string }> };
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

        if (!buffer || buffer.length === 0) {
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

        // For preview mode (thumbnails), use application/octet-stream to bypass
        // download managers like IDM that intercept application/pdf
        const contentType = isPreview 
          ? 'application/octet-stream'
          : (documentRecord.mimeType || 'application/octet-stream');
        
        return new NextResponse(Buffer.from(buffer), {
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

export const GET = withPermission(PermissionConfigs.project.read)(handleDownload);
export const POST = withPermission(PermissionConfigs.project.read)(handleDownload);
