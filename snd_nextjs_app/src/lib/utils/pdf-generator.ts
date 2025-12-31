import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

interface IqamaData {
  id: number;
  employeeName: string;
  fileNumber: string;
  nationality: string;
  position: string;
  companyName: string;
  location: string;
  expiryDate: string;
  status: "active" | "expired" | "expiring" | "missing";
  daysRemaining: number | null;
}

interface EquipmentData {
  id: number;
  equipmentName: string;
  equipmentNumber?: string;
  doorNumber?: string;
  istimara?: string;
  istimaraExpiry?: string;
  insurance?: string;
  insuranceExpiry?: string;
  tuvCard?: string;
  tuvCardExpiry?: string;
  gpsExpiry?: string;
  periodicExaminationExpiry?: string;
  warrantyExpiry?: string;
  status: "available" | "expired" | "expiring" | "missing";
  daysRemaining: number | null;
  manufacturer?: string;
  modelNumber?: string;
  categoryId?: number;
  driverName?: string;
  driverFileNumber?: string;
  // Dynamic fields for document type switching
  documentNumber?: string | null;
  documentExpiry?: string | null;
}

function generateTablePDF(data: any[], title: string, filename: string) {
  const doc = new jsPDF("landscape");

  // Sort by File Number
  const sortedData = [...data].sort((a, b) => {
    const fileA = a.fileNumber || "";
    const fileB = b.fileNumber || "";
    return fileA.localeCompare(fileB);
  });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  // Date & Total
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const today = new Date().toLocaleDateString();
  doc.text(`Date: ${today}`, 14, 28);
  doc.text(`Total Records: ${sortedData.length}`, 14, 34);

  // Table data
  const body: RowInput[] = sortedData.map((item, index) => [
    index + 1,
    item.fileNumber || "N/A",
    item.employeeName || item.equipmentName || "N/A",
    item.iqamaNumber || item.equipmentNumber || "N/A",
    item.expiryDate
      ? new Date(item.expiryDate).toLocaleDateString("en-CA")
      : item.istimaraExpiry
      ? new Date(item.istimaraExpiry).toLocaleDateString("en-CA")
      : "N/A",
  ]);

  autoTable(doc, {
    startY: 45,
    head: [["#", "File Number", "Name", "Iqama/Equip #", "Expiry Date"]],
    body,
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [220, 38, 38], // Red header
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      halign: "left",
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 20 }, // #
      1: { halign: "center", cellWidth: 40 }, // File Number
      2: { halign: "left", cellWidth: 80 }, // Name
      3: { halign: "center", cellWidth: 40 }, // Iqama/Equip #
      4: { halign: "center", cellWidth: 40 }, // Expiry Date
    },
    didDrawPage: () => {
      // Footer (Page number)
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Page ${doc.internal.pages ? doc.internal.pages.length - 1 : 1}`,
        pageSize.width / 2,
        pageHeight - 10,
        { align: "center" }
      );
    },
  });

  doc.save(filename);
}

function generateEquipmentTablePDF(
  data: EquipmentData[],
  title: string,
  filename: string,
  documentType: string,
  documentLabel: string
) {
  const doc = new jsPDF("landscape");

  // Sort by Equipment Name
  const sortedData = [...data].sort((a, b) => {
    const nameA = a.equipmentName || "";
    const nameB = b.equipmentName || "";
    return nameA.localeCompare(nameB);
  });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  // Date & Total
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const today = new Date().toLocaleDateString();
  doc.text(`Date: ${today}`, 14, 28);
  doc.text(`Total Records: ${sortedData.length}`, 14, 34);

  // Table data - dynamically handle document number based on type
  const body: RowInput[] = sortedData.map((item, index) => [
    index + 1,
    item.doorNumber || item.equipmentNumber || "N/A",
    item.equipmentName || "N/A",
    item.documentNumber || (documentType !== 'gps' && documentType !== 'periodicExamination' && documentType !== 'warranty' ? "N/A" : "-"),
    item.documentExpiry
      ? new Date(item.documentExpiry).toLocaleDateString("en-CA")
      : "N/A",
    item.daysRemaining !== null
      ? item.daysRemaining < 0
        ? `${Math.abs(item.daysRemaining)} days overdue`
        : `${item.daysRemaining} days remaining`
      : "N/A",
    item.driverName || "Unassigned",
  ]);

  autoTable(doc, {
    startY: 45,
    head: [
      [
        "#",
        "Door #",
        "Equipment Name",
        `${documentLabel} #`,
        "Expiry Date",
        "Days Remaining/Overdue",
        "Driver/Operator",
      ],
    ],
    body,
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [220, 38, 38], // Red header
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      halign: "left",
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 }, // #
      1: { halign: "center", cellWidth: 30 }, // Door #
      2: { halign: "left", cellWidth: 70 }, // Equipment Name
      3: { halign: "center", cellWidth: 40 }, // Document #
      4: { halign: "center", cellWidth: 35 }, // Expiry Date
      5: { halign: "center", cellWidth: 40 }, // Days Remaining/Overdue
      6: { halign: "left", cellWidth: 50 }, // Driver/Operator
    },
    didDrawPage: () => {
      // Footer (Page number)
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Page ${doc.internal.pages ? doc.internal.pages.length - 1 : 1}`,
        pageSize.width / 2,
        pageHeight - 10,
        { align: "center" }
      );
    },
  });

  doc.save(filename);
}

export class PDFGenerator {
  static async generateExpiredIqamaReport(
    expiredIqamaData: IqamaData[]
  ): Promise<void> {
    const filename = `Expired_Iqama_Report_${new Date()
      .toISOString()
      .split("T")[0]}.pdf`;
    generateTablePDF(expiredIqamaData, "EXPIRED IQAMA REPORT", filename);
  }

  static async generateExpiredEquipmentReport(
    expiredEquipmentData: EquipmentData[],
    documentType: string = 'istimara',
    documentLabel: string = 'Plate #',
    status: 'available' | 'expired' | 'expiring' | 'missing' | 'all' = 'expired'
  ): Promise<void> {
    const documentTypeLabels: Record<string, string> = {
      istimara: 'Plate #',
      insurance: 'Insurance',
      tuv: 'TUV Card',
      gps: 'GPS',
      periodicExamination: 'Periodic Examination',
      warranty: 'Warranty',
    };

    const label = documentLabel || documentTypeLabels[documentType] || 'Document';
    
    const statusLabels: Record<string, string> = {
      available: 'Available',
      expired: 'Expired',
      expiring: 'Expiring Soon',
      missing: 'Missing',
      all: 'All',
    };
    
    const statusLabel = statusLabels[status] || 'All';
    const filename = `${statusLabel.replace(/\s+/g, '_')}_Equipment_${label.replace(/\s+/g, '_')}_Report_${new Date()
      .toISOString()
      .split("T")[0]}.pdf`;
    const title = `${statusLabel.toUpperCase()} EQUIPMENT ${label.toUpperCase()} REPORT`;
    
    generateEquipmentTablePDF(
      expiredEquipmentData,
      title,
      filename,
      documentType,
      label
    );
  }

  static async generateCombinedExpiredReport(
    expiredIqamaData: IqamaData[],
    expiredEquipmentData: EquipmentData[]
  ): Promise<void> {
    const allData = [
      ...expiredIqamaData.map((item) => ({ ...item, type: "Iqama" })),
      ...expiredEquipmentData.map((item) => ({ ...item, type: "Equipment" })),
    ];
    const filename = `Combined_Report_${new Date()
      .toISOString()
      .split("T")[0]}.pdf`;
    generateTablePDF(allData, "EXPIRED DOCUMENTS REPORT", filename);
  }
}
