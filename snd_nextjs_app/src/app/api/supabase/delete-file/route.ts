import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket, path } = body;

    if (!bucket || !path) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bucket and path are required',
        },
        { status: 400 }
      );
    }

    // Use bucket name directly
    const targetBucket = bucket;

    // Delete file from Supabase storage
    const result = await SupabaseStorageService.deleteFile(targetBucket, path);

    if (result.success) {
      return NextResponse.json({
        success: true,
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
    console.error('Delete file error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete file: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
