import { jsPDF } from 'jspdf';

export interface EmployeeAdvanceReportData {
  summary_stats: {
    total_advances: number;
    total_amount: number;
    total_repaid: number;
    total_remaining: number;
    avg_advance: number;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    paid_count: number;
  };
  advance_details: Array<{
    id: number;
    employee_id: number;
    employee_name: string;
    employee_file_number: string | null;
    amount: number;
    purpose: string;
    reason: string | null;
    status: string;
    repaid_amount: number;
    remaining_balance: number;
    monthly_deduction: number | null;
    estimated_months: number | null;
    created_at: string;
    payment_date: string | null;
    repayment_date: string | null;
    approved_at: string | null;
    approved_by: number | null;
    notes: string | null;
  }>;
  generated_at?: string;
  parameters?: any;
}

export class EmployeeAdvanceReportPDFService {
  static generateEmployeeAdvanceReportPDF(data: EmployeeAdvanceReportData): jsPDF {
    if (!data) {
      throw new Error('Employee advance report data is required');
    }

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table display

    // Set document properties
    doc.setProperties({
      title: 'Employee Advance Report',
      subject: 'Employee Advance Payment Report',
      author: 'SND Rental System',
      creator: 'SND Rental System',
    });

    let yPosition = 15;
    const pageWidth = 297; // Landscape A4 width
    const pageHeight = 210; // Landscape A4 height
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Advance Report', margin, yPosition);
    yPosition += 10;

    // Generated date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const generatedDate = data.generated_at 
      ? new Date(data.generated_at).toLocaleString()
      : new Date().toLocaleString();
    doc.text(`Generated on: ${generatedDate}`, margin, yPosition);
    yPosition += 8;

    // Summary Statistics
    if (data.summary_stats) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', margin, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const stats = data.summary_stats;
      const statsLeft = margin;
      const statsRight = pageWidth / 2;
      let statsY = yPosition;

      doc.text(`Total Advances: ${stats.total_advances || 0}`, statsLeft, statsY);
      statsY += 6;
      doc.text(`Total Amount: SAR ${Number(stats.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, statsLeft, statsY);
      statsY += 6;
      doc.text(`Total Repaid: SAR ${Number(stats.total_repaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, statsLeft, statsY);
      statsY += 6;
      doc.text(`Total Remaining: SAR ${Number(stats.total_remaining || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, statsLeft, statsY);
      statsY += 6;
      doc.text(`Pending: ${stats.pending_count || 0}`, statsRight, yPosition);
      statsY = yPosition + 6;
      doc.text(`Approved: ${stats.approved_count || 0}`, statsRight, statsY);
      statsY += 6;
      doc.text(`Rejected: ${stats.rejected_count || 0}`, statsRight, statsY);
      statsY += 6;
      doc.text(`Paid: ${stats.paid_count || 0}`, statsRight, statsY);

      yPosition = statsY + 10;
    }

    // Advance Details Table
    if (data.advance_details && data.advance_details.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Advance Details', margin, yPosition);
      yPosition += 7;

      // Table headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const headerY = yPosition;
      const colWidths = [35, 25, 25, 30, 20, 20, 25, 25]; // Column widths
      const colPositions = [margin];
      for (let i = 1; i < colWidths.length; i++) {
        colPositions.push(colPositions[i - 1] + colWidths[i - 1]);
      }

      const headers = ['Employee', 'File #', 'Amount', 'Purpose', 'Status', 'Repaid', 'Remaining', 'Date'];
      headers.forEach((header, index) => {
        doc.text(header, colPositions[index], headerY);
      });

      // Draw header line
      doc.setLineWidth(0.5);
      doc.line(margin, headerY + 3, pageWidth - margin, headerY + 3);
      yPosition = headerY + 8;

      // Table rows
      doc.setFont('helvetica', 'normal');
      data.advance_details.forEach((advance, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 15;
          // Redraw headers on new page
          doc.setFont('helvetica', 'bold');
          headers.forEach((header, idx) => {
            doc.text(header, colPositions[idx], yPosition);
          });
          doc.line(margin, yPosition + 3, pageWidth - margin, yPosition + 3);
          yPosition += 8;
          doc.setFont('helvetica', 'normal');
        }

        const rowData = [
          advance.employee_name || 'N/A',
          advance.employee_file_number || 'N/A',
          `SAR ${Number(advance.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          (advance.purpose || advance.reason || 'N/A').substring(0, 20), // Truncate if too long
          advance.status || 'N/A',
          `SAR ${Number(advance.repaid_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `SAR ${Number(advance.remaining_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          advance.created_at ? new Date(advance.created_at).toLocaleDateString() : 'N/A',
        ];

        rowData.forEach((cell, cellIndex) => {
          // Wrap text if needed
          const maxWidth = colWidths[cellIndex] - 2;
          const lines = doc.splitTextToSize(cell, maxWidth);
          doc.text(lines[0], colPositions[cellIndex], yPosition);
        });

        yPosition += 7;

        // Draw row separator
        if (index < data.advance_details.length - 1) {
          doc.setLineWidth(0.1);
          doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
        }
      });
    }

    return doc;
  }

  static async generateEmployeeAdvanceReportPDFBlob(data: EmployeeAdvanceReportData): Promise<Blob> {
    const pdf = this.generateEmployeeAdvanceReportPDF(data);
    return pdf.output('blob');
  }

  static async downloadEmployeeAdvanceReportPDF(
    data: EmployeeAdvanceReportData | any,
    filename?: string
  ): Promise<void> {
    try {
      // Extract data if wrapped in response structure
      const reportData: EmployeeAdvanceReportData = data.data || data;

      const pdf = this.generateEmployeeAdvanceReportPDF(reportData);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `employee-advance-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating employee advance PDF:', error);
      throw error;
    }
  }
}

