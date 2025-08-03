import { prisma } from '@/lib/db';
const { PrismaClient } = require('@prisma/client');

async function createTestEmployees() {
  try {
    console.log('🌱 Creating test employees...');

    // Create departments first
    const itDepartment = await prisma.department.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Information Technology',
        code: 'IT',
        description: 'IT Department',
        active: true,
      },
    });

    const hrDepartment = await prisma.department.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Human Resources',
        code: 'HR',
        description: 'HR Department',
        active: true,
      },
    });

    // Create designations
    const softwareEngineer = await prisma.designation.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Software Engineer',
        description: 'Software Engineer',
        department_id: 1,
        is_active: true,
      },
    });

    const hrManager = await prisma.designation.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'HR Manager',
        description: 'HR Manager',
        department_id: 2,
        is_active: true,
      },
    });

    // Create test employees
    const employee1 = await prisma.employee.upsert({
      where: { employee_id: 'EMP001' },
      update: {},
      create: {
        file_number: 'EMP001',
        employee_id: 'EMP001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@company.com',
        phone: '+966501234567',
        address: 'Riyadh, Saudi Arabia',
        city: 'Riyadh',
        state: 'Riyadh Province',
        postal_code: '12345',
        country: 'Saudi Arabia',
        nationality: 'Saudi',
        date_of_birth: new Date('1990-05-15'),
        hire_date: new Date('2023-01-15'),
        designation_id: 1,
        department_id: 1,
        supervisor: 'Jane Smith',
        hourly_rate: 50.00,
        basic_salary: 8000.00,
        food_allowance: 500.00,
        housing_allowance: 1000.00,
        transport_allowance: 300.00,
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '+966507654321',
        emergency_contact_relationship: 'Spouse',
        iqama_number: '1234567890',
        iqama_expiry: new Date('2025-12-31'),
        passport_number: 'A12345678',
        passport_expiry: new Date('2026-06-30'),
        driving_license_number: 'DL123456',
        driving_license_expiry: new Date('2025-08-15'),
        operator_license_number: 'OL789012',
        operator_license_expiry: new Date('2025-10-20'),
        tuv_certification_number: 'TUV123456',
        tuv_certification_expiry: new Date('2025-09-30'),
        spsp_license_number: 'SPSP789012',
        spsp_license_expiry: new Date('2025-11-25'),
        notes: 'Experienced software engineer with 5+ years of experience.',
        current_location: 'Riyadh Office',
        status: 'active',
      },
    });

    const employee2 = await prisma.employee.upsert({
      where: { employee_id: 'EMP002' },
      update: {},
      create: {
        file_number: 'EMP002',
        employee_id: 'EMP002',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@company.com',
        phone: '+966502345678',
        address: 'Jeddah, Saudi Arabia',
        city: 'Jeddah',
        state: 'Makkah Province',
        postal_code: '23456',
        country: 'Saudi Arabia',
        nationality: 'Saudi',
        date_of_birth: new Date('1988-03-20'),
        hire_date: new Date('2022-06-01'),
        designation_id: 2,
        department_id: 2,
        supervisor: 'Mike Wilson',
        hourly_rate: 45.00,
        basic_salary: 7500.00,
        food_allowance: 500.00,
        housing_allowance: 1000.00,
        transport_allowance: 300.00,
        emergency_contact_name: 'Tom Johnson',
        emergency_contact_phone: '+966508765432',
        emergency_contact_relationship: 'Spouse',
        iqama_number: '0987654321',
        iqama_expiry: new Date('2025-11-30'),
        passport_number: 'B87654321',
        passport_expiry: new Date('2026-05-15'),
        driving_license_number: 'DL654321',
        driving_license_expiry: new Date('2025-07-20'),
        notes: 'HR Manager with 8+ years of experience in human resources.',
        current_location: 'Jeddah Office',
        status: 'active',
      },
    });

    const employee3 = await prisma.employee.upsert({
      where: { employee_id: 'EMP003' },
      update: {},
      create: {
        file_number: 'EMP003',
        employee_id: 'EMP003',
        first_name: 'Ahmed',
        middle_name: 'Ali',
        last_name: 'Al-Rashid',
        email: 'ahmed.alrashid@company.com',
        phone: '+966503456789',
        address: 'Dammam, Saudi Arabia',
        city: 'Dammam',
        state: 'Eastern Province',
        postal_code: '34567',
        country: 'Saudi Arabia',
        nationality: 'Saudi',
        date_of_birth: new Date('1992-08-10'),
        hire_date: new Date('2023-03-01'),
        designation_id: 1,
        department_id: 1,
        supervisor: 'John Doe',
        hourly_rate: 40.00,
        basic_salary: 6500.00,
        food_allowance: 500.00,
        housing_allowance: 1000.00,
        transport_allowance: 300.00,
        emergency_contact_name: 'Fatima Al-Rashid',
        emergency_contact_phone: '+966509876543',
        emergency_contact_relationship: 'Sister',
        iqama_number: '1122334455',
        iqama_expiry: new Date('2025-10-31'),
        passport_number: 'C11223344',
        passport_expiry: new Date('2026-04-20'),
        driving_license_number: 'DL112233',
        driving_license_expiry: new Date('2025-09-15'),
        notes: 'Junior software developer with 2 years of experience.',
        current_location: 'Dammam Office',
        status: 'active',
      },
    });

    console.log('✅ Test employees created successfully!');
    console.log('👥 Employees created:');
    console.log(`- ${employee1.first_name} ${employee1.last_name} (ID: ${employee1.id})`);
    console.log(`- ${employee2.first_name} ${employee2.last_name} (ID: ${employee2.id})`);
    console.log(`- ${employee3.first_name} ${employee3.middle_name} ${employee3.last_name} (ID: ${employee3.id})`);

  } catch (error) {
    console.error('❌ Error creating test employees:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestEmployees(); 