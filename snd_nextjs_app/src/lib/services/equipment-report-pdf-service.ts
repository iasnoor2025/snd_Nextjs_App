import { jsPDF } from 'jspdf';

export interface EquipmentReportData {
  summary_stats: {
    totalEquipment: number;
    activeEquipment: number;
    availableEquipment: number;
    rentedEquipment: number;
    maintenanceEquipment: number;
    totalValue: number;
    totalDepreciatedValue: number;
    avgDailyRate: number;
    avgWeeklyRate: number;
    avgMonthlyRate: number;
  };
  category_stats: Array<{
    categoryId: number;
    categoryName: string;
    categoryDescription: string;
    categoryIcon: string;
    categoryColor: string;
    totalEquipment: number;
    activeEquipment: number;
    availableEquipment: number;
    rentedEquipment: number;
    maintenanceEquipment: number;
    totalValue: number;
    totalDepreciatedValue: number;
    avgDailyRate: number;
    avgWeeklyRate: number;
    avgMonthlyRate: number;
  }>;
  equipment_by_category: Record<string, {
    categoryId: number;
    categoryName: string;
    categoryDescription: string;
    categoryIcon: string;
    categoryColor: string;
    equipment: Array<{
      id: number;
      name: string;
      description: string;
      manufacturer: string;
      modelNumber: string;
      serialNumber: string;
      chassisNumber: string;
      doorNumber: string;
      status: string;
      locationName: string;
      assignedEmployeeName: string;
      purchasePrice: number;
      dailyRate: number;
      weeklyRate: number;
      monthlyRate: number;
      assetCondition: string;
      depreciatedValue: number;
      istimara: string;
      istimaraExpiryDate: string;
    }>;
  }>;
  equipment_list: Array<{
    id: number;
    name: string;
    description: string;
    categoryName: string;
    manufacturer: string;
    modelNumber: string;
    serialNumber: string;
    chassisNumber: string;
    doorNumber: string;
    status: string;
    locationName: string;
    assignedEmployeeName: string;
    purchasePrice: number;
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
    assetCondition: string;
    depreciatedValue: number;
    istimara: string;
    istimaraExpiryDate: string;
  }>;
  generated_at: string;
  parameters: {
    categoryId?: string;
    status?: string;
    locationId?: string;
    includeInactive?: boolean;
  };
}

export class EquipmentReportPDFService {
  static generateEquipmentReportPDF(data: EquipmentReportData): jsPDF {
    if (!data) {
      throw new Error('Equipment report data is required');
    }
    
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Set document properties
    doc.setProperties({
      title: 'Equipment Report by Category',
      subject: 'Equipment Management Report',
      author: 'SND Rental System',
      creator: 'SND Rental System',
    });

    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Equipment Report by Category', 105, yPosition, { align: 'center' });
    yPosition += 10;

    // Company info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('SND Equipment Rental Company', 105, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text('Kingdom of Saudi Arabia', 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Generation info
    doc.setFontSize(10);
    const generatedAt = data.generated_at || new Date().toISOString();
    doc.text(`Generated: ${new Date(generatedAt).toLocaleString()}`, 20, yPosition);
    yPosition += 5;

    // Parameters
    if (data.parameters && (data.parameters.categoryId || data.parameters.status || data.parameters.locationId)) {
      doc.text('Filters Applied:', 20, yPosition);
      yPosition += 5;
      
      if (data.parameters.categoryId) {
        const category = data.category_stats?.find(c => c.categoryId.toString() === data.parameters.categoryId);
        doc.text(`Category: ${category?.categoryName || 'Unknown'}`, 25, yPosition);
        yPosition += 4;
      }
      
      if (data.parameters.status) {
        doc.text(`Status: ${data.parameters.status}`, 25, yPosition);
        yPosition += 4;
      }
      
      if (data.parameters.locationId) {
        doc.text(`Location: ${data.parameters.locationId}`, 25, yPosition);
        yPosition += 4;
      }
      
      if (data.parameters.includeInactive) {
        doc.text('Include Inactive: Yes', 25, yPosition);
        yPosition += 4;
      }
      
      yPosition += 5;
    }

    // Summary Statistics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', 20, yPosition);
    yPosition += 10;

    // Summary table
    const summaryStats = data.summary_stats || {};
    const summaryData = [
      ['Total Equipment', (summaryStats.totalEquipment || 0).toString()],
      ['Active Equipment', (summaryStats.activeEquipment || 0).toString()],
      ['Available Equipment', (summaryStats.availableEquipment || 0).toString()],
      ['Rented Equipment', (summaryStats.rentedEquipment || 0).toString()],
      ['Maintenance Equipment', (summaryStats.maintenanceEquipment || 0).toString()],
      ['Total Value', `SAR ${Number(summaryStats.totalValue || 0).toLocaleString()}`],
      ['Total Depreciated Value', `SAR ${Number(summaryStats.totalDepreciatedValue || 0).toLocaleString()}`],
      ['Average Daily Rate', `SAR ${Number(summaryStats.avgDailyRate || 0).toFixed(2)}`],
      ['Average Weekly Rate', `SAR ${Number(summaryStats.avgWeeklyRate || 0).toFixed(2)}`],
      ['Average Monthly Rate', `SAR ${Number(summaryStats.avgMonthlyRate || 0).toFixed(2)}`]
    ];

    // Draw summary table manually
    const tableStartY = yPosition;
    const rowHeight = 8;
    const col1Width = 60;
    const col2Width = 40;
    
    // Draw table header
    doc.setFillColor(41, 128, 185);
    doc.rect(20, tableStartY, col1Width + col2Width, rowHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Metric', 25, tableStartY + 5);
    doc.text('Value', 20 + col1Width + 5, tableStartY + 5);
    
    // Draw table rows
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    summaryData.forEach((row, index) => {
      const rowY = tableStartY + rowHeight + (index * rowHeight);
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(20, rowY, col1Width + col2Width, rowHeight, 'F');
      }
      doc.text(row[0], 25, rowY + 5);
      doc.text(row[1], 20 + col1Width + 5, rowY + 5);
    });
    
    yPosition = tableStartY + rowHeight + (summaryData.length * rowHeight) + 15;

    // Category Statistics
    if (data.category_stats && data.category_stats.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Category Statistics', 20, yPosition);
      yPosition += 10;

      const categoryData = data.category_stats.map(category => [
        category.categoryName || 'Unknown',
        (category.totalEquipment || 0).toString(),
        (category.activeEquipment || 0).toString(),
        (category.availableEquipment || 0).toString(),
        (category.rentedEquipment || 0).toString(),
        (category.maintenanceEquipment || 0).toString(),
        `SAR ${Number(category.totalValue || 0).toLocaleString()}`,
        `SAR ${Number(category.avgDailyRate || 0).toFixed(2)}`
      ]);

      // Draw category table manually
      const categoryTableStartY = yPosition;
      const categoryRowHeight = 7;
      const categoryColWidths = [30, 15, 15, 20, 15, 20, 25, 25];
      
      // Draw table header
      doc.setFillColor(41, 128, 185);
      doc.rect(20, categoryTableStartY, categoryColWidths.reduce((a, b) => a + b, 0), categoryRowHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const headers = ['Category', 'Total', 'Active', 'Available', 'Rented', 'Maintenance', 'Total Value', 'Avg Daily Rate'];
      let xPos = 25;
      headers.forEach((header, index) => {
        doc.text(header, xPos, categoryTableStartY + 4);
        xPos += categoryColWidths[index];
      });
      
      // Draw table rows
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      categoryData.forEach((row, index) => {
        const rowY = categoryTableStartY + categoryRowHeight + (index * categoryRowHeight);
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(20, rowY, categoryColWidths.reduce((a, b) => a + b, 0), categoryRowHeight, 'F');
        }
        xPos = 25;
        row.forEach((cell, cellIndex) => {
          doc.text(cell, xPos, rowY + 4);
          xPos += categoryColWidths[cellIndex];
        });
      });
      
      yPosition = categoryTableStartY + categoryRowHeight + (categoryData.length * categoryRowHeight) + 15;
    }

    // Equipment Details by Category
    if (data.equipment_by_category) {
      Object.values(data.equipment_by_category).forEach((category, categoryIndex) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Category header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const categoryName = category.categoryName || 'Unknown Category';
      const equipmentCount = category.equipment?.length || 0;
      doc.text(`${categoryName} (${equipmentCount} items)`, 20, yPosition);
      yPosition += 8;

      if (category.equipment && category.equipment.length > 0) {
        const equipmentData = category.equipment.map(equipment => [
          equipment.name || 'N/A',
          equipment.doorNumber || 'N/A',
          equipment.istimara || 'N/A',
          equipment.istimaraExpiryDate || 'N/A',
          equipment.status || 'N/A'
        ]);

        // Draw equipment table manually
        const equipmentTableStartY = yPosition;
        const equipmentRowHeight = 6;
        const equipmentColWidths = [40, 20, 30, 30, 20];
        
        // Draw table header
        doc.setFillColor(52, 152, 219);
        doc.rect(20, equipmentTableStartY, equipmentColWidths.reduce((a, b) => a + b, 0), equipmentRowHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const equipmentHeaders = ['Name', 'Door #', 'Istimara', 'Istimara Expiry Date', 'Status'];
        let equipmentXPos = 25;
        equipmentHeaders.forEach((header, index) => {
          doc.text(header, equipmentXPos, equipmentTableStartY + 4);
          equipmentXPos += equipmentColWidths[index];
        });
        
        // Draw table rows
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        equipmentData.forEach((row, index) => {
          const rowY = equipmentTableStartY + equipmentRowHeight + (index * equipmentRowHeight);
          if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(20, rowY, equipmentColWidths.reduce((a, b) => a + b, 0), equipmentRowHeight, 'F');
          }
          equipmentXPos = 25;
          row.forEach((cell, cellIndex) => {
            doc.text(cell, equipmentXPos, rowY + 4);
            equipmentXPos += equipmentColWidths[cellIndex];
          });
        });
        
        yPosition = equipmentTableStartY + equipmentRowHeight + (equipmentData.length * equipmentRowHeight) + 10;
      }
    });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${pageCount}`, 20, 290);
      doc.text(new Date().toLocaleDateString(), 180, 290);
    }

    return doc;
  }

  static async generateEquipmentReportPDFBlob(data: EquipmentReportData): Promise<Blob> {
    const doc = this.generateEquipmentReportPDF(data);
    return doc.output('blob');
  }

  static async downloadEquipmentReportPDF(data: EquipmentReportData, filename?: string): Promise<void> {
    const blob = await this.generateEquipmentReportPDFBlob(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `equipment-report-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
