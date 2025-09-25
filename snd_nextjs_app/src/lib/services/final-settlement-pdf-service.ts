import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

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
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // Set page format and margins
      await page.setViewport({ width: 1200, height: 1600 });
      
      const htmlContent = language === 'ar' 
        ? await this.generateArabicTemplate(settlementData)
        : await this.generateEnglishTemplate(settlementData);

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate bilingual PDF (Arabic and English)
   */
  static async generateBilingualSettlementPDF(
    settlementData: SettlementPDFData
  ): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1600 });
      
      const htmlContent = await this.generateBilingualTemplate(settlementData);
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '10mm',
          bottom: '15mm',
          left: '10mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
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
            line-height: 1.3;
            margin: 0;
            padding: 10px;
            color: #333;
            font-size: 10px;
        }
        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .logo {
            width: 200px;
            height: 200px;
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
            margin-bottom: 25px;
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
            margin-top: 50px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
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
                ${data.unpaidSalaryAmount > 0 ? `
                <tr>
                    <td>Unpaid Salaries (${data.unpaidSalaryMonths} months)</td>
                    <td class="amount">${this.formatAmount(data.unpaidSalaryAmount)}</td>
                </tr>
                ` : ''}
                <tr>
                    <td>${data.settlementType === 'vacation' ? 'Vacation Allowance' : 'End of Service Benefits'}</td>
                    <td class="amount">${this.formatAmount(data.endOfServiceBenefit)}</td>
                </tr>
                ${data.accruedVacationAmount > 0 ? `
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
                <tr class="total-row">
                    <td><strong>Gross Amount</strong></td>
                    <td class="amount"><strong>${this.formatAmount(data.grossAmount)}</strong></td>
                </tr>
                ${data.totalDeductions > 0 ? `
                <tr><td colspan="2"><strong>Deductions:</strong></td></tr>
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
                ${data.absentDeduction > 0 ? `
                <tr>
                    <td>Absent Deduction (${data.absentDays} days)</td>
                    <td class="amount">(${this.formatAmount(data.absentDeduction)})</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td><strong>Total Deductions</strong></td>
                    <td class="amount"><strong>(${this.formatAmount(data.totalDeductions)})</strong></td>
                </tr>
                ` : ''}
                <tr class="net-amount">
                    <td><strong>NET SETTLEMENT AMOUNT</strong></td>
                    <td class="amount"><strong>${this.formatAmount(data.netAmount)}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

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
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .logo {
            width: 200px;
            height: 200px;
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
            margin-bottom: 25px;
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
            margin-top: 50px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
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
                ${data.unpaidSalaryAmount > 0 ? `
                <tr>
                    <td>الرواتب غير المدفوعة (${data.unpaidSalaryMonths} شهر)</td>
                    <td class="amount">${this.formatAmount(data.unpaidSalaryAmount)}</td>
                </tr>
                ` : ''}
                <tr>
                    <td>مكافأة نهاية الخدمة</td>
                    <td class="amount">${this.formatAmount(data.endOfServiceBenefit)}</td>
                </tr>
                ${data.accruedVacationAmount > 0 ? `
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
                <tr class="total-row">
                    <td><strong>إجمالي المستحقات</strong></td>
                    <td class="amount"><strong>${this.formatAmount(data.grossAmount)}</strong></td>
                </tr>
                ${data.totalDeductions > 0 ? `
                <tr><td colspan="2"><strong>الخصومات:</strong></td></tr>
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
                    <td class="amount"><strong>${this.formatAmount(data.netAmount)}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

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

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Final Settlement / التسوية النهائية - ${data.settlementNumber}</title>
    <style>
        @page {
            margin: 20mm 15mm 20mm 15mm;
            @top-left {
                content: url("file://${path.join(process.cwd(), 'public', 'snd-logo.png')}");
                width: 250px;
                height: 250px;
            }
        }
        body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            line-height: 1.3;
            margin: 0;
            padding: 8px;
            color: #333;
            font-size: 9px;
        }
        .bilingual-header {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo {
            width: 50px;
            height: 50px;
            flex-shrink: 0;
        }
        .header-content {
            flex: 1;
            text-align: center;
        }
        .company-name {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 3px;
        }
        .document-title {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
            color: #1e40af;
        }
        .settlement-number {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
        }
        .bilingual-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 5px;
            overflow: hidden;
        }
        .english-side {
            padding: 15px;
            border-right: 1px solid #e5e7eb;
        }
        .arabic-side {
            padding: 15px;
            direction: rtl;
            text-align: right;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 3px;
            margin-bottom: 10px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px dotted #d1d5db;
            font-size: 11px;
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
            margin: 15px 0;
            font-size: 11px;
        }
        .calculation-table th,
        .calculation-table td {
            border: 1px solid #d1d5db;
            padding: 8px;
        }
        .calculation-table th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #374151;
        }
        .en-col {
            text-align: left;
        }
        .ar-col {
            text-align: right;
            direction: rtl;
        }
        .amount-col {
            text-align: center;
            font-weight: bold;
        }
        .total-row {
            background-color: #eff6ff;
            font-weight: bold;
        }
        .net-amount {
            background-color: #dcfce7;
            font-size: 14px;
            font-weight: bold;
        }
        .signatures {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .signature-box {
            border: 1px solid #d1d5db;
            padding: 15px;
            min-height: 80px;
            font-size: 10px;
        }
        .signature-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #374151;
        }
        .legal-text {
            font-size: 10px;
            color: #6b7280;
            margin-top: 20px;
            line-height: 1.4;
            text-align: justify;
        }
    </style>
</head>
<body>
    <div class="bilingual-header">
        <img src="${logoBase64}" alt="Company Logo" class="logo" />
        <div class="header-content">
            <div class="company-name">
                Samhan Naser Al-Dosari Est | مؤسسة سمحان ناصر الدوسري
            </div>
            <div class="document-title">
                FINAL SETTLEMENT CERTIFICATE | شهادة التسوية النهائية
            </div>
            <div class="settlement-number">Settlement No / رقم التسوية: ${data.settlementNumber}</div>
            <div>Date / التاريخ: ${formatDate(data.preparedAt)} | ${formatDateAr(data.preparedAt)}</div>
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

    <table class="calculation-table">
        <thead>
            <tr>
                <th class="en-col">Description</th>
                <th class="ar-col">البيان</th>
                <th class="amount-col">Amount (${data.currency})</th>
            </tr>
        </thead>
        <tbody>
            ${data.unpaidSalaryAmount > 0 ? `
            <tr>
                <td class="en-col">Unpaid Salaries (${data.unpaidSalaryMonths} months)</td>
                <td class="ar-col">الرواتب غير المدفوعة (${data.unpaidSalaryMonths} شهر)</td>
                <td class="amount-col">${this.formatAmount(data.unpaidSalaryAmount)}</td>
            </tr>
            ` : ''}
            <tr>
                <td class="en-col">${data.settlementType === 'vacation' ? 'Vacation Allowance' : 'End of Service Benefits'}</td>
                <td class="ar-col">${data.settlementType === 'vacation' ? 'بدل إجازة' : 'مكافأة نهاية الخدمة'}</td>
                <td class="amount-col">${this.formatAmount(data.endOfServiceBenefit)}</td>
            </tr>
            ${data.accruedVacationAmount > 0 ? `
            <tr>
                <td class="en-col">Accrued Vacation (${data.accruedVacationDays} days)</td>
                <td class="ar-col">رصيد الإجازات (${data.accruedVacationDays} يوم)</td>
                <td class="amount-col">${this.formatAmount(data.accruedVacationAmount)}</td>
            </tr>
            ` : ''}
            ${data.otherBenefits > 0 ? `
            <tr>
                <td class="en-col">Other Benefits</td>
                <td class="ar-col">مزايا أخرى</td>
                <td class="amount-col">${this.formatAmount(data.otherBenefits)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
                <td class="en-col"><strong>Gross Amount</strong></td>
                <td class="ar-col"><strong>إجمالي المستحقات</strong></td>
                <td class="amount-col"><strong>${this.formatAmount(data.grossAmount)}</strong></td>
            </tr>
            ${data.totalDeductions > 0 ? `
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
            ${data.absentDeduction > 0 ? `
            <tr>
                <td class="en-col">Absent Deduction (${data.absentDays} days)</td>
                <td class="ar-col">خصم الغياب (${data.absentDays} أيام)</td>
                <td class="amount-col">(${this.formatAmount(data.absentDeduction)})</td>
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
                <td class="amount-col"><strong>${this.formatAmount(data.netAmount)}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="legal-text">
        <p><strong>Legal Declaration / الإقرار القانوني:</strong> This final settlement is prepared in accordance with the Saudi Labor Law and represents the complete and final settlement of all dues between the company and the employee. تم إعداد هذه التسوية النهائية وفقاً لنظام العمل السعودي وتمثل التسوية الكاملة والنهائية لجميع المستحقات بين الشركة والموظف.</p>
    </div>

    <div class="signatures">
        <div class="signature-box">
            <div class="signature-title">Employee Acknowledgment / إقرار الموظف</div>
            <p>I acknowledge receipt of the settlement amount / أقر بإستلام مبلغ التسوية</p>
            <br>
            <div>Signature / التوقيع: ____________________</div>
            <div>Name / الاسم: ${data.employeeName}</div>
            <div>Date / التاريخ: ____________________</div>
        </div>
        <div class="signature-box">
            <div class="signature-title">Company Authorization / تفويض الشركة</div>
            <p>Approved by company management / معتمد من إدارة الشركة</p>
            <br>
            <div>Signature / التوقيع: ____________________</div>
            <div>Name / الاسم: ____________________</div>
            <div>Title / المنصب: HR Manager / مدير الموارد البشرية</div>
            <div>Date / التاريخ: ____________________</div>
        </div>
    </div>
</body>
</html>`;
  }
}
