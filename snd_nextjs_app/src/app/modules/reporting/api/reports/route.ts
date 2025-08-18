import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { analyticsReports } from '@/lib/drizzle/schema';
import { getRBACPermissions } from '@/lib/rbac/rbac-utils';
import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('read', 'Report')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const skip = (page - 1) * limit;

    // Build where conditions for Drizzle
    let whereConditions = [eq(analyticsReports.isActive, true)];

    if (search) {
      whereConditions.push(
        or(
          like(analyticsReports.name, `%${search}%`),
          like(analyticsReports.description, `%${search}%`)
        )
      );
    }

    if (status && status !== 'all') {
      whereConditions.push(eq(analyticsReports.status, status));
    }

    if (type && type !== 'all') {
      whereConditions.push(eq(analyticsReports.type, type));
    }

    const whereExpr = and(...whereConditions);

    // Get reports with pagination using Drizzle
    const [reports, totalResult] = await Promise.all([
      db
        .select({
          id: analyticsReports.id,
          name: analyticsReports.name,
          type: analyticsReports.type,
          status: analyticsReports.status,
          createdBy: analyticsReports.createdBy,
          createdAt: analyticsReports.createdAt,
          lastGenerated: analyticsReports.lastGenerated,
          schedule: analyticsReports.schedule,
          description: analyticsReports.description,
        })
        .from(analyticsReports)
        .where(whereExpr)
        .orderBy(desc(analyticsReports.createdAt))
        .offset(skip)
        .limit(limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(analyticsReports)
        .where(whereExpr),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: reports,
      current_page: page,
      last_page: totalPages,
      per_page: limit,
      total,
      next_page_url: page < totalPages ? `/api/reports?page=${page + 1}&limit=${limit}` : null,
      prev_page_url: page > 1 ? `/api/reports?page=${page - 1}&limit=${limit}` : null,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('create', 'Report')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await _request.json();
    const { name, type, description, schedule, parameters } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const reportRows = await db
      .insert(analyticsReports)
      .values({
        name,
        type,
        description: description || null,
        schedule: schedule || null,
        parameters: parameters ? JSON.stringify(parameters) : null,
        createdBy: session.user.email || session.user.name || 'Unknown',
        status: 'active',
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    const report = reportRows[0];

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
