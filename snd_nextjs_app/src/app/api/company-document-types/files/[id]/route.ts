import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { NextRequest, NextResponse } from 'next/server';

export const DELETE = withPermission(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const fileId = parseInt(id);

    if (isNaN(fileId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file ID',
        },
        { status: 400 }
      );
    }

    // For now, return success with mock data
    // In a real implementation, you'd:
    // 1. Delete the file from S3/MinIO
    // 2. Remove file metadata from the database

    return NextResponse.json({
      success: true,
      message: 'Document file deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete document file: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.company.manage);
