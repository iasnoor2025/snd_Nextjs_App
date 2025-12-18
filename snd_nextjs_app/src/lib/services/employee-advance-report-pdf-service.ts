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
  /**
   * Load image as data URL for embedding in PDF
   */
  private static async loadImageAsDataURL(imagePath: string): Promise<string | null> {
    try {
      const response = await fetch(imagePath);
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Error loading image:', error);
      return null;
    }
  }

  /**
   * Get company name from settings
   */
  private static async getCompanyName(): Promise<string> {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        const companyName = data.settings?.find((s: any) => s.key === 'company.name')?.value;
        return companyName || 'SND Equipment Rental Company';
      }
    } catch (error) {
      console.warn('Error fetching company name:', error);
    }
    return 'SND Equipment Rental Company';
  }

  /**
   * Get company logo from settings
   */
  private static async getCompanyLogo(): Promise<string> {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        const logo = data.settings?.find((s: any) => s.key === 'company.logo')?.value;
        return logo || '/snd-logo.png';
      }
    } catch (error) {
      console.warn('Error fetching company logo:', error);
    }
    return '/snd-logo.png';
  }

  /**
   * Draw page header with logo and company name
   */
  private static drawPageHeader(
    doc: jsPDF,
    pageWidth: number,
    margin: number,
    companyName: string,
    logoDataUrl: string | null,
    generatedDate: string,
    isFirstPage: boolean = true
  ): void {
    // Header with background
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    
    // Add logo if available
    if (logoDataUrl) {
      const logoWidth = 18;
      const logoHeight = 18;
      const logoX = margin + 5;
      const logoY = 6;
      try {
        doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.warn('Error adding logo to PDF:', error);
      }
    }

    // Company name next to logo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const companyNameX = logoDataUrl ? margin + 28 : margin;
    doc.text(companyName, companyNameX, 12);
    
    // Report title on the right
    doc.setFontSize(14);
    doc.text('Employee Advance Report', pageWidth - margin - 5, 12, { align: 'right' });
    
    // Generated date below company name (only on first page)
    if (isFirstPage) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${generatedDate}`, companyNameX, 20);
    }
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
  }

  static async generateEmployeeAdvanceReportPDF(data: EmployeeAdvanceReportData): Promise<jsPDF> {
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

    // Load company logo and name
    const companyName = await this.getCompanyName();
    const logoPath = await this.getCompanyLogo();
    const logoDataUrl = await this.loadImageAsDataURL(logoPath);

    // Generated date
    const generatedDate = data.generated_at 
      ? new Date(data.generated_at).toLocaleString()
      : new Date().toLocaleString();

    // Draw header on first page
    this.drawPageHeader(doc, pageWidth, margin, companyName, logoDataUrl, generatedDate, true);
    yPosition = 35;


    // Summary Statistics Box
    if (data.summary_stats) {
      const statsBoxY = yPosition;
      const statsBoxHeight = 35;
      
      // Draw summary box with border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(margin, statsBoxY, contentWidth, statsBoxHeight);
      
      // Title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', margin + 5, statsBoxY + 7);
      
      // Stats content
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const stats = data.summary_stats;
      const statsLeft = margin + 5;
      const statsRight = pageWidth / 2 + 10;
      let statsY = statsBoxY + 15;

      doc.text(`Total Advances: ${stats.total_advances || 0}`, statsLeft, statsY);
      statsY += 5;
      doc.text(`Total Amount: SAR ${Number(stats.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, statsLeft, statsY);
      statsY += 5;
      doc.text(`Total Repaid: SAR ${Number(stats.total_repaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, statsLeft, statsY);
      statsY += 5;
      doc.text(`Total Remaining: SAR ${Number(stats.total_remaining || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, statsLeft, statsY);
      
      statsY = statsBoxY + 15;
      doc.text(`Pending: ${stats.pending_count || 0}`, statsRight, statsY);
      statsY += 5;
      doc.text(`Approved: ${stats.approved_count || 0}`, statsRight, statsY);
      statsY += 5;
      doc.text(`Rejected: ${stats.rejected_count || 0}`, statsRight, statsY);
      statsY += 5;
      doc.text(`Paid: ${stats.paid_count || 0}`, statsRight, statsY);

      yPosition = statsBoxY + statsBoxHeight + 10;
    }

    // Advance Details Table
    if (data.advance_details && data.advance_details.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Advance Details', margin, yPosition);
      yPosition += 7;

      // Table headers with background
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const headerY = yPosition;
      const headerHeight = 8;
      
      // Header background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, headerY - 5, contentWidth, headerHeight, 'F');
      
      // Column widths - SI# first, then File #, then Employee
      const colWidths = [12, 20, 35, 25, 30, 18, 22, 22, 22]; // SI#, File #, Employee, Amount, Purpose, Status, Repaid, Remaining, Date
      const colPositions = [margin];
      for (let i = 1; i < colWidths.length; i++) {
        colPositions.push(colPositions[i - 1] + colWidths[i - 1]);
      }

      const headers = ['SI#', 'File #', 'Employee', 'Amount', 'Purpose', 'Status', 'Repaid', 'Remaining', 'Date'];
      headers.forEach((header, index) => {
        doc.text(header, colPositions[index] + 2, headerY);
      });

      // Draw header border (bottom line)
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.line(margin, headerY + 3, pageWidth - margin, headerY + 3);
      
      // Draw vertical lines for header columns
      colPositions.forEach((pos, idx) => {
        if (idx > 0) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.line(pos, headerY - 5, pos, headerY + 3);
        }
      });
      
      yPosition = headerY + 8;
      const rowHeight = 6;
      let tableStartY = headerY - 5;

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      data.advance_details.forEach((advance, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 15) {
          doc.addPage();
          
          // Draw page header on new page
          this.drawPageHeader(doc, pageWidth, margin, companyName, logoDataUrl, generatedDate, false);
          
          yPosition = 35;
          tableStartY = yPosition - 5;
          
          // Redraw table headers on new page
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, yPosition - 5, contentWidth, headerHeight, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          headers.forEach((header, idx) => {
            doc.text(header, colPositions[idx] + 2, yPosition);
          });
          
          // Draw header borders
          doc.setDrawColor(150, 150, 150);
          doc.setLineWidth(0.5);
          doc.line(margin, yPosition + 3, pageWidth - margin, yPosition + 3);
          
          // Draw vertical lines for header
          colPositions.forEach((pos, idx) => {
            if (idx > 0) {
              doc.setDrawColor(200, 200, 200);
              doc.setLineWidth(0.2);
              doc.line(pos, yPosition - 5, pos, yPosition + 3);
            }
          });
          
          yPosition += 8;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
        }

        const rowY = yPosition - 4;
        const cellHeight = rowHeight;

        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, rowY, contentWidth, cellHeight, 'F');
        }

        // Draw vertical column lines
        colPositions.forEach((pos, idx) => {
          if (idx > 0) {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.line(pos, rowY, pos, rowY + cellHeight);
          }
        });

        const rowData = [
          (index + 1).toString(), // Serial number
          advance.employee_file_number || 'N/A', // File # comes after SI#
          advance.employee_name || 'N/A',
          `SAR ${Number(advance.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          (advance.purpose || advance.reason || 'N/A').substring(0, 18), // Truncate if too long
          advance.status || 'N/A',
          `SAR ${Number(advance.repaid_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `SAR ${Number(advance.remaining_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          advance.created_at ? new Date(advance.created_at).toLocaleDateString() : 'N/A',
        ];

        rowData.forEach((cell, cellIndex) => {
          // Wrap text if needed
          const maxWidth = colWidths[cellIndex] - 4;
          const lines = doc.splitTextToSize(cell, maxWidth);
          doc.text(lines[0], colPositions[cellIndex] + 2, yPosition);
        });

        // Draw horizontal row separator
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);

        yPosition += rowHeight;
      });

      // Draw outer table border
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      const tableEndY = yPosition - 2;
      
      // Top border
      doc.line(margin, tableStartY, pageWidth - margin, tableStartY);
      // Bottom border
      doc.line(margin, tableEndY, pageWidth - margin, tableEndY);
      // Left border
      doc.line(margin, tableStartY, margin, tableEndY);
      // Right border
      doc.line(pageWidth - margin, tableStartY, pageWidth - margin, tableEndY);
      
      // Draw vertical lines for first and last columns
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      colPositions.forEach((pos) => {
        doc.line(pos, tableStartY, pos, tableEndY);
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
      doc.text(
        'SND Rental System - Employee Advance Report',
        pageWidth / 2,
        pageHeight - 2,
        { align: 'center' }
      );
      doc.setTextColor(0, 0, 0);
    }

    return doc;
  }

  static async generateEmployeeAdvanceReportPDFBlob(data: EmployeeAdvanceReportData): Promise<Blob> {
    const pdf = await this.generateEmployeeAdvanceReportPDF(data);
    return pdf.output('blob');
  }

  static async downloadEmployeeAdvanceReportPDF(
    data: EmployeeAdvanceReportData | any,
    filename?: string
  ): Promise<void> {
    try {
      // Extract data if wrapped in response structure
      const reportData: EmployeeAdvanceReportData = data.data || data;

      const pdf = await this.generateEmployeeAdvanceReportPDF(reportData);
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

