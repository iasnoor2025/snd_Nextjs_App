import { db } from '@/lib/db';
import {
  modelHasRoles as modelHasRolesTable,
  roles as rolesTable,
  users as usersTable,
} from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import bcrypt from 'bcryptjs';
import { desc, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';

// GET /api/users - Get all users
export const GET = withPermission(PermissionConfigs.user.read)(async (request: NextRequest) => {
  try {
    console.log('🚀 USERS API CALLED - Starting to fetch users...');
    
    // Temporarily disable caching for debugging
    // const cacheKey = generateCacheKey('users', 'list', {});
    
    // return await cacheQueryResult(
    //   cacheKey,
    //   async () => {
        console.log('📊 Fetching users from database...');
        const users = await db
          .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            role_id: usersTable.roleId,
            isActive: usersTable.isActive,
            createdAt: usersTable.createdAt,
            lastLoginAt: usersTable.lastLoginAt,
          })
          .from(usersTable)
          .orderBy(desc(usersTable.createdAt));

        console.log('👥 Users fetched:', users);

        // Fetch all roles for fallback role determination
        const allRoles = await db
          .select({
            id: rolesTable.id,
            name: rolesTable.name,
          })
          .from(rolesTable);

        console.log('🔍 Debug: All roles fetched:', allRoles);
        console.log('🔍 Debug: Users with role_id:', users.map(u => ({ id: u.id, name: u.name, role_id: u.role_id })));

        // Fetch roles per user
        const userIds = users.map(u => u.id as number);
        let rolesByUserId: Record<number, { role: { id: number; name: string } }[]> = {};
        if (userIds.length > 0) {
          const rows = await db
            .select({
              user_id: modelHasRolesTable.userId,
              role_id: rolesTable.id,
              role_name: rolesTable.name,
            })
            .from(modelHasRolesTable)
            .leftJoin(rolesTable, eq(rolesTable.id, modelHasRolesTable.roleId))
            .where(sql`1=1`);
          rolesByUserId = rows.reduce(
            (acc, r) => {
              const uid = r.user_id as unknown as number;
              if (!acc[uid]) acc[uid] = [];
              if (r.role_id != null)
                acc[uid].push({ role: { id: r.role_id as number, name: r.role_name as string } });
              return acc;
            },
            {} as Record<number, { role: { id: number; name: string } }[]>
          );
        }

        // Transform the data to include role information
        const usersWithRoles = users.map(user => {
          // Determine role based on user_roles or fallback to role_id
          let role = 'USER';

          const user_roles = rolesByUserId[user.id as number] || [];
          if (user_roles.length > 0 && user_roles[0]?.role?.name) {
            // Use the first role found (since we're getting the actual role names from the database)
            // This preserves the actual role names like "Yaser", "HR_SPECIALIST", etc.
            role = user_roles[0].role.name.toUpperCase();
          } else {
            // Fallback: If no user_roles found, try to get role from the roles table using role_id
            // This handles the transition period where users still have role_id but no modelHasRoles entries
            if (user.role_id) {
              // Find the role name from the roles table
              const roleName = allRoles?.find(r => r.id === user.role_id)?.name;
              console.log(`🔍 Debug: User ${user.name} (ID: ${user.id}) has role_id: ${user.role_id}, found role name: ${roleName}`);
              if (roleName) {
                role = roleName.toUpperCase();
              }
            }
          }

          console.log(`🔍 Debug: Final role for ${user.name}: ${role}`);

          return {
            ...user,
            role,
            roles: user_roles,
          };
        });

        return NextResponse.json({
          success: true,
          users: usersWithRoles,
          timestamp: new Date().toISOString(),
          debug: 'API executed at: ' + new Date().toISOString(),
        });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
});

// POST /api/users - Create new user
export const POST = withPermission(PermissionConfigs.user.create)(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, email, password, role, isActive } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser[0]) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Find the role by name
    let roleId = 1; // Default
    if (role) {
      const found = await db
        .select({ id: rolesTable.id })
        .from(rolesTable)
        .where(eq(rolesTable.name, role))
        .limit(1);
      if (found[0]) roleId = found[0].id as number;
    }

    // Create user
    const inserted = await db
      .insert(usersTable)
      .values({
        name,
        email,
        password: hashedPassword,
        roleId: roleId,
        isActive: isActive !== undefined ? !!isActive : (true as any),
        updatedAt: new Date().toISOString(),
      })
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role_id: usersTable.roleId,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
      });
    const user = inserted[0];

    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create user role relationship
    await db.insert(modelHasRolesTable).values({ userId: user.id as number, roleId });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
});

// PUT /api/users - Update user
export const PUT = withPermission(PermissionConfigs.user.update)(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { id, name, email, password, role, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const existingUserRows = await db
      .select({ id: usersTable.id, email: usersTable.email, role_id: usersTable.roleId })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    const existingUser = existingUserRows[0];

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    // Find the role by name if role is provided
    let roleId = existingUser.role_id;
    if (role) {
      const found = await db
        .select({ id: rolesTable.id })
        .from(rolesTable)
        .where(eq(rolesTable.name, role))
        .limit(1);
      if (found[0]) roleId = found[0].id as number;
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      isActive,
      role_id: roleId,
    };

    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const updated = await db
      .update(usersTable)
      .set({
        name: updateData.name ?? undefined,
        email: updateData.email ?? undefined,
        isActive: updateData.isActive ?? undefined,
        roleId: updateData.role_id ?? undefined,
        password: updateData.password ?? undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role_id: usersTable.roleId,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
      });
    const user = updated[0];

    // Update user role relationship if role changed
    if (role && roleId !== existingUser.role_id) {
      // Delete existing user role
      await db.delete(modelHasRolesTable).where(eq(modelHasRolesTable.userId, id));
      await db.insert(modelHasRolesTable).values({ userId: id, roleId });
    }

    return NextResponse.json(user);
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
});

// DELETE /api/users - Delete user
export const DELETE = withPermission(PermissionConfigs.user.delete)(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const existingUserRows2 = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    const existingUser = existingUserRows2[0];

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user
    await db.delete(usersTable).where(eq(usersTable.id, id));

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
});
