import { db } from '@/lib/db';
import { modelHasRoles as modelHasRolesTable, roles as rolesTable, users as usersTable } from '@/lib/drizzle/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';

// GET /api/roles - Get all roles with user count
export async function GET() {
  try {
    // Generate cache key for roles list
    const cacheKey = generateCacheKey('roles', 'list', {});
    
    return await cacheQueryResult(
      cacheKey,
      async () => {
        // Fetch roles
        const roles = await db
          .select({
            id: rolesTable.id,
            name: rolesTable.name,
            guard_name: rolesTable.guardName,
            created_at: rolesTable.createdAt,
            updated_at: rolesTable.updatedAt,
          })
          .from(rolesTable)
          .orderBy(desc(rolesTable.createdAt));

        // Count users per role from both mechanisms while avoiding double counting:
        // 1. Direct role assignment via users.roleId
        // 2. Many-to-many relationship via model_has_roles
        
        const counts = await db
          .select({ 
            role_id: sql<number>`COALESCE(${usersTable.roleId}, ${modelHasRolesTable.roleId})`,
            count: sql<number>`count(DISTINCT ${usersTable.id})` 
          })
          .from(usersTable)
          .leftJoin(modelHasRolesTable, eq(usersTable.id, modelHasRolesTable.userId))
          .where(sql`${usersTable.roleId} IS NOT NULL OR ${modelHasRolesTable.roleId} IS NOT NULL`)
          .groupBy(sql`COALESCE(${usersTable.roleId}, ${modelHasRolesTable.roleId})`);

        const roleIdToCount = new Map<number, number>();
        for (const c of counts as any[]) {
          roleIdToCount.set(c.role_id, Number(c.count || 0));
        }

        const rolesWithUserCount = roles.map(role => ({
          id: role.id,
          name: role.name,
          guard_name: role.guard_name,
          createdAt: role.created_at,
          updatedAt: role.updated_at,
          userCount: roleIdToCount.get(role.id as number) || 0,
        }));

        return NextResponse.json(rolesWithUserCount, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      },
      {
        ttl: 600, // 10 minutes - roles change less frequently
        tags: [CACHE_TAGS.ROLES, CACHE_TAGS.USERS],
      }
    );
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

// POST /api/roles - Create new role
export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json();
    const { name, guard_name } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    // Check if role already exists
    const existing = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.name, name))
      .limit(1);
    if (existing[0]) {
      return NextResponse.json({ error: 'Role with this name already exists' }, { status: 400 });
    }

    // Create role
    const inserted = await db
      .insert(rolesTable)
      .values({ name, guardName: guard_name || 'web', updatedAt: new Date().toISOString() })
      .returning({
        id: rolesTable.id,
        name: rolesTable.name,
        guard_name: rolesTable.guardName,
        created_at: rolesTable.createdAt,
        updated_at: rolesTable.updatedAt,
      });
    const role = inserted[0];

    const roleWithUserCount = {
      id: role!.id,
      name: role!.name,
      guard_name: role!.guard_name,
      createdAt: role!.created_at,
      updatedAt: role!.updated_at,
      userCount: 0,
    };

    return NextResponse.json(roleWithUserCount, { status: 201 });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

// PUT /api/roles - Update role
export async function PUT(_request: NextRequest) {
  try {
    const body = await _request.json();
    const { id, name, guard_name } = body;

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    // Check if role exists
    const existing = await db
      .select({ id: rolesTable.id, name: rolesTable.name })
      .from(rolesTable)
      .where(eq(rolesTable.id, id))
      .limit(1);
    const existingRole = existing[0];
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if name is being changed and if it's already taken
    if (name && name !== existingRole.name) {
      const nameExists = await db
        .select({ id: rolesTable.id })
        .from(rolesTable)
        .where(eq(rolesTable.name, name))
        .limit(1);
      if (nameExists[0]) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });
      }
    }

    // Update role
    const updated = await db
      .update(rolesTable)
      .set({
        name: name ?? undefined,
        guardName: guard_name ?? undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(rolesTable.id, id))
      .returning({
        id: rolesTable.id,
        name: rolesTable.name,
        guard_name: rolesTable.guardName,
        created_at: rolesTable.createdAt,
        updated_at: rolesTable.updatedAt,
      });
    const role = updated[0];

    // Count user roles
    const countRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(modelHasRolesTable)
      .where(eq(modelHasRolesTable.roleId, id));
    const userCount = Number((countRows as any)[0]?.count ?? 0);

    const roleWithUserCount = {
      id: role!.id,
      name: role!.name,
      guard_name: role!.guard_name,
      createdAt: role!.created_at,
      updatedAt: role!.updated_at,
      userCount,
    };

    return NextResponse.json(roleWithUserCount);
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE /api/roles - Delete role
export async function DELETE(_request: NextRequest) {
  try {
    const body = await _request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    // Check existing and user count
    const countRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(modelHasRolesTable)
      .where(eq(modelHasRolesTable.roleId, id));
    const userCount = Number((countRows as any)[0]?.count ?? 0);

    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned users' },
        { status: 400 }
      );
    }

    await db.delete(rolesTable).where(eq(rolesTable.id, id));

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
