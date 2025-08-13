import { relations } from "drizzle-orm/relations";
import { advancePayments, advancePaymentHistories, employees, equipment, equipmentRentalHistory, rentals, projects, employeeAssignments, projectResources, users, salaryIncrements, equipmentMaintenance, equipmentMaintenanceItems, departments, designations, employeeDocuments, employeeLeaves, employeePerformanceReviews, employeeResignations, employeeSalaries, employeeSkill, skills, employeeTraining, trainings, organizationalUnits, loans, payrolls, payrollItems, payrollRuns, customers, taxDocuments, taxDocumentPayrolls, timesheets, timeEntries, rentalItems, rentalOperatorAssignments, timeOffRequests, timesheetApprovals, weeklyTimesheets, roles, modelHasRoles, permissions, roleHasPermissions, modelHasPermissions } from "./schema";

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

export const advancePaymentsRelations = relations(advancePayments, ({one, many}) => ({
	advancePaymentHistories: many(advancePaymentHistories),
	employee: one(employees, {
		fields: [advancePayments.employeeId],
		references: [employees.id]
	}),
}));

export const employeesRelations = relations(employees, ({one, many}) => ({
	advancePaymentHistories: many(advancePaymentHistories),
	equipmentRentalHistories: many(equipmentRentalHistory),
	employeeAssignments: many(employeeAssignments),
	projectResources_employeeId: many(projectResources, {
		relationName: "projectResources_employeeId_employees_id"
	}),
	projectResources_assignedToId: many(projectResources, {
		relationName: "projectResources_assignedToId_employees_id"
	}),
	salaryIncrements: many(salaryIncrements),
	equipmentMaintenances: many(equipmentMaintenance),
	advancePayments: many(advancePayments),
	employeeDocuments: many(employeeDocuments),
	employeeLeaves: many(employeeLeaves),
	employeePerformanceReviews: many(employeePerformanceReviews),
	employeeResignations: many(employeeResignations),
	employeeSalaries: many(employeeSalaries),
	employeeSkills: many(employeeSkill),
	employeeTrainings: many(employeeTraining),
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
	loans: many(loans),
	organizationalUnits: many(organizationalUnits, {
		relationName: "organizationalUnits_managerId_employees_id"
	}),
	payrolls: many(payrolls),
	taxDocuments: many(taxDocuments),
	timesheets: many(timesheets),
	timeEntries: many(timeEntries),
	equipment: many(equipment),
	rentalOperatorAssignments: many(rentalOperatorAssignments),
	timeOffRequests: many(timeOffRequests),
	weeklyTimesheets: many(weeklyTimesheets),
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

export const equipmentRelations = relations(equipment, ({one, many}) => ({
	equipmentRentalHistories: many(equipmentRentalHistory),
	projectResources: many(projectResources),
	equipmentMaintenances: many(equipmentMaintenance),
	employee: one(employees, {
		fields: [equipment.assignedTo],
		references: [employees.id]
	}),
	rentalItems: many(rentalItems),
}));

export const rentalsRelations = relations(rentals, ({one, many}) => ({
	equipmentRentalHistories: many(equipmentRentalHistory),
	employeeAssignments: many(employeeAssignments),
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
	rentalItems: many(rentalItems),
	rentalOperatorAssignments: many(rentalOperatorAssignments),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	equipmentRentalHistories: many(equipmentRentalHistory),
	employeeAssignments: many(employeeAssignments),
	projectResources: many(projectResources),
	customer: one(customers, {
		fields: [projects.customerId],
		references: [customers.id]
	}),
	rentals: many(rentals),
	timesheets: many(timesheets),
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

export const projectResourcesRelations = relations(projectResources, ({one}) => ({
	project: one(projects, {
		fields: [projectResources.projectId],
		references: [projects.id]
	}),
	employee_employeeId: one(employees, {
		fields: [projectResources.employeeId],
		references: [employees.id],
		relationName: "projectResources_employeeId_employees_id"
	}),
	equipment: one(equipment, {
		fields: [projectResources.equipmentId],
		references: [equipment.id]
	}),
	employee_assignedToId: one(employees, {
		fields: [projectResources.assignedToId],
		references: [employees.id],
		relationName: "projectResources_assignedToId_employees_id"
	}),
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

export const usersRelations = relations(users, ({many}) => ({
	salaryIncrements_requestedBy: many(salaryIncrements, {
		relationName: "salaryIncrements_requestedBy_users_id"
	}),
	salaryIncrements_approvedBy: many(salaryIncrements, {
		relationName: "salaryIncrements_approvedBy_users_id"
	}),
	salaryIncrements_rejectedBy: many(salaryIncrements, {
		relationName: "salaryIncrements_rejectedBy_users_id"
	}),
	employees: many(employees),
	payrolls_approvedBy: many(payrolls, {
		relationName: "payrolls_approvedBy_users_id"
	}),
	payrolls_paidBy: many(payrolls, {
		relationName: "payrolls_paidBy_users_id"
	}),
	rentals_createdBy: many(rentals, {
		relationName: "rentals_createdBy_users_id"
	}),
	rentals_completedBy: many(rentals, {
		relationName: "rentals_completedBy_users_id"
	}),
	rentals_approvedBy: many(rentals, {
		relationName: "rentals_approvedBy_users_id"
	}),
	timesheets: many(timesheets),
	customers: many(customers),
	modelHasRoles: many(modelHasRoles),
	modelHasPermissions: many(modelHasPermissions),
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

export const designationsRelations = relations(designations, ({one, many}) => ({
	department: one(departments, {
		fields: [designations.departmentId],
		references: [departments.id]
	}),
	employees: many(employees),
}));

export const departmentsRelations = relations(departments, ({many}) => ({
	designations: many(designations),
	employees: many(employees),
}));

export const employeeDocumentsRelations = relations(employeeDocuments, ({one}) => ({
	employee: one(employees, {
		fields: [employeeDocuments.employeeId],
		references: [employees.id]
	}),
}));

export const employeeLeavesRelations = relations(employeeLeaves, ({one}) => ({
	employee: one(employees, {
		fields: [employeeLeaves.employeeId],
		references: [employees.id]
	}),
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

export const payrollItemsRelations = relations(payrollItems, ({one}) => ({
	payroll: one(payrolls, {
		fields: [payrollItems.payrollId],
		references: [payrolls.id]
	}),
}));

export const payrollsRelations = relations(payrolls, ({one, many}) => ({
	payrollItems: many(payrollItems),
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
	taxDocumentPayrolls: many(taxDocumentPayrolls),
}));

export const payrollRunsRelations = relations(payrollRuns, ({many}) => ({
	payrolls: many(payrolls),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	projects: many(projects),
	rentals: many(rentals),
	user: one(users, {
		fields: [customers.userId],
		references: [users.id]
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

export const taxDocumentsRelations = relations(taxDocuments, ({one, many}) => ({
	taxDocumentPayrolls: many(taxDocumentPayrolls),
	employee: one(employees, {
		fields: [taxDocuments.employeeId],
		references: [employees.id]
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
	timeEntries: many(timeEntries),
	timesheetApprovals: many(timesheetApprovals),
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

export const rentalOperatorAssignmentsRelations = relations(rentalOperatorAssignments, ({one}) => ({
	rental: one(rentals, {
		fields: [rentalOperatorAssignments.rentalId],
		references: [rentals.id]
	}),
	employee: one(employees, {
		fields: [rentalOperatorAssignments.employeeId],
		references: [employees.id]
	}),
}));

export const timeOffRequestsRelations = relations(timeOffRequests, ({one}) => ({
	employee: one(employees, {
		fields: [timeOffRequests.employeeId],
		references: [employees.id]
	}),
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