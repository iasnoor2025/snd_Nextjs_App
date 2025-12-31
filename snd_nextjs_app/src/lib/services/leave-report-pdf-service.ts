import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { format } from 'date-fns';

export interface LeaveReportPDFData {
  id: string;
  employee_name: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: string;
  submitted_date: string;
  approved_by: string | null;
  approved_date: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  return_date: string | null;
  returned_by: string | null;
  return_reason: string | null;
  department?: string;
  position?: string;
  total_leave_balance?: number;
  leave_taken_this_year?: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveStatusReportData {
  status: string;
  leaves: LeaveReportPDFData[];
  totalLeaves: number;
  totalDays: number;
}

export class LeaveReportPDFService {
  /**
   * Get Chromium executable path for Puppeteer
   */
  private static getChromiumPath(): string | undefined {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    if (process.env.NODE_ENV === 'production') {
      try {
        const chromium = execSync('which chromium', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        if (chromium) return chromium;
      } catch (e) {
        try {
          const chromiumBrowser = execSync('which chromium-browser', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
          if (chromiumBrowser) return chromiumBrowser;
        } catch (e2) {
          try {
            const chrome = execSync('which google-chrome', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
            if (chrome) return chrome;
          } catch (e3) {
            // Use bundled Chrome
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Get logo as base64 data URL
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
   * Format date for display
   */
  private static formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  }

  /**
   * Format status with proper capitalization
   */
  private static formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  /**
   * Generate HTML content for leave report
   */
  private static generateReportHTML(data: LeaveReportPDFData, language: 'en' | 'ar' = 'en'): string {
    const isRTL = language === 'ar';
    const logoBase64 = ''; // Will be set async

    const statusColors: Record<string, string> = {
      pending: '#fbbf24',
      approved: '#10b981',
      rejected: '#ef4444',
      cancelled: '#6b7280',
      returned: '#3b82f6',
      active: '#10b981',
    };

    const statusColor = statusColors[data.status.toLowerCase()] || '#6b7280';
    const formattedStatus = this.formatStatus(data.status);

    return `
<!DOCTYPE html>
<html lang="${language}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leave Request Report - ${data.id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: ${isRTL ? 'Arial, sans-serif' : 'Arial, sans-serif'};
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 20px;
      direction: ${isRTL ? 'rtl' : 'ltr'};
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
    .header-info {
      text-align: ${isRTL ? 'right' : 'left'};
    }
    .header-info h1 {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 5px;
    }
    .header-info p {
      color: #6b7280;
      font-size: 14px;
    }
    .report-info {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
    }
    .report-info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .report-info-row:last-child {
      margin-bottom: 0;
    }
    .report-info-label {
      font-weight: 600;
      color: #4b5563;
    }
    .report-info-value {
      color: #1f2937;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    .info-item {
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }
    .info-label {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-size: 14px;
      color: #1f2937;
      font-weight: 600;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background-color: ${statusColor}20;
      color: ${statusColor};
    }
    .reason-box {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      margin-top: 10px;
    }
    .reason-text {
      color: #1f2937;
      line-height: 1.8;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 11px;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-info">
      <h1>${isRTL ? 'تقرير طلب الإجازة' : 'Leave Request Report'}</h1>
      <p>${isRTL ? 'طلب رقم' : 'Request ID'}: ${data.id}</p>
    </div>
  </div>

  <div class="report-info">
    <div class="report-info-row">
      <span class="report-info-label">${isRTL ? 'تاريخ التقرير' : 'Report Date'}:</span>
      <span class="report-info-value">${this.formatDate(new Date().toISOString())}</span>
    </div>
    <div class="report-info-row">
      <span class="report-info-label">${isRTL ? 'الحالة' : 'Status'}:</span>
      <span class="report-info-value">
        <span class="status-badge">${formattedStatus}</span>
      </span>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">${isRTL ? 'معلومات الموظف' : 'Employee Information'}</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">${isRTL ? 'اسم الموظف' : 'Employee Name'}</div>
        <div class="info-value">${data.employee_name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${isRTL ? 'رقم الملف' : 'File Number'}</div>
        <div class="info-value">${data.employee_id}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${isRTL ? 'القسم' : 'Department'}</div>
        <div class="info-value">${data.department || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${isRTL ? 'المنصب' : 'Position'}</div>
        <div class="info-value">${data.position || 'N/A'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">${isRTL ? 'تفاصيل الإجازة' : 'Leave Details'}</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">${isRTL ? 'نوع الإجازة' : 'Leave Type'}</div>
        <div class="info-value">${data.leave_type}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${isRTL ? 'عدد الأيام' : 'Days Requested'}</div>
        <div class="info-value">${data.days_requested} ${isRTL ? 'يوم' : 'days'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${isRTL ? 'تاريخ البدء' : 'Start Date'}</div>
        <div class="info-value">${this.formatDate(data.start_date)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${isRTL ? 'تاريخ الانتهاء' : 'End Date'}</div>
        <div class="info-value">${this.formatDate(data.end_date)}</div>
      </div>
    </div>
    ${data.return_date ? `
    <div class="info-grid" style="margin-top: 15px;">
      <div class="info-item">
        <div class="info-label">${isRTL ? 'تاريخ العودة' : 'Return Date'}</div>
        <div class="info-value">${this.formatDate(data.return_date)}</div>
      </div>
      ${data.return_reason ? `
      <div class="info-item">
        <div class="info-label">${isRTL ? 'سبب العودة' : 'Return Reason'}</div>
        <div class="info-value">${data.return_reason}</div>
      </div>
      ` : ''}
    </div>
    ` : ''}
    <div class="reason-box">
      <div class="info-label" style="margin-bottom: 10px;">${isRTL ? 'سبب الإجازة' : 'Reason for Leave'}</div>
      <div class="reason-text">${data.reason || 'N/A'}</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">${isRTL ? 'معلومات الموافقة' : 'Approval Information'}</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">${isRTL ? 'تاريخ الإرسال' : 'Submitted Date'}</div>
        <div class="info-value">${this.formatDate(data.submitted_date)}</div>
      </div>
      ${data.approved_date ? `
      <div class="info-item">
        <div class="info-label">${isRTL ? 'تاريخ الموافقة' : 'Approved Date'}</div>
        <div class="info-value">${this.formatDate(data.approved_date)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${isRTL ? 'تمت الموافقة بواسطة' : 'Approved By'}</div>
        <div class="info-value">${data.approved_by || 'N/A'}</div>
      </div>
      ` : ''}
      ${data.rejected_at ? `
      <div class="info-item">
        <div class="info-label">${isRTL ? 'تاريخ الرفض' : 'Rejected Date'}</div>
        <div class="info-value">${this.formatDate(data.rejected_at)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${isRTL ? 'تم الرفض بواسطة' : 'Rejected By'}</div>
        <div class="info-value">${data.rejected_by || 'N/A'}</div>
      </div>
      ${data.rejection_reason ? `
      <div class="info-item" style="grid-column: 1 / -1;">
        <div class="info-label">${isRTL ? 'سبب الرفض' : 'Rejection Reason'}</div>
        <div class="info-value">${data.rejection_reason}</div>
      </div>
      ` : ''}
      ` : ''}
    </div>
  </div>

  ${data.total_leave_balance !== undefined ? `
  <div class="section">
    <h2 class="section-title">${isRTL ? 'رصيد الإجازة' : 'Leave Balance'}</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">${isRTL ? 'الرصيد الإجمالي' : 'Total Balance'}</div>
        <div class="info-value">${data.total_leave_balance} ${isRTL ? 'يوم' : 'days'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${isRTL ? 'المستخدم هذا العام' : 'Used This Year'}</div>
        <div class="info-value">${data.leave_taken_this_year || 0} ${isRTL ? 'يوم' : 'days'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${isRTL ? 'المتبقي' : 'Remaining'}</div>
        <div class="info-value">${(data.total_leave_balance || 0) - (data.leave_taken_this_year || 0)} ${isRTL ? 'يوم' : 'days'}</div>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>${isRTL ? 'تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة الإجازات' : 'This report was automatically generated by the Leave Management System'}</p>
    <p style="margin-top: 5px;">${this.formatDate(new Date().toISOString())}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate PDF document for leave report
   */
  static async generateLeaveReportPDF(
    leaveData: LeaveReportPDFData,
    language: 'en' | 'ar' = 'en'
  ): Promise<Buffer> {
    let browser;
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
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

        if (chromiumPath) {
          launchOptions.executablePath = chromiumPath;
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        const htmlContent = this.generateReportHTML(leaveData, language);
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '15mm',
            right: '15mm',
            bottom: '15mm',
            left: '15mm',
          },
        });

        await browser.close();
        return Buffer.from(pdfBuffer);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`[LeaveReportPDF] Attempt ${attempt + 1} failed:`, lastError);

        if (browser) {
          try {
            await browser.close();
          } catch (closeError) {
            console.error('[LeaveReportPDF] Error closing browser:', closeError);
          }
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw new Error(`Failed to generate PDF after ${maxRetries + 1} attempts: ${lastError?.message}`);
  }

  /**
   * Generate HTML content for status-based leave report (multiple leaves)
   */
  private static generateStatusReportHTML(data: LeaveStatusReportData, language: 'en' | 'ar' = 'en'): string {
    const isRTL = language === 'ar';
    const formattedStatus = this.formatStatus(data.status);

    const statusColors: Record<string, string> = {
      pending: '#fbbf24',
      approved: '#10b981',
      rejected: '#ef4444',
      cancelled: '#6b7280',
      returned: '#3b82f6',
      active: '#10b981',
    };

    const statusColor = statusColors[data.status.toLowerCase()] || '#6b7280';

    return `
<!DOCTYPE html>
<html lang="${language}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leave Report - ${formattedStatus}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #333;
      padding: 20px;
      direction: ${isRTL ? 'rtl' : 'ltr'};
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
    }
    .header-info h1 {
      font-size: 22px;
      color: #1f2937;
      margin-bottom: 5px;
    }
    .header-info p {
      color: #6b7280;
      font-size: 13px;
    }
    .summary {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-label {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    .summary-value {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background-color: ${statusColor}20;
      color: ${statusColor};
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: white;
    }
    thead {
      background: #f3f4f6;
    }
    th {
      padding: 10px 8px;
      text-align: ${isRTL ? 'right' : 'left'};
      font-weight: 600;
      font-size: 11px;
      color: #374151;
      text-transform: uppercase;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 11px;
      color: #1f2937;
    }
    tr:hover {
      background: #f9fafb;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 10px;
    }
    .no-data {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }
    @media print {
      body {
        padding: 0;
      }
      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-info">
      <h1>${isRTL ? 'تقرير الإجازات' : 'Leave Report'}</h1>
      <p>${isRTL ? 'الحالة' : 'Status'}: <span class="status-badge">${formattedStatus}</span></p>
    </div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">${isRTL ? 'إجمالي الطلبات' : 'Total Requests'}</div>
      <div class="summary-value">${data.totalLeaves}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">${isRTL ? 'إجمالي الأيام' : 'Total Days'}</div>
      <div class="summary-value">${data.totalDays}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">${isRTL ? 'تاريخ التقرير' : 'Report Date'}</div>
      <div class="summary-value" style="font-size: 14px;">${this.formatDate(new Date().toISOString())}</div>
    </div>
  </div>

  ${data.leaves.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>${isRTL ? 'م' : 'SL. #'}</th>
        <th>${isRTL ? 'رقم الملف' : 'File'}</th>
        <th>${isRTL ? 'الاسم الكامل' : 'Full Name'}</th>
        <th>${isRTL ? 'تاريخ البدء' : 'Start Date'}</th>
        <th>${isRTL ? 'تاريخ الانتهاء' : 'End Date'}</th>
      </tr>
    </thead>
    <tbody>
      ${data.leaves.map((leave, index) => `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${leave.employee_id}</td>
          <td>${leave.employee_name}</td>
          <td>${this.formatDate(leave.start_date)}</td>
          <td>${this.formatDate(leave.end_date)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : `
  <div class="no-data">
    <p>${isRTL ? 'لا توجد طلبات إجازات بهذه الحالة' : 'No leave requests found with this status'}</p>
  </div>
  `}

  <div class="footer">
    <p>${isRTL ? 'تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة الإجازات' : 'This report was automatically generated by the Leave Management System'}</p>
    <p style="margin-top: 5px;">${this.formatDate(new Date().toISOString())}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate PDF document for status-based leave report
   */
  static async generateStatusReportPDF(
    reportData: LeaveStatusReportData,
    language: 'en' | 'ar' = 'en'
  ): Promise<Buffer> {
    let browser;
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
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

        if (chromiumPath) {
          launchOptions.executablePath = chromiumPath;
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        const htmlContent = this.generateStatusReportHTML(reportData, language);
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          landscape: true,
          margin: {
            top: '15mm',
            right: '15mm',
            bottom: '15mm',
            left: '15mm',
          },
        });

        await browser.close();
        return Buffer.from(pdfBuffer);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`[LeaveStatusReportPDF] Attempt ${attempt + 1} failed:`, lastError);

        if (browser) {
          try {
            await browser.close();
          } catch (closeError) {
            console.error('[LeaveStatusReportPDF] Error closing browser:', closeError);
          }
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw new Error(`Failed to generate PDF after ${maxRetries + 1} attempts: ${lastError?.message}`);
  }
}

