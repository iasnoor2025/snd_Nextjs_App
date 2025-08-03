"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Printer, Loader2, AlertCircle, User, Building, DollarSign, Clock, MapPin, Calendar } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import Link from "next/link";
import { useI18n } from "@/hooks/use-i18n";
import { useRBAC } from "@/lib/rbac/rbac-context";
import { usePrint } from "@/hooks/use-print";

interface DayData {
  date: string;
  day_of_week: string;
  day_name: string;
  regular_hours: number;
  overtime_hours: number;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_id?: string;
  designation?: string;
  hourly_rate?: number;
  basic_salary?: number;
  food_allowance?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  advance_payment?: number;
}

interface SalaryDetails {
  basic_salary: number;
  total_allowances: number;
  absent_deduction: number;
  overtime_pay: number;
  advance_payment: number;
  net_salary: number;
}

interface PayslipData {
  employee: Employee;
  month: string;
  year: string;
  start_date: string;
  end_date: string;
  total_regular_hours: number;
  total_overtime_hours: number;
  total_hours: number;
  days_worked: number;
  calendar: Record<string, DayData>;
  salary_details?: SalaryDetails;
  absent_days: number;
  location?: string;
  month_name?: string;
  assignment_type?: string;
  assignment_name?: string;
  assignment_location?: string;
}

// Add print styles
const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 10mm;
    }

    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background-color: white !important;
    }

    .sidebar-wrapper,
    .app-sidebar,
    .sidebar,
    [class*='sidebar'] {
      display: none !important;
    }

    .print\\:hidden {
      display: none !important;
    }

    .print\\:p-0 {
      padding: 0 !important;
    }

    .print\\:shadow-none {
      box-shadow: none !important;
    }

    .card-container {
      border: 1px solid #ccc !important;
      margin: 0 !important;
      padding: 20px !important;
    }

    .header-container {
      border-bottom: 2px solid #333 !important;
      margin-bottom: 20px !important;
    }

    .company-name {
      font-size: 24px !important;
      font-weight: bold !important;
      color: #333 !important;
    }

    .company-subtitle {
      font-size: 14px !important;
      color: #666 !important;
    }

    .pay-slip-title {
      font-size: 20px !important;
      font-weight: bold !important;
      color: #333 !important;
    }
  }
`;

export default function EmployeePayslipPage() {
  const { t } = useI18n();
  const { hasPermission } = useRBAC();
  const params = useParams();
  const searchParams = useSearchParams();
  const employeeId = params.id as string;
  const selectedMonth = searchParams.get('month') || format(new Date(), 'yyyy-MM');

  const [payslipData, setPayslipData] = useState<PayslipData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonthState, setSelectedMonthState] = useState(selectedMonth);
  const { printRef: payslipRef, handlePrint } = usePrint({
    documentTitle: `Employee-Payslip-${employeeId}`,
    waitForImages: true,
    onPrintError: (error) => {
      console.error('Print error details:', error);
      // Continue with print even if there are image errors
    }
  });
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);

  // Generate sample payslip data matching Laravel structure
  const generateSamplePayslipData = (month: string): PayslipData => {
    const [year, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    
    // Generate calendar data
    const calendar: Record<string, DayData> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayName = format(date, 'EEE');
      const isFriday = date.getDay() === 5;
      
      const regularHours = isFriday ? 0 : (Math.random() > 0.2 ? Math.floor(Math.random() * 4) + 6 : 0);
      const overtimeHours = regularHours > 0 && Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;
      
      calendar[dateStr] = {
        date: dateStr,
        day_of_week: dayName,
        day_name: dayName,
        regular_hours: regularHours,
        overtime_hours: overtimeHours
      };
    }

    const totalRegularHours = Object.values(calendar).reduce((sum, day) => sum + day.regular_hours, 0);
    const totalOvertimeHours = Object.values(calendar).reduce((sum, day) => sum + day.overtime_hours, 0);
    const totalHours = totalRegularHours + totalOvertimeHours;
    const daysWorked = Object.values(calendar).filter(day => day.regular_hours > 0 || day.overtime_hours > 0).length;
    const absentDays = Object.values(calendar).filter(day => day.regular_hours === 0 && day.overtime_hours === 0 && format(new Date(day.date), 'E') !== 'Fri').length;

    const basicSalary = 5000;
    const foodAllowance = 500;
    const housingAllowance = 1000;
    const transportAllowance = 300;
    const totalAllowances = foodAllowance + housingAllowance + transportAllowance;
    const hourlyRate = 25;
    const overtimeRate = hourlyRate * 1.5;
    const overtimePay = totalOvertimeHours * overtimeRate;
    const absentDeduction = absentDays * (basicSalary / 30); // Daily deduction
    const advancePayment = Math.floor(Math.random() * 1000) + 500;
    const netSalary = basicSalary + totalAllowances + overtimePay - absentDeduction - advancePayment;

    return {
      employee: {
        id: parseInt(employeeId),
        first_name: "John",
        last_name: "Doe",
        employee_id: `EMP${employeeId.padStart(4, '0')}`,
        designation: "Software Engineer",
        basic_salary: basicSalary,
        hourly_rate: hourlyRate,
        food_allowance: foodAllowance,
        housing_allowance: housingAllowance,
        transport_allowance: transportAllowance,
        advance_payment: advancePayment
      },
      month: monthNum.toString(),
      year: year.toString(),
      start_date: format(new Date(year, monthNum - 1, 1), 'yyyy-MM-dd'),
      end_date: format(new Date(year, monthNum, 0), 'yyyy-MM-dd'),
      total_regular_hours: totalRegularHours,
      total_overtime_hours: totalOvertimeHours,
      total_hours: totalHours,
      days_worked: daysWorked,
      calendar,
      absent_days: absentDays,
      month_name: format(new Date(year, monthNum - 1), 'MMMM yyyy'),
      assignment_type: "Project",
      assignment_name: "Main Project",
      assignment_location: "Riyadh"
    };
  };

  const fetchPayslipData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = generateSamplePayslipData(selectedMonthState);
      setPayslipData(data);
    } catch (error) {
      console.error('Error fetching payslip data:', error);
      toast.error('Failed to load payslip data');
    } finally {
      setIsLoading(false);
    }
  };



  const handleDownload = async () => {
    setIsLoadingPDF(true);
    try {
      const params = new URLSearchParams({
        employee_id: payslipData?.employee.id.toString() || '',
        month: payslipData?.month || '',
        year: payslipData?.year || '',
      });

      const response = await fetch(`/api/employee/payslip/pdf?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${payslipData?.employee.id}_${payslipData?.month}_${payslipData?.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Payslip downloaded successfully');
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast.error('Failed to download payslip');
    } finally {
      setIsLoadingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!payslipRef.current) return;

    try {
      const input = payslipRef.current;
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      pdf.save('Payslip-' + (new Date()).toISOString().slice(0, 10) + '.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  useEffect(() => {
    fetchPayslipData();
  }, [selectedMonthState]);

  const handleMonthChange = (value: string) => {
    setSelectedMonthState(value);
  };

  // Generate month options (last 24 months)
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });

  // Check if we have all the required data
  if (!payslipData) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Payslip</CardTitle>
            <CardDescription>There was an error loading the payslip data. Please try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={`/modules/employee-management/${employeeId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Employee
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { employee, month, year, start_date, end_date, total_regular_hours, total_overtime_hours, total_hours, days_worked, calendar, absent_days, month_name, assignment_type, assignment_name, assignment_location } = payslipData;

  // Calculate values
  const basicSalary = employee.basic_salary || 0;
  const foodAllowance = employee.food_allowance || 0;
  const housingAllowance = employee.housing_allowance || 0;
  const transportAllowance = employee.transport_allowance || 0;
  const totalAllowances = foodAllowance + housingAllowance + transportAllowance;
  const advancePayment = employee.advance_payment || 0;
  const absentDeduction = absent_days * (basicSalary / 30);
  const overtimePay = total_overtime_hours * ((employee.hourly_rate || 0) * 1.5);
  const netSalary = basicSalary + totalAllowances + overtimePay - absentDeduction - advancePayment;
  const absentHours = absent_days * 8;
  const contractDaysPerMonth = 26; // Assuming 26 working days per month

  const formattedStartDate = format(new Date(start_date), 'MMM dd, yyyy');
  const formattedEndDate = format(new Date(end_date), 'MMM dd, yyyy');
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between print:hidden">
          <h1 className="text-2xl font-bold tracking-tight">Employee Payslip</h1>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/modules/employee-management/${employeeId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="default" onClick={handleDownload} disabled={isLoadingPDF}>
              <Download className="mr-2 h-4 w-4" />
              {isLoadingPDF ? 'Generating...' : 'Download PDF (Backend)'}
            </Button>
            <Button variant="default" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF (UI)
            </Button>
          </div>
        </div>
        <div ref={payslipRef}>
          <Card className="card-container print:shadow-none">
            <CardHeader className="header-container border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-100">
                    <img 
                  src="/snd-logo.png" 
                  alt="SND Logo" 
                  className="h-14 w-14 object-contain bg-white border border-gray-200 rounded"
                  onError={(e) => {
                    console.warn('Logo failed to load, hiding image');
                    e.currentTarget.style.display = 'none';
                    // Add fallback text
                    const fallback = document.createElement('div');
                    fallback.className = 'h-14 w-14 flex items-center justify-center text-xs font-bold text-gray-600 bg-gray-100 rounded';
                    fallback.textContent = 'SND';
                    e.currentTarget.parentNode?.appendChild(fallback);
                  }}
                />
                  </div>
                  <div>
                    <CardTitle className="company-name text-xl">Samhan Naser Al-Dosri Est.</CardTitle>
                    <CardDescription className="company-subtitle">For Gen. Contracting & Rent. Equipments</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="pay-slip-title text-lg font-semibold">Employee Payslip</h2>
                  <p className="text-sm text-muted-foreground">
                    {month} {year}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* Employee & Pay Summary Section - 5 Equal Columns */}
              <Card className="mb-6 border-none bg-white/90 shadow-none">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                    {/* Employee Details */}
                    <div className="flex flex-col gap-2 border-r border-gray-200 pr-0 md:pr-4">
                      <div className="mb-1 flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <span className="text-base font-semibold text-gray-800">Employee Details</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">File #:</span>
                          <span className="font-semibold text-gray-800">{employee.employee_id || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Name:</span>
                          <span className="font-semibold text-gray-800">
                            {employee.first_name} {employee.last_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Designation:</span>
                          <span className="font-semibold text-gray-800">{employee.designation || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">ID:</span>
                          <span className="font-semibold text-gray-800">{employee.id}</span>
                        </div>
                      </div>
                    </div>
                    {/* Work Details */}
                    <div className="flex flex-col gap-2 border-r border-gray-200 pr-0 md:pr-4">
                      <div className="mb-1 flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        <span className="text-base font-semibold text-gray-800">Work Details</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Type:</span>
                          <span className="font-semibold text-gray-800">
                            {assignment_type ? assignment_type.charAt(0).toUpperCase() + assignment_type.slice(1) : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Name:</span>
                          <span className="font-semibold text-gray-800">
                            {assignment_name ? assignment_name.charAt(0).toUpperCase() + assignment_name.slice(1) : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Location:</span>
                          <span className="font-semibold text-gray-800">
                            {assignment_location ? assignment_location.charAt(0).toUpperCase() + assignment_location.slice(1) : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Date Range:</span>
                          <span className="font-semibold text-gray-800">
                            {formattedStartDate} - {formattedEndDate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Month:</span>
                          <span className="font-semibold text-gray-800">{month_name}</span>
                        </div>
                      </div>
                    </div>
                    {/* Salary Details */}
                    <div className="flex flex-col gap-2 border-r border-gray-200 pr-0 md:pr-4">
                      <div className="mb-1 flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-base font-semibold text-gray-700">Salary Details</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Basic:</span>
                        <span className="font-bold text-green-700">SAR {basicSalary.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Food:</span>
                        <span>{foodAllowance > 0 ? `SAR ${foodAllowance.toFixed(2)}` : '-'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Housing:</span>
                        <span>{housingAllowance > 0 ? `SAR ${housingAllowance.toFixed(2)}` : '-'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Transport:</span>
                        <span>{transportAllowance > 0 ? `SAR ${transportAllowance.toFixed(2)}` : '-'}</span>
                      </div>
                    </div>
                    {/* Working Hours */}
                    <div className="flex flex-col gap-2 border-r border-gray-200 pr-0 md:pr-4">
                      <div className="mb-1 flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-base font-semibold text-gray-700">Working Hours</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Contract:</span>
                        <span>{contractDaysPerMonth * 8}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Total:</span>
                        <span>{total_hours}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Regular:</span>
                        <span>{total_regular_hours}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">OT:</span>
                        <span>{total_overtime_hours}</span>
                      </div>
                    </div>
                    {/* Other Details */}
                    <div className="flex flex-col gap-2">
                      <div className="mb-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        <span className="text-base font-semibold text-gray-700">Other Details</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Advance:</span>
                        <span className="text-right font-semibold text-orange-600">
                          {advancePayment > 0 ? `SAR ${advancePayment.toFixed(2)}` : '0'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Days Worked:</span>
                        <span className="text-right font-semibold text-gray-800">{days_worked}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Absent Days:</span>
                        <span className="text-right font-bold text-red-600">{absent_days}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Timesheet Calendar */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Attendance Record</h3>
                </div>

                <div className="overflow-x-auto rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day, idx, arr) => (
                          <th
                            key={day}
                            className={`border bg-black text-center align-middle text-xs font-bold text-white h-10 ${idx === 0 ? 'rounded-l-md' : ''} ${idx === arr.length - 1 ? 'rounded-r-md' : ''}`}
                          >
                            {day.toString().padStart(2, '0')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-gray-50">
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                          const dayDate = new Date(parseInt(year), parseInt(month) - 1, day);
                          const dayName = dayDate.toString() !== 'Invalid Date' ? format(dayDate, 'E') : '';
                          const isFriday = dayName === 'Fri';
                          let bgColor = isFriday ? 'bg-blue-100' : '';
                          return (
                            <td key={`day-${day}`} className={`text-center ${bgColor} border p-1 text-xs`}>
                              <div className="text-xs text-gray-600">{dayName.substring(0, 1)}</div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                          const dayDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                          const dayData = calendar[dayDate];
                          const checkDate = new Date(parseInt(year), parseInt(month) - 1, day);
                          const dayName = checkDate.toString() !== 'Invalid Date' ? format(checkDate, 'E') : '';
                          const isFriday = dayName === 'Fri';
                          let content = '';
                          let textColor = '';
                          let bgColor = isFriday ? 'bg-blue-100' : '';
                          if (dayData) {
                            if (Number(dayData.regular_hours) === 0 && Number(dayData.overtime_hours) === 0) {
                              if (isFriday) {
                                content = 'F';
                              } else {
                                content = 'A';
                                textColor = 'text-red-600';
                              }
                            } else {
                              if (isFriday) {
                                content = 'F';
                              } else {
                                content = `${Number(dayData.regular_hours)}`;
                                textColor = 'text-green-600';
                              }
                            }
                          } else {
                            if (checkDate.getMonth() !== parseInt(month) - 1) {
                              content = '-';
                            } else if (isFriday) {
                              content = 'F';
                            } else {
                              content = '-';
                            }
                          }
                          return (
                            <td
                              key={`data-${day}`}
                              className={`text-center ${bgColor} ${textColor} border p-1 text-xs`}
                            >
                              {content}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Overtime row */}
                      <tr>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                          const dayDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                          const dayData = calendar[dayDate];
                          const checkDate = new Date(parseInt(year), parseInt(month) - 1, day);
                          const dayName = checkDate.toString() !== 'Invalid Date' ? format(checkDate, 'E') : '';
                          const isFriday = dayName === 'Fri';
                          let content = '0';
                          let textColor = '';
                          let bgColor = isFriday ? 'bg-blue-100' : '';
                          if (dayData && Number(dayData.overtime_hours) > 0) {
                            content = `${dayData.overtime_hours}`;
                            textColor = 'text-blue-600';
                          }
                          return (
                            <td key={`ot-${day}`} className={`text-center ${bgColor} ${textColor} border p-1 text-xs`}>
                              {content}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  <span className="font-semibold text-green-600">8</span> = regular hours,&nbsp;
                  <span className="font-semibold text-blue-600">More than 8</span> = overtime hours,&nbsp;
                  <span className="font-semibold text-red-600">A</span> = absent,&nbsp;
                  <span className="font-semibold">F</span> = Friday (weekend)
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold">Attendance Summary</h3>
                  <div className="grid grid-cols-2 gap-y-2 rounded-md border bg-gray-50 p-4 text-sm">
                    <div className="font-medium">Total Hours:</div>
                    <div className="text-right">{total_hours}</div>

                    <div className="font-medium">Absent Hours:</div>
                    <div className="text-right text-red-600">{absentHours}</div>

                    <div className="font-medium">Absent Days:</div>
                    <div className="text-right text-red-600">{absent_days}</div>

                    <div className="font-medium">Overtime Hours:</div>
                    <div className="text-right text-green-600">{total_overtime_hours}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Payment Summary</h3>
                  <div className="grid grid-cols-2 gap-y-2 rounded-md border bg-gray-50 p-4 text-sm">
                    <div className="font-medium">Basic Salary:</div>
                    <div className="text-right font-semibold">SAR {basicSalary.toFixed(2)}</div>

                    <div className="font-medium">Allowances:</div>
                    <div className="text-right">SAR {totalAllowances.toFixed(2)}</div>

                    <div className="font-medium">Absent Deduction:</div>
                    <div className="text-right text-red-600">SAR {absentDeduction.toFixed(2)}</div>

                    <div className="font-medium">Overtime Pay:</div>
                    <div className="text-right text-green-600">SAR {overtimePay.toFixed(2)}</div>

                    <div className="font-medium">Advance:</div>
                    <div className="text-right text-red-600">SAR {advancePayment.toFixed(2)}</div>

                    <Separator className="col-span-2 my-1" />

                    <div className="font-medium">Total Deductions:</div>
                    <div className="text-right text-red-600">SAR {(absentDeduction + advancePayment).toFixed(2)}</div>

                    <div className="font-medium">Net Salary:</div>
                    <div className="text-right font-bold text-green-600">SAR {netSalary.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end border-t pt-6">
              <div className="grid grid-cols-3 gap-x-12 text-sm">
                <div className="text-center">
                  <p className="mb-1 font-semibold">Chief-Accountant</p>
                  <p className="text-muted-foreground italic">Samir Taima</p>
                  <div className="mt-8 border-t border-gray-300 pt-1">Signature</div>
                </div>
                <div className="text-center">
                  <p className="mb-1 font-semibold">Verified By</p>
                  <p className="text-muted-foreground italic">Salem Samhan Al-Dosri</p>
                  <div className="mt-8 border-t border-gray-300 pt-1">Signature</div>
                </div>
                <div className="text-center">
                  <p className="mb-1 font-semibold">Approved By</p>
                  <p className="text-muted-foreground italic">Nasser Samhan Al-Dosri</p>
                  <div className="mt-8 border-t border-gray-300 pt-1">Signature</div>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
} 