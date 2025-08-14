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
import { loadHtml2Canvas, loadJsPDF } from "@/lib/client-libraries";

// Professional print styles to match the exact payslip layout
const printStyles = `
  @media print {
    @page {
      size: A4 landscape;
      margin: 10mm;
    }

    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background-color: white !important;
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
      font-size: 12px !important;
      line-height: 1.4 !important;
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

    /* Header Section - Match the blue banner */
    .bg-gradient-to-br {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%) !important;
      color: white !important;
      padding: 1rem !important;
      border-radius: 0 !important;
      margin-bottom: 1rem !important;
    }

    .bg-white.p-2.rounded-lg.shadow-md {
      background: white !important;
      padding: 0.5rem !important;
      border-radius: 0.5rem !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    }

    .w-12.h-12 {
      width: 3rem !important;
      height: 3rem !important;
    }

    .text-xl.font-bold {
      font-size: 1.25rem !important;
      font-weight: 700 !important;
      margin-bottom: 0.25rem !important;
    }

    .text-sm.opacity-90 {
      font-size: 0.875rem !important;
      opacity: 0.9 !important;
    }

    .text-lg.font-semibold {
      font-size: 1.125rem !important;
      font-weight: 600 !important;
    }

    /* Employee Information Grid - Three columns layout */
    .grid.grid-cols-1.lg\\:grid-cols-3 {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 1rem !important;
      margin-bottom: 1rem !important;
    }

    .bg-white.border.border-gray-200.rounded-lg.p-4 {
      background: white !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 0.5rem !important;
      padding: 1rem !important;
    }

    .text-xs.font-semibold.text-gray-600.uppercase.tracking-wide.mb-3 {
      font-size: 0.75rem !important;
      font-weight: 600 !important;
      color: #6b7280 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      margin-bottom: 0.75rem !important;
    }

    .space-y-2 {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.5rem !important;
    }

    .flex.justify-between.items-center {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 0.25rem 0 !important;
      border-bottom: 1px solid #f3f4f6 !important;
    }

    .text-xs.text-gray-600.font-medium {
      font-size: 0.75rem !important;
      color: #6b7280 !important;
      font-weight: 500 !important;
    }

    .text-xs.font-semibold.text-gray-900 {
      font-size: 0.75rem !important;
      font-weight: 600 !important;
      color: #111827 !important;
    }

    .text-xs.font-semibold.text-green-700 {
      font-size: 0.75rem !important;
      font-weight: 600 !important;
      color: #15803d !important;
    }

    /* Working Hours Summary - Left section */
    .bg-blue-50.border.border-blue-200.rounded-lg.p-4 {
      background: #eff6ff !important;
      border: 1px solid #bfdbfe !important;
      border-radius: 0.5rem !important;
      padding: 1rem !important;
      margin-bottom: 1rem !important;
    }

    .text-sm.font-semibold.text-blue-800 {
      font-size: 0.875rem !important;
      font-weight: 600 !important;
      color: #1e40af !important;
      margin-bottom: 0.5rem !important;
    }

    .grid.grid-cols-2.gap-3 {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 0.75rem !important;
    }

    .text-sm.font-medium {
      font-size: 0.875rem !important;
      font-weight: 500 !important;
    }

    .text-sm.text-right {
      font-size: 0.875rem !important;
      text-align: right !important;
    }

    .text-sm.text-right.font-semibold {
      font-size: 0.875rem !important;
      text-align: right !important;
      font-weight: 600 !important;
    }

    .text-sm.text-right.text-green-600 {
      font-size: 0.875rem !important;
      text-align: right !important;
      color: #16a34a !important;
    }

    .text-sm.text-right.text-red-600 {
      font-size: 0.875rem !important;
      text-align: right !important;
      color: #dc2626 !important;
    }

    /* Attendance Record - Calendar grid */
    .overflow-x-auto.rounded-md.border {
      overflow-x: auto !important;
      border-radius: 0.375rem !important;
      border: 1px solid #e5e7eb !important;
      margin-bottom: 1rem !important;
    }

    .text-xs.font-semibold.text-gray-600.uppercase.tracking-wide.mb-2 {
      font-size: 0.75rem !important;
      font-weight: 600 !important;
      color: #6b7280 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      margin-bottom: 0.5rem !important;
    }

    /* Calendar table styles */
    .min-w-full.divide-y.divide-gray-200 {
      min-width: 100% !important;
      border-collapse: collapse !important;
    }

    .bg-gray-50 {
      background: #f9fafb !important;
    }

    .border.bg-black.text-center.align-middle.text-xs.font-bold.text-white.h-10 {
      border: 1px solid #000 !important;
      background: #000 !important;
      text-align: center !important;
      vertical-align: middle !important;
      font-size: 0.75rem !important;
      font-weight: 700 !important;
      color: white !important;
      height: 2.5rem !important;
      padding: 0.25rem !important;
    }

    .text-center.border.p-1.text-xs {
      text-align: center !important;
      border: 1px solid #e5e7eb !important;
      padding: 0.25rem !important;
      font-size: 0.75rem !important;
    }

    .text-center.bg-blue-100.border.p-1.text-xs {
      text-align: center !important;
      background: #dbeafe !important;
      border: 1px solid #e5e7eb !important;
      padding: 0.25rem !important;
      font-size: 0.75rem !important;
    }

    .text-center.bg-blue-100.text-red-600.border.p-1.text-xs {
      text-align: center !important;
      background: #dbeafe !important;
      color: #dc2626 !important;
      border: 1px solid #e5e7eb !important;
      padding: 0.25rem !important;
      font-size: 0.75rem !important;
    }

    .text-center.bg-blue-100.text-green-600.border.p-1.text-xs {
      text-align: center !important;
      background: #dbeafe !important;
      color: #16a34a !important;
      border: 1px solid #e5e7eb !important;
      padding: 0.25rem !important;
      font-size: 0.75rem !important;
    }

    .text-center.bg-blue-100.text-blue-600.border.p-1.text-xs {
      text-align: center !important;
      background: #dbeafe !important;
      color: #2563eb !important;
      border: 1px solid #e5e7eb !important;
      padding: 0.25rem !important;
      font-size: 0.75rem !important;
    }

    .text-center.text-red-600.border.p-1.text-xs {
      text-align: center !important;
      color: #dc2626 !important;
      border: 1px solid #e5e7eb !important;
      padding: 0.25rem !important;
      font-size: 0.75rem !important;
    }

    .text-center.text-green-600.border.p-1.text-xs {
      text-align: center !important;
      color: #16a34a !important;
      border: 1px solid #e5e7eb !important;
      padding: 0.25rem !important;
      font-size: 0.75rem !important;
    }

    .text-center.text-blue-600.border.p-1.text-xs {
      text-align: center !important;
      color: #2563eb !important;
      border: 1px solid #e5e7eb !important;
      padding: 0.25rem !important;
      font-size: 0.75rem !important;
    }

    /* Legend */
    .mt-1.text-xs.text-gray-500 {
      margin-top: 0.25rem !important;
      font-size: 0.75rem !important;
      color: #6b7280 !important;
    }

    .font-semibold.text-green-600 {
      font-weight: 600 !important;
      color: #16a34a !important;
    }

    .font-semibold.text-blue-600 {
      font-weight: 600 !important;
      color: #2563eb !important;
    }

    .font-semibold.text-red-600 {
      font-weight: 600 !important;
      color: #dc2626 !important;
    }

    /* Working Hours Summary and Salary Breakdown - Two column layout */
    .grid.grid-cols-1.gap-6.md\\:grid-cols-2 {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 2rem !important;
      margin-bottom: 1.5rem !important;
    }

    /* Working Hours Summary - Left column */
    .bg-blue-50.border.border-blue-200.rounded-lg.p-4 {
      background: #eff6ff !important;
      border: 1px solid #bfdbfe !important;
      border-radius: 0.5rem !important;
      padding: 1rem !important;
      margin: 0 !important;
    }

    .text-sm.font-semibold.text-blue-800 {
      font-size: 0.875rem !important;
      font-weight: 600 !important;
      color: #1e40af !important;
      margin-bottom: 0.5rem !important;
    }

    .grid.grid-cols-2.gap-3 {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 0.75rem !important;
    }

    .text-sm.font-medium {
      font-size: 0.875rem !important;
      font-weight: 500 !important;
    }

    .text-sm.text-right {
      font-size: 0.875rem !important;
      text-align: right !important;
    }

    .text-sm.text-right.font-semibold {
      font-size: 0.875rem !important;
      text-align: right !important;
      font-weight: 600 !important;
    }

    .text-sm.text-right.text-green-600 {
      font-size: 0.875rem !important;
      text-align: right !important;
      color: #16a34a !important;
    }

    .text-sm.text-right.text-red-600 {
      font-size: 0.875rem !important;
      text-align: right !important;
      color: #dc2626 !important;
    }

    /* Salary Breakdown - Right column */
    .bg-gray-50.border.border-gray-200.rounded-lg.p-4 {
      background: #f9fafb !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 0.5rem !important;
      padding: 1rem !important;
      margin: 0 !important;
    }

    .text-sm.font-semibold.text-gray-800 {
      font-size: 0.875rem !important;
      font-weight: 600 !important;
      color: #1f2937 !important;
      margin-bottom: 0.5rem !important;
    }

    .space-y-4 {
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
    }

    .font-semibold {
      font-weight: 600 !important;
    }

    .grid.grid-cols-2.gap-y-2.rounded-md.border.bg-gray-50.p-4.text-sm {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 0.5rem !important;
      border-radius: 0.375rem !important;
      border: 1px solid #e5e7eb !important;
      background: #f9fafb !important;
      padding: 1rem !important;
      font-size: 0.875rem !important;
    }

    /* Net Salary Section */
    .bg-green-50.border.border-green-200.rounded-lg.p-4 {
      background: #f0fdf4 !important;
      border: 1px solid #bbf7d0 !important;
      border-radius: 0.5rem !important;
      padding: 1rem !important;
      margin-top: 1rem !important;
    }

    .text-lg.font-bold.text-green-800 {
      font-size: 1.125rem !important;
      font-weight: 700 !important;
      color: #166534 !important;
    }

    /* Signatures */
    .flex.justify-between.items-end {
      display: flex !important;
      justify-content: space-between !important;
      align-items: flex-end !important;
      margin-top: 1.5rem !important;
    }

    .grid.grid-cols-3.gap-x-12.text-sm {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 3rem !important;
      font-size: 0.875rem !important;
    }

    .text-center {
      text-align: center !important;
    }

    .mb-1.font-semibold {
      margin-bottom: 0.25rem !important;
      font-weight: 600 !important;
    }

    .text-muted-foreground.italic {
      color: #6b7280 !important;
      font-style: italic !important;
    }

    .border-t.border-gray-300 {
      border-top: 1px solid #d1d5db !important;
      padding-top: 0.25rem !important;
      margin-top: 0.25rem !important;
    }

    /* Ensure all content is visible */
    .p-4 {
      padding: 1rem !important;
    }

    .mb-4 {
      margin-bottom: 1rem !important;
    }

    .space-y-6 {
      display: flex !important;
      flex-direction: column !important;
      gap: 1.5rem !important;
    }

    /* Hide print button in print */
    .print\\:hidden {
      display: none !important;
    }

    /* Ensure colors print correctly */
    .text-green-600,
    .text-green-700,
    .text-green-800 {
      color: #16a34a !important;
    }

    .text-red-600 {
      color: #dc2626 !important;
    }

    .text-blue-600,
    .text-blue-800 {
      color: #2563eb !important;
    }

    /* Ensure proper spacing */
    .mt-8 {
      margin-top: 2rem !important;
    }

    .pt-6 {
      padding-top: 1.5rem !important;
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
    waitForImages: true,
    onPrintError: (error) => {
      console.error('Print error details:', error);
      // Continue with print even if there are image errors
    }
  });

  useEffect(() => {
    const fetchPayslipData = async () => {
      try {
        console.log('🔍 PAYSLIP FRONTEND - Starting fetch for payroll ID:', id);
        setLoading(true);
        const response = await fetch(`/api/payroll/${id}/payslip`);
        console.log('🔍 PAYSLIP FRONTEND - Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔍 PAYSLIP FRONTEND - Response not ok:', errorText);
          throw new Error(`Failed to fetch payslip data: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('🔍 PAYSLIP FRONTEND - Response data:', data);
        
        if (data.success) {
          console.log('🔍 PAYSLIP FRONTEND - Payslip data received:', data.data);
          setPayslipData(data.data);
        } else {
          console.error('🔍 PAYSLIP FRONTEND - API returned success: false:', data.message);
          throw new Error(data.message || 'Failed to fetch payslip data');
        }
      } catch (error) {
        console.error('🔍 PAYSLIP FRONTEND - Error fetching payslip data:', error);
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
        a.download = `payslip_${payslipData?.employee?.id}_${payslipData?.payroll.month}_${payslipData?.payroll.year}.pdf`;
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
          await handleDownloadPDF();
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
    try {
      const input = payslipRef.current;
      if (!input) return;
      
      // Dynamically load libraries
      const html2canvas = await loadHtml2Canvas();
      const jsPDF = await loadJsPDF();
      
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

      const monthName = new Date(payslipData?.payroll.year || 0, (payslipData?.payroll.month || 1) - 1).toLocaleDateString("en-US", { month: "long" });
      pdf.save(`payslip_${payslipData?.employee?.file_number || payslipData?.employee?.id}_${monthName}_${payslipData?.payroll.year}.pdf`);
      toast.success('Payslip PDF generated successfully');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Loading payslip data...</p>
            <p className="text-sm text-gray-500 mt-2">Payroll ID: {id}</p>
            <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
          </div>
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
          <p className="text-sm text-gray-500 mt-2">Payroll ID: {id}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
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



  // Calculate total worked hours from attendance data - Convert Decimal to numbers
  const totalWorkedHoursFromAttendance = attendanceData.reduce((total, day) => {
    return total + (Number(day.hours) || 0) + (Number(day.overtime) || 0);
  }, 0);

  // Calculate overtime hours from attendance data - Convert Decimal to numbers
  const overtimeHoursFromAttendance = attendanceData.reduce((total, day) => {
    return total + (Number(day.overtime) || 0);
  }, 0);

  // Calculate days worked from attendance data (including Fridays with hours) - Convert Decimal to numbers
  const daysWorkedFromAttendance = attendanceData.reduce((count, day) => {
    // Count as worked if there are hours or overtime, regardless of day
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
      // Extract just the date part (YYYY-MM-DD) from the API response
      // Handle both "2025-07-01 00:00:00" and "2025-07-01T00:00:00.000Z" formats
      let dateKey = '';
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
        console.log(`🔍 PAYSLIP DEBUG - Added to attendanceMap: ${dateKey} ->`, day);
      }
    });
  }
  
  console.log('🔍 PAYSLIP DEBUG - Final attendanceMap size:', attendanceMap.size);
  console.log('🔍 PAYSLIP DEBUG - AttendanceMap keys:', Array.from(attendanceMap.keys()));

  // Calculate absent days by checking ALL days in the month (including Fridays with smart logic)
  const absentDays = (() => {
    let absentCount = 0;
    const absentDates: string[] = [];
    
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
            absentDates.push(dateString);
          }
        }
      } else {
        // Non-Friday days - count as absent if no hours worked
        if (!hasHoursWorked) {
          absentCount++;
          absentDates.push(dateString);
        }
      }
    }
    
    // Debug absent days calculation
    console.log('🔍 PAYSLIP DEBUG - Absent Days Calculation:', {
      totalDaysInMonth: daysInMonth,
      absentCount,
      absentDates,
      attendanceMapSize: attendanceMap.size,
      sampleAttendanceData: Array.from(attendanceMap.entries()).slice(0, 3)
    });
    
    return absentCount;
  })();

  // Calculate totals for salary details - Convert Decimal to numbers
  const totalAllowances = (Number(employee.food_allowance) || 0) + (Number(employee.housing_allowance) || 0) + (Number(employee.transport_allowance) || 0);
  
  // Calculate absent deduction: (Basic Salary / Total Days in Month) * Absent Days
  // Use total days in month (31) instead of working days
  const absentDeduction = absentDays > 0 ? (basicSalary / daysInMonth) * absentDays : 0;
  
  // Debug absent calculation
  console.log('🔍 PAYSLIP DEBUG - Absent Calculation:', {
    totalDaysInMonth: daysInMonth,
    absentDays,
    basicSalary,
    absentDeduction,
    calculation: `(${basicSalary} / ${daysInMonth}) * ${absentDays} = ${absentDeduction}`
  });
  
  const netSalary = basicSalary + totalAllowances + overtimeAmount + bonusAmount - absentDeduction - advanceDeduction;

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
                Employee: {loading ? 'Loading...' : (payslipData?.employee?.file_number|| 'Unknown Employee')}
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
              onClick={handleDownload}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </>
              )}
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
                  <img 
                    src="/snd-logo.png" 
                    alt="SND Logo" 
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      console.warn('Logo failed to load, hiding image');
                      e.currentTarget.style.display = 'none';
                      // Add fallback text
                      const fallback = document.createElement('div');
                      fallback.className = 'w-12 h-12 flex items-center justify-center text-xs font-bold text-gray-600 bg-gray-100 rounded';
                      fallback.textContent = 'SND';
                      e.currentTarget.parentNode?.appendChild(fallback);
                    }}
                  />
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
                  {/* {employee?.food_allowance && employee.food_allowance > 0 && (
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
                  )} */}
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
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day, idx) => (
                        <th key={day} className="bg-gray-900 text-white font-semibold p-1 text-center text-xs">
                          {day.toString().padStart(2, '0')}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
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
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        // Create date string in YYYY-MM-DD format without timezone conversion
                        const dateString = `${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayData = attendanceMap.get(dateString);
                        const dayName = new Date(payroll.year, payroll.month - 1, day).toLocaleDateString('en-US', { weekday: 'short' });
                        const isFriday = dayName === 'Fri';
                        
                        // Determine if absent - check if no timesheet entry exists or if hours are 0
                        const isAbsent = !dayData || (Number(dayData.hours) === 0 && Number(dayData.overtime) === 0);
                        
                        // Get the display value
                        let displayValue = '-';
                        let cellClass = 'bg-white';
                        
                        // Priority: Regular hours > Friday logic > Absent
                        if (dayData && (Number(dayData.hours) > 0 || Number(dayData.overtime) > 0)) {
                          // Has hours worked
                          displayValue = `${Number(dayData.hours) || 0}`;
                          cellClass = 'bg-green-100 text-green-600';
                        } else if (isFriday) {
                          // Friday with no hours - check if it should be marked as absent
                          const thursdayDate = new Date(payroll.year, payroll.month - 1, day - 1);
                          const saturdayDate = new Date(payroll.year, payroll.month - 1, day + 1);
                          
                          // Check if Thursday and Saturday are also absent (within month bounds)
                          const thursdayString = `${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(thursdayDate.getDate()).padStart(2, '0')}`;
                          const saturdayString = `${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(saturdayDate.getDate()).padStart(2, '0')}`;
                          
                          const thursdayData = attendanceMap.get(thursdayString);
                          const saturdayData = attendanceMap.get(saturdayString);
                          
                          const thursdayAbsent = !thursdayData || (Number(thursdayData.hours) === 0 && Number(thursdayData.overtime) === 0);
                          const saturdayAbsent = !saturdayData || (Number(saturdayData.hours) === 0 && Number(saturdayData.overtime) === 0);
                          
                          if (thursdayAbsent && saturdayAbsent) {
                            // Friday is absent (Thursday and Saturday are also absent)
                            displayValue = 'A';
                            cellClass = 'bg-red-100 text-red-600';
                          } else {
                            // Friday is present (has working days before or after)
                            displayValue = 'F';
                            cellClass = 'bg-blue-100 text-blue-600';
                          }
                        } else if (isAbsent) {
                          // Absent (not Friday)
                          displayValue = 'A';
                          cellClass = 'bg-red-100 text-red-600';
                        }
                        
                        return (
                          <td key={`attendance-${day}`} className={`border p-1 text-xs text-center ${cellClass}`}>
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        // Create date string in YYYY-MM-DD format without timezone conversion
                        const dateString = `${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayData = attendanceMap.get(dateString);
                        
                        // Show overtime hours or dash
                        let displayValue = '-';
                        let cellClass = 'bg-white';
                        
                        if (dayData && Number(dayData.overtime) > 0) {
                          displayValue = `${Number(dayData.overtime)}`;
                          cellClass = 'bg-orange-100 text-orange-600';
                        }
                        
                        return (
                          <td key={`overtime-${day}`} className={`border p-1 text-xs text-center ${cellClass}`}>
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                <span className="text-green-700 font-semibold">8</span> = regular hours, <span className="text-blue-700 font-semibold">More than 8</span> = overtime hours, <span className="text-red-700 font-semibold">A</span> = absent, <span className="font-semibold">F</span> = Friday (present if working days before/after)
              </div>
            </div>

            {/* Compact Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Working Hours Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Working Hours Summary</h3>
                <div className="space-y-2">
                  {/* Hours Breakdown */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Hours Breakdown</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Total Hours Worked</span>
                        <span className="text-xs font-semibold text-gray-900">{totalWorkedHoursFromAttendance} hrs</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Regular Hours</span>
                        <span className="text-xs font-semibold text-gray-900">{totalWorkedHoursFromAttendance - overtimeHoursFromAttendance} hrs</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Overtime Hours</span>
                        <span className="text-xs font-semibold text-green-700">{overtimeHoursFromAttendance} hrs</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Attendance Summary</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Days Worked</span>
                        <span className="text-xs font-semibold text-gray-900">{daysWorkedFromAttendance} days</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Absent Days</span>
                        <span className="text-xs font-semibold text-red-700">{absentDays} days</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs text-gray-600 font-medium">Absent Deduction</span>
                      <span className="text-xs font-semibold text-red-700">-{formatCurrency(absentDeduction)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Salary Breakdown</h3>
                <div className="space-y-2">
                  {/* Earnings Section */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Earnings</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Basic Salary</span>
                        <span className="text-xs font-semibold text-green-700">{formatCurrency(basicSalary)}</span>
                      </div>
                      {Number(employee?.food_allowance) > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-gray-600 font-medium">Food Allowance</span>
                          <span className="text-xs font-semibold text-gray-900">{formatCurrency(Number(employee.food_allowance))}</span>
                        </div>
                      )}
                      {Number(employee?.housing_allowance) > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-gray-600 font-medium">Housing Allowance</span>
                          <span className="text-xs font-semibold text-gray-900">{formatCurrency(Number(employee.housing_allowance))}</span>
                        </div>
                      )}
                      {Number(employee?.transport_allowance) > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-gray-600 font-medium">Transport Allowance</span>
                          <span className="text-xs font-semibold text-gray-900">{formatCurrency(Number(employee.transport_allowance))}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Overtime Pay</span>
                        <span className="text-xs font-semibold text-green-700">{formatCurrency(overtimeAmount)}</span>
                      </div>
                      {overtimeHoursFromAttendance > 0 && (
                        <div className="ml-4 space-y-1 text-xs text-gray-500">
                          <div className="flex justify-between items-center">
                            <span>Overtime Hours:</span>
                            <span>{overtimeHoursFromAttendance} hrs</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Overtime Rate:</span>
                            <span>
                              {employee?.overtime_fixed_rate && employee.overtime_fixed_rate > 0 
                                ? `${formatCurrency(Number(employee.overtime_fixed_rate))}/hr (Fixed)`
                                : `${employee?.overtime_rate_multiplier || 1.5}x (Basic/30/8)`
                              }
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Bonus Amount</span>
                        <span className="text-xs font-semibold text-green-700">{formatCurrency(bonusAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Section */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Deductions</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Absent Days Deduction</span>
                        <span className="text-xs font-semibold text-red-700">-{formatCurrency(absentDeduction)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Advance Deduction</span>
                        <span className="text-xs font-semibold text-red-700">-{formatCurrency(advanceDeduction)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Total Section */}
                  <div className="border-t-2 border-gray-300 pt-2">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-bold text-gray-900">Net Salary</span>
                      <span className="text-sm font-bold text-green-700">{formatCurrency(netSalary)}</span>
                    </div>
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
