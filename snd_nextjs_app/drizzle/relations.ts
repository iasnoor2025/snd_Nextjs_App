import { relations } from "drizzle-orm/relations";
import { users, customers, employees, advancePayments, employeeDocuments, documentVersions, documentApprovals, employeeAssignments, projects, rentals, employeePerformanceReviews, employeeResignations, employeeSalaries, employeeTraining, trainings, employeeLeaves, employeeSkill, skills, equipment, equipmentDocuments, equipmentMaintenance, equipmentMaintenanceItems, equipmentRentalHistory, designations, departments, organizationalUnits, loans, payrolls, payrollRuns, payrollItems, projectManpower, projectFuel, projectMaterials, projectExpenses, projectMilestones, projectEquipment, projectSubcontractors, projectTasks, projectTemplates, rentalItems, reportTemplates, projectRisks, locations, salaryIncrements, scheduledReports, taxDocuments, safetyIncidents, timesheets, timesheetApprovals, weeklyTimesheets, timeOffRequests, timeEntries, advancePaymentHistories, taxDocumentPayrolls, roles, modelHasRoles, permissions, roleHasPermissions, modelHasPermissions } from "./schema";

export const customersRelations = relations(customers, ({one, many}) => ({
	user: one(users, {
		fields: [customers.userId],
		references: [users.id]
	}),
	rentals: many(rentals),
	projects: many(projects),
}));

export const usersRelations = relations(users, ({many}) => ({
	customers: many(customers),
	documentVersions: many(documentVersions),
	documentApprovals: many(documentApprovals),
	employees: many(employees),
	payrolls_approvedBy: many(payrolls, {
		relationName: "payrolls_approvedBy_users_id"
	}),
	payrolls_paidBy: many(payrolls, {
		relationName: "payrolls_paidBy_users_id"
	}),
	projectTemplates: many(projectTemplates),
	reportTemplates: many(reportTemplates),
	rentals_createdBy: many(rentals, {
		relationName: "rentals_createdBy_users_id"
	}),
	rentals_completedBy: many(rentals, {
		relationName: "rentals_completedBy_users_id"
	}),
	rentals_approvedBy: many(rentals, {
		relationName: "rentals_approvedBy_users_id"
	}),
	salaryIncrements_requestedBy: many(salaryIncrements, {
		relationName: "salaryIncrements_requestedBy_users_id"
	}),
	salaryIncrements_approvedBy: many(salaryIncrements, {
		relationName: "salaryIncrements_approvedBy_users_id"
	}),
	salaryIncrements_rejectedBy: many(salaryIncrements, {
		relationName: "salaryIncrements_rejectedBy_users_id"
	}),
	scheduledReports: many(scheduledReports),
	timesheets: many(timesheets),
	modelHasRoles: many(modelHasRoles),
	modelHasPermissions: many(modelHasPermissions),
}));

export const advancePaymentsRelations = relations(advancePayments, ({one, many}) => ({
	employee: one(employees, {
		fields: [advancePayments.employeeId],
		references: [employees.id]
	}),
	advancePaymentHistories: many(advancePaymentHistories),
}));

export const employeesRelations = relations(employees, ({one, many}) => ({
	advancePayments: many(advancePayments),
	employeeAssignments: many(employeeAssignments),
	employeePerformanceReviews: many(employeePerformanceReviews),
	employeeResignations: many(employeeResignations),
	employeeSalaries: many(employeeSalaries),
	employeeTrainings: many(employeeTraining),
	employeeDocuments: many(employeeDocuments),
	employeeLeaves: many(employeeLeaves),
	employeeSkills: many(employeeSkill),
	equipmentMaintenances: many(equipmentMaintenance),
	equipmentRentalHistories: many(equipmentRentalHistory),
	designation: one(designations, {
		fields: [employees.designationId],
		references: [designations.id]
	}),
	department: one(departments, {
		fields: [employees.departmentId],
		references: [departments.id]
	}),
	user: one(users, {
		fields: [employees.userId],
		references: [users.id]
	}),
	organizationalUnit: one(organizationalUnits, {
		fields: [employees.unitId],
		references: [organizationalUnits.id],
		relationName: "employees_unitId_organizationalUnits_id"
	}),
	equipment: many(equipment),
	loans: many(loans),
	organizationalUnits: many(organizationalUnits, {
		relationName: "organizationalUnits_managerId_employees_id"
	}),
	payrolls: many(payrolls),
	projectManpowers_employeeId: many(projectManpower, {
		relationName: "projectManpower_employeeId_employees_id"
	}),
	projectManpowers_assignedBy: many(projectManpower, {
		relationName: "projectManpower_assignedBy_employees_id"
	}),
	projectManpowers_employeeId: many(projectManpower, {
		relationName: "projectManpower_employeeId_employees_id"
	}),
	projectManpowers_assignedBy: many(projectManpower, {
		relationName: "projectManpower_assignedBy_employees_id"
	}),
	projectFuels: many(projectFuel),
	projectMaterials: many(projectMaterials),
	projectExpenses_approvedBy: many(projectExpenses, {
		relationName: "projectExpenses_approvedBy_employees_id"
	}),
	projectExpenses_assignedTo: many(projectExpenses, {
		relationName: "projectExpenses_assignedTo_employees_id"
	}),
	projectEquipments: many(projectEquipment),
	projectSubcontractors: many(projectSubcontractors),
	projectTasks: many(projectTasks),
	projectRisks: many(projectRisks),
	projects_projectManagerId: many(projects, {
		relationName: "projects_projectManagerId_employees_id"
	}),
	projects_projectEngineerId: many(projects, {
		relationName: "projects_projectEngineerId_employees_id"
	}),
	projects_projectForemanId: many(projects, {
		relationName: "projects_projectForemanId_employees_id"
	}),
	projects_supervisorId: many(projects, {
		relationName: "projects_supervisorId_employees_id"
	}),
	salaryIncrements: many(salaryIncrements),
	taxDocuments: many(taxDocuments),
	safetyIncidents_reportedBy: many(safetyIncidents, {
		relationName: "safetyIncidents_reportedBy_employees_id"
	}),
	safetyIncidents_assignedToId: many(safetyIncidents, {
		relationName: "safetyIncidents_assignedToId_employees_id"
	}),
	timesheets: many(timesheets),
	weeklyTimesheets: many(weeklyTimesheets),
	timeOffRequests: many(timeOffRequests),
	timeEntries: many(timeEntries),
	advancePaymentHistories: many(advancePaymentHistories),
}));

export const documentVersionsRelations = relations(documentVersions, ({one}) => ({
	employeeDocument: one(employeeDocuments, {
		fields: [documentVersions.documentId],
		references: [employeeDocuments.id]
	}),
	user: one(users, {
		fields: [documentVersions.uploadedBy],
		references: [users.id]
	}),
}));

export const employeeDocumentsRelations = relations(employeeDocuments, ({one, many}) => ({
	documentVersions: many(documentVersions),
	documentApprovals: many(documentApprovals),
	employee: one(employees, {
		fields: [employeeDocuments.employeeId],
		references: [employees.id]
	}),
}));

export const documentApprovalsRelations = relations(documentApprovals, ({one}) => ({
	employeeDocument: one(employeeDocuments, {
		fields: [documentApprovals.documentId],
		references: [employeeDocuments.id]
	}),
	user: one(users, {
		fields: [documentApprovals.approverId],
		references: [users.id]
	}),
}));

export const employeeAssignmentsRelations = relations(employeeAssignments, ({one, many}) => ({
	employee: one(employees, {
		fields: [employeeAssignments.employeeId],
		references: [employees.id]
	}),
	project: one(projects, {
		fields: [employeeAssignments.projectId],
		references: [projects.id]
	}),
	rental: one(rentals, {
		fields: [employeeAssignments.rentalId],
		references: [rentals.id]
	}),
	timesheets: many(timesheets),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	employeeAssignments: many(employeeAssignments),
	equipmentRentalHistories: many(equipmentRentalHistory),
	projectManpowers_projectId: many(projectManpower, {
		relationName: "projectManpower_projectId_projects_id"
	}),
	projectManpowers_projectId: many(projectManpower, {
		relationName: "projectManpower_projectId_projects_id"
	}),
	projectFuels: many(projectFuel),
	projectMaterials: many(projectMaterials),
	projectExpenses: many(projectExpenses),
	projectMilestones: many(projectMilestones),
	projectEquipments: many(projectEquipment),
	projectSubcontractors: many(projectSubcontractors),
	projectTasks: many(projectTasks),
	projectRisks: many(projectRisks),
	rentals: many(rentals),
	customer: one(customers, {
		fields: [projects.customerId],
		references: [customers.id]
	}),
	location: one(locations, {
		fields: [projects.locationId],
		references: [locations.id]
	}),
	employee_projectManagerId: one(employees, {
		fields: [projects.projectManagerId],
		references: [employees.id],
		relationName: "projects_projectManagerId_employees_id"
	}),
	employee_projectEngineerId: one(employees, {
		fields: [projects.projectEngineerId],
		references: [employees.id],
		relationName: "projects_projectEngineerId_employees_id"
	}),
	employee_projectForemanId: one(employees, {
		fields: [projects.projectForemanId],
		references: [employees.id],
		relationName: "projects_projectForemanId_employees_id"
	}),
	employee_supervisorId: one(employees, {
		fields: [projects.supervisorId],
		references: [employees.id],
		relationName: "projects_supervisorId_employees_id"
	}),
	timesheets: many(timesheets),
}));

export const rentalsRelations = relations(rentals, ({one, many}) => ({
	employeeAssignments: many(employeeAssignments),
	equipmentRentalHistories: many(equipmentRentalHistory),
	rentalItems: many(rentalItems),
	customer: one(customers, {
		fields: [rentals.customerId],
		references: [customers.id]
	}),
	project: one(projects, {
		fields: [rentals.projectId],
		references: [projects.id]
	}),
	user_createdBy: one(users, {
		fields: [rentals.createdBy],
		references: [users.id],
		relationName: "rentals_createdBy_users_id"
	}),
	user_completedBy: one(users, {
		fields: [rentals.completedBy],
		references: [users.id],
		relationName: "rentals_completedBy_users_id"
	}),
	user_approvedBy: one(users, {
		fields: [rentals.approvedBy],
		references: [users.id],
		relationName: "rentals_approvedBy_users_id"
	}),
	timesheets: many(timesheets),
}));

export const employeePerformanceReviewsRelations = relations(employeePerformanceReviews, ({one}) => ({
	employee: one(employees, {
		fields: [employeePerformanceReviews.employeeId],
		references: [employees.id]
	}),
}));

export const employeeResignationsRelations = relations(employeeResignations, ({one}) => ({
	employee: one(employees, {
		fields: [employeeResignations.employeeId],
		references: [employees.id]
	}),
}));

export const employeeSalariesRelations = relations(employeeSalaries, ({one}) => ({
	employee: one(employees, {
		fields: [employeeSalaries.employeeId],
		references: [employees.id]
	}),
}));

export const employeeTrainingRelations = relations(employeeTraining, ({one}) => ({
	employee: one(employees, {
		fields: [employeeTraining.employeeId],
		references: [employees.id]
	}),
	training: one(trainings, {
		fields: [employeeTraining.trainingId],
		references: [trainings.id]
	}),
}));

export const trainingsRelations = relations(trainings, ({many}) => ({
	employeeTrainings: many(employeeTraining),
}));

export const employeeLeavesRelations = relations(employeeLeaves, ({one}) => ({
	employee: one(employees, {
		fields: [employeeLeaves.employeeId],
		references: [employees.id]
	}),
}));

export const employeeSkillRelations = relations(employeeSkill, ({one}) => ({
	employee: one(employees, {
		fields: [employeeSkill.employeeId],
		references: [employees.id]
	}),
	skill: one(skills, {
		fields: [employeeSkill.skillId],
		references: [skills.id]
	}),
}));

export const skillsRelations = relations(skills, ({many}) => ({
	employeeSkills: many(employeeSkill),
}));

export const equipmentDocumentsRelations = relations(equipmentDocuments, ({one}) => ({
	equipment: one(equipment, {
		fields: [equipmentDocuments.equipmentId],
		references: [equipment.id]
	}),
}));

export const equipmentRelations = relations(equipment, ({one, many}) => ({
	equipmentDocuments: many(equipmentDocuments),
	equipmentMaintenances: many(equipmentMaintenance),
	equipmentRentalHistories: many(equipmentRentalHistory),
	employee: one(employees, {
		fields: [equipment.assignedTo],
		references: [employees.id]
	}),
	projectFuels: many(projectFuel),
	projectEquipments: many(projectEquipment),
	rentalItems: many(rentalItems),
}));

export const equipmentMaintenanceRelations = relations(equipmentMaintenance, ({one, many}) => ({
	equipment: one(equipment, {
		fields: [equipmentMaintenance.equipmentId],
		references: [equipment.id]
	}),
	employee: one(employees, {
		fields: [equipmentMaintenance.assignedToEmployeeId],
		references: [employees.id]
	}),
	equipmentMaintenanceItems: many(equipmentMaintenanceItems),
}));

export const equipmentMaintenanceItemsRelations = relations(equipmentMaintenanceItems, ({one}) => ({
	equipmentMaintenance: one(equipmentMaintenance, {
		fields: [equipmentMaintenanceItems.maintenanceId],
		references: [equipmentMaintenance.id]
	}),
}));

export const equipmentRentalHistoryRelations = relations(equipmentRentalHistory, ({one}) => ({
	equipment: one(equipment, {
		fields: [equipmentRentalHistory.equipmentId],
		references: [equipment.id]
	}),
	rental: one(rentals, {
		fields: [equipmentRentalHistory.rentalId],
		references: [rentals.id]
	}),
	project: one(projects, {
		fields: [equipmentRentalHistory.projectId],
		references: [projects.id]
	}),
	employee: one(employees, {
		fields: [equipmentRentalHistory.employeeId],
		references: [employees.id]
	}),
}));

export const designationsRelations = relations(designations, ({one, many}) => ({
	employees: many(employees),
	department: one(departments, {
		fields: [designations.departmentId],
		references: [departments.id]
	}),
}));

export const departmentsRelations = relations(departments, ({many}) => ({
	employees: many(employees),
	designations: many(designations),
}));

export const organizationalUnitsRelations = relations(organizationalUnits, ({one, many}) => ({
	employees: many(employees, {
		relationName: "employees_unitId_organizationalUnits_id"
	}),
	organizationalUnit: one(organizationalUnits, {
		fields: [organizationalUnits.parentId],
		references: [organizationalUnits.id],
		relationName: "organizationalUnits_parentId_organizationalUnits_id"
	}),
	organizationalUnits: many(organizationalUnits, {
		relationName: "organizationalUnits_parentId_organizationalUnits_id"
	}),
	employee: one(employees, {
		fields: [organizationalUnits.managerId],
		references: [employees.id],
		relationName: "organizationalUnits_managerId_employees_id"
	}),
}));

export const loansRelations = relations(loans, ({one}) => ({
	employee: one(employees, {
		fields: [loans.employeeId],
		references: [employees.id]
	}),
}));

export const payrollsRelations = relations(payrolls, ({one, many}) => ({
	employee: one(employees, {
		fields: [payrolls.employeeId],
		references: [employees.id]
	}),
	user_approvedBy: one(users, {
		fields: [payrolls.approvedBy],
		references: [users.id],
		relationName: "payrolls_approvedBy_users_id"
	}),
	user_paidBy: one(users, {
		fields: [payrolls.paidBy],
		references: [users.id],
		relationName: "payrolls_paidBy_users_id"
	}),
	payrollRun: one(payrollRuns, {
		fields: [payrolls.payrollRunId],
		references: [payrollRuns.id]
	}),
	payrollItems: many(payrollItems),
	taxDocumentPayrolls: many(taxDocumentPayrolls),
}));

export const payrollRunsRelations = relations(payrollRuns, ({many}) => ({
	payrolls: many(payrolls),
}));

export const payrollItemsRelations = relations(payrollItems, ({one}) => ({
	payroll: one(payrolls, {
		fields: [payrollItems.payrollId],
		references: [payrolls.id]
	}),
}));

export const projectManpowerRelations = relations(projectManpower, ({one, many}) => ({
	project_projectId: one(projects, {
		fields: [projectManpower.projectId],
		references: [projects.id],
		relationName: "projectManpower_projectId_projects_id"
	}),
	employee_employeeId: one(employees, {
		fields: [projectManpower.employeeId],
		references: [employees.id],
		relationName: "projectManpower_employeeId_employees_id"
	}),
	employee_assignedBy: one(employees, {
		fields: [projectManpower.assignedBy],
		references: [employees.id],
		relationName: "projectManpower_assignedBy_employees_id"
	}),
	project_projectId: one(projects, {
		fields: [projectManpower.projectId],
		references: [projects.id],
		relationName: "projectManpower_projectId_projects_id"
	}),
	employee_employeeId: one(employees, {
		fields: [projectManpower.employeeId],
		references: [employees.id],
		relationName: "projectManpower_employeeId_employees_id"
	}),
	employee_assignedBy: one(employees, {
		fields: [projectManpower.assignedBy],
		references: [employees.id],
		relationName: "projectManpower_assignedBy_employees_id"
	}),
	projectEquipments: many(projectEquipment),
}));

export const projectFuelRelations = relations(projectFuel, ({one}) => ({
	project: one(projects, {
		fields: [projectFuel.projectId],
		references: [projects.id]
	}),
	equipment: one(equipment, {
		fields: [projectFuel.equipmentId],
		references: [equipment.id]
	}),
	employee: one(employees, {
		fields: [projectFuel.operatorId],
		references: [employees.id]
	}),
}));

export const projectMaterialsRelations = relations(projectMaterials, ({one}) => ({
	project: one(projects, {
		fields: [projectMaterials.projectId],
		references: [projects.id]
	}),
	employee: one(employees, {
		fields: [projectMaterials.assignedTo],
		references: [employees.id]
	}),
}));

export const projectExpensesRelations = relations(projectExpenses, ({one}) => ({
	project: one(projects, {
		fields: [projectExpenses.projectId],
		references: [projects.id]
	}),
	employee_approvedBy: one(employees, {
		fields: [projectExpenses.approvedBy],
		references: [employees.id],
		relationName: "projectExpenses_approvedBy_employees_id"
	}),
	employee_assignedTo: one(employees, {
		fields: [projectExpenses.assignedTo],
		references: [employees.id],
		relationName: "projectExpenses_assignedTo_employees_id"
	}),
}));

export const projectMilestonesRelations = relations(projectMilestones, ({one}) => ({
	project: one(projects, {
		fields: [projectMilestones.projectId],
		references: [projects.id]
	}),
}));

export const projectEquipmentRelations = relations(projectEquipment, ({one}) => ({
	project: one(projects, {
		fields: [projectEquipment.projectId],
		references: [projects.id]
	}),
	equipment: one(equipment, {
		fields: [projectEquipment.equipmentId],
		references: [equipment.id]
	}),
	projectManpower: one(projectManpower, {
		fields: [projectEquipment.operatorId],
		references: [projectManpower.id]
	}),
	employee: one(employees, {
		fields: [projectEquipment.assignedBy],
		references: [employees.id]
	}),
}));

export const projectSubcontractorsRelations = relations(projectSubcontractors, ({one}) => ({
	project: one(projects, {
		fields: [projectSubcontractors.projectId],
		references: [projects.id]
	}),
	employee: one(employees, {
		fields: [projectSubcontractors.assignedBy],
		references: [employees.id]
	}),
}));

export const projectTasksRelations = relations(projectTasks, ({one, many}) => ({
	project: one(projects, {
		fields: [projectTasks.projectId],
		references: [projects.id]
	}),
	employee: one(employees, {
		fields: [projectTasks.assignedToId],
		references: [employees.id]
	}),
	projectTask: one(projectTasks, {
		fields: [projectTasks.parentTaskId],
		references: [projectTasks.id],
		relationName: "projectTasks_parentTaskId_projectTasks_id"
	}),
	projectTasks: many(projectTasks, {
		relationName: "projectTasks_parentTaskId_projectTasks_id"
	}),
}));

export const projectTemplatesRelations = relations(projectTemplates, ({one}) => ({
	user: one(users, {
		fields: [projectTemplates.createdBy],
		references: [users.id]
	}),
}));

export const rentalItemsRelations = relations(rentalItems, ({one}) => ({
	rental: one(rentals, {
		fields: [rentalItems.rentalId],
		references: [rentals.id]
	}),
	equipment: one(equipment, {
		fields: [rentalItems.equipmentId],
		references: [equipment.id]
	}),
}));

export const reportTemplatesRelations = relations(reportTemplates, ({one, many}) => ({
	user: one(users, {
		fields: [reportTemplates.createdBy],
		references: [users.id]
	}),
	scheduledReports: many(scheduledReports),
}));

export const projectRisksRelations = relations(projectRisks, ({one}) => ({
	project: one(projects, {
		fields: [projectRisks.projectId],
		references: [projects.id]
	}),
	employee: one(employees, {
		fields: [projectRisks.assignedToId],
		references: [employees.id]
	}),
}));

export const locationsRelations = relations(locations, ({many}) => ({
	projects: many(projects),
}));

export const salaryIncrementsRelations = relations(salaryIncrements, ({one}) => ({
	user_requestedBy: one(users, {
		fields: [salaryIncrements.requestedBy],
		references: [users.id],
		relationName: "salaryIncrements_requestedBy_users_id"
	}),
	user_approvedBy: one(users, {
		fields: [salaryIncrements.approvedBy],
		references: [users.id],
		relationName: "salaryIncrements_approvedBy_users_id"
	}),
	user_rejectedBy: one(users, {
		fields: [salaryIncrements.rejectedBy],
		references: [users.id],
		relationName: "salaryIncrements_rejectedBy_users_id"
	}),
	employee: one(employees, {
		fields: [salaryIncrements.employeeId],
		references: [employees.id]
	}),
}));

export const scheduledReportsRelations = relations(scheduledReports, ({one}) => ({
	reportTemplate: one(reportTemplates, {
		fields: [scheduledReports.reportTemplateId],
		references: [reportTemplates.id]
	}),
	user: one(users, {
		fields: [scheduledReports.createdBy],
		references: [users.id]
	}),
}));

export const taxDocumentsRelations = relations(taxDocuments, ({one, many}) => ({
	employee: one(employees, {
		fields: [taxDocuments.employeeId],
		references: [employees.id]
	}),
	taxDocumentPayrolls: many(taxDocumentPayrolls),
}));

export const safetyIncidentsRelations = relations(safetyIncidents, ({one}) => ({
	employee_reportedBy: one(employees, {
		fields: [safetyIncidents.reportedBy],
		references: [employees.id],
		relationName: "safetyIncidents_reportedBy_employees_id"
	}),
	employee_assignedToId: one(employees, {
		fields: [safetyIncidents.assignedToId],
		references: [employees.id],
		relationName: "safetyIncidents_assignedToId_employees_id"
	}),
}));

export const timesheetsRelations = relations(timesheets, ({one, many}) => ({
	employee: one(employees, {
		fields: [timesheets.employeeId],
		references: [employees.id]
	}),
	employeeAssignment: one(employeeAssignments, {
		fields: [timesheets.assignmentId],
		references: [employeeAssignments.id]
	}),
	project: one(projects, {
		fields: [timesheets.projectId],
		references: [projects.id]
	}),
	rental: one(rentals, {
		fields: [timesheets.rentalId],
		references: [rentals.id]
	}),
	user: one(users, {
		fields: [timesheets.approvedBy],
		references: [users.id]
	}),
	timesheetApprovals: many(timesheetApprovals),
	timeEntries: many(timeEntries),
}));

export const timesheetApprovalsRelations = relations(timesheetApprovals, ({one}) => ({
	timesheet: one(timesheets, {
		fields: [timesheetApprovals.timesheetId],
		references: [timesheets.id]
	}),
}));

export const weeklyTimesheetsRelations = relations(weeklyTimesheets, ({one}) => ({
	employee: one(employees, {
		fields: [weeklyTimesheets.employeeId],
		references: [employees.id]
	}),
}));

export const timeOffRequestsRelations = relations(timeOffRequests, ({one}) => ({
	employee: one(employees, {
		fields: [timeOffRequests.employeeId],
		references: [employees.id]
	}),
}));

export const timeEntriesRelations = relations(timeEntries, ({one}) => ({
	employee: one(employees, {
		fields: [timeEntries.employeeId],
		references: [employees.id]
	}),
	timesheet: one(timesheets, {
		fields: [timeEntries.timesheetId],
		references: [timesheets.id]
	}),
}));

export const advancePaymentHistoriesRelations = relations(advancePaymentHistories, ({one}) => ({
	advancePayment: one(advancePayments, {
		fields: [advancePaymentHistories.advancePaymentId],
		references: [advancePayments.id]
	}),
	employee: one(employees, {
		fields: [advancePaymentHistories.employeeId],
		references: [employees.id]
	}),
}));

export const taxDocumentPayrollsRelations = relations(taxDocumentPayrolls, ({one}) => ({
	taxDocument: one(taxDocuments, {
		fields: [taxDocumentPayrolls.taxDocumentId],
		references: [taxDocuments.id]
	}),
	payroll: one(payrolls, {
		fields: [taxDocumentPayrolls.payrollId],
		references: [payrolls.id]
	}),
}));

export const modelHasRolesRelations = relations(modelHasRoles, ({one}) => ({
	role: one(roles, {
		fields: [modelHasRoles.roleId],
		references: [roles.id]
	}),
	user: one(users, {
		fields: [modelHasRoles.userId],
		references: [users.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	modelHasRoles: many(modelHasRoles),
	roleHasPermissions: many(roleHasPermissions),
}));

export const roleHasPermissionsRelations = relations(roleHasPermissions, ({one}) => ({
	permission: one(permissions, {
		fields: [roleHasPermissions.permissionId],
		references: [permissions.id]
	}),
	role: one(roles, {
		fields: [roleHasPermissions.roleId],
		references: [roles.id]
	}),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	roleHasPermissions: many(roleHasPermissions),
	modelHasPermissions: many(modelHasPermissions),
}));

export const modelHasPermissionsRelations = relations(modelHasPermissions, ({one}) => ({
	permission: one(permissions, {
		fields: [modelHasPermissions.permissionId],
		references: [permissions.id]
	}),
	user: one(users, {
		fields: [modelHasPermissions.userId],
		references: [users.id]
	}),
}));