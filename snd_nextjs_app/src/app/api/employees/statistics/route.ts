import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { employeeAssignments, employees, projectManpower } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

const getEmployeeStatisticsHandler = async () => {
  try {
    console.log('🔍 Statistics API - Starting...');

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;
    
    console.log('🔍 User role:', user?.role);

    // Get total employee count
    const totalEmployeesRows = await db.select({ count: sql<number>`count(*)` }).from(employees);
    const totalEmployees = Number((totalEmployeesRows as { count: number }[])[0]?.count ?? 0);
    
    console.log('🔍 Total employees found:', totalEmployees);
    
    // Debug: Check all assignments in the database
    const allAssignments = await db
      .select({
        id: employeeAssignments.id,
        employeeId: employeeAssignments.employeeId,
        type: employeeAssignments.type,
        status: employeeAssignments.status,
        startDate: employeeAssignments.startDate,
        endDate: employeeAssignments.endDate,
      })
      .from(employeeAssignments)
      .limit(10);
    
    console.log('🔍 All assignments in database (first 10):', allAssignments);
    console.log('🔍 Total assignments count:', allAssignments.length);

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
      console.log('🔍 Found employee IDs:', employeeIds);
      
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

      console.log('🔍 Found assignment rows:', assignmentRows);
      console.log('🔍 Found projectManpower rows:', projectManpowerRows);
      console.log('🔍 Assignment rows count:', assignmentRows.length);
      console.log('🔍 ProjectManpower rows count:', projectManpowerRows.length);

      // Count unique employees with active assignments from both sources
      const employeesWithAssignments = new Set();
      
      // Process employeeAssignments
      assignmentRows.forEach(row => {
        // Check if assignment is currently active (no end date or end date is in the future)
        const isAssignmentActive = 
          row.status === 'active' &&
          (!row.endDate || new Date(row.endDate) > new Date());
        
        console.log('🔍 Assignment row:', row, 'isActive:', isAssignmentActive);
        
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
        
        console.log('🔍 ProjectManpower row:', row, 'isActive:', isAssignmentActive);
        
        if (isAssignmentActive) {
          employeesWithAssignments.add(row.employeeId);
        }
      });
      
      currentlyAssigned = employeesWithAssignments.size;
      console.log('🔍 Employees with assignments set:', Array.from(employeesWithAssignments));
    } else {
      currentlyAssigned = 0;
    }
    
    console.log('🔍 Currently assigned count:', currentlyAssigned);

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
      console.log('🔍 Project assignments breakdown:');
      console.log('🔍 - From employeeAssignments table:', assignmentRows.length);
      console.log('🔍 - From projectManpower table:', projectManpowerRows.length);
      console.log('🔍 - Total unique employees with project assignments:', projectAssignments);
    } else {
      projectAssignments = 0;
    }

    // Count rental assignments
    let rentalAssignments = 0;
    const rentalTypes = ['rental', 'rental_item'] as const;
    
    if (totalEmployees > 0) {
      console.log('🔍 Checking rental assignments for all employees');
      
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

      console.log('🔍 Found rental assignment rows:', assignmentRows);
      console.log('🔍 Rental assignment rows count:', assignmentRows.length);
      console.log('🔍 Looking for types:', rentalTypes);

      // Count unique employees with active rental assignments
      const employeesWithRentalAssignments = new Set();
      assignmentRows.forEach(row => {
        const isAssignmentActive = 
          row.status === 'active' &&
          (!row.endDate || new Date(row.endDate) > new Date());
        
        console.log('🔍 Rental assignment row:', row, 'isActive:', isAssignmentActive);
        
        if (isAssignmentActive) {
          employeesWithRentalAssignments.add(row.employeeId);
        }
      });
      
      rentalAssignments = employeesWithRentalAssignments.size;
      console.log('🔍 Employees with rental assignments set:', Array.from(employeesWithRentalAssignments));
    } else {
      rentalAssignments = 0;
    }
    
    console.log('🔍 Project assignments count:', projectAssignments);
    console.log('🔍 Rental assignments count:', rentalAssignments);

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        currentlyAssigned,
        projectAssignments,
        rentalAssignments,
      },
      message: 'Employee statistics retrieved successfully',
    });
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
