import { useConfirmationDialog } from "@/components/providers/confirmation-provider";

// Common confirmation patterns for different types of deletions
export const useDeleteConfirmations = () => {
  const { confirm } = useConfirmationDialog();

  const confirmDeleteAdvance = async () => {
    return await confirm({
      title: "Delete Advance",
      description: "Are you sure you want to delete this advance? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteEmployee = async (employeeName?: string) => {
    return await confirm({
      title: "Delete Employee",
      description: `Are you sure you want to delete ${employeeName ? employeeName : 'this employee'}? This will remove all associated data.`,
      confirmText: "Delete Employee",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteEquipment = async (equipmentName?: string) => {
    return await confirm({
      title: "Delete Equipment",
      description: `Are you sure you want to delete ${equipmentName ? `"${equipmentName}"` : 'this equipment'}? This will permanently remove it from the system.`,
      confirmText: "Delete Equipment",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteRental = async () => {
    return await confirm({
      title: "Delete Rental",
      description: "Are you sure you want to delete this rental? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteProject = async (projectName?: string) => {
    return await confirm({
      title: "Delete Project",
      description: `Are you sure you want to delete ${projectName ? `"${projectName}"` : 'this project'}? This will remove all project data.`,
      confirmText: "Delete Project",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteTimesheet = async () => {
    return await confirm({
      title: "Delete Timesheet",
      description: "Are you sure you want to delete this timesheet entry? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteLeave = async () => {
    return await confirm({
      title: "Delete Leave Request",
      description: "Are you sure you want to delete this leave request? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteUser = async (userName?: string) => {
    return await confirm({
      title: "Delete User",
      description: `Are you sure you want to delete ${userName ? userName : 'this user'}? This will remove their access to the system.`,
      confirmText: "Delete User",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteRole = async (roleName?: string) => {
    return await confirm({
      title: "Delete Role",
      description: `Are you sure you want to delete ${roleName ? `"${roleName}"` : 'this role'}? This will affect all users with this role.`,
      confirmText: "Delete Role",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteCompany = async (companyName?: string) => {
    return await confirm({
      title: "Delete Company",
      description: `Are you sure you want to delete ${companyName ? `"${companyName}"` : 'this company'}? This will remove all associated data.`,
      confirmText: "Delete Company",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteCustomer = async (customerName?: string) => {
    return await confirm({
      title: "Delete Customer",
      description: `Are you sure you want to delete ${customerName ? customerName : 'this customer'}? This will remove all associated data.`,
      confirmText: "Delete Customer",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteLocation = async (locationName?: string) => {
    return await confirm({
      title: "Delete Location",
      description: `Are you sure you want to delete ${locationName ? `"${locationName}"` : 'this location'}? This will affect all associated records.`,
      confirmText: "Delete Location",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteDocument = async () => {
    return await confirm({
      title: "Delete Document",
      description: "Are you sure you want to delete this document? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeletePayment = async () => {
    return await confirm({
      title: "Delete Payment",
      description: "Are you sure you want to delete this payment record? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteAssignment = async () => {
    return await confirm({
      title: "Delete Assignment",
      description: "Are you sure you want to delete this assignment? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteTemplate = async (templateName?: string) => {
    return await confirm({
      title: "Delete Template",
      description: `Are you sure you want to delete ${templateName ? `"${templateName}"` : 'this template'}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteResource = async (resourceType?: string) => {
    return await confirm({
      title: "Delete Resource",
      description: `Are you sure you want to delete this ${resourceType || 'resource'}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteReport = async () => {
    return await confirm({
      title: "Delete Report",
      description: "Are you sure you want to delete this report? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteSetting = async () => {
    return await confirm({
      title: "Delete Setting",
      description: "Are you sure you want to delete this setting? This may affect system functionality.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteQuotation = async () => {
    return await confirm({
      title: "Delete Quotation",
      description: "Are you sure you want to delete this quotation? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteInvoice = async () => {
    return await confirm({
      title: "Delete Invoice",
      description: "Are you sure you want to delete this invoice? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteSafetyRecord = async () => {
    return await confirm({
      title: "Delete Safety Record",
      description: "Are you sure you want to delete this safety record? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmDeleteAnalyticsReport = async () => {
    return await confirm({
      title: "Delete Analytics Report",
      description: "Are you sure you want to delete this analytics report? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmBulkDelete = async (count: number, itemType: string) => {
    return await confirm({
      title: `Delete ${count} ${itemType}`,
      description: `Are you sure you want to delete ${count} selected ${itemType}? This action cannot be undone.`,
      confirmText: `Delete ${count}`,
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  const confirmCancel = async (itemType: string) => {
    return await confirm({
      title: `Cancel ${itemType}`,
      description: `Are you sure you want to cancel this ${itemType}? This action cannot be undone.`,
      confirmText: "Cancel",
      cancelText: "Keep",
      variant: "destructive"
    });
  };

  const confirmApprove = async (itemType: string) => {
    return await confirm({
      title: `Approve ${itemType}`,
      description: `Are you sure you want to approve this ${itemType}?`,
      confirmText: "Approve",
      cancelText: "Cancel",
      variant: "default"
    });
  };

  const confirmReject = async (itemType: string) => {
    return await confirm({
      title: `Reject ${itemType}`,
      description: `Are you sure you want to reject this ${itemType}?`,
      confirmText: "Reject",
      cancelText: "Cancel",
      variant: "destructive"
    });
  };

  return {
    confirmDeleteAdvance,
    confirmDeleteEmployee,
    confirmDeleteEquipment,
    confirmDeleteRental,
    confirmDeleteProject,
    confirmDeleteTimesheet,
    confirmDeleteLeave,
    confirmDeleteUser,
    confirmDeleteRole,
    confirmDeleteCompany,
    confirmDeleteCustomer,
    confirmDeleteLocation,
    confirmDeleteDocument,
    confirmDeletePayment,
    confirmDeleteAssignment,
    confirmDeleteTemplate,
    confirmDeleteResource,
    confirmDeleteReport,
    confirmDeleteSetting,
    confirmDeleteQuotation,
    confirmDeleteInvoice,
    confirmDeleteSafetyRecord,
    confirmDeleteAnalyticsReport,
    confirmBulkDelete,
    confirmCancel,
    confirmApprove,
    confirmReject
  };
}; 