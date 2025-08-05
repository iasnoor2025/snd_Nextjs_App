const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Define all permissions for the system
const permissions = [
  // User management
  'read.user',
  'create.user',
  'update.user',
  'delete.user',
  'manage.user',

  // Employee management
  'read.employee',
  'create.employee',
  'update.employee',
  'delete.employee',
  'manage.employee',

  // Customer management
  'read.customer',
  'create.customer',
  'update.customer',
  'delete.customer',
  'manage.customer',

  // Equipment management
  'read.equipment',
  'create.equipment',
  'update.equipment',
  'delete.equipment',
  'manage.equipment',

  // Rental management
  'read.rental',
  'create.rental',
  'update.rental',
  'delete.rental',
  'manage.rental',

  // Payroll management
  'read.payroll',
  'create.payroll',
  'update.payroll',
  'delete.payroll',
  'manage.payroll',

  // Timesheet management
  'read.timesheet',
  'create.timesheet',
  'update.timesheet',
  'delete.timesheet',
  'manage.timesheet',
  'approve.timesheet',
  'reject.timesheet',
  'approve.timesheet.foreman',
  'approve.timesheet.incharge',
  'approve.timesheet.checking',
  'approve.timesheet.manager',
  'reject.timesheet.foreman',
  'reject.timesheet.incharge',
  'reject.timesheet.checking',
  'reject.timesheet.manager',
  'submit.timesheet',
  'bulk.approve.timesheet',
  'bulk.reject.timesheet',

  // Employee advance management
  'read.advance',
  'create.advance',
  'update.advance',
  'delete.advance',
  'manage.advance',
  'approve.advance',
  'reject.advance',
  'approve.advance.manager',
  'approve.advance.hr',
  'approve.advance.finance',
  'reject.advance.manager',
  'reject.advance.hr',
  'reject.advance.finance',
  'bulk.approve.advance',
  'bulk.reject.advance',

  // Manual assignment management
  'read.assignment',
  'create.assignment',
  'update.assignment',
  'delete.assignment',
  'manage.assignment',
  'approve.assignment',
  'reject.assignment',
  'approve.assignment.manager',
  'approve.assignment.hr',
  'reject.assignment.manager',
  'reject.assignment.hr',
  'bulk.approve.assignment',
  'bulk.reject.assignment',

  // Project management
  'read.project',
  'create.project',
  'update.project',
  'delete.project',
  'manage.project',

  // Leave management
  'read.leave',
  'create.leave',
  'update.leave',
  'delete.leave',
  'manage.leave',
  'approve.leave',
  'reject.leave',

  // Department management
  'read.department',
  'create.department',
  'update.department',
  'delete.department',
  'manage.department',

  // Designation management
  'read.designation',
  'create.designation',
  'update.designation',
  'delete.designation',
  'manage.designation',

  // Report management
  'read.report',
  'create.report',
  'update.report',
  'delete.report',
  'manage.report',
  'export.report',

  // Settings management
  'read.settings',
  'create.settings',
  'update.settings',
  'delete.settings',
  'manage.settings',

  // Company management
  'read.company',
  'create.company',
  'update.company',
  'delete.company',
  'manage.company',

  // Location management
  'read.location',
  'create.location',
  'update.location',
  'delete.location',
  'manage.location',

  // Wildcard permissions
  'manage.all',
  '*',
];

// Define role-permission assignments
const rolePermissions = {
  'SUPER_ADMIN': [
    'manage.all',
    '*',
  ],
  'ADMIN': [
    'manage.user',
    'manage.employee',
    'manage.customer',
    'manage.equipment',
    'manage.rental',
    'manage.payroll',
    'manage.timesheet',
    'approve.timesheet.foreman',
    'approve.timesheet.incharge',
    'approve.timesheet.checking',
    'approve.timesheet.manager',
    'reject.timesheet.foreman',
    'reject.timesheet.incharge',
    'reject.timesheet.checking',
    'reject.timesheet.manager',
    'bulk.approve.timesheet',
    'bulk.reject.timesheet',
    'manage.advance',
    'approve.advance.manager',
    'approve.advance.hr',
    'approve.advance.finance',
    'reject.advance.manager',
    'reject.advance.hr',
    'reject.advance.finance',
    'bulk.approve.advance',
    'bulk.reject.advance',
    'manage.assignment',
    'approve.assignment.manager',
    'approve.assignment.hr',
    'reject.assignment.manager',
    'reject.assignment.hr',
    'bulk.approve.assignment',
    'bulk.reject.assignment',
    'manage.project',
    'manage.leave',
    'manage.department',
    'manage.designation',
    'manage.report',
    'manage.settings',
    'manage.company',
    'manage.location',
  ],
  'MANAGER': [
    'read.user',
    'manage.employee',
    'manage.customer',
    'manage.equipment',
    'manage.rental',
    'read.payroll',
    'manage.timesheet',
    'approve.timesheet.foreman',
    'approve.timesheet.incharge',
    'approve.timesheet.checking',
    'approve.timesheet.manager',
    'reject.timesheet.foreman',
    'reject.timesheet.incharge',
    'reject.timesheet.checking',
    'reject.timesheet.manager',
    'bulk.approve.timesheet',
    'bulk.reject.timesheet',
    'manage.advance',
    'approve.advance.manager',
    'reject.advance.manager',
    'bulk.approve.advance',
    'bulk.reject.advance',
    'manage.assignment',
    'approve.assignment.manager',
    'reject.assignment.manager',
    'bulk.approve.assignment',
    'bulk.reject.assignment',
    'manage.project',
    'manage.leave',
    'read.department',
    'read.designation',
    'read.report',
    'read.settings',
    'read.company',
  ],
  'SUPERVISOR': [
    'read.user',
    'manage.employee',
    'read.customer',
    'read.equipment',
    'read.rental',
    'read.payroll',
    'manage.timesheet',
    'manage.project',
    'manage.leave',
    'read.department',
    'read.designation',
    'read.report',
    'read.settings',
    'read.company',
  ],
  'OPERATOR': [
    'read.user',
    'read.employee',
    'manage.customer',
    'manage.equipment',
    'manage.rental',
    'read.payroll',
    'manage.timesheet',
    'manage.project',
    'read.leave',
    'read.department',
    'read.designation',
    'read.report',
    'read.settings',
    'read.company',
  ],
  'EMPLOYEE': [
    'read.user',
    'read.employee',
    'read.customer',
    'read.equipment',
    'read.rental',
    'read.payroll',
    'manage.timesheet',
    'read.project',
    'manage.leave',
    'read.department',
    'read.designation',
    'read.report',
    'read.settings',
    'read.company',
  ],
  'FOREMAN': [
    'read.user',
    'read.employee',
    'read.customer',
    'read.equipment',
    'read.rental',
    'read.timesheet',
    'approve.timesheet.foreman',
    'reject.timesheet.foreman',
    'read.project',
    'read.leave',
    'read.department',
    'read.designation',
    'read.report',
    'read.settings',
    'read.company',
  ],
  'INCHARGE': [
    'read.user',
    'read.employee',
    'read.customer',
    'read.equipment',
    'read.rental',
    'read.timesheet',
    'approve.timesheet.incharge',
    'reject.timesheet.incharge',
    'read.project',
    'read.leave',
    'read.department',
    'read.designation',
    'read.report',
    'read.settings',
    'read.company',
  ],
  'CHECKING': [
    'read.user',
    'read.employee',
    'read.customer',
    'read.equipment',
    'read.rental',
    'read.timesheet',
    'approve.timesheet.checking',
    'reject.timesheet.checking',
    'read.project',
    'read.leave',
    'read.department',
    'read.designation',
    'read.report',
    'read.settings',
    'read.company',
  ],
  'USER': [
    'read.user',
    'read.employee',
    'read.customer',
    'read.equipment',
    'read.rental',
    'read.timesheet',
    'read.project',
    'read.leave',
    'read.department',
    'read.designation',
    'read.report',
    'read.settings',
    'read.company',
  ],
};

async function seedPermissions() {
  console.log('🌱 Seeding permissions...');

  try {
    // Create all permissions
    console.log('Creating permissions...');
    for (const permissionName of permissions) {
      await prisma.permission.upsert({
        where: { name: permissionName },
        update: {},
        create: {
          name: permissionName,
          guard_name: 'web',
        },
      });
    }
    console.log(`✅ Created ${permissions.length} permissions`);

    // Get all roles
    const roles = await prisma.role.findMany();
    console.log(`Found ${roles.length} roles`);

    // Assign permissions to roles
    for (const role of roles) {
      const rolePermissionNames = rolePermissions[role.name] || [];
      console.log(`Assigning permissions to role: ${role.name}`);

      // Get permission IDs for this role
      const permissionIds = [];
      for (const permissionName of rolePermissionNames) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName },
        });
        if (permission) {
          permissionIds.push(permission.id);
        }
      }

      // Remove existing role permissions
      await prisma.rolePermission.deleteMany({
        where: { role_id: role.id },
      });

      // Add new role permissions
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            role_id: role.id,
            permission_id: permissionId,
          })),
        });
        console.log(`✅ Assigned ${permissionIds.length} permissions to ${role.name}`);
      }
    }

    console.log('✅ Permissions seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
}

// Run the seed function
seedPermissions()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 