import * as XLSX from 'xlsx';
import { EquipmentReportData } from './equipment-report-pdf-service';

export class EquipmentReportExcelService {
  static generateEquipmentReportExcel(data: EquipmentReportData): XLSX.WorkBook {
    if (!data) {
      throw new Error('Equipment report data is required');
    }

    const workbook = XLSX.utils.book_new();

    // Equipment Details Sheet (only sheet needed)
    if (data.equipment_by_category && Object.keys(data.equipment_by_category).length > 0) {
      const equipmentHeaders = [
        'Category', 'Name', 'Door #', 'Plate #', 'Plate # Expiry Date', 'Status'
      ];
      
      const equipmentData = [equipmentHeaders];
      
      Object.values(data.equipment_by_category).forEach(category => {
        if (category.equipment && category.equipment.length > 0) {
          category.equipment.forEach(equipment => {
            equipmentData.push([
              category.categoryName || 'Unknown',
              equipment.name || 'N/A',
              equipment.doorNumber || 'N/A',
              equipment.istimara || 'N/A',
              equipment.istimaraExpiryDate || 'N/A',
              equipment.status || 'N/A'
            ]);
          });
        }
      });

      const equipmentSheet = XLSX.utils.aoa_to_sheet(equipmentData);
      XLSX.utils.book_append_sheet(workbook, equipmentSheet, 'Equipment');
    }

    return workbook;
  }

  static async downloadEquipmentReportExcel(data: EquipmentReportData, filename?: string): Promise<void> {
    const workbook = this.generateEquipmentReportExcel(data);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `equipment-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async generateEquipmentReportExcelBlob(data: EquipmentReportData): Promise<Blob> {
    const workbook = this.generateEquipmentReportExcel(data);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    return new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }
}
