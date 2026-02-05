const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function seed() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    console.log('🚀 Seeding Audit Logs via pg (no user_id)...');

    try {
        const logs = [
            {
                user_name: 'System Admin',
                action: 'create',
                subject_type: 'Project',
                subject_id: 'PROJ-001',
                description: 'Created new project: New Smart City Phase 1',
                severity: 'low',
            },
            {
                user_name: 'System Admin',
                action: 'update',
                subject_type: 'Employee',
                subject_id: 'EMP-456',
                description: 'Updated profile information for Ahmed Hassan',
                severity: 'low',
            },
            {
                user_name: 'Security Bot',
                action: 'unauthorized_access',
                subject_type: 'Sensitive Config',
                subject_id: 'CONFIG-SECURE',
                description: 'Unauthorized attempt to access system configuration',
                severity: 'high',
            }
        ];

        for (const log of logs) {
            await pool.query(
                'INSERT INTO audit_logs (user_name, action, subject_type, subject_id, description, severity) VALUES ($1, $2, $3, $4, $5, $6)',
                [log.user_name, log.action, log.subject_type, log.subject_id, log.description, log.severity]
            );
        }
        console.log('✅ Seeding complete!');
    } catch (err) {
        console.error('❌ Error Seeding:', err);
    } finally {
        await pool.end();
    }
}

seed();
