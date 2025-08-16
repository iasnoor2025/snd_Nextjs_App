import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { departments } from '@/lib/drizzle/schema';
import { isNull } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '../../../lib/rbac/api-middleware';

export const GET = withPermission(
  async (_request: NextRequest) => {
    try {
      console.log('GET /api/departments - Fetching all departments');
      
      const allDepartments = await db
        .select({
          id: departments.id,
          name: departments.name,
          code: departments.code,
          description: departments.description,
          active: departments.active,
          created_at: departments.createdAt,
          updated_at: departments.updatedAt,
        })
        .from(departments)
        .where(isNull(departments.deletedAt))
        .orderBy(departments.name);

      console.log('GET /api/departments - Found departments:', allDepartments);

      return NextResponse.json({
        success: true,
        data: allDepartments,
        message: 'Departments retrieved successfully',
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

      console.log('POST /api/departments - Request body:', body);
      console.log('POST /api/departments - Name to check:', name);

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
      console.log('POST /api/departments - Trimmed name:', trimmedName);

      // Check for existing department with the same name (case insensitive)
      const allDepartments = await db
        .select({
          id: departments.id,
          name: departments.name,
        })
        .from(departments)
        .where(isNull(departments.deletedAt));

      console.log('POST /api/departments - All departments for comparison:', allDepartments);

      const existingDepartment = allDepartments.find(
        dept => dept.name.toLowerCase() === trimmedName.toLowerCase()
      );

      console.log('POST /api/departments - Existing department found:', existingDepartment);

      if (existingDepartment) {
        console.log('POST /api/departments - Duplicate found, returning error');
        return NextResponse.json({
          success: false,
          message: `Department with name "${trimmedName}" already exists`,
        }, { status: 400 });
      }

      console.log('POST /api/departments - No duplicates, creating new department');

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
          created_at: departments.createdAt,
          updated_at: departments.updatedAt,
        });

      console.log('POST /api/departments - Department created successfully:', newDepartment);

      return NextResponse.json({
        success: true,
        data: newDepartment,
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

 