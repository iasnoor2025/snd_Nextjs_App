import { departments, designations } from '@/lib/drizzle/schema';
import { eq, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { PermissionConfigs, withPermission } from '../../../lib/rbac/api-middleware';

export const GET = withPermission(async (_request: NextRequest) => {
  try {

    const allDesignations = await db
      .select({
        id: designations.id,
        name: designations.name,
        description: designations.description,
        is_active: designations.isActive,
        department_id: designations.departmentId,
        createdAt: designations.createdAt,
        updatedAt: designations.updatedAt,
      })
      .from(designations)
      .where(isNull(designations.deletedAt))
      .orderBy(designations.name);

    // Fetch department details for each designation
    const designationsWithDepartments = await Promise.all(
      allDesignations.map(async designation => {
        if (designation.department_id) {
          const department = await db
            .select({
              id: departments.id,
              name: departments.name,
              code: departments.code,
            })
            .from(departments)
            .where(eq(departments.id, designation.department_id))
            .limit(1);

          return {
            ...designation,
            department: department[0] || null,
          };
        }
        return {
          ...designation,
          department: null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: designationsWithDepartments,
      message: 'Designations retrieved successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to fetch designations: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.designation.read);

export const POST = withPermission(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, description, department_id } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Designation name is required',
        },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check for existing designation with the same name (case insensitive)
    const allDesignations = await db
      .select({
        id: designations.id,
        name: designations.name,
      })
      .from(designations)
      .where(isNull(designations.deletedAt));

    const existingDesignation = allDesignations.find(
      desig => desig.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingDesignation) {
      return NextResponse.json(
        {
          success: false,
          message: `Designation with name "${trimmedName}" already exists`,
        },
        { status: 400 }
      );
    }

    // Create new designation
    const [newDesignation] = await db
      .insert(designations)
      .values({
        name: trimmedName,
        description: description?.trim() || null,
        departmentId: department_id || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning({
        id: designations.id,
        name: designations.name,
        description: designations.description,
        is_active: designations.isActive,
        department_id: designations.departmentId,
        createdAt: designations.createdAt,
        updatedAt: designations.updatedAt,
      });

    if (!newDesignation) {
      return NextResponse.json(
        { success: false, message: 'Failed to create designation' },
        { status: 500 }
      );
    }

    // Fetch department details if department_id was provided
    let departmentData: { id: number; name: string; code: string | null } | null = null;
    if (newDesignation?.department_id) {
      const department = await db
        .select({
          id: departments.id,
          name: departments.name,
          code: departments.code,
        })
        .from(departments)
        .where(eq(departments.id, newDesignation.department_id))
        .limit(1);
      departmentData = department[0] || null;
    }

    const result = {
      ...newDesignation,
      department: departmentData,
    };

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Designation created successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create designation: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.designation.create);
