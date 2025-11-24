import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/rbac/api-middleware';
import { rm } from 'fs/promises';
import { join } from 'path';

export const DELETE = withRole(['SUPER_ADMIN'])(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const backupId = params.id;
      const backupDir = join(process.cwd(), 'backups', backupId);

      // Remove backup directory
      await rm(backupDir, { recursive: true, force: true });

      return NextResponse.json({
        success: true,
        message: 'Backup deleted successfully',
        deletedBackup: backupId
      });

    } catch (error) {
      console.error('Backup deletion failed:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to delete backup',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
);