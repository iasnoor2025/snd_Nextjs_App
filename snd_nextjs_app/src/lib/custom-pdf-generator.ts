// Custom PDF Generator using only native browser APIs
// No external packages - pure custom solution

export interface PayslipData {
  employee: {
    file_number: string;
    name: string;
    designation: string;
    id: string;
  };
  payroll: {
    month: string;
    year: string;
    status: string;
    id: string;
    basic_salary: number;
    overtime_pay: number;
    net_salary: number;
  };
  attendance: {
    total_hours: number;
    regular_hours: number;
    overtime_hours: number;
    days_present: number;
    absent_days: number;
    absent_deduction: number;
  };
  timesheet?: any[];
}

export class CustomPDFGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private lineHeight: number;

  constructor() {
    this.pageWidth = 1123; // A4 landscape width in pixels (297mm * 3.78)
    this.pageHeight = 794; // A4 landscape height in pixels (210mm * 3.78)
    this.margin = 40;
    this.lineHeight = 24;
    this.currentY = this.margin;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.pageWidth;
    this.canvas.height = this.pageHeight;
    
    this.ctx = this.canvas.getContext('2d')!;
    this.setupCanvas();
  }

  private setupCanvas() {
    // Set white background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.pageWidth, this.pageHeight);
    
    // Set default font
    this.ctx.font = '16px Arial, sans-serif';
    this.ctx.fillStyle = '#000000';
  }

  private drawHeader() {
    // Blue header background
    this.ctx.fillStyle = '#1e40af';
    this.ctx.fillRect(0, 0, this.pageWidth, 80);
    
    // Company logo placeholder (blue circle)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(60, 40, 25, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Company name
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px Arial, sans-serif';
    this.ctx.fillText('Samhan Naser Al-Dosri Est.', 100, 35);
    this.ctx.font = '16px Arial, sans-serif';
    this.ctx.fillText('For Gen. Contracting & Rent. Equipments', 100, 55);
    
    // Employee Pay Slip title
    this.ctx.font = 'bold 24px Arial, sans-serif';
    this.ctx.fillText('Employee Pay Slip', this.pageWidth - 300, 35);
    this.ctx.font = '20px Arial, sans-serif';
    this.ctx.fillText('June 2025', this.pageWidth - 300, 60);
    
    this.currentY = 100;
  }

  private drawEmployeeDetails(data: PayslipData) {
    // Employee Details Box
    this.drawBox(40, this.currentY, 300, 120, '#f8fafc');
    this.ctx.fillStyle = '#1e40af';
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.fillText('EMPLOYEE DETAILS', 60, this.currentY + 25);
    
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillText(`File Number: ${data.employee.file_number}`, 60, this.currentY + 50);
    this.ctx.fillText(`Employee Name: ${data.employee.name}`, 60, this.currentY + 70);
    this.ctx.fillText(`Designation: ${data.employee.designation || 'N/A'}`, 60, this.currentY + 90);

    
    // Work Details Box
    this.drawBox(360, this.currentY, 300, 120, '#f8fafc');
    this.ctx.fillStyle = '#1e40af';
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.fillText('WORK DETAILS', 380, this.currentY + 25);
    
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillText(`Pay Period: ${data.payroll.month} ${data.payroll.year}`, 380, this.currentY + 50);
    this.ctx.fillText(`Date Range: 6/1/${data.payroll.year} - 6/30/${data.payroll.year}`, 380, this.currentY + 70);
    this.ctx.fillText(`Status: ${data.payroll.status}`, 380, this.currentY + 90);
    this.ctx.fillText(`Payroll ID: #${data.payroll.id}`, 380, this.currentY + 110);
    
    // Salary Summary Box
    this.drawBox(680, this.currentY, 300, 120, '#f8fafc');
    this.ctx.fillStyle = '#1e40af';
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.fillText('SALARY SUMMARY', 700, this.currentY + 25);
    
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillText(`Basic Salary: SAR ${data.payroll.basic_salary.toFixed(2)}`, 700, this.currentY + 50);
    this.ctx.fillText(`Overtime Pay: SAR ${data.payroll.overtime_pay.toFixed(2)}`, 700, this.currentY + 70);
    this.ctx.fillText(`Net Salary: SAR ${data.payroll.net_salary.toFixed(2)}`, 700, this.currentY + 90);
    
    this.currentY += 140;
  }

  private drawAttendanceRecord() {
    // Attendance Record Title
    this.ctx.fillStyle = '#1e40af';
    this.ctx.font = 'bold 18px Arial, sans-serif';
    this.ctx.fillText('ATTENDANCE RECORD', 40, this.currentY);
    this.currentY += 30;
    
    // Calendar grid
    const gridStartX = 40;
    const gridWidth = this.pageWidth - 80;
    const cellWidth = gridWidth / 30;
    
    // Draw grid lines
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 1;
    
    // Draw date numbers (1-30)
    for (let i = 0; i < 30; i++) {
      const x = gridStartX + (i * cellWidth);
      this.ctx.fillStyle = '#000000';
      this.ctx.font = '12px Arial, sans-serif';
      this.ctx.fillText((i + 1).toString().padStart(2, '0'), x + 5, this.currentY);
      
      // Draw day of week
      const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const dayIndex = (i + 1) % 7;
      this.ctx.fillText(days[dayIndex], x + 5, this.currentY + 20);
      
      // Draw attendance mark
      let mark = '8'; // Regular hours
      if (dayIndex === 5) mark = 'F'; // Friday
      this.ctx.fillStyle = dayIndex === 5 ? '#1e40af' : '#059669';
      this.ctx.font = 'bold 14px Arial, sans-serif';
      this.ctx.fillText(mark, x + 5, this.currentY + 40);
      
      // Draw vertical lines
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.currentY - 10);
      this.ctx.lineTo(x, this.currentY + 50);
      this.ctx.stroke();
    }
    
    // Draw horizontal lines
    this.ctx.beginPath();
    this.ctx.moveTo(gridStartX, this.currentY - 10);
    this.ctx.lineTo(gridStartX + gridWidth, this.currentY - 10);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(gridStartX, this.currentY + 50);
    this.ctx.lineTo(gridStartX + gridWidth, this.currentY + 50);
    this.ctx.stroke();
    
    // Legend
    this.currentY += 70;
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '12px Arial, sans-serif';
    this.ctx.fillText('Legend: 8 = regular hours, More than 8 = overtime hours, A = absent, F = Friday (present if working days before/after)', 40, this.currentY);
    
    this.currentY += 30;
  }

  private drawWorkingHoursAndSalary(data: PayslipData) {
    // Working Hours Summary
    this.drawBox(40, this.currentY, 400, 200, '#f8fafc');
    this.ctx.fillStyle = '#1e40af';
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.fillText('WORKING HOURS SUMMARY', 60, this.currentY + 25);
    
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 14px Arial, sans-serif';
    this.ctx.fillText('HOURS BREAKDOWN', 60, this.currentY + 50);
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillText(`Total Hours Worked: ${data.attendance.total_hours} hrs`, 60, this.currentY + 70);
    this.ctx.fillText(`Regular Hours: ${data.attendance.regular_hours} hrs`, 60, this.currentY + 90);
    this.ctx.fillText(`Overtime Hours: ${data.attendance.overtime_hours} hrs`, 60, this.currentY + 110);
    
    this.ctx.font = 'bold 14px Arial, sans-serif';
    this.ctx.fillText('ATTENDANCE SUMMARY', 60, this.currentY + 140);
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillText(`Days Worked: ${data.attendance.days_present} days`, 60, this.currentY + 160);
    this.ctx.fillText(`Absent Days: ${data.attendance.absent_days} days`, 60, this.currentY + 180);
    this.ctx.fillText(`Absent Deduction: -SAR ${data.attendance.absent_deduction.toFixed(2)}`, 60, this.currentY + 200);
    
    // Salary Breakdown
    this.drawBox(460, this.currentY, 400, 200, '#f8fafc');
    this.ctx.fillStyle = '#1e40af';
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.fillText('SALARY BREAKDOWN', 480, this.currentY + 25);
    
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 14px Arial, sans-serif';
    this.ctx.fillText('EARNINGS', 480, this.currentY + 50);
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillText(`Basic Salary: SAR ${data.payroll.basic_salary.toFixed(2)}`, 480, this.currentY + 70);
    this.ctx.fillText(`Overtime Pay: SAR ${data.payroll.overtime_pay.toFixed(2)}`, 480, this.currentY + 90);
    this.ctx.fillText(`Bonus Amount: SAR 0.00`, 480, this.currentY + 110);
    
    this.ctx.font = 'bold 14px Arial, sans-serif';
    this.ctx.fillText('DEDUCTIONS', 480, this.currentY + 140);
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillText(`Absent Days Deduction: -SAR ${data.attendance.absent_deduction.toFixed(2)}`, 480, this.currentY + 160);
    this.ctx.fillText(`Advance Deduction: -SAR 0.00`, 480, this.currentY + 180);
    
    // Net Salary
    this.ctx.fillStyle = '#059669';
    this.ctx.font = 'bold 18px Arial, sans-serif';
    this.ctx.fillText(`Net Salary: SAR ${data.payroll.net_salary.toFixed(2)}`, 480, this.currentY + 200);
    
    this.currentY += 220;
  }

  private drawSignatures(data: PayslipData) {
    const signatureWidth = 300;
    const signatureHeight = 120;
    const spacing = (this.pageWidth - 80 - (signatureWidth * 3)) / 2;
    
    // Chief Accountant
    this.drawBox(40, this.currentY, signatureWidth, signatureHeight, '#f8fafc');
    this.ctx.fillStyle = '#1e40af';
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.fillText('CHIEF ACCOUNTANT', 40 + (signatureWidth / 2) - 80, this.currentY + 25);
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillText('Samir Taima', 40 + (signatureWidth / 2) - 40, this.currentY + 60);
    this.ctx.fillText('Signature:', 40 + (signatureWidth / 2) - 40, this.currentY + 90);
    
    // Verified By
    this.drawBox(40 + signatureWidth + spacing, this.currentY, signatureWidth, signatureHeight, '#f8fafc');
    this.ctx.fillStyle = '#1e40af';
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.fillText('VERIFIED BY', 40 + signatureWidth + spacing + (signatureWidth / 2) - 60, this.currentY + 25);
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillText('Salem Samhan Al-Dosri', 40 + signatureWidth + spacing + (signatureWidth / 2) - 80, this.currentY + 60);
    this.ctx.fillText('Signature:', 40 + signatureWidth + spacing + (signatureWidth / 2) - 40, this.currentY + 90);
    
    // Employee
    this.drawBox(40 + (signatureWidth + spacing) * 2, this.currentY, signatureWidth, signatureHeight, '#f8fafc');
    this.ctx.fillStyle = '#1e40af';
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.fillText('EMPLOYEE', 40 + (signatureWidth + spacing) * 2 + (signatureWidth / 2) - 50, this.currentY + 25);
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillText(data.employee.name, 40 + (signatureWidth + spacing) * 2 + (signatureWidth / 2) - 60, this.currentY + 60);
    this.ctx.fillText('Signature:', 40 + (signatureWidth + spacing) * 2 + (signatureWidth / 2) - 40, this.currentY + 90);
  }

  private drawBox(x: number, y: number, width: number, height: number, fillColor: string) {
    this.ctx.fillStyle = fillColor;
    this.ctx.fillRect(x, y, width, height);
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
  }

  public generatePayslip(data: PayslipData): HTMLCanvasElement {
    this.currentY = this.margin;
    
    this.drawHeader();
    this.drawEmployeeDetails(data);
    this.drawAttendanceRecord();
    this.drawWorkingHoursAndSalary(data);
    this.drawSignatures(data);
    
    return this.canvas;
  }

  public downloadPayslip(data: PayslipData, filename: string) {
    const canvas = this.generatePayslip(data);
    
    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  }
}
