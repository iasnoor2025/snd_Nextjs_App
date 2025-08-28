import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

export interface DocumentToCombine {
  id: string | number;
  type: 'employee' | 'equipment';
  fileName: string;
  filePath: string;
  url: string; // Add URL field for Supabase
  mimeType: string;
  employeeName?: string;
  employeeFileNumber?: string;
  equipmentName?: string;
  equipmentModel?: string;
  equipmentSerial?: string;
}

export class DocumentCombinerService {
  /**
   * Combines multiple documents into a single PDF
   */
  static async combineDocuments(documents: DocumentToCombine[]): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    // Process each document directly - no title page, no reports
    for (const document of documents) {
      try {
        await this.addDocumentToPDF(pdfDoc, document);
      } catch (error) {
        console.error(`Error processing document ${document.fileName}:`, error);
        
        // Add error page for failed documents
        const errorPage = pdfDoc.addPage([595, 842]);
        const normalFont = await pdfDoc.embedFont('Helvetica');
        errorPage.drawText(`Error loading: ${document.fileName}`, {
          x: 50,
          y: 400,
          size: 14,
          font: normalFont,
        });
        errorPage.drawText(`Type: ${document.mimeType}`, {
          x: 50,
          y: 380,
          size: 12,
          font: normalFont,
        });
        errorPage.drawText(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          x: 50,
          y: 360,
          size: 10,
          font: normalFont,
        });
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Adds a single document to the PDF
   */
  private static async addDocumentToPDF(
    pdfDoc: PDFDocument,
    document: DocumentToCombine
  ): Promise<void> {
    console.log('Processing document for PDF:', {
      name: document.fileName,
      type: document.type,
      mimeType: document.mimeType,
      url: document.url
    });

    try {
      // Fetch file from Supabase URL
      const response = await fetch(document.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const fileBuffer = await response.arrayBuffer();

      if (document.mimeType.includes('pdf')) {
        await this.addPDFToDocument(pdfDoc, Buffer.from(fileBuffer));
      } else if (document.mimeType.includes('image')) {
        await this.addImageToDocument(pdfDoc, Buffer.from(fileBuffer), document);
      } else {
        // For other file types, create an info page
        await this.addInfoPage(pdfDoc, document);
      }
    } catch (error) {
      console.error(`Error processing document ${document.fileName}:`, error);
      
      // Create an error page with detailed information
      const errorPage = pdfDoc.addPage([595, 842]);
      const normalFont = await pdfDoc.embedFont('Helvetica');
      const titleFont = await pdfDoc.embedFont('Helvetica-Bold');

      // Title
      errorPage.drawText(`Error Processing: ${document.fileName}`, {
        x: 50,
        y: 750,
        size: 16,
        font: titleFont,
      });

      // Error details
      let yPosition = 700;
      const errorDetails = [
        `Document Type: ${document.type.toUpperCase()}`,
        `MIME Type: ${document.mimeType}`,
        `Owner: ${
          document.type === 'employee'
            ? `${document.employeeName || 'Unknown'} (${document.employeeFileNumber || 'No File #'})`
            : `${document.equipmentName || 'Unknown'} ${document.equipmentModel ? `(${document.equipmentModel})` : ''}`
        }`,
        `File Path: ${document.filePath}`,
        `URL: ${document.url}`,
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `Note: This document could not be processed.`,
        `Please check the URL accessibility and file format.`,
      ];

      errorDetails.forEach(detail => {
        errorPage.drawText(detail, {
          x: 50,
          y: yPosition,
          size: 10,
          font: normalFont,
        });
        yPosition -= 20;
      });
    }
  }

  /**
   * Adds a PDF document to the main PDF
   */
  private static async addPDFToDocument(mainPdf: PDFDocument, pdfBuffer: Buffer): Promise<void> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = await mainPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => mainPdf.addPage(page));
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Adds an info page for non-PDF/non-image documents
   */
  private static async addInfoPage(
    pdfDoc: PDFDocument,
    document: DocumentToCombine
  ): Promise<void> {
    try {
      const infoPage = pdfDoc.addPage([595, 842]);
      const normalFont = await pdfDoc.embedFont('Helvetica');
      const titleFont = await pdfDoc.embedFont('Helvetica-Bold');

      // Title
      infoPage.drawText(`Document Information: ${document.fileName}`, {
        x: 50,
        y: 750,
        size: 16,
        font: titleFont,
      });

      // Document details
      let yPosition = 700;
      const documentDetails = [
        `Document Type: ${document.type.toUpperCase()}`,
        `File Type: ${document.mimeType}`,
        `Owner: ${
          document.type === 'employee'
            ? `${document.employeeName || 'Unknown'} (${document.employeeFileNumber || 'No File #'})`
            : `${document.equipmentName || 'Unknown'} ${document.equipmentModel ? `(${document.equipmentModel})` : ''}`
        }`,
        `File Path: ${document.filePath}`,
        `Note: This document type (${document.mimeType}) cannot be directly embedded in PDF.`,
        `Please refer to the original file for viewing.`,
      ];

      documentDetails.forEach(detail => {
        infoPage.drawText(detail, {
          x: 50,
          y: yPosition,
          size: 10,
          font: normalFont,
        });
        yPosition -= 20;
      });
    } catch (error) {
      console.error(`Error creating info page for ${document.fileName}:`, error);
      
      // Create a simple error page if font embedding fails
      const errorPage = pdfDoc.addPage([595, 842]);
      errorPage.drawText(`Error creating info page for: ${document.fileName}`, {
        x: 50,
        y: 400,
        size: 12,
      });
    }
  }

  /**
   * Adds an image to the PDF
   */
  private static async addImageToDocument(
    pdfDoc: PDFDocument,
    imageBuffer: Buffer,
    document: DocumentToCombine
  ): Promise<void> {
    try {

      // Process image with sharp - support multiple formats
      let processedImage: Buffer;
      let imageFormat: 'jpeg' | 'png' | 'webp';

      // Detect image format and process accordingly
      const sharpInstance = sharp(imageBuffer);
      const metadata = await sharpInstance.metadata();

      if (metadata.format === 'png') {
        processedImage = await sharpInstance
          .resize(500, 700, { fit: 'inside', withoutEnlargement: true })
          .png({ quality: 90 })
          .toBuffer();
        imageFormat = 'png';
      } else if (metadata.format === 'webp') {
        processedImage = await sharpInstance
          .resize(500, 700, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 90 })
          .toBuffer();
        imageFormat = 'png'; // Convert webp to png for PDF compatibility
      } else {
        // Default to JPEG for other formats
        processedImage = await sharpInstance
          .resize(500, 700, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 90 })
          .toBuffer();
        imageFormat = 'jpeg';
      }

      // Convert to PDF page
      const imagePage = pdfDoc.addPage([595, 842]);

      // Embed and draw the image based on format
      let image;
      if (imageFormat === 'png') {
        image = await pdfDoc.embedPng(processedImage);
        
      } else {
        image = await pdfDoc.embedJpg(processedImage);
        
      }

      const { width, height } = image.scale(1);

      // Calculate position to center the image on the page
      const pageWidth = 595;
      const pageHeight = 842;
      const x = (pageWidth - width) / 2;
      const y = (pageHeight - height) / 2; // Center vertically

      // Draw the image centered on the page
      imagePage.drawImage(image, {
        x,
        y,
        width,
        height,
      });

    } catch (error) {
      console.error(`Error processing image ${document.fileName}:`, error);
      
      // Create an error page for the image
      const errorPage = pdfDoc.addPage([595, 842]);
      const normalFont = await pdfDoc.embedFont('Helvetica');
      const titleFont = await pdfDoc.embedFont('Helvetica-Bold');

      errorPage.drawText(`Error Processing Image: ${document.fileName}`, {
        x: 50,
        y: 750,
        size: 16,
        font: titleFont,
      });

      errorPage.drawText(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        x: 50,
        y: 700,
        size: 12,
        font: normalFont,
      });
    }
  }
}
