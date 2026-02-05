#!/usr/bin/env tsx

import { db } from '../src/lib/drizzle';
import { auditLogs } from '../src/lib/drizzle/schema';
import { desc } from 'drizzle-orm';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function checkAuditLogs() {
    console.log('🔍 Checking Audit Logs');
    console.log('============================\n');

    try {
        // Check total records
        console.log('📄 Checking total audit log records...');
        const result = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10);

        console.log(`📄 Records found: ${result.length}\n`);

        if (result.length > 0) {
            result.forEach((log, index) => {
                console.log(`${index + 1}. [${log.createdAt}] ${log.action} on ${log.subjectType}`);
                console.log(`   User: ${log.userName} (ID: ${log.userId})`);
                console.log(`   Description: ${log.description}`);
                console.log(`   Severity: ${log.severity}`);
                console.log('---');
            });
        } else {
            console.log('  No audit log records found.');
        }

    } catch (error: any) {
        console.error('❌ Audit log check failed:', error.message);
    }
}

checkAuditLogs().catch(console.error);
