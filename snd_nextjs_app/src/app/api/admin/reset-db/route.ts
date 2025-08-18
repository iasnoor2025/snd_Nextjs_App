import { db } from '@/lib/drizzle';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 Starting database reset...');

    // Drop all tables in reverse dependency order to respect foreign key constraints
    const dropQueries = [
      // Drop tables with foreign key dependencies first
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
      'DROP TABLE IF EXISTS analytics_reports CASCADE',
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

    console.log('🗑️ Dropping existing tables...');
    for (const query of dropQueries) {
      try {
        await db.execute(sql.raw(query));
        console.log(`✅ Dropped: ${query.split(' ')[4]}`);
      } catch (error) {
        console.log(`⚠️ Warning dropping ${query.split(' ')[4]}:`, error);
      }
    }

    console.log('🏗️ Creating new tables from Drizzle schema...');

    // Read and execute the generated migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(process.cwd(), 'drizzle', '0000_motionless_dagger.sql');

    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      const statements = migrationSQL.split('--> statement-breakpoint');

      for (const statement of statements) {
        const trimmedStatement = statement.trim();
        if (trimmedStatement) {
          try {
            await db.execute(sql.raw(trimmedStatement));
            console.log('✅ Created table from migration');
          } catch (error) {
            console.error('❌ Error creating table:', error);
            throw error;
          }
        }
      }
    } else {
      throw new Error('Migration file not found. Run npm run drizzle:generate first.');
    }

    console.log('👤 Creating admin user...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('password', 12);

    const adminUserResult = await db.execute(sql`
      INSERT INTO users (name, email, password, national_id, role_id, status, "isActive", created_at, updated_at)
      VALUES ('Admin User', 'admin@ias.com', ${hashedPassword}, '1234567890', 1, 1, true, CURRENT_DATE, CURRENT_DATE)
      RETURNING id, email, role_id, "isActive"
    `);

    const adminUser = (adminUserResult as any)[0];

    if (!adminUser) {
      throw new Error('Failed to create admin user');
    }

    console.log('✅ Database reset completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Database reset completed successfully',
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        roleId: adminUser.role_id,
        isActive: adminUser.isActive,
      },
      credentials: {
        email: 'admin@ias.com',
        password: 'password',
      },
    });
  } catch (error) {
    console.error('❌ Error during database reset:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reset database',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
