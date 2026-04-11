/**
 * Human-readable labels for equipment.status (see EquipmentStatusService).
 * Assigned = on rental or project; under_maintenance = active maintenance workflow.
 */
const LABELS: Record<string, string> = {
  available: 'Available',
  assigned: 'Assigned (rental/project)',
  rented: 'Rented',
  maintenance: 'Maintenance',
  under_maintenance: 'Under maintenance',
  inactive: 'Inactive',
  out_of_service: 'Out of service',
};

export function formatEquipmentReportStatus(status: string | null | undefined): string {
  if (status == null || status === '') return 'N/A';
  return LABELS[status] ?? status;
}
