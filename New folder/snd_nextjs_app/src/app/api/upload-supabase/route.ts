import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

// Ensure Node.js runtime (Buffer, AWS SDK) is available
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UploadJsonBody = {
  file: {
    name: string;
    size: number;
    type: string;
    content: string; // base64 without data: prefix
  };
  bucket?: string;
  path?: string; // logical path/prefix
  documentTypeId?: number;
  expiryDate?: string;
};

// POST /api/upload-supabase
// Accepts JSON with base64 file and uploads to S3/MinIO, returning a public URL
export const POST = withPermission(PermissionConfigs.document.upload)(async (request: NextRequest) => {
  try {
    const body = (await request.json()) as UploadJsonBody;

    if (!body?.file?.content || !body?.file?.name || !body?.file?.type) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload: missing file fields' },
        { status: 400 }
      );
    }

    const { name, size, type, content } = body.file;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Decode base64 -> Buffer
    let buffer: Buffer;
    try {
      buffer = Buffer.from(content, 'base64');
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid base64 content' },
        { status: 400 }
      );
    }

    // Configure S3 client (MinIO-compatible)
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { success: false, message: 'S3 storage is not configured' },
        { status: 500 }
      );
    }

    const s3 = new S3Client({
      endpoint,
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    const bucket = body.bucket || 'general';
    const prefix = (body.path || 'uploads').replace(/^\/+|\/+$/g, '');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = name.replace(/[^A-Za-z0-9._-]/g, '_');
    const key = `${prefix}/${timestamp}-${safeName}`;

    try {
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: type,
      }));
    } catch (sdkError) {
      console.error('S3 upload failed:', sdkError);
      return NextResponse.json(
        {
          success: false,
          message: 'Storage upload failed',
          details: (sdkError as Error).message || String(sdkError),
        },
        { status: 500 }
      );
    }

    const baseUrl = (process.env.S3_ENDPOINT || '').replace(/\/$/, '');
    const publicUrl = `${baseUrl}/${bucket}/${key}`; // keep protocol as configured (dev may be http)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      bucket,
      key,
      filename: safeName,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('upload-supabase error:', error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Upload failed' },
      { status: 500 }
    );
  }
});


