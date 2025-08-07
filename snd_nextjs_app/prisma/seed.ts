import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/db';
import { saudiCities } from './saudi-cities';
async function main() {
  console.log('🌱 Seeding database...')

  try {
    // Create all 7 roles that match the ability system
    console.log('Creating SUPER_ADMIN role...');
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: {
        name: 'SUPER_ADMIN',
        guard_name: 'web',
      }
    })
    console.log('✅ SUPER_ADMIN role created:', superAdminRole.id);

    console.log('Creating ADMIN role...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        guard_name: 'web',
      }
    })
    console.log('✅ ADMIN role created:', adminRole.id);

    console.log('Creating MANAGER role...');
    const managerRole = await prisma.role.upsert({
      where: { name: 'MANAGER' },
      update: {},
      create: {
        name: 'MANAGER',
        guard_name: 'web',
      }
    })
    console.log('✅ MANAGER role created:', managerRole.id);

    console.log('Creating SUPERVISOR role...');
    const supervisorRole = await prisma.role.upsert({
      where: { name: 'SUPERVISOR' },
      update: {},
      create: {
        name: 'SUPERVISOR',
        guard_name: 'web',
      }
    })
    console.log('✅ SUPERVISOR role created:', supervisorRole.id);

    console.log('Creating OPERATOR role...');
    const operatorRole = await prisma.role.upsert({
      where: { name: 'OPERATOR' },
      update: {},
      create: {
        name: 'OPERATOR',
        guard_name: 'web',
      }
    })
    console.log('✅ OPERATOR role created:', operatorRole.id);

    console.log('Creating EMPLOYEE role...');
    const employeeRole = await prisma.role.upsert({
      where: { name: 'EMPLOYEE' },
      update: {},
      create: {
        name: 'EMPLOYEE',
        guard_name: 'web',
      }
    })
    console.log('✅ EMPLOYEE role created:', employeeRole.id);

    console.log('Creating USER role...');
    const userRole = await prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: {
        name: 'USER',
        guard_name: 'web',
      }
    })
    console.log('✅ USER role created:', userRole.id);

    // Hash passwords
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('password123', 12)

    // Create test users for authentication
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ias.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@ias.com', 
        password: adminPassword,
        role_id: superAdminRole.id,
        status: 1,
        isActive: true,
      } as any
    })
    console.log('✅ Admin user created:', adminUser.id);

    // Create user role relationship for admin
    console.log('Creating user role relationship...');
    await prisma.userRole.upsert({
      where: {
        role_id_user_id: {
          role_id: superAdminRole.id,
          user_id: adminUser.id,
        }
      },
      update: {},
      create: {
        role_id: superAdminRole.id,
        user_id: adminUser.id,
      }
    })
    console.log('✅ User role relationship created');

    // Seed Saudi Arabian cities
    console.log('🌍 Seeding Saudi Arabian cities...');
    let citiesCreated = 0;
    let citiesSkipped = 0;

    for (const cityData of saudiCities) {
      try {
        const existingLocation = await prisma.location.findFirst({
          where: {
            name: cityData.name,
            city: cityData.city,
            state: cityData.state
          }
        });

        if (existingLocation) {
          console.log(`⏭️  Skipping existing city: ${cityData.name}`);
          citiesSkipped++;
          continue;
        }

        await prisma.location.create({
          data: {
            name: cityData.name,
            description: cityData.description,
            city: cityData.city,
            state: cityData.state,
            country: cityData.country,
            latitude: cityData.latitude,
            longitude: cityData.longitude,
            is_active: true,
          }
        });

        console.log(`✅ Created location: ${cityData.name}`);
        citiesCreated++;
      } catch (error) {
        console.error(`❌ Error creating location ${cityData.name}:`, error);
      }
    }

    console.log(`📊 Cities seeding summary:`);
    console.log(`- Created: ${citiesCreated} cities`);
    console.log(`- Skipped: ${citiesSkipped} existing cities`);
    console.log(`- Total processed: ${citiesCreated + citiesSkipped} cities`);

    console.log('✅ Database seeded successfully!')
    console.log('🔑 Admin user created:')
    console.log('- Admin: admin@ias.com / password')
    console.log('👥 All 7 roles created:')
    console.log('- SUPER_ADMIN (Full system access)')
    console.log('- ADMIN (System administration)')
    console.log('- MANAGER (Department management)')
    console.log('- SUPERVISOR (Team supervision)')
    console.log('- OPERATOR (Basic operations)')
    console.log('- EMPLOYEE (Employee access)')
    console.log('- USER (Read-only access)')
    console.log('🌍 Saudi Arabian cities seeded successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
