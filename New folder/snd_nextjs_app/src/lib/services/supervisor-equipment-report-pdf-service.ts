import { jsPDF } from 'jspdf';

export interface SupervisorEquipmentReportData {
  supervisor_groups: Array<{
    supervisor_id: number;
    supervisor_name: string;
    supervisor_file_number: string | null;
    equipment_count: number;
    total_items: number;
    equipment: Array<{
      equipment_id: number;
      equipment_name: string;
      equipment_istimara: string | null;
      rental_id: number;
      rental_number: string;
      rental_status: string;
      customer_id: number | null;
      customer_name: string | null;
      operator_id: number | null;
      operator_name: string | null;
      item_status: string;
      item_start_date: string | null;
      item_completed_date: string | null;
      display_name?: string;
    }>;
  }>;
  summary_stats: {
    total_supervisors: number;
    total_equipment: number;
    total_items: number;
    average_equipment_per_supervisor: string;
  };
  generated_at?: string;
  parameters?: any;
}

export class SupervisorEquipmentReportPDFService {
  static generateSupervisorEquipmentReportPDF(data: SupervisorEquipmentReportData): jsPDF {
    if (!data) {
      throw new Error('Supervisor equipment report data is required');
    }
    
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    
    // Set document properties
    doc.setProperties({
      title: 'Supervisor Equipment Report',
      subject: 'Supervisor Equipment Management Report',
      author: 'SND Rental System',
      creator: 'SND Rental System',
    });

    let yPosition = 15;
    const pageWidth = 297; // Landscape A4 width
    const pageHeight = 210; // Landscape A4 height
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Supervisor Equipment Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Company info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('SND Equipment Rental Company', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    doc.text('Kingdom of Saudi Arabia', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Generation info
    doc.setFontSize(8);
    const generatedAt = data.generated_at || new Date().toISOString();
    doc.text(`Generated: ${new Date(generatedAt).toLocaleString()}`, margin, yPosition);
    yPosition += 4;

    // Parameters
    if (data.parameters) {
      let paramText = 'Filters: ';
      if (data.parameters.status && data.parameters.status !== 'all') {
        paramText += `Status: ${data.parameters.status}`;
      }
      if (data.parameters.supervisorId && data.parameters.supervisorId !== 'all') {
        paramText += ` | Supervisor: ${data.parameters.supervisorId}`;
      }
      doc.text(paramText, margin, yPosition);
      yPosition += 4;
    }

    // Summary Statistics
    if (data.summary_stats) {
      yPosition += 3;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const stats = data.summary_stats;
      doc.text(`Total Supervisors: ${stats.total_supervisors || 0}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Total Equipment: ${stats.total_equipment || 0}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Total Items: ${stats.total_items || 0}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Average Equipment per Supervisor: ${stats.average_equipment_per_supervisor || 0}`, margin, yPosition);
      yPosition += 6;
    }

    // Supervisor Groups
    if (data.supervisor_groups && data.supervisor_groups.length > 0) {
      let globalSerialNumber = 1; // Global serial number counter
      
      data.supervisor_groups.forEach((supervisor, supervisorIndex) => {
        // Check if we need a new page (landscape height is 210mm, leave 10mm margin at bottom)
        if (yPosition > 200) {
          doc.addPage('l', 'a4'); // Add landscape page
          yPosition = 15;
        }

        // Supervisor Header
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        const supervisorTitle = `${supervisor.supervisor_name}${supervisor.supervisor_file_number ? ` (File: ${supervisor.supervisor_file_number})` : ''} - ${supervisor.equipment_count} Equipment`;
        doc.text(supervisorTitle, margin, yPosition);
        yPosition += 6;

        if (supervisor.equipment && supervisor.equipment.length > 0) {
          // Equipment table headers - optimized for landscape with serial #
          let tableStartY = yPosition;
          const rowHeight = 5;
          const colWidths = [12, 60, 35, 30, 28, 35, 22, 25]; // Serial #, Equipment, Customer Name, Rental #, Rental Status, Operator, Item Status, Start Date (total: 247mm)
          const headers = ['Serial #', 'Equipment', 'Customer Name', 'Rental #', 'Rental Status', 'Operator', 'Item Status', 'Start Date'];
          
          // Draw table header
          doc.setFillColor(52, 152, 219);
          doc.rect(margin, tableStartY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          let xPos = margin + 2;
          headers.forEach((header, index) => {
            doc.text(header, xPos, tableStartY + 3.5);
            xPos += colWidths[index];
          });

          // Draw table rows
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          let rowIndex = 0; // Track row index for this supervisor's table
          supervisor.equipment.forEach((equipment, index) => {
            let currentRowY = tableStartY + rowHeight + (rowIndex * rowHeight);
            
            // Check if we need a new page for this row (landscape height is 210mm)
            if (currentRowY + rowHeight > 200) {
              doc.addPage('l', 'a4'); // Add landscape page
              yPosition = 15;
              tableStartY = yPosition;
              rowIndex = 0; // Reset row index for new page
              // Redraw header on new page
              doc.setFillColor(52, 152, 219);
              doc.rect(margin, yPosition, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(7);
              xPos = margin + 2;
              headers.forEach((header, hIndex) => {
                doc.text(header, xPos, yPosition + 3.5);
                xPos += colWidths[hIndex];
              });
              doc.setTextColor(0, 0, 0);
              doc.setFont('helvetica', 'normal');
              yPosition += rowHeight;
              currentRowY = tableStartY + rowHeight + (rowIndex * rowHeight);
            }

            // Alternate row colors
            if (rowIndex % 2 === 0) {
              doc.setFillColor(245, 245, 245);
              doc.rect(margin, currentRowY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
            }

            const rowData = [
              globalSerialNumber.toString(), // Serial number
              equipment.display_name || equipment.equipment_name || 'N/A',
              equipment.customer_name || 'N/A',
              equipment.rental_number || 'N/A',
              equipment.rental_status || 'N/A',
              equipment.operator_name || 'No Operator',
              equipment.item_status || 'N/A',
              equipment.item_start_date ? new Date(equipment.item_start_date).toLocaleDateString() : 'N/A'
            ];

            xPos = margin + 2;
            rowData.forEach((cell, cellIndex) => {
              // Truncate long text
              const maxWidth = colWidths[cellIndex] - 3;
              let cellText = String(cell);
              if (cellIndex === 0) {
                // Serial number - center align
                doc.text(cellText, xPos + (colWidths[cellIndex] / 2), currentRowY + 3.5, { align: 'center' });
              } else if (doc.getTextWidth(cellText) > maxWidth) {
                cellText = doc.splitTextToSize(cellText, maxWidth)[0] + '...';
                doc.text(cellText, xPos, currentRowY + 3.5);
              } else {
                doc.text(cellText, xPos, currentRowY + 3.5);
              }
              xPos += colWidths[cellIndex];
            });
            
            globalSerialNumber++; // Increment serial number
            rowIndex++; // Increment row index
          });

          yPosition = tableStartY + rowHeight + (rowIndex * rowHeight) + 5;
        } else {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text('No equipment assigned', margin, yPosition);
          yPosition += 6;
        }

        // Add minimal spacing between supervisors
        yPosition += 3;
      });
    }

    return doc;
  }

  static async downloadSupervisorEquipmentReportPDF(
    data: SupervisorEquipmentReportData | any,
    filename?: string
  ): Promise<void> {
    try {
      // Extract data if wrapped in response structure
      const reportData: SupervisorEquipmentReportData = data.data || data;
      
      const pdf = this.generateSupervisorEquipmentReportPDF(reportData);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `supervisor-equipment-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating supervisor equipment PDF:', error);
      throw error;
    }
  }
}

