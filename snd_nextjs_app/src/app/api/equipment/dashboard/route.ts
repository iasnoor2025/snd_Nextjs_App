import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { equipment, employees } from '@/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an employee (redirect them to employee dashboard)
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '10000');
    const isSeniorRole =
      session.user.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
    const dataLimit = isSeniorRole ? Math.min(limit, 10000) : Math.min(limit, 10000);

    // Fetch equipment data with assigned driver/operator information
    const directEquipmentData = await db
      .select({
        id: equipment.id,
        equipmentName: equipment.name,
        equipmentNumber: equipment.doorNumber,
        istimara: equipment.istimara,
        istimaraExpiry: equipment.istimaraExpiryDate,
        status: equipment.status,
        manufacturer: equipment.manufacturer,
        modelNumber: equipment.modelNumber,
        serialNumber: equipment.serialNumber,
        categoryId: equipment.categoryId,
        assignedTo: equipment.assignedTo,
        driverName: sql<string>`CONCAT(employees.first_name, ' ', COALESCE(employees.middle_name, ''), ' ', employees.last_name)`.as('driverName'),
        driverFileNumber: employees.fileNumber,
      })
      .from(equipment)
      .leftJoin(employees, eq(equipment.assignedTo, employees.id))
      .limit(dataLimit);

    // Process the data with status logic
    const today = new Date();
    const processedData = directEquipmentData.map(doc => {
      let status: 'available' | 'expired' | 'expiring' | 'missing' = 'available';
      let daysRemaining: number | null = null;

      if (!doc.istimaraExpiry) {
        status = 'missing';
      } else {
        const expiryDate = new Date(doc.istimaraExpiry);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          status = 'expired';
          daysRemaining = diffDays;
        } else if (diffDays <= 30) {
          status = 'expiring';
          daysRemaining = diffDays;
        } else {
          status = 'available';
          daysRemaining = diffDays;
        }
      }

      return {
        id: doc.id,
        equipmentName: doc.equipmentName,
        equipmentNumber: doc.equipmentNumber,
        istimara: doc.istimara,
        istimaraExpiry: doc.istimaraExpiry,
        daysRemaining,
        status,
        manufacturer: doc.manufacturer,
        modelNumber: doc.modelNumber,
        serialNumber: doc.serialNumber,
        categoryId: doc.categoryId,
        assignedTo: doc.assignedTo,
        driverName: doc.driverName,
        driverFileNumber: doc.driverFileNumber,
      };
    });

    return NextResponse.json({
      equipmentData: processedData,
      message: 'Equipment data fetched successfully',
    });
  } catch (error) {

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
