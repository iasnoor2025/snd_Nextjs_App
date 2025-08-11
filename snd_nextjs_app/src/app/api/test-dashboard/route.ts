import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/lib/services/dashboard-service';

export async function GET(request: NextRequest) {
  try {
    const results: any = {};
    
    // Test each service method individually
    try {
      console.log('Testing getDashboardStats...');
      results.stats = await DashboardService.getDashboardStats();
      console.log('getDashboardStats: SUCCESS');
    } catch (error) {
      console.error('getDashboardStats: FAILED', error);
      results.statsError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    try {
      console.log('Testing getIqamaData...');
      results.iqamaData = await DashboardService.getIqamaData(10);
      console.log('getIqamaData: SUCCESS');
    } catch (error) {
      console.error('getIqamaData: FAILED', error);
      results.iqamaError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    try {
      console.log('Testing getTodayTimesheets...');
      results.timesheetData = await DashboardService.getTodayTimesheets(10);
      console.log('getTodayTimesheets: SUCCESS');
    } catch (error) {
      console.error('getTodayTimesheets: FAILED', error);
      results.timesheetError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    try {
      console.log('Testing getExpiringDocuments...');
      results.documentData = await DashboardService.getExpiringDocuments(10);
      console.log('getExpiringDocuments: SUCCESS');
    } catch (error) {
      console.error('getExpiringDocuments: FAILED', error);
      results.documentError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    try {
      console.log('Testing getActiveLeaveRequests...');
      results.leaveData = await DashboardService.getActiveLeaveRequests(10);
      console.log('getActiveLeaveRequests: SUCCESS');
    } catch (error) {
      console.error('getActiveLeaveRequests: FAILED', error);
      results.leaveError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    try {
      console.log('Testing getEmployeesCurrentlyOnLeave...');
      results.employeesOnLeaveData = await DashboardService.getEmployeesCurrentlyOnLeave();
      console.log('getEmployeesCurrentlyOnLeave: SUCCESS');
    } catch (error) {
      console.error('getEmployeesCurrentlyOnLeave: FAILED', error);
      results.employeesOnLeaveError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    try {
      console.log('Testing getActiveRentals...');
      results.rentalData = await DashboardService.getActiveRentals(10);
      console.log('getActiveRentals: SUCCESS');
    } catch (error) {
      console.error('getActiveRentals: FAILED', error);
      results.rentalError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    try {
      console.log('Testing getActiveProjects...');
      results.projectData = await DashboardService.getActiveProjects(10);
      console.log('getActiveProjects: SUCCESS');
    } catch (error) {
      console.error('getActiveProjects: FAILED', error);
      results.projectError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    try {
      console.log('Testing getRecentActivity...');
      results.activityData = await DashboardService.getRecentActivity(10);
      console.log('getRecentActivity: SUCCESS');
    } catch (error) {
      console.error('getRecentActivity: FAILED', error);
      results.activityError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test dashboard failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
