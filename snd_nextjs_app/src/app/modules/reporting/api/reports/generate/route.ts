import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
// TODO: This route still uses ORM-like aggregations; for now, disable DB updates to prevent crashes after Prisma removal.
import { getRBACPermissions } from '@/lib/rbac/rbac-utils';

export async function $1(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('export', 'Report')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { reportId, reportType, parameters } = body;

    let reportData: any = {};

    switch (reportType) {
      case 'employee_summary':
        reportData = await generateEmployeeSummaryReport(parameters);
        break;
      case 'payroll_summary':
        reportData = await generatePayrollSummaryReport(parameters);
        break;
      case 'equipment_utilization':
        reportData = await generateEquipmentUtilizationReport(parameters);
        break;
      case 'project_progress':
        reportData = await generateProjectProgressReport(parameters);
        break;
      case 'rental_summary':
        reportData = await generateRentalSummaryReport(parameters);
        break;
      case 'timesheet_summary':
        reportData = await generateTimesheetSummaryReport(parameters);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    // Update the report's last_generated timestamp
    // if (reportId) { /* Update disabled during Drizzle migration */ }

    return NextResponse.json({
      success: true,
      data: reportData,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateEmployeeSummaryReport(parameters: any) {
  const { startDate, endDate, departmentId } = parameters || {};

  const whereClause: any = {
    is_active: true,
  };

  if (startDate && endDate) {
    whereClause.created_at = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  if (departmentId) {
    whereClause.department_id = parseInt(departmentId);
  }

  const [employees, totalEmployees, activeEmployees] = await Promise.all([
    Promise.resolve([] as any[]),
    Promise.resolve(0),
    Promise.resolve(0),
  ]);

  const departmentStats: any[] = [];

  return {
    total_employees: totalEmployees,
    active_employees: activeEmployees,
    employees: employees.slice(0, 50), // Limit to first 50 for preview
    department_stats: departmentStats,
    generated_at: new Date().toISOString(),
  };
}

async function generatePayrollSummaryReport(parameters: any) {
  const { startDate, endDate, status } = parameters || {};

  const whereClause: any = {};

  if (startDate && endDate) {
    whereClause.created_at = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  if (status) {
    whereClause.status = status;
  }

  const [payrolls, totalAmount, averageAmount] = await Promise.all([
    Promise.resolve([] as any[]),
    Promise.resolve({ _sum: { final_amount: 0 } } as any),
    Promise.resolve({ _avg: { final_amount: 0 } } as any),
  ]);

  return {
    total_payrolls: payrolls.length,
    total_amount: totalAmount._sum.final_amount || 0,
    average_amount: averageAmount._avg.final_amount || 0,
    payrolls: payrolls.slice(0, 50), // Limit to first 50 for preview
    generated_at: new Date().toISOString(),
  };
}

async function generateEquipmentUtilizationReport(parameters: any) {
  const { startDate, endDate, equipmentType } = parameters || {};

  const whereClause: any = {
    is_active: true,
  };

  if (equipmentType) {
    whereClause.type = equipmentType;
  }

  const equipment: any[] = [];

  const utilizationStats = equipment.map(eq => ({
    id: eq.id,
    name: eq.name,
    category_id: eq.category_id ?? null,
    total_rentals: eq.equipment_rental_history.length,
    total_hours: eq.equipment_rental_history.reduce((sum, rental) => {
      if (rental.end_date && rental.start_date) {
        const hours = (rental.end_date.getTime() - rental.start_date.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0),
  }));

  return {
    total_equipment: equipment.length,
    utilization_stats: utilizationStats,
    generated_at: new Date().toISOString(),
  };
}

async function generateProjectProgressReport(parameters: any) {
  const { startDate, endDate, status } = parameters || {};

  const whereClause: any = {};

  if (startDate && endDate) {
    whereClause.created_at = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  if (status) {
    whereClause.status = status;
  }

  const projects: any[] = [];

  const projectStats = projects.map(project => ({
    id: project.id,
    name: project.name,
    status: project.status,
    total_resources: project.project_resources.length,
    total_cost: project.project_resources.reduce((sum, resource) => {
      return sum + Number(resource.total_cost || 0);
    }, 0),
  }));

  return {
    total_projects: projects.length,
    project_stats: projectStats,
    generated_at: new Date().toISOString(),
  };
}

async function generateRentalSummaryReport(parameters: any) {
  const { startDate, endDate, status } = parameters || {};

  const whereClause: any = {};

  if (startDate && endDate) {
    whereClause.created_at = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  if (status) {
    whereClause.status = status;
  }

  const [rentals, totalRevenue, averageRevenue] = await Promise.all([
    Promise.resolve([] as any[]),
    Promise.resolve({ _sum: { total_amount: 0 } } as any),
    Promise.resolve({ _avg: { total_amount: 0 } } as any),
  ]);

  return {
    total_rentals: rentals.length,
    total_revenue: Number(totalRevenue._sum.total_amount || 0),
    average_revenue: Number(averageRevenue._avg.total_amount || 0),
    rentals: rentals.slice(0, 50), // Limit to first 50 for preview
    generated_at: new Date().toISOString(),
  };
}

async function generateTimesheetSummaryReport(parameters: any) {
  const { startDate, endDate, employeeId } = parameters || {};

  const whereClause: any = {};

  if (startDate && endDate) {
    whereClause.created_at = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  if (employeeId) {
    whereClause.employee_id = parseInt(employeeId);
  }

  const [timesheets, totalHours, averageHours] = await Promise.all([
    Promise.resolve([] as any[]),
    Promise.resolve({ _sum: { hours_worked: 0 } } as any),
    Promise.resolve({ _avg: { hours_worked: 0 } } as any),
  ]);

  return {
    total_timesheets: timesheets.length,
    total_hours: Number(totalHours._sum.hours_worked || 0),
    average_hours: Number(averageHours._avg.hours_worked || 0),
    timesheets: timesheets.slice(0, 50), // Limit to first 50 for preview
    generated_at: new Date().toISOString(),
  };
}
