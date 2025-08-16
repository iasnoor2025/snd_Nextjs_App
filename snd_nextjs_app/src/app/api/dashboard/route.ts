import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { DashboardService } from '@/lib/services/dashboard-service';

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const isSeniorRole = session.user.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
    const dataLimit = isSeniorRole ? Math.min(limit, 500) : Math.min(limit, 500);

    // Fetch all dashboard data sequentially to identify which call fails
    console.log('Starting dashboard data fetch...');
    
    console.log('Fetching stats...');
    const stats = await DashboardService.getDashboardStats();
    console.log('Stats fetched successfully');
    
    console.log('Fetching iqama data...');
    const iqamaData = await DashboardService.getIqamaData(10000);
    console.log('Iqama data fetched successfully');
    
         console.log('Fetching equipment data...');
     console.log('🔍 EQUIPMENT DATA SECTION STARTED');
     let equipmentData = [];
    
         // Test direct database access first
     try {
       console.log('🔍 Testing direct database access...');
       const { db } = await import('@/lib/drizzle');
       const { equipment } = await import('@/lib/drizzle/schema');
       
       // Test with just basic select
       const directTest = await db.select({ id: equipment.id, name: equipment.name }).from(equipment).limit(1);
       console.log('🔍 Direct database test result:', directTest.length);
       
       if (directTest.length > 0) {
         console.log('🔍 Direct database test sample:', JSON.stringify(directTest[0], null, 2));
       }
     } catch (directError) {
       console.error('❌ Direct database test failed:', directError);
     }
    
        // Skip DashboardService and use direct database query directly
    console.log('🔍 Using direct database query for equipment data...');
    try {
      const { db } = await import('@/lib/drizzle');
      const { equipment } = await import('@/lib/drizzle/schema');
      
             // Use minimal fields to avoid any schema issues
       console.log('🔍 Using minimal fields to avoid schema issues...');
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
      
      console.log('✅ Direct database query result:', directEquipmentData.length);
      
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
              daysRemaining = Math.abs(diffDays);
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
        console.log('✅ Equipment data processed successfully:', equipmentData.length);
        console.log('✅ Status breakdown:', {
          available: equipmentData.filter(item => item.status === 'available').length,
          expired: equipmentData.filter(item => item.status === 'expired').length,
          expiring: equipmentData.filter(item => item.status === 'expiring').length,
          missing: equipmentData.filter(item => item.status === 'missing').length
        });
      } else {
        console.log('⚠️ Direct database query returned empty array');
      }
    } catch (error) {
      console.error('❌ Error fetching equipment data directly:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      equipmentData = [];
    }
    
    console.log('Fetching timesheet data...');
    const timesheetData = await DashboardService.getTodayTimesheets(dataLimit);
    console.log('Timesheet data fetched successfully');
    
    console.log('Fetching document data...');
    const documentData = await DashboardService.getExpiringDocuments(dataLimit);
    console.log('Document data fetched successfully');
    
    console.log('Fetching leave data...');
    const leaveData = await DashboardService.getActiveLeaveRequests(dataLimit);
    console.log('Leave data fetched successfully');
    
    console.log('Fetching employees on leave data...');
    const employeesOnLeaveData = await DashboardService.getEmployeesCurrentlyOnLeave();
    console.log('Employees on leave data fetched successfully');
    
    console.log('Fetching rental data...');
    const rentalData = await DashboardService.getActiveRentals(dataLimit);
    console.log('Rental data fetched successfully');
    
    console.log('Fetching project data...');
    const projectData = await DashboardService.getActiveProjects(dataLimit);
    console.log('Project data fetched successfully');
    
    console.log('Fetching activity data...');
    const activityData = await DashboardService.getRecentActivity(dataLimit);
    console.log('Activity data fetched successfully');
    
    console.log('All dashboard data fetched successfully');
    console.log('Final response data summary:', {
      stats: !!stats,
      iqamaData: iqamaData?.length || 0,
      equipmentData: equipmentData?.length || 0,
      timesheetData: timesheetData?.length || 0,
      documentData: documentData?.length || 0,
      leaveData: leaveData?.length || 0,
      employeesOnLeaveData: employeesOnLeaveData?.length || 0,
      rentalData: rentalData?.length || 0,
      projectData: projectData?.length || 0,
      recentActivity: activityData?.length || 0
    });
    
         console.log('🔍 Final equipment data being sent:', {
       length: equipmentData?.length || 0,
       isArray: Array.isArray(equipmentData),
       type: typeof equipmentData,
       sample: equipmentData?.slice(0, 2) || 'N/A'
     });
     
     console.log('🔍 ABOUT TO RETURN RESPONSE WITH EQUIPMENT DATA:', equipmentData.length);

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
      recentActivity: activityData
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
