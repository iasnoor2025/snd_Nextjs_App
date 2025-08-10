import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { designations, departments } from '../../../../../drizzle/schema';
import { eq, isNull } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '../../../../lib/rbac/api-middleware';

export const GET = withPermission(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const designationId = parseInt(id);

      if (isNaN(designationId)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid designation ID',
          },
          { status: 400 }
        );
      }

      const designation = await db
        .select({
          id: designations.id,
          name: designations.name,
          description: designations.description,
          is_active: designations.isActive,
          department_id: designations.departmentId,
          created_at: designations.createdAt,
          updated_at: designations.updatedAt,
        })
        .from(designations)
        .where(
          eq(designations.id, designationId) &&
          isNull(designations.deletedAt)
        )
        .limit(1);

      if (designation.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Designation not found',
          },
          { status: 404 }
        );
      }

      // Fetch department details if department_id exists
      let departmentData: { id: number; name: string; code: string | null } | null = null;
      if (designation[0].department_id) {
        const department = await db
          .select({
            id: departments.id,
            name: departments.name,
            code: departments.code,
          })
          .from(departments)
          .where(eq(departments.id, designation[0].department_id))
          .limit(1);
        departmentData = department[0] || null;
      }

      const result = {
        ...designation[0],
        department: departmentData,
      };

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Designation retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching designation:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch designation: ' + (error instanceof Error ? error.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }
  },
  PermissionConfigs.designation.read
);

export const PUT = withPermission(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const designationId = parseInt(id);

      console.log('PUT /api/designations/[id] - Updating designation ID:', designationId);

      if (isNaN(designationId)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid designation ID',
          },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { name, description, department_id, is_active } = body;

      console.log('PUT /api/designations/[id] - Request body:', body);

      if (!name || !name.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: 'Designation name is required',
          },
          { status: 400 }
        );
      }

      // Check if designation exists
      const existingDesignation = await db
        .select({
          id: designations.id,
          name: designations.name,
        })
        .from(designations)
        .where(
          eq(designations.id, designationId) &&
          isNull(designations.deletedAt)
        )
        .limit(1);

      if (existingDesignation.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Designation not found',
          },
          { status: 404 }
        );
      }

      const trimmedName = name.trim();
      const currentName = existingDesignation[0].name;

      console.log('PUT /api/designations/[id] - Current name:', currentName, 'New name:', trimmedName);

      // If the name hasn't changed, skip duplicate check
      if (currentName === trimmedName) {
        console.log('Name unchanged, skipping duplicate check');
      } else {
        // Check if another designation with the same name already exists (case insensitive)
        const allDesignations = await db
          .select({
            id: designations.id,
            name: designations.name,
          })
          .from(designations)
          .where(isNull(designations.deletedAt));

        console.log('PUT /api/designations/[id] - All designations for comparison:', allDesignations);

        const duplicateDesignation = allDesignations.find(
          desig => desig.id !== designationId && desig.name.toLowerCase() === trimmedName.toLowerCase()
        );

        console.log('PUT /api/designations/[id] - Duplicate designation found:', duplicateDesignation);

        if (duplicateDesignation) {
          return NextResponse.json(
            {
              success: false,
              message: `Another designation with name "${trimmedName}" already exists`,
            },
            { status: 400 }
          );
        }
      }

      console.log('PUT /api/designations/[id] - No duplicates, updating designation');

      // Update designation
      const [updatedDesignation] = await db
        .update(designations)
        .set({
          name: trimmedName,
          description: description?.trim() || null,
          departmentId: department_id || null,
          isActive: is_active !== undefined ? is_active : true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(designations.id, designationId))
        .returning({
          id: designations.id,
          name: designations.name,
          description: designations.description,
          is_active: designations.isActive,
          department_id: designations.departmentId,
          created_at: designations.createdAt,
          updated_at: designations.updatedAt,
        });

      console.log('PUT /api/designations/[id] - Designation updated successfully:', updatedDesignation);

      // Fetch department details if department_id exists
      let departmentData: { id: number; name: string; code: string | null } | null = null;
      if (updatedDesignation.department_id) {
        const department = await db
          .select({
            id: departments.id,
            name: departments.name,
            code: departments.code,
          })
          .from(departments)
          .where(eq(departments.id, updatedDesignation.department_id))
          .limit(1);
        departmentData = department[0] || null; 
      }

      const result = {
        ...updatedDesignation,
        department: departmentData,
      };

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Designation updated successfully',
      });
    } catch (error) {
      console.error('Error updating designation:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update designation: ' + (error instanceof Error ? error.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }
  },
  PermissionConfigs.designation.update
);

export const DELETE = withPermission(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const designationId = parseInt(id);

      if (isNaN(designationId)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid designation ID',
          },
          { status: 400 }
        );
      }

      // Check if designation exists
      const existingDesignation = await db
        .select({
          id: designations.id,
          name: designations.name,
        })
        .from(designations)
        .where(
          eq(designations.id, designationId) &&
          isNull(designations.deletedAt)
        )
        .limit(1);

      if (existingDesignation.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Designation not found',
          },
          { status: 404 }
        );
      }

      // Soft delete by setting deletedAt timestamp
      await db
        .update(designations)
        .set({
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(designations.id, designationId));

      return NextResponse.json({
        success: true,
        message: 'Designation deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting designation:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to delete designation: ' + (error instanceof Error ? error.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }
  },
  PermissionConfigs.designation.delete
);
