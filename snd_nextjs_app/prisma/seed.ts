import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash passwords
  const adminPassword = await bcrypt.hash('password123', 12)
  const managerPassword = await bcrypt.hash('password123', 12)
  const userPassword = await bcrypt.hash('password123', 12)

  // Create test users for authentication
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@snd.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@snd.com',
      password: adminPassword,
      role_id: 1,
      status: 1,
      isActive: true,
    } as any
  })

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@snd.com' },
    update: {},
    create: {
      name: 'Manager User',
      email: 'manager@snd.com',
      password: managerPassword,
      role_id: 2,
      status: 1,
      isActive: true,
    } as any
  })

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@snd.com' },
    update: {},
    create: {
      name: 'Regular User',
      email: 'user@snd.com',
      password: userPassword,
      role_id: 3,
      status: 1,
      isActive: true,
    } as any
  })

  // Create test employees with minimal data
  const employee1 = await prisma.employee.upsert({
    where: { file_number: 'EMP001' } as any,
    update: {},
    create: {
      first_name: 'John',
      last_name: 'Doe',
      employee_id: 'EMP001',
      file_number: 'EMP001',
      basic_salary: 5000,
      status: 'active',
      email: 'john.doe@company.com',
      phone: '+966501234567',
      hire_date: new Date('2023-01-15'),
    } as any
  })

  const employee2 = await prisma.employee.upsert({
    where: { file_number: 'EMP002' } as any,
    update: {},
    create: {
      first_name: 'Jane',
      last_name: 'Smith',
      employee_id: 'EMP002',
      file_number: 'EMP002',
      basic_salary: 6000,
      status: 'active',
      email: 'jane.smith@company.com',
      phone: '+966507654321',
      hire_date: new Date('2022-08-20'),
    } as any
  })

  const employee3 = await prisma.employee.upsert({
    where: { file_number: 'EMP003' } as any,
    update: {},
    create: {
      first_name: 'Ahmed',
      last_name: 'Al-Rashid',
      employee_id: 'EMP003',
      file_number: 'EMP003',
      basic_salary: 4500,
      status: 'active',
      email: 'ahmed.alrashid@company.com',
      phone: '+966509876543',
      hire_date: new Date('2023-03-10'),
    } as any
  })

  console.log('✅ Database seeded successfully!')
  console.log('🔑 Test users created:')
  console.log('- Admin: admin@snd.com / password123')
  console.log('- Manager: manager@snd.com / password123')
  console.log('- User: user@snd.com / password123')
  console.log('👥 Test employees created:')
  console.log('- John Doe (EMP001)')
  console.log('- Jane Smith (EMP002)')
  console.log('- Ahmed Al-Rashid (EMP003)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
