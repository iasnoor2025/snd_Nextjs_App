import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth-config'

export async function GET(request: NextRequest) {
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

    // Get employee data for the current user
    const employee = await prisma.employee.findFirst({
      where: {
        user_id: parseInt(session.user.id)
      },
      include: {
        user: true,
        department: true,
        designation: true
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Get recent timesheets (last 7 days)
    const recentTimesheets = await prisma.timesheet.findMany({
      where: {
        employee_id: employee.id,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 5,
      include: {
        project_rel: true
      }
    })

    // Get recent leave requests
    const recentLeaves = await prisma.employeeLeave.findMany({
      where: {
        employee_id: employee.id
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    })

    // Get current projects/assignments
    const currentAssignments = await prisma.employeeAssignment.findMany({
      where: {
        employee_id: employee.id,
        status: 'active'
      },
      include: {
        project: true,
        rental: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    })

    // Get recent advances
    const recentAdvances = await prisma.advancePayment.findMany({
      where: {
        employee_id: employee.id
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    })

    // Get employee documents
    const documents = await prisma.employeeDocument.findMany({
      where: {
        employee_id: employee.id
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    })

    // Get employee skills
    const skills = await prisma.employeeSkill.findMany({
      where: {
        employee_id: employee.id
      },
      include: {
        skill: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    })

    // Get training records
    const trainingRecords = await prisma.employeeTraining.findMany({
      where: {
        employee_id: employee.id
      },
      include: {
        training: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    })

    // Calculate statistics
    const [
      totalTimesheets,
      pendingLeaves,
      approvedLeaves,
      totalAssignments,
      totalDocuments,
      totalAdvances,
      totalSkills,
      totalTrainingRecords
    ] = await Promise.all([
      prisma.timesheet.count({ where: { employee_id: employee.id } }),
      prisma.employeeLeave.count({ where: { employee_id: employee.id, status: 'pending' } }),
      prisma.employeeLeave.count({ where: { employee_id: employee.id, status: 'approved' } }),
      prisma.employeeAssignment.count({ where: { employee_id: employee.id } }),
      prisma.employeeDocument.count({ where: { employee_id: employee.id } }),
      prisma.advancePayment.count({ where: { employee_id: employee.id } }),
      prisma.employeeSkill.count({ where: { employee_id: employee.id } }),
      prisma.employeeTraining.count({ where: { employee_id: employee.id } })
    ])

    // Format the response
    const dashboardData = {
      employee: {
        id: employee.id.toString(),
        erpnext_id: employee.erpnext_id,
        file_number: employee.file_number,
        employee_id: employee.employee_id,
        name: `${employee.first_name} ${employee.last_name}`,
        email: employee.user?.email || '',
        phone: employee.phone,
        address: employee.address,
        city: employee.city,
        state: employee.state,
        postal_code: employee.postal_code,
        country: employee.country,
        nationality: employee.nationality,
        date_of_birth: employee.date_of_birth?.toISOString().split('T')[0],
        hire_date: employee.hire_date?.toISOString().split('T')[0],
        supervisor: employee.supervisor,
        designation: employee.designation?.name || 'N/A',
        department: employee.department?.name || 'N/A',
        location: employee.current_location,
        hourly_rate: employee.hourly_rate ? Number(employee.hourly_rate) : null,
        basic_salary: employee.basic_salary ? Number(employee.basic_salary) : null,
        food_allowance: employee.food_allowance ? Number(employee.food_allowance) : null,
        housing_allowance: employee.housing_allowance ? Number(employee.housing_allowance) : null,
        transport_allowance: employee.transport_allowance ? Number(employee.transport_allowance) : null,
        absent_deduction_rate: employee.absent_deduction_rate ? Number(employee.absent_deduction_rate) : null,
        overtime_rate_multiplier: employee.overtime_rate_multiplier ? Number(employee.overtime_rate_multiplier) : null,
        overtime_fixed_rate: employee.overtime_fixed_rate ? Number(employee.overtime_fixed_rate) : null,
        bank_name: employee.bank_name,
        bank_account_number: employee.bank_account_number,
        bank_iban: employee.bank_iban,
        contract_hours_per_day: employee.contract_hours_per_day,
        contract_days_per_month: employee.contract_days_per_month,
        emergency_contact_name: employee.emergency_contact_name,
        emergency_contact_phone: employee.emergency_contact_phone,
        current_assignment: null
      },
      statistics: {
        totalTimesheets,
        pendingLeaves,
        approvedLeaves,
        activeProjects: currentAssignments.length,
        totalAssignments,
        totalDocuments,
        totalAdvances,
        totalSkills,
        totalTrainingRecords
      },
      recentTimesheets: recentTimesheets.map(ts => ({
        id: ts.id.toString(),
        date: ts.date.toISOString().split('T')[0],
        hours_worked: Number(ts.hours_worked).toString(),
        overtime_hours: Number(ts.overtime_hours).toString(),
        status: ts.status,
        created_at: ts.created_at.toISOString(),
        start_time: ts.start_time.toISOString(),
        end_time: ts.end_time?.toISOString() || '',
        project: ts.project_rel ? { name: ts.project_rel.name } : undefined
      })),
      recentLeaves: recentLeaves.map(leave => ({
        id: leave.id.toString(),
        start_date: leave.start_date.toISOString().split('T')[0],
        end_date: leave.end_date.toISOString().split('T')[0],
        leave_type: leave.leave_type,
        status: leave.status,
        created_at: leave.created_at.toISOString(),
        reason: leave.reason || '',
        days: leave.days
      })),
      currentProjects: currentAssignments.map(assignment => ({
        id: assignment.id.toString(),
        name: assignment.name || (assignment.project?.name || assignment.rental?.rental_number || 'Assignment'),
        description: assignment.notes || '',
        status: assignment.status,
        assignmentStatus: assignment.status,
        project: assignment.project ? { name: assignment.project.name } : undefined,
        rental: assignment.rental ? { name: assignment.rental.rental_number } : undefined
      })),
      documents: documents.map(doc => ({
        id: doc.id.toString(),
        document_type: doc.document_type,
        file_name: doc.file_name,
        file_path: doc.file_path,
        description: doc.description || '',
        created_at: doc.created_at.toISOString(),
        updated_at: doc.updated_at.toISOString()
      })),
      assignments: currentAssignments.map(assignment => ({
        id: assignment.id.toString(),
        title: assignment.name || 'Assignment',
        description: assignment.notes || '',
        status: assignment.status,
        created_at: assignment.created_at.toISOString()
      })),
      advances: recentAdvances.map(advance => ({
        id: advance.id.toString(),
        amount: Number(advance.amount),
        reason: advance.purpose || '',
        status: advance.status,
        created_at: advance.created_at.toISOString()
      })),
      skills: skills.map(skill => ({
        id: skill.id.toString(),
        proficiency_level: skill.proficiency_level || '',
        certified: skill.certified,
        certification_date: skill.certification_date?.toISOString().split('T')[0],
        skill: skill.skill ? {
          name: skill.skill.name,
          description: skill.skill.description || '',
          category: skill.skill.category || ''
        } : null
      })),
      trainingRecords: trainingRecords.map(training => ({
        id: training.id.toString(),
        status: training.status,
        start_date: training.start_date?.toISOString().split('T')[0],
        training: training.training ? {
          name: training.training.name,
          description: training.training.description || '',
          duration: training.training.duration,
          provider: training.training.provider || ''
        } : null
      }))
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Error fetching employee dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
