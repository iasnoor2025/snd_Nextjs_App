import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export interface ProjectResourceReportData {
  project: {
    id: string;
    name: string;
  };
  resourceType: 'manpower' | 'equipment' | 'material' | 'fuel' | 'expense' | 'tasks';
  resources: Array<any>;
  summary: {
    totalCount: number;
    totalCost: number;
  };
}

export class ProjectResourcesReportService {
  static generatePDFReport(data: ProjectResourceReportData): jsPDF {
    // Sort resources before generating report
    const sortedResources = this.sortResources([...data.resources], data.resourceType);
    const sortedData = { ...data, resources: sortedResources };

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = 15;

    // Set document properties
    doc.setProperties({
      title: `${data.resourceType.charAt(0).toUpperCase() + data.resourceType.slice(1)} Report`,
      subject: `Project Resources - ${data.resourceType}`,
      author: 'SND Rental System',
      creator: 'SND Rental System',
    });

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${data.resourceType.charAt(0).toUpperCase() + data.resourceType.slice(1)} Resources Report`,
      margin,
      yPosition
    );

    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${data.project.name}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Total Items: ${data.summary.totalCount} | Total Cost: SAR ${data.summary.totalCost.toLocaleString()}`, margin, yPosition);
    yPosition += 10;

    // Table headers and column widths (used for all pages)
    const headers = this.getHeaders(data.resourceType);
    const columnWidths = this.getColumnWidths(data.resourceType, contentWidth);
    const startX = margin;
    const headerHeight = 8;
    let xPosition = startX; // Declare in outer scope for use in both header and data rows

    // Function to draw header row
    const drawHeaderRow = (yPos: number) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      xPosition = startX; // Reset for header
      headers.forEach((header, index) => {
        // Draw header cell with dark background
        doc.setFillColor(51, 51, 51); // Dark gray background
        doc.rect(xPosition, yPos - 5, columnWidths[index], headerHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(header, xPosition + 2, yPos, { maxWidth: columnWidths[index] - 4 });
        doc.setTextColor(0, 0, 0);
        xPosition += columnWidths[index];
      });
    };

    // Draw header row on first page
    drawHeaderRow(yPosition);
    yPosition += headerHeight + 2;

    // Draw data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    sortedData.resources.forEach((resource, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 15;
        // Redraw header on new page
        drawHeaderRow(yPosition);
        yPosition += headerHeight + 2;
        // Reset font to normal for data rows after header
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      }

      const rowData = this.formatRowData(resource, data.resourceType);
      xPosition = startX;
      
      // Calculate maximum lines needed for this row
      let maxLines = 1;
      const cellLines: string[][] = [];
      
      rowData.forEach((cell, cellIndex) => {
        const cellText = cell || '-';
        const maxWidth = columnWidths[cellIndex] - 4;
        const lines = doc.splitTextToSize(cellText, maxWidth);
        cellLines.push(lines);
        maxLines = Math.max(maxLines, lines.length);
      });

      // Draw all cells with consistent row height
      rowData.forEach((cell, cellIndex) => {
        // Draw cell border with adjusted height
        const rowHeight = 4 + (maxLines * 3);
        doc.rect(xPosition, yPosition - 5, columnWidths[cellIndex], rowHeight, 'S');
        
        // Draw cell content
        const lines = cellLines[cellIndex];
        lines.forEach((line: string, lineIndex: number) => {
          doc.text(line, xPosition + 2, yPosition + (lineIndex * 3), { 
            maxWidth: columnWidths[cellIndex] - 4 
          });
        });
        
        xPosition += columnWidths[cellIndex];
      });

      // Move to next row with adjusted height
      yPosition += 4 + (maxLines * 3);
    });

    // Add summary at the end
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 15;
    }

    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', margin, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Items: ${data.summary.totalCount}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Total Cost: SAR ${data.summary.totalCost.toLocaleString()}`, margin, yPosition);

    return doc;
  }

  static async downloadPDFReport(
    data: ProjectResourceReportData,
    filename?: string
  ): Promise<void> {
    try {
      const pdf = this.generatePDFReport(data);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${data.resourceType}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw error;
    }
  }

  private static getHeaders(resourceType: string): string[] {
    switch (resourceType) {
      case 'manpower':
        return ['File #', 'Employee Name', 'Job Title', 'Daily Rate', 'Start Date', 'Days', 'Total Cost'];
      case 'equipment':
        return ['Equipment', 'Operator', 'Start Date', 'End Date', 'Usage Hours', 'Hourly Rate', 'Total Cost'];
      case 'material':
        return ['Material', 'Unit', 'Quantity', 'Unit Price', 'Date', 'Total Cost'];
      case 'fuel':
        return ['Fuel Type', 'Liters', 'Price/Liter', 'Total Cost'];
      case 'expense':
        return ['Category', 'Description', 'Amount', 'Date'];
      case 'tasks':
        return ['Title', 'Status', 'Priority', 'Due Date', 'Completion %', 'Assigned To'];
      default:
        return ['Name', 'Description', 'Cost'];
    }
  }

  private static getColumnWidths(resourceType: string, totalWidth: number): number[] {
    // Calculate widths as percentages of total width, then normalize to fit exactly
    let widths: number[];
    
    switch (resourceType) {
      case 'manpower':
        // Optimized: File # (smaller), Employee Name (wider), Job Title, Daily Rate, Start Date, Days, Total Cost
        widths = [20, 65, 32, 30, 28, 16, 30];
        break;
      case 'equipment':
        // Optimized: Equipment, Operator (wider), Start Date, End Date, Usage Hours, Hourly Rate, Total Cost
        widths = [30, 65, 24, 24, 20, 22, 30];
        break;
      case 'material':
        // Optimized: Material (wider), Unit, Quantity, Unit Price, Date, Total Cost
        widths = [50, 20, 18, 25, 25, 28];
        break;
      case 'fuel':
        // Optimized: Fuel Type, Liters, Price/Liter, Total Cost
        widths = [45, 22, 32, 31];
        break;
      case 'expense':
        // Optimized: Category, Description (wider), Amount, Date
        widths = [32, 65, 28, 25];
        break;
      case 'tasks':
        // Optimized: Title (wider), Status, Priority, Due Date, Completion %, Assigned To
        widths = [55, 20, 22, 28, 22, 33];
        break;
      default:
        return [totalWidth / 3, totalWidth / 3, totalWidth / 3];
    }
    
    // Normalize widths to fit exactly within totalWidth
    const sum = widths.reduce((a, b) => a + b, 0);
    return widths.map(w => (w / sum) * totalWidth);
  }

  private static sortResources(resources: any[], resourceType: string): any[] {
    switch (resourceType) {
      case 'manpower':
        return resources.sort((a, b) => {
          const fileA = a.employee_file_number || '-';
          const fileB = b.employee_file_number || '-';
          
          // Handle numeric file numbers
          const numA = parseInt(fileA);
          const numB = parseInt(fileB);
          
          // If both are numeric, compare numerically
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          
          // If one is numeric and the other is not, numeric comes first
          if (!isNaN(numA) && isNaN(numB)) {
            return -1;
          }
          if (isNaN(numA) && !isNaN(numB)) {
            return 1;
          }
          
          // Both are non-numeric (e.g., "-", "EXT-S-14"), sort alphabetically
          return fileA.localeCompare(fileB);
        });

      case 'equipment':
        return resources.sort((a, b) => {
          // Sort by equipment name (extract door number if available)
          const nameA = a.equipment_name || a.name || '';
          const nameB = b.equipment_name || b.name || '';
          
          // Try to extract door number from equipment name (e.g., "1404-DOZER" -> "1404")
          const doorA = a.door_number || this.extractDoorNumber(nameA) || '';
          const doorB = b.door_number || this.extractDoorNumber(nameB) || '';
          
          // Handle numeric door numbers
          const numA = parseInt(doorA);
          const numB = parseInt(doorB);
          
          // If both are numeric, compare numerically
          if (!isNaN(numA) && !isNaN(numB)) {
            const numCompare = numA - numB;
            // If door numbers are equal, sort by full equipment name
            if (numCompare !== 0) return numCompare;
            return nameA.localeCompare(nameB);
          }
          
          // If one is numeric and the other is not, numeric comes first
          if (!isNaN(numA) && isNaN(numB)) {
            return -1;
          }
          if (isNaN(numA) && !isNaN(numB)) {
            return 1;
          }
          
          // Both are non-numeric or empty, sort alphabetically by equipment name
          return nameA.localeCompare(nameB);
        });

      case 'material':
        return resources.sort((a, b) => {
          const nameA = a.material_name || a.name || '';
          const nameB = b.material_name || b.name || '';
          return nameA.localeCompare(nameB);
        });

      case 'fuel':
        return resources.sort((a, b) => {
          const typeA = a.fuel_type || '';
          const typeB = b.fuel_type || '';
          return typeA.localeCompare(typeB);
        });

      case 'expense':
        return resources.sort((a, b) => {
          // Sort by category first, then by date
          const categoryA = a.category || '';
          const categoryB = b.category || '';
          const categoryCompare = categoryA.localeCompare(categoryB);
          if (categoryCompare !== 0) return categoryCompare;
          
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA; // Most recent first
        });

      case 'tasks':
        return resources.sort((a, b) => {
          // Sort by priority first, then by due date
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          if (priorityA !== priorityB) return priorityB - priorityA;
          
          const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
          return dateA - dateB; // Earliest first
        });

      default:
        return resources.sort((a, b) => {
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
        });
    }
  }

  private static extractDoorNumber(equipmentName: string): string | null {
    if (!equipmentName) return null;
    // Try to extract numeric prefix (e.g., "1404-DOZER" -> "1404")
    const match = equipmentName.match(/^(\d+)/);
    return match ? match[1] : null;
  }

  private static formatRowData(resource: any, resourceType: string): string[] {
    const formatDate = (dateStr: string | null | undefined): string => {
      if (!dateStr) return '-';
      try {
        // Handle date strings that are already in YYYY-MM-DD format
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        return format(date, 'yyyy-MM-dd');
      } catch {
        return '-';
      }
    };

    switch (resourceType) {
      case 'manpower':
        return [
          resource.employee_file_number || '-',
          resource.employee?.full_name || resource.employee_name || resource.name || '-',
          resource.job_title || '-',
          resource.daily_rate ? `SAR ${resource.daily_rate.toLocaleString()}` : '-',
          formatDate(resource.start_date),
          resource.total_days?.toString() || '-',
          resource.total_cost ? `SAR ${resource.total_cost.toLocaleString()}` : '-',
        ];
      case 'equipment':
        return [
          resource.equipment_name || resource.name || '-',
          resource.operator_name || '-',
          formatDate(resource.start_date),
          formatDate(resource.end_date),
          resource.usage_hours?.toString() || '-',
          resource.hourly_rate ? `SAR ${resource.hourly_rate.toLocaleString()}` : '-',
          resource.total_cost ? `SAR ${resource.total_cost.toLocaleString()}` : '-',
        ];
      case 'material':
        return [
          resource.material_name || resource.name || '-',
          resource.unit || '-',
          resource.quantity?.toString() || '-',
          resource.unit_price ? `SAR ${resource.unit_price.toLocaleString()}` : '-',
          formatDate(resource.date || resource.orderDate),
          resource.total_cost ? `SAR ${resource.total_cost.toLocaleString()}` : '-',
        ];
      case 'fuel':
        return [
          resource.fuel_type || '-',
          resource.liters?.toString() || '-',
          resource.price_per_liter ? `SAR ${resource.price_per_liter.toLocaleString()}` : '-',
          resource.total_cost ? `SAR ${resource.total_cost.toLocaleString()}` : '-',
        ];
      case 'expense':
        return [
          resource.category || '-',
          resource.expense_description || resource.description || '-',
          resource.amount ? `SAR ${resource.amount.toLocaleString()}` : '-',
          formatDate(resource.date || resource.expenseDate || resource.expense_date),
        ];
      case 'tasks':
        return [
          resource.title || resource.name || '-',
          resource.status || '-',
          resource.priority || '-',
          formatDate(resource.due_date),
          resource.completion_percentage ? `${resource.completion_percentage}%` : '-',
          resource.assigned_to?.name || 'Unassigned',
        ];
      default:
        return [
          resource.name || '-',
          resource.description || '-',
          resource.total_cost ? `SAR ${resource.total_cost.toLocaleString()}` : '-',
        ];
    }
  }
}

