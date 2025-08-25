import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';

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

    // Determine bucket based on type or use provided bucket
    let targetBucket = 'general';
    if (bucket) {
      targetBucket = bucket;
    } else if (type === 'employee') {
      targetBucket = 'employee-documents';
    } else if (type === 'equipment') {
      targetBucket = 'equipment-documents';
    }

    // Upload file using Supabase storage service
    const result = await SupabaseStorageService.uploadFile(file, targetBucket, type);

    if (result.success) {
      return NextResponse.json({
        success: true,
        url: result.url,
        filename: result.filename,
        originalName: result.originalName,
        size: result.size,
        type: result.type,
        bucket: targetBucket,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          error: result.error,
        },
        { status: 400 }
      );
    }
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

// Configure Next.js to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};
