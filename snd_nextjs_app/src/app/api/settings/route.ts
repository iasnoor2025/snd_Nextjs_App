import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { value: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        where.is_active = true;
      } else if (status === 'inactive') {
        where.is_active = false;
      }
    }

    const [settings, total] = await Promise.all([
      prisma.setting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.setting.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: settings,
      current_page: page,
      last_page: totalPages,
      per_page: limit,
      total,
      next_page_url: page < totalPages ? `/api/settings?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/settings?page=${page - 1}` : null,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      category,
      key,
      value,
      description,
      type,
      is_active,
    } = body;

    const setting = await prisma.setting.create({
      data: {
        category,
        key,
        value,
        description,
        type,
        is_active: is_active ?? true,
      },
    });

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Error creating setting:', error);
    return NextResponse.json(
      { error: 'Failed to create setting' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      category,
      key,
      value,
      description,
      type,
      is_active,
    } = body;

    const setting = await prisma.setting.update({
      where: { id },
      data: {
        category,
        key,
        value,
        description,
        type,
        is_active,
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    await prisma.setting.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}
