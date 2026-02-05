import { db } from '@/lib/db';
import { auditLogs } from '@/lib/drizzle/schema';
import { logger } from '@/lib/logger';

export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'unauthorized_access' | 'approve' | 'reject' | 'export' | 'import';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogParams {
    userId?: string;
    userName?: string;
    action: AuditAction;
    subjectType: string;
    subjectId?: string;
    description: string;
    changes?: {
        before?: Record<string, any>;
        after?: Record<string, any>;
    };
    ipAddress?: string;
    userAgent?: string;
    severity?: Severity;
}

export class AuditService {
    /**
     * Records an audit log entry in the database.
     */
    static async log(params: AuditLogParams) {
        try {
            // Basic validation
            if (!params.action || !params.subjectType || !params.description) {
                logger.error('Invalid audit log parameters', params);
                return;
            }

            const entry = {
                userId: params.userId ? parseInt(params.userId, 10) : null,
                userName: params.userName || null,
                action: params.action,
                subjectType: params.subjectType,
                subjectId: params.subjectId || null,
                description: params.description,
                changes: params.changes || null,
                ipAddress: params.ipAddress || null,
                userAgent: params.userAgent || null,
                severity: params.severity || 'low',
            };

            await db.insert(auditLogs).values(entry);

            // Also log to application logger for immediate visibility in dev/logs
            logger.log(`Audit Log [${params.severity || 'low'}]: ${params.action} on ${params.subjectType} - ${params.description}`);
        } catch (error) {
            // We don't want audit logging failures to crash the main request
            logger.error('Failed to record audit log:', error);
        }
    }

    /**
     * Helper for logging unauthorized access attempts
     */
    static async logUnauthorized(params: Omit<AuditLogParams, 'action' | 'severity'>) {
        return this.log({
            ...params,
            action: 'unauthorized_access',
            severity: 'high',
        });
    }

    /**
     * Helper for logging CRUD operations
     */
    static async logCRUD(
        action: 'create' | 'update' | 'delete',
        subjectType: string,
        subjectId: string,
        description: string,
        options: Partial<AuditLogParams> = {}
    ) {
        return this.log({
            ...options,
            action,
            subjectType,
            subjectId,
            description,
        });
    }
}
