import jsPDF from 'jspdf';

export interface DocumentSummary {
  title: string;
  generatedAt: string;
  totalDocuments: number;
  employeeDocuments: number;
  equipmentDocuments: number;
  documents: Array<{
    name: string;
    type: string;
    owner: string;
    ownerId: string;
    documentType: string;
    size: string;
    mimeType: string;
    date: string;
    description: string;
  }>;
}

export class PDFGeneratorService {
  static generateDocumentReport(summary: DocumentSummary): jsPDF {
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
      title: summary.title,
      subject: 'Document Summary Report',
      author: 'SND Rental System',
      creator: 'SND Rental System',
    });

    // Add header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(summary.title, 105, 20, { align: 'center' });
    
    // Add generation info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date(summary.generatedAt).toLocaleString()}`, 20, 35);
    
    // Add summary statistics
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', 20, 50);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Documents: ${summary.totalDocuments}`, 20, 60);
    doc.text(`Employee Documents: ${summary.employeeDocuments}`, 20, 70);
    doc.text(`Equipment Documents: ${summary.equipmentDocuments}`, 20, 80);
    
    // Add document details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Document Details', 20, 100);
    
    let yPosition = 110;
    const pageHeight = 280;
    const margin = 20;
    const lineHeight = 8;
    
    summary.documents.forEach((docItem, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Document number and name
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${docItem.name}`, margin, yPosition);
      yPosition += lineHeight;
      
      // Document details
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const details = [
        `Type: ${docItem.type.toUpperCase()}`,
        `Owner: ${docItem.owner} (${docItem.ownerId || 'N/A'})`,
        `Document Type: ${docItem.documentType.replace(/_/g, ' ')}`,
        `Size: ${docItem.size}`,
        `MIME Type: ${docItem.mimeType}`,
        `Date: ${docItem.date}`,
      ];
      
      if (docItem.description) {
        details.push(`Description: ${docItem.description}`);
      }
      
      details.forEach(detail => {
        if (yPosition > pageHeight) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(detail, margin + 5, yPosition);
        yPosition += lineHeight;
      });
      
      // Add spacing between documents
      yPosition += 5;
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('SND Rental System', 20, 290);
      doc.text(new Date().toLocaleDateString(), 180, 290);
    }
    
    return doc;
  }
  
  static async generatePDFFromDocuments(documents: any[]): Promise<jsPDF> {
    const summary: DocumentSummary = {
      title: "Document Summary Report",
      generatedAt: new Date().toISOString(),
      totalDocuments: documents.length,
      employeeDocuments: documents.filter(d => d.type === 'employee').length,
      equipmentDocuments: documents.filter(d => d.type === 'equipment').length,
      documents: documents.map(doc => ({
        name: doc.fileName,
        type: doc.type,
        owner: doc.type === 'employee' ? doc.employeeName : doc.equipmentName,
        ownerId: doc.type === 'employee' ? doc.employeeFileNumber : (doc.equipmentSerial || doc.equipmentModel),
        documentType: doc.documentType || 'equipment_document',
        size: this.formatFileSize(doc.fileSize),
        mimeType: doc.mimeType,
        date: new Date(doc.createdAt).toLocaleDateString(),
        description: doc.description || ''
      }))
    };
    
    return this.generateDocumentReport(summary);
  }
  
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
