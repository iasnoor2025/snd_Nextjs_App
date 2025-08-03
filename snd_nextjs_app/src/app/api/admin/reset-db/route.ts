import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(_request: NextRequest) {
  try {


    // Clear all data from all tables
    

    // Delete in order to respect foreign key constraints
    await prisma.payrollItem.deleteMany();
    await prisma.payroll.deleteMany();
    await prisma.payrollRun.deleteMany();
    await prisma.timesheet.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.user.deleteMany();

    

    // Create admin user
    

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

    

    return NextResponse.json({
      success: true,
      message: 'Database reset completed successfully',
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        role_id: adminUser.role_id,
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
