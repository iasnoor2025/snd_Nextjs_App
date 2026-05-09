import { NextRequest, NextResponse } from 'next/server';
import { rgb, PDFDocument, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '@/lib/db';
import { employees, pettyCashAccounts, pettyCashTransactions } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const getHandler = async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const txId = parseInt(id, 10);

    if (Number.isNaN(txId)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const [transaction] = await db
      .select({
        id: pettyCashTransactions.id,
        accountName: pettyCashAccounts.name,
        transactionDate: pettyCashTransactions.transactionDate,
        type: pettyCashTransactions.type,
        amount: pettyCashTransactions.amount,
        description: pettyCashTransactions.description,
        reference: pettyCashTransactions.reference,
        receiptNumber: pettyCashTransactions.receiptNumber,
        employeeId: pettyCashTransactions.employeeId,
      })
      .from(pettyCashTransactions)
      .leftJoin(pettyCashAccounts, eq(pettyCashTransactions.accountId, pettyCashAccounts.id))
      .where(eq(pettyCashTransactions.id, txId))
      .limit(1);

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (!transaction.employeeId) {
      return NextResponse.json(
        { error: 'Receipt is only available when an employee is selected' },
        { status: 400 }
      );
    }

    if (!['OUT', 'EXPENSE'].includes(transaction.type)) {
      return NextResponse.json(
        { error: 'Receipt is only available for employee cash payout transactions' },
        { status: 400 }
      );
    }

    const [employee] = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        fileNumber: employees.fileNumber,
      })
      .from(employees)
      .where(eq(employees.id, transaction.employeeId))
      .limit(1);

    // User-requested fixed branding for this receipt.
    const companyName = 'Samhan Naser Al-Dosary Est.';
    const companyLogo = '/snd-logo.png';

    const employeeName = employee ? `${employee.firstName} ${employee.lastName}`.trim() : 'N/A';
    const fileNumber = employee?.fileNumber ?? 'N/A';
    const amount = Number(transaction.amount ?? 0);
    const transactionDate = transaction.transactionDate ? String(transaction.transactionDate) : 'N/A';

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const page = pdfDoc.addPage([595.28, 841.89]); // A4

    const arabicFontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansArabic-Regular.ttf');
    const arabicFontBytes = fs.readFileSync(arabicFontPath);
    const arabicFont = await pdfDoc.embedFont(arabicFontBytes, { subset: true });
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const toPdfSafeText = (value: unknown): string =>
      String(value ?? '')
        .replace(/[\r\n\t]+/g, ' ')
        .trim();
    const hasArabic = (value: string): boolean => /[\u0600-\u06FF]/.test(value);

    const drawText = (text: string, x: number, y: number, size = 11, bold = false) => {
      const safe = toPdfSafeText(text);
      const font = hasArabic(safe) ? arabicFont : bold ? fontBold : fontRegular;
      page.drawText(safe, {
        x,
        y,
        size,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    };

    const drawLabelValue = (label: string, value: string, x: number, y: number, width = 220) => {
      drawText(toPdfSafeText(label), x, y, 9, true);
      const safeValue = toPdfSafeText(value || 'N/A');
      const chunks = safeValue.match(new RegExp(`.{1,${Math.max(16, Math.floor(width / 7))}}(\\s|$)`, 'g')) || [safeValue];
      drawText(chunks[0].trim(), x, y - 14, 11, false);
      if (chunks[1]) {
        drawText(chunks[1].trim(), x, y - 28, 11, false);
      }
    };

    const pageWidth = 595.28;
    const white = rgb(1, 1, 1);
    const pageBg = rgb(0.99, 0.995, 1);
    const panel = rgb(1, 1, 1);
    const panelSoft = rgb(0.94, 0.98, 1);
    const accentCyan = rgb(0.051, 0.588, 0.698); // #0D96B2
    const accentBlue = rgb(0.137, 0.357, 0.933); // #235BEC
    const textPrimary = rgb(0.09, 0.12, 0.2);
    const mutedText = rgb(0.35, 0.42, 0.56);
    const border = rgb(0.8, 0.86, 0.93);
    const left = 45;
    const cardWidth = 505;
    const col1 = 80;
    const col2 = 325;

    // Full-page futuristic dark base
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: 841.89,
      color: pageBg,
    });

    // Header background
    page.drawRectangle({
      x: 35,
      y: 742,
      width: pageWidth - 70,
      height: 70,
      color: panel,
      borderColor: border,
      borderWidth: 1,
    });
    page.drawRectangle({
      x: 35,
      y: 742,
      width: 6,
      height: 70,
      color: accentCyan,
    });
    page.drawRectangle({
      x: 35,
      y: 810,
      width: pageWidth - 70,
      height: 2,
      color: accentBlue,
    });

    // Company logo (if available)
    if (companyLogo) {
      try {
        let logoBytes: Uint8Array;
        if (companyLogo.startsWith('http')) {
          const logoRes = await fetch(companyLogo);
          logoBytes = new Uint8Array(await logoRes.arrayBuffer());
        } else {
          const logoPath = path.join(process.cwd(), 'public', companyLogo.replace(/^\/+/, ''));
          logoBytes = fs.readFileSync(logoPath);
        }
        let image;
        try {
          image = await pdfDoc.embedPng(logoBytes);
        } catch {
          image = await pdfDoc.embedJpg(logoBytes);
        }
        page.drawImage(image, {
          x: 50,
          y: 751,
          width: 52,
          height: 52,
        });
      } catch {
        // Non-blocking: continue without logo if loading fails.
      }
    }

    // Header texts
    page.drawText(toPdfSafeText(companyName), {
      x: 112,
      y: 790,
      size: 13,
      font: fontBold,
      color: textPrimary,
    });
    page.drawText('PETTY CASH RECEIPT VOUCHER', {
      x: 112,
      y: 770,
      size: 18,
      font: fontBold,
      color: accentCyan,
    });
    page.drawText('Employee Cash Acknowledgement', {
      x: 112,
      y: 753,
      size: 10,
      font: fontRegular,
      color: mutedText,
    });

    page.drawText('Receipt No', { x: 430, y: 787, size: 9, font: fontBold, color: mutedText });
    page.drawText(toPdfSafeText(transaction.receiptNumber || `TX-${transaction.id}`), {
      x: 430,
      y: 771,
      size: 12,
      font: fontBold,
      color: textPrimary,
    });
    page.drawText(`Issue Date: ${new Date().toISOString().slice(0, 10)}`, {
      x: 430,
      y: 754,
      size: 9,
      font: fontRegular,
      color: mutedText,
    });

    // Transaction details card
    page.drawRectangle({
      x: left,
      y: 582,
      width: cardWidth,
      height: 142,
      color: panel,
      borderColor: border,
      borderWidth: 1,
    });
    page.drawRectangle({
      x: left,
      y: 702,
      width: cardWidth,
      height: 22,
      color: panelSoft,
    });
    page.drawText('TRANSACTION DETAILS', {
      x: 68,
      y: 709,
      size: 10,
      font: fontBold,
      color: accentCyan,
    });

    drawLabelValue('Transaction ID', `#${transaction.id}`, col1, 688);
    drawLabelValue('Date', transactionDate, col2, 688);
    drawLabelValue('Account', transaction.accountName || 'N/A', col1, 648, 220);
    drawLabelValue('Type', transaction.type, col2, 648);
    drawLabelValue('Employee Name', employeeName || 'N/A', col1, 608, 220);
    drawLabelValue('File Number', String(fileNumber), col2, 608, 180);

    // Amount card
    page.drawRectangle({
      x: left,
      y: 488,
      width: cardWidth,
      height: 78,
      color: panel,
      borderColor: border,
      borderWidth: 1,
    });
    page.drawRectangle({
      x: left,
      y: 488,
      width: 8,
      height: 78,
      color: accentCyan,
    });
    page.drawText('Paid Amount (SAR)', { x: 68, y: 542, size: 11, font: fontBold, color: textPrimary });
    page.drawText(amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), {
      x: 68,
      y: 505,
      size: 44,
      font: fontBold,
      color: accentCyan,
    });

    // Description box
    page.drawRectangle({
      x: left,
      y: 260,
      width: cardWidth,
      height: 205,
      color: panel,
      borderColor: border,
      borderWidth: 1,
    });
    page.drawRectangle({
      x: left,
      y: 443,
      width: cardWidth,
      height: 22,
      color: panelSoft,
    });
    page.drawText('PURPOSE / DESCRIPTION', {
      x: 68,
      y: 450,
      size: 10,
      font: fontBold,
      color: accentCyan,
    });

    const rawDescription = toPdfSafeText(transaction.description || transaction.reference || 'N/A');
    const wrapped = rawDescription.match(/.{1,84}(\s|$)/g) || [rawDescription];
    wrapped.slice(0, 9).forEach((line, idx) => drawText(line.trim(), 68, 420 - idx * 17, 11, false));

    // Signature lines
    page.drawText('SIGNATURES', { x: left, y: 210, size: 10, font: fontBold, color: textPrimary });

    page.drawLine({
      start: { x: 55, y: 135 },
      end: { x: 205, y: 135 },
      thickness: 1,
      color: rgb(0.42, 0.52, 0.68),
    });
    page.drawLine({
      start: { x: 225, y: 135 },
      end: { x: 375, y: 135 },
      thickness: 1,
      color: rgb(0.42, 0.52, 0.68),
    });
    page.drawLine({
      start: { x: 395, y: 135 },
      end: { x: 545, y: 135 },
      thickness: 1,
      color: rgb(0.42, 0.52, 0.68),
    });

    page.drawText('Employee Signature', { x: 72, y: 119, size: 10, font: fontRegular, color: mutedText });
    page.drawText('Paid By (Cashier)', { x: 255, y: 119, size: 10, font: fontRegular, color: mutedText });
    page.drawText('Approved By', { x: 430, y: 119, size: 10, font: fontRegular, color: mutedText });

    // Footer note
    page.drawText('This receipt confirms that the above cash amount has been received by the employee.', {
      x: left,
      y: 82,
      size: 9,
      font: fontRegular,
      color: mutedText,
    });
    page.drawText(toPdfSafeText(`Generated by ${companyName}`), {
      x: left,
      y: 55,
      size: 8,
      font: fontRegular,
      color: mutedText,
    });

    const pdfBytes = await pdfDoc.save();

    const today = new Date().toISOString().slice(0, 10);
    const filename = `Petty_Cash_Receipt_${transaction.id}_${today}.pdf`;
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating petty cash receipt PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate receipt PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.pettyCash.read)(getHandler);
