import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/rbac/api-middleware';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { sql } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

const backupSchema = z.object({
  type: z.enum(['full', 'schema', 'data']).default('full'),
  includeMedia: z.boolean().default(false),
  compression: z.boolean().default(true),
});

export const POST = withRole(['SUPER_ADMIN'])(
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authConfig);
      if (!session?.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const body = await request.json();
      const { type, includeMedia, compression } = backupSchema.parse(body);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `backup_${timestamp}`;
      
      // Create backup directory
      const backupDir = join(process.cwd(), 'backups', backupId);
      await mkdir(backupDir, { recursive: true });

      let backupData: any = {
        id: backupId,
        timestamp: new Date().toISOString(),
        type,
        createdBy: session.user?.email,
        version: '1.0',
        database: {
          type: 'postgresql',
          schema: 'public'
        }
      };

      if (type === 'full' || type === 'schema') {
        // Export schema
        const schemaResult = await db.execute(sql`
          SELECT 
            schemaname,
            tablename,
            tableowner,
            hasindexes,
            hasrules,
            hastriggers,
            rowsecurity
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename
        `);

        const tables = (schemaResult as any).rows || [];
        
        // Get table structures
        const tableStructures = [];
        for (const table of tables) {
          const structureResult = await db.execute(sql`
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default,
              character_maximum_length,
              numeric_precision,
              numeric_scale
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = ${table.tablename}
            ORDER BY ordinal_position
          `);
          
          const constraintsResult = await db.execute(sql`
            SELECT 
              tc.constraint_name,
              tc.constraint_type,
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            LEFT JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.table_schema = 'public'
            AND tc.table_name = ${table.tablename}
          `);

          tableStructures.push({
            table: table.tablename,
            owner: table.tableowner,
            columns: (structureResult as any).rows || [],
            constraints: (constraintsResult as any).rows || []
          });
        }

        backupData.schema = {
          tables: tableStructures,
          metadata: {
            totalTables: tables.length,
            exportedAt: new Date().toISOString()
          }
        };
      }

      if (type === 'full' || type === 'data') {
        // Export data
        const dataExport: any = {};
        
        for (const table of backupData.schema?.tables || []) {
          try {
            const dataResult = await db.execute(sql.raw(`SELECT * FROM ${table.table}`));
            dataExport[table.table] = (dataResult as any).rows || [];
          } catch (error) {
            console.warn(`Failed to export data from table ${table.table}:`, error);
            dataExport[table.table] = [];
          }
        }

        backupData.data = {
          tables: dataExport,
          metadata: {
            exportedAt: new Date().toISOString(),
            totalRecords: Object.values(dataExport).reduce((sum: number, records: any) => sum + records.length, 0)
          }
        };
      }

      // Save backup file
      const backupFile = join(backupDir, `${backupId}.json`);
      await writeFile(backupFile, JSON.stringify(backupData, null, 2));

      // Create backup manifest
      const manifest = {
        id: backupId,
        timestamp: backupData.timestamp,
        type,
        createdBy: session.user?.email,
        fileSize: (await import('fs')).promises.stat(backupFile).then(s => s.size),
        status: 'completed',
        downloadUrl: `/api/admin/backup/${backupId}/download`
      };

      const manifestFile = join(backupDir, 'manifest.json');
      await writeFile(manifestFile, JSON.stringify(manifest, null, 2));

      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        backup: {
          id: backupId,
          timestamp: backupData.timestamp,
          type,
          status: 'completed',
          downloadUrl: `/api/admin/backup/${backupId}/download`,
          fileSize: await (await import('fs')).promises.stat(backupFile).then(s => s.size)
        }
      });

    } catch (error) {
      console.error('Backup creation failed:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create backup',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
);

export const GET = withRole(['SUPER_ADMIN'])(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      // List available backups
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const backupsDir = path.join(process.cwd(), 'backups');
      
      try {
        const backupDirs = await fs.readdir(backupsDir);
        const backups = [];

        for (const dir of backupDirs) {
          const manifestPath = path.join(backupsDir, dir, 'manifest.json');
          try {
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent);
            backups.push(manifest);
          } catch (error) {
            console.warn(`Failed to read manifest for backup ${dir}:`, error);
          }
        }

        // Sort by timestamp (newest first)
        backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const paginatedBackups = backups.slice(offset, offset + limit);
        const total = backups.length;

        return NextResponse.json({
          success: true,
          backups: paginatedBackups,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });

      } catch (error) {
        // If backups directory doesn't exist, return empty list
        return NextResponse.json({
          success: true,
          backups: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      }

    } catch (error) {
      console.error('Failed to list backups:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to list backups',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
);