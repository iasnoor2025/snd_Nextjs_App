import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';

export async function GET() {
  try {
    const result = await SupabaseStorageService.listBuckets();
    
    if (result.success && result.buckets) {
      return NextResponse.json({
        success: true,
        buckets: result.buckets
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.error || 'Failed to list buckets',
          error: result.error
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error listing buckets:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to list buckets',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
