import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig({ path: '.env.local' });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const bucket = formData.get('bucket') as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size too large. Maximum size is 10MB.',
        },
        { status: 400 }
      );
    }

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

    // Determine bucket based on type or use provided bucket
    let targetBucket = 'general';
    if (bucket) {
      targetBucket = bucket;
    } else if (type === 'employee') {
      targetBucket = 'employee-documents';
    } else if (type === 'equipment') {
      targetBucket = 'equipment-documents';
    }

    // Generate descriptive filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = file.name.split('.').pop();
    const descriptiveFilename = `${type || 'file'}-${timestamp}.${fileExtension}`;

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload file to MinIO
    const command = new PutObjectCommand({
      Bucket: targetBucket,
      Key: descriptiveFilename,
      Body: fileBuffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Generate MinIO public URL - Force HTTPS for production
    const baseUrl = process.env.S3_ENDPOINT?.replace(/\/$/, '');
    const secureUrl = baseUrl?.replace(/^http:\/\//, 'https://') || baseUrl;
    const minioUrl = `${secureUrl}/${targetBucket}/${descriptiveFilename}`;

    return NextResponse.json({
      success: true,
      url: minioUrl,
      filename: descriptiveFilename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      bucket: targetBucket,
      message: 'File uploaded successfully to MinIO',
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}

// Note: Next.js 16 App Router handles body parsing automatically
// No need for the deprecated config export
