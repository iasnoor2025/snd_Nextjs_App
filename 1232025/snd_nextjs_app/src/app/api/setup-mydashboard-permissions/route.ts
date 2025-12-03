import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roles, permissions, roleHasPermissions } from '@/lib/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API: Setting up read.mydashboard permissions...');
    
    // 1. Create the read.mydashboard permission if it doesn't exist
    let dashboardPermission = await db
      .select()
      .from(permissions)
      .where(eq(permissions.name, 'read.mydashboard'))
      .limit(1);

    let permissionId: number;
    
    if (dashboardPermission.length === 0) {
      console.log('📝 Creating read.mydashboard permission...');
      const newPermission = await db
        .insert(permissions)
        .values({
          name: 'read.mydashboard',
          guardName: 'web',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      permissionId = newPermission[0].id;
      console.log('✅ Created read.mydashboard permission with ID:', permissionId);
    } else {
      permissionId = dashboardPermission[0].id;
      console.log('✅ read.mydashboard permission already exists with ID:', permissionId);
    }

    // 2. Get the roles we want to assign this permission to
    const targetRoles = ['SUPER_ADMIN', 'EMPLOYEE'];
    console.log('🎯 Assigning permission to roles:', targetRoles);
    
    const roleRecords = await db
      .select()
      .from(roles)
      .where(inArray(roles.name, targetRoles));

    console.log('📋 Found roles:', roleRecords.map(r => ({ id: r.id, name: r.name })));

    // 3. Assign the permission to each role
    for (const role of roleRecords) {
      // Check if permission is already assigned
      const existingAssignment = await db
        .select()
        .from(roleHasPermissions)
        .where(eq(roleHasPermissions.roleId, role.id))
        .where(eq(roleHasPermissions.permissionId, permissionId))
        .limit(1);

      if (existingAssignment.length === 0) {
        console.log(`🔗 Assigning read.mydashboard to role: ${role.name}`);
        await db
          .insert(roleHasPermissions)
          .values({
            roleId: role.id,
            permissionId: permissionId,
          });
        console.log(`✅ Assigned read.mydashboard to ${role.name}`);
      } else {
        console.log(`ℹ️ read.mydashboard already assigned to ${role.name}`);
      }
    }

    // 4. Verify the setup
    const finalCheck = await db
      .select({
        roleName: roles.name,
        permissionName: permissions.name,
      })
      .from(roleHasPermissions)
      .leftJoin(roles, eq(roleHasPermissions.roleId, roles.id))
      .leftJoin(permissions, eq(roleHasPermissions.permissionId, permissions.id))
      .where(eq(permissions.name, 'read.mydashboard'));

    console.log('🔍 Final verification:', finalCheck);

    return NextResponse.json({
      success: true,
      message: 'read.mydashboard permissions set up successfully!',
      permissionId: permissionId,
      rolesAssigned: targetRoles,
      assignmentsCount: finalCheck.length,
      assignments: finalCheck.map(a => ({ role: a.roleName, permission: a.permissionName }))
    });

  } catch (error) {
    console.error('❌ Error setting up read.mydashboard permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to set up read.mydashboard permissions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
