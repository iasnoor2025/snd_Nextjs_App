import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path: pathArray } = await params;
    const filePath = pathArray.join('/');

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

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

    const bucketName = 'chat-media';

    // Get the object from S3
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Determine content type
    const contentType =
      response.ContentType ||
      (filePath.endsWith('.png')
        ? 'image/png'
        : filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')
          ? 'image/jpeg'
          : filePath.endsWith('.gif')
            ? 'image/gif'
            : filePath.endsWith('.webp')
              ? 'image/webp'
              : 'application/octet-stream');

    const buffer = await response.Body.transformToByteArray();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error fetching chat media:', error);
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}

