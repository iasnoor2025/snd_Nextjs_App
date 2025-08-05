const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Define the missing permissions that need to be added
const missingPermissions = [
  // Employee Document permissions
  'read.employee-document',
  'create.employee-document',
  'update.employee-document',
  'delete.employee-document',

  // Employee Assignment permissions
  'read.employee-assignment',
  'create.employee-assignment',
  'update.employee-assignment',
  'delete.employee-assignment',

  // Resignation permissions
  'read.resignation',
  'create.resignation',
  'update.resignation',
  'delete.resignation',

  // Final Settlement permissions
  'read.final-settlement',
  'create.final-settlement',
  'update.final-settlement',
  'delete.final-settlement',
];

async function addMissingPermissions() {
  console.log('🔧 Adding missing permissions...');

  try {
    // Create all missing permissions
    console.log('Creating missing permissions...');
    for (const permissionName of missingPermissions) {
      await prisma.permission.upsert({
        where: { name: permissionName },
        update: {},
        create: {
          name: permissionName,
          guard_name: 'web',
        },
      });
    }
    console.log(`✅ Created ${missingPermissions.length} missing permissions`);

    // Get all roles
    const roles = await prisma.role.findMany();
    console.log(`Found ${roles.length} roles`);

    // Assign permissions to admin and super admin roles
    for (const role of roles) {
      if (role.name === 'SUPER_ADMIN' || role.name === 'ADMIN') {
        console.log(`Assigning permissions to role: ${role.name}`);

        // Get permission IDs for the missing permissions
        const permissionIds = [];
        for (const permissionName of missingPermissions) {
          const permission = await prisma.permission.findUnique({
            where: { name: permissionName },
          });
          if (permission) {
            permissionIds.push(permission.id);
          }
        }

        // Add new role permissions (don't remove existing ones)
        if (permissionIds.length > 0) {
          for (const permissionId of permissionIds) {
            try {
              await prisma.rolePermission.create({
                data: {
                  role_id: role.id,
                  permission_id: permissionId,
                },
              });
            } catch (error) {
              // Permission already exists, skip
              if (error.code !== 'P2002') {
                throw error;
              }
            }
          }
          console.log(`✅ Assigned ${permissionIds.length} permissions to ${role.name}`);
        }
      }
    }

    console.log('✅ Missing permissions added successfully!');
  } catch (error) {
    console.error('❌ Error adding missing permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addMissingPermissions()
  .catch((error) => {
    console.error('❌ Failed to add missing permissions:', error);
    process.exit(1);
  }); 