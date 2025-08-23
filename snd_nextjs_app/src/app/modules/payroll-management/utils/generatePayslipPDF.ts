import { loadJsPDF } from '@/lib/client-libraries';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  file_number: string;
  basic_salary: number;
  department: string;
  designation: string;
  status: string;
  food_allowance?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  overtime_rate_multiplier?: number;
  overtime_fixed_rate?: number;
  contract_days_per_month?: number;
  contract_hours_per_day?: number;
}

interface Payroll {
  id: number;
  employee_id: number;
  employee: Employee;
  month: number;
  year: number;
  base_salary: number;
  overtime_amount: number;
  bonus_amount: number;
  deduction_amount: number;
  advance_deduction: number;
  final_amount: number;
  total_worked_hours: number;
  overtime_hours: number;
  status: string;
}

interface AttendanceData {
  date: string;
  day: number;
  status: string;
  hours: number;
  overtime: number;
}

interface PayslipData {
  payroll: Payroll;
  employee: Employee;
  attendanceData: AttendanceData[];
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
}

export async function generatePayslipPDF(data: PayslipData): Promise<void> {
  // Load jsPDF library
  const jsPDF = await loadJsPDF();
  
  // Extract data
  const { payroll, employee, attendanceData } = data;
  
  // Create PDF using jsPDF with exact payslip layout
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;
  
  // Helper function to format currency
  const formatCurrencyForPDF = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  // ===== PAYSLIP HEADER SECTION =====
  // Header background
  pdf.setFillColor(30, 64, 175); // Dark blue background
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'F');
  
  // Left side: Company Logo and Name
  const logoSize = 20;
  const logoX = margin + 8;
  const logoY = yPosition + 2;
  
  // Add the SND logo image
  try {
    pdf.addImage('/snd-logo.png', 'PNG', logoX, logoY, logoSize, logoSize);
  } catch (loadErr) {
    // Fallback if image loading fails
    console.error('Error loading logo image:', loadErr);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(logoX, logoY, logoSize, logoSize, 'F');
  }
  
  // Company name and subtitle
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Samhan Naser Al-Dosri Est.', logoX + logoSize + 15, logoY + 8);
  
  pdf.setFontSize(10);
  pdf.text('For Gen. Contracting & Rent. Equipments', logoX + logoSize + 20, logoY + 16);
  
  // Right side: Payslip title and month
  const monthName = new Date(payroll.year, payroll.month - 1).toLocaleDateString('en-US', { month: 'long' });
  pdf.setFontSize(14);
  pdf.text('Employee Pay Slip', pageWidth - margin - 10, logoY + 8, { align: 'right' });
  pdf.setFontSize(10);
  pdf.text(`${monthName} ${payroll.year}`, pageWidth - margin - 10, logoY + 16, { align: 'right' });
  
  yPosition += 25; // Space after header
  
  // ===== FIRST ROW - 3 COLUMNS =====
  const firstRowY = yPosition;
  const columnHeight = 25;
  const columnWidth = (pageWidth - 2 * margin - 20) / 3; // 3 columns with spacing for portrait mode
  
  // Column 1: Employee Information - Blue Theme
  const col1X = margin;
  const col1Y = firstRowY;
  
  // Background with rounded corners effect
  pdf.setFillColor(219, 234, 254); // Light blue background
  pdf.rect(col1X, col1Y, columnWidth, columnHeight, 'F');
  pdf.setDrawColor(59, 130, 246); // Blue border
  pdf.setLineWidth(0.8);
  pdf.rect(col1X, col1Y, columnWidth, columnHeight);
  
  // Header with accent line
  pdf.setFillColor(59, 130, 246); // Blue accent
  pdf.rect(col1X, col1Y, columnWidth, 6, 'F');
  
  pdf.setTextColor(255, 255, 255); // White text for header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Employee Information', col1X + 8, col1Y + 4);
  
  // Content with right-aligned values
  pdf.setTextColor(30, 58, 138); // Dark blue text
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  let contentY = col1Y + 10;
  const employeeName = employee?.full_name || `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim() || 'Unknown Employee';
  
  // Right-aligned values for Employee Information
  const col1LabelX = col1X + 8;
  const col1ValueX = col1X + columnWidth - 8;
  
  pdf.text(`File Number:`, col1LabelX, contentY);
  pdf.text(`${employee?.file_number || '-'}`, col1ValueX, contentY, { align: 'right' });
  contentY += 4;
  
  pdf.text(`Employee Name:`, col1LabelX, contentY);
  // Highlight employee name with different color and font weight
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10); // Slightly larger font
  pdf.setTextColor(59, 130, 246); // Blue color to make it stand out
  pdf.text(`${employeeName.toUpperCase()}`, col1ValueX, contentY, { align: 'right' });
  // Reset to normal styling
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(30, 58, 138); // Reset to dark blue text
  contentY += 4;
  
  pdf.text(`Designation:`, col1LabelX, contentY);
  pdf.text(`${employee?.designation || '-'}`, col1ValueX, contentY, { align: 'right' });
  
  // Calculate pay details - Convert Decimal to numbers
  const basicSalary = Number(payroll.base_salary) || 0;
  const overtimeAmount = Number(payroll.overtime_amount) || 0;
  const bonusAmount = Number(payroll.bonus_amount) || 0;
  const advanceDeduction = Number(payroll.advance_deduction) || 0;
  
  // Calculate attendance data
  // Create a map of attendance data by date for easier lookup
  const attendanceMap = new Map();
  
  if (attendanceData && Array.isArray(attendanceData)) {
    attendanceData.forEach(day => {
      // Extract just the date part (YYYY-MM-DD) from the API response
      let dateKey = new Date().toISOString().split('T')[0]; // Default to today's date
      
      if (day.date) {
        const dateString = String(day.date);
        if (dateString.includes(' ')) {
          // Format: "2025-07-01 00:00:00"
          dateKey = dateString.split(' ')[0];
        } else if (dateString.includes('T')) {
          // Format: "2025-07-01T00:00:00.000Z"
          dateKey = dateString.split('T')[0];
        } else {
          // Format: "2025-07-01"
          dateKey = dateString;
        }
      }
      
      if (dateKey) {
        attendanceMap.set(dateKey, day);
      }
    });
  }
  
  // Calculate total worked hours from attendance data
  const totalWorkedHoursFromAttendance = attendanceData.reduce((total, day) => {
    return total + (Number(day.hours) || 0) + (Number(day.overtime) || 0);
  }, 0);
  
  // Calculate overtime hours from attendance data
  const overtimeHoursFromAttendance = attendanceData.reduce((total, day) => {
    return total + (Number(day.overtime) || 0);
  }, 0);
  
  // Calculate days worked from attendance data
  const daysWorkedFromAttendance = attendanceData.reduce((count, day) => {
    return count + (Number(day.hours) > 0 || Number(day.overtime) > 0 ? 1 : 0);
  }, 0);
  
  // Calculate number of days in the month
  const daysInMonth = new Date(payroll.year, payroll.month, 0).getDate();
  
  // Calculate absent days
  const absentDays = (() => {
    let absentCount = 0;
    
    // Loop through all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(payroll.year, payroll.month - 1, day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const isFriday = dayName === 'Fri';
      
      // Create date string to check against attendance data
      const dateString = `${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = attendanceMap.get(dateString);
      
      // Check if this day has hours worked
      const hasHoursWorked = dayData && (Number(dayData.hours) > 0 || Number(dayData.overtime) > 0);
      
      if (isFriday) {
        // Special logic for Fridays
        if (hasHoursWorked) {
          // Friday has hours worked - count as present
          continue;
        } else {
          // Friday has no hours - check if it should be counted as absent
          const thursdayDate = new Date(payroll.year, payroll.month - 1, day - 1);
          const saturdayDate = new Date(payroll.year, payroll.month - 1, day + 1);
          
          // Check if Thursday and Saturday are also absent (within month bounds)
          const thursdayString = `${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(thursdayDate.getDate()).padStart(2, '0')}`;
          const saturdayString = `${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(saturdayDate.getDate()).padStart(2, '0')}`;
          
          const thursdayData = attendanceMap.get(thursdayString);
          const saturdayData = attendanceMap.get(saturdayString);
          
          const thursdayAbsent = !thursdayData || (Number(thursdayData.hours) === 0 && Number(thursdayData.overtime) === 0);
          const saturdayAbsent = !saturdayData || (Number(saturdayData.hours) === 0 && Number(saturdayData.overtime) === 0);
          
          // Count Friday as absent only if Thursday and Saturday are also absent
          if (thursdayAbsent && saturdayAbsent) {
            absentCount++;
          }
        }
      } else {
        // Non-Friday days - count as absent if no hours worked
        if (!hasHoursWorked) {
          absentCount++;
        }
      }
    }
    
    return absentCount;
  })();
  
  // Calculate totals for salary details
  const totalAllowances =
    (Number(employee.food_allowance) || 0) +
    (Number(employee.housing_allowance) || 0) +
    (Number(employee.transport_allowance) || 0);
  
  // Calculate absent deduction: (Basic Salary / Total Days in Month) * Absent Days
  const absentDeduction = absentDays > 0 ? (basicSalary / daysInMonth) * absentDays : 0;
  
  // Calculate net salary
  const netSalary =
    basicSalary +
    totalAllowances +
    overtimeAmount +
    bonusAmount -
    absentDeduction -
    advanceDeduction;
  
  // Column 2: Pay Period Details - Green Theme
  const col2X = margin + columnWidth + 10;
  const col2Y = firstRowY;
  
  // Background with rounded corners effect
  pdf.setFillColor(220, 252, 231); // Light green background
  pdf.rect(col2X, col2Y, columnWidth, columnHeight, 'F');
  pdf.setDrawColor(34, 197, 94); // Green border
  pdf.setLineWidth(0.8);
  pdf.rect(col2X, col2Y, columnWidth, columnHeight);
  
  // Header with accent line
  pdf.setFillColor(34, 197, 94); // Green accent
  pdf.rect(col2X, col2Y, columnWidth, 6, 'F');
  
  pdf.setTextColor(255, 255, 255); // White text for header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Pay Period Details', col2X + 8, col2Y + 4);
  
  // Content with right-aligned values
  pdf.setTextColor(21, 128, 61); // Dark green text
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  contentY = col2Y + 10;
  const startDate = new Date(payroll.year, payroll.month - 1, 1);
  const endDate = new Date(payroll.year, payroll.month, 0);
  const formattedStartDate = startDate.toLocaleDateString();
  const formattedEndDate = endDate.toLocaleDateString();
  
  // Right-aligned values for Pay Period Details
  const col2LabelX = col2X + 8;
  const col2ValueX = col2X + columnWidth - 8;
  
  pdf.text(`Pay Period:`, col2LabelX, contentY);
  pdf.text(`${monthName} ${payroll.year}`, col2ValueX, contentY, { align: 'right' });
  contentY += 4;
  
  pdf.text(`Date Range:`, col2LabelX, contentY);
  pdf.text(`${formattedStartDate} - ${formattedEndDate}`, col2ValueX, contentY, { align: 'right' });
  contentY += 4;
  
  pdf.text(`Status:`, col2LabelX, contentY);
  pdf.text(`${payroll.status}`, col2ValueX, contentY, { align: 'right' });
  
  // Column 3: Salary Summary - Purple Theme
  const col3X = margin + 2 * columnWidth + 20;
  const col3Y = firstRowY;
  
  // Background with rounded corners effect
  pdf.setFillColor(243, 232, 255); // Light purple background
  pdf.rect(col3X, col3Y, columnWidth, columnHeight, 'F');
  pdf.setDrawColor(147, 51, 234); // Purple border
  pdf.setLineWidth(0.8);
  pdf.rect(col3X, col3Y, columnWidth, columnHeight);
  
  // Header with accent line
  pdf.setFillColor(147, 51, 234); // Purple accent
  pdf.rect(col3X, col3Y, columnWidth, 6, 'F');
  
  pdf.setTextColor(255, 255, 255); // White text for header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Salary Summary', col3X + 8, col3Y + 4);
  
  // Content with right-aligned values
  pdf.setTextColor(88, 28, 135); // Dark purple text
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  contentY = col3Y + 10;
  
  // Right-aligned values for Salary Summary
  const col3LabelX = col3X + 8;
  const col3ValueX = col3X + columnWidth - 8;
  
  pdf.text(`Basic Salary:`, col3LabelX, contentY);
  pdf.text(`${formatCurrencyForPDF(basicSalary)}`, col3ValueX, contentY, { align: 'right' });
  contentY += 4;
  
  pdf.text(`Overtime Pay:`, col3LabelX, contentY);
  pdf.text(`${formatCurrencyForPDF(overtimeAmount)}`, col3ValueX, contentY, { align: 'right' });
  contentY += 4;
  
  pdf.text(`Net Salary:`, col3LabelX, contentY);
  pdf.text(`${formatCurrencyForPDF(netSalary)}`, col3ValueX, contentY, { align: 'right' });
  
  // Find the highest Y position from the 3 columns
  const firstRowHeight = firstRowY + columnHeight + 8;

  // ===== SECOND ROW - ATTENDANCE RECORD =====
  const attendanceY = firstRowHeight;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Attendance Record', margin, attendanceY);
  
  // Create clean, modern attendance table
  const tableStartY = attendanceY + 6;
  const tableWidth = pageWidth - 2 * margin;
  const cellWidth = tableWidth / daysInMonth;
  const rowHeight = 5; // Increased height for better readability
  const totalTableHeight = rowHeight * 4; // 4 rows

  // Clean table background
  pdf.setFillColor(250, 250, 250); // Light gray background
  pdf.rect(margin, tableStartY, tableWidth, totalTableHeight, 'F');
  
  // Row backgrounds for better visual separation
  // Row 1: Day numbers (light blue)
  pdf.setFillColor(219, 234, 254);
  pdf.rect(margin, tableStartY, tableWidth, rowHeight, 'F');
  
  // Row 2: Day names (very light blue)
  pdf.setFillColor(239, 246, 255);
  pdf.rect(margin, tableStartY + rowHeight, tableWidth, rowHeight, 'F');
  
  // Row 3: Regular hours (light gray)
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, tableStartY + 2 * rowHeight, tableWidth, rowHeight, 'F');
  
  // Row 4: Overtime hours (very light gray)
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, tableStartY + 3 * rowHeight, tableWidth, rowHeight, 'F');
  
  // Color individual cells based on content (F, A, 8)
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = attendanceMap.get(dateString);
    const date = new Date(payroll.year, payroll.month - 1, day);
    const dayOfWeek = date.getDay();
    const x = margin + (day - 1) * cellWidth;
    
    if (dayOfWeek === 5) { // Friday
      pdf.setFillColor(255, 237, 213); // Light orange for Friday
      pdf.rect(x, tableStartY + 2 * rowHeight, cellWidth, rowHeight, 'F');
    } else if (dayData && Number(dayData.hours) > 0) {
      pdf.setFillColor(220, 252, 231); // Light green for working days
      pdf.rect(x, tableStartY + 2 * rowHeight, cellWidth, rowHeight, 'F');
    } else {
      pdf.setFillColor(254, 226, 226); // Light red for absent days
      pdf.rect(x, tableStartY + 2 * rowHeight, cellWidth, rowHeight, 'F');
    }
  }
  
  // Clean table border
  pdf.setDrawColor(209, 213, 219);
  pdf.setLineWidth(0.8);
  pdf.rect(margin, tableStartY, tableWidth, totalTableHeight);

  // Subtle row separators
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.3);
  for (let row = 1; row <= 3; row++) {
    const y = tableStartY + row * rowHeight;
    pdf.line(margin, y, margin + tableWidth, y);
  }

  // Clean column separators
  for (let day = 1; day <= daysInMonth; day++) {
    const x = margin + day * cellWidth;
    pdf.line(x, tableStartY, x, tableStartY + totalTableHeight);
  }

  // Day numbers header (first row)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(31, 41, 55);
  for (let day = 1; day <= daysInMonth; day++) {
    const x = margin + (day - 1) * cellWidth;
    const y = tableStartY + rowHeight / 2 + 1.5;
    pdf.text(day.toString().padStart(2, '0'), x + cellWidth / 2, y, { align: 'center' });
  }
  
  // Day names header (second row)
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(payroll.year, payroll.month - 1, day);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const x = margin + (day - 1) * cellWidth;
    const y = tableStartY + rowHeight + rowHeight / 2 + 1.5;
    pdf.text(dayName.substring(0, 1).toUpperCase(), x + cellWidth / 2, y, { align: 'center' });
  }

  // Regular Hours row (third row) - Show F for Friday, A for absent, 8 for working days
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = attendanceMap.get(dateString);
    const date = new Date(payroll.year, payroll.month - 1, day);
    const dayOfWeek = date.getDay();
    const x = margin + (day - 1) * cellWidth;
    const y = tableStartY + 2 * rowHeight + rowHeight / 2 + 1.5;
    
    if (dayOfWeek === 5) { // Friday
      pdf.setTextColor(59, 130, 246); // Blue color for Friday (holiday)
      pdf.text('F', x + cellWidth / 2, y, { align: 'center' });
    } else if (dayData && Number(dayData.hours) > 0) {
      const hours = Number(dayData.hours);
      if (hours >= 8) {
        pdf.setTextColor(34, 197, 94); // Green color for Present (8+ hours)
        pdf.text('P', x + cellWidth / 2, y, { align: 'center' });
      } else {
        pdf.setTextColor(34, 197, 94); // Green color for partial hours
        pdf.text(hours.toString(), x + cellWidth / 2, y, { align: 'center' });
      }
    } else {
      pdf.setTextColor(239, 68, 68); // Red color for absent
      pdf.text('A', x + cellWidth / 2, y, { align: 'center' });
    }
  }

  // Overtime Hours row (fourth row) - Pink color to stand out
  pdf.setTextColor(220, 38, 127); // Pink color for overtime hours
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = attendanceMap.get(dateString);
    const x = margin + (day - 1) * cellWidth;
    const y = tableStartY + 3 * rowHeight + rowHeight / 2 + 1.5;
    
    if (dayData && Number(dayData.overtime) > 0) {
      pdf.text(Number(dayData.overtime).toString(), x + cellWidth / 2, y, { align: 'center' });
    } else {
      pdf.text('-', x + cellWidth / 2, y, { align: 'center' });
    }
  }

  // Clean legend with better positioning
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.text('Legend: P = Present (8+ hours), 6/7 = Partial hours, A = absent, F = Friday (holiday)', margin, tableStartY + totalTableHeight + 8);
  
  // ===== THIRD ROW - WORKING HOURS & SALARY BREAKDOWN =====
  const thirdRowY = tableStartY + totalTableHeight + 15; // Reduced spacing to fit on page
  const sectionHeight = 40; // Reduced height to fit better
  
  // Left side: Working Hours Summary - Orange Theme
  const leftColumnX = margin;
  const leftColumnWidth = (pageWidth - 2 * margin - 20) / 2;
  
  // Background with rounded corners effect
  pdf.setFillColor(255, 237, 213); // Light orange background
  pdf.rect(leftColumnX, thirdRowY, leftColumnWidth, sectionHeight, 'F');
  pdf.setDrawColor(245, 158, 11); // Orange border
  pdf.setLineWidth(0.8);
  pdf.rect(leftColumnX, thirdRowY, leftColumnWidth, sectionHeight);
  
  // Header with accent line
  pdf.setFillColor(245, 158, 11); // Orange accent
  pdf.rect(leftColumnX, thirdRowY, leftColumnWidth, 6, 'F');
  
  pdf.setTextColor(255, 255, 255); // White text for header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('HOURS BREAKDOWN:', leftColumnX + 8, thirdRowY + 4);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(120, 53, 15); // Dark orange text
  let leftY = thirdRowY + 10;
  
  // Right-aligned values like a proper payslip
  const leftLabelX = leftColumnX + 8;
  const leftValueX = leftColumnX + leftColumnWidth - 8;
  
  // HOURS BREAKDOWN section with right-aligned values
  pdf.text(`Total Hours Worked:`, leftLabelX, leftY);
  pdf.text(`${totalWorkedHoursFromAttendance} hrs`, leftValueX, leftY, { align: 'right' });
  leftY += 4;
  
  pdf.text(`Regular Hours:`, leftLabelX, leftY);
  pdf.text(`${totalWorkedHoursFromAttendance - overtimeHoursFromAttendance} hrs`, leftValueX, leftY, { align: 'right' });
  leftY += 4;
  
  pdf.text(`Overtime Hours:`, leftLabelX, leftY);
  pdf.text(`${overtimeHoursFromAttendance} hrs`, leftValueX, leftY, { align: 'right' });
  leftY += 4;
  
  // ATTENDANCE SUMMARY sub-header with background
  pdf.setFillColor(245, 158, 11); // Orange background for sub-header
  pdf.rect(leftColumnX + 4, leftY - 2, leftColumnWidth - 8, 6, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255); // White text for sub-header
  pdf.text('ATTENDANCE SUMMARY:', leftColumnX + 8, leftY + 2);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(120, 53, 15); // Dark orange text
  leftY += 8; // Increased spacing from header to content
  
  // ATTENDANCE SUMMARY section with right-aligned values
  pdf.text(`Days Worked:`, leftLabelX, leftY);
  pdf.text(`${daysWorkedFromAttendance} days`, leftValueX, leftY, { align: 'right' });
  leftY += 4; // Reduced spacing
  
  pdf.text(`Absent Days:`, leftLabelX, leftY);
  pdf.text(`${absentDays} days`, leftValueX, leftY, { align: 'right' });
  leftY += 4; // Reduced spacing
  
  pdf.text(`Absent Days Deduction:`, leftLabelX, leftY);
  if (absentDays > 0) {
    pdf.setTextColor(239, 68, 68); // Red color for absent deduction
  }
  pdf.text(`-${formatCurrencyForPDF(absentDeduction)}`, leftValueX, leftY, { align: 'right' });
  pdf.setTextColor(120, 53, 15); // Reset to dark orange text

  // Right side: Salary Breakdown - Teal Theme
  const rightColumnX = pageWidth / 2 + 10;
  const rightColumnWidth = (pageWidth - 2 * margin - 20) / 2;
  
  // Background with rounded corners effect
  pdf.setFillColor(204, 251, 241); // Light teal background
  pdf.rect(rightColumnX, thirdRowY, rightColumnWidth, sectionHeight, 'F');
  pdf.setDrawColor(20, 184, 166); // Teal border
  pdf.setLineWidth(0.8);
  pdf.rect(rightColumnX, thirdRowY, rightColumnWidth, sectionHeight);
  
  // Header with accent line
  pdf.setFillColor(20, 184, 166); // Teal accent
  pdf.rect(rightColumnX, thirdRowY, rightColumnWidth, 6, 'F');
  
  pdf.setTextColor(255, 255, 255); // White text for header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('EARNINGS:', rightColumnX + 8, thirdRowY + 4);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 118, 110); // Dark teal text
  let rightY = thirdRowY + 10;
  
  // Right-aligned values like a proper payslip
  const labelX = rightColumnX + 8;
  const valueX = rightColumnX + rightColumnWidth - 8;
  
  // EARNINGS section with right-aligned values
  pdf.text(`Basic Salary:`, labelX, rightY);
  pdf.text(`${formatCurrencyForPDF(basicSalary)}`, valueX, rightY, { align: 'right' });
  rightY += 4;
  
  pdf.text(`Overtime Pay:`, labelX, rightY);
  pdf.text(`${formatCurrencyForPDF(overtimeAmount)}`, valueX, rightY, { align: 'right' });
  rightY += 4;
  
  pdf.text(`Bonus Amount:`, labelX, rightY);
  pdf.text(`${formatCurrencyForPDF(bonusAmount)}`, valueX, rightY, { align: 'right' });
  rightY += 4;
  
  // DEDUCTIONS sub-header with background
  pdf.setFillColor(20, 184, 166); // Teal background for sub-header
  pdf.rect(rightColumnX + 4, rightY - 2, rightColumnWidth - 8, 6, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255); // White text for sub-header
  pdf.text('DEDUCTIONS:', rightColumnX + 8, rightY + 2);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 118, 110); // Dark teal text
  rightY += 8; // Increased spacing from header to content
  
  // DEDUCTIONS section with right-aligned values
  pdf.text(`Absent Days Deduction:`, labelX, rightY);
  if (absentDays > 0) {
    pdf.setTextColor(239, 68, 68); // Red color for absent deduction
  }
  pdf.text(`-${formatCurrencyForPDF(absentDeduction)}`, valueX, rightY, { align: 'right' });
  pdf.setTextColor(15, 118, 110); // Reset to dark teal text
  rightY += 4; // Reduced spacing
  
  pdf.text(`Advance Deduction:`, labelX, rightY);
  if (advanceDeduction > 0) {
    pdf.setTextColor(239, 68, 68); // Red color for advance deduction
  }
  pdf.text(`-${formatCurrencyForPDF(advanceDeduction)}`, valueX, rightY, { align: 'right' });
  pdf.setTextColor(15, 118, 110); // Reset to dark teal text
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(15, 118, 110); // Dark teal text
  
  // Net Salary with right-aligned value
  pdf.text('Net Salary:', labelX, rightY + 4);
  pdf.text(`${formatCurrencyForPDF(netSalary)}`, valueX, rightY + 4, { align: 'right' });

  // ===== FOURTH ROW - SIGNATURES SECTION =====
  const signatureY = thirdRowY + sectionHeight + 15; // Positioned right after third row
  
  // Check if signatures will fit on the page
  if (signatureY + 20 > pageHeight - margin) {
    // If signatures won't fit, reduce spacing
    const adjustedSignatureY = pageHeight - margin - 20;
    const signatureWidth = (pageWidth - 2 * margin) / 3;
    
    // Chief Accountant
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Chief Accountant', margin + signatureWidth / 2, adjustedSignatureY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Samir Taima', margin + signatureWidth / 2, adjustedSignatureY + 4, { align: 'center' });
    pdf.line(margin + 10, adjustedSignatureY + 6, margin + signatureWidth - 10, adjustedSignatureY + 6);
    pdf.setFontSize(6);
    pdf.text('Signature', margin + signatureWidth / 2, adjustedSignatureY + 9, { align: 'center' });

    // Verified By
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('Verified By', margin + signatureWidth + signatureWidth / 2, adjustedSignatureY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Salem Samhan Al-Dosri', margin + signatureWidth + signatureWidth / 2, adjustedSignatureY + 4, { align: 'center' });
    pdf.line(margin + signatureWidth + 10, adjustedSignatureY + 6, margin + 2 * signatureWidth - 10, adjustedSignatureY + 6);
    pdf.setFontSize(6);
    pdf.text('Signature', margin + signatureWidth + signatureWidth / 2, adjustedSignatureY + 9, { align: 'center' });

    // Employee
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('Employee', margin + 2 * signatureWidth + signatureWidth / 2, adjustedSignatureY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text(employeeName || 'Unknown Employee', margin + 2 * signatureWidth + signatureWidth / 2, adjustedSignatureY + 4, { align: 'center' });
    pdf.line(margin + 2 * signatureWidth + 10, adjustedSignatureY + 6, margin + 3 * signatureWidth - 10, adjustedSignatureY + 6);
    pdf.setFontSize(6);
    pdf.text('Signature', margin + 2 * signatureWidth + signatureWidth / 2, adjustedSignatureY + 9, { align: 'center' });
  } else {
    // Normal signature positioning
    const signatureWidth = (pageWidth - 2 * margin) / 3;
    
    // Chief Accountant
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Chief Accountant', margin + signatureWidth / 2, signatureY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Samir Taima', margin + signatureWidth / 2, signatureY + 4, { align: 'center' });
    pdf.line(margin + 10, signatureY + 6, margin + signatureWidth - 10, signatureY + 6);
    pdf.setFontSize(6);
    pdf.text('Signature', margin + signatureWidth / 2, signatureY + 9, { align: 'center' });

    // Verified By
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('Verified By', margin + signatureWidth + signatureWidth / 2, signatureY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Salem Samhan Al-Dosri', margin + signatureWidth + signatureWidth / 2, signatureY + 4, { align: 'center' });
    pdf.line(margin + signatureWidth + 10, signatureY + 6, margin + 2 * signatureWidth - 10, signatureY + 6);
    pdf.setFontSize(6);
    pdf.text('Signature', margin + signatureWidth + signatureWidth / 2, signatureY + 9, { align: 'center' });

    // Employee
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('Employee', margin + 2 * signatureWidth + signatureWidth / 2, signatureY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text(employeeName || 'Unknown Employee', margin + 2 * signatureWidth + signatureWidth / 2, signatureY + 4, { align: 'center' });
    pdf.line(margin + 2 * signatureWidth + 10, signatureY + 6, margin + 3 * signatureWidth - 10, signatureY + 6);
    pdf.setFontSize(6);
    pdf.text('Signature', margin + 2 * signatureWidth + signatureWidth / 2, signatureY + 9, { align: 'center' });
  }
  
  // Save PDF
  const fileName = `payslip_${employee?.file_number || employee?.id}_${monthName}_${payroll.year}.pdf`;
  pdf.save(fileName);
}
