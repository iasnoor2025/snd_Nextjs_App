import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { rentalEquipmentTimesheets } from '@/lib/drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const getEquipmentTimesheetsHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const rentalId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const rentalItemId = searchParams.get('rentalItemId');
    const month = searchParams.get('month'); // YYYY-MM

    if (!rentalItemId) {
      return NextResponse.json(
        { error: 'rentalItemId is required' },
        { status: 400 }
      );
    }

    const conditions = [
      eq(rentalEquipmentTimesheets.rentalId, rentalId),
      eq(rentalEquipmentTimesheets.rentalItemId, parseInt(rentalItemId)),
    ];

    // Filter by month if provided
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      // Use string formatting to avoid timezone issues
      const startDateStr = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      // Get last day of the month
      const lastDay = new Date(year, monthNum, 0).getDate();
      const endDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      // Use date string comparison to avoid timezone issues
      conditions.push(gte(rentalEquipmentTimesheets.date, startDateStr));
      conditions.push(lte(rentalEquipmentTimesheets.date, endDateStr));
    }

    const timesheets = await db
      .select()
      .from(rentalEquipmentTimesheets)
      .where(and(...conditions))
      .orderBy(rentalEquipmentTimesheets.date);


    return NextResponse.json({
      success: true,
      data: timesheets,
    });
  } catch (error: any) {
    console.error('Error fetching equipment timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment timesheets', details: error.message },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.rental.read)(getEquipmentTimesheetsHandler);

