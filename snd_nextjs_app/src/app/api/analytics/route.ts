import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { created_by: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    const [analytics, total] = await Promise.all([
      prisma.analyticsReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.analyticsReport.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: analytics,
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

    const analyticsReport = await prisma.analyticsReport.create({
      data: {
        name,
        type,
        description,
        status,
        created_by,
        schedule,
        parameters: parameters ? JSON.stringify(parameters) : null,
        is_active: is_active ?? true,
        last_generated: null,
      },
    });

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

    const analyticsReport = await prisma.analyticsReport.update({
      where: { id },
      data: {
        name,
        type,
        description,
        status,
        created_by,
        schedule,
        parameters: parameters ? JSON.stringify(parameters) : null,
        is_active,
      },
    });

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

    await prisma.analyticsReport.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Analytics report deleted successfully' });
  } catch (error) {
    console.error('Error deleting analytics report:', error);
    return NextResponse.json(
      { error: 'Failed to delete analytics report' },
      { status: 500 }
    );
  }
}
