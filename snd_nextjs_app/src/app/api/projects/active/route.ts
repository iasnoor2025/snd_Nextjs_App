import { db } from '@/lib/db';
import { projects as projectsTable } from '@/lib/drizzle/schema';
import { PermissionConfigs, withReadPermission } from '@/lib/rbac/api-middleware';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withReadPermission(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const search = (searchParams.get('search') || '').trim();

    const filters = [eq(projectsTable.status, 'active' as any)];
    if (search) {
      filters.push(ilike(projectsTable.name, `%${search}%`));
    }
    const whereExpr = and(...filters);

    const totalRows = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(whereExpr);
    const total = totalRows.length;
    const items = await db
      .select({
        id: projectsTable.id,
        name: projectsTable.name,
        start_date: projectsTable.startDate,
        end_date: projectsTable.endDate,
        status: projectsTable.status,
      })
      .from(projectsTable)
      .where(whereExpr)
      .orderBy(desc(projectsTable.createdAt), desc(projectsTable.id))
      .offset((page - 1) * limit)
      .limit(limit);

    const data = items.map(p => ({
      id: p.id,
      name: p.name,
      customer: null,
      start_date: p.start_date,
      end_date: p.end_date,
      status: p.status,
    }));

    const totalPages = Math.ceil(total / limit) || 1;
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching active projects:', error);
    return NextResponse.json({ error: 'Failed to fetch active projects' }, { status: 500 });
  }
}, PermissionConfigs.project.read);
