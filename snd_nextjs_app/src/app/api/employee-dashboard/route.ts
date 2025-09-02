import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import {
  advancePayments,
  departments,
  designations,
  employeeAssignments,
  employeeDocuments,
  employeeLeaves,
  employees,
  projects,
  rentals,
  timesheets,
  users,
  permissions,
  roleHasPermissions,
} from '@/lib/drizzle/schema';
import { and, desc, eq, gte } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { checkUserPermission } from '@/lib/rbac/permission-service';

export async function GET(_request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      console.log('❌ No session or user ID found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('🔍 Session user:', {
      id: userId,
      email: session.user.email,
      role: session.user.role
    });

    // Check if user has permission to access employee dashboard
    // This will check for wildcard permissions (*, manage.all) as well as specific permissions
    const permissionCheck = await checkUserPermission(userId, 'read', 'mydashboard');
    
    if (!permissionCheck.hasPermission) {
      console.log('❌ User does not have permission to access employee dashboard:', permissionCheck.reason);
      return NextResponse.json(
        { error: 'Access denied. Permission required to access employee dashboard.' },
        { status: 403 }
      );
    }

    console.log('✅ User has permission to access employee dashboard');

    // Debug: Check if there are any employees in the database and what user IDs they have
    const allEmployees = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        userId: employees.userId,
        email: employees.email,
      })
      .from(employees)
      .limit(10);

    console.log('👥 All employees in database:', allEmployees);
    console.log('🔍 Current session user ID:', userId, 'Type:', typeof userId);
    console.log('🔍 Looking for employee with userId =', parseInt(userId));
    console.log('🔍 Current user email:', session.user.email);

    // Get employee data for the current user using Drizzle
    const employeeRows = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
        phone: employees.phone,
        hireDate: employees.hireDate,
        basicSalary: employees.basicSalary,
        status: employees.status,
        departmentId: employees.departmentId,
        designationId: employees.designationId,
        userId: employees.userId,
        nationality: employees.nationality,
        supervisor: employees.supervisor,
        location: employees.currentLocation,
        contractHoursPerDay: employees.contractHoursPerDay,
        contractDaysPerMonth: employees.contractDaysPerMonth,
        address: employees.address,
        city: employees.city,
        country: employees.country,
        hourlyRate: employees.hourlyRate,
        foodAllowance: employees.foodAllowance,
        housingAllowance: employees.housingAllowance,
        transportAllowance: employees.transportAllowance,
        bankName: employees.bankName,
        emergencyContactName: employees.emergencyContactName,
        emergencyContactPhone: employees.emergencyContactPhone,
        department: {
          id: departments.id,
          name: departments.name,
          code: departments.code,
        },
        designation: {
          id: designations.id,
          name: designations.name,
          description: designations.description,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          roleId: users.roleId,
        },
      })
      .from(employees)
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(eq(employees.userId, parseInt(userId)))
      .limit(1);

    console.log('👤 Employee query result for current user:', {
      queryUserId: userId,
      employeeRowsFound: employeeRows.length,
      firstEmployee: employeeRows[0] ? {
        id: employeeRows[0].id,
        firstName: employeeRows[0].firstName,
        lastName: employeeRows[0].lastName,
        userId: employeeRows[0].userId
      } : null
    });

    if (employeeRows.length === 0) {
      console.log('❌ No employee record found for user ID:', userId);
      
      // Fallback: Create a basic profile from user session data
      console.log('🔄 Creating fallback profile from user session data');
      
      return NextResponse.json({
        employee: {
          id: null,
          first_name: session.user.name || 'User',
          last_name: '',
          email: session.user.email || '',
          phone: 'N/A',
          hire_date: null,
          basic_salary: 0,
          status: 'active',
          nationality: 'N/A',
          supervisor: 'N/A',
          location: 'N/A',
          contract_hours_per_day: 8,
          contract_days_per_month: 30,
          address: 'N/A',
          city: 'N/A',
          country: 'N/A',
          hourly_rate: 0,
          food_allowance: 0,
          housing_allowance: 0,
          transport_allowance: 0,
          bank_name: 'N/A',
          emergency_contact_name: 'N/A',
          emergency_contact_phone: 'N/A',
          department: {
            id: null,
            name: 'N/A',
            code: 'N/A',
          },
          designation: {
            id: null,
            name: 'N/A',
            description: 'N/A',
          },
          user: {
            id: parseInt(userId),
            name: session.user.name || 'User',
            email: session.user.email || '',
            roleId: null,
          },
        },
        statistics: {
          totalTimesheets: 0,
          pendingLeaves: 0,
          approvedLeaves: 0,
          activeProjects: 0,
          totalAssignments: 0,
          totalDocuments: 0,
          totalAdvances: 0,
        },
        recentTimesheets: [],
        recentLeaves: [],
        currentProjects: [],
        assignments: [],
        advances: [],
        documents: [],
        isFallbackProfile: true,
        message: 'No employee record found. Showing basic profile information.'
      });
    }

    const employee = employeeRows[0];

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get recent timesheets (last 7 days) using Drizzle
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentTimesheetsRows = await db
      .select({
        id: timesheets.id,
        date: timesheets.date,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        status: timesheets.status,
        description: timesheets.description,
        startTime: timesheets.startTime,
        endTime: timesheets.endTime,
        projectId: timesheets.projectId,
        project: {
          id: projects.id,
          name: projects.name,
        },
      })
      .from(timesheets)
      .leftJoin(projects, eq(timesheets.projectId, projects.id))
      .where(and(eq(timesheets.employeeId, employee.id), gte(timesheets.date, sevenDaysAgo)))
      .orderBy(desc(timesheets.date))
      .limit(5);

    // Get recent leave requests using Drizzle
    const recentLeavesRows = await db
      .select({
        id: employeeLeaves.id,
        leaveType: employeeLeaves.leaveType,
        startDate: employeeLeaves.startDate,
        endDate: employeeLeaves.endDate,
        days: employeeLeaves.days,
        status: employeeLeaves.status,
        reason: employeeLeaves.reason,
        createdAt: employeeLeaves.createdAt,
      })
      .from(employeeLeaves)
      .where(eq(employeeLeaves.employeeId, employee.id))
      .orderBy(desc(employeeLeaves.createdAt))
      .limit(5);

    // Get current projects/assignments using Drizzle
    const currentAssignmentsRows = await db
      .select({
        id: employeeAssignments.id,
        startDate: employeeAssignments.startDate,
        endDate: employeeAssignments.endDate,
        status: employeeAssignments.status,
        projectId: employeeAssignments.projectId,
        rentalId: employeeAssignments.rentalId,
        createdAt: employeeAssignments.createdAt,
        project: {
          id: projects.id,
          name: projects.name,
        },
        rental: {
          id: rentals.id,
          name: rentals.equipmentName,
        },
      })
      .from(employeeAssignments)
      .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
      .leftJoin(rentals, eq(employeeAssignments.rentalId, rentals.id))
      .where(
        and(
          eq(employeeAssignments.employeeId, employee.id),
          eq(employeeAssignments.status, 'active')
        )
      )
      .orderBy(desc(employeeAssignments.createdAt))
      .limit(5);

    // Get all assignments for the employee (including manual assignments)
    const allAssignmentsRows = await db
      .select({
        id: employeeAssignments.id,
        name: employeeAssignments.name,
        type: employeeAssignments.type,
        location: employeeAssignments.location,
        startDate: employeeAssignments.startDate,
        endDate: employeeAssignments.endDate,
        status: employeeAssignments.status,
        notes: employeeAssignments.notes,
        projectId: employeeAssignments.projectId,
        rentalId: employeeAssignments.rentalId,
        createdAt: employeeAssignments.createdAt,
        updatedAt: employeeAssignments.updatedAt,
        project: {
          id: projects.id,
          name: projects.name,
        },
        rental: {
          id: rentals.id,
          name: rentals.equipmentName,
        },
      })
      .from(employeeAssignments)
      .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
      .leftJoin(rentals, eq(employeeAssignments.rentalId, rentals.id))
      .where(eq(employeeAssignments.employeeId, employee.id))
      .orderBy(desc(employeeAssignments.createdAt))
      .limit(10);

    // Get recent advances using Drizzle
    const recentAdvancesRows = await db
      .select({
        id: advancePayments.id,
        amount: advancePayments.amount,
        purpose: advancePayments.purpose,
        status: advancePayments.status,
        monthlyDeduction: advancePayments.monthlyDeduction,
        createdAt: advancePayments.createdAt,
      })
      .from(advancePayments)
      .where(eq(advancePayments.employeeId, employee.id))
      .orderBy(desc(advancePayments.createdAt))
      .limit(5);

    // Get employee documents using Drizzle
    const employeeDocumentsRows = await db
      .select({
        id: employeeDocuments.id,
        documentType: employeeDocuments.documentType,
        fileName: employeeDocuments.fileName,
        filePath: employeeDocuments.filePath,
        description: employeeDocuments.description,
        createdAt: employeeDocuments.createdAt,
        updatedAt: employeeDocuments.updatedAt,
      })
      .from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, employee.id))
      .orderBy(desc(employeeDocuments.createdAt))
      .limit(5);

    // Transform data to match expected format
    const recentTimesheets = recentTimesheetsRows.map(ts => ({
      id: ts.id,
      date: ts.date,
      hours_worked: ts.hoursWorked,
      overtime_hours: ts.overtimeHours,
      status: ts.status,
      created_at: ts.date,
      start_time: ts.startTime,
      end_time: ts.endTime,
    }));

    const recentLeaves = recentLeavesRows.map(leave => ({
      id: leave.id,
      leave_type: leave.leaveType,
      start_date: leave.startDate,
      end_date: leave.endDate,
      days: leave.days,
      status: leave.status,
      reason: leave.reason,
      created_at: leave.createdAt,
    }));

    const currentProjects = currentAssignmentsRows.map(assignment => ({
      id: assignment.id,
      name: assignment.project?.name || 'Assignment',
      description: assignment.project?.name,
      status: assignment.status,
      assignmentStatus: assignment.status,
    }));

    const assignments = allAssignmentsRows.map(assignment => ({
      id: assignment.id,
      name: assignment.name,
      type: assignment.type,
      location: assignment.location,
      start_date: assignment.startDate,
      end_date: assignment.endDate,
      status: assignment.status,
      notes: assignment.notes,
      project_id: assignment.projectId,
      rental_id: assignment.rentalId,
      project: assignment.project,
      rental: assignment.rental,
      created_at: assignment.createdAt,
      updated_at: assignment.updatedAt,
    }));

    const advances = recentAdvancesRows.map(advance => ({
      id: advance.id,
      amount: advance.amount,
      reason: advance.purpose,
      status: advance.status,
      created_at: advance.createdAt,
    }));

    const documents = employeeDocumentsRows.map(doc => ({
      id: doc.id,
      document_type: doc.documentType,
      file_name: doc.fileName,
      file_path: doc.filePath,
      description: doc.description || '',
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
    }));

    // Calculate statistics
    const statistics = {
      totalTimesheets: recentTimesheets.length,
      pendingLeaves: recentLeaves.filter(l => l.status === 'pending').length,
      approvedLeaves: recentLeaves.filter(l => l.status === 'approved').length,
      activeProjects: currentProjects.length,
      totalAssignments: assignments.length,
      totalDocuments: documents.length,
      totalAdvances: advances.length,
    };

    return NextResponse.json({
      employee: {
        id: employee.id,
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        hire_date: employee.hireDate,
        basic_salary: employee.basicSalary,
        status: employee.status,
        nationality: employee.nationality,
        supervisor: employee.supervisor,
        location: employee.location,
        contract_hours_per_day: employee.contractHoursPerDay,
        contract_days_per_month: employee.contractDaysPerMonth,
        address: employee.address,
        city: employee.city,
        country: employee.country,
        hourly_rate: employee.hourlyRate,
        food_allowance: employee.foodAllowance,
        housing_allowance: employee.housingAllowance,
        transport_allowance: employee.transportAllowance,
        bank_name: employee.bankName,
        emergency_contact_name: employee.emergencyContactName,
        emergency_contact_phone: employee.emergencyContactPhone,
        department: employee.department,
        designation: employee.designation,
        user: employee.user,
      },
      statistics,
      recentTimesheets,
      recentLeaves,
      currentProjects,
      assignments,
      advances,
      documents,
    });
  } catch (error) {
    console.error('Employee dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
