"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, FileText, User, Building, DollarSign, Clock, MapPin, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useRef } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

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

    .card-container {
      box-shadow: none !important;
      border: 1px solid #e5e7eb !important;
    }

    .header-container {
      border-bottom: 2px solid #e5e7eb !important;
    }

    .company-name {
      font-size: 1.25rem !important;
      font-weight: 600 !important;
    }

    .company-subtitle {
      font-size: 0.875rem !important;
      color: #6b7280 !important;
    }

    .pay-slip-title {
      font-size: 1.125rem !important;
      font-weight: 600 !important;
    }
  }
`;

interface PayrollItem {
  id: number;
  payroll_id: number;
  type: string;
  description: string;
  amount: number;
  is_taxable: boolean;
  tax_rate: number;
  order: number;
}

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
  notes: string;
  approved_by: number | null;
  approved_at: string | null;
  paid_by: number | null;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_status: string | null;
  payment_processed_at: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
  items: PayrollItem[];
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

export default function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [payslipData, setPayslipData] = useState<PayslipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const payslipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPayslipData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/payroll/${id}/payslip`);
        if (!response.ok) {
          throw new Error('Failed to fetch payslip data');
        }
        const data = await response.json();
        if (data.success) {
          setPayslipData(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch payslip data');
        }
      } catch (error) {
        console.error('Error fetching payslip data:', error);
        toast.error('Failed to load payslip data');
      } finally {
        setLoading(false);
      }
    };

    fetchPayslipData();
  }, [id]);

  // Inject print styles
  useEffect(() => {
    // Create style element
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    style.id = 'pay-slip-print-styles';

    // Append to head
    document.head.appendChild(style);

    // Cleanup on unmount
    return () => {
      const styleElement = document.getElementById('pay-slip-print-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        employee_id: payslipData?.employee.id.toString() || '',
        month: payslipData?.payroll.month.toString() || '',
        year: payslipData?.payroll.year.toString() || '',
      });
      const response = await fetch(`/api/payroll/payslip/pdf?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/pdf',
        },
      });
      if (!response.ok) {
        const text = await response.text();
        toast.error('Failed to download PDF', { description: text });
        throw new Error('Failed to download PDF');
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        const text = await response.text();
        toast.warning('PDF downloaded, but response was not a PDF.', { description: text });
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${payslipData?.employee.id}_${payslipData?.payroll.month}_${payslipData?.payroll.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to download PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const input = payslipRef.current;
    if (!input) return;
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
  };

  if (loading) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payslip...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!payslipData) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Pay Slip</CardTitle>
            <CardDescription>There was an error loading the pay slip data. Please try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { payroll, employee, attendanceData, company } = payslipData;

  // Calculate pay details
  const basicSalary = payroll.base_salary || 0;
  const overtimeAmount = payroll.overtime_amount || 0;
  const bonusAmount = payroll.bonus_amount || 0;
  const deductionAmount = payroll.deduction_amount || 0;
  const advanceDeduction = payroll.advance_deduction || 0;
  const finalAmount = payroll.final_amount || 0;
  const totalWorkedHours = payroll.total_worked_hours || 0;
  const overtimeHours = payroll.overtime_hours || 0;

  // Calculate summary
  const totalRegularHours = totalWorkedHours - overtimeHours;
  const daysWorked = Math.ceil(totalWorkedHours / 8);
  const contractDaysPerMonth = 30;
  const absentDays = Math.max(0, contractDaysPerMonth - daysWorked);

  // Format dates
  const monthName = new Date(payroll.year, payroll.month - 1).toLocaleDateString("en-US", { month: "long" });
  const startDate = new Date(payroll.year, payroll.month - 1, 1);
  const endDate = new Date(payroll.year, payroll.month, 0);
  const formattedStartDate = startDate.toLocaleDateString();
  const formattedEndDate = endDate.toLocaleDateString();

  // Calculate number of days in the month
  const daysInMonth = new Date(payroll.year, payroll.month, 0).getDate();

  // Create calendar data for the month
  const calendarDays = attendanceData || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  return (
    <div className="flex h-full flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold tracking-tight">Pay Slip</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="default" onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            {isLoading ? 'Generating...' : 'Download PDF (Backend)'}
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
                  <img src="/snd%20logo.png" alt="SND Logo" className="h-14 w-14 object-contain bg-white border border-gray-200 rounded" />
                </div>
                <div>
                  <CardTitle className="company-name text-xl">{company.name}</CardTitle>
                  <CardDescription className="company-subtitle">{company.address}</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <h2 className="pay-slip-title text-lg font-semibold">Employee Pay Slip</h2>
                <p className="text-sm text-muted-foreground">
                  {monthName} {payroll.year}
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
                        <span className="font-semibold text-gray-800">{employee.file_number || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Name:</span>
                        <span className="font-semibold text-gray-800">
                          {employee.full_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Designation:</span>
                        <span className="font-semibold text-gray-800">{employee.designation || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Department:</span>
                        <span className="font-semibold text-gray-800">{employee.department || '-'}</span>
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
                        <span className="font-medium text-gray-500">Payroll ID:</span>
                        <span className="font-semibold text-gray-800">{payroll.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Status:</span>
                        <span className="font-semibold text-gray-800">{payroll.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Month:</span>
                        <span className="font-semibold text-gray-800">{monthName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Year:</span>
                        <span className="font-semibold text-gray-800">{payroll.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Date Range:</span>
                        <span className="font-semibold text-gray-800">
                          {formattedStartDate} - {formattedEndDate}
                        </span>
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
                      <span className="font-bold text-green-700">{formatCurrency(basicSalary)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Overtime:</span>
                      <span>{overtimeAmount > 0 ? formatCurrency(overtimeAmount) : '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Bonus:</span>
                      <span>{bonusAmount > 0 ? formatCurrency(bonusAmount) : '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Deductions:</span>
                      <span className="text-red-600">{formatCurrency(deductionAmount)}</span>
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
                      <span>{totalWorkedHours}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Regular:</span>
                      <span>{totalRegularHours}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">OT:</span>
                      <span>{overtimeHours}</span>
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
                        {advanceDeduction > 0 ? formatCurrency(advanceDeduction) : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Days Worked:</span>
                      <span className="text-right font-semibold text-gray-800">{daysWorked}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Absent Days:</span>
                      <span className="text-right font-bold text-red-600">{absentDays}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Payroll Items Table */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Payroll Breakdown</h3>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Tax Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payroll.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant={item.type === 'earnings' ? 'default' : 'secondary'}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        <TableCell className="text-right">{item.tax_rate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Attendance Calendar */}
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
                        const dayDate = new Date(payroll.year, payroll.month - 1, day);
                        const dayName = dayDate.toString() !== 'Invalid Date' ? dayDate.toLocaleDateString('en-US', { weekday: 'short' }) : '';
                        const isFriday = dayName === 'Fri';
                        const bgColor = isFriday ? 'bg-blue-100' : '';
                        return (
                          <td key={`day-${day}`} className={`text-center ${bgColor} border p-1 text-xs`}>
                            <div className="text-xs text-gray-600">{dayName.substring(0, 1)}</div>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const dayDate = `${payroll.year}-${payroll.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                        const dayData = calendarDays.find(d => d.date === dayDate);
                        const checkDate = new Date(payroll.year, payroll.month - 1, day);
                        const dayName = checkDate.toString() !== 'Invalid Date' ? checkDate.toLocaleDateString('en-US', { weekday: 'short' }) : '';
                        const isFriday = dayName === 'Fri';
                        let content = '';
                        let textColor = '';
                        const bgColor = isFriday ? 'bg-blue-100' : '';

                        if (dayData) {
                          const regularHours = dayData.hours || 0;
                          const overtimeHours = dayData.overtime || 0;

                          if (regularHours === 0 && overtimeHours === 0) {
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
                              content = `${regularHours}`;
                              textColor = 'text-green-600';
                            }
                          }
                        } else {
                          if (checkDate.getMonth() !== (payroll.month - 1)) {
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
                        const dayDate = `${payroll.year}-${payroll.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                        const dayData = calendarDays.find(d => d.date === dayDate);
                        const checkDate = new Date(payroll.year, payroll.month - 1, day);
                        const dayName = checkDate.toString() !== 'Invalid Date' ? checkDate.toLocaleDateString('en-US', { weekday: 'short' }) : '';
                        const isFriday = dayName === 'Fri';
                        let content = '0';
                        let textColor = '';
                        const bgColor = isFriday ? 'bg-blue-100' : '';

                        if (dayData) {
                          const overtimeHours = dayData.overtime || 0;
                          if (overtimeHours > 0) {
                            content = `${overtimeHours}`;
                            textColor = 'text-blue-600';
                          }
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
                  <div className="text-right">{totalWorkedHours}</div>

                  <div className="font-medium">Regular Hours:</div>
                  <div className="text-right">{totalRegularHours}</div>

                  <div className="font-medium">Overtime Hours:</div>
                  <div className="text-right text-green-600">{overtimeHours}</div>

                  <div className="font-medium">Days Worked:</div>
                  <div className="text-right">{daysWorked}</div>

                  <div className="font-medium">Absent Days:</div>
                  <div className="text-right text-red-600">{absentDays}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Payment Summary</h3>
                <div className="grid grid-cols-2 gap-y-2 rounded-md border bg-gray-50 p-4 text-sm">
                  <div className="font-medium">Basic Salary:</div>
                  <div className="text-right font-semibold">{formatCurrency(basicSalary)}</div>

                  <div className="font-medium">Overtime Pay:</div>
                  <div className="text-right text-green-600">{formatCurrency(overtimeAmount)}</div>

                  <div className="font-medium">Bonus:</div>
                  <div className="text-right text-green-600">{formatCurrency(bonusAmount)}</div>

                  <div className="font-medium">Deductions:</div>
                  <div className="text-right text-red-600">{formatCurrency(deductionAmount)}</div>

                  <div className="font-medium">Advance:</div>
                  <div className="text-right text-red-600">{formatCurrency(advanceDeduction)}</div>

                  <Separator className="col-span-2 my-1" />

                  <div className="font-medium">Total Deductions:</div>
                  <div className="text-right text-red-600">{formatCurrency(deductionAmount + advanceDeduction)}</div>

                  <div className="font-medium">Net Salary:</div>
                  <div className="text-right font-bold text-green-600">{formatCurrency(finalAmount)}</div>
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
                <p className="mb-1 font-semibold">Employee</p>
                <p className="text-muted-foreground italic">{employee.full_name}</p>
                <div className="mt-8 border-t border-gray-300 pt-1">Signature</div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
