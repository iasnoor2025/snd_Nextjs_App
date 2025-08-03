import { prisma } from '@/lib/db';
const { PrismaClient } = require('@prisma/client');

async function setupRolesAndPermissions() {
  try {
    console.log('🔧 Setting up roles and permissions...');

    // Define roles
    const roles = [
      { name: 'super_admin', display_name: 'Super Admin' },
      { name: 'admin', display_name: 'Admin' },
      { name: 'manager', display_name: 'Manager' },
      { name: 'supervisor', display_name: 'Supervisor' },
      { name: 'operator', display_name: 'Operator' },
      { name: 'user', display_name: 'User' }
    ];

    // Define permissions
    const permissions = [
      // User management
      'users.read', 'users.create', 'users.update', 'users.delete',
      // Role management
      'roles.read', 'roles.create', 'roles.update', 'roles.delete',
      // Employee management
      'employees.read', 'employees.create', 'employees.update', 'employees.delete',
      'employees.approve', 'employees.reject',
      // Customer management
      'customers.read', 'customers.create', 'customers.update', 'customers.delete',
      'customers.approve', 'customers.reject',
      // Equipment management
      'equipment.read', 'equipment.create', 'equipment.update', 'equipment.delete',
      'equipment.approve', 'equipment.reject',
      // Rental management
      'rentals.read', 'rentals.create', 'rentals.update', 'rentals.delete',
      'rentals.approve', 'rentals.reject',
      // Payroll management
      'payroll.read', 'payroll.create', 'payroll.update', 'payroll.delete',
      'payroll.approve', 'payroll.reject', 'payroll.export',
      // Timesheet management
      'timesheets.read', 'timesheets.create', 'timesheets.update', 'timesheets.delete',
      'timesheets.approve', 'timesheets.reject',
      // Project management
      'projects.read', 'projects.create', 'projects.update', 'projects.delete',
      'projects.approve', 'projects.reject',
      // Leave management
      'leaves.read', 'leaves.create', 'leaves.update', 'leaves.delete',
      'leaves.approve', 'leaves.reject',
      // Reports
      'reports.read', 'reports.create', 'reports.update', 'reports.delete',
      'reports.export', 'reports.approve', 'reports.reject',
      // Settings
      'settings.read', 'settings.update',
      // Analytics
      'analytics.read', 'analytics.approve', 'analytics.reject',
      // System operations
      'system.sync', 'system.reset', 'system.approve', 'system.reject',
      // Approval permissions for all modules
      'approve.all', 'reject.all'
    ];

    // Create roles
    console.log('Creating roles...');
    for (const roleData of roles) {
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name }
      });

      if (!existingRole) {
        await prisma.role.create({
          data: {
            name: roleData.name,
            guard_name: 'web'
          }
        });
        console.log(`✅ Created role: ${roleData.name}`);
      } else {
        console.log(`✅ Role already exists: ${roleData.name}`);
      }
    }

    // Create permissions
    console.log('Creating permissions...');
    for (const permissionName of permissions) {
      const existingPermission = await prisma.permission.findUnique({
        where: { name: permissionName }
      });

      if (!existingPermission) {
        await prisma.permission.create({
          data: {
            name: permissionName,
            guard_name: 'web'
          }
        });
        console.log(`✅ Created permission: ${permissionName}`);
      } else {
        console.log(`✅ Permission already exists: ${permissionName}`);
      }
    }

    // Assign permissions to roles
    console.log('Assigning permissions to roles...');

    // Super Admin - all permissions
    const superAdminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
    if (superAdminRole) {
      for (const permissionName of permissions) {
        const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              permission_id_role_id: {
                permission_id: permission.id,
                role_id: superAdminRole.id
              }
            },
            update: {},
            create: {
              permission_id: permission.id,
              role_id: superAdminRole.id
            }
          });
        }
      }
      console.log('✅ Assigned all permissions to Super Admin');
    }

    // Admin - most permissions except super admin specific ones
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (adminRole) {
      const adminPermissions = permissions.filter(p => !p.startsWith('system.'));
      for (const permissionName of adminPermissions) {
        const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              permission_id_role_id: {
                permission_id: permission.id,
                role_id: adminRole.id
              }
            },
            update: {},
            create: {
              permission_id: permission.id,
              role_id: adminRole.id
            }
          });
        }
      }
      console.log('✅ Assigned permissions to Admin');
    }

    // Manager - limited permissions
    const managerRole = await prisma.role.findUnique({ where: { name: 'manager' } });
    if (managerRole) {
      const managerPermissions = [
        'employees.read', 'employees.update',
        'customers.read', 'customers.create', 'customers.update',
        'equipment.read', 'equipment.update',
        'rentals.read', 'rentals.create', 'rentals.update', 'rentals.approve',
        'payroll.read', 'payroll.approve',
        'timesheets.read', 'timesheets.approve', 'timesheets.reject',
        'projects.read', 'projects.create', 'projects.update',
        'reports.read', 'reports.export',
        'settings.read'
      ];
      
      for (const permissionName of managerPermissions) {
        const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              permission_id_role_id: {
                permission_id: permission.id,
                role_id: managerRole.id
              }
            },
            update: {},
            create: {
              permission_id: permission.id,
              role_id: managerRole.id
            }
          });
        }
      }
      console.log('✅ Assigned permissions to Manager');
    }

    // Supervisor - basic permissions
    const supervisorRole = await prisma.role.findUnique({ where: { name: 'supervisor' } });
    if (supervisorRole) {
      const supervisorPermissions = [
        'employees.read',
        'customers.read', 'customers.create', 'customers.update',
        'equipment.read',
        'rentals.read', 'rentals.create', 'rentals.update',
        'payroll.read',
        'timesheets.read', 'timesheets.approve', 'timesheets.reject',
        'projects.read', 'projects.create', 'projects.update',
        'reports.read'
      ];
      
      for (const permissionName of supervisorPermissions) {
        const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              permission_id_role_id: {
                permission_id: permission.id,
                role_id: supervisorRole.id
              }
            },
            update: {},
            create: {
              permission_id: permission.id,
              role_id: supervisorRole.id
            }
          });
        }
      }
      console.log('✅ Assigned permissions to Supervisor');
    }

    // Operator - minimal permissions
    const operatorRole = await prisma.role.findUnique({ where: { name: 'operator' } });
    if (operatorRole) {
      const operatorPermissions = [
        'employees.read',
        'customers.read',
        'equipment.read',
        'rentals.read', 'rentals.create', 'rentals.update',
        'timesheets.read', 'timesheets.create', 'timesheets.update',
        'projects.read'
      ];
      
      for (const permissionName of operatorPermissions) {
        const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              permission_id_role_id: {
                permission_id: permission.id,
                role_id: operatorRole.id
              }
            },
            update: {},
            create: {
              permission_id: permission.id,
              role_id: operatorRole.id
            }
          });
        }
      }
      console.log('✅ Assigned permissions to Operator');
    }

    // User - read-only permissions
    const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
    if (userRole) {
      const userPermissions = [
        'employees.read',
        'customers.read',
        'equipment.read',
        'rentals.read',
        'projects.read'
      ];
      
      for (const permissionName of userPermissions) {
        const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              permission_id_role_id: {
                permission_id: permission.id,
                role_id: userRole.id
              }
            },
            update: {},
            create: {
              permission_id: permission.id,
              role_id: userRole.id
            }
          });
        }
      }
      console.log('✅ Assigned permissions to User');
    }

    console.log('🎉 Roles and permissions setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up roles and permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupRolesAndPermissions(); 