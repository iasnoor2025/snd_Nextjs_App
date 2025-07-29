const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupRoles() {
  try {
    console.log('Setting up default roles...');

    // Check if roles exist
    const existingRoles = await prisma.role.findMany();
    console.log('Existing roles:', existingRoles);

    if (existingRoles.length === 0) {
      // Create default roles
      const defaultRoles = [
        { name: 'ADMIN', guard_name: 'web' },
        { name: 'USER', guard_name: 'web' },
        { name: 'MANAGER', guard_name: 'web' },
        { name: 'OPERATOR', guard_name: 'web' },
      ];

      for (const role of defaultRoles) {
        await prisma.role.create({
          data: role,
        });
        console.log(`Created role: ${role.name}`);
      }
    } else {
      console.log('Roles already exist, skipping creation');
    }

    console.log('Role setup completed');
  } catch (error) {
    console.error('Error setting up roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupRoles();
