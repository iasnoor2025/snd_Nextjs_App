
import { db } from '@/lib/drizzle';
import { getRBACPermissions } from '@/lib/rbac/rbac-utils';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { 
  employees, 
  projects, 
  equipment, 
  customers, 
  rentals, 
  timesheets, 
  payrolls, 
  advancePayments,
  employeeLeaves,
  equipmentMaintenance,
  safetyIncidents,
  departments,
  designations,
  locations,
  companies,
  trainings
} from '@/lib/drizzle/schema';
import { sql, count, sum, avg, max, min, desc, asc, eq, and, gte, lte, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('read', 'Report')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('report_type') || searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const departmentId = searchParams.get('departmentId');
    const projectId = searchParams.get('projectId');

    let reportData: any = {};

    switch (reportType) {
      case 'overview':
        reportData = await generateOverviewReport(startDate, endDate);
        break;
      case 'employee_analytics':
        reportData = await generateEmployeeAnalyticsReport(startDate, endDate, departmentId);
        break;
      case 'project_analytics':
        reportData = await generateProjectAnalyticsReport(startDate, endDate, projectId);
        break;
      case 'equipment_analytics':
        reportData = await generateEquipmentAnalyticsReport(startDate, endDate);
        break;
      case 'financial_analytics':
        reportData = await generateFinancialAnalyticsReport(startDate, endDate);
        break;
      case 'operational_analytics':
        reportData = await generateOperationalAnalyticsReport(startDate, endDate);
        break;
      case 'hr_analytics':
        reportData = await generateHRAnalyticsReport(startDate, endDate, departmentId);
        break;
      case 'safety_analytics':
        reportData = await generateSafetyAnalyticsReport(startDate, endDate);
        break;
      case 'performance_analytics':
        reportData = await generatePerformanceAnalyticsReport(startDate, endDate);
        break;
      case 'rental_analytics':
        reportData = await generateRentalAnalyticsReport(startDate, endDate);
        break;
      case 'customer_analytics':
        reportData = await generateCustomerAnalyticsReport(startDate, endDate);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      generated_at: new Date().toISOString(),
      report_type: reportType,
      parameters: { startDate, endDate, departmentId, projectId }
    });
  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false 
    }, { status: 500 });
  }
}

async function generateOverviewReport(startDate?: string | null, endDate?: string | null) {
  try {
    const [
      employeeStats,
      projectStats,
      equipmentStats,
      customerStats,
      rentalStats,
      financialStats,
      operationalStats
    ] = await Promise.all([
      // Employee Statistics
      db.select({
        total: count(),
        active: count(sql`CASE WHEN ${employees.status} = 'active' THEN 1 END`),
        inactive: count(sql`CASE WHEN ${employees.status} != 'active' THEN 1 END`)
      }).from(employees),

      // Project Statistics
      db.select({
        total: count(),
        active: count(sql`CASE WHEN ${projects.status} = 'active' THEN 1 END`),
        completed: count(sql`CASE WHEN ${projects.status} = 'completed' THEN 1 END`),
        total_budget: sum(sql`COALESCE(${projects.budget}, 0)`)
      }).from(projects),

      // Equipment Statistics
      db.select({
        total: count(),
        active: count(sql`CASE WHEN ${equipment.status} = 'active' THEN 1 END`),
        total_value: sum(sql`COALESCE(${equipment.purchasePrice}, 0)`)
      }).from(equipment),

      // Customer Statistics
      db.select({
        total: count(),
        active: count(sql`CASE WHEN ${customers.isActive} = true THEN 1 END`),
        total_value: sum(sql`COALESCE(${customers.totalValue}, 0)`)
      }).from(customers),

      // Rental Statistics
      db.select({
        total: count(),
        active: count(sql`CASE WHEN ${rentals.status} = 'active' THEN 1 END`),
        total_revenue: sum(sql`COALESCE(${rentals.totalAmount}, 0)`)
      }).from(rentals),

      // Financial Statistics
      db.select({
        total_payroll: sum(sql`COALESCE(${payrolls.finalAmount}, 0)`),
        avg_salary: avg(sql`COALESCE(${payrolls.finalAmount}, 0)`)
      }).from(payrolls),

      // Operational Statistics
      db.select({
        total_timesheets: count(),
        total_hours: sum(sql`COALESCE(${timesheets.hoursWorked}, 0)`),
        avg_hours_per_day: avg(sql`COALESCE(${timesheets.hoursWorked}, 0)`)
      }).from(timesheets)
    ]);

    return {
      overview: {
        employees: employeeStats[0] || { total: 0, active: 0, inactive: 0 },
        projects: projectStats[0] || { total: 0, active: 0, completed: 0, total_budget: 0 },
        equipment: equipmentStats[0] || { total: 0, active: 0, total_value: 0 },
        customers: customerStats[0] || { total: 0, active: 0, total_value: 0 },
        rentals: rentalStats[0] || { total: 0, active: 0, total_revenue: 0 },
        financial: financialStats[0] || { total_payroll: 0, avg_salary: 0 },
        operational: operationalStats[0] || { total_timesheets: 0, total_hours: 0, avg_hours_per_day: 0 }
      },
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateOverviewReport:', error);
    return {
      overview: {
        employees: { total: 0, active: 0, inactive: 0 },
        projects: { total: 0, active: 0, completed: 0, total_budget: 0 },
        equipment: { total: 0, active: 0, total_value: 0 },
        customers: { total: 0, active: 0, total_value: 0 },
        rentals: { total: 0, active: 0, total_revenue: 0 },
        financial: { total_payroll: 0, avg_salary: 0 },
        operational: { total_timesheets: 0, total_hours: 0, avg_hours_per_day: 0 }
      },
      generated_at: new Date().toISOString(),
      error: 'Failed to generate overview report'
    };
  }
}

async function generateEmployeeAnalyticsReport(startDate?: string | null, endDate?: string | null, departmentId?: string | null) {
  try {
    const [
      performanceMetrics,
      leaveAnalysis
    ] = await Promise.all([
      // Performance Metrics
      db.select({
        total_employees: count(),
        active_employees: count(sql`CASE WHEN ${employees.status} = 'active' THEN 1 END`),
        avg_salary: avg(sql`COALESCE(${employees.basicSalary}, 0)`)
      })
      .from(employees),

      // Leave Analysis
      db.select({
        leave_type: employeeLeaves.leaveType,
        total_days: sum(sql`COALESCE(${employeeLeaves.days}, 0)`),
        count: count()
      })
      .from(employeeLeaves)
      .groupBy(employeeLeaves.leaveType)
    ]);
    return {
      performance_metrics: performanceMetrics[0] || { total_employees: 0, active_employees: 0, avg_salary: 0 },
      leave_analysis: leaveAnalysis || [],
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateEmployeeAnalyticsReport:', error);
    return {
      performance_metrics: { total_employees: 0, active_employees: 0, avg_salary: 0 },
      leave_analysis: [],
      generated_at: new Date().toISOString(),
      error: 'Failed to generate employee analytics report'
    };
  }
}

async function generateProjectAnalyticsReport(startDate?: string | null, endDate?: string | null, projectId?: string | null) {
  try {
    const projectStats = await db.select({
      total_projects: count(),
      active_projects: count(sql`CASE WHEN ${projects.status} = 'active' THEN 1 END`),
      completed_projects: count(sql`CASE WHEN ${projects.status} = 'completed' THEN 1 END`),
      total_budget: sum(sql`COALESCE(${projects.budget}, 0)`),
      avg_budget: avg(sql`COALESCE(${projects.budget}, 0)`)
    }).from(projects);

    return {
      project_stats: projectStats[0] || { total_projects: 0, active_projects: 0, completed_projects: 0, total_budget: 0, avg_budget: 0 },
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateProjectAnalyticsReport:', error);
    return {
      project_stats: { total_projects: 0, active_projects: 0, completed_projects: 0, total_budget: 0, avg_budget: 0 },
      generated_at: new Date().toISOString(),
      error: 'Failed to generate project analytics report'
    };
  }
}

async function generateEquipmentAnalyticsReport(startDate?: string | null, endDate?: string | null) {
  try {
    const equipmentStats = await db.select({
      total_equipment: count(),
      active_equipment: count(sql`CASE WHEN ${equipment.status} = 'active' THEN 1 END`),
      total_value: sum(sql`COALESCE(${equipment.purchasePrice}, 0)`),
      avg_value: avg(sql`COALESCE(${equipment.purchasePrice}, 0)`)
    }).from(equipment);

    return {
      equipment_stats: equipmentStats[0] || { total_equipment: 0, active_equipment: 0, total_value: 0, avg_value: 0 },
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateEquipmentAnalyticsReport:', error);
    return {
      equipment_stats: { total_equipment: 0, active_equipment: 0, total_value: 0, avg_value: 0 },
      generated_at: new Date().toISOString(),
      error: 'Failed to generate equipment analytics report'
    };
  }
}

async function generateFinancialAnalyticsReport(startDate?: string | null, endDate?: string | null) {
  try {
    const [
      payrollStats,
      advanceStats,
      rentalStats
    ] = await Promise.all([
      // Payroll Statistics
      db.select({
        total_payroll: sum(sql`COALESCE(${payrolls.finalAmount}, 0)`),
        avg_salary: avg(sql`COALESCE(${payrolls.finalAmount}, 0)`),
        employee_count: count()
      }).from(payrolls),

      // Advance Payment Statistics
      db.select({
        total_advances: sum(sql`COALESCE(${advancePayments.amount}, 0)`),
        avg_advance: avg(sql`COALESCE(${advancePayments.amount}, 0)`),
        advance_count: count()
      }).from(advancePayments),

      // Rental Revenue Statistics
      db.select({
        total_revenue: sum(sql`COALESCE(${rentals.totalAmount}, 0)`),
        avg_revenue: avg(sql`COALESCE(${rentals.totalAmount}, 0)`),
        rental_count: count()
      }).from(rentals)
    ]);

    return {
      payroll_stats: payrollStats[0] || { total_payroll: 0, avg_salary: 0, employee_count: 0 },
      advance_stats: advanceStats[0] || { total_advances: 0, avg_advance: 0, advance_count: 0 },
      rental_stats: rentalStats[0] || { total_revenue: 0, avg_revenue: 0, rental_count: 0 },
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateFinancialAnalyticsReport:', error);
    return {
      payroll_stats: { total_payroll: 0, avg_salary: 0, employee_count: 0 },
      advance_stats: { total_advances: 0, avg_advance: 0, advance_count: 0 },
      rental_stats: { total_revenue: 0, avg_revenue: 0, rental_count: 0 },
      generated_at: new Date().toISOString(),
      error: 'Failed to generate financial analytics report'
    };
  }
}

async function generateOperationalAnalyticsReport(startDate?: string | null, endDate?: string | null) {
  try {
    const [
      timesheetStats,
      projectStats,
      equipmentStats
    ] = await Promise.all([
      // Timesheet Statistics
      db.select({
        total_timesheets: count(),
        total_hours: sum(sql`COALESCE(${timesheets.hoursWorked}, 0)`),
        avg_hours_per_day: avg(sql`COALESCE(${timesheets.hoursWorked}, 0)`)
      }).from(timesheets),

      // Project Statistics
      db.select({
        total_projects: count(),
        active_projects: count(sql`CASE WHEN ${projects.status} = 'active' THEN 1 END`),
        completed_projects: count(sql`CASE WHEN ${projects.status} = 'completed' THEN 1 END`)
      }).from(projects),

      // Equipment Statistics
      db.select({
        total_equipment: count(),
        active_equipment: count(sql`CASE WHEN ${equipment.status} = 'active' THEN 1 END`)
      }).from(equipment)
    ]);

    return {
      timesheet_stats: timesheetStats[0] || { total_timesheets: 0, total_hours: 0, avg_hours_per_day: 0 },
      project_stats: projectStats[0] || { total_projects: 0, active_projects: 0, completed_projects: 0 },
      equipment_stats: equipmentStats[0] || { total_equipment: 0, active_equipment: 0 },
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateOperationalAnalyticsReport:', error);
    return {
      timesheet_stats: { total_timesheets: 0, total_hours: 0, avg_hours_per_day: 0 },
      project_stats: { total_projects: 0, active_projects: 0, completed_projects: 0 },
      equipment_stats: { total_equipment: 0, active_equipment: 0 },
      generated_at: new Date().toISOString(),
      error: 'Failed to generate operational analytics report'
    };
  }
}

async function generateHRAnalyticsReport(startDate?: string | null, endDate?: string | null, departmentId?: string | null) {
  try {
    const [
      employeeStats,
      leaveStats,
      trainingStats
    ] = await Promise.all([
      // Employee Statistics
      db.select({
        total_employees: count(),
        active_employees: count(sql`CASE WHEN ${employees.status} = 'active' THEN 1 END`),
        avg_salary: avg(sql`COALESCE(${employees.basicSalary}, 0)`)
      }).from(employees),

      // Leave Statistics
      db.select({
        total_leaves: count(),
        total_days: sum(sql`COALESCE(${employeeLeaves.days}, 0)`),
        avg_days: avg(sql`COALESCE(${employeeLeaves.days}, 0)`)
      }).from(employeeLeaves),

      // Training Statistics
      db.select({
        total_trainings: count(),
        total_cost: sum(sql`COALESCE(${trainings.cost}, 0)`),
        avg_cost: avg(sql`COALESCE(${trainings.cost}, 0)`)
      }).from(trainings)
    ]);

    return {
      employee_stats: employeeStats[0] || { total_employees: 0, active_employees: 0, avg_salary: 0 },
      leave_stats: leaveStats[0] || { total_leaves: 0, total_days: 0, avg_days: 0 },
      training_stats: trainingStats[0] || { total_trainings: 0, total_cost: 0, avg_cost: 0 },
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateHRAnalyticsReport:', error);
    return {
      employee_stats: { total_employees: 0, active_employees: 0, avg_salary: 0 },
      leave_stats: { total_leaves: 0, total_days: 0, avg_days: 0 },
      training_stats: { total_trainings: 0, total_cost: 0, avg_cost: 0 },
      generated_at: new Date().toISOString(),
      error: 'Failed to generate HR analytics report'
    };
  }
}

async function generateSafetyAnalyticsReport(startDate?: string | null, endDate?: string | null) {
  try {
    const incidentStats = await db.select({
      total_incidents: count(),
      resolved_incidents: count(sql`CASE WHEN ${safetyIncidents.status} = 'resolved' THEN 1 END`),
      pending_incidents: count(sql`CASE WHEN ${safetyIncidents.status} = 'pending' THEN 1 END`)
    }).from(safetyIncidents);

    return {
      incident_stats: incidentStats[0] || { total_incidents: 0, resolved_incidents: 0, pending_incidents: 0 },
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateSafetyAnalyticsReport:', error);
    return {
      incident_stats: { total_incidents: 0, resolved_incidents: 0, pending_incidents: 0 },
      generated_at: new Date().toISOString(),
      error: 'Failed to generate safety analytics report'
    };
  }
}

async function generatePerformanceAnalyticsReport(startDate?: string | null, endDate?: string | null) {
  try {
    const [
      projectStats,
      employeeStats,
      equipmentStats
    ] = await Promise.all([
      // Project Performance
      db.select({
        total_projects: count(),
        active_projects: count(sql`CASE WHEN ${projects.status} = 'active' THEN 1 END`),
        completed_projects: count(sql`CASE WHEN ${projects.status} = 'completed' THEN 1 END`)
      }).from(projects),

      // Employee Performance
      db.select({
        total_employees: count(),
        active_employees: count(sql`CASE WHEN ${employees.status} = 'active' THEN 1 END`),
        avg_salary: avg(sql`COALESCE(${employees.basicSalary}, 0)`)
      }).from(employees),

      // Equipment Performance
      db.select({
        total_equipment: count(),
        active_equipment: count(sql`CASE WHEN ${equipment.status} = 'active' THEN 1 END`)
      }).from(equipment)
    ]);

    return {
      project_performance: projectStats[0] || { total_projects: 0, active_projects: 0, completed_projects: 0 },
      employee_performance: employeeStats[0] || { total_employees: 0, active_employees: 0, avg_salary: 0 },
      equipment_performance: equipmentStats[0] || { total_equipment: 0, active_equipment: 0 },
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generatePerformanceAnalyticsReport:', error);
    return {
      project_performance: { total_projects: 0, active_projects: 0, completed_projects: 0 },
      employee_performance: { total_employees: 0, active_employees: 0, avg_salary: 0 },
      equipment_performance: { total_equipment: 0, active_equipment: 0 },
      generated_at: new Date().toISOString(),
      error: 'Failed to generate performance analytics report'
    };
  }
}

async function generateRentalAnalyticsReport(startDate?: string | null, endDate?: string | null) {
  try {
    const [
      rentalStats,
      companyRentals,
      equipmentRentals,
      operatorAssignments
    ] = await Promise.all([
      // Overall Rental Statistics
      db.select({
        total_rentals: count(),
        active_rentals: count(sql`CASE WHEN ${rentals.status} = 'active' THEN 1 END`),
        completed_rentals: count(sql`CASE WHEN ${rentals.status} = 'completed' THEN 1 END`),
        total_revenue: sum(sql`COALESCE(${rentals.totalAmount}, 0)`),
        avg_rental_amount: avg(sql`COALESCE(${rentals.totalAmount}, 0)`)
      }).from(rentals),

      // Rentals by Company
      db.select({
        customer_id: rentals.customerId,
        customer_name: customers.name,
        total_rentals: count(),
        total_amount: sum(sql`COALESCE(${rentals.totalAmount}, 0)`),
        active_rentals: count(sql`CASE WHEN ${rentals.status} = 'active' THEN 1 END`)
      })
      .from(rentals)
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .groupBy(rentals.customerId, customers.name),

      // Equipment Rentals with Details
      db.select({
        rental_id: rentals.id,
        equipment_id: rentals.equipmentId,
        equipment_name: equipment.name,
        equipment_type: equipment.type,
        equipment_model: equipment.model,
        customer_name: customers.name,
        rental_status: rentals.status,
        rental_amount: rentals.totalAmount,
        start_date: rentals.startDate,
        end_date: rentals.endDate
      })
      .from(rentals)
      .leftJoin(equipment, eq(rentals.equipmentId, equipment.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id)),

      // Operator Assignments
      db.select({
        rental_id: rentals.id,
        operator_id: rentals.operatorId,
        operator_name: sql`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
        equipment_name: equipment.name,
        customer_name: customers.name,
        assignment_status: rentals.status
      })
      .from(rentals)
      .leftJoin(employees, eq(rentals.operatorId, employees.id))
      .leftJoin(equipment, eq(rentals.equipmentId, equipment.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
    ]);
    return {
      rental_stats: rentalStats[0] || { total_rentals: 0, active_rentals: 0, completed_rentals: 0, total_revenue: 0, avg_rental_amount: 0 },
      company_rentals: companyRentals || [],
      equipment_rentals: equipmentRentals || [],
      operator_assignments: operatorAssignments || [],
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateRentalAnalyticsReport:', error);
    return {
      rental_stats: { total_rentals: 0, active_rentals: 0, completed_rentals: 0, total_revenue: 0, avg_rental_amount: 0 },
      company_rentals: [],
      equipment_rentals: [],
      operator_assignments: [],
      generated_at: new Date().toISOString(),
      error: 'Failed to generate rental analytics report'
    };
  }
}

async function generateCustomerAnalyticsReport(startDate?: string | null, endDate?: string | null) {
  try {
    // Simple and fast queries
    const customerStats = await db.select({
      total_customers: count(),
      active_customers: count(sql`CASE WHEN ${customers.status} = 'active' THEN 1 END`)
    }).from(customers);

    // Get customers with rentals count
    const customersWithRentalsCount = await db.select({
      count: count(sql`DISTINCT ${customers.id}`)
    }).from(customers)
    .innerJoin(rentals, eq(customers.id, rentals.customerId));

    // Get customers with projects count
    const customersWithProjectsCount = await db.select({
      count: count(sql`DISTINCT ${customers.id}`)
    }).from(customers)
    .innerJoin(projects, eq(customers.id, projects.customerId));
    return {
      customer_stats: {
        total_customers: customerStats[0]?.total_customers || 0,
        active_customers: customerStats[0]?.active_customers || 0,
        customers_with_rentals: customersWithRentalsCount[0]?.count || 0,
        customers_with_projects: customersWithProjectsCount[0]?.count || 0
      },
      customer_details: [],
      customer_rentals: [],
      customer_projects: [],
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateCustomerAnalyticsReport:', error);
    return {
      customer_stats: { total_customers: 0, active_customers: 0, customers_with_rentals: 0, customers_with_projects: 0 },
      customer_details: [],
      customer_rentals: [],
      customer_projects: [],
      generated_at: new Date().toISOString(),
      error: 'Failed to generate customer analytics report'
    };
  }
}