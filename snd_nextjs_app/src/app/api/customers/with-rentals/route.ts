
import { db } from '@/lib/drizzle';
import { getRBACPermissions } from '@/lib/rbac/rbac-utils';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { customers, rentals, rentalItems, rentalEquipmentTimesheets } from '@/lib/drizzle/schema';
import { eq, sql, count, and, gte, lte, inArray, notInArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('read', 'Customer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const hasTimesheet = searchParams.get('hasTimesheet'); // 'yes', 'no', or null

    // Build date filter if month is provided
    let dateFilter: any = undefined;
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDateStr = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const endDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      dateFilter = and(
        gte(rentalEquipmentTimesheets.date, startDateStr),
        lte(rentalEquipmentTimesheets.date, endDateStr)
      );
    }

    // Handle hasTimesheet filter
    let rentalIdFilter: any = undefined;
    if (hasTimesheet === 'yes' || hasTimesheet === 'no') {
      // Get rental IDs that have timesheet entries (with or without date filter)
      const rentalsWithTimesheets = await db
        .selectDistinct({ rentalId: rentalEquipmentTimesheets.rentalId })
        .from(rentalEquipmentTimesheets)
        .where(dateFilter || undefined);
      const rentalIds = rentalsWithTimesheets.map(r => r.rentalId).filter((id): id is number => id !== null);
      
      if (hasTimesheet === 'yes') {
        if (rentalIds.length > 0) {
          rentalIdFilter = inArray(rentals.id, rentalIds);
        } else {
          // No rentals have timesheets, return empty results
          rentalIdFilter = sql`1 = 0`; // Always false condition
        }
      } else if (hasTimesheet === 'no') {
        if (rentalIds.length > 0) {
          rentalIdFilter = notInArray(rentals.id, rentalIds);
        }
        // If no rentals have timesheets and we want "no timesheet", show all rentals (no filter needed)
      }
    }

    // Build where conditions for rentals
    const rentalConditions = [];
    if (rentalIdFilter) {
      rentalConditions.push(rentalIdFilter);
    }

    const rentalWhereFilter = rentalConditions.length > 0 ? and(...rentalConditions) : undefined;

    // Get customers who have rentals matching the filters
    // For "no timesheet" with month filter, we need special handling
    let customersWithRentals;
    
    if (month && hasTimesheet === 'no') {
      // Special case: for "no timesheet" with month filter, we need to check rental items
      const [year, monthNum] = month.split('-').map(Number);
      const filterStartDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const filterEndDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      // Get rental items that have timesheets in this month
      const itemsWithTimesheets = await db
        .selectDistinct({ rentalItemId: rentalEquipmentTimesheets.rentalItemId })
        .from(rentalEquipmentTimesheets)
        .where(dateFilter || undefined);
      
      const itemsWithTimesheetsSet = new Set(
        itemsWithTimesheets.map(r => r.rentalItemId).filter((id): id is number => id !== null)
      );

      // Get all rental items active during the month
      const allRentalItemsInMonth = await db
        .selectDistinct({ 
          rentalId: rentalItems.rentalId,
          rentalItemId: rentalItems.id
        })
        .from(rentalItems)
        .where(
          and(
            sql`COALESCE(${rentalItems.startDate}, '1900-01-01')::date <= ${filterEndDate}::date`,
            sql`(${rentalItems.completedDate} IS NULL OR ${rentalItems.completedDate}::date >= ${filterStartDate}::date)`
          )
        );

      // Filter to only items without timesheets
      const rentalItemsWithoutTimesheets = allRentalItemsInMonth.filter(
        item => !itemsWithTimesheetsSet.has(item.rentalItemId)
      );

      // Get unique rental IDs
      const uniqueRentalIds = Array.from(
        new Set(rentalItemsWithoutTimesheets.map(r => r.rentalId).filter((id): id is number => id !== null && id !== undefined))
      );

      if (uniqueRentalIds.length > 0) {
        customersWithRentals = await db
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
          .innerJoin(rentals, eq(customers.id, rentals.customerId))
          .where(inArray(rentals.id, uniqueRentalIds))
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
      } else {
        customersWithRentals = [];
      }
    } else {
      // Standard query with filters
      customersWithRentals = await db
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
        .innerJoin(rentals, eq(customers.id, rentals.customerId))
        .where(rentalWhereFilter)
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
    }

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
