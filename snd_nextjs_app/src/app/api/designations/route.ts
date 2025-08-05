import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(
  async (request: NextRequest) => {
  try {
    console.log('Designations API called');

    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }

    const designations = await prisma.designation.findMany({
      where: {
        is_active: true,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        department_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`Found ${designations.length} designations`);

    return NextResponse.json({
      success: true,
      data: designations,
      message: `Successfully retrieved ${designations.length} designations`,
    });
  } catch (error) {
    console.error('Error fetching designations:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch designations: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.designation.read
);

export const POST = withPermission(
  async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, description, department_id } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Designation name is required',
        },
        { status: 400 }
      );
    }

    // Check if designation with same name already exists
    const existingDesignation = await prisma.designation.findFirst({
      where: {
        name: name,
        deleted_at: null,
      },
    });

    if (existingDesignation) {
      return NextResponse.json(
        {
          success: false,
          message: 'Designation with this name already exists',
        },
        { status: 400 }
      );
    }

    const designation = await prisma.designation.create({
      data: {
        name,
        description,
        department_id: department_id ? parseInt(department_id) : null,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        department_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: designation,
      message: 'Designation created successfully',
    });
  } catch (error) {
    console.error('Error creating designation:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create designation: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.designation.create
); 