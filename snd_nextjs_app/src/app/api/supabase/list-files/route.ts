import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket, path } = body;

    if (!bucket) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bucket is required',
        },
        { status: 400 }
      );
    }

    // Use bucket name directly
    const targetBucket = bucket;

    // List files from Supabase storage
    const result = await SupabaseStorageService.listFiles(targetBucket, path);

    if (result.success) {
      return NextResponse.json({
        success: true,
        files: result.files || [],
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
    console.error('List files error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to list files: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
