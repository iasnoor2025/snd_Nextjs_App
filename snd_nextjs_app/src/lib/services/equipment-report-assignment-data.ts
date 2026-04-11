import { db } from '@/lib/drizzle';
import {
  employees,
  equipmentRentalHistory,
  equipmentMaintenance,
  projects,
  projectEquipment,
  projectManpower,
  rentals,
  rentalItems,
  customers,
} from '@/lib/drizzle/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { shortCompanyOrPartyName, COMPANY_SHORT_REPORT_MAX } from '@/lib/utils/company-display-name';

export type EquipmentReportAssignmentFields = {
  assignmentSummary: string;
  operatorDisplay: string;
};

function buildAssignmentSummary(assignment: {
  type: string;
  rental?: { rental_number?: string | null; customer_name?: string | null } | null;
  project?: { name?: string | null; customer_name?: string | null } | null;
  notes?: string | null;
} | null): string {
  if (!assignment) return '';
  const t = assignment.type;
  if (t === 'rental' && assignment.rental) {
    const parts: string[] = ['Rental'];
    const label = shortCompanyOrPartyName(assignment.rental.customer_name ?? undefined, COMPANY_SHORT_REPORT_MAX);
    if (label) parts.push(label);
    if (assignment.rental.rental_number) parts.push(`#${assignment.rental.rental_number}`);
    return parts.join(' · ');
  }
  if (t === 'project' && assignment.project) {
    const parts: string[] = ['Project'];
    const customer = shortCompanyOrPartyName(assignment.project.customer_name ?? undefined, COMPANY_SHORT_REPORT_MAX);
    const projName = shortCompanyOrPartyName(assignment.project.name ?? undefined, COMPANY_SHORT_REPORT_MAX);
    if (customer) parts.push(customer);
    else if (projName) parts.push(projName);
    return parts.join(' · ');
  }
  if (t === 'manual') {
    if (!assignment.notes?.trim()) return 'Manual assignment';
    return `Manual · ${shortCompanyOrPartyName(assignment.notes.trim(), COMPANY_SHORT_REPORT_MAX)}`;
  }
  return 'Assigned';
}

function buildOperatorDisplay(
  assignment: {
    employee?: {
      full_name?: string | null;
      file_number?: string | null;
    } | null;
  } | null,
  fallbackEmployeeName: string | null | undefined
): string {
  if (assignment?.employee?.full_name) {
    const fn = assignment.employee.file_number ? `#${assignment.employee.file_number}` : '';
    return [assignment.employee.full_name, fn].filter(Boolean).join(' ');
  }
  if (fallbackEmployeeName && String(fallbackEmployeeName).trim()) {
    return String(fallbackEmployeeName).trim();
  }
  return '—';
}

/**
 * Loads current assignment + operator info for equipment report rows (same sources as /api/equipment list).
 */
export async function getEquipmentReportAssignmentFields(
  equipmentIds: number[]
): Promise<Record<number, EquipmentReportAssignmentFields>> {
  const out: Record<number, EquipmentReportAssignmentFields> = {};
  if (equipmentIds.length === 0) return out;

  const rentalOperator = alias(employees, 'rental_operator');
  const rentalHistoryEmployee = alias(employees, 'rental_history_employee');

  const [rawRentalAssignments, rawProjectAssignments, maintenanceRecords] = await Promise.all([
    db
      .select({
        equipment_id: equipmentRentalHistory.equipmentId,
        assignment_id: equipmentRentalHistory.id,
        employee_id: sql<number | null>`COALESCE(${rentalItems.operatorId}, ${equipmentRentalHistory.employeeId})`.as(
          'employee_id'
        ),
        employee_first_name: sql<string | null>`COALESCE(${rentalOperator.firstName}, ${rentalHistoryEmployee.firstName})`.as(
          'employee_first_name'
        ),
        employee_last_name: sql<string | null>`COALESCE(${rentalOperator.lastName}, ${rentalHistoryEmployee.lastName})`.as(
          'employee_last_name'
        ),
        employee_file_number: sql<string | null>`COALESCE(${rentalOperator.fileNumber}, ${rentalHistoryEmployee.fileNumber})`.as(
          'employee_file_number'
        ),
        project_id: projects.id,
        project_name: projects.name,
        rental_id: rentals.id,
        rental_number: rentals.rentalNumber,
        rental_customer_id: rentals.customerId,
        rental_customer_name: customers.name,
        assignment_type: equipmentRentalHistory.assignmentType,
        assignment_date: equipmentRentalHistory.startDate,
        return_date: equipmentRentalHistory.endDate,
        assignment_status: equipmentRentalHistory.status,
        notes: equipmentRentalHistory.notes,
      })
      .from(equipmentRentalHistory)
      .leftJoin(rentals, eq(equipmentRentalHistory.rentalId, rentals.id))
      .leftJoin(
        rentalItems,
        and(
          eq(rentalItems.rentalId, rentals.id),
          eq(rentalItems.equipmentId, equipmentRentalHistory.equipmentId),
          eq(rentalItems.status, 'active')
        )
      )
      .leftJoin(rentalOperator, eq(rentalItems.operatorId, rentalOperator.id))
      .leftJoin(rentalHistoryEmployee, eq(equipmentRentalHistory.employeeId, rentalHistoryEmployee.id))
      .leftJoin(projects, eq(equipmentRentalHistory.projectId, projects.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .where(and(inArray(equipmentRentalHistory.equipmentId, equipmentIds), eq(equipmentRentalHistory.status, 'active'))),
    db
      .select({
        equipment_id: projectEquipment.equipmentId,
        assignment_id: projectEquipment.id,
        project_id: projectEquipment.projectId,
        project_name: projects.name,
        project_customer_id: projects.customerId,
        project_customer_name: customers.name,
        operator_id: projectManpower.employeeId,
        operator_first_name: employees.firstName,
        operator_last_name: employees.lastName,
        operator_file_number: employees.fileNumber,
        operator_worker_name: projectManpower.workerName,
        assignment_type: sql<string>`'project'`,
        assignment_date: projectEquipment.startDate,
        return_date: projectEquipment.endDate,
        assignment_status: projectEquipment.status,
        notes: projectEquipment.notes,
      })
      .from(projectEquipment)
      .leftJoin(projects, eq(projectEquipment.projectId, projects.id))
      .leftJoin(customers, eq(projects.customerId, customers.id))
      .leftJoin(projectManpower, eq(projectEquipment.operatorId, projectManpower.id))
      .leftJoin(employees, eq(projectManpower.employeeId, employees.id))
      .where(
        and(
          inArray(projectEquipment.equipmentId, equipmentIds),
          sql`${projectEquipment.status} IN ('active', 'pending')`,
        )
      ),
    db
      .select({
        equipment_id: equipmentMaintenance.equipmentId,
        maintenance_title: equipmentMaintenance.title,
        maintenance_status: equipmentMaintenance.status,
      })
      .from(equipmentMaintenance)
      .where(and(inArray(equipmentMaintenance.equipmentId, equipmentIds), eq(equipmentMaintenance.status, 'open'))),
  ]);

  const rawAssignments = [...rawRentalAssignments, ...rawProjectAssignments];

  const currentAssignments = rawAssignments.map((assignment) => {
    const assignmentAny = assignment as Record<string, unknown>;
    let employeeInfo: {
      full_name: string;
      file_number: string | null;
    } | null = null;
    if (assignmentAny.employee_id) {
      employeeInfo = {
        full_name: [assignmentAny.employee_first_name, assignmentAny.employee_last_name].filter(Boolean).join(' '),
        file_number: (assignmentAny.employee_file_number as string) || null,
      };
    } else if (assignmentAny.operator_id) {
      employeeInfo = {
        full_name: [assignmentAny.operator_first_name, assignmentAny.operator_last_name].filter(Boolean).join(' '),
        file_number: (assignmentAny.operator_file_number as string) || null,
      };
    } else if (assignmentAny.operator_worker_name) {
      employeeInfo = {
        full_name: String(assignmentAny.operator_worker_name),
        file_number: null,
      };
    }

    return {
      equipment_id: assignment.equipment_id as number,
      employee: employeeInfo,
      project: assignmentAny.project_id
        ? {
            id: assignmentAny.project_id,
            name: assignmentAny.project_name,
            customer_id: assignmentAny.project_customer_id,
            customer_name: assignmentAny.project_customer_name,
          }
        : null,
      rental: assignmentAny.rental_id
        ? {
            id: assignmentAny.rental_id,
            rental_number: assignmentAny.rental_number,
            customer_id: assignmentAny.rental_customer_id,
            customer_name: assignmentAny.rental_customer_name,
          }
        : null,
      type: assignment.assignment_type as string,
      notes: assignment.notes as string | null,
    };
  });

  const byEquipment: Record<number, typeof currentAssignments> = {};
  for (const a of currentAssignments) {
    if (!byEquipment[a.equipment_id]) byEquipment[a.equipment_id] = [];
    byEquipment[a.equipment_id]!.push(a);
  }

  const maintenanceByEquipment: Record<number, { title: string | null }> = {};
  for (const m of maintenanceRecords) {
    if (!maintenanceByEquipment[m.equipment_id]) {
      maintenanceByEquipment[m.equipment_id] = { title: m.maintenance_title };
    }
  }

  for (const id of equipmentIds) {
    const first = byEquipment[id]?.[0];
    let assignmentSummary = buildAssignmentSummary(first);
    if (!assignmentSummary && maintenanceByEquipment[id]?.title) {
      assignmentSummary = `Maintenance · ${shortCompanyOrPartyName(maintenanceByEquipment[id]!.title, COMPANY_SHORT_REPORT_MAX)}`;
    }
    if (!assignmentSummary) assignmentSummary = '—';

    const operatorDisplay = buildOperatorDisplay(first, null);
    out[id] = {
      assignmentSummary,
      operatorDisplay,
    };
  }

  return out;
}
