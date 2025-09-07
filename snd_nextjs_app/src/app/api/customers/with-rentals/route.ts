import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { getRBACPermissions } from '@/lib/rbac/rbac-utils';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { customers, rentals } from '@/lib/drizzle/schema';
import { eq, sql, count, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('read', 'Customer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('Fetching customers with rentals...');

    // Get customers who have rentals
    const customersWithRentals = await db
      .select({
        id: customers.id,
        name: customers.name,
        contactPerson: customers.contactPerson,
        phone: customers.phone,
        email: customers.email,
        city: customers.city,
        customerType: customers.customerType,
        total_rentals: count(sql`DISTINCT ${rentals.id}`),
        active_rentals: count(sql`DISTINCT CASE WHEN ${rentals.status} = 'active' THEN ${rentals.id} END`)
      })
      .from(customers)
      .leftJoin(rentals, eq(customers.id, rentals.customerId))
      .where(isNotNull(rentals.id)) // Only customers with rentals
      .groupBy(
        customers.id,
        customers.name,
        customers.contactPerson,
        customers.phone,
        customers.email,
        customers.city,
        customers.customerType
      )
      .orderBy(customers.name);

    console.log('Customers with rentals:', customersWithRentals);

    return NextResponse.json({
      success: true,
      data: customersWithRentals,
      count: customersWithRentals.length
    });

  } catch (error) {
    console.error('Error fetching customers with rentals:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch customers with rentals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
