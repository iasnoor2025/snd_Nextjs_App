import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { H2SCardData } from './h2s-card-service';
import * as fs from 'fs';
import * as path from 'path';

export class H2SCardPDFService {
  /**
   * Generate H2S card PDF with front and back pages
   */
  static async generateH2SCardPDF(cardData: H2SCardData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    // Add front page
    await this.addFrontPage(pdfDoc, cardData);

    // Add back page
    await this.addBackPage(pdfDoc, cardData);

    // Return PDF as bytes
    return await pdfDoc.save();
  }

  /**
   * Add front page to PDF
   */
  private static async addFrontPage(
    pdfDoc: PDFDocument,
    cardData: H2SCardData
  ): Promise<void> {
    // Card dimensions in points (85.6mm x 53.98mm)
    // 1mm = 2.83465 points
    const cardWidth = 243; // 85.6mm in points
    const cardHeight = 153; // 53.98mm in points
    const page = pdfDoc.addPage([cardWidth, cardHeight]);

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Background - white
    page.drawRectangle({
      x: 0,
      y: 0,
      width: cardWidth,
      height: cardHeight,
      color: rgb(1, 1, 1),
    });

    let yPos = cardHeight - 15;

    // Header Section
    const headerY = cardHeight - 12;
    
    // Company logo (load from public folder or URL)
    if (cardData.companyLogo) {
      try {
        let logoBytes: ArrayBuffer;
        if (cardData.companyLogo.startsWith('http')) {
          // Load from URL
          const logoResponse = await fetch(cardData.companyLogo);
          logoBytes = await logoResponse.arrayBuffer();
        } else {
          // Load from public folder
          const logoFileName = cardData.companyLogo.replace(/^\//, '');
          const logoPath = path.join(process.cwd(), 'public', logoFileName);
          const logoBuffer = fs.readFileSync(logoPath);
          logoBytes = logoBuffer.buffer;
        }
        
        // Try to embed as PNG first, fallback to JPG
        let logoImage;
        try {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } catch (e) {
          logoImage = await pdfDoc.embedJpg(logoBytes);
        }
        
        page.drawImage(logoImage, {
          x: 10,
          y: headerY - 10,
          width: 15,
          height: 15,
        });
      } catch (e) {
        // Logo not found, skip it
      }
    }

    // Company name
    page.setFont(helveticaBold);
    page.setFontSize(8);
    page.drawText(cardData.companyName, {
      x: 30,
      y: headerY,
      color: rgb(0.118, 0.455, 0.439), // Teal color
    });

    // Card number
    page.setFont(helvetica);
    page.drawText('Card No.:', {
      x: cardWidth - 80,
      y: headerY,
    });
    page.setFont(helveticaBold);
    page.drawText(cardData.cardNumber, {
      x: cardWidth - 45,
      y: headerY,
      color: rgb(0.8, 0, 0),
    });

    yPos = headerY - 15;

    // Employee name and Iqama
    page.setFont(helveticaBold);
    page.setFontSize(7);
    page.drawText(`Name: - ${cardData.employeeName}`, {
      x: 10,
      y: yPos,
    });
    page.setFont(helvetica);
    page.drawText(`Iqama No. ${cardData.iqamaNumber || 'N/A'}`, {
      x: cardWidth - 60,
      y: yPos,
    });

    yPos -= 20;

    // Yellow banner
    const bannerY = yPos - 8;
    page.drawRectangle({
      x: 10,
      y: bannerY,
      width: cardWidth - 20,
      height: 10,
      color: rgb(1, 0.922, 0.231), // Yellow
    });
    page.setFont(helveticaOblique);
    page.setFontSize(6);
    page.drawText(
      'This card acknowledges that the recipient has successfully completed the course.',
      {
        x: 15,
        y: bannerY + 3,
        maxWidth: cardWidth - 30,
      }
    );

    yPos = bannerY - 15;

    // Photo, Course Details, QR Code section
    const photoX = 10;
    const photoY = yPos - 35;
    const photoWidth = 45;
    const photoHeight = 55;

    // Employee photo
    if (cardData.employeePhoto) {
      try {
        const photoResponse = await fetch(cardData.employeePhoto);
        const photoBytes = await photoResponse.arrayBuffer();
        const isPng = cardData.employeePhoto.toLowerCase().includes('.png') || 
                      cardData.employeePhoto.includes('image/png');
        
        let photoImage;
        try {
          photoImage = isPng
            ? await pdfDoc.embedPng(photoBytes)
            : await pdfDoc.embedJpg(photoBytes);
        } catch (e) {
          // Try the opposite format
          photoImage = isPng
            ? await pdfDoc.embedJpg(photoBytes)
            : await pdfDoc.embedPng(photoBytes);
        }
        
        page.drawImage(photoImage, {
          x: photoX,
          y: photoY,
          width: photoWidth,
          height: photoHeight,
        });
      } catch (e) {
        // Draw placeholder if photo fails
        page.drawRectangle({
          x: photoX,
          y: photoY,
          width: photoWidth,
          height: photoHeight,
          borderColor: rgb(0.5, 0.5, 0.5),
          borderWidth: 1,
        });
        page.setFont(helvetica);
        page.setFontSize(6);
        page.drawText('Photo', {
          x: photoX + 15,
          y: photoY + 25,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    }

    // Course details
    const detailsX = photoX + photoWidth + 5;
    let detailsY = photoY + photoHeight - 10;
    // Row: Course
    page.setFont(helveticaBold);
    page.setFontSize(7);
    page.drawText('Course:', { x: detailsX, y: detailsY });
    page.setFont(helvetica);
    page.drawText('-', { x: detailsX + 35, y: detailsY });
    page.drawText(cardData.courseName, {
      x: detailsX + 40,
      y: detailsY,
      maxWidth: cardWidth - detailsX - 70,
    });

    detailsY -= 10;
    // Row: Completion Date
    page.setFont(helveticaBold);
    page.drawText('Completion Date:', { x: detailsX, y: detailsY });
    page.setFont(helvetica);
    page.drawText('-', { x: detailsX + 65, y: detailsY });
    page.drawText(cardData.completionDate, { x: detailsX + 70, y: detailsY });

    detailsY -= 10;
    // Row: Expires
    page.setFont(helveticaBold);
    page.drawText('Expires:', { x: detailsX, y: detailsY });
    page.setFont(helvetica);
    page.drawText('-', { x: detailsX + 35, y: detailsY });
    page.drawText(cardData.expiryDate, { x: detailsX + 40, y: detailsY });

    // QR Code
    if (cardData.qrCodeUrl) {
      try {
        const qrResponse = await fetch(cardData.qrCodeUrl);
        const qrBytes = await qrResponse.arrayBuffer();
        const qrImage = await pdfDoc.embedPng(qrBytes);
        const qrSize = 40;
        page.drawImage(qrImage, {
          x: cardWidth - qrSize - 10,
          y: photoY + 15,
          width: qrSize,
          height: qrSize,
        });
      } catch (e) {
      }
    }

    // Trainer info and signature
    yPos = photoY - 10;
    page.setFont(helveticaBold);
    page.setFontSize(6);
    page.drawText(`Trainer: ${cardData.trainerName}`, {
      x: 10,
      y: yPos,
    });
    page.setFont(helvetica);
    page.setFontSize(5);
    page.drawText('(Train the Trainer) certified from', {
      x: 10,
      y: yPos - 8,
    });

    // IADC logo: embed supplied public/iadc-logo.png if present
    try {
      const iadcPath = path.join(process.cwd(), 'public', 'iadc-logo.png');
      const iadcBytes = fs.readFileSync(iadcPath);
      const iadcImg = await pdfDoc.embedPng(iadcBytes);
      page.drawImage(iadcImg, { x: 10, y: yPos - 22, width: 12, height: 12 });
      page.setFont(helveticaBold);
      page.setFontSize(6);
      page.drawText('IADC', { x: 25, y: yPos - 18 });
    } catch {
      // fallback text only
      page.setFont(helveticaBold);
      page.setFontSize(6);
      page.drawText('IADC', { x: 10, y: yPos - 18 });
    }

    // Signature
    const signatureText = cardData.trainerName
      .split(' ')
      .map((n, i) => (i === 0 ? n[0] : n))
      .join('');
    page.setFont(helveticaOblique);
    page.setFontSize(5);
    page.drawText(`Signature: -${signatureText}`, {
      x: cardWidth - 60,
      y: yPos,
    });
  }

  /**
   * Add back page to PDF
   */
  private static async addBackPage(
    pdfDoc: PDFDocument,
    cardData: H2SCardData
  ): Promise<void> {
    const cardWidth = 243;
    const cardHeight = 153;
    const page = pdfDoc.addPage([cardWidth, cardHeight]);

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Light gray background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: cardWidth,
      height: cardHeight,
      color: rgb(0.96, 0.96, 0.96),
    });

    let yPos = cardHeight - 15;

    // H2S logo section
    page.setFont(helveticaBold);
    page.setFontSize(14);
    page.drawText('H', {
      x: 10,
      y: yPos,
      color: rgb(1, 0.647, 0),
    });
    page.setFontSize(8);
    page.drawText('2', {
      x: 18,
      y: yPos - 3,
      color: rgb(1, 0.647, 0),
    });
    page.setFontSize(14);
    page.drawText('S', {
      x: 24,
      y: yPos,
      color: rgb(1, 0.843, 0),
    });

    yPos -= 20;

    // Certification text
    page.setFont(helvetica);
    page.setFontSize(7);
    page.drawText(
      'This Card certifies that the person has satisfactorily attended the H2S Training Program mentioned on the front of this card.',
      {
        x: 10,
        y: yPos,
        maxWidth: cardWidth - 20,
      }
    );

    yPos -= 25;

    // Exposure levels chart
    const chartY = yPos - 50;
    const columnWidth = (cardWidth - 30) / 3;
    
    // LOW column
    page.drawRectangle({
      x: 10,
      y: chartY,
      width: columnWidth - 3,
      height: 50,
      color: rgb(0.133, 0.545, 0.133), // Green
    });
    page.setFont(helveticaBold);
    page.setFontSize(6);
    page.drawText('LOW', {
      x: 10 + columnWidth / 2 - 10,
      y: chartY + 40,
      color: rgb(1, 1, 1),
    });
    page.setFont(helvetica);
    page.setFontSize(5);
    page.drawText('0-10 PPM', {
      x: 10 + columnWidth / 2 - 15,
      y: chartY + 30,
      color: rgb(1, 1, 1),
    });
    page.setFontSize(4);
    page.drawText('• Irritation of the eyes, nose,', {
      x: 12,
      y: chartY + 20,
      color: rgb(1, 1, 1),
      maxWidth: columnWidth - 6,
    });
    page.drawText('throat or respiration system', {
      x: 12,
      y: chartY + 15,
      color: rgb(1, 1, 1),
      maxWidth: columnWidth - 6,
    });

    // MODERATE column
    page.drawRectangle({
      x: 10 + columnWidth,
      y: chartY,
      width: columnWidth - 3,
      height: 50,
      color: rgb(1, 0.843, 0), // Yellow
    });
    page.setFont(helveticaBold);
    page.setFontSize(6);
    page.drawText('MODERATE', {
      x: 10 + columnWidth + columnWidth / 2 - 18,
      y: chartY + 40,
      color: rgb(0, 0, 0),
    });
    page.setFont(helvetica);
    page.setFontSize(5);
    page.drawText('10-50 PPM', {
      x: 10 + columnWidth + columnWidth / 2 - 15,
      y: chartY + 30,
      color: rgb(0, 0, 0),
    });
    const moderateSymptoms = ['Headache', 'Dizziness', 'Nausea and Vomiting', 'Coughing and breathing difficulty'];
    let modY = chartY + 22;
    page.setFontSize(4);
    moderateSymptoms.forEach((symptom) => {
      page.drawText(`• ${symptom}`, {
        x: 10 + columnWidth + 2,
        y: modY,
        color: rgb(0, 0, 0),
        maxWidth: columnWidth - 6,
      });
      modY -= 5;
    });

    // HIGH column
    page.drawRectangle({
      x: 10 + columnWidth * 2,
      y: chartY,
      width: columnWidth - 3,
      height: 50,
      color: rgb(0.8, 0, 0), // Red
    });
    page.setFont(helveticaBold);
    page.setFontSize(6);
    page.drawText('HIGH', {
      x: 10 + columnWidth * 2 + columnWidth / 2 - 10,
      y: chartY + 40,
      color: rgb(1, 1, 1),
    });
    page.setFont(helvetica);
    page.setFontSize(5);
    page.drawText('50-200 PPM', {
      x: 10 + columnWidth * 2 + columnWidth / 2 - 18,
      y: chartY + 30,
      color: rgb(1, 1, 1),
    });
    const highSymptoms = [
      'Eye Irritation/acute',
      'Severe respiratory',
      'Convulsions',
      'Shock',
      'Coma',
      'Death in severe cases',
    ];
    let highY = chartY + 22;
    page.setFontSize(4);
    highSymptoms.forEach((symptom) => {
      page.drawText(`• ${symptom}`, {
        x: 10 + columnWidth * 2 + 2,
        y: highY,
        color: rgb(1, 1, 1),
        maxWidth: columnWidth - 6,
      });
      highY -= 4;
    });

    // Safety contact info
    page.setFont(helveticaBold);
    page.setFontSize(6);
    page.drawText('For Safety Assistance Contact:', {
      x: cardWidth / 2 - 50,
      y: chartY - 10,
      color: rgb(0.545, 0, 0),
    });
    page.setFont(helvetica);
    page.drawText('0572007285, 0556894112', {
      x: cardWidth / 2 - 35,
      y: chartY - 18,
    });
  }
}

