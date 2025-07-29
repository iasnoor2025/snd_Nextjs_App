import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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
        { created_by: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.report.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: reports,
      current_page: page,
      last_page: totalPages,
      per_page: limit,
      total,
      next_page_url: page < totalPages ? `/api/reports?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/reports?page=${page - 1}` : null,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
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
      status,
      created_by,
      schedule,
      parameters,
      description,
    } = body;

    const report = await prisma.report.create({
      data: {
        name,
        type,
        status,
        created_by,
        schedule,
        parameters: parameters ? JSON.stringify(parameters) : null,
        description,
        last_generated: null,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
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
      status,
      created_by,
      schedule,
      parameters,
      description,
    } = body;

    const report = await prisma.report.update({
      where: { id },
      data: {
        name,
        type,
        status,
        created_by,
        schedule,
        parameters: parameters ? JSON.stringify(parameters) : null,
        description,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    await prisma.report.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
