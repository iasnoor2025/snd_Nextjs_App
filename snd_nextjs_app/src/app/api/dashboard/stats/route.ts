import { authOptions } from '@/lib/auth-config';
import { DashboardService } from '@/lib/services/dashboard-service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Cache response for 30 seconds to reduce load
let cachedStats: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return cached data if available and not expired
    const now = Date.now();
    if (cachedStats && (now - cacheTimestamp) < CACHE_TTL) {
      return NextResponse.json({ stats: cachedStats });
    }

    // Fetch dashboard stats (now optimized with parallel queries!)
    const stats = await DashboardService.getDashboardStats();
    
    // Cache the result
    cachedStats = stats;
    cacheTimestamp = now;

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Dashboard Stats API - Error:', error);
    
    // Return default stats on error
    return NextResponse.json({
      stats: {
        totalEmployees: 0,
        activeProjects: 0,
        totalProjects: 0,
        availableEquipment: 0,
        totalEquipment: 0,
        monthlyRevenue: 0,
        pendingApprovals: 0,
        activeRentals: 0,
        totalRentals: 0,
        totalCompanies: 0,
        totalDocuments: 0,
        equipmentUtilization: 0,
        todayTimesheets: 0,
        expiredDocuments: 0,
        expiringDocuments: 0,
        employeesOnLeave: 0,
        totalMoneyReceived: 0,
        totalMoneyLost: 0,
        monthlyMoneyReceived: 0,
        monthlyMoneyLost: 0,
        netProfit: 0,
        currency: 'SAR',
      }
    });
  }
}
