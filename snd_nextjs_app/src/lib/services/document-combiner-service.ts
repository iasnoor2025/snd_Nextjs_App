import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface DocumentToCombine {
  id: number;
  type: 'employee' | 'equipment';
  fileName: string;
  filePath: string;
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
      }
    }
    
    return await pdfDoc.save();
  }
  
  /**
   * Adds a single document to the PDF
   */
  private static async addDocumentToPDF(pdfDoc: PDFDocument, document: DocumentToCombine): Promise<void> {
    // Construct the correct file path based on document type
    let filePath: string;
    
    if (document.type === 'equipment') {
      // Equipment documents are stored in public/uploads/documents/
      filePath = join(process.cwd(), 'public', 'uploads', 'documents', document.filePath);
    } else {
      // Employee documents use the filePath directly
      filePath = join(process.cwd(), 'public', document.filePath);
    }
    
    console.log(`🔍 Trying to read file: ${filePath}`);
    console.log(`🔍 Document type: ${document.type}, MIME: ${document.mimeType}`);
    
    try {
      const fileBuffer = await readFile(filePath);
      console.log(`🔍 Successfully read file: ${filePath}, size: ${fileBuffer.length} bytes`);
      
      if (document.mimeType.includes('pdf')) {
        await this.addPDFToDocument(pdfDoc, fileBuffer);
      } else if (document.mimeType.includes('image')) {
        await this.addImageToDocument(pdfDoc, fileBuffer, document);
      } else {
        // For other file types, create an info page
        await this.addInfoPage(pdfDoc, document);
      }
    } catch (error) {
      console.error(`❌ Error reading file ${filePath}:`, error);
      await this.addInfoPage(pdfDoc, document);
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
      console.error('Error copying PDF pages:', error);
      throw error;
    }
  }
  
  /**
   * Adds an image to the PDF
   */
  private static async addImageToDocument(pdfDoc: PDFDocument, imageBuffer: Buffer, document: DocumentToCombine): Promise<void> {
    try {
      console.log(`🔍 Processing image: ${document.fileName}, size: ${imageBuffer.length} bytes`);
      
      // Process image with sharp - support multiple formats
      let processedImage: Buffer;
      let imageFormat: 'jpeg' | 'png' | 'webp';
      
      // Detect image format and process accordingly
      const sharpInstance = sharp(imageBuffer);
      const metadata = await sharpInstance.metadata();
      
      console.log(`🔍 Image metadata: format=${metadata.format}, width=${metadata.width}, height=${metadata.height}`);
      
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
      
      console.log(`🔍 Processed image: format=${imageFormat}, size=${processedImage.length} bytes`);
      
      // Convert to PDF page
      const imagePage = pdfDoc.addPage([595, 842]);
      
      // Embed and draw the image based on format
      let image;
      if (imageFormat === 'png') {
        image = await pdfDoc.embedPng(processedImage);
        console.log(`🔍 PNG image embedded successfully`);
      } else {
        image = await pdfDoc.embedJpg(processedImage);
        console.log(`🔍 JPEG image embedded successfully`);
      }
      
      const { width, height } = image.scale(1);
      console.log(`🔍 Image dimensions: ${width}x${height}`);
      
      // Calculate position to center the image on the page
      const pageWidth = 595;
      const pageHeight = 842;
      const x = (pageWidth - width) / 2;
      const y = (pageHeight - height) / 2; // Center vertically
      
      console.log(`🔍 Drawing image at position: x=${x}, y=${y}`);
      
      // Draw the image centered on the page
      imagePage.drawImage(image, {
        x,
        y,
        width,
        height,
      });
      
      console.log(`🔍 Image successfully added to PDF`);
      
    } catch (error) {
      console.error('❌ Error processing image:', error);
      throw error;
    }
  }
  
  /**
   * Adds an info page for documents that can't be embedded
   */
  private static async addInfoPage(pdfDoc: PDFDocument, document: DocumentToCombine): Promise<void> {
    const infoPage = pdfDoc.addPage([595, 842]);
    const normalFont = await pdfDoc.embedFont('Helvetica');
    const titleFont = await pdfDoc.embedFont('Helvetica-Bold');
    
    // Title
    infoPage.drawText('Document Information', {
      x: 50,
      y: 750,
      size: 18,
      font: titleFont,
    });
    
    // Document details
    let yPosition = 700;
    const details = [
      `File Name: ${document.fileName}`,
      `Type: ${document.type.toUpperCase()}`,
      `MIME Type: ${document.mimeType}`,
      `Owner: ${document.type === 'employee' 
        ? `${document.employeeName || 'Unknown'} (${document.employeeFileNumber || 'No File #'})`
        : `${document.equipmentName || 'Unknown'} ${document.equipmentModel ? `(${document.equipmentModel})` : ''}`
      }`,
      `File Path: ${document.filePath}`,
      `Note: This document could not be embedded in the PDF.`,
      `Please refer to the original file for the actual content.`
    ];
    
    details.forEach(detail => {
      infoPage.drawText(detail, {
        x: 50,
        y: yPosition,
        size: 12,
        font: normalFont,
      });
      yPosition -= 25;
    });
  }
}
