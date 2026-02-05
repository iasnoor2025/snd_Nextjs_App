
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import autoTable from 'jspdf-autotable';

// Add type definition for jspdf-autotable if needed, or rely on explicit import
// declaration merging might still be useful for types, but we use explicit calls now.

export interface OnLeaveReportData {
    summary_stats: {
        total_on_leave: number;
        annual_leave_count: number;
        sick_leave_count: number;
        emergency_leave_count: number;
        other_leave_count: number;
    };
    leave_details: {
        id: number;
        employee_id: number;
        employee_name: string;
        file_number: string | null;
        designation: string | null;
        department: string | null;
        leave_type: string;
        start_date: string;
        end_date: string;
        days: number;
        reason: string | null;
        status: string;
    }[];
    generated_at: string;
    date_range: {
        start: string;
        end: string;
    };
}

export class OnLeaveReportPDFService {
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
        dateRange: string,
        isFirstPage: boolean = true
    ): void {
        // Header with background
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);

        // Add logo if available
        if (logoDataUrl) {
            const logoWidth = 18;
            const logoHeight = 18;
            const logoX = margin + 5;
            const logoY = 8;
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
        doc.text(companyName, companyNameX, 14);

        // Report title on the right
        doc.setFontSize(14);
        doc.text(reportTitle, pageWidth - margin - 5, 14, { align: 'right' });

        // Date Range
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(dateRange, pageWidth - margin - 5, 22, { align: 'right' });

        // Generated date below company name (only on first page)
        if (isFirstPage) {
            doc.setFontSize(9);
            doc.text(`Generated on: ${generatedDate}`, companyNameX, 22);
        }

        // Reset text color
        doc.setTextColor(0, 0, 0);
    }

    static async generateOnLeaveReportPDF(data: OnLeaveReportData, language: 'en' | 'ar' = 'en'): Promise<jsPDF> {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        const isRTL = language === 'ar';
        const pageWidth = doc.internal.pageSize.width;
        const margin = 10;
        const contentWidth = pageWidth - (margin * 2);

        // Load company logo and name
        const companyName = await this.getCompanyName();
        const logoPath = await this.getCompanyLogo();
        const logoDataUrl = await this.loadImageAsDataURL(logoPath);
        const generatedDate = new Date(data.generated_at).toLocaleString();
        const reportTitle = isRTL ? 'تقرير الموظفين في إجازة' : 'Employees On Leave Report';
        const dateRangeStr = isRTL
            ? `الفترة: ${data.date_range.start} إلى ${data.date_range.end}`
            : `Period: ${data.date_range.start} to ${data.date_range.end}`;

        // --- Header ---
        this.drawPageHeader(doc, pageWidth, margin, companyName, logoDataUrl, generatedDate, reportTitle, dateRangeStr, true);

        let yPos = 45;

        // --- Summary Section ---
        doc.setFillColor(245, 247, 250);
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'FD');

        const summaryY = yPos + 8;
        const colWidth = contentWidth / 5;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        // Headers
        const labels = isRTL ? {
            total: 'إجمالي في إجازة',
            annual: 'سنوية',
            sick: 'مرضية',
            emergency: 'طارئة',
            other: 'أخرى'
        } : {
            total: 'Total On Leave',
            annual: 'Annual/Vacation',
            sick: 'Sick Leave',
            emergency: 'Emergency',
            other: 'Other'
        };

        const headers = [labels.total, labels.annual, labels.sick, labels.emergency, labels.other];
        const values = [
            data.summary_stats.total_on_leave.toString(),
            data.summary_stats.annual_leave_count.toString(),
            data.summary_stats.sick_leave_count.toString(),
            data.summary_stats.emergency_leave_count.toString(),
            data.summary_stats.other_leave_count.toString()
        ];

        headers.forEach((label, i) => {
            const x = margin + (colWidth * (i + 0.5));
            doc.text(label, x, summaryY, { align: 'center' });
        });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);

        values.forEach((val, i) => {
            const x = margin + (colWidth * (i + 0.5));
            doc.text(val, x, summaryY + 10, { align: 'center' });
        });

        yPos += 35;

        // --- Table ---
        const tableHeaders = isRTL
            ? [['الأيام', 'إلى تاريخ', 'من تاريخ', 'نوع الإجازة', 'القسم', 'المسمى الوظيفي', 'الرقم الوظيفي', 'اسم الموظف', '#']]
            : [['#', 'Employee Name', 'File #', 'Designation', 'Department', 'Leave Type', 'From', 'To', 'Days']];

        const tableExample = data.leave_details.map((item, index) => [
            index + 1,
            item.employee_name,
            item.file_number || '-',
            item.designation || '-',
            item.department || '-',
            item.leave_type,
            format(new Date(item.start_date), 'yyyy-MM-dd'),
            format(new Date(item.end_date), 'yyyy-MM-dd'),
            item.days.toString()
        ]);

        const tableData = isRTL ? tableExample.map(row => [...row].reverse()) : tableExample;

        autoTable(doc, {
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
                if (data.pageNumber > 1) {
                    this.drawPageHeader(doc, pageWidth, margin, companyName, logoDataUrl, generatedDate, reportTitle, dateRangeStr, false);
                }
            }
        });

        return doc;
    }

    static async downloadOnLeaveReportPDF(data: OnLeaveReportData, filename: string, language: 'en' | 'ar' = 'en'): Promise<void> {
        const doc = await this.generateOnLeaveReportPDF(data, language);
        doc.save(filename);
    }
}
