import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/rbac/api-middleware';
import { getServerSession } from '@/lib/auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET(request: NextRequest) {
  try {
    // Check permissions - allow if user has read access to Document OR Project
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for Document permission
    const documentPermission = await checkApiPermission(request, {
      action: 'read',
      subject: 'Document',
    });

    // Check for Project permission
    const projectPermission = await checkApiPermission(request, {
      action: 'read',
      subject: 'Project',
    });

    // Allow if user has either permission
    if (!documentPermission.authorized && !projectPermission.authorized) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Requires read access to Document or Project.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pdfUrl = searchParams.get('url');

    if (!pdfUrl) {
      return NextResponse.json(
        { error: 'PDF URL is required' },
        { status: 400 }
      );
    }

    // Check if this is a MinIO/S3 URL that needs authentication
    const urlObj = new URL(pdfUrl);
    const isMinIO = urlObj.hostname.includes('minio') || urlObj.hostname.includes('s3');
    
    // If it's a MinIO URL, fetch using S3 credentials
    if (isMinIO) {
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

        // Extract bucket and key from URL
        // URL format: https://minio.snd-ksa.online/bucket-name/path/to/file
        const pathParts = urlObj.pathname.substring(1).split('/');
        const bucketName = pathParts[0];
        const key = pathParts.slice(1).join('/');

        if (!bucketName || !key) {
          return NextResponse.json(
            { error: 'Invalid MinIO URL format. Could not extract bucket or key.' },
            { status: 400 }
          );
        }

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
        const contentType = response.ContentType || 'application/pdf';

        // Return the PDF with proper headers
        return new NextResponse(new Uint8Array(buffer) as BodyInit, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Content-Length': buffer.length.toString(),
          },
        });
      } catch (s3Error: any) {
        console.error('Error fetching PDF from S3:', {
          error: s3Error,
          message: s3Error?.message,
          code: s3Error?.Code || s3Error?.$metadata?.httpStatusCode,
          bucket: urlObj.pathname.split('/')[1],
          key: urlObj.pathname.split('/').slice(2).join('/'),
        });
        
        // Check if it's an Access Denied error
        if (s3Error?.Code === 'AccessDenied' || s3Error?.message?.includes('Access Denied')) {
          return NextResponse.json(
            { 
              error: 'Access Denied. The bucket may not exist or you may not have permission to access it.',
              details: `Bucket: ${urlObj.pathname.split('/')[1]}, Key: ${urlObj.pathname.split('/').slice(2).join('/')}`
            },
            { status: 403 }
          );
        }
        
        return NextResponse.json(
          { error: `Failed to fetch PDF from storage: ${s3Error instanceof Error ? s3Error.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    }

    // For non-MinIO URLs, try direct fetch (e.g., public URLs)
    try {
      const response = await fetch(pdfUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        console.error(`Failed to fetch PDF from ${pdfUrl}: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: `Failed to fetch PDF: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const pdfBuffer = await response.arrayBuffer();

      // Return the PDF with proper headers
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': response.headers.get('content-type') || 'application/pdf',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Content-Length': pdfBuffer.byteLength.toString(),
        },
      });
    } catch (fetchError) {
      console.error('Error fetching PDF:', fetchError);
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error proxying PDF:', error);
    return NextResponse.json(
      { error: 'Failed to proxy PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

