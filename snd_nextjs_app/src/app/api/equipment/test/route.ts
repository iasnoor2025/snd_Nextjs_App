import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test database connection
    await prisma.$connect();
    console.log('Database connection successful');

    // Test Equipment model
    console.log('Testing Equipment model...');
    const equipmentCount = await prisma.equipment.count();
    console.log(`Equipment count: ${equipmentCount}`);

    // Test creating a simple equipment record
    console.log('Testing equipment creation...');
    const testEquipment = await prisma.equipment.create({
      data: {
        name: 'Test Equipment',
        description: 'Test equipment for sync testing',
        manufacturer: 'Test Manufacturer',
        model_number: 'TEST-001',
        serial_number: 'TEST-SERIAL-001',
        erpnext_id: 'TEST-ERP-001',
        daily_rate: 100.00,
        status: 'available',
        is_active: true,
      },
    });
    console.log('Test equipment created:', testEquipment);

    // Clean up - delete the test equipment
    await prisma.equipment.delete({
      where: { id: testEquipment.id }
    });
    console.log('Test equipment deleted');

    return NextResponse.json({
      success: true,
      message: 'Database and Equipment model test successful',
      data: {
        equipmentCount,
        testResult: 'Equipment model is working correctly'
      }
    });

  } catch (error) {
    console.error('Error testing equipment:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test equipment',
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 