import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';
import { STORAGE_BUCKETS } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    let file: File;
    let type: string;
    let bucket: string;
    let targetBucket: any;

    // Check if it's JSON or multipart form data
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      // Handle JSON format (from employee management)
      const body = await request.json();
      const { file: fileData, bucket: bucketName, path } = body;
      
      if (!fileData) {
        return NextResponse.json(
          {
            success: false,
            message: 'No file provided',
          },
          { status: 400 }
        );
      }

      // Convert base64 back to File object
      const base64Data = fileData.content;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      file = new File([byteArray], fileData.name, { type: fileData.type });
      type = path || 'general';
      bucket = bucketName || 'general';
      targetBucket = bucket; // Use the bucket name directly
      
    } else {
      // Handle multipart form data (from demo page)
      const formData = await request.formData();
      file = formData.get('file') as File;
      type = formData.get('type') as string;
      bucket = formData.get('bucket') as string;

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
      if (bucket) {
        targetBucket = bucket; // Use the bucket name directly
      } else if (type === 'employee') {
        targetBucket = 'employee-documents';
      } else if (type === 'equipment') {
        targetBucket = 'equipment-documents';
      } else {
        targetBucket = 'general';
      }
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

// Note: This API now handles both JSON and multipart form data
