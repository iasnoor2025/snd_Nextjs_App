import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payrollItems, payrolls, payrollRuns, timesheets, employees, users } from '@/lib/drizzle/schema';
import bcrypt from 'bcryptjs';

export async function POST(_request: NextRequest) {
  try {
    // Clear all data from all tables
    
    // Delete in order to respect foreign key constraints
    await db.delete(payrollItems);
    await db.delete(payrolls);
    await db.delete(payrollRuns);
    await db.delete(timesheets);
    await db.delete(employees);
    await db.delete(users);

    // Create admin user
    const hashedPassword = await bcrypt.hash('password', 12);

    const adminUserResult = await db.insert(users)
      .values({
        name: 'Admin User',
        email: 'admin@ias.com',
        password: hashedPassword,
        nationalId: '1234567890', // Default admin national ID
        roleId: 1, // Admin role
        status: 1, // Active status
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    
    const adminUser = adminUserResult[0];

    return NextResponse.json({
      success: true,
      message: 'Database reset completed successfully',
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        roleId: adminUser.roleId,
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
  }
}
