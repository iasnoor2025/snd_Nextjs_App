import { db } from '@/lib/db';
import { analyticsReports } from '@/lib/drizzle/schema';
import { and, desc, eq, like, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const skip = (page - 1) * limit;

    const whereConditions: any[] = [];

    if (search) {
      whereConditions.push(
        or(
          like(analyticsReports.name, `%${search}%`),
          like(analyticsReports.description, `%${search}%`),
          like(analyticsReports.createdBy, `%${search}%`)
        )
      );
    }

    if (status && status !== 'all') {
      whereConditions.push(eq(analyticsReports.status, status));
    }

    if (type && type !== 'all') {
      whereConditions.push(eq(analyticsReports.type, type));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Generate cache key based on filters and pagination
    const cacheKey = generateCacheKey('analytics', 'list', { page, limit, search, status, type });
    
    return await cacheQueryResult(
      cacheKey,
      async () => {
        const [analyticsRows, totalRows] = await Promise.all([
          db
            .select()
            .from(analyticsReports)
            .where(whereClause)
            .limit(limit)
            .offset(skip)
            .orderBy(desc(analyticsReports.createdAt)),
          db.select({ count: analyticsReports.id }).from(analyticsReports).where(whereClause),
        ]);

        const total = totalRows.length;
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
          data: analyticsRows,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        });
      },
      {
        ttl: 300, // 5 minutes
        tags: [CACHE_TAGS.ANALYTICS, CACHE_TAGS.REPORTS],
      }
    );
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json();
    const { name, type, description, status, created_by, schedule, parameters, is_active } = body;

    const analyticsReportRows = await db
      .insert(analyticsReports)
      .values({
        name,
        type,
        description,
        status,
        createdBy: created_by,
        schedule,
        parameters: parameters ? JSON.stringify(parameters) : null,
        isActive: is_active ?? true,
        lastGenerated: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const analyticsReport = analyticsReportRows[0];

    return NextResponse.json(analyticsReport, { status: 201 });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to create analytics report' }, { status: 500 });
  }
}

export async function PUT(_request: NextRequest) {
  try {
    const body = await _request.json();
    const { id, name, type, description, status, created_by, schedule, parameters, is_active } =
      body;

    const analyticsReportRows = await db
      .update(analyticsReports)
      .set({
        name,
        type,
        description,
        status,
        createdBy: created_by,
        schedule,
        parameters: parameters ? JSON.stringify(parameters) : null,
        isActive: is_active,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(analyticsReports.id, id))
      .returning();

    const analyticsReport = analyticsReportRows[0];

    return NextResponse.json(analyticsReport);
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to update analytics report' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const body = await _request.json();
    const { id } = body;

    await db.delete(analyticsReports).where(eq(analyticsReports.id, id));

    return NextResponse.json({ message: 'Analytics report deleted successfully' });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to delete analytics report' }, { status: 500 });
  }
}
