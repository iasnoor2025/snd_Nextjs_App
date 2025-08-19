import { departments } from '@/lib/drizzle/schema';
import { isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { PermissionConfigs, withPermission } from '../../../lib/rbac/api-middleware';

export const GET = withPermission(async (_request: NextRequest) => {
  try {

    const allDepartments = await db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
        description: departments.description,
        active: departments.active,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      })
      .from(departments)
      .where(isNull(departments.deletedAt))
      .orderBy(departments.name);

    return NextResponse.json({
      success: true,
      data: allDepartments,
      message: 'Departments retrieved successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to fetch departments: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.department.read);

export const POST = withPermission(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, code, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Department name is required',
        },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check for existing department with the same name (case insensitive)
    const allDepartments = await db
      .select({
        id: departments.id,
        name: departments.name,
      })
      .from(departments)
      .where(isNull(departments.deletedAt));

    const existingDepartment = allDepartments.find(
      dept => dept.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingDepartment) {
      
      return NextResponse.json(
        {
          success: false,
          message: `Department with name "${trimmedName}" already exists`,
        },
        { status: 400 }
      );
    }

    // Create new department
    const [newDepartment] = await db
      .insert(departments)
      .values({
        name: trimmedName,
        code: code?.trim() || null,
        description: description?.trim() || null,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning({
        id: departments.id,
        name: departments.name,
        code: departments.code,
        description: departments.description,
        active: departments.active,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      });

    return NextResponse.json({
      success: true,
      data: newDepartment,
      message: 'Department created successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create department: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.department.create);
