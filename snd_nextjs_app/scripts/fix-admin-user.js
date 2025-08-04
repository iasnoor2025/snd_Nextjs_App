const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixAdminUser() {
  try {
    console.log('🔍 Checking admin user data for admin@ias.com...');
    
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@ias.com' },
      include: {
        user_roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found. Creating admin user...');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const newAdminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@ias.com',
          password: hashedPassword,
          role_id: 1, // SUPER_ADMIN role_id
          isActive: true
        }
      });
      console.log('✅ Admin user created with ID:', newAdminUser.id);
    } else {
      console.log('✅ Admin user found:', adminUser.name);
      console.log('📊 Current admin user data:');
      console.log('- ID:', adminUser.id);
      console.log('- Role ID:', adminUser.role_id);
      console.log('- Is Active:', adminUser.isActive);
      console.log('- User Roles:', adminUser.user_roles.map(ur => ur.role.name));
    }

    // Get or create SUPER_ADMIN role
    console.log('🔍 Checking SUPER_ADMIN role...');
    let superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      console.log('Creating SUPER_ADMIN role...');
      superAdminRole = await prisma.role.create({
        data: {
          name: 'SUPER_ADMIN',
          guard_name: 'web'
        }
      });
      console.log('✅ SUPER_ADMIN role created with ID:', superAdminRole.id);
    } else {
      console.log('✅ SUPER_ADMIN role found with ID:', superAdminRole.id);
    }

    // Update admin user's role_id to SUPER_ADMIN
    console.log('🔍 Updating admin user role_id...');
    await prisma.user.update({
      where: { email: 'admin@ias.com' },
      data: { role_id: superAdminRole.id }
    });
    console.log('✅ Admin user role_id updated to SUPER_ADMIN');

    // Ensure admin user has SUPER_ADMIN role in user_roles table
    console.log('🔍 Checking admin user_roles assignment...');
    const existingAdminUserRole = await prisma.userRole.findUnique({
      where: {
        role_id_user_id: {
          role_id: superAdminRole.id,
          user_id: adminUser ? adminUser.id : (await prisma.user.findUnique({ where: { email: 'admin@ias.com' } })).id
        }
      }
    });

    if (!existingAdminUserRole) {
      console.log('Creating admin user role relationship...');
      await prisma.userRole.create({
        data: {
          role_id: superAdminRole.id,
          user_id: adminUser ? adminUser.id : (await prisma.user.findUnique({ where: { email: 'admin@ias.com' } })).id
        }
      });
      console.log('✅ Admin user role relationship created');
    } else {
      console.log('✅ Admin user role relationship already exists');
    }

    // Verify the fix
    console.log('🔍 Verifying admin user fix...');
    const updatedAdminUser = await prisma.user.findUnique({
      where: { email: 'admin@ias.com' },
      include: {
        user_roles: {
          include: {
            role: true
          }
        }
      }
    });

    console.log('📊 Updated admin user data:');
    console.log('- ID:', updatedAdminUser.id);
    console.log('- Role ID:', updatedAdminUser.role_id);
    console.log('- Is Active:', updatedAdminUser.isActive);
    console.log('- User Roles:', updatedAdminUser.user_roles.map(ur => ur.role.name));

    console.log('🎉 Admin user role fix completed successfully!');
    console.log('🔑 You can now login with:');
    console.log('- Email: admin@ias.com');
    console.log('- Password: password123');

  } catch (error) {
    console.error('❌ Error during admin user role fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminUser()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 