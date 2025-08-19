import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import {
  permissions as permissionsTable,
  roleHasPermissions as roleHasPermissionsTable,
  roles as rolesTable,
} from '@/lib/drizzle/schema';
import { createUserFromSession, hasPermission } from '@/lib/rbac/custom-rbac';
import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/permissions - List all permissions
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = createUserFromSession(session);
    if (!user) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    // Check if user has permission to view permissions
    if (!hasPermission(user, 'read', 'Settings')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const filters: any[] = [];
    if (search) {
      const s = `%${search}%`;
      filters.push(
        or(ilike(permissionsTable.name, s), ilike(permissionsTable.guardName, s as any))
      );
    }

    const whereExpr = filters.length ? and(...filters) : undefined;

    // total count
    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(permissionsTable)
      .where(whereExpr as any);
    const total = Number((totalRow as any)[0]?.count ?? 0);

    // page rows
    const perms = await db
      .select({
        id: permissionsTable.id,
        name: permissionsTable.name,
        guard_name: permissionsTable.guardName,
        createdAt: permissionsTable.createdAt,
        updatedAt: permissionsTable.updatedAt,
      })
      .from(permissionsTable)
      .where(whereExpr as any)
      .orderBy(asc(permissionsTable.name))
      .offset(skip)
      .limit(limit);

    // join roles per permission
    const permIds = perms.map(p => p.id as number);
    let roleMap: Record<number, { role: { id: number; name: string } }[]> = {};
    if (permIds.length > 0) {
      const roleRows = await db
        .select({
          permission_id: roleHasPermissionsTable.permissionId,
          role_id: rolesTable.id,
          role_name: rolesTable.name,
        })
        .from(roleHasPermissionsTable)
        .leftJoin(rolesTable, eq(rolesTable.id, roleHasPermissionsTable.roleId))
        .where(or(...permIds.map(id => eq(roleHasPermissionsTable.permissionId, id))));

      roleMap = roleRows.reduce(
        (acc, r) => {
          const pid = r.permission_id as unknown as number;
          if (!acc[pid]) acc[pid] = [];
          if (r.role_id != null)
            acc[pid].push({ role: { id: r.role_id as number, name: r.role_name as string } });
          return acc;
        },
        {} as Record<number, { role: { id: number; name: string } }[]>
      );
    }

    let results = perms.map(p => ({
      ...p,
      role_permissions: roleMap[p.id as number] || [],
    }));

    if (role) {
      results = results.filter(p => p.role_permissions.some(rp => rp.role.name === role));
    }

    return NextResponse.json({
      permissions: results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/permissions - Create new permission
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = createUserFromSession(session);
    if (!user) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    // Check if user has permission to create permissions
    if (!hasPermission(user, 'create', 'Settings')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await _request.json();
    const { name, guard_name = 'web' } = body;

    if (!name) {
      return NextResponse.json({ error: 'Permission name is required' }, { status: 400 });
    }

    // Check if permission already exists
    const existing = await db
      .select({ id: permissionsTable.id })
      .from(permissionsTable)
      .where(eq(permissionsTable.name, name))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({ error: 'Permission already exists' }, { status: 409 });
    }

    // Create new permission
    const nowIso = new Date().toISOString();
    const inserted = await db
      .insert(permissionsTable)
      .values({ name, guardName: guard_name, updatedAt: nowIso })
      .returning({
        id: permissionsTable.id,
        name: permissionsTable.name,
        guard_name: permissionsTable.guardName,
        createdAt: permissionsTable.createdAt,
      });
    const permission = inserted[0];

    return NextResponse.json(
      {
        message: 'Permission created successfully',
        permission,
      },
      { status: 201 }
    );
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
