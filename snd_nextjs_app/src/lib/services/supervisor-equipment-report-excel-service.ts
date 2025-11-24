import * as XLSX from 'xlsx';
import { SupervisorEquipmentReportData } from './supervisor-equipment-report-pdf-service';

export class SupervisorEquipmentReportExcelService {
  static generateSupervisorEquipmentReportExcel(data: SupervisorEquipmentReportData): XLSX.WorkBook {
    if (!data) {
      throw new Error('Supervisor equipment report data is required');
    }

    const workbook = XLSX.utils.book_new();

    // Summary Statistics Sheet
    if (data.summary_stats) {
      const summaryHeaders = ['Metric', 'Value'];
      const summaryData = [
        summaryHeaders,
        ['Total Supervisors', data.summary_stats.total_supervisors || 0],
        ['Total Equipment', data.summary_stats.total_equipment || 0],
        ['Total Items', data.summary_stats.total_items || 0],
        ['Average Equipment per Supervisor', data.summary_stats.average_equipment_per_supervisor || 0],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Supervisor Summary Sheet
    if (data.supervisor_groups && data.supervisor_groups.length > 0) {
      const supervisorSummaryHeaders = ['Supervisor', 'File Number', 'Equipment Count', 'Total Items'];
      const supervisorSummaryData: (string | number)[][] = [supervisorSummaryHeaders];

      data.supervisor_groups.forEach(supervisor => {
        supervisorSummaryData.push([
          supervisor.supervisor_name || 'N/A',
          supervisor.supervisor_file_number || 'N/A',
          supervisor.equipment_count || 0,
          supervisor.total_items || 0,
        ]);
      });

      const supervisorSummarySheet = XLSX.utils.aoa_to_sheet(supervisorSummaryData);
      XLSX.utils.book_append_sheet(workbook, supervisorSummarySheet, 'Supervisor Summary');
    }

    // Detailed Equipment Sheet
    if (data.supervisor_groups && data.supervisor_groups.length > 0) {
      const equipmentHeaders = [
        'Serial #',
        'Supervisor',
        'File Number',
        'Equipment',
        'Customer Name',
        'Rental Number',
        'Rental Status',
        'Operator',
        'Item Status',
        'Start Date',
        'Completed Date'
      ];

      const equipmentData: (string | number)[][] = [equipmentHeaders];
      let serialNumber = 1;

      data.supervisor_groups.forEach(supervisor => {
        if (supervisor.equipment && supervisor.equipment.length > 0) {
          supervisor.equipment.forEach(equipment => {
            equipmentData.push([
              serialNumber++,
              supervisor.supervisor_name || 'N/A',
              supervisor.supervisor_file_number || 'N/A',
              equipment.display_name || equipment.equipment_name || 'N/A',
              equipment.customer_name || 'N/A',
              equipment.rental_number || 'N/A',
              equipment.rental_status || 'N/A',
              equipment.operator_name 
                ? `${equipment.operator_name}${equipment.operator_file_number ? ` (${equipment.operator_file_number})` : ''}`
                : 'No Operator',
              equipment.item_status || 'N/A',
              equipment.item_start_date || 'N/A',
              equipment.item_completed_date || 'N/A',
            ]);
          });
        }
      });

      const equipmentSheet = XLSX.utils.aoa_to_sheet(equipmentData);
      XLSX.utils.book_append_sheet(workbook, equipmentSheet, 'Equipment Details');
    }

    return workbook;
  }

  static async downloadSupervisorEquipmentReportExcel(
    data: SupervisorEquipmentReportData | any,
    filename?: string
  ): Promise<void> {
    try {
      // Extract data if wrapped in response structure
      const reportData: SupervisorEquipmentReportData = data.data || data;

      const workbook = this.generateSupervisorEquipmentReportExcel(reportData);
      XLSX.writeFile(
        workbook,
        filename || `supervisor-equipment-report-${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } catch (error) {
      console.error('Error generating supervisor equipment Excel:', error);
      throw error;
    }
  }
}

