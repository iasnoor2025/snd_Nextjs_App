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
} from '@/lib/drizzle/schema';
import { and, desc, eq, gte } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user has EMPLOYEE role or if they are an employee in the database
    if (session.user.role !== 'EMPLOYEE') {
      console.log(`User role is ${session.user.role}, checking if they are an employee in database...`);
      
      // Check if the user exists as an employee in the database
      const employeeCheck = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.userId, parseInt(session.user.id)))
        .limit(1);

      if (employeeCheck.length === 0) {
        // Allow managers, supervisors, and admins to access employee dashboard
        if (['MANAGER', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
          console.log(`User has ${session.user.role} role, allowing access to employee dashboard`);
        } else {
          console.log('User is not an employee in the database and has insufficient privileges');
          return NextResponse.json(
            { error: 'Access denied. Employee role required or user must be registered as employee.' },
            { status: 403 }
          );
        }
      } else {
        console.log('User is an employee in database, allowing access');
      }
    }

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
      .where(eq(employees.userId, parseInt(session.user.id)))
      .limit(1);

    if (employeeRows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
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
