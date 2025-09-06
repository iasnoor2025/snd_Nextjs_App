import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/rbac/api-middleware';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/drizzle';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

const restoreSchema = z.object({
  confirmRestore: z.boolean(),
  createBackupBeforeRestore: z.boolean().default(true)
});

export const POST = withRole(['SUPER_ADMIN'])(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const session = await getServerSession(authConfig);
      if (!session?.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const backupId = params.id;
      const body = await request.json();
      const { confirmRestore, createBackupBeforeRestore } = restoreSchema.parse(body);

      if (!confirmRestore) {
        return NextResponse.json(
          {
            success: false,
            message: 'Restore confirmation required'
          },
          { status: 400 }
        );
      }

      // Create backup before restore if requested
      if (createBackupBeforeRestore) {
        const backupResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/backup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            type: 'full',
            includeMedia: false,
            compression: true
          })
        });

        if (!backupResponse.ok) {
          return NextResponse.json(
            {
              success: false,
              message: 'Failed to create pre-restore backup'
            },
            { status: 500 }
          );
        }
      }

      // Read backup file
      const backupDir = join(process.cwd(), 'backups', backupId);
      const backupFile = join(backupDir, `${backupId}.json`);
      
      const backupData = await readFile(backupFile, 'utf-8');
      const backup = JSON.parse(backupData);

      // Start transaction
      await db.execute(sql`BEGIN`);

      try {
        // Drop existing tables (in reverse dependency order)
        const dropQueries = [
          'DROP TABLE IF EXISTS tax_document_payrolls CASCADE',
          'DROP TABLE IF EXISTS time_entries CASCADE',
          'DROP TABLE IF EXISTS timesheet_approvals CASCADE',
          'DROP TABLE IF EXISTS weekly_timesheets CASCADE',
          'DROP TABLE IF EXISTS timesheets CASCADE',
          'DROP TABLE IF EXISTS salary_increments CASCADE',
          'DROP TABLE IF EXISTS payroll_items CASCADE',
          'DROP TABLE IF EXISTS payrolls CASCADE',
          'DROP TABLE IF EXISTS payroll_runs CASCADE',
          'DROP TABLE IF EXISTS advance_payment_histories CASCADE',
          'DROP TABLE IF EXISTS advance_payments CASCADE',
          'DROP TABLE IF EXISTS loans CASCADE',
          'DROP TABLE IF EXISTS employee_training CASCADE',
          'DROP TABLE IF EXISTS employee_skill CASCADE',
          'DROP TABLE IF EXISTS employee_salaries CASCADE',
          'DROP TABLE IF EXISTS employee_resignations CASCADE',
          'DROP TABLE IF EXISTS employee_performance_reviews CASCADE',
          'DROP TABLE IF EXISTS employee_leaves CASCADE',
          'DROP TABLE IF EXISTS employee_documents CASCADE',
          'DROP TABLE IF EXISTS employee_assignments CASCADE',
          'DROP TABLE IF EXISTS equipment_maintenance_items CASCADE',
          'DROP TABLE IF EXISTS equipment_maintenance CASCADE',
          'DROP TABLE IF EXISTS equipment_rental_history CASCADE',
          'DROP TABLE IF EXISTS rental_operator_assignments CASCADE',
          'DROP TABLE IF EXISTS rental_items CASCADE',
          'DROP TABLE IF EXISTS rentals CASCADE',
          'DROP TABLE IF EXISTS project_resources CASCADE',
          'DROP TABLE IF EXISTS projects CASCADE',
          'DROP TABLE IF EXISTS equipment CASCADE',
          'DROP TABLE IF EXISTS locations CASCADE',
          'DROP TABLE IF EXISTS customers CASCADE',
          'DROP TABLE IF EXISTS employees CASCADE',
          'DROP TABLE IF EXISTS designations CASCADE',
          'DROP TABLE IF EXISTS departments CASCADE',
          'DROP TABLE IF EXISTS organizational_units CASCADE',
          'DROP TABLE IF EXISTS skills CASCADE',
          'DROP TABLE IF EXISTS trainings CASCADE',
          'DROP TABLE IF EXISTS geofence_zones CASCADE',
          'DROP TABLE IF EXISTS companies CASCADE',
          'DROP TABLE IF EXISTS media CASCADE',
          'DROP TABLE IF EXISTS password_reset_tokens CASCADE',
          'DROP TABLE IF EXISTS sessions CASCADE',
          'DROP TABLE IF EXISTS cache CASCADE',
          'DROP TABLE IF EXISTS jobs CASCADE',
          'DROP TABLE IF EXISTS failed_jobs CASCADE',
          'DROP TABLE IF EXISTS personal_access_tokens CASCADE',
          'DROP TABLE IF EXISTS telescope_entry_tags CASCADE',
          'DROP TABLE IF EXISTS telescope_entries CASCADE',
          'DROP TABLE IF EXISTS telescope_monitoring CASCADE',
          'DROP TABLE IF EXISTS time_off_requests CASCADE',
          'DROP TABLE IF EXISTS model_has_permissions CASCADE',
          'DROP TABLE IF EXISTS model_has_roles CASCADE',
          'DROP TABLE IF EXISTS role_has_permissions CASCADE',
          'DROP TABLE IF EXISTS roles CASCADE',
          'DROP TABLE IF EXISTS permissions CASCADE',
          'DROP TABLE IF EXISTS users CASCADE',
          'DROP TABLE IF EXISTS _prisma_migrations CASCADE',
        ];

        for (const query of dropQueries) {
          await db.execute(sql.raw(query));
        }

        // Recreate schema from backup
        if (backup.schema && backup.schema.tables) {
          for (const table of backup.schema.tables) {
            // Create table structure
            const createTableQuery = `CREATE TABLE ${table.table} (
              ${table.columns.map((col: any) => {
                let columnDef = `${col.column_name} ${col.data_type}`;
                if (col.character_maximum_length) {
                  columnDef += `(${col.character_maximum_length})`;
                }
                if (col.numeric_precision) {
                  columnDef += `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})`;
                }
                if (col.is_nullable === 'NO') {
                  columnDef += ' NOT NULL';
                }
                if (col.column_default) {
                  columnDef += ` DEFAULT ${col.column_default}`;
                }
                return columnDef;
              }).join(', ')}
            )`;

            await db.execute(sql.raw(createTableQuery));

            // Add constraints
            for (const constraint of table.constraints) {
              if (constraint.constraint_type === 'PRIMARY KEY') {
                await db.execute(sql.raw(`ALTER TABLE ${table.table} ADD CONSTRAINT ${constraint.constraint_name} PRIMARY KEY (${constraint.column_name})`));
              } else if (constraint.constraint_type === 'FOREIGN KEY') {
                await db.execute(sql.raw(`ALTER TABLE ${table.table} ADD CONSTRAINT ${constraint.constraint_name} FOREIGN KEY (${constraint.column_name}) REFERENCES ${constraint.foreign_table_name}(${constraint.foreign_column_name})`));
              }
            }
          }
        }

        // Restore data
        if (backup.data && backup.data.tables) {
          for (const [tableName, records] of Object.entries(backup.data.tables)) {
            if (Array.isArray(records) && records.length > 0) {
              const columns = Object.keys(records[0]);
              const values = records.map(record => 
                `(${columns.map(col => {
                  const value = record[col];
                  if (value === null) return 'NULL';
                  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                  return value;
                }).join(', ')})`
              );

              const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${values.join(', ')}`;
              await db.execute(sql.raw(insertQuery));
            }
          }
        }

        await db.execute(sql`COMMIT`);

        return NextResponse.json({
          success: true,
          message: 'Database restored successfully',
          restoredFrom: backupId,
          restoredAt: new Date().toISOString(),
          restoredBy: session.user?.email
        });

      } catch (error) {
        await db.execute(sql`ROLLBACK`);
        throw error;
      }

    } catch (error) {
      console.error('Database restore failed:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to restore database',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
);