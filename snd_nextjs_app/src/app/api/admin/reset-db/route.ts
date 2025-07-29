import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting database reset via API...');

    // Clear all data from all tables
    console.log('🗑️  Clearing all data...');

    // Delete in order to respect foreign key constraints
    await prisma.payrollItem.deleteMany();
    await prisma.payroll.deleteMany();
    await prisma.payrollRun.deleteMany();
    await prisma.timesheet.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ All data cleared successfully');

    // Create admin user
    console.log('👤 Creating admin user...');

    const hashedPassword = await bcrypt.hash('password', 12);

    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@ias.com',
        password: hashedPassword,
        national_id: '1234567890', // Default admin national ID
        role_id: 1, // Admin role
        status: 1, // Active status
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully');

    return NextResponse.json({
      success: true,
      message: 'Database reset completed successfully',
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        isActive: adminUser.isActive,
      },
      credentials: {
        email: 'admin@ias.com',
        password: 'password',
      },
    });

  } catch (error) {
    console.error('❌ Error during database reset:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reset database',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
