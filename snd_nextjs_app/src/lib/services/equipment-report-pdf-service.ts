import { jsPDF } from 'jspdf';
import { formatEquipmentReportStatus } from '@/lib/utils/equipment-report-status';
import {
  applyArabicFontToPdf,
  ARABIC_FONT_NAME,
  loadArabicFontDataForPdf,
  textContainsArabic,
} from '@/lib/utils/pdf-arabic-font';

export interface EquipmentReportData {
  summary_stats: {
    totalEquipment: number;
    activeEquipment: number;
    availableEquipment: number;
    rentedEquipment: number;
    maintenanceEquipment: number;
    totalValue: number;
    totalDepreciatedValue: number;
    avgDailyRate: number;
    avgWeeklyRate: number;
    avgMonthlyRate: number;
  };
  category_stats: Array<{
    categoryId: number;
    categoryName: string;
    categoryDescription: string;
    categoryIcon: string;
    categoryColor: string;
    totalEquipment: number;
    activeEquipment: number;
    availableEquipment: number;
    rentedEquipment: number;
    maintenanceEquipment: number;
    totalValue: number;
    totalDepreciatedValue: number;
    avgDailyRate: number;
    avgWeeklyRate: number;
    avgMonthlyRate: number;
  }>;
  equipment_by_category: Record<string, {
    categoryId: number;
    categoryName: string;
    categoryDescription: string;
    categoryIcon: string;
    categoryColor: string;
    equipment: Array<{
      id: number;
      name: string;
      description: string;
      manufacturer: string;
      modelNumber: string;
      serialNumber: string;
      chassisNumber: string;
      doorNumber: string;
      status: string;
      locationName: string;
      assignedEmployeeName: string;
      purchasePrice: number;
      dailyRate: number;
      weeklyRate: number;
      monthlyRate: number;
      assetCondition: string;
      depreciatedValue: number;
      istimara: string;
      istimaraExpiryDate: string;
      /** Rental / project / maintenance (aligned with equipment management) */
      assignmentSummary?: string;
      operatorDisplay?: string;
    }>;
  }>;
  equipment_list: Array<{
    id: number;
    name: string;
    description: string;
    categoryName: string;
    manufacturer: string;
    modelNumber: string;
    serialNumber: string;
    chassisNumber: string;
    doorNumber: string;
    status: string;
    locationName: string;
    assignedEmployeeName: string;
    purchasePrice: number;
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
    assetCondition: string;
    depreciatedValue: number;
    istimara: string;
    istimaraExpiryDate: string;
    assignmentSummary?: string;
    operatorDisplay?: string;
  }>;
  generated_at: string;
  parameters: {
    categoryId?: string;
    status?: string;
    locationId?: string;
    includeInactive?: boolean;
  };
}

export interface EquipmentReportPdfOptions {
  /** Base64 TTF from loadArabicFontDataForPdf(); required for Arabic in jsPDF */
  arabicFontData?: string | null;
}

export class EquipmentReportPDFService {
  /** True if any displayed field may contain Arabic (assignment, names, categories, …). */
  static reportHasArabicText(data: EquipmentReportData): boolean {
    const t = (v: unknown) => textContainsArabic(v == null ? '' : String(v));
    if (data.category_stats?.some((c) => t(c.categoryName))) return true;
    const byCat = data.equipment_by_category;
    if (byCat) {
      for (const cat of Object.values(byCat)) {
        if (t(cat.categoryName) || t(cat.categoryDescription)) return true;
        for (const eq of cat.equipment || []) {
          if (
            t(eq.name) ||
            t(eq.manufacturer) ||
            t(eq.modelNumber) ||
            t(eq.serialNumber) ||
            t(eq.doorNumber) ||
            t(eq.status) ||
            t(eq.locationName) ||
            t(eq.assignedEmployeeName) ||
            t(eq.assignmentSummary) ||
            t(eq.operatorDisplay)
          ) {
            return true;
          }
        }
      }
    }
    for (const eq of data.equipment_list || []) {
      if (
        t(eq.name) ||
        t(eq.categoryName) ||
        t(eq.manufacturer) ||
        t(eq.assignmentSummary) ||
        t(eq.operatorDisplay)
      ) {
        return true;
      }
    }
    return false;
  }

  static generateEquipmentReportPDF(data: EquipmentReportData, options?: EquipmentReportPdfOptions): jsPDF {
    if (!data) {
      throw new Error('Equipment report data is required');
    }

    // Landscape fits assignment + operator columns like equipment management
    const doc = new jsPDF('l', 'mm', 'a4');

    /** Register Noto whenever font data is provided (always loaded client-side) so Arabic renders even if pre-scan missed it */
    let notoRegistered = false;
    if (options?.arabicFontData) {
      try {
        applyArabicFontToPdf(doc, options.arabicFontData, false);
        notoRegistered = true;
      } catch (e) {
        console.warn('[EquipmentReportPDFService] Failed to register Arabic font:', e);
      }
    } else if (EquipmentReportPDFService.reportHasArabicText(data)) {
      console.warn(
        '[EquipmentReportPDFService] Arabic text in report but no font loaded — add /public/fonts/NotoSansArabic-Regular.ttf'
      );
    }
    doc.setFont('helvetica', 'normal');

    const setLatin = (style: 'normal' | 'bold' = 'normal') => {
      doc.setFont('helvetica', style);
    };
    const setFontForMixedText = (text: unknown) => {
      const s = String(text ?? '');
      if (notoRegistered && textContainsArabic(s)) {
        doc.setFont(ARABIC_FONT_NAME, 'normal');
      } else {
        doc.setFont('helvetica', 'normal');
      }
    };

    // Set document properties
    doc.setProperties({
      title: 'Equipment Report by Category',
      subject: 'Equipment Management Report',
      author: 'SND Rental System',
      creator: 'SND Rental System',
    });

    let yPosition = 20;
    const margin = 12;

    // Header
    doc.setFontSize(20);
    setLatin('bold');
    doc.text('Equipment Report by Category', 148, yPosition, { align: 'center' });
    yPosition += 10;

    // Company info
    doc.setFontSize(12);
    setLatin('normal');
    doc.text('SND Equipment Rental Company', 148, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text('Kingdom of Saudi Arabia', 148, yPosition, { align: 'center' });
    yPosition += 15;

    // Generation info
    doc.setFontSize(10);
    const generatedAt = data.generated_at || new Date().toISOString();
    doc.text(`Generated: ${new Date(generatedAt).toLocaleString()}`, 20, yPosition);
    yPosition += 5;

    // Parameters
    if (data.parameters && (data.parameters.categoryId || data.parameters.status || data.parameters.locationId)) {
      doc.text('Filters Applied:', 20, yPosition);
      yPosition += 5;

      if (data.parameters.categoryId) {
        const category = data.category_stats?.find(c => c.categoryId.toString() === data.parameters.categoryId);
        const catLine = `Category: ${category?.categoryName || 'Unknown'}`;
        setFontForMixedText(catLine);
        doc.text(catLine, 25, yPosition);
        setLatin('normal');
        yPosition += 4;
      }

      if (data.parameters.status) {
        doc.text(`Status: ${data.parameters.status}`, 25, yPosition);
        yPosition += 4;
      }

      if (data.parameters.locationId) {
        doc.text(`Location: ${data.parameters.locationId}`, 25, yPosition);
        yPosition += 4;
      }

      if (data.parameters.includeInactive) {
        doc.text('Include Inactive: Yes', 25, yPosition);
        yPosition += 4;
      }

      yPosition += 5;
    }

    yPosition += 5;

    // Category Statistics
    if (data.category_stats && data.category_stats.length > 0) {
      doc.setFontSize(14);
      setLatin('bold');
      doc.text('Category Statistics', 20, yPosition);
      yPosition += 10;

      const categoryData = data.category_stats.map(category => [
        category.categoryName || 'Unknown',
        (category.totalEquipment || 0).toString(),
        (category.activeEquipment || 0).toString(),
        (category.availableEquipment || 0).toString(),
        (category.rentedEquipment || 0).toString(),
        (category.maintenanceEquipment || 0).toString(),
        `SAR ${Number(category.totalValue || 0).toLocaleString()}`,
        `SAR ${Number(category.avgDailyRate || 0).toFixed(2)}`
      ]);

      // Draw category table manually
      const categoryTableStartY = yPosition;
      const categoryRowHeight = 7;
      const categoryColWidths = [30, 15, 15, 20, 15, 20, 25, 25];

      // Draw table header
      doc.setFillColor(41, 128, 185);
      doc.rect(20, categoryTableStartY, categoryColWidths.reduce((a, b) => a + b, 0), categoryRowHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      setLatin('bold');
      const headers = ['Category', 'Total', 'Active', 'Available', 'In use', 'Maint.', 'Total Value', 'Avg Daily Rate'];
      let xPos = 25;
      headers.forEach((header, index) => {
        doc.text(header, xPos, categoryTableStartY + 4.5);
        xPos += categoryColWidths[index];
      });

      // Draw table rows
      doc.setTextColor(0, 0, 0);
      categoryData.forEach((row, index) => {
        const rowY = categoryTableStartY + categoryRowHeight + (index * categoryRowHeight);
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(20, rowY, categoryColWidths.reduce((a, b) => a + b, 0), categoryRowHeight, 'F');
        }
        xPos = 25;
        row.forEach((cell, cellIndex) => {
          setFontForMixedText(cell);
          doc.setTextColor(0, 0, 0);
          doc.text(String(cell), xPos, rowY + 4.5);
          xPos += categoryColWidths[cellIndex];
        });
      });

      yPosition = categoryTableStartY + categoryRowHeight + (categoryData.length * categoryRowHeight) + 15;
    }

    // Equipment details: same columns as web report; Helvetica for Latin, Noto only when cell has Arabic
    const pageBottom = 188;
    const pageInnerW = doc.internal.pageSize.getWidth() - margin * 2;
    // Wider Status (idx 5), narrower Location (6) — assignment col 7 still absorbs leftover width
    const equipmentColWidths = [30, 22, 16, 16, 13, 22, 11, 110, 33];
    // Stretch assignment column to full content width (A4 landscape inner ≈ 273mm)
    let eqPad = pageInnerW - equipmentColWidths.reduce((a, b) => a + b, 0);
    if (eqPad > 0) {
      equipmentColWidths[7] += eqPad;
    }
    const equipmentHeaders = [
      'Name',
      'Mfr',
      'Model',
      'Serial',
      'Door',
      'Status',
      'Location',
      'Assignment',
      'Operator',
    ];

    if (data.equipment_by_category) {
      Object.values(data.equipment_by_category).forEach((category) => {
        if (yPosition > pageBottom - 24) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(11);
        const categoryName = category.categoryName || 'Unknown Category';
        const equipmentCount = category.equipment?.length || 0;
        const catTitle = `${categoryName} (${equipmentCount} items)`;
        if (notoRegistered && textContainsArabic(catTitle)) {
          setFontForMixedText(catTitle);
        } else {
          setLatin('bold');
        }
        doc.text(catTitle, margin, yPosition);
        yPosition += 7;

        if (!category.equipment?.length) {
          yPosition += 4;
          return;
        }

        const tableW = equipmentColWidths.reduce((a, b) => a + b, 0);
        const headerH = 7;
        const lineH = 2.5;
        const cellPad = 2.5;

        const drawHeader = (startY: number) => {
          doc.setFillColor(52, 152, 219);
          doc.rect(margin, startY, tableW, headerH, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(6.5);
          setLatin('bold');
          let x = margin + 1;
          equipmentHeaders.forEach((h, i) => {
            doc.text(h, x, startY + 4.8);
            x += equipmentColWidths[i];
          });
          doc.setTextColor(0, 0, 0);
          setLatin('normal');
        };

        let tableY = yPosition;
        drawHeader(tableY);
        tableY += headerH;

        const maxLinesPerCol = [4, 3, 3, 3, 3, 5, 4, 16, 8];

        category.equipment.forEach((eq, index) => {
          doc.setFontSize(6);
          setLatin('normal');

          const rowStrings = [
            String(eq.name || '—'),
            String(eq.manufacturer || '—'),
            String(eq.modelNumber || '—'),
            String(eq.serialNumber || '—'),
            String(eq.doorNumber || '—'),
            formatEquipmentReportStatus(eq.status),
            String(eq.locationName || '—'),
            String(eq.assignmentSummary ?? '—'),
            String(eq.operatorDisplay ?? '—'),
          ];

          const cellLines = rowStrings.map((text, i) => {
            setFontForMixedText(text);
            const cap = maxLinesPerCol[i] ?? 5;
            const lines = doc.splitTextToSize(String(text), Math.max(8, equipmentColWidths[i] - 2));
            return lines.length <= cap ? lines : lines.slice(0, cap);
          });
          const maxLines = Math.max(1, ...cellLines.map((lines) => lines.length));
          const rowH = cellPad + maxLines * lineH + 1;

          if (tableY + rowH > pageBottom) {
            doc.addPage();
            tableY = margin;
            drawHeader(tableY);
            tableY += headerH;
          }

          if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, tableY, tableW, rowH, 'F');
          }

          doc.setTextColor(0, 0, 0);
          let cx = margin + 1;
          cellLines.forEach((lines, colIdx) => {
            lines.forEach((line, lineIdx) => {
              setFontForMixedText(line);
              doc.text(line, cx, tableY + cellPad + lineIdx * lineH);
            });
            cx += equipmentColWidths[colIdx];
          });

          tableY += rowH;
        });

        yPosition = tableY + 8;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    const pageH = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      setLatin('normal');
      doc.text(`Page ${i} of ${pageCount}`, margin, pageH - 6);
      doc.text(new Date().toLocaleDateString(), doc.internal.pageSize.getWidth() - margin - 40, pageH - 6);
    }

    return doc;
  }

  static async generateEquipmentReportPDFBlob(data: EquipmentReportData): Promise<Blob> {
    const arabicFontData = await loadArabicFontDataForPdf();
    const doc = this.generateEquipmentReportPDF(data, { arabicFontData });
    return doc.output('blob');
  }

  static async downloadEquipmentReportPDF(data: EquipmentReportData, filename?: string): Promise<void> {
    const blob = await this.generateEquipmentReportPDFBlob(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `equipment-report-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
