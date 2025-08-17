import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { withAuth } from '@/lib/rbac/api-middleware';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for MinIO
});

// Helper function to generate unique filename
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
}

// Helper function to validate file type
function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.toLowerCase().split('.').pop();
  return allowedTypes.includes(`.${extension}`);
}

// Helper function to validate file size (10MB max)
function isValidFileSize(size: number): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return size <= maxSize;
}

export async function POST(_request: NextRequest) {
  try {
    console.log('File upload API called');

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

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
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    if (!isValidFileType(file.name, allowedTypes)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file type. Allowed types: PDF, JPG, JPEG, PNG, DOC, DOCX',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size too large. Maximum size is 10MB',
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    const folder = type || 'general';
    const key = `uploads/${folder}/${uniqueFilename}`;

    try {
      // Upload to S3-compatible storage
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || 'mix-app-uploads',
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ACL: 'public-read',
      });

      await s3Client.send(uploadCommand);

      // Generate URL
      const baseUrl = process.env.S3_ENDPOINT 
        ? process.env.S3_ENDPOINT.replace('https://', '').replace('http://', '')
        : `${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
      
      const fileUrl = `https://${baseUrl}/${key}`;

      console.log(`File uploaded successfully: ${fileUrl}`);

      return NextResponse.json({
        success: true,
        url: fileUrl,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        message: 'File uploaded successfully',
      });
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error);
      
      // Fallback to local storage if S3 fails
      try {
        const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
        
        // Create directory if it doesn't exist
        if (!existsSync(uploadDir)) {
          mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = join(uploadDir, uniqueFilename);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${folder}/${uniqueFilename}`;

        console.log(`File uploaded to local storage: ${fileUrl}`);

        return NextResponse.json({
          success: true,
          url: fileUrl,
          filename: uniqueFilename,
          originalName: file.name,
          size: file.size,
          type: file.type,
          message: 'File uploaded to local storage successfully',
        });
      } catch (localError) {
        console.error('Local storage upload error:', localError);
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to upload file to both S3 and local storage',
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}

// Configure Next.js to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
}; 
