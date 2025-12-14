
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
  trainings,
  rentalEquipmentTimesheets,
  rentalItems,
  rentalTimesheetReceived
} from '@/lib/drizzle/schema';
import { alias } from 'drizzle-orm/pg-core';
import { sql, count, sum, avg, max, min, desc, asc, eq, and, gte, lte, or, inArray, notInArray } from 'drizzle-orm';

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
      case 'rental_timesheet':
        const month = searchParams.get('month');
        const customerId = searchParams.get('customerId');
        const hasTimesheet = searchParams.get('hasTimesheet');
        reportData = await generateRentalTimesheetReport(startDate, endDate, month, customerId, hasTimesheet);
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

export async function generateRentalTimesheetReport(startDate?: string | null, endDate?: string | null, month?: string | null, customerId?: string | null, hasTimesheet?: string | null) {
  try {
    // Build date filter conditions
    const dateConditions = [];
    
    // If month is provided, use it instead of startDate/endDate
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDateStr = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const endDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      dateConditions.push(gte(rentalEquipmentTimesheets.date, startDateStr));
      dateConditions.push(lte(rentalEquipmentTimesheets.date, endDateStr));
    } else if (startDate || endDate) {
      // Use startDate/endDate if month is not provided and dates are provided
      if (startDate) {
        dateConditions.push(gte(rentalEquipmentTimesheets.date, startDate));
      }
      if (endDate) {
        dateConditions.push(lte(rentalEquipmentTimesheets.date, endDate));
      }
    }
    // If no month and no dates provided, show all data (dateFilter will be undefined)
    
    const dateFilter = dateConditions.length > 0 ? and(...dateConditions) : undefined;
    
    // Handle hasTimesheet filter - this requires a subquery approach
    // If hasTimesheet is 'yes', we only want rentals that have timesheet entries
    // If hasTimesheet is 'no', we only want rentals that don't have timesheet entries
    let rentalIdFilter: any = undefined;
    if (hasTimesheet === 'yes' || hasTimesheet === 'no') {
      // Get rental IDs that have timesheet entries (with or without date filter)
      const rentalsWithTimesheets = await db
        .selectDistinct({ rentalId: rentalEquipmentTimesheets.rentalId })
        .from(rentalEquipmentTimesheets)
        .where(dateFilter || undefined);
      const rentalIds = rentalsWithTimesheets.map(r => r.rentalId).filter((id): id is number => id !== null);
      
      if (hasTimesheet === 'yes') {
        if (rentalIds.length > 0) {
          rentalIdFilter = inArray(rentals.id, rentalIds);
        } else {
          // No rentals have timesheets, return empty results
          rentalIdFilter = sql`1 = 0`; // Always false condition
        }
      } else if (hasTimesheet === 'no') {
        if (rentalIds.length > 0) {
          rentalIdFilter = notInArray(rentals.id, rentalIds);
        }
        // If no rentals have timesheets and we want "no timesheet", show all rentals (no filter needed)
      }
    }
    
    // Build customer filter conditions for joins
    const customerConditions = [];
    if (dateFilter) {
      customerConditions.push(dateFilter);
    }
    if (customerId) {
      customerConditions.push(eq(rentals.customerId, parseInt(customerId)));
    }
    if (rentalIdFilter) {
      customerConditions.push(rentalIdFilter);
    }
    const whereFilter = customerConditions.length > 0 ? and(...customerConditions) : dateFilter;

    // Get detailed timesheet entries with related data
    const timesheetDetails = await db
      .select({
        id: rentalEquipmentTimesheets.id,
        date: rentalEquipmentTimesheets.date,
        regular_hours: rentalEquipmentTimesheets.regularHours,
        overtime_hours: rentalEquipmentTimesheets.overtimeHours,
        notes: rentalEquipmentTimesheets.notes,
        rental_id: rentals.id,
        rental_number: rentals.rentalNumber,
        customer_name: customers.name,
        equipment_name: rentalItems.equipmentName,
        equipment_id: rentalItems.equipmentId,
      })
      .from(rentalEquipmentTimesheets)
      .leftJoin(rentals, eq(rentalEquipmentTimesheets.rentalId, rentals.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(rentalItems, eq(rentalEquipmentTimesheets.rentalItemId, rentalItems.id))
      .where(whereFilter)
      .orderBy(desc(rentalEquipmentTimesheets.date));

    // Get summary statistics
    const timesheetStats = await db
      .select({
        total_entries: count(),
        total_regular_hours: sum(sql`COALESCE(${rentalEquipmentTimesheets.regularHours}, 0)`),
        total_overtime_hours: sum(sql`COALESCE(${rentalEquipmentTimesheets.overtimeHours}, 0)`),
        total_hours: sum(sql`COALESCE(${rentalEquipmentTimesheets.regularHours}, 0) + COALESCE(${rentalEquipmentTimesheets.overtimeHours}, 0)`),
      })
      .from(rentalEquipmentTimesheets)
      .leftJoin(rentals, eq(rentalEquipmentTimesheets.rentalId, rentals.id))
      .where(whereFilter);

    // Get active rentals count
    const activeRentalsConditions = [eq(rentals.status, 'active')];
    if (dateFilter) {
      activeRentalsConditions.push(dateFilter);
    }
    if (customerId) {
      activeRentalsConditions.push(eq(rentals.customerId, parseInt(customerId)));
    }
    if (rentalIdFilter) {
      activeRentalsConditions.push(rentalIdFilter);
    }
    const activeRentalsWhere = and(...activeRentalsConditions);
    
    const activeRentalsCount = await db
      .select({
        count: count(sql`DISTINCT ${rentals.id}`)
      })
      .from(rentals)
      .innerJoin(rentalEquipmentTimesheets, eq(rentals.id, rentalEquipmentTimesheets.rentalId))
      .where(activeRentalsWhere);

    // Get unique equipment items count
    const equipmentItemsCount = await db
      .select({
        count: count(sql`DISTINCT ${rentalItems.id}`)
      })
      .from(rentalItems)
      .innerJoin(rentalEquipmentTimesheets, eq(rentalItems.id, rentalEquipmentTimesheets.rentalItemId))
      .leftJoin(rentals, eq(rentalEquipmentTimesheets.rentalId, rentals.id))
      .where(whereFilter);

    // Get summary by rental
    const rentalSummary = await db
      .select({
        rental_id: rentals.id,
        rental_number: rentals.rentalNumber,
        customer_name: customers.name,
        start_date: rentals.startDate,
        status: rentals.status,
        regular_hours: sum(sql`COALESCE(${rentalEquipmentTimesheets.regularHours}, 0)`),
        overtime_hours: sum(sql`COALESCE(${rentalEquipmentTimesheets.overtimeHours}, 0)`),
        total_hours: sum(sql`COALESCE(${rentalEquipmentTimesheets.regularHours}, 0) + COALESCE(${rentalEquipmentTimesheets.overtimeHours}, 0)`),
        equipment_count: count(sql`DISTINCT ${rentalItems.id}`),
      })
      .from(rentalEquipmentTimesheets)
      .leftJoin(rentals, eq(rentalEquipmentTimesheets.rentalId, rentals.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(rentalItems, eq(rentalEquipmentTimesheets.rentalItemId, rentalItems.id))
      .where(whereFilter)
      .groupBy(rentals.id, rentals.rentalNumber, customers.name, rentals.startDate, rentals.status)
      .orderBy(desc(rentals.startDate));

    // Get summary by rental item
    const rentalItemSummary = await db
      .select({
        rental_id: rentals.id,
        rental_number: rentals.rentalNumber,
        customer_name: customers.name,
        rental_item_id: rentalItems.id,
        equipment_name: rentalItems.equipmentName,
        equipment_id: rentalItems.equipmentId,
        start_date: rentalItems.startDate,
        completed_date: rentalItems.completedDate,
        status: rentalItems.status,
        regular_hours: sum(sql`COALESCE(${rentalEquipmentTimesheets.regularHours}, 0)`),
        overtime_hours: sum(sql`COALESCE(${rentalEquipmentTimesheets.overtimeHours}, 0)`),
        total_hours: sum(sql`COALESCE(${rentalEquipmentTimesheets.regularHours}, 0) + COALESCE(${rentalEquipmentTimesheets.overtimeHours}, 0)`),
        timesheet_entries: count(rentalEquipmentTimesheets.id),
        first_date: min(rentalEquipmentTimesheets.date),
        last_date: max(rentalEquipmentTimesheets.date),
      })
      .from(rentalEquipmentTimesheets)
      .leftJoin(rentals, eq(rentalEquipmentTimesheets.rentalId, rentals.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(rentalItems, eq(rentalEquipmentTimesheets.rentalItemId, rentalItems.id))
      .where(whereFilter)
      .groupBy(
        rentals.id,
        rentals.rentalNumber,
        customers.name,
        rentalItems.id,
        rentalItems.equipmentName,
        rentalItems.equipmentId,
        rentalItems.startDate,
        rentalItems.completedDate,
        rentalItems.status
      )
      .orderBy(desc(rentals.startDate), rentalItems.equipmentName);

    // Get monthly items data - group by month with all item details
    // Create aliases for operator and supervisor employees
    const operatorEmp = alias(employees, 'operator_emp');
    const supervisorEmp = alias(employees, 'supervisor_emp');

    let monthlyItemsData: any[] = [];

    // If hasTimesheet is 'no', we need to query rental items directly (not from timesheets)
    // because we want items that don't have timesheet entries
    if (hasTimesheet === 'no') {
      // Build conditions for rental items without timesheets
      const itemConditions = [];
      if (customerId) {
        itemConditions.push(eq(rentals.customerId, parseInt(customerId)));
      }
      if (rentalIdFilter) {
        itemConditions.push(rentalIdFilter);
      }
      
      // If month filter is provided, filter items that were active during that month
      if (month) {
        const [year, monthNum] = month.split('-').map(Number);
        const filterStartDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
        const lastDay = new Date(year, monthNum, 0).getDate();
        const filterEndDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        
        // Item must be active during the selected month
        // Item is active if: (start_date <= filterEndDate) AND (completed_date IS NULL OR completed_date >= filterStartDate)
        itemConditions.push(
          sql`(COALESCE(${rentalItems.startDate}, '1900-01-01')::date <= ${filterEndDate}::date)`
        );
        itemConditions.push(
          sql`(${rentalItems.completedDate} IS NULL OR ${rentalItems.completedDate}::date >= ${filterStartDate}::date)`
        );
      }
      
      const itemWhereFilter = itemConditions.length > 0 ? and(...itemConditions) : undefined;

      // Get rental items that don't have timesheet entries
      const rentalItemsWithoutTimesheets = await db
        .select({
          rental_id: rentals.id,
          rental_number: rentals.rentalNumber,
          customer_name: customers.name,
          rental_item_id: rentalItems.id,
          equipment_name: rentalItems.equipmentName,
          equipment_id: rentalItems.equipmentId,
          unit_price: rentalItems.unitPrice,
          rate_type: rentalItems.rateType,
          start_date: rentalItems.startDate,
          completed_date: rentalItems.completedDate,
          status: rentalItems.status,
          operator_id: rentalItems.operatorId,
          operator_first_name: operatorEmp.firstName,
          operator_last_name: operatorEmp.lastName,
          operator_file_number: operatorEmp.fileNumber,
          supervisor_id: rentalItems.supervisorId,
          supervisor_first_name: supervisorEmp.firstName,
          supervisor_last_name: supervisorEmp.lastName,
          supervisor_file_number: supervisorEmp.fileNumber,
        })
        .from(rentalItems)
        .leftJoin(rentals, eq(rentalItems.rentalId, rentals.id))
        .leftJoin(customers, eq(rentals.customerId, customers.id))
        .leftJoin(operatorEmp, eq(rentalItems.operatorId, operatorEmp.id))
        .leftJoin(supervisorEmp, eq(rentalItems.supervisorId, supervisorEmp.id))
        .where(itemWhereFilter);

      // Filter out items that have timesheet entries
      // Apply date filter to timesheet check if month filter is provided
      const timesheetCheckFilter = month ? (() => {
        const [year, monthNum] = month.split('-').map(Number);
        const startDateStr = `${year}-${String(monthNum).padStart(2, '0')}-01`;
        const lastDay = new Date(year, monthNum, 0).getDate();
        const endDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        return and(
          gte(rentalEquipmentTimesheets.date, startDateStr),
          lte(rentalEquipmentTimesheets.date, endDateStr)
        );
      })() : undefined;

      const itemsWithTimesheets = await db
        .selectDistinct({ rentalItemId: rentalEquipmentTimesheets.rentalItemId })
        .from(rentalEquipmentTimesheets)
        .where(timesheetCheckFilter || undefined);
      
      const itemsWithTimesheetsSet = new Set(
        itemsWithTimesheets.map(r => r.rentalItemId).filter((id): id is number => id !== null)
      );

      const filteredItems = rentalItemsWithoutTimesheets.filter(
        (item: any) => !itemsWithTimesheetsSet.has(item.rental_item_id)
      );

      // Get rental start dates for items that don't have start_date
      const rentalIdsForStartDate = filteredItems
        .map((item: any) => item.rental_id)
        .filter((id): id is number => id !== null && id !== undefined);
      
      const rentalStartDateMap = new Map<number, string | null>();
      if (rentalIdsForStartDate.length > 0) {
        const rentalStartDates = await db
          .select({
            id: rentals.id,
            startDate: rentals.startDate,
          })
          .from(rentals)
          .where(inArray(rentals.id, rentalIdsForStartDate));
        
        rentalStartDates.forEach(r => {
          rentalStartDateMap.set(r.id, r.startDate);
        });
      }

      // Group by month based on start_date or rental start_date
      // If month filter is provided, only include items that were active during that month
      const itemsByMonth: Record<string, any[]> = {};
      filteredItems.forEach((item: any) => {
        const dateToUse = item.start_date || rentalStartDateMap.get(item.rental_id);
        if (dateToUse) {
          const date = new Date(dateToUse);
          const itemStartDate = new Date(date);
          const itemEndDate = item.completed_date ? new Date(item.completed_date) : new Date();
          
          // If month filter is provided, check if item was active during that month
          if (month) {
            const [year, monthNum] = month.split('-').map(Number);
            const filterStartDate = new Date(year, monthNum - 1, 1);
            const filterEndDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
            
            // Item must overlap with the selected month
            if (itemEndDate < filterStartDate || itemStartDate > filterEndDate) {
              return; // Skip this item - not active during selected month
            }
            
            // Use the selected month as the month key
            const monthKey = month;
            if (!itemsByMonth[monthKey]) {
              itemsByMonth[monthKey] = [];
            }
            itemsByMonth[monthKey].push({
              ...item,
              month: monthKey,
              regular_hours: 0,
              overtime_hours: 0,
              total_hours: 0,
              timesheet_entries: 0,
            });
          } else {
            // No month filter - group by item's start month
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!itemsByMonth[monthKey]) {
              itemsByMonth[monthKey] = [];
            }
            itemsByMonth[monthKey].push({
              ...item,
              month: monthKey,
              regular_hours: 0,
              overtime_hours: 0,
              total_hours: 0,
              timesheet_entries: 0,
            });
          }
        }
      });

      // Convert to array format
      monthlyItemsData = Object.entries(itemsByMonth).flatMap(([monthKey, items]) =>
        items.map(item => ({ ...item, month: monthKey }))
      );
    } else {
      // Get all rental items with timesheet entries, grouped by month
      monthlyItemsData = await db
        .select({
          month: sql<string>`TO_CHAR(${rentalEquipmentTimesheets.date}, 'YYYY-MM')`,
          rental_id: rentals.id,
          rental_number: rentals.rentalNumber,
          customer_name: customers.name,
          rental_item_id: rentalItems.id,
          equipment_name: rentalItems.equipmentName,
          equipment_id: rentalItems.equipmentId,
          unit_price: rentalItems.unitPrice,
          rate_type: rentalItems.rateType,
          start_date: rentalItems.startDate,
          completed_date: rentalItems.completedDate,
          status: rentalItems.status,
          operator_id: rentalItems.operatorId,
          operator_first_name: operatorEmp.firstName,
          operator_last_name: operatorEmp.lastName,
          operator_file_number: operatorEmp.fileNumber,
          supervisor_id: rentalItems.supervisorId,
          supervisor_first_name: supervisorEmp.firstName,
          supervisor_last_name: supervisorEmp.lastName,
          supervisor_file_number: supervisorEmp.fileNumber,
          regular_hours: sum(sql`COALESCE(${rentalEquipmentTimesheets.regularHours}, 0)`),
          overtime_hours: sum(sql`COALESCE(${rentalEquipmentTimesheets.overtimeHours}, 0)`),
          total_hours: sum(sql`COALESCE(${rentalEquipmentTimesheets.regularHours}, 0) + COALESCE(${rentalEquipmentTimesheets.overtimeHours}, 0)`),
          timesheet_entries: count(rentalEquipmentTimesheets.id),
        })
        .from(rentalEquipmentTimesheets)
        .leftJoin(rentals, eq(rentalEquipmentTimesheets.rentalId, rentals.id))
        .leftJoin(customers, eq(rentals.customerId, customers.id))
        .leftJoin(rentalItems, eq(rentalEquipmentTimesheets.rentalItemId, rentalItems.id))
        .leftJoin(operatorEmp, eq(rentalItems.operatorId, operatorEmp.id))
        .leftJoin(supervisorEmp, eq(rentalItems.supervisorId, supervisorEmp.id))
        .where(whereFilter)
        .groupBy(
          sql`TO_CHAR(${rentalEquipmentTimesheets.date}, 'YYYY-MM')`,
          rentals.id,
          rentals.rentalNumber,
          customers.name,
          rentalItems.id,
          rentalItems.equipmentName,
          rentalItems.equipmentId,
          rentalItems.unitPrice,
          rentalItems.rateType,
          rentalItems.startDate,
          rentalItems.completedDate,
          rentalItems.status,
          rentalItems.operatorId,
          operatorEmp.firstName,
          operatorEmp.lastName,
          operatorEmp.fileNumber,
          rentalItems.supervisorId,
          supervisorEmp.firstName,
          supervisorEmp.lastName,
          supervisorEmp.fileNumber
        )
        .orderBy(
          sql`TO_CHAR(${rentalEquipmentTimesheets.date}, 'YYYY-MM') DESC`,
          rentalItems.equipmentName
        );
    }

    // Get timesheet received status for each month and item
    // Get rental IDs from monthly items data
    const rentalIdsFromMonthly = monthlyItemsData.map((item: any) => item.rental_id).filter((id): id is number => id !== null && id !== undefined);
    const uniqueRentalIds = Array.from(new Set(rentalIdsFromMonthly));
    
    const timesheetReceivedData = uniqueRentalIds.length > 0 ? await db
      .select({
        month: rentalTimesheetReceived.month,
        rental_id: rentalTimesheetReceived.rentalId,
        rental_item_id: rentalTimesheetReceived.rentalItemId,
        received: rentalTimesheetReceived.received,
      })
      .from(rentalTimesheetReceived)
      .where(inArray(rentalTimesheetReceived.rentalId, uniqueRentalIds)) : [];

    // Group monthly items by month
    // If month filter is provided, only include that month
    const monthlyGroups: Record<string, any[]> = {};
    monthlyItemsData.forEach((item: any) => {
      const monthKey = item.month;
      
      // If month filter is provided, only include items from that month
      if (month && monthKey !== month) {
        return; // Skip items not in the selected month
      }
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = [];
      }
      monthlyGroups[monthKey].push(item);
    });

    // Process monthly groups to create summary
    const monthlySummary = Object.keys(monthlyGroups).map((monthKey) => {
      const items = monthlyGroups[monthKey];
      const uniqueItems = Array.from(
        new Map(items.map((item: any) => [item.rental_item_id, item])).values()
      );
      
      const totalItems = uniqueItems.length;
      const activeItems = uniqueItems.filter((item: any) => item.status === 'active').length;
      const totalValue = uniqueItems.reduce((sum: number, item: any) => {
        const unitPrice = parseFloat(item.unit_price?.toString() || '0') || 0;
        const totalHours = parseFloat(item.total_hours?.toString() || '0') || 0;
        const rateType = item.rate_type || 'daily';
        
        // Calculate total based on rate type and hours (convert rate to hourly, then multiply by hours)
        let itemTotal = 0;
        if (totalHours > 0) {
          // Convert rate to hourly equivalent based on rate type
          let hourlyRate = unitPrice;
          if (rateType === 'daily') {
            hourlyRate = unitPrice / 10; // Daily rate / 10 hours
          } else if (rateType === 'weekly') {
            hourlyRate = unitPrice / (7 * 10); // Weekly rate / (7 days * 10 hours)
          } else if (rateType === 'monthly') {
            hourlyRate = unitPrice / (30 * 10); // Monthly rate / (30 days * 10 hours)
          }
          // If rateType is 'hourly', hourlyRate = unitPrice
          itemTotal = hourlyRate * totalHours;
        } else {
          // Fallback to unit price if no hours
          itemTotal = unitPrice;
        }
        
        return sum + itemTotal;
      }, 0);

      // Check if all timesheets received for this month
      // Check if there's a received record for the month (per item or per rental)
      const allReceived = uniqueItems.every((item: any) => {
        const received = timesheetReceivedData.find(
          (tr: any) => tr.month === monthKey && (
            (tr.rental_item_id === item.rental_item_id) || 
            (tr.rental_item_id === null && tr.rental_id === item.rental_id)
          )
        );
        return received?.received === true;
      });

      // Sort items by equipment name
      const sortedItems = [...uniqueItems].sort((a: any, b: any) => {
        const nameA = (a.equipment_name || '').toLowerCase();
        const nameB = (b.equipment_name || '').toLowerCase();
        
        // Try to extract numeric prefix (e.g., "1404-DOZER" -> "1404")
        const extractNumber = (name: string) => {
          const match = name.match(/^(\d+)/);
          return match ? parseInt(match[1]) : null;
        };
        
        const numA = extractNumber(nameA);
        const numB = extractNumber(nameB);
        
        // If both have numeric prefixes, compare numerically
        if (numA !== null && numB !== null) {
          if (numA !== numB) {
            return numA - numB;
          }
          // If numbers are equal, compare full names
          return nameA.localeCompare(nameB);
        }
        
        // If one has numeric prefix and the other doesn't, numeric comes first
        if (numA !== null && numB === null) return -1;
        if (numA === null && numB !== null) return 1;
        
        // Both are non-numeric, sort alphabetically
        return nameA.localeCompare(nameB);
      });
      
      return {
        month: monthKey,
        monthLabel: new Date(`${monthKey}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        items: sortedItems.map((item: any, index: number) => ({
          ...item,
          serial_number: index + 1,
          operator_name: item.operator_first_name && item.operator_last_name
            ? `${item.operator_first_name} ${item.operator_last_name}`
            : null,
          operator_display: item.operator_file_number
            ? `${item.operator_first_name || ''} ${item.operator_last_name || ''} (${item.operator_file_number})`.trim()
            : item.operator_first_name && item.operator_last_name
            ? `${item.operator_first_name} ${item.operator_last_name}`
            : null,
          supervisor_name: item.supervisor_first_name && item.supervisor_last_name
            ? `${item.supervisor_first_name} ${item.supervisor_last_name}`
            : null,
          supervisor_display: (() => {
            // Get the full name parts
            const firstName = item.supervisor_first_name || '';
            const lastName = item.supervisor_last_name || '';
            const fileNumber = item.supervisor_file_number;
            
            // Combine first and last name, then take only first two words
            const fullName = `${firstName} ${lastName}`.trim();
            const nameParts = fullName.split(/\s+/).filter(part => part.length > 0);
            
            // Take only first two words (or just one if only one exists)
            const shortName = nameParts.slice(0, 2).join(' ');
            
            if (fileNumber) {
              return `${shortName} (${fileNumber})`;
            } else if (shortName) {
              return shortName;
            }
            return null;
          })(),
          timesheet_received: (() => {
            const received = timesheetReceivedData.find(
              (tr: any) => tr.month === monthKey && (
                (tr.rental_item_id === item.rental_item_id) || 
                (tr.rental_item_id === null && tr.rental_id === item.rental_id)
              )
            );
            return received?.received === true;
          })(),
        })),
        totalItems,
        activeItems,
        totalValue,
        allTimesheetReceived: allReceived,
      };
    }).sort((a, b) => b.month.localeCompare(a.month)); // Sort by month descending

    return {
      timesheet_stats: {
        total_entries: timesheetStats[0]?.total_entries || 0,
        total_regular_hours: timesheetStats[0]?.total_regular_hours || 0,
        total_overtime_hours: timesheetStats[0]?.total_overtime_hours || 0,
        total_hours: timesheetStats[0]?.total_hours || 0,
        active_rentals: activeRentalsCount[0]?.count || 0,
        equipment_items: equipmentItemsCount[0]?.count || 0,
      },
      timesheet_details: timesheetDetails || [],
      rental_summary: rentalSummary || [],
      rental_item_summary: rentalItemSummary || [],
      monthly_items: monthlySummary || [],
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateRentalTimesheetReport:', error);
    return {
      timesheet_stats: {
        total_entries: 0,
        total_regular_hours: 0,
        total_overtime_hours: 0,
        total_hours: 0,
        active_rentals: 0,
        equipment_items: 0,
      },
      timesheet_details: [],
      rental_summary: [],
      rental_item_summary: [],
      monthly_items: [],
      generated_at: new Date().toISOString(),
      error: 'Failed to generate rental timesheet report'
    };
  }
}