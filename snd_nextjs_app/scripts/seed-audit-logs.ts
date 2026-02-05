#!/usr/bin/env tsx

import { db } from '../src/lib/drizzle';
import { sql } from 'drizzle-orm';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function seedAuditLogs() {
    console.log('🚀 Seeding Dummy Audit Logs');
    console.log('============================\n');

    try {
        const logs = [
            {
                user_id: 1,
                user_name: 'System Admin',
                action: 'create',
                subject_type: 'Project',
                subject_id: 'PROJ-001',
                description: 'Created new project: New Smart City Phase 1',
                severity: 'low',
            },
            {
                user_id: 1,
                user_name: 'System Admin',
                action: 'update',
                subject_type: 'Employee',
                subject_id: 'EMP-456',
                description: 'Updated profile information for Ahmed Hassan',
                severity: 'low',
            },
            {
                user_id: 1,
                user_name: 'System Admin',
                action: 'unauthorized_access',
                subject_type: 'Sensitive Config',
                subject_id: 'CONFIG-SECURE',
                description: 'Unauthorized attempt to access system configuration',
                severity: 'high',
            }
        ];

        console.log('📄 Inserting dummy logs via raw SQL...');

        for (const log of logs) {
            await db.execute(sql`
        INSERT INTO audit_logs (user_id, user_name, action, subject_type, subject_id, description, severity)
        VALUES (${log.user_id}, ${log.user_name}, ${log.action}, ${log.subject_type}, ${log.subject_id}, ${log.description}, ${log.severity})
      `);
        }

        console.log('✅ Successfully seeded dummy audit logs!');

    } catch (error: any) {
        console.error('❌ Seeding failed:', error.message);
    }
}

seedAuditLogs().catch(console.error);
