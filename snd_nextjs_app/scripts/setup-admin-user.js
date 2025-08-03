import { prisma } from '@/lib/db';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setupAdminUser() {
  try {
    console.log('🔧 Setting up admin user...');

    // First, ensure we have the super_admin role
    let superAdminRole = await prisma.role.findUnique({
      where: { name: 'super_admin' }
    });

    if (!superAdminRole) {
      console.log('Creating super_admin role...');
      superAdminRole = await prisma.role.create({
        data: {
          name: 'super_admin',
          guard_name: 'web'
        }
      });
      console.log('✅ Super Admin role created');
    } else {
      console.log('✅ Super Admin role already exists');
    }

    // Also ensure we have the admin role for fallback
    let adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.log('Creating admin role...');
      adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          guard_name: 'web'
        }
      });
      console.log('✅ Admin role created');
    } else {
      console.log('✅ Admin role already exists');
    }

    // Check if admin user exists
    let adminUser = await prisma.user.findUnique({
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
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@ias.com',
          password: hashedPassword,
          role_id: 6, // SUPER_ADMIN role_id
          isActive: true
        },
        include: {
          user_roles: {
            include: {
              role: true
            }
          }
        }
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Ensure admin user has super_admin role assigned
    const hasSuperAdminRole = adminUser.user_roles.some(ur => ur.role.name === 'super_admin');
    
    if (!hasSuperAdminRole) {
      console.log('Assigning super_admin role to user...');
      await prisma.userRole.create({
        data: {
          user_id: adminUser.id,
          role_id: superAdminRole.id
        }
      });
      console.log('✅ Super Admin role assigned to user');
    } else {
      console.log('✅ Super Admin role already assigned to user');
    }

    // Also ensure admin role is assigned
    const hasAdminRole = adminUser.user_roles.some(ur => ur.role.name === 'admin');
    
    if (!hasAdminRole) {
      console.log('Assigning admin role to user...');
      await prisma.userRole.create({
        data: {
          user_id: adminUser.id,
          role_id: adminRole.id
        }
      });
      console.log('✅ Admin role assigned to user');
    } else {
      console.log('✅ Admin role already assigned to user');
    }

    // Update user's role_id to match admin
    if (adminUser.role_id !== 6) {
      console.log('Updating user role_id to SUPER_ADMIN...');
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { role_id: 6 }
      });
      console.log('✅ User role_id updated to SUPER_ADMIN');
    }

    console.log('🎉 Admin user setup completed successfully!');
    console.log('Email: admin@ias.com');
    console.log('Password: admin123');
    console.log('Role: SUPER_ADMIN');

  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupAdminUser(); 