import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing profile API...');

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get all users
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        national_id: true,
        role_id: true,
      }
    });
    console.log('👥 Users found:', users);

    // Get all employees
    const employees = await prisma.employee.findMany({
      take: 5,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        employee_id: true,
        email: true,
        iqama_number: true,
        user_id: true,
      }
    });
    console.log('👷 Employees found:', employees);

    return NextResponse.json({
      success: true,
      message: 'Database connection and queries working',
      users: users,
      employees: employees
    });

  } catch (error) {
    console.error('❌ Test API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Database connection failed'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 