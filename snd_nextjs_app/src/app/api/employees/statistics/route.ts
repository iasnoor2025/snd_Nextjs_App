
import { db } from '@/lib/db';
import { employeeAssignments, employees, projectManpower, employeeLeaves } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { and, eq, inArray, sql, gte, lte } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { apiCache, createCacheKey } from '@/lib/api-cache';

const getEmployeeStatisticsHandler = async () => {
  try {
    // Get session to check user role
    const session = await getServerSession();
    const user = session?.user;

    // Check short-lived server cache first (reduces repeated heavy queries)
    const cacheKey = createCacheKey('/api/employees/statistics');
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get total employee count
    const totalEmployeesRows = await db.select({ count: sql<number>`count(*)` }).from(employees);
    const totalEmployees = Number((totalEmployeesRows as { count: number }[])[0]?.count ?? 0);

    // Get employees with current assignments
    let currentlyAssigned = 0;
    
    // Get all employees
    const allEmployees = await db
      .select({
        id: employees.id,
        fileNumber: employees.fileNumber,
      })
      .from(employees);

    const employeeIds = allEmployees.map(emp => emp.id);
    
    if (employeeIds.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Found employee IDs:', employeeIds);
      }
      
      // Get all active assignments from employeeAssignments table
      const assignmentRows = await db
        .select({
          employeeId: employeeAssignments.employeeId,
          type: employeeAssignments.type,
          status: employeeAssignments.status,
          startDate: employeeAssignments.startDate,
          endDate: employeeAssignments.endDate,
        })
        .from(employeeAssignments)
        .where(
          and(
            inArray(employeeAssignments.employeeId, employeeIds),
            eq(employeeAssignments.status, 'active')
          )
        );

      // Get all active assignments from projectManpower table
      const projectManpowerRows = await db
        .select({
          employeeId: projectManpower.employeeId,
          status: projectManpower.status,
          startDate: projectManpower.startDate,
          endDate: projectManpower.endDate,
        })
        .from(projectManpower)
        .where(
          and(
            inArray(projectManpower.employeeId, employeeIds),
            eq(projectManpower.status, 'active')
          )
        );

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Found assignment rows:', assignmentRows.length);
        console.log('🔍 Found projectManpower rows:', projectManpowerRows.length);
      }

      // Count unique employees with active assignments from both sources
      const employeesWithAssignments = new Set();
      
      // Process employeeAssignments
      assignmentRows.forEach(row => {
        // Check if assignment is currently active (no end date or end date is in the future)
        const isAssignmentActive = 
          row.status === 'active' &&
          (!row.endDate || new Date(row.endDate) > new Date());
        
        if (process.env.NODE_ENV === 'development') {
          // Detailed row logging only in development
          console.log('🔍 Assignment row:', row, 'isActive:', isAssignmentActive);
        }
        
        if (isAssignmentActive) {
          employeesWithAssignments.add(row.employeeId);
        }
      });

      // Process projectManpower
      projectManpowerRows.forEach(row => {
        // Check if assignment is currently active (no end date or end date is in the future)
        const isAssignmentActive = 
          row.status === 'active' &&
          (!row.endDate || new Date(row.endDate) > new Date());
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 ProjectManpower row:', row, 'isActive:', isAssignmentActive);
        }
        
        if (isAssignmentActive) {
          employeesWithAssignments.add(row.employeeId);
        }
      });
      
      currentlyAssigned = employeesWithAssignments.size;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Employees with assignments set:', employeesWithAssignments.size);
      }
    } else {
      currentlyAssigned = 0;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Currently assigned count:', currentlyAssigned);
    }

    // Count project assignments (from both employeeAssignments and projectManpower tables)
    let projectAssignments = 0;
    if (totalEmployees > 0) {
      // Get project assignments from employeeAssignments table
      const assignmentRows = await db
        .select({
          employeeId: employeeAssignments.employeeId,
          type: employeeAssignments.type,
          status: employeeAssignments.status,
          startDate: employeeAssignments.startDate,
          endDate: employeeAssignments.endDate,
        })
        .from(employeeAssignments)
        .where(
          and(
            eq(employeeAssignments.status, 'active'),
            eq(employeeAssignments.type, 'project')
          )
        );

      // Get project assignments from projectManpower table
      const projectManpowerRows = await db
        .select({
          employeeId: projectManpower.employeeId,
          status: projectManpower.status,
          startDate: projectManpower.startDate,
          endDate: projectManpower.endDate,
        })
        .from(projectManpower)
        .where(eq(projectManpower.status, 'active'));

      // Count unique employees with active project assignments from both sources
      const employeesWithProjectAssignments = new Set();
      
      // Process employeeAssignments
      assignmentRows.forEach(row => {
        const isAssignmentActive = 
          row.status === 'active' &&
          (!row.endDate || new Date(row.endDate) > new Date());
        
        if (isAssignmentActive) {
          employeesWithProjectAssignments.add(row.employeeId);
        }
      });

      // Process projectManpower
      projectManpowerRows.forEach(row => {
        const isAssignmentActive = 
          row.status === 'active' &&
          (!row.endDate || new Date(row.endDate) > new Date());
        
        if (isAssignmentActive) {
          employeesWithProjectAssignments.add(row.employeeId);
        }
      });
      
      projectAssignments = employeesWithProjectAssignments.size;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Project assignments breakdown:', {
          fromEmployeeAssignments: assignmentRows.length,
          fromProjectManpower: projectManpowerRows.length,
          totalUnique: projectAssignments,
        });
      }
    } else {
      projectAssignments = 0;
    }

    // Count rental assignments
    let rentalAssignments = 0;
    const rentalTypes = ['rental', 'rental_item'] as const;
    
    if (totalEmployees > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Checking rental assignments for all employees');
      }
      
      const assignmentRows = await db
        .select({
          employeeId: employeeAssignments.employeeId,
          type: employeeAssignments.type,
          status: employeeAssignments.status,
          startDate: employeeAssignments.startDate,
          endDate: employeeAssignments.endDate,
        })
        .from(employeeAssignments)
        .where(
          and(
            eq(employeeAssignments.status, 'active'),
            inArray(employeeAssignments.type, rentalTypes as unknown as string[])
          )
        );

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Rental assignment rows count:', assignmentRows.length);
        console.log('🔍 Looking for types:', rentalTypes);
      }

      // Count unique employees with active rental assignments
      const employeesWithRentalAssignments = new Set();
      assignmentRows.forEach(row => {
        const isAssignmentActive = 
          row.status === 'active' &&
          (!row.endDate || new Date(row.endDate) > new Date());
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Rental assignment row:', row, 'isActive:', isAssignmentActive);
        }
        
        if (isAssignmentActive) {
          employeesWithRentalAssignments.add(row.employeeId);
        }
      });
      
      rentalAssignments = employeesWithRentalAssignments.size;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Employees with rental assignments count:', employeesWithRentalAssignments.size);
      }
    } else {
      rentalAssignments = 0;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Project assignments count:', projectAssignments);
      console.log('🔍 Rental assignments count:', rentalAssignments);
    }

    // Count employees currently on leave
    let employeesOnLeave = 0;
    if (totalEmployees > 0) {
      const today = new Date().toISOString().split('T')[0];
      
      const leaveRows = await db
        .select({
          employeeId: employeeLeaves.employeeId,
          status: employeeLeaves.status,
          startDate: employeeLeaves.startDate,
          endDate: employeeLeaves.endDate,
        })
        .from(employeeLeaves)
        .where(
          and(
            eq(employeeLeaves.status, 'approved'),
            lte(employeeLeaves.startDate, today),
            gte(employeeLeaves.endDate, today)
          )
        );

      // Count unique employees currently on leave
      const employeesOnLeaveSet = new Set();
      leaveRows.forEach(row => {
        employeesOnLeaveSet.add(row.employeeId);
      });
      
      employeesOnLeave = employeesOnLeaveSet.size;
      console.log('🔍 Employees on leave count:', employeesOnLeave);
    }

    const payload = {
      success: true,
      data: {
        totalEmployees,
        currentlyAssigned,
        projectAssignments,
        rentalAssignments,
        employeesOnLeave,
      },
      message: 'Employee statistics retrieved successfully',
    } as const;

    // Store in cache for 30 seconds to reduce repeated heavy queries
    apiCache.set(cacheKey, payload, 30000);

    return NextResponse.json(payload);
  } catch (error) {
    console.error('🔍 Statistics API - Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch employee statistics. Please try refreshing the page.',
      },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.employee.read)(getEmployeeStatisticsHandler);
