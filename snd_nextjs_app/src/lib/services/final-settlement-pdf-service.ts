import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export interface SettlementPDFData {
  settlementNumber: string;
  settlementType: 'vacation' | 'exit';
  employeeName: string;
  employeeNameAr?: string;
  fileNumber?: string;
  iqamaNumber?: string;
  nationality?: string;
  designation?: string;
  department?: string;
  hireDate: string;
  lastWorkingDate: string;
  totalServiceYears: number;
  totalServiceMonths: number;
  totalServiceDays: number;
  lastBasicSalary: number;
  unpaidSalaryMonths: number;
  unpaidSalaryAmount: number;
  endOfServiceBenefit: number;
  benefitCalculationMethod: string;
  accruedVacationDays: number;
  accruedVacationAmount: number;
  otherBenefits: number;
  otherBenefitsDescription?: string;
  /** Overtime for PDF earnings section (Basic + OT block) */
  overtimeAmount?: number;
  overtimeHours?: number;
  pendingAdvances: number;
  equipmentDeductions: number;
  otherDeductions: number;
  otherDeductionsDescription?: string;
  // Absent calculation fields
  absentDays: number;
  absentDeduction: number;
  absentCalculationPeriod: string;
  absentCalculationStartDate?: string;
  absentCalculationEndDate?: string;
  grossAmount: number;
  totalDeductions: number;
  netAmount: number;
  currency: string;
  notes?: string;
  preparedAt: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export class FinalSettlementPDFService {
  /**
   * Get Chromium executable path for Puppeteer
   * In production (Coolify/Nixpacks), Chromium is installed via nixpacks.toml
   */
  private static getChromiumPath(): string | undefined {
    // Check environment variable first
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      console.log(`[PDF] Using PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    // In production, try to find Chromium in PATH
    if (process.env.NODE_ENV === 'production') {
      console.log('[PDF] Production mode: Attempting to find Chromium in PATH...');
      try {
        // Try chromium first
        const chromium = execSync('which chromium', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        if (chromium) {
          console.log(`[PDF] Found Chromium at: ${chromium}`);
          return chromium;
        }
      } catch (e) {
        console.log('[PDF] chromium not found, trying chromium-browser...');
        // Try chromium-browser
        try {
          const chromiumBrowser = execSync('which chromium-browser', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
          if (chromiumBrowser) {
            console.log(`[PDF] Found chromium-browser at: ${chromiumBrowser}`);
            return chromiumBrowser;
          }
        } catch (e2) {
          console.log('[PDF] chromium-browser not found, trying google-chrome...');
          // Try google-chrome as fallback
          try {
            const chrome = execSync('which google-chrome', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
            if (chrome) {
              console.log(`[PDF] Found google-chrome at: ${chrome}`);
              return chrome;
            }
          } catch (e3) {
            // Not found, will use Puppeteer's bundled Chrome
            console.warn('[PDF] Chromium not found in PATH, Puppeteer will attempt to use bundled Chrome');
            console.warn('[PDF] Error details:', { chromium: e, chromiumBrowser: e2, chrome: e3 });
          }
        }
      }
    } else {
      console.log('[PDF] Development mode: Using Puppeteer bundled Chrome');
    }

    // In development or if not found, let Puppeteer use its bundled Chrome
    return undefined;
  }

  /**
   * Format currency value with proper Saudi Riyal formatting
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format currency value without currency symbol (for PDF tables)
   */
  private static formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Get logo as base64 data URL for embedding in PDF
   */
  private static async getLogoBase64(): Promise<string> {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'snd-logo.png');
      const logoBuffer = await fs.readFile(logoPath);
      const base64 = logoBuffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error('Error reading logo file:', error);
      return '';
    }
  }

  /**
   * Generate PDF document for final settlement
   */
  static async generateSettlementPDF(
    settlementData: SettlementPDFData,
    language: 'en' | 'ar' = 'en'
  ): Promise<Buffer> {
    let browser;
    let page;
    const maxRetries = 2;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Get Chromium path (for production environments like Coolify/Nixpacks)
        const chromiumPath = this.getChromiumPath();

        const launchOptions: any = {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
          timeout: 60000,
        };

        // Set executablePath if Chromium was found
        if (chromiumPath) {
          launchOptions.executablePath = chromiumPath;
          console.log(`[PDF] Using Chromium at: ${chromiumPath}`);
        } else {
          console.log('[PDF] Using Puppeteer bundled Chrome');
        }

        browser = await puppeteer.launch(launchOptions);

        page = await browser.newPage();
        
        // Set up error handlers to catch page crashes
        const pageErrors: Error[] = [];
        page.on('error', (error) => {
          console.error('Page error:', error);
          pageErrors.push(error);
        });
        page.on('pageerror', (error) => {
          console.error('Page error event:', error);
          pageErrors.push(error);
        });
        
        // Set page format and margins
        await page.setViewport({ width: 1200, height: 1600 });
        
        const htmlContent = language === 'ar' 
          ? await this.generateArabicTemplate(settlementData)
          : await this.generateEnglishTemplate(settlementData);

        // Use domcontentloaded - doesn't wait for images/resources that might timeout
        await page.setContent(htmlContent, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
        
        // Brief wait for styles to apply
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if page is still open and connected before generating PDF
        if (page.isClosed()) {
          throw new Error('Page was closed before PDF generation');
        }
        
        // Verify page is still connected to browser
        try {
          const readyState = await page.evaluate(() => document.readyState);
          if (readyState !== 'complete' && readyState !== 'interactive') {
            console.warn(`Page readyState is ${readyState}, proceeding anyway`);
          }
        } catch (e) {
          throw new Error(`Page is not connected: ${e instanceof Error ? e.message : String(e)}`);
        }
        
        if (pageErrors.length > 0) {
          console.warn(`Page errors detected but continuing: ${pageErrors.map(e => e.message).join(', ')}`);
        }

        // Generate PDF with error handling
        let pdfBuffer;
        try {
          pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
              top: '8mm',
              right: '8mm',
              bottom: '8mm',
              left: '8mm',
            },
            timeout: 60000,
          });
        } catch (pdfError) {
          // Check if page closed during PDF generation
          if (page.isClosed()) {
            throw new Error(`Page closed during PDF generation. Original error: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
          }
          throw pdfError;
        }

        if (!pdfBuffer) {
          throw new Error('PDF buffer from Puppeteer is null or undefined');
        }
        
        const buffer = Buffer.from(pdfBuffer);
        if (!buffer || buffer.length === 0) {
          console.error('PDF buffer is empty after conversion, original pdfBuffer type:', typeof pdfBuffer, 'length:', pdfBuffer?.length);
          throw new Error('PDF buffer is empty after generation');
        }
        return buffer;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Error in generateSettlementPDF (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError);
        
        // Clean up on error
        if (page && !page.isClosed()) {
          try {
            await page.close();
          } catch (e) {
            // Ignore
          }
        }
        if (browser) {
          try {
            await browser.close();
          } catch (e) {
            // Ignore
          }
        }
        browser = undefined;
        page = undefined;
        
        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw new Error(`Failed to generate PDF after ${maxRetries + 1} attempts: ${lastError.message}`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        // Only close if we succeeded
        if (browser && !lastError) {
          try {
            if (page && !page.isClosed()) {
              await page.close();
            }
            await browser.close();
          } catch (closeError) {
            console.error('Error closing browser:', closeError);
          }
        }
      }
    }
    
    throw new Error('Unexpected end of retry loop');
  }

  /**
   * Generate bilingual PDF (Arabic and English)
   */
  static async generateBilingualSettlementPDF(
    settlementData: SettlementPDFData
  ): Promise<Buffer> {
    let browser;
    let page;
    const maxRetries = 2;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Get Chromium path (for production environments like Coolify/Nixpacks)
        const chromiumPath = this.getChromiumPath();

        const launchOptions: any = {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
          timeout: 60000,
        };

        // Set executablePath if Chromium was found
        if (chromiumPath) {
          launchOptions.executablePath = chromiumPath;
          console.log(`[PDF] Using Chromium at: ${chromiumPath}`);
        } else {
          console.log('[PDF] Using Puppeteer bundled Chrome');
        }

        browser = await puppeteer.launch(launchOptions);

        page = await browser.newPage();
        
        // Set up error handlers to catch page crashes
        const pageErrors: Error[] = [];
        page.on('error', (error) => {
          console.error('Page error:', error);
          pageErrors.push(error);
        });
        page.on('pageerror', (error) => {
          console.error('Page error event:', error);
          pageErrors.push(error);
        });
        
        await page.setViewport({ width: 1200, height: 4000 });
        
        const htmlContent = await this.generateBilingualTemplate(settlementData);
        
        // Use domcontentloaded - doesn't wait for images/resources that might timeout
        await page.setContent(htmlContent, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
        
        // Brief wait for styles to apply
        await new Promise(resolve => setTimeout(resolve, 300));

        // Check if page is still open and connected before generating PDF
        if (page.isClosed()) {
          throw new Error('Page was closed before PDF generation');
        }
        
        // Verify page is still connected to browser
        try {
          const readyState = await page.evaluate(() => document.readyState);
          if (readyState !== 'complete' && readyState !== 'interactive') {
            console.warn(`Page readyState is ${readyState}, proceeding anyway`);
          }
        } catch (e) {
          throw new Error(`Page is not connected: ${e instanceof Error ? e.message : String(e)}`);
        }
        
        if (pageErrors.length > 0) {
          console.warn(`Page errors detected but continuing: ${pageErrors.map(e => e.message).join(', ')}`);
        }

        // Generate PDF with error handling
        let pdfBuffer;
        try {
          pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
              top: '10mm',
              right: '10mm',
              bottom: '10mm',
              left: '10mm',
            },
            scale: 1,
            timeout: 60000,
          });
        } catch (pdfError) {
          // Check if page closed during PDF generation
          if (page.isClosed()) {
            throw new Error(`Page closed during PDF generation. Original error: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
          }
          throw pdfError;
        }

        if (!pdfBuffer) {
          throw new Error('PDF buffer from Puppeteer is null or undefined');
        }
        
        const buffer = Buffer.from(pdfBuffer);
        if (!buffer || buffer.length === 0) {
          console.error('PDF buffer is empty after conversion, original pdfBuffer type:', typeof pdfBuffer, 'length:', pdfBuffer?.length);
          throw new Error('PDF buffer is empty after generation');
        }
        return buffer;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Error in generateBilingualSettlementPDF (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError);
        
        // Clean up on error
        if (page && !page.isClosed()) {
          try {
            await page.close();
          } catch (e) {
            // Ignore
          }
        }
        if (browser) {
          try {
            await browser.close();
          } catch (e) {
            // Ignore
          }
        }
        browser = undefined;
        page = undefined;
        
        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw new Error(`Failed to generate PDF after ${maxRetries + 1} attempts: ${lastError.message}`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        // Only close if we succeeded
        if (browser && !lastError) {
          try {
            if (page && !page.isClosed()) {
              await page.close();
            }
            await browser.close();
          } catch (closeError) {
            console.error('Error closing browser:', closeError);
          }
        }
      }
    }
    
    throw new Error('Unexpected end of retry loop');
  }

  /**
   * Save PDF to file system and return file path
   */
  static async saveSettlementPDF(
    settlementData: SettlementPDFData,
    language: 'en' | 'ar' | 'bilingual' = 'bilingual'
  ): Promise<string> {
    const pdfBuffer = language === 'bilingual' 
      ? await this.generateBilingualSettlementPDF(settlementData)
      : await this.generateSettlementPDF(settlementData, language);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'final-settlements');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate filename
    const filename = `${settlementData.settlementNumber}_${language}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, filename);

    // Save file
    await fs.writeFile(filePath, pdfBuffer);

    // Return relative path for database storage
    return `/uploads/final-settlements/${filename}`;
  }

  /**
   * Generate English PDF template
   */
  private static async generateEnglishTemplate(data: SettlementPDFData): Promise<string> {
    const logoBase64 = await this.getLogoBase64();
    const formatCurrency = (amount: number) => `${data.currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const overtimeAmount = data.overtimeAmount ?? 0;
    const hasBasicOtSection = data.unpaidSalaryAmount > 0 || overtimeAmount > 0;
    const basicOtSubtotal = data.unpaidSalaryAmount + overtimeAmount;
    const overtimeLabelSuffix =
      data.overtimeHours != null && data.overtimeHours > 0 ? ` (${data.overtimeHours} hrs)` : '';
    const deferredVacationAllowance =
      data.settlementType === 'vacation' && data.endOfServiceBenefit > 0
        ? data.endOfServiceBenefit
        : 0;
    const netPayableNow =
      deferredVacationAllowance > 0 ? data.netAmount - deferredVacationAllowance : data.netAmount;
    const hasOthersSubsection =
      data.otherBenefits > 0 ||
      (data.settlementType === 'exit' && data.endOfServiceBenefit > 0) ||
      (data.settlementType === 'exit' && data.accruedVacationAmount > 0);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Final Settlement - ${data.settlementNumber}</title>
    <style>
        @page {
            margin: 20mm 15mm 20mm 15mm;
            @top-left {
                content: url("file://${path.join(process.cwd(), 'public', 'snd-logo.png')}");
                width: 150px;
                height: 150px;
            }
        }
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.2;
            margin: 0;
            padding: 5px;
            color: #333;
            font-size: 9px;
        }
        .header {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .subsection-header td {
            background-color: #f8fafc;
            font-weight: bold;
            color: #1e40af;
        }
        .logo {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
        }
        .header-content {
            flex: 1;
            text-align: center;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .document-title {
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            color: #1e40af;
        }
        .settlement-number {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
        }
        .section {
            margin-bottom: 15px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #d1d5db;
        }
        .label {
            font-weight: bold;
            color: #374151;
        }
        .value {
            color: #111827;
        }
        .calculation-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .calculation-table th,
        .calculation-table td {
            border: 1px solid #d1d5db;
            padding: 12px;
            text-align: left;
        }
        .calculation-table th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #374151;
        }
        .calculation-table .amount {
            text-align: right;
            font-weight: bold;
        }
        .total-row {
            background-color: #eff6ff;
            font-weight: bold;
        }
        .net-amount {
            background-color: #dcfce7;
            font-size: 18px;
            font-weight: bold;
        }
        .signatures {
            margin-top: 25px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .signature-box {
            border: 1px solid #d1d5db;
            padding: 20px;
            min-height: 100px;
        }
        .signature-title {
            font-weight: bold;
            margin-bottom: 15px;
            color: #374151;
        }
        .legal-text {
            font-size: 12px;
            color: #6b7280;
            margin-top: 30px;
            line-height: 1.5;
        }
        .calculation-method {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .vacation-payout-note {
            font-size: 12px;
            color: #57534e;
            font-style: italic;
            margin: 12px 0 0 0;
            padding: 0 2px;
            line-height: 1.45;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${logoBase64}" alt="Company Logo" class="logo" />
        <div class="header-content">
            <div class="company-name">Samhan Naser Al-Dosari Est | مؤسسة سمحان ناصر الدوسري</div>
            <div class="document-title">FINAL SETTLEMENT CERTIFICATE | شهادة التسوية النهائية</div>
            <div class="settlement-number">Settlement No: ${data.settlementNumber}</div>
            <div>Date: ${formatDate(data.preparedAt)}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Employee Information</div>
        <div class="info-grid">
            <div class="info-row">
                <span class="label">Full Name:</span>
                <span class="value">${data.employeeName}</span>
            </div>
            <div class="info-row">
                <span class="label">File Number:</span>
                <span class="value">${data.fileNumber || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="label">Iqama Number:</span>
                <span class="value">${data.iqamaNumber || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="label">Nationality:</span>
                <span class="value">${data.nationality || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="label">Position:</span>
                <span class="value">${data.designation || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="label">Department:</span>
                <span class="value">${data.department || 'N/A'}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Service Details</div>
        <div class="info-grid">
            <div class="info-row">
                <span class="label">Hire Date:</span>
                <span class="value">${formatDate(data.hireDate)}</span>
            </div>
            <div class="info-row">
                <span class="label">Last Working Date:</span>
                <span class="value">${formatDate(data.lastWorkingDate)}</span>
            </div>
            <div class="info-row">
                <span class="label">Total Service:</span>
                <span class="value">${data.totalServiceYears} Years, ${data.totalServiceMonths} Months, ${data.totalServiceDays} Days</span>
            </div>
            <div class="info-row">
                <span class="label">Last Basic Salary:</span>
                <span class="value">${formatCurrency(data.lastBasicSalary)}</span>
            </div>
        </div>
    </div>

    ${data.unpaidSalaryMonths > 0 ? `
    <div class="section">
        <div class="section-title">Unpaid Salary Information</div>
        <div class="info-row">
            <span class="label">Unpaid Salary Months:</span>
            <span class="value">${data.unpaidSalaryMonths} months</span>
        </div>
        <div class="info-row">
            <span class="label">Total Unpaid Amount:</span>
            <span class="value">${formatCurrency(data.unpaidSalaryAmount)}</span>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">End of Service Benefit Calculation</div>
        <div class="calculation-method">
            <strong>Calculation Method:</strong> ${data.benefitCalculationMethod === 'resigned' ? 'Employee Resignation' : 'Company Termination'}<br>
            <strong>Saudi Labor Law Article 84:</strong> End of service benefits are calculated based on the length of service and termination reason.
        </div>
        <div class="info-row">
            <span class="label">End of Service Benefit:</span>
            <span class="value">${formatCurrency(data.endOfServiceBenefit)}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Final Settlement Calculation</div>
        <table class="calculation-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Amount (${data.currency})</th>
                </tr>
            </thead>
            <tbody>
                <tr class="subsection-header">
                    <td colspan="2"><strong>Earnings</strong></td>
                </tr>
                ${hasBasicOtSection ? `
                ${data.unpaidSalaryAmount > 0 ? `
                <tr>
                    <td>Basic Salary (unpaid salaries – ${data.unpaidSalaryMonths} months)</td>
                    <td class="amount">${this.formatAmount(data.unpaidSalaryAmount)}</td>
                </tr>
                ` : ''}
                ${overtimeAmount > 0 ? `
                <tr>
                    <td>Overtime (OT)${overtimeLabelSuffix}</td>
                    <td class="amount">${this.formatAmount(overtimeAmount)}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td><strong>Total (Basic Salary + OT)</strong></td>
                    <td class="amount"><strong>${this.formatAmount(basicOtSubtotal)}</strong></td>
                </tr>
                ${hasBasicOtSection && data.totalDeductions > 0 ? `
                <tr class="subsection-header">
                    <td colspan="2"><strong>Deductions</strong></td>
                </tr>
                ${data.absentDeduction > 0 ? `
                <tr>
                    <td>Absent Deduction (${data.absentDays} days)</td>
                    <td class="amount">(${this.formatAmount(data.absentDeduction)})</td>
                </tr>
                ` : ''}
                ${data.pendingAdvances > 0 ? `
                <tr>
                    <td>Pending Advances</td>
                    <td class="amount">(${this.formatAmount(data.pendingAdvances)})</td>
                </tr>
                ` : ''}
                ${data.equipmentDeductions > 0 ? `
                <tr>
                    <td>Equipment Deductions</td>
                    <td class="amount">(${this.formatAmount(data.equipmentDeductions)})</td>
                </tr>
                ` : ''}
                ${data.otherDeductions > 0 ? `
                <tr>
                    <td>Other Deductions ${data.otherDeductionsDescription ? `(${data.otherDeductionsDescription})` : ''}</td>
                    <td class="amount">(${this.formatAmount(data.otherDeductions)})</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td><strong>Total Deductions</strong></td>
                    <td class="amount"><strong>(${this.formatAmount(data.totalDeductions)})</strong></td>
                </tr>
                ` : ''}
                ${hasOthersSubsection ? `
                <tr class="subsection-header">
                    <td colspan="2"><strong>Others</strong></td>
                </tr>
                ` : ''}
                ` : ''}
                ${data.settlementType === 'exit' && data.endOfServiceBenefit > 0 ? `
                <tr>
                    <td>End of Service Benefits</td>
                    <td class="amount">${this.formatAmount(data.endOfServiceBenefit)}</td>
                </tr>
                ` : ''}
                ${data.settlementType === 'exit' && data.accruedVacationAmount > 0 ? `
                <tr>
                    <td>Accrued Vacation (${data.accruedVacationDays} days)</td>
                    <td class="amount">${this.formatAmount(data.accruedVacationAmount)}</td>
                </tr>
                ` : ''}
                ${data.otherBenefits > 0 ? `
                <tr>
                    <td>Other Benefits ${data.otherBenefitsDescription ? `(${data.otherBenefitsDescription})` : ''}</td>
                    <td class="amount">${this.formatAmount(data.otherBenefits)}</td>
                </tr>
                ` : ''}
                ${!hasBasicOtSection && data.totalDeductions > 0 ? `
                <tr class="subsection-header">
                    <td colspan="2"><strong>Deductions</strong></td>
                </tr>
                ${data.absentDeduction > 0 ? `
                <tr>
                    <td>Absent Deduction (${data.absentDays} days)</td>
                    <td class="amount">(${this.formatAmount(data.absentDeduction)})</td>
                </tr>
                ` : ''}
                ${data.pendingAdvances > 0 ? `
                <tr>
                    <td>Pending Advances</td>
                    <td class="amount">(${this.formatAmount(data.pendingAdvances)})</td>
                </tr>
                ` : ''}
                ${data.equipmentDeductions > 0 ? `
                <tr>
                    <td>Equipment Deductions</td>
                    <td class="amount">(${this.formatAmount(data.equipmentDeductions)})</td>
                </tr>
                ` : ''}
                ${data.otherDeductions > 0 ? `
                <tr>
                    <td>Other Deductions ${data.otherDeductionsDescription ? `(${data.otherDeductionsDescription})` : ''}</td>
                    <td class="amount">(${this.formatAmount(data.otherDeductions)})</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td><strong>Total Deductions</strong></td>
                    <td class="amount"><strong>(${this.formatAmount(data.totalDeductions)})</strong></td>
                </tr>
                ` : ''}
                <tr class="net-amount">
                    <td><strong>NET SETTLEMENT AMOUNT</strong></td>
                    <td class="amount"><strong>${this.formatAmount(netPayableNow)}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    ${deferredVacationAllowance > 0 ? `
    <div class="section">
        <div class="section-title">Vacation allowance (payable after return from vacation)</div>
        <table class="calculation-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Amount (${data.currency})</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Vacation Allowance</td>
                    <td class="amount">${this.formatAmount(deferredVacationAllowance)}</td>
                </tr>
            </tbody>
        </table>
        <p class="vacation-payout-note">Paid after the employee returns from vacation.</p>
    </div>
    ` : ''}

    ${data.notes ? `
    <div class="section">
        <div class="section-title">Notes</div>
        <p>${data.notes}</p>
    </div>
    ` : ''}

    <div class="legal-text">
        <p><strong>Legal Declaration:</strong> This final settlement is prepared in accordance with the Saudi Labor Law and represents the complete and final settlement of all dues between the company and the employee. By signing this document, both parties acknowledge that all financial obligations have been settled and no further claims exist.</p>
    </div>

    <div class="signatures">
        <div class="signature-box">
            <div class="signature-title">Employee Acknowledgment</div>
            <p>I acknowledge receipt of the above settlement amount and confirm that this represents the complete and final settlement of all my dues from the company.</p>
            <br><br>
            <div>Signature: ________________________</div>
            <br>
            <div>Name: ${data.employeeName}</div>
            <div>Date: ________________________</div>
        </div>
        <div class="signature-box">
            <div class="signature-title">Company Authorization</div>
            <p>This settlement has been approved and authorized by the company management.</p>
            <br><br>
            <div>Signature: ________________________</div>
            <br>
            <div>Name: ________________________</div>
            <div>Title: HR Manager</div>
            <div>Date: ________________________</div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate Arabic PDF template
   */
  private static async generateArabicTemplate(data: SettlementPDFData): Promise<string> {
    const logoBase64 = await this.getLogoBase64();
    const formatCurrency = (amount: number) => `${amount.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ${data.currency}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('ar-SA');

    const overtimeAmount = data.overtimeAmount ?? 0;
    const hasBasicOtSection = data.unpaidSalaryAmount > 0 || overtimeAmount > 0;
    const basicOtSubtotal = data.unpaidSalaryAmount + overtimeAmount;
    const overtimeLabelSuffix =
      data.overtimeHours != null && data.overtimeHours > 0 ? ` (${data.overtimeHours} ساعة)` : '';
    const deferredVacationAllowance =
      data.settlementType === 'vacation' && data.endOfServiceBenefit > 0
        ? data.endOfServiceBenefit
        : 0;
    const netPayableNow =
      deferredVacationAllowance > 0 ? data.netAmount - deferredVacationAllowance : data.netAmount;
    const hasOthersSubsection =
      data.otherBenefits > 0 ||
      (data.settlementType === 'exit' && data.endOfServiceBenefit > 0) ||
      (data.settlementType === 'exit' && data.accruedVacationAmount > 0);

    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>التسوية النهائية - ${data.settlementNumber}</title>
    <style>
        @page {
            margin: 20mm 15mm 20mm 15mm;
            @top-left {
                content: url("file://${path.join(process.cwd(), 'public', 'snd-logo.png')}");
                width: 150px;
                height: 150px;
            }
        }
        body {
            font-family: 'Tahoma', 'Arial', sans-serif;
            line-height: 1.3;
            margin: 0;
            padding: 10px;
            color: #333;
            font-size: 10px;
            direction: rtl;
            text-align: right;
        }
        .header {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .subsection-header td {
            background-color: #f8fafc;
            font-weight: bold;
            color: #1e40af;
        }
        .logo {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
        }
        .header-content {
            flex: 1;
            text-align: center;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .document-title {
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            color: #1e40af;
        }
        .settlement-number {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
        }
        .section {
            margin-bottom: 15px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #d1d5db;
        }
        .label {
            font-weight: bold;
            color: #374151;
        }
        .value {
            color: #111827;
        }
        .calculation-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .calculation-table th,
        .calculation-table td {
            border: 1px solid #d1d5db;
            padding: 12px;
            text-align: right;
        }
        .calculation-table th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #374151;
        }
        .calculation-table .amount {
            text-align: left;
            font-weight: bold;
        }
        .total-row {
            background-color: #eff6ff;
            font-weight: bold;
        }
        .net-amount {
            background-color: #dcfce7;
            font-size: 18px;
            font-weight: bold;
        }
        .signatures {
            margin-top: 25px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .signature-box {
            border: 1px solid #d1d5db;
            padding: 20px;
            min-height: 100px;
        }
        .signature-title {
            font-weight: bold;
            margin-bottom: 15px;
            color: #374151;
        }
        .legal-text {
            font-size: 12px;
            color: #6b7280;
            margin-top: 30px;
            line-height: 1.5;
        }
        .calculation-method {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .vacation-payout-note {
            font-size: 12px;
            color: #57534e;
            font-style: italic;
            margin: 12px 0 0 0;
            padding: 0 2px;
            line-height: 1.45;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${logoBase64}" alt="Company Logo" class="logo" />
        <div class="header-content">
            <div class="company-name">Samhan Naser Al-Dosari Est | مؤسسة سمحان ناصر الدوسري</div>
            <div class="document-title">FINAL SETTLEMENT CERTIFICATE | شهادة التسوية النهائية</div>
            <div class="settlement-number">رقم التسوية: ${data.settlementNumber}</div>
            <div>التاريخ: ${formatDate(data.preparedAt)}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">بيانات الموظف</div>
        <div class="info-grid">
            <div class="info-row">
                <span class="label">الاسم الكامل:</span>
                <span class="value">${data.employeeNameAr || data.employeeName}</span>
            </div>
            <div class="info-row">
                <span class="label">رقم الملف:</span>
                <span class="value">${data.fileNumber || 'غير متوفر'}</span>
            </div>
            <div class="info-row">
                <span class="label">رقم الإقامة:</span>
                <span class="value">${data.iqamaNumber || 'غير متوفر'}</span>
            </div>
            <div class="info-row">
                <span class="label">الجنسية:</span>
                <span class="value">${data.nationality || 'غير متوفر'}</span>
            </div>
            <div class="info-row">
                <span class="label">المنصب:</span>
                <span class="value">${data.designation || 'غير متوفر'}</span>
            </div>
            <div class="info-row">
                <span class="label">القسم:</span>
                <span class="value">${data.department || 'غير متوفر'}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">تفاصيل الخدمة</div>
        <div class="info-grid">
            <div class="info-row">
                <span class="label">تاريخ التوظيف:</span>
                <span class="value">${formatDate(data.hireDate)}</span>
            </div>
            <div class="info-row">
                <span class="label">آخر يوم عمل:</span>
                <span class="value">${formatDate(data.lastWorkingDate)}</span>
            </div>
            <div class="info-row">
                <span class="label">إجمالي مدة الخدمة:</span>
                <span class="value">${data.totalServiceYears} سنة، ${data.totalServiceMonths} شهر، ${data.totalServiceDays} يوم</span>
            </div>
            <div class="info-row">
                <span class="label">آخر راتب أساسي:</span>
                <span class="value">${formatCurrency(data.lastBasicSalary)}</span>
            </div>
        </div>
    </div>

    ${data.unpaidSalaryMonths > 0 ? `
    <div class="section">
        <div class="section-title">معلومات الراتب غير المدفوع</div>
        <div class="info-row">
            <span class="label">عدد الأشهر غير المدفوعة:</span>
            <span class="value">${data.unpaidSalaryMonths} شهر</span>
        </div>
        <div class="info-row">
            <span class="label">إجمالي المبلغ غير المدفوع:</span>
            <span class="value">${formatCurrency(data.unpaidSalaryAmount)}</span>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">حساب مكافأة نهاية الخدمة</div>
        <div class="calculation-method">
            <strong>طريقة الحساب:</strong> ${data.benefitCalculationMethod === 'resigned' ? 'استقالة الموظف' : 'إنهاء خدمة من الشركة'}<br>
            <strong>المادة 84 من نظام العمل السعودي:</strong> تُحسب مكافأة نهاية الخدمة بناءً على مدة الخدمة وسبب انتهاء العلاقة العمالية.
        </div>
        <div class="info-row">
            <span class="label">مكافأة نهاية الخدمة:</span>
            <span class="value">${formatCurrency(data.endOfServiceBenefit)}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">حساب التسوية النهائية</div>
        <table class="calculation-table">
            <thead>
                <tr>
                    <th>البيان</th>
                    <th>المبلغ (${data.currency})</th>
                </tr>
            </thead>
            <tbody>
                <tr class="subsection-header">
                    <td colspan="2"><strong>المستحقات</strong></td>
                </tr>
                ${hasBasicOtSection ? `
                ${data.unpaidSalaryAmount > 0 ? `
                <tr>
                    <td>الراتب الأساسي (رواتب غير مدفوعة – ${data.unpaidSalaryMonths} شهر)</td>
                    <td class="amount">${this.formatAmount(data.unpaidSalaryAmount)}</td>
                </tr>
                ` : ''}
                ${overtimeAmount > 0 ? `
                <tr>
                    <td>عمل إضافي (OT)${overtimeLabelSuffix}</td>
                    <td class="amount">${this.formatAmount(overtimeAmount)}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td><strong>الإجمالي (راتب أساسي + عمل إضافي)</strong></td>
                    <td class="amount"><strong>${this.formatAmount(basicOtSubtotal)}</strong></td>
                </tr>
                ${hasBasicOtSection && data.totalDeductions > 0 ? `
                <tr class="subsection-header">
                    <td colspan="2"><strong>الخصومات</strong></td>
                </tr>
                ${data.absentDeduction > 0 ? `
                <tr>
                    <td>خصم الغياب (${data.absentDays} أيام)</td>
                    <td class="amount">(${this.formatAmount(data.absentDeduction)})</td>
                </tr>
                ` : ''}
                ${data.pendingAdvances > 0 ? `
                <tr>
                    <td>السلف المعلقة</td>
                    <td class="amount">(${this.formatAmount(data.pendingAdvances)})</td>
                </tr>
                ` : ''}
                ${data.equipmentDeductions > 0 ? `
                <tr>
                    <td>خصومات المعدات</td>
                    <td class="amount">(${this.formatAmount(data.equipmentDeductions)})</td>
                </tr>
                ` : ''}
                ${data.otherDeductions > 0 ? `
                <tr>
                    <td>خصومات أخرى ${data.otherDeductionsDescription ? `(${data.otherDeductionsDescription})` : ''}</td>
                    <td class="amount">(${this.formatAmount(data.otherDeductions)})</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td><strong>إجمالي الخصومات</strong></td>
                    <td class="amount"><strong>(${this.formatAmount(data.totalDeductions)})</strong></td>
                </tr>
                ` : ''}
                ${hasOthersSubsection ? `
                <tr class="subsection-header">
                    <td colspan="2"><strong>أخرى</strong></td>
                </tr>
                ` : ''}
                ` : ''}
                ${data.settlementType === 'exit' && data.endOfServiceBenefit > 0 ? `
                <tr>
                    <td>مكافأة نهاية الخدمة</td>
                    <td class="amount">${this.formatAmount(data.endOfServiceBenefit)}</td>
                </tr>
                ` : ''}
                ${data.settlementType === 'exit' && data.accruedVacationAmount > 0 ? `
                <tr>
                    <td>رصيد الإجازات (${data.accruedVacationDays} يوم)</td>
                    <td class="amount">${this.formatAmount(data.accruedVacationAmount)}</td>
                </tr>
                ` : ''}
                ${data.otherBenefits > 0 ? `
                <tr>
                    <td>مزايا أخرى ${data.otherBenefitsDescription ? `(${data.otherBenefitsDescription})` : ''}</td>
                    <td class="amount">${this.formatAmount(data.otherBenefits)}</td>
                </tr>
                ` : ''}
                ${!hasBasicOtSection && data.totalDeductions > 0 ? `
                <tr class="subsection-header">
                    <td colspan="2"><strong>الخصومات</strong></td>
                </tr>
                ${data.absentDeduction > 0 ? `
                <tr>
                    <td>خصم الغياب (${data.absentDays} أيام)</td>
                    <td class="amount">(${this.formatAmount(data.absentDeduction)})</td>
                </tr>
                ` : ''}
                ${data.pendingAdvances > 0 ? `
                <tr>
                    <td>السلف المعلقة</td>
                    <td class="amount">(${this.formatAmount(data.pendingAdvances)})</td>
                </tr>
                ` : ''}
                ${data.equipmentDeductions > 0 ? `
                <tr>
                    <td>خصومات المعدات</td>
                    <td class="amount">(${this.formatAmount(data.equipmentDeductions)})</td>
                </tr>
                ` : ''}
                ${data.otherDeductions > 0 ? `
                <tr>
                    <td>خصومات أخرى ${data.otherDeductionsDescription ? `(${data.otherDeductionsDescription})` : ''}</td>
                    <td class="amount">(${this.formatAmount(data.otherDeductions)})</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td><strong>إجمالي الخصومات</strong></td>
                    <td class="amount"><strong>(${this.formatAmount(data.totalDeductions)})</strong></td>
                </tr>
                ` : ''}
                <tr class="net-amount">
                    <td><strong>صافي مبلغ التسوية</strong></td>
                    <td class="amount"><strong>${this.formatAmount(netPayableNow)}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    ${deferredVacationAllowance > 0 ? `
    <div class="section">
        <div class="section-title">بدل إجازة (يُصرف بعد العودة من الإجازة)</div>
        <table class="calculation-table">
            <thead>
                <tr>
                    <th>البيان</th>
                    <th>المبلغ (${data.currency})</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>بدل إجازة</td>
                    <td class="amount">${this.formatAmount(deferredVacationAllowance)}</td>
                </tr>
            </tbody>
        </table>
        <p class="vacation-payout-note">يُدفع بعد عودة الموظف من الإجازة.</p>
    </div>
    ` : ''}

    ${data.notes ? `
    <div class="section">
        <div class="section-title">ملاحظات</div>
        <p>${data.notes}</p>
    </div>
    ` : ''}

    <div class="legal-text">
        <p><strong>إقرار قانوني:</strong> تم إعداد هذه التسوية النهائية وفقاً لنظام العمل السعودي وتمثل التسوية الكاملة والنهائية لجميع المستحقات بين الشركة والموظف. بتوقيع هذه الوثيقة، يقر الطرفان بأن جميع الالتزامات المالية قد تمت تسويتها ولا توجد مطالبات أخرى.</p>
    </div>

    <div class="signatures">
        <div class="signature-box">
            <div class="signature-title">إقرار الموظف</div>
            <p>أقر بإستلام مبلغ التسوية المذكور أعلاه وأؤكد أن هذا يمثل التسوية الكاملة والنهائية لجميع مستحقاتي من الشركة.</p>
            <br><br>
            <div>التوقيع: ________________________</div>
            <br>
            <div>الاسم: ${data.employeeNameAr || data.employeeName}</div>
            <div>التاريخ: ________________________</div>
        </div>
        <div class="signature-box">
            <div class="signature-title">تفويض الشركة</div>
            <p>تم اعتماد وتفويض هذه التسوية من قبل إدارة الشركة.</p>
            <br><br>
            <div>التوقيع: ________________________</div>
            <br>
            <div>الاسم: ________________________</div>
            <div>المنصب: مدير الموارد البشرية</div>
            <div>التاريخ: ________________________</div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate bilingual PDF template (Arabic and English)
   */
  private static async generateBilingualTemplate(data: SettlementPDFData): Promise<string> {
    const logoBase64 = await this.getLogoBase64();
    const formatCurrency = (amount: number) => `${data.currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const formatCurrencyAr = (amount: number) => `${amount.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ${data.currency}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formatDateAr = (date: string) => new Date(date).toLocaleDateString('ar-SA');

    const overtimeAmount = data.overtimeAmount ?? 0;
    const hasBasicOtSection = data.unpaidSalaryAmount > 0 || overtimeAmount > 0;
    const basicOtSubtotal = data.unpaidSalaryAmount + overtimeAmount;
    const overtimeLabelSuffix =
      data.overtimeHours != null && data.overtimeHours > 0 ? ` (${data.overtimeHours} hrs)` : '';
    const overtimeLabelSuffixAr =
      data.overtimeHours != null && data.overtimeHours > 0 ? ` (${data.overtimeHours} ساعة)` : '';
    const deferredVacationAllowance =
      data.settlementType === 'vacation' && data.endOfServiceBenefit > 0
        ? data.endOfServiceBenefit
        : 0;
    const netPayableNow =
      deferredVacationAllowance > 0 ? data.netAmount - deferredVacationAllowance : data.netAmount;
    const hasOthersSubsection =
      data.otherBenefits > 0 ||
      (data.settlementType === 'exit' && data.endOfServiceBenefit > 0) ||
      (data.settlementType === 'exit' && data.accruedVacationAmount > 0);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Final Settlement / التسوية النهائية - ${data.settlementNumber}</title>
    <style>
        /* rem-based (html 62.5% → 1rem ≈ 10px); compact spacing for single A4 (no PDF scale shrink) */
        @page {
            margin: 7mm;
        }
        html {
            font-size: 62.5%;
        }
        body {
            font-family: Helvetica, Arial, "Segoe UI", Roboto, "Noto Sans Arabic", "Tahoma", sans-serif;
            line-height: 1.35;
            margin: 0;
            padding: 0;
            color: #1c1917;
            font-size: 1.15rem;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .pdf-page-shell {
            box-sizing: border-box;
            padding: 0;
        }
        .pdf-page-main {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        .pdf-page-footer {
            margin-top: 0.55rem;
        }
        .bilingual-header {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #cbd5e1;
        }
        .logo {
            width: 4.2rem;
            height: 4.2rem;
            flex-shrink: 0;
            object-fit: contain;
        }
        .header-content {
            flex: 1;
            text-align: center;
            padding-top: 0;
        }
        .company-name {
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #64748b;
            margin: 0 0 0.35rem 0;
        }
        .document-title {
            font-size: 1.95rem;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 0.45rem 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
        }
        .document-title-ar {
            display: block;
            margin-top: 0.25rem;
            font-size: 0.88em;
            font-weight: 700;
            color: #334155;
        }
        .doc-meta {
            font-size: 1.05rem;
            color: #57534e;
            margin: 0 0 0.15rem 0;
            text-align: center;
        }
        .doc-meta-value {
            font-weight: 600;
            color: #292524;
        }
        .bilingual-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1px solid #e2e8f0;
            border-radius: 0.6rem;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
        }
        .english-side {
            padding: 0;
            border-right: 1px solid #e2e8f0;
            background: #fff;
        }
        .arabic-side {
            padding: 0;
            direction: rtl;
            text-align: right;
            background: #fafafa;
        }
        .section-title {
            font-size: 1.15rem;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
            padding: 0.4rem 0.85rem;
            background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
            border-bottom: 1px solid #e2e8f0;
            letter-spacing: 0.02em;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 0.75rem;
            padding: 0.32rem 0.85rem;
            border-bottom: 1px solid #f1f5f9;
            font-size: 1.12rem;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: 600;
            color: #44403c;
            text-align: left;
            flex: 0 1 auto;
        }
        .arabic-side .label {
            text-align: right;
        }
        .value {
            color: #1c1917;
            text-align: right;
            font-weight: 400;
        }
        .english-side .value {
            text-align: right;
        }
        .arabic-side .value {
            text-align: left;
        }
        .table-wrap {
            border: 1px solid #e2e8f0;
            border-radius: 0.6rem;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
        }
        .block-heading {
            font-size: 1.12rem;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 0.35rem 0;
            padding-left: 0.15rem;
            letter-spacing: 0.03em;
        }
        .calculation-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            font-size: 1.1rem;
        }
        .calculation-table th,
        .calculation-table td {
            border-bottom: 1px solid #e7e5e4;
            padding: 0.38rem 0.65rem;
            vertical-align: top;
        }
        .calculation-table thead th {
            background: #f1f5f9;
            color: #334155;
            font-size: 0.95rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 2px solid #cbd5e1;
            padding: 0.35rem 0.65rem;
        }
        .calculation-table tbody tr:last-child td {
            border-bottom: none;
        }
        .en-col {
            text-align: left;
        }
        .ar-col {
            text-align: right;
            direction: rtl;
        }
        .amount-col {
            text-align: right;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
            width: 22%;
        }
        .total-row {
            background: #eff6ff;
            font-weight: 700;
            color: #1e3a8a;
        }
        .total-row td {
            border-bottom-color: #bfdbfe;
        }
        .subsection-header td {
            background: #f8fafc;
            font-weight: 700;
            color: #0f172a;
            text-align: center;
            font-size: 0.98rem;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: 0.3rem 0.6rem;
        }
        .net-amount {
            background: #ecfdf5 !important;
            color: #065f46 !important;
            font-size: 1.28rem;
            font-weight: 700;
        }
        .net-amount td {
            border-bottom: none !important;
            padding-top: 0.45rem;
            padding-bottom: 0.45rem;
        }
        .signatures {
            margin-top: 0.65rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.85rem;
            page-break-inside: avoid;
        }
        .signature-box {
            border: 1px solid #e2e8f0;
            border-radius: 0.45rem;
            padding: 0.85rem 0.9rem 1rem;
            min-height: 0;
            font-size: 1.02rem;
            line-height: 1.55;
            background: #fff;
            display: flex;
            flex-direction: column;
            gap: 0.55rem;
        }
        .signature-box p {
            margin: 0;
            text-align: left;
        }
        .signature-box > div:not(.signature-title) {
            text-align: left;
            margin: 0;
        }
        .signature-title {
            font-weight: 700;
            margin: 0 0 0.15rem 0;
            color: #0f172a;
            font-size: 1.08rem;
            padding-bottom: 0.45rem;
            border-bottom: 1px solid #e7e5e4;
        }
        .legal-text {
            font-size: 1.02rem;
            color: #57534e;
            line-height: 1.38;
            text-align: left;
            margin: 0;
            padding: 0.55rem 0.75rem;
            background: #fafaf9;
            border-left: 3px solid #d6d3d1;
            border-radius: 0 0.35rem 0.35rem 0;
        }
        .legal-text p {
            margin: 0;
        }
        .legal-text strong {
            color: #292524;
        }
        .vacation-payout-note {
            font-size: 1.02rem;
            color: #57534e;
            font-style: italic;
            margin: 0;
            padding: 0.45rem 0.65rem 0.55rem;
            line-height: 1.38;
            background: #fafaf9;
            border-top: 1px solid #e7e5e4;
        }
    </style>
</head>
<body>
    <div class="pdf-page-shell">
    <div class="pdf-page-main">
    <div class="bilingual-header">
        <img src="${logoBase64}" alt="Company Logo" class="logo" />
        <div class="header-content">
            <div class="company-name">
                Samhan Naser Al-Dosari Est | مؤسسة سمحان ناصر الدوسري
            </div>
            <div class="document-title">
                FINAL SETTLEMENT CERTIFICATE
                <span class="document-title-ar">شهادة التسوية النهائية</span>
            </div>
            <div class="doc-meta">Settlement No / رقم التسوية: <span class="doc-meta-value">${data.settlementNumber}</span></div>
            <div class="doc-meta">Date / التاريخ: <span class="doc-meta-value">${formatDate(data.preparedAt)}</span> &nbsp;|&nbsp; <span class="doc-meta-value">${formatDateAr(data.preparedAt)}</span></div>
        </div>
    </div>

    <div class="bilingual-section">
        <div class="english-side">
            <div class="section-title">Employee Information</div>
            <div class="info-row">
                <span class="label">Full Name:</span>
                <span class="value">${data.employeeName}</span>
            </div>
            <div class="info-row">
                <span class="label">File Number:</span>
                <span class="value">${data.fileNumber || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="label">Iqama Number:</span>
                <span class="value">${data.iqamaNumber || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="label">Nationality:</span>
                <span class="value">${data.nationality || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="label">Position:</span>
                <span class="value">${data.designation || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="label">Department:</span>
                <span class="value">${data.department || 'N/A'}</span>
            </div>
        </div>
        <div class="arabic-side">
            <div class="section-title">بيانات الموظف</div>
            <div class="info-row">
                <span class="value">${data.employeeNameAr || data.employeeName}</span>
                <span class="label">:الاسم الكامل</span>
            </div>
            <div class="info-row">
                <span class="value">${data.fileNumber || 'غير متوفر'}</span>
                <span class="label">:رقم الملف</span>
            </div>
            <div class="info-row">
                <span class="value">${data.iqamaNumber || 'غير متوفر'}</span>
                <span class="label">:رقم الإقامة</span>
            </div>
            <div class="info-row">
                <span class="value">${data.nationality || 'غير متوفر'}</span>
                <span class="label">:الجنسية</span>
            </div>
            <div class="info-row">
                <span class="value">${data.designation || 'غير متوفر'}</span>
                <span class="label">:المنصب</span>
            </div>
            <div class="info-row">
                <span class="value">${data.department || 'غير متوفر'}</span>
                <span class="label">:القسم</span>
            </div>
        </div>
    </div>

    <div class="bilingual-section">
        <div class="english-side">
            <div class="section-title">Service Details</div>
            <div class="info-row">
                <span class="label">Hire Date:</span>
                <span class="value">${formatDate(data.hireDate)}</span>
            </div>
            <div class="info-row">
                <span class="label">Last Working Date:</span>
                <span class="value">${formatDate(data.lastWorkingDate)}</span>
            </div>
            <div class="info-row">
                <span class="label">Total Service:</span>
                <span class="value">${data.totalServiceYears}Y ${data.totalServiceMonths}M ${data.totalServiceDays}D</span>
            </div>
            <div class="info-row">
                <span class="label">Last Basic Salary:</span>
                <span class="value">${formatCurrency(data.lastBasicSalary)}</span>
            </div>
            ${data.unpaidSalaryMonths > 0 ? `
            <div class="info-row">
                <span class="label">Unpaid Months:</span>
                <span class="value">${data.unpaidSalaryMonths} months</span>
            </div>
            ` : ''}
        </div>
        <div class="arabic-side">
            <div class="section-title">تفاصيل الخدمة</div>
            <div class="info-row">
                <span class="value">${formatDateAr(data.hireDate)}</span>
                <span class="label">:تاريخ التوظيف</span>
            </div>
            <div class="info-row">
                <span class="value">${formatDateAr(data.lastWorkingDate)}</span>
                <span class="label">:آخر يوم عمل</span>
            </div>
            <div class="info-row">
                <span class="value">${data.totalServiceYears} سنة ${data.totalServiceMonths} شهر ${data.totalServiceDays} يوم</span>
                <span class="label">:إجمالي مدة الخدمة</span>
            </div>
            <div class="info-row">
                <span class="value">${formatCurrencyAr(data.lastBasicSalary)}</span>
                <span class="label">:آخر راتب أساسي</span>
            </div>
            ${data.unpaidSalaryMonths > 0 ? `
            <div class="info-row">
                <span class="value">${data.unpaidSalaryMonths} شهر</span>
                <span class="label">:الأشهر غير المدفوعة</span>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="table-wrap">
    <div class="block-heading">Settlement amounts / مبالغ التسوية</div>
    <table class="calculation-table">
        <thead>
            <tr>
                <th class="en-col">Description</th>
                <th class="ar-col">البيان</th>
                <th class="amount-col">Amount (${data.currency})</th>
            </tr>
        </thead>
        <tbody>
            <tr class="subsection-header">
                <td colspan="3"><strong>Earnings / المستحقات</strong></td>
            </tr>
            ${hasBasicOtSection ? `
            ${data.unpaidSalaryAmount > 0 ? `
            <tr>
                <td class="en-col">Basic Salary (unpaid salaries – ${data.unpaidSalaryMonths} months)</td>
                <td class="ar-col">الراتب الأساسي (رواتب غير مدفوعة – ${data.unpaidSalaryMonths} شهر)</td>
                <td class="amount-col">${this.formatAmount(data.unpaidSalaryAmount)}</td>
            </tr>
            ` : ''}
            ${overtimeAmount > 0 ? `
            <tr>
                <td class="en-col">Overtime (OT)${overtimeLabelSuffix}</td>
                <td class="ar-col">عمل إضافي (OT)${overtimeLabelSuffixAr}</td>
                <td class="amount-col">${this.formatAmount(overtimeAmount)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
                <td class="en-col"><strong>Total (Basic Salary + OT)</strong></td>
                <td class="ar-col"><strong>الإجمالي (راتب أساسي + عمل إضافي)</strong></td>
                <td class="amount-col"><strong>${this.formatAmount(basicOtSubtotal)}</strong></td>
            </tr>
            ${hasBasicOtSection && data.totalDeductions > 0 ? `
            <tr class="subsection-header">
                <td colspan="3"><strong>Deductions / الخصومات</strong></td>
            </tr>
            ${data.absentDeduction > 0 ? `
            <tr>
                <td class="en-col">Absent Deduction (${data.absentDays} days)</td>
                <td class="ar-col">خصم الغياب (${data.absentDays} أيام)</td>
                <td class="amount-col">(${this.formatAmount(data.absentDeduction)})</td>
            </tr>
            ` : ''}
            ${data.pendingAdvances > 0 ? `
            <tr>
                <td class="en-col">Pending Advances</td>
                <td class="ar-col">السلف المعلقة</td>
                <td class="amount-col">(${this.formatAmount(data.pendingAdvances)})</td>
            </tr>
            ` : ''}
            ${data.equipmentDeductions > 0 ? `
            <tr>
                <td class="en-col">Equipment Deductions</td>
                <td class="ar-col">خصومات المعدات</td>
                <td class="amount-col">(${this.formatAmount(data.equipmentDeductions)})</td>
            </tr>
            ` : ''}
            ${data.otherDeductions > 0 ? `
            <tr>
                <td class="en-col">Other Deductions</td>
                <td class="ar-col">خصومات أخرى</td>
                <td class="amount-col">(${this.formatAmount(data.otherDeductions)})</td>
            </tr>
            ` : ''}
            <tr class="total-row">
                <td class="en-col"><strong>Total Deductions</strong></td>
                <td class="ar-col"><strong>إجمالي الخصومات</strong></td>
                <td class="amount-col"><strong>(${this.formatAmount(data.totalDeductions)})</strong></td>
            </tr>
            ` : ''}
            ${hasOthersSubsection ? `
            <tr class="subsection-header">
                <td colspan="3"><strong>Others / أخرى</strong></td>
            </tr>
            ` : ''}
            ` : ''}
            ${data.settlementType === 'exit' && data.endOfServiceBenefit > 0 ? `
            <tr>
                <td class="en-col">End of Service Benefits</td>
                <td class="ar-col">مكافأة نهاية الخدمة</td>
                <td class="amount-col">${this.formatAmount(data.endOfServiceBenefit)}</td>
            </tr>
            ` : ''}
            ${data.settlementType === 'exit' && data.accruedVacationAmount > 0 ? `
            <tr>
                <td class="en-col">Accrued Vacation (${data.accruedVacationDays} days)</td>
                <td class="ar-col">رصيد الإجازات (${data.accruedVacationDays} يوم)</td>
                <td class="amount-col">${this.formatAmount(data.accruedVacationAmount)}</td>
            </tr>
            ` : ''}
            ${data.otherBenefits > 0 ? `
            <tr>
                <td class="en-col">Other Benefits ${data.otherBenefitsDescription ? `(${data.otherBenefitsDescription})` : ''}</td>
                <td class="ar-col">مزايا أخرى ${data.otherBenefitsDescription ? `(${data.otherBenefitsDescription})` : ''}</td>
                <td class="amount-col">${this.formatAmount(data.otherBenefits)}</td>
            </tr>
            ` : ''}
            ${!hasBasicOtSection && data.totalDeductions > 0 ? `
            <tr class="subsection-header">
                <td colspan="3"><strong>Deductions / الخصومات</strong></td>
            </tr>
            ${data.absentDeduction > 0 ? `
            <tr>
                <td class="en-col">Absent Deduction (${data.absentDays} days)</td>
                <td class="ar-col">خصم الغياب (${data.absentDays} أيام)</td>
                <td class="amount-col">(${this.formatAmount(data.absentDeduction)})</td>
            </tr>
            ` : ''}
            ${data.pendingAdvances > 0 ? `
            <tr>
                <td class="en-col">Pending Advances</td>
                <td class="ar-col">السلف المعلقة</td>
                <td class="amount-col">(${this.formatAmount(data.pendingAdvances)})</td>
            </tr>
            ` : ''}
            ${data.equipmentDeductions > 0 ? `
            <tr>
                <td class="en-col">Equipment Deductions</td>
                <td class="ar-col">خصومات المعدات</td>
                <td class="amount-col">(${this.formatAmount(data.equipmentDeductions)})</td>
            </tr>
            ` : ''}
            ${data.otherDeductions > 0 ? `
            <tr>
                <td class="en-col">Other Deductions</td>
                <td class="ar-col">خصومات أخرى</td>
                <td class="amount-col">(${this.formatAmount(data.otherDeductions)})</td>
            </tr>
            ` : ''}
            <tr class="total-row">
                <td class="en-col"><strong>Total Deductions</strong></td>
                <td class="ar-col"><strong>إجمالي الخصومات</strong></td>
                <td class="amount-col"><strong>(${this.formatAmount(data.totalDeductions)})</strong></td>
            </tr>
            ` : ''}
            <tr class="net-amount">
                <td class="en-col"><strong>NET SETTLEMENT AMOUNT</strong></td>
                <td class="ar-col"><strong>صافي مبلغ التسوية</strong></td>
                <td class="amount-col"><strong>${this.formatAmount(netPayableNow)}</strong></td>
            </tr>
        </tbody>
    </table>
    </div>
    ${deferredVacationAllowance > 0 ? `
    <div class="table-wrap">
        <div class="block-heading">Vacation allowance (payable after return) / بدل إجازة (يُصرف بعد العودة من الإجازة)</div>
        <table class="calculation-table">
            <thead>
                <tr>
                    <th class="en-col">Description</th>
                    <th class="ar-col">البيان</th>
                    <th class="amount-col">Amount (${data.currency})</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="en-col">Vacation Allowance</td>
                    <td class="ar-col">بدل إجازة</td>
                    <td class="amount-col">${this.formatAmount(deferredVacationAllowance)}</td>
                </tr>
                <tr>
                    <td colspan="3" class="vacation-payout-note">Paid after the employee returns from vacation. / يُدفع بعد عودة الموظف من الإجازة.</td>
                </tr>
            </tbody>
        </table>
    </div>
    ` : ''}
    </div>

    <footer class="pdf-page-footer">
    <div class="legal-text">
        <p><strong>Legal Declaration / الإقرار القانوني:</strong> This final settlement is prepared in accordance with the Saudi Labor Law and represents the complete and final settlement of all dues between the company and the employee. تم إعداد هذه التسوية النهائية وفقاً لنظام العمل السعودي وتمثل التسوية الكاملة والنهائية لجميع المستحقات بين الشركة والموظف.</p>
    </div>

    <div class="signatures">
        <div class="signature-box">
            <div class="signature-title">Employee Acknowledgment / إقرار الموظف</div>
            <p>I acknowledge receipt of the settlement amount / أقر بإستلام مبلغ التسوية</p>
            <div>Signature / التوقيع: ____________________</div>
            <div>Name / الاسم: ${data.employeeName}</div>
            <div>Date / التاريخ: ____________________</div>
        </div>
        <div class="signature-box">
            <div class="signature-title">Company Authorization / تفويض الشركة</div>
            <p>Approved by company management / معتمد من إدارة الشركة</p>
            <div>Signature / التوقيع: ____________________</div>
            <div>Name / الاسم: ____________________</div>
            <div>Title / المنصب: HR Manager / مدير الموارد البشرية</div>
            <div>Date / التاريخ: ____________________</div>
        </div>
    </div>
    </footer>
    </div>
</body>
</html>`;
  }
}
