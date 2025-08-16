import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth-config'
import { employees, users, departments, designations, timesheets, employeeLeaves, employeeAssignments, projects, rentals, advancePayments, employeeDocuments } from '@/lib/drizzle/schema'
import { eq, gte, desc, and } from 'drizzle-orm'

export async function GET(_request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user has EMPLOYEE role
    if (session.user.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Access denied. Employee role required.' },
        { status: 403 }
      )
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
        department: {
          id: departments.id,
          name: departments.name,
          code: departments.code
        },
        designation: {
          id: designations.id,
          name: designations.name,
          description: designations.description
        },
                  user: {
            id: users.id,
            name: users.name,
            email: users.email,
            roleId: users.roleId
          }
      })
      .from(employees)
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(eq(employees.userId, parseInt(session.user.id)))
      .limit(1);

    if (employeeRows.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const employee = employeeRows[0];
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
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
        projectId: timesheets.projectId,
        project: {
          id: projects.id,
          name: projects.name
        }
      })
      .from(timesheets)
      .leftJoin(projects, eq(timesheets.projectId, projects.id))
      .where(
        and(
          eq(timesheets.employeeId, employee.id),
          gte(timesheets.date, sevenDaysAgo)
        )
      )
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
        createdAt: employeeLeaves.createdAt
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
          name: projects.name
        },
        rental: {
          id: rentals.id,
          name: rentals.equipmentName
        }
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

    // Get recent advances using Drizzle
    const recentAdvancesRows = await db
      .select({
        id: advancePayments.id,
        amount: advancePayments.amount,
        purpose: advancePayments.purpose,
        status: advancePayments.status,
        monthlyDeduction: advancePayments.monthlyDeduction,
        createdAt: advancePayments.createdAt
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
        createdAt: employeeDocuments.createdAt
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
      description: ts.description,
      project_rel: ts.project
    }));

    const recentLeaves = recentLeavesRows.map(leave => ({
      id: leave.id,
      leave_type: leave.leaveType,
      start_date: leave.startDate,
      end_date: leave.endDate,
      days: leave.days,
      status: leave.status,
      reason: leave.reason,
      created_at: leave.createdAt
    }));

    const currentAssignments = currentAssignmentsRows.map(assignment => ({
      id: assignment.id,
      start_date: assignment.startDate,
      end_date: assignment.endDate,
      status: assignment.status,
      project: assignment.project,
      rental: assignment.rental,
      created_at: assignment.createdAt
    }));

    const recentAdvances = recentAdvancesRows.map(advance => ({
      id: advance.id,
      amount: advance.amount,
      purpose: advance.purpose,
      status: advance.status,
      monthly_deduction: advance.monthlyDeduction,
      created_at: advance.createdAt
    }));

    const employeeDocumentsList = employeeDocumentsRows.map(doc => ({
      id: doc.id,
      document_type: doc.documentType,
      file_name: doc.fileName,
      file_path: doc.filePath,
      created_at: doc.createdAt
    }));

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
        department: employee.department,
        designation: employee.designation,
        user: employee.user
      },
      recentTimesheets,
      recentLeaves,
      currentAssignments,
      recentAdvances,
      employeeDocuments: employeeDocumentsList
    })

  } catch (error) {
    console.error('Error fetching employee dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
