import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(
  async (request: NextRequest) => {
  try {
    console.log('Departments API called');

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

    const departments = await prisma.department.findMany({
      where: {
        active: true,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`Found ${departments.length} departments`);

    return NextResponse.json({
      success: true,
      data: departments,
      message: `Successfully retrieved ${departments.length} departments`,
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch departments: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.department.read
);

export const POST = withPermission(
  async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, code, description } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Department name is required',
        },
        { status: 400 }
      );
    }

    // Check if department with same name already exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        name: name,
        deleted_at: null,
      },
    });

    if (existingDepartment) {
      return NextResponse.json(
        {
          success: false,
          message: 'Department with this name already exists',
        },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        description,
        active: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: department,
      message: 'Department created successfully',
    });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create department: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.department.create
); 