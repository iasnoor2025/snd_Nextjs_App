import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analyticsReports } from '@/lib/drizzle/schema';
import { eq, like, or, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const skip = (page - 1) * limit;

    let whereConditions: any[] = [];

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

    const [analyticsRows, totalRows] = await Promise.all([
      db
        .select()
        .from(analyticsReports)
        .where(whereClause)
        .limit(limit)
        .offset(skip)
        .orderBy(desc(analyticsReports.createdAt)),
      db
        .select({ count: analyticsReports.id })
        .from(analyticsReports)
        .where(whereClause)
    ]);

    const total = totalRows.length;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: analyticsRows,
      current_page: page,
      last_page: totalPages,
      per_page: limit,
      total,
      next_page_url: page < totalPages ? `/api/analytics?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/analytics?page=${page - 1}` : null,
    });
  } catch (error) {
    console.error('Error fetching analytics reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      description,
      status,
      created_by,
      schedule,
      parameters,
      is_active,
    } = body;

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
    console.error('Error creating analytics report:', error);
    return NextResponse.json(
      { error: 'Failed to create analytics report' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      type,
      description,
      status,
      created_by,
      schedule,
      parameters,
      is_active,
    } = body;

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
    console.error('Error updating analytics report:', error);
    return NextResponse.json(
      { error: 'Failed to update analytics report' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    await db
      .delete(analyticsReports)
      .where(eq(analyticsReports.id, id));

    return NextResponse.json({ message: 'Analytics report deleted successfully' });
  } catch (error) {
    console.error('Error deleting analytics report:', error);
    return NextResponse.json(
      { error: 'Failed to delete analytics report' },
      { status: 500 }
    );
  }
}
