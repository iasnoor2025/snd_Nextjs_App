import { db } from '@/lib/db';
import { modelHasRoles, roles, users, permissions, roleHasPermissions } from '@/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// Dynamic role permissions - loaded from database
async function getRolePermissions(roleName: string) {
  try {
    const roleRows = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1);
    
    if (roleRows.length === 0) {
      return [];
    }
    
    const roleId = roleRows[0].id;
    
    const permissionRows = await db
      .select({ name: permissions.name })
      .from(roleHasPermissions)
      .leftJoin(permissions, eq(permissions.id, roleHasPermissions.permissionId))
      .where(eq(roleHasPermissions.roleId, roleId));
    
    return permissionRows.map(r => r.name!).filter(Boolean);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return [];
  }
}

// Define role descriptions
const roleDescriptions = {
  SUPER_ADMIN: 'Full system access with all permissions including all timesheet approval stages',
  ADMIN: 'System administration with comprehensive access including all timesheet approval stages',
  MANAGER: 'Department management with limited administrative access and final timesheet approval',
  SUPERVISOR: 'Team supervision with operational access and foreman/incharge timesheet approval',
  OPERATOR: 'Basic operations with limited access and foreman timesheet approval',
  EMPLOYEE: 'Employee access for personal data management and timesheet creation',
  USER: 'Read-only access to basic system features and timesheet viewing',
};

// GET /api/roles/[id] - Get role by ID
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const roleRows = await db
      .select()
      .from(roles)
      .where(eq(roles.id, parseInt(id)))
      .limit(1);

    if (roleRows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const role = roleRows[0];

    // Get user count for this role from both mechanisms while avoiding double counting
    const userCountRows = await db
      .select({ 
        count: sql<number>`count(DISTINCT ${users.id})` 
      })
      .from(users)
      .leftJoin(modelHasRoles, eq(users.id, modelHasRoles.userId))
      .where(sql`${users.roleId} = ${parseInt(id)} OR ${modelHasRoles.roleId} = ${parseInt(id)}`);

    const userCount = Number(userCountRows[0]?.count || 0);

    // Get dynamic permissions from database
    const rolePermissionsList = await getRolePermissions(role!.name);

    const roleWithUserCount = {
      id: role!.id,
      name: role!.name,
      description: roleDescriptions[role!.name as keyof typeof roleDescriptions] || '',
      permissions: rolePermissionsList,
      isActive: true,
      createdAt: role!.createdAt,
      userCount: userCount,
    };

    return NextResponse.json(roleWithUserCount);
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

// PUT /api/roles/[id] - Update role by ID
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    // Check if role exists
    const existingRoleRows = await db
      .select()
      .from(roles)
      .where(eq(roles.id, parseInt(id)))
      .limit(1);

    if (existingRoleRows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const existingRole = existingRoleRows[0];

    // Check if name is being changed and if it conflicts with another role
    if (body.name !== existingRole!.name) {
      const conflictingRoleRows = await db
        .select()
        .from(roles)
        .where(eq(roles.name, body.name))
        .limit(1);

      if (conflictingRoleRows.length > 0) {
        return NextResponse.json({ error: 'Role with this name already exists' }, { status: 400 });
      }
    }

    // Update role
    const updatedRoleRows = await db
      .update(roles)
      .set({
        name: body.name,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(roles.id, parseInt(id)))
      .returning();

    const updatedRole = updatedRoleRows[0];

    // Get user count for this role using Drizzle
    const userCountRows = await db
      .select({ count: modelHasRoles.roleId })
      .from(modelHasRoles)
      .where(eq(modelHasRoles.roleId, parseInt(id)));

    const userCount = userCountRows.length;

    const roleWithUserCount = {
      id: updatedRole!.id,
      name: updatedRole!.name,
      description: roleDescriptions[updatedRole!.name as keyof typeof roleDescriptions] || '',
      permissions: rolePermissions[updatedRole!.name as keyof typeof rolePermissions] || [],
      isActive: true,
      createdAt: updatedRole!.createdAt,
      userCount: userCount,
    };

    return NextResponse.json(roleWithUserCount);
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
