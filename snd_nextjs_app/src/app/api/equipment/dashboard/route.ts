
import { db } from '@/lib/drizzle';
import { equipment, employees } from '@/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '10000');
    const dataLimit = Math.min(limit, 10000);

    // Generate cache key for equipment dashboard
    const cacheKey = generateCacheKey('equipment', 'dashboard', { limit: dataLimit });
    
    return await cacheQueryResult(
      cacheKey,
      async () => {
        // Fetch equipment data with assigned driver/operator information
        const directEquipmentData = await db
          .select({
            id: equipment.id,
            equipmentName: equipment.name,
            equipmentNumber: equipment.doorNumber,
            doorNumber: equipment.doorNumber,
            istimara: equipment.istimara,
            istimaraExpiry: equipment.istimaraExpiryDate,
            insurance: equipment.insurance,
            insuranceExpiry: equipment.insuranceExpiryDate,
            tuvCard: equipment.tuvCard,
            tuvCardExpiry: equipment.tuvCardExpiryDate,
            gpsExpiry: equipment.gpsExpiryDate,
            periodicExaminationExpiry: equipment.periodicExaminationExpiryDate,
            warrantyExpiry: equipment.warrantyExpiryDate,
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
        const equipmentData = directEquipmentData.map((item) => {
          let status: 'available' | 'expired' | 'expiring' | 'missing' = 'available';
          let daysRemaining: number | null = null;

          // Check if istimara number exists
          if (!item.istimara) {
            status = 'missing';
          } else if (!item.istimaraExpiry) {
            // Has istimara but no expiry date - mark as missing expiry
            status = 'missing';
          } else {
            const expiryDate = new Date(item.istimaraExpiry);
            const timeDiff = expiryDate.getTime() - today.getTime();
            daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (daysRemaining < 0) {
              status = 'expired';
            } else if (daysRemaining <= 30) {
              status = 'expiring';
            } else {
              // Valid istimara with future expiry date
              status = 'available';
            }
          }

          return {
            id: item.id,
            equipmentName: item.equipmentName,
            equipmentNumber: item.equipmentNumber,
            doorNumber: item.doorNumber,
            istimara: item.istimara,
            istimaraExpiry: item.istimaraExpiry,
            insurance: item.insurance,
            insuranceExpiry: item.insuranceExpiry,
            tuvCard: item.tuvCard,
            tuvCardExpiry: item.tuvCardExpiry,
            gpsExpiry: item.gpsExpiry,
            periodicExaminationExpiry: item.periodicExaminationExpiry,
            warrantyExpiry: item.warrantyExpiry,
            status,
            daysRemaining,
            manufacturer: item.manufacturer,
            modelNumber: item.modelNumber,
            serialNumber: item.serialNumber,
            categoryId: item.categoryId,
            assignedTo: item.assignedTo,
            driverName: item.driverName,
            driverFileNumber: item.driverFileNumber,
          };
        });

        return NextResponse.json({
          success: true,
          equipment: equipmentData,
          total: equipmentData.length,
        });
      },
      {
        ttl: 300, // 5 minutes
        tags: [CACHE_TAGS.EQUIPMENT, CACHE_TAGS.EMPLOYEES, CACHE_TAGS.DASHBOARD],
      }
    );
  } catch (error) {
    console.error('Error fetching equipment dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment dashboard data' }, { status: 500 });
  }
}
