import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { customerDocuments, customers } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: customerId, documentId } = await params;
    
    // Get document record from database
    const documentResult = await db
      .select()
      .from(customerDocuments)
      .where(eq(customerDocuments.id, parseInt(documentId)))
      .limit(1);

    if (!documentResult[0]) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const documentRecord = documentResult[0];

    // Get customer information from the document's customer_id
    const customerResult = await db
      .select()
      .from(customers)
      .where(eq(customers.id, documentRecord.customerId))
      .limit(1);

    if (!customerResult[0]) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = customerResult[0];
    
    // Debug logging
    console.log('Customer document download debug:', {
      documentId: documentRecord.id,
      documentCustomerId: documentRecord.customerId,
      urlCustomerId: customerId,
      documentType: documentRecord.documentType,
      fileName: documentRecord.fileName
    });

    // Check if user has permission to access this document
    if (session.user.role !== 'SUPER_ADMIN' && 
        session.user.role !== 'ADMIN' && 
        session.user.role !== 'MANAGER' &&
        session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If the document is stored in MinIO/S3 (URL starts with http/https)
    if (documentRecord.filePath && documentRecord.filePath.startsWith('http')) {
      try {
        console.log('Fetching from MinIO:', documentRecord.filePath);
        
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
        const bucketName = 'customer-documents';
        if (key.startsWith(`${bucketName}/`)) {
          key = key.substring(bucketName.length + 1);
        }

        console.log('Fetching from MinIO - bucket:', bucketName, 'key:', key);

        // Get the object from S3
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });

        const response = await s3Client.send(command);
        
        if (!response.Body) {
          throw new Error('No body in response');
        }

        const buffer = await response.Body.transformToByteArray();
        
        // Generate filename with customer info
        const fileExtension = documentRecord.fileName?.split('.').pop() || 'pdf';
        const documentType = documentRecord.documentType || 'document';
        const formattedDocumentType = documentType
          .replace(/_/g, '-')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        const downloadFileName = `${customer.companyName || 'Customer'}-${formattedDocumentType}.${fileExtension}`;
        
        // Return the file with proper download headers
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': documentRecord.mimeType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadFileName)}"`,
            'Content-Length': buffer.length.toString(),
          },
        });
      } catch (error) {
        console.error('Error fetching document from MinIO:', error);
        return NextResponse.json(
          { error: 'Failed to fetch document' },
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
    console.error('Error downloading customer document:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}
