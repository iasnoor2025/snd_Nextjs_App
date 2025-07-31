import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ToastService } from './toast-service';

export interface PDFOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  orientation?: 'portrait' | 'landscape';
  unit?: 'mm' | 'cm' | 'in' | 'pt';
  format?: 'a4' | 'a3' | 'letter' | 'legal';
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  lineHeight?: number;
}

export interface TableColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

export interface TableData {
  columns: TableColumn[];
  data: any[];
  title?: string;
  subtitle?: string;
}

export class PDFService {
  private doc: jsPDF;
  private options: PDFOptions;
  private currentY: number = 0;
  private pageWidth: number = 0;
  private pageHeight: number = 0;
  private margin: { top: number; right: number; bottom: number; left: number };

  constructor(options: PDFOptions = {}) {
    this.options = {
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      fontSize: 12,
      fontFamily: 'helvetica',
      color: '#000000',
      lineHeight: 1.2,
      ...options,
    };

    this.margin = {
      top: this.options.margin?.top || 20,
      right: this.options.margin?.right || 20,
      bottom: this.options.margin?.bottom || 20,
      left: this.options.margin?.left || 20,
    };

    this.doc = new jsPDF({
      orientation: this.options.orientation,
      unit: this.options.unit,
      format: this.options.format,
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = this.margin.top;

    // Set document properties
    if (this.options.title) this.doc.setProperties({ title: this.options.title });
    if (this.options.author) this.doc.setProperties({ author: this.options.author });
    if (this.options.subject) this.doc.setProperties({ subject: this.options.subject });
    if (this.options.keywords) this.doc.setProperties({ keywords: this.options.keywords.join(', ') });

    // Set initial font
    this.setFont(this.options.fontSize!, this.options.fontFamily!);
    this.setTextColor(this.options.color!);
  }

  // ========================================
  // BASIC TEXT OPERATIONS
  // ========================================

  setFont(size: number, family: string = 'helvetica') {
    this.doc.setFontSize(size);
    this.doc.setFont(family);
  }

  setTextColor(color: string) {
    const rgb = this.hexToRgb(color);
    if (rgb) {
      this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
    }
  }

  setFillColor(color: string) {
    const rgb = this.hexToRgb(color);
    if (rgb) {
      this.doc.setFillColor(rgb.r, rgb.g, rgb.b);
    }
  }

  addText(text: string, x?: number, y?: number, options?: { align?: 'left' | 'center' | 'right' }) {
    const textX = x ?? this.margin.left;
    const textY = y ?? this.currentY;
    
    this.doc.text(text, textX, textY, { align: options?.align || 'left' });
    
    if (!y) {
      this.currentY += this.options.fontSize! * this.options.lineHeight!;
    }
  }

  addTitle(text: string, level: 1 | 2 | 3 = 1) {
    const sizes = { 1: 18, 2: 14, 3: 12 };
    const size = sizes[level];
    
    this.setFont(size, 'helvetica-bold');
    this.addText(text);
    this.setFont(this.options.fontSize!, this.options.fontFamily!);
    this.addSpace(5);
  }

  addParagraph(text: string, align: 'left' | 'center' | 'right' = 'left') {
    const words = text.split(' ');
    const lineWidth = this.pageWidth - this.margin.left - this.margin.right;
    let line = '';
    let lines: string[] = [];

    for (let word of words) {
      const testLine = line + word + ' ';
      const testWidth = this.doc.getTextWidth(testLine);
      
      if (testWidth > lineWidth && line !== '') {
        lines.push(line);
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    for (let line of lines) {
      this.addText(line.trim(), undefined, undefined, { align });
    }
  }

  addSpace(height: number) {
    this.currentY += height;
  }

  addPageBreak() {
    this.doc.addPage();
    this.currentY = this.margin.top;
  }

  // ========================================
  // TABLE OPERATIONS
  // ========================================

  addTable(tableData: TableData) {
    if (tableData.title) {
      this.addTitle(tableData.title, 2);
    }
    
    if (tableData.subtitle) {
      this.addText(tableData.subtitle);
      this.addSpace(5);
    }

    const tableWidth = this.pageWidth - this.margin.left - this.margin.right;
    const columnWidths = this.calculateColumnWidths(tableData.columns, tableWidth);
    
    // Draw header
    this.drawTableHeader(tableData.columns, columnWidths);
    
    // Draw data rows
    this.drawTableRows(tableData.data, tableData.columns, columnWidths);
  }

  private calculateColumnWidths(columns: TableColumn[], totalWidth: number): number[] {
    const totalSpecifiedWidth = columns.reduce((sum, col) => sum + (col.width || 0), 0);
    const remainingWidth = totalWidth - totalSpecifiedWidth;
    const unspecifiedColumns = columns.filter(col => !col.width);
    const equalWidth = unspecifiedColumns.length > 0 ? remainingWidth / unspecifiedColumns.length : 0;

    return columns.map(col => col.width || equalWidth);
  }

  private drawTableHeader(columns: TableColumn[], widths: number[]) {
    const headerHeight = 10;
    let x = this.margin.left;
    
    // Draw header background
    this.setFillColor('#f3f4f6');
    this.doc.rect(x, this.currentY - headerHeight, this.pageWidth - this.margin.left - this.margin.right, headerHeight, 'F');
    
    // Draw header text
    this.setFont(10, 'helvetica-bold');
    this.setTextColor('#374151');
    
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const width = widths[i];
      const text = column.header;
      const textX = x + (width / 2);
      
      this.doc.text(text, textX, this.currentY - 3, { align: 'center' });
      x += width;
    }
    
    this.setFont(this.options.fontSize!, this.options.fontFamily!);
    this.setTextColor(this.options.color!);
    this.currentY += 5;
  }

  private drawTableRows(data: any[], columns: TableColumn[], widths: number[]) {
    const rowHeight = 8;
    
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      
      // Check if we need a new page
      if (this.currentY + rowHeight > this.pageHeight - this.margin.bottom) {
        this.addPageBreak();
        this.drawTableHeader(columns, widths);
      }
      
      let x = this.margin.left;
      
      // Draw row background (alternating)
      if (rowIndex % 2 === 0) {
        this.setFillColor('#f9fafb');
        this.doc.rect(x, this.currentY - rowHeight, this.pageWidth - this.margin.left - this.margin.right, rowHeight, 'F');
      }
      
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const width = widths[i];
        const value = row[column.key];
        const text = column.format ? column.format(value) : String(value || '');
        const textX = x + (width / 2);
        
        this.doc.text(text, textX, this.currentY - 3, { align: column.align || 'left' });
        x += width;
      }
      
      this.currentY += rowHeight;
    }
  }

  // ========================================
  // CHART OPERATIONS
  // ========================================

  addChart(chartElement: HTMLElement, options?: { width?: number; height?: number }) {
    return new Promise<void>((resolve, reject) => {
      html2canvas(chartElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        ...options,
      }).then(canvas => {
        try {
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = options?.width || 180;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Check if we need a new page
          if (this.currentY + imgHeight > this.pageHeight - this.margin.bottom) {
            this.addPageBreak();
          }
          
          this.doc.addImage(imgData, 'PNG', this.margin.left, this.currentY, imgWidth, imgHeight);
          this.currentY += imgHeight + 10;
          resolve();
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  // ========================================
  // DOCUMENT OPERATIONS
  // ========================================

  addHeader(title: string, subtitle?: string, logo?: string) {
    // Add logo if provided
    if (logo) {
      try {
        this.doc.addImage(logo, 'PNG', this.margin.left, this.currentY, 30, 30);
        this.currentY += 35;
      } catch (error) {
        console.warn('Failed to add logo:', error);
      }
    }
    
    // Add title
    this.addTitle(title, 1);
    
    // Add subtitle
    if (subtitle) {
      this.addText(subtitle);
      this.addSpace(10);
    }
  }

  addFooter(text: string, pageNumbers: boolean = true) {
    const footerY = this.pageHeight - this.margin.bottom;
    
    this.setFont(8, 'helvetica');
    this.setTextColor('#6b7280');
    
    // Add footer text
    this.doc.text(text, this.margin.left, footerY);
    
    // Add page numbers
    if (pageNumbers) {
      const pageText = `Page ${this.doc.getCurrentPageInfo().pageNumber}`;
      this.doc.text(pageText, this.pageWidth - this.margin.right, footerY, { align: 'right' });
    }
    
    this.setFont(this.options.fontSize!, this.options.fontFamily!);
    this.setTextColor(this.options.color!);
  }

  addPageNumber() {
    const pageInfo = this.doc.getCurrentPageInfo();
    const pageText = `Page ${pageInfo.pageNumber}`;
    const pageY = this.pageHeight - this.margin.bottom;
    
    this.setFont(8, 'helvetica');
    this.setTextColor('#6b7280');
    this.doc.text(pageText, this.pageWidth - this.margin.right, pageY, { align: 'right' });
    this.setFont(this.options.fontSize!, this.options.fontFamily!);
    this.setTextColor(this.options.color!);
  }

  // ========================================
  // EXPORT OPERATIONS
  // ========================================

  save(filename: string) {
    try {
      this.doc.save(filename);
      ToastService.exportSuccess('PDF');
    } catch (error) {
      console.error('PDF save error:', error);
      ToastService.exportError('PDF', 'Failed to save document');
    }
  }

  getBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const blob = this.doc.output('blob');
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    });
  }

  getDataURL(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const dataURL = this.doc.output('dataurlstring');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // ========================================
  // TEMPLATE METHODS
  // ========================================

  static generateInvoice(data: any): PDFService {
    const pdf = new PDFService({
      title: 'Invoice',
      author: 'SND Rental Management',
      format: 'a4',
    });

    // Header
    pdf.addHeader('INVOICE', `Invoice #${data.invoiceNumber}`, data.companyLogo);
    
    // Company and Customer Info
    pdf.addText('Bill To:', pdf.margin.left, pdf.currentY);
    pdf.addText(data.customerName);
    pdf.addText(data.customerAddress);
    pdf.addText(data.customerPhone);
    
    pdf.addSpace(10);
    
    // Invoice Details
    pdf.addText(`Invoice Date: ${data.invoiceDate}`);
    pdf.addText(`Due Date: ${data.dueDate}`);
    pdf.addText(`Payment Terms: ${data.paymentTerms}`);
    
    pdf.addSpace(15);
    
    // Items Table
    const tableData: TableData = {
      title: 'Invoice Items',
      columns: [
        { header: 'Description', key: 'description', width: 80 },
        { header: 'Quantity', key: 'quantity', width: 30, align: 'center' },
        { header: 'Rate', key: 'rate', width: 30, align: 'right', format: (value) => `$${value.toFixed(2)}` },
        { header: 'Amount', key: 'amount', width: 40, align: 'right', format: (value) => `$${value.toFixed(2)}` },
      ],
      data: data.items,
    };
    
    pdf.addTable(tableData);
    
    // Totals
    pdf.addSpace(10);
    pdf.addText(`Subtotal: $${data.subtotal.toFixed(2)}`, undefined, undefined, { align: 'right' });
    pdf.addText(`Tax: $${data.tax.toFixed(2)}`, undefined, undefined, { align: 'right' });
    pdf.addText(`Total: $${data.total.toFixed(2)}`, undefined, undefined, { align: 'right' });
    
    // Footer
    pdf.addFooter('Thank you for your business!');
    
    return pdf;
  }

  static generatePayslip(data: any): PDFService {
    const pdf = new PDFService({
      title: 'Payslip',
      author: 'SND Rental Management',
      format: 'a4',
    });

    // Header
    pdf.addHeader('PAYSLIP', `Period: ${data.payPeriod}`, data.companyLogo);
    
    // Employee Info
    pdf.addText('Employee Information:', pdf.margin.left, pdf.currentY);
    pdf.addText(`Name: ${data.employeeName}`);
    pdf.addText(`Employee ID: ${data.employeeId}`);
    pdf.addText(`Department: ${data.department}`);
    pdf.addText(`Position: ${data.position}`);
    
    pdf.addSpace(15);
    
    // Earnings Table
    const earningsData: TableData = {
      title: 'Earnings',
      columns: [
        { header: 'Description', key: 'description', width: 100 },
        { header: 'Amount', key: 'amount', width: 50, align: 'right', format: (value) => `$${value.toFixed(2)}` },
      ],
      data: data.earnings,
    };
    
    pdf.addTable(earningsData);
    
    pdf.addSpace(10);
    
    // Deductions Table
    const deductionsData: TableData = {
      title: 'Deductions',
      columns: [
        { header: 'Description', key: 'description', width: 100 },
        { header: 'Amount', key: 'amount', width: 50, align: 'right', format: (value) => `$${value.toFixed(2)}` },
      ],
      data: data.deductions,
    };
    
    pdf.addTable(deductionsData);
    
    // Net Pay
    pdf.addSpace(10);
    pdf.addText(`Net Pay: $${data.netPay.toFixed(2)}`, undefined, undefined, { align: 'right' });
    
    // Footer
    pdf.addFooter('This is a computer generated document.');
    
    return pdf;
  }

  static generateReport(data: any, title: string): PDFService {
    const pdf = new PDFService({
      title,
      author: 'SND Rental Management',
      format: 'a4',
    });

    // Header
    pdf.addHeader(title, `Generated on ${new Date().toLocaleDateString()}`);
    
    // Summary
    if (data.summary) {
      pdf.addTitle('Summary', 2);
      pdf.addParagraph(data.summary);
      pdf.addSpace(15);
    }
    
    // Data Table
    if (data.table) {
      pdf.addTable(data.table);
    }
    
    // Charts
    if (data.charts) {
      for (const chart of data.charts) {
        pdf.addSpace(10);
        pdf.addTitle(chart.title, 3);
        // Note: Chart rendering would need to be implemented separately
        // as it requires DOM elements to be rendered first
      }
    }
    
    // Footer
    pdf.addFooter('Report generated by SND Rental Management System');
    
    return pdf;
  }
}

export default PDFService; 