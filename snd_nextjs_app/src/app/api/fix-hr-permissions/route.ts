import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roles, permissions, roleHasPermissions } from '@/lib/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API: Fixing HR_SPECIALIST permissions...');
    
    // First, let's check if the HR_SPECIALIST role exists
    const roleCheck = await db
      .select({ id: roles.id, name: roles.name })
      .from(roles)
      .where(eq(roles.name, 'HR_SPECIALIST'))
      .limit(1);
    
    let roleId: number;
    
    if (roleCheck.length === 0) {
      console.log('❌ HR_SPECIALIST role not found. Creating it...');
      
      // Create the HR_SPECIALIST role
      const [newRole] = await db
        .insert(roles)
        .values({
          name: 'HR_SPECIALIST',
          guardName: 'web',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      roleId = newRole.id;
      console.log(`✅ Created HR_SPECIALIST role with ID: ${roleId}`);
    } else {
      roleId = roleCheck[0].id;
      console.log(`✅ HR_SPECIALIST role exists with ID: ${roleId}`);
    }
    
    // Define the permissions that HR_SPECIALIST should have
    const hrPermissions = [
      'read.Employee',
      'read.Leave', 
      'read.performance-review',
      'read.Training',
      'read.Report',
      'read.User',
      'read.Dashboard',
      'read.Department',
      'read.Designation',
      'read.Company',
      'read.Settings',
      'read.employee-document',
      'read.SalaryIncrement',
      'read.Advance',
      'read.Assignment',
      'read.Location',
      'read.Maintenance',
      'read.Safety',
      'read.Project',
      'read.Timesheet',
      'read.Customer',
      'read.Equipment',
      'read.Rental',
      'read.Quotation',
      'read.Payroll'
    ];
    
    console.log(`🔍 Checking and creating ${hrPermissions.length} permissions...`);
    
    // Check and create permissions if they don't exist
    for (const permissionName of hrPermissions) {
      const permCheck = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(eq(permissions.name, permissionName))
        .limit(1);
      
      if (permCheck.length === 0) {
        console.log(`📝 Creating permission: ${permissionName}`);
        await db
          .insert(permissions)
          .values({
            name: permissionName,
            guardName: 'web',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      } else {
        console.log(`✅ Permission exists: ${permissionName}`);
      }
    }
    
    // Now assign all permissions to the HR_SPECIALIST role
    console.log('🔗 Assigning permissions to HR_SPECIALIST role...');
    
    // Clear existing permissions for this role
    await db
      .delete(roleHasPermissions)
      .where(eq(roleHasPermissions.roleId, roleId));
    
    // Get all permission IDs
    const permissionRows = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.name, hrPermissions));
    
    // Assign permissions to role
    for (const perm of permissionRows) {
      await db
        .insert(roleHasPermissions)
        .values({
          roleId: roleId,
          permissionId: perm.id,
        });
    }
    
    console.log(`✅ Assigned ${permissionRows.length} permissions to HR_SPECIALIST role`);
    
    // Verify the setup
    const finalCheck = await db
      .select({ name: permissions.name })
      .from(roleHasPermissions)
      .innerJoin(permissions, eq(permissions.id, roleHasPermissions.permissionId))
      .where(eq(roleHasPermissions.roleId, roleId))
      .orderBy(permissions.name);
    
    console.log('\n📋 Final HR_SPECIALIST permissions:');
    finalCheck.forEach(perm => console.log(`  - ${perm.name}`));
    
    return NextResponse.json({
      success: true,
      message: 'HR_SPECIALIST permissions fixed successfully!',
      roleId: roleId,
      permissionsCount: finalCheck.length,
      permissions: finalCheck.map(p => p.name)
    });
    
  } catch (error) {
    console.error('❌ Error fixing HR_SPECIALIST permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix HR_SPECIALIST permissions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
