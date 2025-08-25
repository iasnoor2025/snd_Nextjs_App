import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';
import { STORAGE_BUCKETS } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
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

    // Determine bucket based on type or use provided bucket
    let targetBucket = STORAGE_BUCKETS.GENERAL;
    if (bucket) {
      targetBucket = bucket as any;
    } else if (type === 'employee') {
      targetBucket = STORAGE_BUCKETS.EMPLOYEE_DOCUMENTS;
    } else if (type === 'equipment') {
      targetBucket = STORAGE_BUCKETS.EQUIPMENT_DOCUMENTS;
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
