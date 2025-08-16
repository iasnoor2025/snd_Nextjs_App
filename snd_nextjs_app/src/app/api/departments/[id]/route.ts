import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { departments } from '@/lib/drizzle/schema';
import { eq, isNull } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '../../../../lib/rbac/api-middleware';

export const GET = withPermission(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const departmentId = parseInt(id);

      console.log('GET /api/departments/[id] - Fetching department ID:', departmentId);

      if (isNaN(departmentId)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid department ID',
          },
          { status: 400 }
        );
      }

      const department = await db
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
        .where(
          eq(departments.id, departmentId) &&
          isNull(departments.deletedAt)
        )
        .limit(1);

      console.log('GET /api/departments/[id] - Department found:', department);

      if (department.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Department not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: department[0],
        message: 'Department retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching department:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch department: ' + (error instanceof Error ? error.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }
  },
  PermissionConfigs.department.read
);

export const PUT = withPermission(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const departmentId = parseInt(id);

      console.log('PUT /api/departments/[id] - Updating department ID:', departmentId);

      if (isNaN(departmentId)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid department ID',
          },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { name, code, description, active } = body;

      console.log('PUT /api/departments/[id] - Request body:', body);

      if (!name || !name.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: 'Department name is required',
          },
          { status: 400 }
        );
      }

      // Check if department exists
      const existingDepartment = await db
        .select({
          id: departments.id,
          name: departments.name,
        })
        .from(departments)
        .where(
          eq(departments.id, departmentId) &&
          isNull(departments.deletedAt)
        )
        .limit(1);

      if (!existingDepartment || existingDepartment.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Department not found' },
          { status: 404 }
        );
      }

      const trimmedName = name.trim();
      const currentName = existingDepartment[0]?.name;
      
      if (!currentName) {
        return NextResponse.json(
          { success: false, message: 'Department name not found' },
          { status: 404 }
        );
      }

      console.log('PUT /api/departments/[id] - Current name:', currentName, 'New name:', trimmedName);

      // If the name hasn't changed, skip duplicate check
      if (currentName === trimmedName) {
        console.log('Name unchanged, skipping duplicate check');
      } else {
        // Check if another department with the same name already exists (case insensitive)
        const allDepartments = await db
          .select({
            id: departments.id,
            name: departments.name,
          })
          .from(departments)
          .where(isNull(departments.deletedAt));

        console.log('PUT /api/departments/[id] - All departments for comparison:', allDepartments);

        const duplicateDepartment = allDepartments.find(
          dept => dept.id !== departmentId && dept.name.toLowerCase() === trimmedName.toLowerCase()
        );

        console.log('PUT /api/departments/[id] - Duplicate department found:', duplicateDepartment);

        if (duplicateDepartment) {
          return NextResponse.json(
            {
              success: false,
              message: `Another department with name "${trimmedName}" already exists`,
            },
            { status: 400 }
          );
        }
      }

      console.log('PUT /api/departments/[id] - No duplicates, updating department');

      // Update department
      const [updatedDepartment] = await db
        .update(departments)
        .set({
          name: trimmedName,
          code: code?.trim() || null,
          description: description?.trim() || null,
          active: active !== undefined ? active : true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(departments.id, departmentId))
        .returning({
          id: departments.id,
          name: departments.name,
          code: departments.code,
          description: departments.description,
          active: departments.active,
          created_at: departments.createdAt,
          updated_at: departments.updatedAt,
        });

      console.log('PUT /api/departments/[id] - Department updated successfully:', updatedDepartment);

      return NextResponse.json({
        success: true,
        data: updatedDepartment,
        message: 'Department updated successfully',
      });
    } catch (error) {
      console.error('Error updating department:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update department: ' + (error instanceof Error ? error.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }
  },
  PermissionConfigs.department.update
);

export const DELETE = withPermission(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const departmentId = parseInt(id);

      console.log('DELETE /api/departments/[id] - Deleting department ID:', departmentId);

      if (isNaN(departmentId)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid department ID',
          },
          { status: 400 }
        );
      }

      // Check if department exists
      const existingDepartment = await db
        .select({
          id: departments.id,
          name: departments.name,
        })
        .from(departments)
        .where(
          eq(departments.id, departmentId) &&
          isNull(departments.deletedAt)
        )
        .limit(1);

      console.log('DELETE /api/departments/[id] - Department to delete:', existingDepartment);

      if (existingDepartment.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Department not found',
          },
          { status: 404 }
        );
      }

      console.log('DELETE /api/departments/[id] - Soft deleting department');

      // Soft delete by setting deletedAt timestamp
      await db
        .update(departments)
        .set({
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(departments.id, departmentId));

      console.log('DELETE /api/departments/[id] - Department deleted successfully');

      return NextResponse.json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to delete department: ' + (error instanceof Error ? error.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }
  },
  PermissionConfigs.department.delete
);
