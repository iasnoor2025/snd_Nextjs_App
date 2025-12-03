import { db } from '@/lib/db';
import { departments, designations, employees as employeesTable } from '@/lib/drizzle/schema';
import { and, asc, eq, gte, ilike, inArray, isNotNull, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for fetching employees with expiring SPSP licenses
 * Used by n8n workflow to send WhatsApp notifications
 * 
 * Authentication: Bearer token in Authorization header
 * Query params:
 * - days: Number of days to look ahead (default: 10)
 * - includeExpired: Include already expired licenses (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    // Bearer token authentication from Authorization header
    const authHeader = request.headers.get('authorization');
    const expectedApiKey = process.env.N8N_API_KEY;
    
    if (expectedApiKey) {
      // Extract Bearer token
      const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;
      
      if (!token || token !== expectedApiKey) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid or missing authentication token' },
          { status: 401 }
        );
      }
    }
    
    const { searchParams } = new URL(request.url);

    const daysParam = parseInt(searchParams.get('days') || '10', 10);
    const includeExpired = searchParams.get('includeExpired') === '1' || searchParams.get('includeExpired') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(500, parseInt(searchParams.get('limit') || '100', 10)));

    const now = new Date();
    const days = isNaN(daysParam) ? 10 : daysParam;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Build filter conditions
    const conditions: any[] = [
      // Only active or on_leave employees
      inArray(employeesTable.status, ['active', 'on_leave']),
      // Must have SPSP license number
      isNotNull(employeesTable.spspLicenseNumber),
    ];

    // Date filter: expiring within X days
    const expiringCondition = and(
      gte(employeesTable.spspLicenseExpiry, now.toISOString().split('T')[0]),
      lte(employeesTable.spspLicenseExpiry, endDate.toISOString().split('T')[0])
    );

    if (includeExpired) {
      // Include both expiring and already expired
      conditions.push(
        or(
          expiringCondition,
          lt(employeesTable.spspLicenseExpiry, now.toISOString().split('T')[0])
        )
      );
    } else {
      // Only expiring within the window
      conditions.push(expiringCondition);
    }

    const whereExpr = and(...conditions);

    // Get total count
    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(employeesTable)
      .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
      .leftJoin(designations, eq(designations.id, employeesTable.designationId))
      .where(whereExpr);
    const totalCount = Number((totalRow as any)[0]?.count ?? 0);

    // Get employee data
    const rows = await db
      .select({
        id: employeesTable.id,
        firstName: employeesTable.firstName,
        middleName: employeesTable.middleName,
        lastName: employeesTable.lastName,
        fileNumber: employeesTable.fileNumber,
        phone: employeesTable.phone,
        email: employeesTable.email,
        spspLicenseNumber: employeesTable.spspLicenseNumber,
        spspLicenseExpiry: employeesTable.spspLicenseExpiry,
        departmentName: departments.name,
        designationName: designations.name,
      })
      .from(employeesTable)
      .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
      .leftJoin(designations, eq(designations.id, employeesTable.designationId))
      .where(whereExpr)
      .orderBy(asc(employeesTable.spspLicenseExpiry), asc(employeesTable.id))
      .offset((page - 1) * limit)
      .limit(limit);

    // Format response data
    const nowMs = now.getTime();
    const data = rows.map(e => {
      const fullName = [e.firstName, e.middleName, e.lastName].filter(Boolean).join(' ');
      const expiryDate = e.spspLicenseExpiry ? new Date(e.spspLicenseExpiry as unknown as string) : null;
      const isExpired = expiryDate ? expiryDate < now : false;
      const daysRemaining = expiryDate
        ? Math.ceil((expiryDate.getTime() - nowMs) / (1000 * 60 * 60 * 24))
        : null;
      
      return {
        id: e.id,
        name: fullName,
        fileNumber: e.fileNumber,
        phone: e.phone,
        email: e.email,
        department: e.departmentName || null,
        designation: e.designationName || null,
        spspLicenseNumber: e.spspLicenseNumber,
        spspLicenseExpiry: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
        daysRemaining,
        status: isExpired ? 'expired' : 'expiring',
      };
    });

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      success: true,
      data,
      summary: {
        totalExpiring: totalCount,
        daysWindow: days,
        generatedAt: now.toISOString(),
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('SPSP Expiring API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expiring SPSP licenses' },
      { status: 500 }
    );
  }
}

