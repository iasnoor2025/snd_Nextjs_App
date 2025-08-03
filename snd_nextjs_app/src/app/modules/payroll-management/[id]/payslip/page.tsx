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
import { usePrint } from "@/hooks/use-print";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Professional print styles
const printStyles = `
  @media print {
    @page {
      size: A4 landscape;
      margin: 15mm;
    }

    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background-color: white !important;
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
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

    .payslip-container {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      box-shadow: none !important;
      border: none !important;
    }

    .payslip-header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%) !important;
      color: white !important;
      padding: 2rem !important;
      border-radius: 0 !important;
      margin-bottom: 2rem !important;
    }

    .company-logo {
      width: 80px !important;
      height: 80px !important;
      border-radius: 12px !important;
      background: white !important;
      padding: 8px !important;
    }

    .company-name {
      font-size: 2rem !important;
      font-weight: 700 !important;
      margin-bottom: 0.5rem !important;
    }

    .company-subtitle {
      font-size: 1rem !important;
      opacity: 0.9 !important;
    }

    .payslip-title {
      font-size: 1.5rem !important;
      font-weight: 600 !important;
      text-align: right !important;
    }

    .employee-info-grid {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 2rem !important;
      margin-bottom: 2rem !important;
    }

    .info-card {
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      padding: 1.5rem !important;
    }

    .info-card-title {
      font-size: 0.875rem !important;
      font-weight: 600 !important;
      color: #64748b !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      margin-bottom: 1rem !important;
    }

    .info-row {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 0.5rem 0 !important;
      border-bottom: 1px solid #f1f5f9 !important;
    }

    .info-row:last-child {
      border-bottom: none !important;
    }

    .info-label {
      font-size: 0.875rem !important;
      color: #64748b !important;
      font-weight: 500 !important;
    }

    .info-value {
      font-size: 0.875rem !important;
      font-weight: 600 !important;
      color: #1e293b !important;
    }

    .info-value-green {
      color: #059669 !important;
    }

    .info-value-red {
      color: #dc2626 !important;
    }

    .attendance-section {
      margin-bottom: 2rem !important;
    }

    .section-title {
      font-size: 1.25rem !important;
      font-weight: 600 !important;
      color: #1e293b !important;
      margin-bottom: 1rem !important;
      padding-bottom: 0.5rem !important;
      border-bottom: 2px solid #e2e8f0 !important;
    }

    .attendance-table {
      width: 100% !important;
      border-collapse: collapse !important;
      border-radius: 12px !important;
      overflow: hidden !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
    }

    .attendance-table th {
      background: #1e293b !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 0.75rem 0.5rem !important;
      text-align: center !important;
      font-size: 0.75rem !important;
    }

    .attendance-table td {
      padding: 0.5rem !important;
      text-align: center !important;
      font-size: 0.75rem !important;
      border: 1px solid #e2e8f0 !important;
      background: white !important;
    }

    .attendance-table .friday {
      background: #dbeafe !important;
    }

    .attendance-table .absent {
      background: #fecaca !important;
      color: #dc2626 !important;
      font-weight: 600 !important;
    }

    .attendance-table .regular {
      color: #059669 !important;
      font-weight: 600 !important;
    }

    .attendance-table .overtime {
      color: #2563eb !important;
      font-weight: 600 !important;
    }

    .summary-section {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 2rem !important;
      margin-bottom: 2rem !important;
    }

    .summary-card {
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      padding: 1.5rem !important;
    }

    .summary-card-title {
      font-size: 1.125rem !important;
      font-weight: 600 !important;
      color: #1e293b !important;
      margin-bottom: 1rem !important;
    }

    .summary-row {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 0.75rem 0 !important;
      border-bottom: 1px solid #f1f5f9 !important;
    }

    .summary-row:last-child {
      border-bottom: none !important;
      font-weight: 700 !important;
      font-size: 1.125rem !important;
      padding-top: 1rem !important;
      border-top: 2px solid #e2e8f0 !important;
    }

    .summary-label {
      font-size: 0.875rem !important;
      color: #64748b !important;
      font-weight: 500 !important;
    }

    .summary-value {
      font-size: 0.875rem !important;
      font-weight: 600 !important;
      color: #1e293b !important;
    }

    .summary-value-green {
      color: #059669 !important;
    }

    .summary-value-red {
      color: #dc2626 !important;
    }

    .signatures-section {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 2rem !important;
      margin-top: 3rem !important;
      padding-top: 2rem !important;
      border-top: 2px solid #e2e8f0 !important;
    }

    .signature-card {
      text-align: center !important;
      padding: 1.5rem !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
    }

    .signature-title {
      font-size: 0.875rem !important;
      font-weight: 600 !important;
      color: #64748b !important;
      margin-bottom: 1rem !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
    }

    .signature-name {
      font-size: 1rem !important;
      font-weight: 600 !important;
      color: #1e293b !important;
      margin-bottom: 2rem !important;
    }

    .signature-line {
      border-top: 2px solid #cbd5e1 !important;
      padding-top: 0.5rem !important;
      font-size: 0.75rem !important;
      color: #64748b !important;
    }

    .legend {
      margin-top: 1rem !important;
      padding: 1rem !important;
      background: #f8fafc !important;
      border-radius: 8px !important;
      font-size: 0.75rem !important;
      color: #64748b !important;
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
  food_allowance?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  advance_payment?: number;
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
  const { printRef: payslipRef, handlePrint } = usePrint({
    documentTitle: `Payslip-${id}`,
  });

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
          console.log('Payslip data received:', data.data);
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
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    style.id = 'pay-slip-print-styles';

    document.head.appendChild(style);

    return () => {
      const styleElement = document.getElementById('pay-slip-print-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);



  const handleDownload = async () => {
    setIsLoading(true);
    try {
      // Use the payroll-specific endpoint with the payroll ID
      const response = await fetch(`/api/payroll/${id}/payslip`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const text = await response.text();
        toast.error('Failed to download PDF', { description: text });
        throw new Error('Failed to download PDF');
      }

      // Check if response is PDF
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        // Handle PDF response
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip_${payslipData?.employee.id}_${payslipData?.payroll.month}_${payslipData?.payroll.year}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Payslip downloaded successfully');
      } else {
        // Handle JSON response (fallback)
        const data = await response.json();
        if (data.success) {
          toast.info('Using UI PDF generation instead of backend PDF');
          handleDownloadPDF();
        } else {
          toast.error(data.message || 'Failed to download PDF');
        }
      }
    } catch (e) {
      console.error('Download error:', e);
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
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const imgWidth = 297;
    const pageHeight = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`payslip_${payslipData?.employee.id}_${payslipData?.payroll.month}_${payslipData?.payroll.year}.pdf`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading payslip data...</span>
        </div>
      </div>
    );
  }

  if (!payslipData) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Payslip not found</h2>
          <p className="text-gray-600">The requested payslip could not be found.</p>
        </div>
      </div>
    );
  }

  const { payroll, employee, attendanceData, company } = payslipData;

  // Add safety checks for employee data
  const employeeName = employee ? 
    (employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown Employee') : 
    'Unknown Employee';
    
  // Debug the data
  console.log('🔍 PAYSLIP DEBUG - Raw payslipData:', payslipData);
  console.log('🔍 PAYSLIP DEBUG - Destructured attendanceData:', attendanceData);
  console.log('🔍 PAYSLIP DEBUG - Payroll:', payroll);
  console.log('🔍 PAYSLIP DEBUG - Employee:', employee);

  // Calculate pay details - Convert Decimal to numbers
  const basicSalary = Number(payroll.base_salary) || 0;
  const overtimeAmount = Number(payroll.overtime_amount) || 0;
  const bonusAmount = Number(payroll.bonus_amount) || 0;
  const advanceDeduction = Number(payroll.advance_deduction) || 0;
  const finalAmount = Number(payroll.final_amount) || 0;
  const totalWorkedHours = Number(payroll.total_worked_hours) || 0;
  const overtimeHours = Number(payroll.overtime_hours) || 0;

  // Check if attendance data is available
  if (!attendanceData || !Array.isArray(attendanceData)) {
    console.error('🔍 PAYSLIP ERROR - No attendance data available:', attendanceData);
    return (
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">No Attendance Data</h2>
          <p className="text-gray-600">No attendance data available for this payroll period.</p>
          <p className="text-sm text-gray-500 mt-2">Payroll ID: {payroll.id}, Month: {payroll.month}/{payroll.year}</p>
        </div>
      </div>
    );
  }

  // Calculate absent days from actual attendance data
  const absentDays = attendanceData.reduce((count, day) => {
    // Consider absent if no hours worked and no overtime
    return count + ((Number(day.hours) === 0 && Number(day.overtime) === 0) ? 1 : 0);
  }, 0);

  // Calculate total worked hours from attendance data - Convert Decimal to numbers
  const totalWorkedHoursFromAttendance = attendanceData.reduce((total, day) => {
    return total + (Number(day.hours) || 0) + (Number(day.overtime) || 0);
  }, 0);

  // Calculate overtime hours from attendance data - Convert Decimal to numbers
  const overtimeHoursFromAttendance = attendanceData.reduce((total, day) => {
    return total + (Number(day.overtime) || 0);
  }, 0);

  // Calculate days worked from attendance data (excluding absences) - Convert Decimal to numbers
  const daysWorkedFromAttendance = attendanceData.reduce((count, day) => {
    return count + ((Number(day.hours) > 0 || Number(day.overtime) > 0) ? 1 : 0);
  }, 0);

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
  
  // Create a map of attendance data by date for easier lookup
  const attendanceMap = new Map();
  
  if (attendanceData && Array.isArray(attendanceData)) {
    attendanceData.forEach(day => {
      attendanceMap.set(day.date, day);
    });
  }
  

  


  // Calculate totals for salary details - Convert Decimal to numbers
  const totalAllowances = (Number(employee.food_allowance) || 0) + (Number(employee.housing_allowance) || 0) + (Number(employee.transport_allowance) || 0);
  const absentDeduction = absentDays > 0 ? (basicSalary / daysInMonth) * absentDays : 0;
  const netSalary = basicSalary + totalAllowances + overtimeAmount - absentDeduction - advanceDeduction;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Payroll</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payslip</h1>
              <p className="text-sm text-gray-600">
                Employee: {payslipData?.employee?.full_name || 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Full width payslip content */}
      <div className="w-full max-w-none mx-0 px-0">
        <div ref={payslipRef} className="payslip-container bg-white shadow-lg mx-0 max-w-none">
          {/* Compact Header */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white p-2 rounded-lg shadow-md">
                  <img src="/snd%20logo.png" alt="SND Logo" className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Samhan Naser Al-Dosri Est.</h1>
                  <p className="text-sm opacity-90">For Gen. Contracting & Rent. Equipments</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-semibold">Employee Pay Slip</h2>
                <p className="text-sm opacity-90">{monthName} {payroll.year}</p>
              </div>
            </div>
          </div>

          {/* Compact Employee Information Grid */}
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Employee Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Employee Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">File Number</span>
                    <span className="text-xs font-semibold text-gray-900">{employee?.file_number || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Employee Name</span>
                    <span className="text-xs font-semibold text-gray-900">{employeeName.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Designation</span>
                    <span className="text-xs font-semibold text-gray-900">{employee?.designation || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-600 font-medium">Employee ID</span>
                    <span className="text-xs font-semibold text-gray-900">{employee?.id}</span>
                  </div>
                </div>
              </div>

              {/* Work Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Work Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Pay Period</span>
                    <span className="text-xs font-semibold text-gray-900">{monthName} {payroll.year}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Date Range</span>
                    <span className="text-xs font-semibold text-gray-900">{formattedStartDate} - {formattedEndDate}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Status</span>
                    <span className="text-xs font-semibold text-gray-900 capitalize">{payroll.status}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-600 font-medium">Payroll ID</span>
                    <span className="text-xs font-semibold text-gray-900">#{payroll.id}</span>
                  </div>
                </div>
              </div>

              {/* Salary Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Salary Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Basic Salary</span>
                    <span className="text-xs font-semibold text-green-700">{formatCurrency(basicSalary)}</span>
                  </div>
                  {employee?.food_allowance && employee.food_allowance > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-200">
                      <span className="text-xs text-gray-600 font-medium">Food Allowance</span>
                      <span className="text-xs font-semibold text-gray-900">{formatCurrency(employee.food_allowance)}</span>
                    </div>
                  )}
                  {employee?.housing_allowance && employee.housing_allowance > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-200">
                      <span className="text-xs text-gray-600 font-medium">Housing Allowance</span>
                      <span className="text-xs font-semibold text-gray-900">{formatCurrency(employee.housing_allowance)}</span>
                    </div>
                  )}
                  {employee?.transport_allowance && employee.transport_allowance > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-200">
                      <span className="text-xs text-gray-600 font-medium">Transport Allowance</span>
                      <span className="text-xs font-semibold text-gray-900">{formatCurrency(employee.transport_allowance)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-xs text-gray-600 font-medium">Overtime Pay</span>
                    <span className="text-xs font-semibold text-green-700">{formatCurrency(overtimeAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-600 font-medium">Net Salary</span>
                    <span className="text-xs font-semibold text-green-700">{formatCurrency(netSalary)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Attendance Record */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-200">Attendance Record</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse rounded-lg overflow-hidden shadow-md">
                  <thead>
                    <tr>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day, idx) => (
                        <th key={day} className="bg-gray-900 text-white font-semibold p-1 text-center text-xs">
                          {day.toString().padStart(2, '0')}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const date = new Date(`${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        return (
                          <th key={`day-${day}`} className="bg-gray-900 text-gray-300 font-medium p-1 text-center text-xs">
                            {dayName.substring(0, 1).toUpperCase()}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const date = new Date(`${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`);
                        const dateString = date.toISOString().split('T')[0];
                        const dayData = attendanceMap.get(dateString);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const isFriday = dayName === 'Fri';
                        
                        // Determine if absent - check if no timesheet entry exists or if hours are 0
                        const isAbsent = !dayData || (Number(dayData.hours) === 0 && Number(dayData.overtime) === 0);
                        
                        // Get the display value
                        let displayValue = '-';
                        let cellClass = 'bg-white';
                        
                        // Priority: Regular hours > Friday > Absent
                        // Use original data as-is
                        if (dayData && Number(dayData.hours) > 0) {
                          displayValue = dayData.hours.toString();
                          cellClass = 'text-green-700 font-semibold';
                        } else if (isFriday && (!dayData || Number(dayData.hours) === 0)) {
                          displayValue = 'F';
                          cellClass = 'bg-blue-100';
                        } else if (isAbsent) {
                          displayValue = 'A';
                          cellClass = 'bg-red-100 text-red-700 font-semibold';
                        }
                        

                        

                        
                        return (
                          <td key={`regular-${day}`} className={`p-1 text-center text-xs border border-gray-200 ${cellClass}`}>
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const date = new Date(`${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`);
                        const dateString = date.toISOString().split('T')[0];
                        const dayData = attendanceMap.get(dateString);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const isFriday = dayName === 'Fri';
                        
                        // Determine if absent - check if no timesheet entry exists or if hours are 0
                        const isAbsent = !dayData || (Number(dayData.hours) === 0 && Number(dayData.overtime) === 0);
                        
                        // Get overtime display value
                        let overtimeValue = '-';
                        let cellClass = 'bg-white';
                        
                        // Priority: Regular hours > Friday > Absent
                        // Use original data as-is
                        if (dayData && Number(dayData.hours) > 0) {
                          const overtime = Number(dayData.overtime) || 0;
                          if (overtime > 0) {
                            overtimeValue = overtime.toString();
                            cellClass = 'text-blue-700 font-semibold';
                          } else {
                            overtimeValue = '0';
                          }
                        } else if (isFriday && (!dayData || Number(dayData.hours) === 0)) {
                          cellClass = 'bg-blue-100';
                        } else if (isAbsent) {
                          cellClass = 'bg-red-100';
                        }
                        
                        return (
                          <td key={`overtime-${day}`} className={`p-1 text-center text-xs border border-gray-200 ${cellClass}`}>
                            {overtimeValue}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                <span className="text-green-700 font-semibold">8</span> = regular hours, <span className="text-blue-700 font-semibold">More than 8</span> = overtime hours, <span className="text-red-700 font-semibold">A</span> = absent, <span className="font-semibold">F</span> = Friday (weekend)
              </div>
            </div>

            {/* Compact Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Working Hours Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Working Hours Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-xs text-gray-600 font-medium">Total Hours Worked</span>
                    <span className="text-xs font-semibold text-gray-900">{totalWorkedHoursFromAttendance} hrs</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-xs text-gray-600 font-medium">Regular Hours</span>
                    <span className="text-xs font-semibold text-gray-900">{totalWorkedHoursFromAttendance - overtimeHoursFromAttendance} hrs</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-xs text-gray-600 font-medium">Overtime Hours</span>
                    <span className="text-xs font-semibold text-green-700">{overtimeHoursFromAttendance} hrs</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-xs text-gray-600 font-medium">Days Worked</span>
                    <span className="text-xs font-semibold text-gray-900">{daysWorkedFromAttendance} days</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-600 font-medium">Absent Days</span>
                    <span className="text-xs font-semibold text-red-700">{absentDays} days</span>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Salary Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-xs text-gray-600 font-medium">Basic Salary</span>
                    <span className="text-xs font-semibold text-green-700">{formatCurrency(basicSalary)}</span>
                  </div>
                  {Number(employee?.food_allowance) > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-200">
                      <span className="text-xs text-gray-600 font-medium">Food Allowance</span>
                      <span className="text-xs font-semibold text-gray-900">{formatCurrency(Number(employee.food_allowance))}</span>
                    </div>
                  )}
                  {Number(employee?.housing_allowance) > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-200">
                      <span className="text-xs text-gray-600 font-medium">Housing Allowance</span>
                      <span className="text-xs font-semibold text-gray-900">{formatCurrency(Number(employee.housing_allowance))}</span>
                    </div>
                  )}
                  {Number(employee?.transport_allowance) > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-200">
                      <span className="text-xs text-gray-600 font-medium">Transport Allowance</span>
                      <span className="text-xs font-semibold text-gray-900">{formatCurrency(Number(employee.transport_allowance))}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-xs text-gray-600 font-medium">Overtime Pay</span>
                    <span className="text-xs font-semibold text-green-700">{formatCurrency(overtimeAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-xs text-gray-600 font-medium">Bonus Amount</span>
                    <span className="text-xs font-semibold text-green-700">{formatCurrency(bonusAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-xs text-gray-600 font-medium">Advance Deduction</span>
                    <span className="text-xs font-semibold text-red-700">{formatCurrency(advanceDeduction)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t-2 border-gray-300">
                    <span className="text-sm font-semibold text-gray-900">Final Amount</span>
                    <span className="text-sm font-bold text-green-700">{formatCurrency(finalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Signatures Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Chief Accountant</h4>
                <div className="text-sm font-semibold text-gray-900 mb-4">Samir Taima</div>
                <div className="border-t border-gray-300 pt-1 text-xs text-gray-500">Signature</div>
              </div>
              <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Verified By</h4>
                <div className="text-sm font-semibold text-gray-900 mb-4">Salem Samhan Al-Dosri</div>
                <div className="border-t border-gray-300 pt-1 text-xs text-gray-500">Signature</div>
              </div>
              <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Employee</h4>
                <div className="text-sm font-semibold text-gray-900 mb-4">{employeeName}</div>
                <div className="border-t border-gray-300 pt-1 text-xs text-gray-500">Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
