import { authOptions } from '@/lib/auth-config';
import { DashboardService } from '@/lib/services/dashboard-service';
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const isSeniorRole =
      session.user.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
    const dataLimit = isSeniorRole ? Math.min(limit, 500) : Math.min(limit, 500);

    // Fetch all dashboard data sequentially to identify which call fails

    const stats = await DashboardService.getDashboardStats();

    const iqamaData = await DashboardService.getIqamaData(10000);

    let equipmentData: Array<{
      status: 'available' | 'expired' | 'expiring' | 'missing';
      daysRemaining: number | null;
      id: number;
      equipmentName: string;
      equipmentNumber: string | null;
      istimara: string | null;
      istimaraExpiry: string | null;
    }> = [];

    // Test direct database access first
    try {
      
      const { db } = await import('@/lib/drizzle');
      const { equipment } = await import('@/lib/drizzle/schema');

      // Test with just basic select
      const directTest = await db
        .select({ id: equipment.id, name: equipment.name })
        .from(equipment)
        .limit(1);

      if (directTest.length > 0) {

      }
    } catch (directError) {
      
    }

    // Skip DashboardService and use direct database query directly
    
    try {
      const { db } = await import('@/lib/drizzle');
      const { equipment } = await import('@/lib/drizzle/schema');

      // Use minimal fields to avoid any schema issues
      
      const directEquipmentData = await db
        .select({
          id: equipment.id,
          equipmentName: equipment.name,
          equipmentNumber: equipment.doorNumber,
          istimara: equipment.istimara,
          istimaraExpiry: equipment.istimaraExpiryDate,
          status: equipment.status,
        })
        .from(equipment)
        .limit(10000);

      if (directEquipmentData.length > 0) {
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
              daysRemaining = diffDays; // Keep negative for expired items
            } else if (diffDays <= 30) {
              status = 'expiring';
              daysRemaining = diffDays;
            } else {
              daysRemaining = diffDays;
            }
          }

          return {
            ...doc,
            status,
            daysRemaining,
          };
        });

        equipmentData = processedData;
      } else {
        equipmentData = [];
      }
    } catch (error) {
      if (error instanceof Error) {
        // Handle error silently for production
      }
      equipmentData = [];
    }

    const timesheetData = await DashboardService.getTodayTimesheets(dataLimit);

    const documentData = await DashboardService.getExpiringDocuments(dataLimit);

    const leaveData = await DashboardService.getActiveLeaveRequests(dataLimit);

    const employeesOnLeaveData = await DashboardService.getEmployeesCurrentlyOnLeave();

    const rentalData = await DashboardService.getActiveRentals(dataLimit);

    const projectData = await DashboardService.getActiveProjects(dataLimit);

    const activityData = await DashboardService.getRecentActivity(dataLimit);

    return NextResponse.json({
      stats,
      iqamaData,
      equipmentData,
      timesheetData,
      documentData,
      leaveData,
      employeesOnLeaveData,
      rentalData,
      projectData,
      recentActivity: activityData,
    });
  } catch (error) {
      // Log more detailed error information
      if (error instanceof Error) {
        // Handle error silently for production
      }

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
