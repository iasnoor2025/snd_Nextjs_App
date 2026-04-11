import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectDocuments, projects } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';

// Preview endpoint - returns document data for inline preview
// Uses different path from /download to avoid IDM interception
async function previewHandler(request: NextRequest, ...args: unknown[]) {
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
        
        const previewFileName = `${project.name || 'Project'}-${formattedDocumentType}.${fileExtension}`;
        
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
        return new NextResponse(Buffer.from(buffer), {
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
    console.error('Error previewing project document:', error);
    return NextResponse.json(
      { error: 'Failed to preview document' },
      { status: 500 }
    );
  }
}

export const GET = withPermission(PermissionConfigs.project.read)(previewHandler);
export const POST = withPermission(PermissionConfigs.project.read)(previewHandler);
