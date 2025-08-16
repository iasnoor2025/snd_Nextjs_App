import { LogoLoader } from './logo-loader';

// Dynamic import for jsPDF to avoid server-side issues
let jsPDF: any = null;

const loadJsPDF = async () => {
  if (!jsPDF) {
    try {
      const { jsPDF: jsPDFModule } = await import('jspdf');
      jsPDF = jsPDFModule;
    } catch (error) {
      console.error('Failed to load jsPDF:', error);
      throw new Error('jsPDF library not available');
    }
  }
  return jsPDF;
};

interface QuotationData {
  quotationNumber: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    company?: string;
    vat?: string;
  };
  rentalItems: Array<{
    id: number;
    rentalId: number;
    equipmentId: number;
    equipmentName: string;
    unitPrice: string;
    totalPrice: string;
    rateType: string;
    operatorId?: number;
    status: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
    equipmentModelNumber?: string;
    equipmentCategoryId?: number;
    quantity?: number;
    rentalPeriod?: string;
    delivery?: string;
  }>;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  discount: string;
  tax: string;
  depositAmount: string;
  paymentTermsDays: number;
  startDate: string;
  expectedEndDate?: string;
  notes?: string;
  createdAt: string;
  validity?: string;
  customerReference?: string;
  deliveryAddress?: string;
  projectName?: string;
  deliveryRequiredBy?: string;
  deliveryTerms?: string;
  status?: string;
  shipVia?: string;
  shipmentTerms?: string;
}

interface RentalInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    company?: string;
    vat?: string;
  };
  rentalItems: Array<{
    id: number;
    rentalId: number;
    equipmentId: number;
    equipmentName: string;
    unitPrice: string;
    totalPrice: string;
    rateType: string;
    operatorId?: number;
    status: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
    equipmentModelNumber?: string;
    equipmentCategoryId?: number;
    quantity?: number;
    rentalPeriod?: string;
    delivery?: string;
  }>;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  discount: string;
  tax: string;
  depositAmount: string;
  paymentTermsDays: number;
  startDate: string;
  expectedEndDate?: string;
  notes?: string;
  createdAt: string;
  validity?: string;
  customerReference?: string;
  deliveryAddress?: string;
  projectName?: string;
  deliveryRequiredBy?: string;
  deliveryTerms?: string;
  status?: string;
  shipVia?: string;
  shipmentTerms?: string;
  erpnextInvoiceId?: string;
}

export class PDFGenerator {
  static async generateQuotationPDF(quotationData: QuotationData): Promise<Blob> {
    try {
      // Validate required data
      if (!quotationData || !quotationData.customer || !quotationData.rentalItems) {
        throw new Error('Invalid quotation data provided');
      }

      if (!quotationData.customer.name) {
        throw new Error('Customer name is required');
      }

      if (!quotationData.rentalItems.length) {
        throw new Error('At least one rental item is required');
      }

      // Create new PDF document
      const jsPDFModule = await loadJsPDF();
      const pdf = new jsPDFModule('p', 'mm', 'a4');
      
      // Generate quotation
      PDFGenerator.generateQuotation(pdf, quotationData);

      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  static async generateRentalInvoicePDF(invoiceData: RentalInvoiceData): Promise<Blob> {
    try {
      // Validate required data
      if (!invoiceData || !invoiceData.customer || !invoiceData.rentalItems) {
        throw new Error('Invalid invoice data provided');
      }

      if (!invoiceData.customer.name) {
        throw new Error('Customer name is required');
      }

      if (!invoiceData.rentalItems.length) {
        throw new Error('At least one rental item is required');
      }

      // Create new PDF document
      const jsPDFModule = await loadJsPDF();
      const pdf = new jsPDFModule('p', 'mm', 'a4');
      
      // Generate invoice
      PDFGenerator.generateRentalInvoice(pdf, invoiceData);

      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  // Generate clean quotation
  private static generateQuotation(doc: any, quotationData: QuotationData): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;
    
    // Company Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('C.A.T. INTERNATIONAL L.L.C.', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Equipment Rental & Construction Services', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 25;
    
    // Quotation Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('QUOTATION', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 25;
    
    // Quotation Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Left side - Quotation info
    doc.text(`Quotation #: ${quotationData.quotationNumber}`, margin, yPosition);
    doc.text(`Date: ${new Date(quotationData.createdAt).toLocaleDateString()}`, margin, yPosition + 15);
    doc.text(`Valid Until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, margin, yPosition + 30);
    
    // Right side - Customer info
    doc.text('Bill To:', pageWidth - margin - 60, yPosition);
    doc.text(quotationData.customer.name, pageWidth - margin - 60, yPosition + 15);
    if (quotationData.customer.company) {
      doc.text(quotationData.customer.company, pageWidth - margin - 60, yPosition + 30);
    }
    if (quotationData.customer.address) {
      doc.text(quotationData.customer.address, pageWidth - margin - 60, yPosition + 45);
    }
    
    yPosition += 70;
    
    // Project Information (if available)
    if (quotationData.projectName || quotationData.startDate) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Project Information', margin, yPosition);
      
      yPosition += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      if (quotationData.projectName) {
        doc.text(`Project: ${quotationData.projectName}`, margin, yPosition);
        yPosition += 12;
      }
      if (quotationData.startDate) {
        doc.text(`Start Date: ${new Date(quotationData.startDate).toLocaleDateString()}`, margin, yPosition);
        yPosition += 12;
      }
      if (quotationData.expectedEndDate) {
        doc.text(`End Date: ${new Date(quotationData.expectedEndDate).toLocaleDateString()}`, margin, yPosition);
        yPosition += 12;
      }
      
      yPosition += 15;
    }
    
    // Items Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Rental Items', margin, yPosition);
    
    yPosition += 15;
    
    // Table Headers
    const colWidths = [80, 25, 35, 35];
    const tableHeaders = ['Equipment', 'Qty', 'Unit Price', 'Total'];
    
    // Header background
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, contentWidth, 15, 'F');
    
    // Header text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    let xPos = margin + 5;
    tableHeaders.forEach((header, index) => {
      doc.text(header, xPos, yPosition + 10);
      xPos += colWidths[index];
    });
    
    yPosition += 20;
    
    // Table rows
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    quotationData.rentalItems.forEach((item, index) => {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = margin;
      }
      
      const rowHeight = 15;
      
      // Row border
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPosition, contentWidth, rowHeight, 'S');
      
      // Row content
      xPos = margin + 5;
      doc.text(item.equipmentName, xPos, yPosition + 10);
      xPos += colWidths[0];
      
      doc.text((item.quantity || 1).toString(), xPos, yPosition + 10);
      xPos += colWidths[1];
      
      doc.text(`SAR ${item.unitPrice}`, xPos, yPosition + 10);
      xPos += colWidths[2];
      
      doc.text(`SAR ${item.totalPrice}`, xPos, yPosition + 10);
      
      yPosition += rowHeight;
    });
    
    yPosition += 20;
    
    // Financial Summary
    const summaryBoxWidth = 200;
    const summaryBoxX = pageWidth - margin - summaryBoxWidth;
    
    doc.setFillColor(248, 248, 248);
    doc.rect(summaryBoxX, yPosition, summaryBoxWidth, 80, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(summaryBoxX, yPosition, summaryBoxWidth, 80, 'S');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', summaryBoxX + 10, yPosition + 15);
    
    yPosition += 25;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const summaryItems = [
      { label: 'Subtotal:', value: `SAR ${parseFloat(quotationData.subtotal).toFixed(2)}` },
      { label: `Tax (${quotationData.tax}%):`, value: `SAR ${parseFloat(quotationData.taxAmount).toFixed(2)}` },
      { label: 'Total:', value: `SAR ${parseFloat(quotationData.totalAmount).toFixed(2)}` },
      { label: 'Discount:', value: `SAR ${parseFloat(quotationData.discount).toFixed(2)}` },
      { label: 'Deposit:', value: `SAR ${parseFloat(quotationData.depositAmount).toFixed(2)}` }
    ];
    
    summaryItems.forEach((item, index) => {
      doc.text(item.label, summaryBoxX + 10, yPosition + (index * 12));
      doc.text(item.value, summaryBoxX + summaryBoxWidth - 10, yPosition + (index * 12), { align: 'right' });
    });
    
    // Final Amount
    yPosition += 60;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const finalAmount = parseFloat(quotationData.totalAmount) - parseFloat(quotationData.discount);
    doc.text(`Final Amount: SAR ${finalAmount.toFixed(2)}`, summaryBoxX + 10, yPosition);
    
    // Terms and Conditions
    yPosition += 30;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Terms & Conditions', margin, yPosition);
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const terms = [
      `• Payment terms: Net ${quotationData.paymentTermsDays} days`,
      '• This quotation is valid for 30 days',
      '• All prices are subject to change without notice',
      '• Delivery charges may apply',
      '• Equipment availability subject to confirmation'
    ];
    
    terms.forEach(term => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(term, margin, yPosition);
      yPosition += 12;
    });
    
    // Footer
    yPosition = pageHeight - 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.text('Contact: info@cat-international.com | Tel: +966-XX-XXX-XXXX', pageWidth / 2, yPosition, { align: 'center' });
    
    // Add compact signature section on the same page
    yPosition += 20;
    PDFGenerator.addCompactSignatureSection(doc, quotationData, margin, yPosition);
  }

  // Generate rental invoice
  private static generateRentalInvoice(doc: any, invoiceData: RentalInvoiceData): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;
    
    // Company Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('C.A.T. INTERNATIONAL L.L.C.', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Equipment Rental & Construction Services', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 25;
    
    // Invoice Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 25;
    
    // Invoice Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Left side - Invoice info
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, margin, yPosition);
    doc.text(`Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString()}`, margin, yPosition + 15);
    doc.text(`Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}`, margin, yPosition + 30);
    if (invoiceData.erpnextInvoiceId) {
      doc.text(`ERPNext ID: ${invoiceData.erpnextInvoiceId}`, margin, yPosition + 45);
    }
    
    // Right side - Customer info
    doc.text('Bill To:', pageWidth - margin - 60, yPosition);
    doc.text(invoiceData.customer.name, pageWidth - margin - 60, yPosition + 15);
    if (invoiceData.customer.company) {
      doc.text(invoiceData.customer.company, pageWidth - margin - 60, yPosition + 30);
    }
    if (invoiceData.customer.address) {
      doc.text(invoiceData.customer.address, pageWidth - margin - 60, yPosition + 45);
    }
    
    yPosition += 70;
    
    // Project Information (if available)
    if (invoiceData.projectName || invoiceData.startDate) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Project Information', margin, yPosition);
      
      yPosition += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      if (invoiceData.projectName) {
        doc.text(`Project: ${invoiceData.projectName}`, margin, yPosition);
        yPosition += 12;
      }
      if (invoiceData.startDate) {
        doc.text(`Start Date: ${new Date(invoiceData.startDate).toLocaleDateString()}`, margin, yPosition);
        yPosition += 12;
      }
      if (invoiceData.expectedEndDate) {
        doc.text(`End Date: ${new Date(invoiceData.expectedEndDate).toLocaleDateString()}`, margin, yPosition);
        yPosition += 12;
      }
      
      yPosition += 15;
    }
    
    // Items Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Rental Items', margin, yPosition);
    
    yPosition += 15;
    
    // Table Headers
    const colWidths = [80, 25, 35, 35];
    const tableHeaders = ['Equipment', 'Qty', 'Unit Price', 'Total'];
    
    // Header background
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, contentWidth, 15, 'F');
    
    // Header text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    let xPos = margin + 5;
    tableHeaders.forEach((header, index) => {
      doc.text(header, xPos, yPosition + 10);
      xPos += colWidths[index];
    });
    
    yPosition += 20;
    
    // Table rows
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    invoiceData.rentalItems.forEach((item, index) => {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = margin;
      }
      
      const rowHeight = 15;
      
      // Row border
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPosition, contentWidth, rowHeight, 'S');
      
      // Row content
      xPos = margin + 5;
      doc.text(item.equipmentName, xPos, yPosition + 10);
      xPos += colWidths[0];
      
      doc.text((item.quantity || 1).toString(), xPos, yPosition + 10);
      xPos += colWidths[1];
      
      doc.text(`SAR ${item.unitPrice}`, xPos, yPosition + 10);
      xPos += colWidths[2];
      
      doc.text(`SAR ${item.totalPrice}`, xPos, yPosition + 10);
      
      yPosition += rowHeight;
    });
    
    yPosition += 20;
    
    // Financial Summary
    const summaryBoxWidth = 200;
    const summaryBoxX = pageWidth - margin - summaryBoxWidth;
    
    doc.setFillColor(248, 248, 248);
    doc.rect(summaryBoxX, yPosition, summaryBoxWidth, 80, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(summaryBoxX, yPosition, summaryBoxWidth, 80, 'S');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', summaryBoxX + 10, yPosition + 15);
    
    yPosition += 25;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const summaryItems = [
      { label: 'Subtotal:', value: `SAR ${parseFloat(invoiceData.subtotal).toFixed(2)}` },
      { label: `Tax (${invoiceData.tax}%):`, value: `SAR ${parseFloat(invoiceData.taxAmount).toFixed(2)}` },
      { label: 'Total:', value: `SAR ${parseFloat(invoiceData.totalAmount).toFixed(2)}` },
      { label: 'Discount:', value: `SAR ${parseFloat(invoiceData.discount).toFixed(2)}` },
      { label: 'Deposit:', value: `SAR ${parseFloat(invoiceData.depositAmount).toFixed(2)}` }
    ];
    
    summaryItems.forEach((item, index) => {
      doc.text(item.label, summaryBoxX + 10, yPosition + (index * 12));
      doc.text(item.value, summaryBoxX + summaryBoxWidth - 10, yPosition + (index * 12), { align: 'right' });
    });
    
    // Final Amount
    yPosition += 60;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const finalAmount = parseFloat(invoiceData.totalAmount) - parseFloat(invoiceData.discount);
    doc.text(`Final Amount: SAR ${finalAmount.toFixed(2)}`, summaryBoxX + 10, yPosition);
    
    // Payment Terms
    yPosition += 30;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Terms', margin, yPosition);
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const paymentTerms = [
      `• Payment due: ${new Date(invoiceData.dueDate).toLocaleDateString()}`,
      `• Payment terms: Net ${invoiceData.paymentTermsDays} days`,
      '• Late payment may incur additional charges',
      '• Please include invoice number with payment'
    ];
    
    paymentTerms.forEach(term => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(term, margin, yPosition);
      yPosition += 12;
    });
    
    // Footer
    yPosition = pageHeight - 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.text('Contact: info@cat-international.com | Tel: +966-XX-XXX-XXXX', pageWidth / 2, yPosition, { align: 'center' });
  }
  
  // Add compact signature section on the same page
  private static addCompactSignatureSection(doc: any, quotationData: QuotationData, margin: number, yPosition: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    
    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    
    yPosition += 15;
    
    // Terms and Conditions (compact)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TERMS & CONDITIONS', margin, yPosition);
    
    yPosition += 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const terms = [
      `• Payment: Net ${quotationData.paymentTermsDays} days`,
      '• Valid for 30 days',
      '• Prices subject to change',
      '• Delivery charges may apply'
    ];
    
    terms.forEach((term) => {
      doc.text(term, margin, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Acceptance Statement (compact)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('ACCEPTANCE:', margin, yPosition);
    
    yPosition += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('By signing below, you agree to all terms and conditions.', margin, yPosition);
    
    yPosition += 15;
    
    // Two-column signature layout (compact)
    const leftColX = margin;
    const rightColX = pageWidth / 2 + 10;
    
    // Left Column - Customer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('CUSTOMER:', leftColX, yPosition);
    
    yPosition += 10;
    
    const customerFields = [
      'Name:',
      'Position:',
      'Signature:',
      'Date:'
    ];
    
    customerFields.forEach((field) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(field, leftColX, yPosition);
      
      // Underlined field
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(leftColX + 35, yPosition + 1, leftColX + 120, yPosition + 1);
      
      yPosition += 12;
    });
    
    // Right Column - Company
    yPosition -= 48; // Reset to same level
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('COMPANY:', rightColX, yPosition);
    
    yPosition += 10;
    
    const companyFields = [
      'Authorized By:',
      'Position:',
      'Signature:',
      'Date:'
    ];
    
    companyFields.forEach((field) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(field, rightColX, yPosition);
      
      // Underlined field
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(rightColX + 50, yPosition + 1, rightColX + 135, yPosition + 1);
      
      yPosition += 12;
    });
    
    yPosition += 10;
    
    // Additional Notes (compact)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('NOTES:', margin, yPosition);
    
    yPosition += 8;
    
    // Notes box (smaller)
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, yPosition, contentWidth, 25, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition, contentWidth, 25, 'S');
  }
}
