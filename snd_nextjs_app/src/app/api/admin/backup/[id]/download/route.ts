import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/rbac/api-middleware';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

export const GET = withRole(['SUPER_ADMIN'])(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const backupId = params.id;
      const backupDir = join(process.cwd(), 'backups', backupId);
      const backupFile = join(backupDir, `${backupId}.json`);

      // Check if backup exists
      try {
        await stat(backupFile);
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: 'Backup not found'
          },
          { status: 404 }
        );
      }

      // Read backup file
      const backupData = await readFile(backupFile, 'utf-8');
      const backup = JSON.parse(backupData);

      // Set headers for file download
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Content-Disposition', `attachment; filename="${backupId}.json"`);
      headers.set('Cache-Control', 'no-cache');

      return new NextResponse(backupData, {
        status: 200,
        headers
      });

    } catch (error) {
      console.error('Backup download failed:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to download backup',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
);