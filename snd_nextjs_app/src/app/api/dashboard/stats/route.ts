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

    // Fetch dashboard stats (now optimized with parallel queries!)
    const stats = await DashboardService.getDashboardStats();
    

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
