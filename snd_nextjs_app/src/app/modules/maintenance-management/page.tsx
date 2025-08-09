import MaintenanceHistoryTable from '@/components/equipment/MaintenanceHistoryTable';

export default function MaintenanceManagementPage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Maintenance & Repairs</h1>
        <p className="text-sm text-muted-foreground">Track and manage equipment maintenance and repair activities.</p>
      </div>
      <MaintenanceHistoryTable />
    </div>
  );
}


