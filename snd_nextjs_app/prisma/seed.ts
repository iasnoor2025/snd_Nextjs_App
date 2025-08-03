import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/db';
async function main() {
  console.log('🌱 Seeding database...')

  // Hash passwords
  const adminPassword = await bcrypt.hash('password123', 12)

  // Create test users for authentication
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ias.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@ias.com', 
      password: adminPassword,
      role_id: 1,
      status: 1,
      isActive: true,
    } as any
  })

  console.log('✅ Database seeded successfully!')
  console.log('🔑 Admin user created:')
  console.log('- Admin: admin@ias.com / password')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
