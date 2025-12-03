// Export all schema tables for easy importing
export * from './schema';
export * from './relations';

// Re-export commonly used tables
export {
  // Core entities
  users,
  employees,
  projects,
  equipment,
  customers,
  rentals,
  
  // Project management
  projectTasks,
  projectMilestones,
  projectTemplates,
  projectRisks,
  projectManpower,
  projectEquipment,
  projectMaterials,
  projectFuel,
  projectExpenses,
  projectSubcontractors,
  
  // Employee management
  employeeAssignments,
  employeeDocuments,
  employeeLeaves,
  employeePerformanceReviews,
  employeeSalaries,
  employeeSkill,
  employeeTraining,
  
  // Equipment management
  equipmentMaintenance,
  equipmentMaintenanceItems,
  equipmentRentalHistory,
  
  // Financial
  advancePayments,
  advancePaymentHistories,
  payrolls,
  payrollItems,
  salaryIncrements,
  loans,
  
  // Time tracking
  timesheets,
  timeEntries,
  timeOffRequests,
  weeklyTimesheets,
  timesheetApprovals,
  
  // Organization
  departments,
  designations,
  organizationalUnits,
  roles,
  permissions,
  modelHasRoles,
  roleHasPermissions,
  modelHasPermissions,
  
  // Settings & Configuration
  systemSettings,
  reportTemplates,
  scheduledReports,
  
  // Safety & Compliance
  safetyIncidents,
  
  // Document management
  customerDocuments,
  equipmentDocuments,
  documentVersions,
  documentApprovals,
  
  // Analytics
  analyticsReports,
  
  // Other
  locations,
  skills,
  trainings,
  media,
  cache,
  jobs,
  failedJobs,
  personalAccessTokens,
  telescopeEntries,
  telescopeEntryTags,
  telescopeMonitoring,
  rentalItems,

  passwordResetTokens,
  sessions,
} from './schema';
