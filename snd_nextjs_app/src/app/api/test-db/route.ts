import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { getRBACPermissions } from '@/lib/rbac/rbac-utils';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { customers, rentals, rentalItems } from '@/lib/drizzle/schema';
import { eq, sql, count, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('read', 'Report')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('Testing database data...');

    // Test basic queries
    const customerCount = await db.select({ count: count() }).from(customers);
    const rentalCount = await db.select({ count: count() }).from(rentals);
    const rentalItemCount = await db.select({ count: count() }).from(rentalItems);

    // Test customers with rentals
    const customersWithRentals = await db
      .select({
        customer_id: customers.id,
        customer_name: customers.name,
        rental_count: count(sql`DISTINCT ${rentals.id}`)
      })
      .from(customers)
      .leftJoin(rentals, eq(customers.id, rentals.customerId))
      .where(isNotNull(rentals.id))
      .groupBy(customers.id, customers.name);

    // Test rental items with equipment
    const rentalItemsWithEquipment = await db
      .select({
        rental_id: rentalItems.rentalId,
        equipment_id: rentalItems.equipmentId,
        equipment_name: rentalItems.equipmentName,
        operator_id: rentalItems.operatorId
      })
      .from(rentalItems)
      .where(isNotNull(rentalItems.equipmentId));

    console.log('Database test results:', {
      customerCount: customerCount[0]?.count,
      rentalCount: rentalCount[0]?.count,
      rentalItemCount: rentalItemCount[0]?.count,
      customersWithRentals: customersWithRentals.length,
      rentalItemsWithEquipment: rentalItemsWithEquipment.length
    });

    return NextResponse.json({
      success: true,
      data: {
        customerCount: customerCount[0]?.count,
        rentalCount: rentalCount[0]?.count,
        rentalItemCount: rentalItemCount[0]?.count,
        customersWithRentals: customersWithRentals.length,
        rentalItemsWithEquipment: rentalItemsWithEquipment.length,
        customersWithRentalsData: customersWithRentals,
        rentalItemsWithEquipmentData: rentalItemsWithEquipment
      }
    });

  } catch (error) {
    console.error('Error testing database:', error);
    return NextResponse.json({ 
      error: 'Failed to test database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
