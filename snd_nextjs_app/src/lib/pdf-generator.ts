import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    equipmentName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    rateType: string;
    rentalPeriod?: string;
    delivery?: string;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  discount: number;
  tax: number;
  depositAmount: number;
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

      // Validate each rental item
  
      quotationData.rentalItems.forEach((item, index) => {
        
        if (!item.equipmentName) {
          throw new Error(`Rental item ${index + 1} is missing equipment name`);
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new Error(`Rental item ${index + 1} has invalid quantity`);
        }
        if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
          throw new Error(`Rental item ${index + 1} has invalid unit price`);
        }
        if (typeof item.totalPrice !== 'number' || item.totalPrice < 0) {
          throw new Error(`Rental item ${index + 1} has invalid total price`);
        }
        if (!item.rateType) {
          throw new Error(`Rental item ${index + 1} is missing rate type`);
        }
      });

      // Validate financial fields
      if (typeof quotationData.subtotal !== 'number' || quotationData.subtotal < 0) {
        throw new Error('Invalid subtotal amount');
      }
      if (typeof quotationData.taxAmount !== 'number' || quotationData.taxAmount < 0) {
        throw new Error('Invalid tax amount');
      }
      if (typeof quotationData.totalAmount !== 'number' || quotationData.totalAmount < 0) {
        throw new Error('Invalid total amount');
      }
      if (typeof quotationData.discount !== 'number' || quotationData.discount < 0) {
        throw new Error('Invalid discount amount');
      }
      if (typeof quotationData.tax !== 'number' || quotationData.tax < 0) {
        throw new Error('Invalid tax percentage');
      }
      if (typeof quotationData.depositAmount !== 'number' || quotationData.depositAmount < 0) {
        throw new Error('Invalid deposit amount');
      }

      // Validate required string fields
      if (!quotationData.quotationNumber) {
        throw new Error('Quotation number is required');
      }
      if (!quotationData.startDate) {
        throw new Error('Start date is required');
      }
      if (!quotationData.createdAt) {
        throw new Error('Created date is required');
      }
      if (typeof quotationData.paymentTermsDays !== 'number' || quotationData.paymentTermsDays <= 0) {
        throw new Error('Invalid payment terms days');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to format amounts
    const formatAmount = (amount: any): string => {
      if (amount === null || amount === undefined) return '0.00';

      // Handle Decimal types from Prisma
      let num: number;
      if (typeof amount === 'object' && amount !== null) {
        // Handle Prisma Decimal type
        if (amount.toFixed) {
          num = parseFloat(amount.toFixed(2));
        } else if (amount.toString) {
          num = parseFloat(amount.toString());
        } else {
          num = 0;
        }
      } else if (typeof amount === 'string') {
        num = parseFloat(amount);
      } else {
        num = Number(amount);
      }

      // Ensure we return a valid string
      if (isNaN(num) || !isFinite(num)) {
        return '0.00';
      }

      return num.toFixed(2);
    };

    // Helper function to format dates
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    // Add company header with logo placeholder
    pdf.setFontSize(16);
    pdf.setTextColor(59, 130, 246); // Blue color
    pdf.text('Samhan Naser Al-Dosri Est.', margin, yPosition);
    yPosition += 8;

    // Add quotation number and revision
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`QNO. ${quotationData.quotationNumber}`, margin, yPosition);
    pdf.text('REVISED : 01', pageWidth - margin - 40, yPosition);
    yPosition += 15;

    // Add main title
    pdf.setFontSize(20);
    pdf.setTextColor(59, 130, 246);
    pdf.text('Equipment Rental Quotation', pageWidth / 2 - 60, yPosition);
    yPosition += 20;

    // Add client and project information in two columns
    const leftColumnX = margin;
    const rightColumnX = pageWidth / 2 + 10;
    const columnWidth = (pageWidth - 2 * margin - 10) / 2;

    // Left column - Client Information
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Client Information:', leftColumnX, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Name: ${quotationData.customer.name || ''}`, leftColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Company: ${quotationData.customer.company || ''}`, leftColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Address: ${quotationData.customer.address || ''}`, leftColumnX, yPosition);
    yPosition += 5;
    pdf.text(`VAT: ${quotationData.customer.vat || ''}`, leftColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Email: ${quotationData.customer.email || ''}`, leftColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Validity: ${quotationData.validity || ''}`, leftColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Customer Reference: ${quotationData.customerReference || ''}`, leftColumnX, yPosition);

    // Right column - Project/Delivery Information
    yPosition -= 35; // Reset to same level as left column
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Project/Delivery Information:', rightColumnX, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Ship / Deliver to: ${quotationData.deliveryAddress || ''}`, rightColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Project Name: ${quotationData.projectName || ''}`, rightColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Date: ${formatDate(quotationData.createdAt)}`, rightColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Delivery required by: ${quotationData.deliveryRequiredBy || ''}`, rightColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Payment terms: ${quotationData.paymentTermsDays || 30} Days Credit`, rightColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Delivery Terms: ${quotationData.deliveryTerms || ''}`, rightColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Status: ${quotationData.status || ''}`, rightColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Ship via: ${quotationData.shipVia || 'Your Truck'}`, rightColumnX, yPosition);
    yPosition += 5;
    pdf.text(`Shipment terms: ${quotationData.shipmentTerms || ''}`, rightColumnX, yPosition);

    yPosition += 15;

    // Add rental details
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Rental Details', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Start Date: ${formatDate(quotationData.startDate)}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Expected End Date: ${quotationData.expectedEndDate ? formatDate(quotationData.expectedEndDate) : 'To be determined'}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Payment Terms: ${quotationData.paymentTermsDays} days`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Deposit Required: $${formatAmount(quotationData.depositAmount)}`, margin, yPosition);
    yPosition += 15;

    // Add equipment table
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Rental Items', margin, yPosition);
    yPosition += 10;

    // Table headers matching the image format
    const tableHeaders = ['L/I No.', 'Description', 'Qty', 'Rental Rate (per unit)', 'Rental Period (days)', 'Amount', 'Delivery'];
    const columnWidths = [15, 60, 15, 25, 25, 25, 20];
    const tableStartX = margin;
    let currentX = tableStartX;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(tableStartX, yPosition - 5, pageWidth - 2 * margin, 8, 'F');

    tableHeaders.forEach((header, index) => {
      pdf.text(header, currentX + 2, yPosition);
      currentX += columnWidths[index];
    });
    yPosition += 10;

    // Table rows
    pdf.setFontSize(9);
    quotationData.rentalItems.forEach((item, index) => {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      currentX = tableStartX;
      pdf.text((index + 1).toString(), currentX + 2, yPosition); // L/I No.
      currentX += columnWidths[0];
      pdf.text(item.equipmentName || '', currentX + 2, yPosition); // Description
      currentX += columnWidths[1];
      pdf.text((item.quantity || 0).toString(), currentX + 2, yPosition); // Qty
      currentX += columnWidths[2];
      pdf.text(`$${formatAmount(item.unitPrice)}`, currentX + 2, yPosition); // Rental Rate
      currentX += columnWidths[3];
      pdf.text(item.rentalPeriod || '26/10', currentX + 2, yPosition); // Rental Period
      currentX += columnWidths[4];
      pdf.text(`$${formatAmount(item.totalPrice)}`, currentX + 2, yPosition); // Amount
      currentX += columnWidths[5];
      pdf.text(item.delivery || '', currentX + 2, yPosition); // Delivery
      yPosition += 6;
    });
    yPosition += 10;

    // Add financial summary
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Summary', pageWidth - margin - 60, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Subtotal: $${formatAmount(quotationData.subtotal)}`, pageWidth - margin - 60, yPosition);
    yPosition += 5;
    pdf.text(`Vat: $${formatAmount(quotationData.taxAmount)}`, pageWidth - margin - 60, yPosition);
    yPosition += 8;

    // Total line
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth - margin - 60, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
    pdf.text(`Grand Total: $${formatAmount(quotationData.totalAmount)}`, pageWidth - margin - 60, yPosition);
    yPosition += 5;

    // Amount in words
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    const amountInWords = PDFGenerator.numberToWords(quotationData.totalAmount);
    pdf.text(`Amount in Words: ${amountInWords}`, margin, yPosition);
    yPosition += 15;

    // Add rental terms
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Rental Terms:', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    const terms = [
      '1. The equipment will operate for 10 hours per day, 26 days per month. Any work performed on Fridays or holidays will be considered overtime.',
      `2. ${quotationData.customer.company || 'C.A.T. INTERNATIONAL L.L.C.'} to provide Fuel(diesel) for the Equipments.`,
      `3. ${quotationData.customer.company || 'C.A.T. INTERNATIONAL L.L.C.'} shall provide a accommodation, Food and transportation for the Drives.`
    ];

    terms.forEach(term => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(term, margin, yPosition);
      yPosition += 8;
    });

    // Add signature section
    yPosition += 20;
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Authorized Signature', margin, yPosition);
    pdf.text('Client Signature', pageWidth - margin - 50, yPosition);
    yPosition += 15;

    // Add document identifier
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('SND-FRM-302', pageWidth - margin - 30, yPosition);

    if (quotationData.notes) {
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Additional Notes:', margin, yPosition);
      yPosition += 5;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(quotationData.notes || '', margin, yPosition);
    }

    return pdf.output('blob');
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper function to convert numbers to words
  static numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    function convertLessThanOneThousand(n: number): string {
      if (n === 0) return '';

      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) {
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      }
      if (n < 1000) {
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
      }
      return '';
    }

    function convert(n: number): string {
      if (n === 0) return 'Zero';
      if (n < 1000) return convertLessThanOneThousand(n);
      if (n < 1000000) {
        return convertLessThanOneThousand(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertLessThanOneThousand(n % 1000) : '');
      }
      if (n < 1000000000) {
        return convertLessThanOneThousand(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
      }
      return convertLessThanOneThousand(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 !== 0 ? ' ' + convert(n % 1000000000) : '');
    }

    const wholePart = Math.floor(num);
    const decimalPart = Math.round((num - wholePart) * 100);

    let result = convert(wholePart) + ' Riyals';
    if (decimalPart > 0) {
      result += ' and ' + convert(decimalPart) + ' Halalas';
    }

    return result;
  }

  static async generatePDFFromHTML(elementId: string, filename: string): Promise<Blob> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  }
}
