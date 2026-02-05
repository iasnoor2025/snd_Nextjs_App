
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import 'jspdf-autotable';

// Add type definition for jspdf-autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => void;
        lastAutoTable: {
            finalY: number;
        };
    }
}

export interface LeavingReportData {
    summary_stats: {
        total_exits: number;
        resigned_count: number;
        terminated_count: number;
        total_settlement_amount: number | string;
    };
    leaving_details: {
        id: number;
        employee_id: number;
        employee_name: string;
        file_number: string | null;
        designation: string | null;
        department: string | null;
        hire_date: string;
        last_working_date: string;
        reason: string;
        net_amount: number | string;
        status: string;
        settlement_number: string;
    }[];
    generated_at: string;
}

export class LeavingReportPDFService {
    /**
     * Load image as data URL for embedding in PDF
     */
    private static async loadImageAsDataURL(imagePath: string): Promise<string | null> {
        try {
            const response = await fetch(imagePath);
            if (!response.ok) return null;
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.warn('Error loading image:', error);
            return null;
        }
    }

    /**
     * Get company name from settings
     */
    private static async getCompanyName(): Promise<string> {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                const companyName = data.settings?.find((s: any) => s.key === 'company.name')?.value;
                return companyName || 'SND Equipment Rental Company';
            }
        } catch (error) {
            console.warn('Error fetching company name:', error);
        }
        return 'SND Equipment Rental Company';
    }

    /**
     * Get company logo from settings
     */
    private static async getCompanyLogo(): Promise<string> {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                const logo = data.settings?.find((s: any) => s.key === 'company.logo')?.value;
                return logo || '/snd-logo.png';
            }
        } catch (error) {
            console.warn('Error fetching company logo:', error);
        }
        return '/snd-logo.png';
    }

    /**
     * Draw page header with logo and company name
     */
    private static drawPageHeader(
        doc: jsPDF,
        pageWidth: number,
        margin: number,
        companyName: string,
        logoDataUrl: string | null,
        generatedDate: string,
        reportTitle: string,
        isFirstPage: boolean = true
    ): void {
        // Header with background
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setTextColor(255, 255, 255);

        // Add logo if available
        if (logoDataUrl) {
            const logoWidth = 18;
            const logoHeight = 18;
            const logoX = margin + 5;
            const logoY = 6;
            try {
                doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
            } catch (error) {
                console.warn('Error adding logo to PDF:', error);
            }
        }

        // Company name next to logo
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const companyNameX = logoDataUrl ? margin + 28 : margin;
        doc.text(companyName, companyNameX, 12);

        // Report title on the right
        doc.setFontSize(14);
        doc.text(reportTitle, pageWidth - margin - 5, 12, { align: 'right' });

        // Generated date below company name (only on first page)
        if (isFirstPage) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${generatedDate}`, companyNameX, 20);
        }

        // Reset text color
        doc.setTextColor(0, 0, 0);
    }

    static async generateLeavingReportPDF(data: LeavingReportData, language: 'en' | 'ar' = 'en'): Promise<jsPDF> {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        const isRTL = language === 'ar';
        // Note: jsPDF default fonts support English well. For Arabic we need custom fonts, but keeping it simple for now matching existing services.

        const pageWidth = doc.internal.pageSize.width;
        const margin = 10;
        const contentWidth = pageWidth - (margin * 2);

        // Load company logo and name
        const companyName = await this.getCompanyName();
        const logoPath = await this.getCompanyLogo();
        const logoDataUrl = await this.loadImageAsDataURL(logoPath);
        const generatedDate = new Date(data.generated_at).toLocaleString();
        const reportTitle = isRTL ? 'تقرير المغادرين (تصفية نهائية)' : 'Leaving Report (Final Settlements)';

        // --- Header ---
        this.drawPageHeader(doc, pageWidth, margin, companyName, logoDataUrl, generatedDate, reportTitle, true);

        let yPos = 40;

        // --- Summary Section ---
        doc.setFillColor(245, 247, 250);
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'FD');

        const summaryY = yPos + 8;
        const colWidth = contentWidth / 4;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        // Headers
        const labels = isRTL ? {
            amount: 'إجمالي المبلغ',
            terminated: 'إنهاء خدمات',
            resigned: 'استقالة',
            total: 'إجمالي المغادرين'
        } : {
            amount: 'Total Amount',
            terminated: 'Terminated',
            resigned: 'Resigned',
            total: 'Total Exits'
        };

        if (isRTL) {
            doc.text(labels.amount, margin + (colWidth * 0.5), summaryY, { align: 'center' });
            doc.text(labels.terminated, margin + (colWidth * 1.5), summaryY, { align: 'center' });
            doc.text(labels.resigned, margin + (colWidth * 2.5), summaryY, { align: 'center' });
            doc.text(labels.total, margin + (colWidth * 3.5), summaryY, { align: 'center' });
        } else {
            doc.text(labels.total, margin + (colWidth * 0.5), summaryY, { align: 'center' });
            doc.text(labels.resigned, margin + (colWidth * 1.5), summaryY, { align: 'center' });
            doc.text(labels.terminated, margin + (colWidth * 2.5), summaryY, { align: 'center' });
            doc.text(labels.amount, margin + (colWidth * 3.5), summaryY, { align: 'center' });
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);

        // Values
        const amountVal = `SAR ${Number(data.summary_stats.total_settlement_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        if (isRTL) {
            doc.text(amountVal, margin + (colWidth * 0.5), summaryY + 10, { align: 'center' });
            doc.text(data.summary_stats.terminated_count.toString(), margin + (colWidth * 1.5), summaryY + 10, { align: 'center' });
            doc.text(data.summary_stats.resigned_count.toString(), margin + (colWidth * 2.5), summaryY + 10, { align: 'center' });
            doc.text(data.summary_stats.total_exits.toString(), margin + (colWidth * 3.5), summaryY + 10, { align: 'center' });
        } else {
            doc.text(data.summary_stats.total_exits.toString(), margin + (colWidth * 0.5), summaryY + 10, { align: 'center' });
            doc.text(data.summary_stats.resigned_count.toString(), margin + (colWidth * 1.5), summaryY + 10, { align: 'center' });
            doc.text(data.summary_stats.terminated_count.toString(), margin + (colWidth * 2.5), summaryY + 10, { align: 'center' });
            doc.text(amountVal, margin + (colWidth * 3.5), summaryY + 10, { align: 'center' });
        }

        yPos += 35;

        // --- Table ---
        // Prepare table data
        const tableHeaders = isRTL
            ? [['المبلغ', 'الحالة', 'سبب المغادرة', 'آخر عمل', 'تاريخ التعيين', 'القسم', 'المسمى الوظيفي', 'الرقم الوظيفي', 'اسم الموظف', '#']]
            : [['#', 'Employee Name', 'File #', 'Designation', 'Department', 'Hire Date', 'Last Working', 'Reason', 'Status', 'Net Amount']];

        const tableExample = data.leaving_details.map((item, index) => [
            index + 1,
            item.employee_name,
            item.file_number || '-',
            item.designation || '-',
            item.department || '-',
            format(new Date(item.hire_date), 'yyyy-MM-dd'),
            format(new Date(item.last_working_date), 'yyyy-MM-dd'),
            item.reason === 'resigned' ? (isRTL ? 'استقالة' : 'Resigned') : (isRTL ? 'إنهاء خدمات' : 'Terminated'),
            item.status,
            `SAR ${Number(item.net_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        ]);

        // Handle RTL Data order if needed (reverse columns)
        const tableData = isRTL ? tableExample.map(row => [...row].reverse()) : tableExample;

        doc.autoTable({
            startY: yPos,
            head: tableHeaders,
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                halign: isRTL ? 'right' : 'left',
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
            },
            didDrawPage: (data: any) => {
                // Draw header on subsequent pages
                if (data.pageNumber > 1) {
                    this.drawPageHeader(doc, pageWidth, margin, companyName, logoDataUrl, generatedDate, reportTitle, false);
                }
            }
        });

        return doc;
    }

    static async downloadLeavingReportPDF(data: LeavingReportData, filename: string, language: 'en' | 'ar' = 'en'): Promise<void> {
        const doc = await this.generateLeavingReportPDF(data, language);
        doc.save(filename);
    }
}
