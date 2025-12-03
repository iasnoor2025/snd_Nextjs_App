
import { db } from '@/lib/drizzle';
import { getRBACPermissions } from '@/lib/rbac/rbac-utils';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { employees, projects, equipment, customers, rentals, timesheets, payrolls } from '@/lib/drizzle/schema';
import { count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('read', 'Report')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Test basic database queries
    const [
      employeeCount,
      projectCount,
      equipmentCount,
      customerCount,
      rentalCount,
      timesheetCount,
      payrollCount
    ] = await Promise.all([
      db.select({ count: count() }).from(employees),
      db.select({ count: count() }).from(projects),
      db.select({ count: count() }).from(equipment),
      db.select({ count: count() }).from(customers),
      db.select({ count: count() }).from(rentals),
      db.select({ count: count() }).from(timesheets),
      db.select({ count: count() }).from(payrolls)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        employees: employeeCount[0]?.count || 0,
        projects: projectCount[0]?.count || 0,
        equipment: equipmentCount[0]?.count || 0,
        customers: customerCount[0]?.count || 0,
        rentals: rentalCount[0]?.count || 0,
        timesheets: timesheetCount[0]?.count || 0,
        payrolls: payrollCount[0]?.count || 0
      },
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing database:', error);
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
