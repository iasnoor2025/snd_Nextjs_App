import { jsPDF } from 'jspdf';
import { convertToArabicNumerals } from '@/lib/translation-utils';

export interface SupervisorEquipmentReportData {
  supervisor_groups: Array<{
    supervisor_id: number;
    supervisor_name: string;
    supervisor_file_number: string | null;
    equipment_count: number;
    total_items: number;
    equipment: Array<{
      equipment_id: number;
      equipment_name: string;
      equipment_istimara: string | null;
      rental_id: number;
      rental_number: string;
      rental_status: string;
      customer_id: number | null;
      customer_name: string | null;
      operator_id: number | null;
      operator_name: string | null;
      operator_file_number: string | null;
      item_status: string;
      item_start_date: string | null;
      item_completed_date: string | null;
      display_name?: string;
    }>;
  }>;
  summary_stats: {
    total_supervisors: number;
    total_equipment: number;
    total_items: number;
    average_equipment_per_supervisor: string;
  };
  generated_at?: string;
  parameters?: any;
}

interface SupervisorEquipmentReportPDFOptions {
  isRTL?: boolean;
  arabicFontData?: string | null;
}

export class SupervisorEquipmentReportPDFService {
  private static arabicFontCache: string | null = null;
  private static arabicFontPromise: Promise<string | null> | null = null;
  private static readonly ARABIC_FONT_FILE = 'NotoSansArabic-Regular.ttf';
  private static readonly ARABIC_FONT_NAME = 'NotoSansArabic';

  static generateSupervisorEquipmentReportPDF(
    data: SupervisorEquipmentReportData,
    options: SupervisorEquipmentReportPDFOptions = {}
  ): jsPDF {
    if (!data) {
      throw new Error('Supervisor equipment report data is required');
    }

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    const isRTL = options.isRTL ?? false;
    
    // Re-enable Arabic font with Noto Sans Arabic (better jsPDF compatibility)
    const shouldUseArabicFont =
      isRTL || SupervisorEquipmentReportPDFService.reportHasArabicText(data);
    const hasArabicFontData = !!options.arabicFontData;
    const useArabicFont = shouldUseArabicFont && hasArabicFontData;

    if (shouldUseArabicFont && !hasArabicFontData) {
      console.warn(
        '[SupervisorEquipmentReportPDFService] Arabic text detected but font data unavailable, falling back to default font'
      );
    }

    if (useArabicFont) {
      this.applyArabicFont(doc, options.arabicFontData);
      if (isRTL && typeof (doc as any).setR2L === 'function') {
        (doc as any).setR2L(true);
      }
    }

    // Set document properties
    doc.setProperties({
      title: isRTL ? 'تقرير معدات المشرفين' : 'Supervisor Equipment Report',
      subject: isRTL ? 'تقرير إدارة معدات المشرفين' : 'Supervisor Equipment Management Report',
      author: 'SND Rental System',
      creator: 'SND Rental System',
    });

    let yPosition = 15;
    const pageWidth = 297; // Landscape A4 width
    const pageHeight = 210; // Landscape A4 height
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    const labels = isRTL
      ? {
          reportTitle: 'تقرير معدات المشرفين',
          companyName: 'شركة إس إن دي لتأجير المعدات',
          country: 'المملكة العربية السعودية',
          generatedAt: 'تاريخ الإنشاء',
          filters: 'عوامل التصفية:',
          status: 'الحالة',
          supervisor: 'المشرف',
          summaryTitle: 'ملخص إحصائي',
          totalSupervisors: 'إجمالي المشرفين',
          totalEquipment: 'إجمالي المعدات',
          totalItems: 'إجمالي العناصر',
          averageEquipment: 'متوسط المعدات لكل مشرف',
          tableHeaders: [
            'الرقم التسلسلي',
            'المعدة',
            'اسم العميل',
            'المشغل',
            'حالة العنصر',
            'تاريخ البدء',
            'تاريخ الإكمال',
          ],
          noEquipment: 'لا توجد معدات مرتبطة',
          noOperator: 'بدون مشغل',
          notAvailable: 'غير متوفر',
          fileLabel: 'ملف',
          equipmentWord: 'معدات',
        }
      : {
          reportTitle: 'Supervisor Equipment Report',
          companyName: 'SND Equipment Rental Company',
          country: 'Kingdom of Saudi Arabia',
          generatedAt: 'Generated',
          filters: 'Filters:',
          status: 'Status',
          supervisor: 'Supervisor',
          summaryTitle: 'Summary Statistics',
          totalSupervisors: 'Total Supervisors',
          totalEquipment: 'Total Equipment',
          totalItems: 'Total Items',
          averageEquipment: 'Average Equipment per Supervisor',
          tableHeaders: [
            'Serial #',
            'Equipment',
            'Customer Name',
            'Operator',
            'Item Status',
            'Start Date',
            'Completed Date',
          ],
          noEquipment: 'No equipment assigned',
          noOperator: 'No Operator',
          notAvailable: 'N/A',
          fileLabel: 'File',
          equipmentWord: 'Equipment',
        };

    const formatNumber = (value: number | string | null | undefined, fallback?: string) => {
      if (value === null || value === undefined || value === '') {
        return fallback || labels.notAvailable;
      }
      return convertToArabicNumerals(String(value), isRTL);
    };

    const formatDate = (value: string | null) => {
      if (!value) {
        return labels.notAvailable;
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return labels.notAvailable;
      }
      return isRTL
        ? convertToArabicNumerals(
            new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date),
            true
          )
        : date.toLocaleDateString();
    };

    const formatText = (value: string | null | undefined) => {
      if (!value) return labels.notAvailable;
      return convertToArabicNumerals(value, isRTL);
    };

    const headerFont = useArabicFont
      ? SupervisorEquipmentReportPDFService.ARABIC_FONT_NAME
      : 'helvetica';

    // Header - use appropriate font based on content
    doc.setFontSize(18);
    const titleHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(labels.reportTitle);
    if (useArabicFont && titleHasArabic) {
      doc.setFont(SupervisorEquipmentReportPDFService.ARABIC_FONT_NAME, 'bold');
    } else {
      doc.setFont('helvetica', 'bold');
    }
    doc.text(labels.reportTitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Company info - use appropriate font based on content
    doc.setFontSize(10);
    const companyHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(labels.companyName);
    if (useArabicFont && companyHasArabic) {
      doc.setFont(SupervisorEquipmentReportPDFService.ARABIC_FONT_NAME, 'normal');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    doc.text(labels.companyName, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    
    const countryHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(labels.country);
    if (useArabicFont && countryHasArabic) {
      doc.setFont(SupervisorEquipmentReportPDFService.ARABIC_FONT_NAME, 'normal');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    doc.text(labels.country, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Generation info
    doc.setFontSize(8);
    const generatedAt = data.generated_at || new Date().toISOString();
    const generatedLabel = `${labels.generatedAt}: ${
      isRTL
        ? convertToArabicNumerals(
            new Intl.DateTimeFormat('ar-SA', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(generatedAt)),
            true
          )
        : new Date(generatedAt).toLocaleString()
    }`;
    doc.text(generatedLabel, margin, yPosition);
    yPosition += 4;

    // Parameters
    if (data.parameters) {
      let paramText = `${labels.filters} `;
      if (data.parameters.status && data.parameters.status !== 'all') {
        paramText += `${labels.status}: ${data.parameters.status}`;
      }
      if (data.parameters.supervisorId && data.parameters.supervisorId !== 'all') {
        const separator = paramText.trim().endsWith(':') ? '' : ' | ';
        paramText += `${separator}${labels.supervisor}: ${data.parameters.supervisorId}`;
      }
      doc.text(paramText, margin, yPosition);
      yPosition += 4;
    }

    // Summary Statistics
    if (data.summary_stats) {
      yPosition += 3;
      doc.setFontSize(12);
      doc.setFont(headerFont, 'bold');
      doc.text(labels.summaryTitle, margin, yPosition);
      yPosition += 6;

      doc.setFontSize(9);
      doc.setFont(headerFont, 'normal');
      const stats = data.summary_stats;
      doc.text(
        `${labels.totalSupervisors}: ${formatNumber(stats.total_supervisors || 0)}`,
        margin,
        yPosition
      );
      yPosition += 5;
      doc.text(`${labels.totalEquipment}: ${formatNumber(stats.total_equipment || 0)}`, margin, yPosition);
      yPosition += 5;
      doc.text(`${labels.totalItems}: ${formatNumber(stats.total_items || 0)}`, margin, yPosition);
      yPosition += 5;
      doc.text(
        `${labels.averageEquipment}: ${formatNumber(stats.average_equipment_per_supervisor || 0)}`,
        margin,
        yPosition
      );
      yPosition += 6;
    }

    // Supervisor Groups
    if (data.supervisor_groups && data.supervisor_groups.length > 0) {
      let globalSerialNumber = 1; // Global serial number counter

      data.supervisor_groups.forEach((supervisor, supervisorIndex) => {
        // Check if we need a new page (landscape height is 210mm, leave 10mm margin at bottom)
        if (yPosition > 200) {
          doc.addPage('a4', 'l'); // Add landscape page
          yPosition = 15;
        }

        // Supervisor Header
        doc.setFontSize(11);
        const supervisorTitle = `${supervisor.supervisor_name}${
          supervisor.supervisor_file_number
            ? ` (${labels.fileLabel}: ${convertToArabicNumerals(supervisor.supervisor_file_number, isRTL)})`
            : ''
        } - ${formatNumber(supervisor.equipment_count, '0')} ${labels.equipmentWord}`;
        
        // Use Arabic font for supervisor name if it contains Arabic
        const titleHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(supervisorTitle);
        if (useArabicFont && titleHasArabic) {
          doc.setFont(SupervisorEquipmentReportPDFService.ARABIC_FONT_NAME, 'bold');
        } else {
          doc.setFont('helvetica', 'bold');
        }
        
        doc.text(supervisorTitle, margin, yPosition);
        yPosition += 6;

        if (supervisor.equipment && supervisor.equipment.length > 0) {
          // Sort equipment by customer name first, then by equipment name
          const sortedEquipment = [...supervisor.equipment].sort((a, b) => {
            // Primary sort: Customer name
            const customerA = (a.customer_name || '').toLowerCase();
            const customerB = (b.customer_name || '').toLowerCase();
            const customerCompare = customerA.localeCompare(customerB);
            
            if (customerCompare !== 0) {
              return customerCompare;
            }
            
            // Secondary sort: Equipment name
            const equipmentA = (a.display_name || a.equipment_name || '').toLowerCase();
            const equipmentB = (b.display_name || b.equipment_name || '').toLowerCase();
            return equipmentA.localeCompare(equipmentB);
          });
          
          // Equipment table headers - optimized for landscape with serial # (removed rental columns)
          let tableStartY = yPosition;
          const rowHeight = 5;
          const colWidths = [12, 60, 50, 45, 22, 28, 30]; // Serial #, Equipment, Customer, Operator, Item Status, Start Date, Completed Date
          const headers = labels.tableHeaders;

          // Draw table header
          doc.setFillColor(52, 152, 219);
          doc.rect(margin, tableStartY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          let xPos = margin + 2;
          headers.forEach((header, index) => {
            // Use appropriate font for each header
            const headerHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(header);
            if (useArabicFont && headerHasArabic) {
              doc.setFont(SupervisorEquipmentReportPDFService.ARABIC_FONT_NAME, 'bold');
            } else {
              doc.setFont('helvetica', 'bold');
            }
            const textX = isRTL ? xPos + colWidths[index] - 4 : xPos;
            doc.text(header, textX, tableStartY + 3.5, { align: isRTL ? 'right' : 'left' });
            xPos += colWidths[index];
          });

          // Draw table rows
          doc.setTextColor(0, 0, 0);
          doc.setFont(headerFont, 'normal');
          doc.setFontSize(7);
          let rowIndex = 0; // Track row index for this supervisor's table
          sortedEquipment.forEach((equipment, index) => {
            let currentRowY = tableStartY + rowHeight + (rowIndex * rowHeight);

            // Check if we need a new page for this row (landscape height is 210mm)
            if (currentRowY + rowHeight > 200) {
              doc.addPage('a4', 'l'); // Add landscape page
              yPosition = 15;
              tableStartY = yPosition;
              rowIndex = 0; // Reset row index for new page
              // Redraw header on new page
              doc.setFillColor(52, 152, 219);
              doc.rect(margin, yPosition, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(7);
              xPos = margin + 2;
              headers.forEach((header, hIndex) => {
                // Use appropriate font for each header
                const headerHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(header);
                if (useArabicFont && headerHasArabic) {
                  doc.setFont(SupervisorEquipmentReportPDFService.ARABIC_FONT_NAME, 'bold');
                } else {
                  doc.setFont('helvetica', 'bold');
                }
                const textX = isRTL ? xPos + colWidths[hIndex] - 4 : xPos;
                doc.text(header, textX, yPosition + 3.5, { align: isRTL ? 'right' : 'left' });
                xPos += colWidths[hIndex];
              });
              doc.setTextColor(0, 0, 0);
              doc.setFont(headerFont, 'normal');
              yPosition += rowHeight;
              currentRowY = tableStartY + rowHeight + (rowIndex * rowHeight);
            }

            // Alternate row colors
            if (rowIndex % 2 === 0) {
              doc.setFillColor(245, 245, 245);
              doc.rect(margin, currentRowY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
            }

            const rowData = [
              formatNumber(globalSerialNumber),
              equipment.display_name || equipment.equipment_name || labels.notAvailable,
              SupervisorEquipmentReportPDFService.extractEnglishPart(equipment.customer_name) || labels.notAvailable,
              equipment.operator_name
                ? `${equipment.operator_name}${
                    equipment.operator_file_number ? ` (${equipment.operator_file_number})` : ''
                  }`
                : labels.noOperator,
              equipment.item_status || labels.notAvailable,
              formatDate(equipment.item_start_date),
              formatDate(equipment.item_completed_date),
            ];

            xPos = margin + 2;
            rowData.forEach((cell, cellIndex) => {
              // Check if this specific cell has Arabic text
              const cellText = String(cell);
              const cellHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(cellText);
              
              // Switch font based on cell content
              if (useArabicFont && cellHasArabic) {
                doc.setFont(SupervisorEquipmentReportPDFService.ARABIC_FONT_NAME, 'normal');
              } else {
                doc.setFont('helvetica', 'normal');
              }
              
              // Truncate long text
              const maxWidth = colWidths[cellIndex] - 3;
              let displayText = cellText;
              if (doc.getTextWidth(displayText) > maxWidth) {
                const splitText = doc.splitTextToSize(displayText, maxWidth);
                displayText = `${splitText[0]}...`;
              }
              const textX =
                cellIndex === 0
                  ? xPos + colWidths[cellIndex] / 2
                  : isRTL
                    ? xPos + colWidths[cellIndex] - 2
                    : xPos;
              const align =
                cellIndex === 0 ? 'center' : isRTL ? ('right' as const) : ('left' as const);
              doc.text(displayText, textX, currentRowY + 3.5, { align });
              xPos += colWidths[cellIndex];
            });

            globalSerialNumber++; // Increment serial number
            rowIndex++; // Increment row index
          });

          yPosition = tableStartY + rowHeight + (rowIndex * rowHeight) + 5;
        } else {
          doc.setFontSize(8);
          doc.setFont(headerFont, 'normal');
          doc.text(labels.noEquipment, margin, yPosition);
          yPosition += 6;
        }

        // Add minimal spacing between supervisors
        yPosition += 3;
      });
    }

    return doc;
  }

  static async downloadSupervisorEquipmentReportPDF(
    data: SupervisorEquipmentReportData | any,
    filename?: string,
    options?: { isRTL?: boolean }
  ): Promise<void> {
    try {
      // Extract data if wrapped in response structure
      const reportData: SupervisorEquipmentReportData = data.data || data;

      const isRTL = options?.isRTL ?? false;
      const requiresArabicFont = isRTL || this.reportHasArabicText(reportData);
      const arabicFontData = requiresArabicFont ? await this.loadArabicFontData() : null;

      const pdf = this.generateSupervisorEquipmentReportPDF(reportData, {
        isRTL,
        arabicFontData,
      });
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `supervisor-equipment-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating supervisor equipment PDF:', error);
      throw error;
    }
  }

  private static async loadArabicFontData(): Promise<string | null> {
    if (this.arabicFontCache) {
      return this.arabicFontCache;
    }

    if (this.arabicFontPromise) {
      return this.arabicFontPromise;
    }

    if (typeof window === 'undefined') {
      return null;
    }

    const fontUrl =
      typeof window !== 'undefined'
        ? new URL(`/fonts/${this.ARABIC_FONT_FILE}`, window.location.origin).toString()
        : `/fonts/${this.ARABIC_FONT_FILE}`;

    this.arabicFontPromise = fetch(fontUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch Arabic font');
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        const base64 = SupervisorEquipmentReportPDFService.arrayBufferToBase64(buffer);
        this.arabicFontCache = base64;
        return base64;
      })
      .catch(error => {
        console.error('Failed to load Arabic font for PDF:', error);
        return null;
      })
      .finally(() => {
        this.arabicFontPromise = null;
      });

    return this.arabicFontPromise;
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks to avoid call stack limits

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      let chunkStr = '';
      for (let j = 0; j < chunk.length; j++) {
        chunkStr += String.fromCharCode(chunk[j]);
      }
      binary += chunkStr;
    }

    return btoa(binary);
  }

  private static applyArabicFont(doc: jsPDF, fontData?: string | null) {
    if (!fontData || typeof fontData !== 'string' || fontData.length === 0) {
      console.warn(
        '[SupervisorEquipmentReportPDFService] Arabic font data missing, falling back to default font'
      );
      return;
    }

    const docAny = doc as any;
    if (docAny.__cairoFontApplied) {
      doc.setFont(this.ARABIC_FONT_NAME, 'normal');
      return;
    }

    try {
      doc.addFileToVFS(this.ARABIC_FONT_FILE, fontData);
      // Use standard encoding for Noto Sans Arabic
      doc.addFont(this.ARABIC_FONT_FILE, this.ARABIC_FONT_NAME, 'normal');
      doc.setFont(this.ARABIC_FONT_NAME, 'normal');
      docAny.__arabicFontApplied = true;
    } catch (error) {
      console.error('[SupervisorEquipmentReportPDFService] Failed to register Arabic font:', error);
      throw error; // Re-throw to help debug font issues
    }
  }

  private static extractEnglishPart(text: string | null | undefined): string {
    if (!text) return '';
    
    // Check if text has both English and Arabic (separated by hyphen or other delimiter)
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const hasArabic = arabicPattern.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    
    if (hasArabic && hasEnglish) {
      // Split by common separators
      const parts = text.split(/[-–—|]/);
      
      // Find the part with English (without Arabic)
      for (const part of parts) {
        const trimmedPart = part.trim();
        if (/[a-zA-Z]/.test(trimmedPart) && !arabicPattern.test(trimmedPart)) {
          return trimmedPart;
        }
      }
    }
    
    return text;
  }

  private static reportHasArabicText(data: SupervisorEquipmentReportData): boolean {
    const containsArabic = (value: string | null | undefined) => {
      if (!value) return false;
      return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(value);
    };

    if (containsArabic(data.summary_stats?.average_equipment_per_supervisor?.toString())) {
      return true;
    }

    if (Array.isArray(data.supervisor_groups)) {
      for (const group of data.supervisor_groups) {
        if (
          containsArabic(group.supervisor_name) ||
          containsArabic(group.supervisor_file_number || '') ||
          (Array.isArray(group.equipment) &&
            group.equipment.some(
              eq =>
                containsArabic(eq.equipment_name) ||
                containsArabic(eq.display_name) ||
                containsArabic(eq.customer_name) ||
                containsArabic(eq.rental_number) ||
                containsArabic(eq.rental_status) ||
                containsArabic(eq.operator_name) ||
                containsArabic(eq.item_status)
            ))
        ) {
          return true;
        }
      }
    }

    return false;
  }
}

