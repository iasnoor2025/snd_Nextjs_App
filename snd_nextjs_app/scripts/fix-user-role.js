const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixUserRole() {
  try {
    console.log('🔍 Checking user data for ias.snd2024@gmail.com...');
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'ias.snd2024@gmail.com' },
      include: {
        user_roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found. Creating user...');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const newUser = await prisma.user.create({
        data: {
          name: 'Imran Ali Siddiqui',
          email: 'ias.snd2024@gmail.com',
          password: hashedPassword,
          role_id: 6, // SUPER_ADMIN role_id
          isActive: true
        }
      });
      console.log('✅ User created with ID:', newUser.id);
    } else {
      console.log('✅ User found:', user.name);
      console.log('📊 Current user data:');
      console.log('- ID:', user.id);
      console.log('- Role ID:', user.role_id);
      console.log('- Is Active:', user.isActive);
      console.log('- User Roles:', user.user_roles.map(ur => ur.role.name));
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

    // Update user's role_id to SUPER_ADMIN
    console.log('🔍 Updating user role_id...');
    await prisma.user.update({
      where: { email: 'ias.snd2024@gmail.com' },
      data: { role_id: superAdminRole.id }
    });
    console.log('✅ User role_id updated to SUPER_ADMIN');

    // Ensure user has SUPER_ADMIN role in user_roles table
    console.log('🔍 Checking user_roles assignment...');
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        role_id_user_id: {
          role_id: superAdminRole.id,
          user_id: user ? user.id : (await prisma.user.findUnique({ where: { email: 'ias.snd2024@gmail.com' } })).id
        }
      }
    });

    if (!existingUserRole) {
      console.log('Creating user role relationship...');
      await prisma.userRole.create({
        data: {
          role_id: superAdminRole.id,
          user_id: user ? user.id : (await prisma.user.findUnique({ where: { email: 'ias.snd2024@gmail.com' } })).id
        }
      });
      console.log('✅ User role relationship created');
    } else {
      console.log('✅ User role relationship already exists');
    }

    // Verify the fix
    console.log('🔍 Verifying fix...');
    const updatedUser = await prisma.user.findUnique({
      where: { email: 'ias.snd2024@gmail.com' },
      include: {
        user_roles: {
          include: {
            role: true
          }
        }
      }
    });

    console.log('📊 Updated user data:');
    console.log('- ID:', updatedUser.id);
    console.log('- Role ID:', updatedUser.role_id);
    console.log('- Is Active:', updatedUser.isActive);
    console.log('- User Roles:', updatedUser.user_roles.map(ur => ur.role.name));

    console.log('🎉 User role fix completed successfully!');
    console.log('🔑 You can now login with:');
    console.log('- Email: ias.snd2024@gmail.com');
    console.log('- Password: password123');

  } catch (error) {
    console.error('❌ Error during role fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRole()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 