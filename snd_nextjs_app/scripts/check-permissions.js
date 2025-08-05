const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPermissions() {
  console.log('🔍 Checking permissions and users...');

  try {
    // Check if there are any users
    const users = await prisma.user.findMany({
      include: {
        user_roles: {
          include: {
            role: {
              include: {
                role_permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        user_permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    console.log(`Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.name} (${user.email})`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Role ID: ${user.role_id}`);
      
      // Check user roles
      if (user.user_roles.length > 0) {
        for (const userRole of user.user_roles) {
          console.log(`   Role: ${userRole.role.name}`);
          console.log(`   Role Permissions: ${userRole.role.role_permissions.length}`);
          
          // Show some role permissions
          const permissions = userRole.role.role_permissions.map(rp => rp.permission.name);
          console.log(`   Permissions: ${permissions.slice(0, 5).join(', ')}${permissions.length > 5 ? '...' : ''}`);
        }
      } else {
        console.log('   ❌ No roles assigned');
      }
      
      // Check direct user permissions
      if (user.user_permissions.length > 0) {
        const directPermissions = user.user_permissions.map(up => up.permission.name);
        console.log(`   Direct Permissions: ${directPermissions.join(', ')}`);
      }
    }

    // Check if read.employee permission exists
    const employeeReadPermission = await prisma.permission.findUnique({
      where: { name: 'read.employee' },
    });

    if (employeeReadPermission) {
      console.log(`\n✅ read.employee permission exists (ID: ${employeeReadPermission.id})`);
    } else {
      console.log('\n❌ read.employee permission not found');
    }

    // Check which roles have read.employee permission
    const rolesWithEmployeeRead = await prisma.role.findMany({
      where: {
        role_permissions: {
          some: {
            permission: {
              name: 'read.employee'
            }
          }
        }
      },
      include: {
        role_permissions: {
          where: {
            permission: {
              name: 'read.employee'
            }
          },
          include: {
            permission: true
          }
        }
      }
    });

    console.log(`\nRoles with read.employee permission: ${rolesWithEmployeeRead.length}`);
    for (const role of rolesWithEmployeeRead) {
      console.log(`   - ${role.name}`);
    }

  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions(); 