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
  istimara?: string;
  istimaraExpiry?: string;
  status: "available" | "expired" | "expiring" | "missing";
  daysRemaining: number | null;
  manufacturer?: string;
  modelNumber?: string;
  categoryId?: number;
  driverName?: string;
  driverFileNumber?: string;
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
    didDrawPage: (data) => {
      // Footer (Page number)
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
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
    expiredEquipmentData: EquipmentData[]
  ): Promise<void> {
    const filename = `Expired_Equipment_Report_${new Date()
      .toISOString()
      .split("T")[0]}.pdf`;
    generateTablePDF(
      expiredEquipmentData,
      "EXPIRED EQUIPMENT REPORT",
      filename
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
