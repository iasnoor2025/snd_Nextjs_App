"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Printer, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useI18n } from "@/hooks/use-i18n";
import { useRBAC } from "@/lib/rbac/rbac-context";

interface PayslipData {
  employee: {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string;
    designation?: string;
    department?: string;
    basic_salary: number;
    hourly_rate: number;
  };
  payslip: {
    id: number;
    month: number;
    year: number;
    total_hours: number;
    regular_hours: number;
    overtime_hours: number;
    basic_salary: number;
    overtime_pay: number;
    total_pay: number;
    deductions: number;
    net_pay: number;
    status: string;
  };
  attendanceData: {
    date: string;
    regular_hours: number;
    overtime_hours: number;
    status: string;
  }[];
  company: {
    name: string;
    address: string;
    logo?: string;
  };
}

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
  const payslipRef = useRef<HTMLDivElement>(null);

  // Generate sample payslip data
  const generateSamplePayslipData = (month: string): PayslipData => {
    const [year, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    
    const attendanceData = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, monthNum - 1, i + 1);
      const isFriday = date.getDay() === 5;
      const regularHours = isFriday ? 0 : (Math.random() > 0.2 ? Math.floor(Math.random() * 4) + 6 : 0);
      const overtimeHours = regularHours > 0 && Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;
      
      return {
        date: date.toISOString().slice(0, 10),
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        status: isFriday ? 'friday' : (regularHours > 0 ? 'present' : 'absent')
      };
    });

    const totalRegularHours = attendanceData.reduce((sum, day) => sum + day.regular_hours, 0);
    const totalOvertimeHours = attendanceData.reduce((sum, day) => sum + day.overtime_hours, 0);
    const basicSalary = 5000; // Sample basic salary
    const hourlyRate = 25; // Sample hourly rate
    const overtimeRate = hourlyRate * 1.5;
    
    const overtimePay = totalOvertimeHours * overtimeRate;
    const totalPay = basicSalary + overtimePay;
    const deductions = Math.floor(Math.random() * 500) + 100; // Random deductions
    const netPay = totalPay - deductions;

    return {
      employee: {
        id: parseInt(employeeId),
        employee_id: `EMP${employeeId.padStart(4, '0')}`,
        first_name: "John",
        last_name: "Doe",
        designation: "Software Engineer",
        department: "IT",
        basic_salary: basicSalary,
        hourly_rate: hourlyRate
      },
      payslip: {
        id: Math.floor(Math.random() * 1000) + 1,
        month: monthNum,
        year: year,
        total_hours: totalRegularHours + totalOvertimeHours,
        regular_hours: totalRegularHours,
        overtime_hours: totalOvertimeHours,
        basic_salary: basicSalary,
        overtime_pay: overtimePay,
        total_pay: totalPay,
        deductions: deductions,
        net_pay: netPay,
        status: 'paid'
      },
      attendanceData,
      company: {
        name: "Sample Company Ltd",
        address: "123 Business Street, City, Country",
        logo: "/logo.png"
      }
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

  const handleDownloadPDF = async () => {
    if (!payslipData) return;

    try {
      const params = new URLSearchParams({
        employee_id: payslipData.employee.id.toString(),
        month: payslipData.payslip.month.toString(),
        year: payslipData.payslip.year.toString(),
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
      a.download = `payslip_${payslipData.employee.id}_${payslipData.payslip.month}_${payslipData.payslip.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Payslip downloaded successfully');
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast.error('Failed to download payslip');
    }
  };

  const handlePrint = () => {
    if (!payslipRef.current) return;

    const input = payslipRef.current;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payslip</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .payslip { border: 1px solid #ccc; padding: 20px; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .employee-info { margin-bottom: 20px; }
              .salary-details { margin-bottom: 20px; }
              .attendance-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .attendance-table th, .attendance-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              .total { font-weight: bold; margin-top: 20px; }
            </style>
          </head>
          <body>
            ${input.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading payslip...</span>
        </div>
      </div>
    );
  }

  if (!payslipData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Payslip not found</h2>
          <p className="mt-2 text-muted-foreground">The payslip you're looking for doesn't exist.</p>
          <Button className="mt-4" asChild>
            <Link href={`/modules/employee-management/${employeeId}`}>Back to Employee</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { employee, payslip, attendanceData, company } = payslipData;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/modules/employee-management/${employeeId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employee
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Employee Payslip</h1>
            <p className="text-muted-foreground">
              {employee.first_name} {employee.last_name} - {format(new Date(payslip.year, payslip.month - 1), 'MMMM yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonthState} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Payslip Content */}
      <div ref={payslipRef}>
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">{company.name}</h2>
              <p className="text-muted-foreground">{company.address}</p>
            </div>
            <div className="flex justify-between items-start">
              <div className="text-left">
                <h3 className="font-semibold">Employee Information</h3>
                <p><strong>Name:</strong> {employee.first_name} {employee.last_name}</p>
                <p><strong>ID:</strong> {employee.employee_id}</p>
                <p><strong>Designation:</strong> {employee.designation}</p>
                <p><strong>Department:</strong> {employee.department}</p>
              </div>
              <div className="text-right">
                <h3 className="font-semibold">Payslip Details</h3>
                <p><strong>Month:</strong> {format(new Date(payslip.year, payslip.month - 1), 'MMMM yyyy')}</p>
                <p><strong>Payslip ID:</strong> #{payslip.id}</p>
                <Badge variant={payslip.status === 'paid' ? 'default' : 'secondary'}>
                  {payslip.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Salary Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Earnings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span>SAR {payslip.basic_salary.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Pay ({payslip.overtime_hours}h):</span>
                    <span>SAR {payslip.overtime_pay.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Earnings:</span>
                      <span>SAR {payslip.total_pay.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Deductions & Net Pay</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Deductions:</span>
                    <span>SAR {payslip.deductions.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Net Pay:</span>
                      <span>SAR {payslip.net_pay.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{payslip.regular_hours.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Regular Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{payslip.overtime_hours.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Overtime Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{payslip.total_hours.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Total Hours</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Attendance */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-center">Regular Hours</th>
                        <th className="p-2 text-center">Overtime Hours</th>
                        <th className="p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((day, index) => {
                        const date = new Date(day.date);
                        const isFriday = date.getDay() === 5;
                        return (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              {format(date, 'MMM dd, yyyy')}
                              {isFriday && <Badge variant="outline" className="ml-2 text-xs">Fri</Badge>}
                            </td>
                            <td className="p-2 text-center">{day.regular_hours > 0 ? `${day.regular_hours}h` : '-'}</td>
                            <td className="p-2 text-center">{day.overtime_hours > 0 ? `${day.overtime_hours}h` : '-'}</td>
                            <td className="p-2 text-center">
                              <Badge 
                                variant={
                                  isFriday ? 'secondary' : 
                                  day.status === 'present' ? 'default' : 
                                  'destructive'
                                }
                                className="text-xs"
                              >
                                {isFriday ? 'F' : day.status === 'present' ? 'P' : 'A'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 