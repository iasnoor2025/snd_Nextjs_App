'use client';

import { Button } from '@/components/ui/button';
import { usePrint } from '@/hooks/use-print';
import { loadJsPDF } from '@/lib/client-libraries';
import {
  ArrowLeft,
  Download,
  Printer,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';

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
    onPrintError: _error => {
      
      // Continue with print even if there are image errors
    },
  });

  // Check for auto-download parameter
  useEffect(() => {
    // Only run this effect when payslipData is available
    if (payslipData && !loading) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('download') === 'true') {
        // Auto-download PDF silently with a slight delay to ensure rendering is complete
        setTimeout(() => {
          handleDownloadPDF();
          // If this is loaded in an iframe, tell the parent we're done
          if (window.parent !== window) {
            window.parent.postMessage('payslip-download-complete', '*');
          }
        }, 1000);
      }
    }
  }, [payslipData, loading]);

  useEffect(() => {
    const fetchPayslipData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/payroll/${id}/payslip`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch payslip data: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        if (data.success) {
          setPayslipData(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch payslip data');
        }
      } catch (err) {
        toast.error('Failed to load payslip data');
        console.error('Error loading payslip data:', err);
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
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Failed to download PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const jsPDF = await loadJsPDF();

      // Create PDF using jsPDF with exact payslip layout
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      // const _pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Helper functions removed to avoid linter errors
      // These were defined but not used

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
      
      // Left side: Company Logo and Name (like payslip)
      const logoSize = 20;
      const logoX = margin + 8;
      const logoY = yPosition + 2;
      
      // Add the actual SND logo image from your payslip
      // You need to add the logo image file to your project
      try {
        // Using the real SND logo from your project
        pdf.addImage('/snd-logo.png', 'PNG', logoX, logoY, logoSize, logoSize);
      } catch (loadErr) {
        // Fallback if image loading fails
        console.error('Error loading logo image:', loadErr);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(logoX, logoY, logoSize, logoSize, 'F');
      }
      
      // Company name and subtitle on LEFT SIDE (like your payslip)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Samhan Naser Al-Dosri Est.', logoX + logoSize + 15, logoY + 8);

      pdf.setFontSize(10);
      pdf.text('For Gen. Contracting & Rent. Equipments', logoX + logoSize + 20, logoY + 16);

      // Right side: Payslip title and month
      pdf.setFontSize(14);
      pdf.text('Employee Pay Slip', pageWidth - margin - 10, logoY + 8, { align: 'right' });
      
      const monthName = new Date(payroll.year, payroll.month - 1).toLocaleDateString('en-US', { month: 'long' });
      pdf.setFontSize(10);
      pdf.text(`${monthName} ${payroll.year}`, pageWidth - margin - 10, logoY + 16, { align: 'right' });

      yPosition += 25; // Space after header

      // ===== FIRST ROW - 3 COLUMNS =====
      const firstRowY = yPosition;
      const columnHeight = 25;
      const columnWidth = (pageWidth - 2 * margin - 20) / 3; // 3 columns with spacing

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
      pdf.text(`${employee?.designation?.name || employee?.designation || '-'}`, col1ValueX, contentY, { align: 'right' });

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
      const daysInMonth = new Date(payroll.year, payroll.month, 0).getDate();
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
      const thirdRowY = tableStartY + 35; // Moved down to prevent overlapping with attendance record
      const sectionHeight = 50; // Increased height to fit all content with new spacing
      
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
      leftY += 5; // Increased row spacing
      
      pdf.text(`Absent Days:`, leftLabelX, leftY);
      pdf.text(`${absentDays} days`, leftValueX, leftY, { align: 'right' });
      leftY += 5; // Increased row spacing
      
      pdf.text(`Absent Days Deduction:`, leftLabelX, leftY);
      if (absentDays > 0) {
        pdf.setTextColor(239, 68, 68); // Red color for absent deduction
      }
      pdf.text(`-${formatCurrencyForPDF(absentDeduction)}`, leftValueX, leftY, { align: 'right' });
      pdf.setTextColor(120, 53, 15); // Reset to dark orange text
      leftY += 5; // Increased row spacing

      // Short Hours Deduction
      if (shortHoursDeduction > 0) {
        pdf.text(`Short Hours Deduction:`, leftLabelX, leftY);
        pdf.setTextColor(239, 68, 68); // Red color for short hours deduction
        pdf.text(`-${formatCurrencyForPDF(shortHoursDeduction)}`, leftValueX, leftY, { align: 'right' });
        pdf.setTextColor(120, 53, 15); // Reset to dark orange text
        leftY += 5; // Increased row spacing
      }

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
      rightY += 5; // Increased row spacing
      
      // Short Hours Deduction
      if (shortHoursDeduction > 0) {
        pdf.text(`Short Hours Deduction:`, labelX, rightY);
        pdf.setTextColor(239, 68, 68); // Red color for short hours deduction
        pdf.text(`-${formatCurrencyForPDF(shortHoursDeduction)}`, valueX, rightY, { align: 'right' });
        pdf.setTextColor(15, 118, 110); // Reset to dark teal text
        rightY += 5; // Increased row spacing
      }
      
      pdf.text(`Advance Deduction:`, labelX, rightY);
      if (advanceDeduction > 0) {
        pdf.setTextColor(239, 68, 68); // Red color for advance deduction
      }
      pdf.text(`-${formatCurrencyForPDF(advanceDeduction)}`, valueX, rightY, { align: 'right' });
      pdf.setTextColor(15, 118, 110); // Reset to dark teal text
      rightY += 5; // Increased row spacing
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(15, 118, 110); // Dark teal text
      
      // Net Salary with right-aligned value
      pdf.text('Net Salary:', labelX, rightY);
      pdf.text(`${formatCurrencyForPDF(netSalary)}`, valueX, rightY, { align: 'right' });

      // ===== SIGNATURES SECTION =====
      const signatureY = Math.max(leftY, rightY) + 25; // Much more space for signatures
      const signatureWidth = (pageWidth - 2 * margin) / 3;
      
      // Chief Accountant
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
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

      // Save PDF
      const fileName = `payslip_${employee?.file_number || employee?.id}_${monthName}_${payroll.year}.pdf`;
      pdf.save(fileName);
      toast.success('Payslip PDF generated successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
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
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { payroll, employee, attendanceData } = payslipData;

  // Add safety checks for employee data
  const employeeName = employee
    ? employee.full_name ||
      `${employee.first_name || ''} ${employee.last_name || ''}`.trim() ||
      'Unknown Employee'
    : 'Unknown Employee';

  // Debug the data

  // Calculate pay details - Convert Decimal to numbers
  const basicSalary = Number(payroll.base_salary) || 0;
  const overtimeAmount = Number(payroll.overtime_amount) || 0;
  const bonusAmount = Number(payroll.bonus_amount) || 0;
  const advanceDeduction = Number(payroll.advance_deduction) || 0;
  // Unused variables prefixed with underscore to avoid linter errors
  const _finalAmount = Number(payroll.final_amount) || 0;
  const _totalWorkedHours = Number(payroll.total_worked_hours) || 0;
  const _overtimeHours = Number(payroll.overtime_hours) || 0;
  
  // Suppress unused variable warnings
  void _finalAmount;
  void _totalWorkedHours;
  void _overtimeHours;

  // Check if attendance data is available
  if (!attendanceData || !Array.isArray(attendanceData)) {
    
    return (
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">No Attendance Data</h2>
          <p className="text-gray-600">No attendance data available for this payroll period.</p>
          <p className="text-sm text-gray-500 mt-2">
            Payroll ID: {payroll.id}, Month: {payroll.month}/{payroll.year}
          </p>
        </div>
      </div>
    );
  }

  // Calculate total worked hours from attendance data - Convert Decimal to numbers
  const totalWorkedHoursFromAttendance = attendanceData.reduce((total, day) => {
    return total + (Number(day.hours) || 0) + (Number(day.overtime) || 0);
  }, 0);

  // Calculate regular hours from attendance data - Convert Decimal to numbers
  const regularHoursFromAttendance = attendanceData.reduce((total, day) => {
    return total + (Number(day.hours) || 0);
  }, 0);

  // Calculate overtime hours from attendance data - Convert Decimal to numbers
  const overtimeHoursFromAttendance = attendanceData.reduce((total, day) => {
    return total + (Number(day.overtime) || 0);
  }, 0);

  // Calculate days worked from attendance data (only count days with regular hours) - Convert Decimal to numbers
  const daysWorkedFromAttendance = attendanceData.reduce((count, day) => {
    // Count as worked only if there are regular hours > 0 (not just overtime)
    return count + (Number(day.hours) > 0 ? 1 : 0);
  }, 0);

  // Format dates
  const monthName = new Date(payroll.year, payroll.month - 1).toLocaleDateString('en-US', {
    month: 'long',
  });
  const startDate = new Date(payroll.year, payroll.month - 1, 1);
  const endDate = new Date(payroll.year, payroll.month, 0);
  const formattedStartDate = startDate.toLocaleDateString();
  const formattedEndDate = endDate.toLocaleDateString();

  // Calendar data is handled directly through attendanceMap

  // Create a map of attendance data by date for easier lookup
  const attendanceMap = new Map();

  if (attendanceData && Array.isArray(attendanceData)) {
    attendanceData.forEach(day => {
      // Extract just the date part (YYYY-MM-DD) from the API response
      // Handle both "2025-07-01 00:00:00" and "2025-07-01T00:00:00.000Z" formats
      // Initialize with a safe default value
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

  // Calculate number of days in the month
  const daysInMonth = new Date(payroll.year, payroll.month, 0).getDate();

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

          const thursdayAbsent =
            !thursdayData ||
            (Number(thursdayData.hours) === 0 && Number(thursdayData.overtime) === 0);
          const saturdayAbsent =
            !saturdayData ||
            (Number(saturdayData.hours) === 0 && Number(saturdayData.overtime) === 0);

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

    return absentCount;
  })();

  // Calculate totals for salary details - Convert Decimal to numbers
  const totalAllowances =
    (Number(employee.food_allowance) || 0) +
    (Number(employee.housing_allowance) || 0) +
    (Number(employee.transport_allowance) || 0);

  // Calculate absent deduction: (Basic Salary / Total Days in Month) * Absent Days
  // Use total days in month (31) instead of working days
  const absentDeduction = absentDays > 0 ? (basicSalary / daysInMonth) * absentDays : 0;

  // Calculate short hours deduction
  const contractHoursPerDay = Number(employee?.contract_hours_per_day) || 8;
  const hourlyRate = basicSalary / (daysInMonth * contractHoursPerDay);
  
  let shortHoursDeduction = 0;
  if (regularHoursFromAttendance < (daysWorkedFromAttendance * contractHoursPerDay)) {
    const expectedHours = daysWorkedFromAttendance * contractHoursPerDay;
    const shortHours = expectedHours - regularHoursFromAttendance;
    shortHoursDeduction = shortHours * hourlyRate;
  }

  const netSalary =
    basicSalary +
    totalAllowances +
    overtimeAmount +
    bonusAmount -
    absentDeduction -
    shortHoursDeduction -
    advanceDeduction;
    
  // Unused variables from payroll data - keeping for future reference
  // const _finalAmount = Number(payroll.final_amount) || 0;
  // const _totalWorkedHours = Number(payroll.total_worked_hours) || 0;
  // const _overtimeHours = Number(payroll.overtime_hours) || 0;

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
                Employee:{' '}
                {loading ? 'Loading...' : payslipData?.employee?.file_number || 'Unknown Employee'}
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
                    onError={imgError => {
                      
                      imgError.currentTarget.style.display = 'none';
                      // Add fallback text
                      const fallback = document.createElement('div');
                      fallback.className =
                        'w-12 h-12 flex items-center justify-center text-xs font-bold text-gray-600 bg-gray-100 rounded';
                      fallback.textContent = 'SND';
                      imgError.currentTarget.parentNode?.appendChild(fallback);
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
                <p className="text-sm opacity-90">
                  {monthName} {payroll.year}
                </p>
              </div>
            </div>
          </div>

          {/* Compact Employee Information Grid */}
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Employee Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Employee Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">File Number</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {employee?.file_number || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Employee Name</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {employeeName.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Designation</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {employee?.designation?.name || employee?.designation || '-'}
                    </span>
                  </div>

                </div>
              </div>

              {/* Work Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Work Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Pay Period</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {monthName} {payroll.year}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Date Range</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {formattedStartDate} - {formattedEndDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Status</span>
                    <span className="text-xs font-semibold text-gray-900 capitalize">
                      {payroll.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-600 font-medium">Payroll ID</span>
                    <span className="text-xs font-semibold text-gray-900">#{payroll.id}</span>
                  </div>
                </div>
              </div>

              {/* Salary Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Salary Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Basic Salary</span>
                    <span className="text-xs font-semibold text-green-700">
                      {formatCurrency(basicSalary)}
                    </span>
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
                    <span className="text-xs font-semibold text-green-700">
                      {formatCurrency(overtimeAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-600 font-medium">Net Salary</span>
                    <span className="text-xs font-semibold text-green-700">
                      {formatCurrency(netSalary)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Attendance Record */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-200">
                Attendance Record
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse rounded-lg overflow-hidden shadow-md">
                  <thead>
                    <tr>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day, _idx) => (
                        <th
                          key={day}
                          className="bg-gray-900 text-white font-semibold p-1 text-center text-xs"
                        >
                          {day.toString().padStart(2, '0')}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const date = new Date(
                          `${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
                        );
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        return (
                          <th
                            key={`day-${day}`}
                            className="bg-gray-900 text-gray-300 font-medium p-1 text-center text-xs"
                          >
                            {dayName.substring(0, 1).toUpperCase()}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        // Create date string in YYYY-MM-DD format without timezone conversion
                        const dateString = `${payroll.year}-${String(payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayData = attendanceMap.get(dateString);
                        const dayName = new Date(
                          payroll.year,
                          payroll.month - 1,
                          day
                        ).toLocaleDateString('en-US', { weekday: 'short' });
                        const isFriday = dayName === 'Fri';

                        // Determine if absent - check if no timesheet entry exists or if hours are 0
                        const isAbsent =
                          !dayData ||
                          (Number(dayData.hours) === 0 && Number(dayData.overtime) === 0);

                        // Get the display value
                        let displayValue = '-';
                        let cellClass = 'bg-white';

                        // Priority: Regular hours > Friday logic > Absent
                        if (
                          dayData &&
                          (Number(dayData.hours) > 0 || Number(dayData.overtime) > 0)
                        ) {
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

                          const thursdayAbsent =
                            !thursdayData ||
                            (Number(thursdayData.hours) === 0 &&
                              Number(thursdayData.overtime) === 0);
                          const saturdayAbsent =
                            !saturdayData ||
                            (Number(saturdayData.hours) === 0 &&
                              Number(saturdayData.overtime) === 0);

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
                          <td
                            key={`attendance-${day}`}
                            className={`border p-1 text-xs text-center ${cellClass}`}
                          >
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
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
                          <td
                            key={`overtime-${day}`}
                            className={`border p-1 text-xs text-center ${cellClass}`}
                          >
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                <span className="text-green-700 font-semibold">8</span> = regular hours,{' '}
                <span className="text-blue-700 font-semibold">More than 8</span> = overtime hours,{' '}
                <span className="text-red-700 font-semibold">A</span> = absent,{' '}
                <span className="font-semibold">F</span> = Friday (present if working days
                before/after)
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
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Hours Breakdown
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">
                          Total Hours Worked
                        </span>
                        <span className="text-xs font-semibold text-gray-900">
                          {totalWorkedHoursFromAttendance} hrs
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Regular Hours</span>
                        <span className="text-xs font-semibold text-gray-900">
                          {totalWorkedHoursFromAttendance - overtimeHoursFromAttendance} hrs
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Overtime Hours</span>
                        <span className="text-xs font-semibold text-green-700">
                          {overtimeHoursFromAttendance} hrs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Attendance Summary
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Days Worked</span>
                        <span className="text-xs font-semibold text-gray-900">
                          {daysWorkedFromAttendance} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Absent Days</span>
                        <span className="text-xs font-semibold text-red-700">
                          {absentDays} days
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs text-gray-600 font-medium">Absent Deduction</span>
                      <span className="text-xs font-semibold text-red-700">
                        -{formatCurrency(absentDeduction)}
                      </span>
                    </div>
                    {shortHoursDeduction > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Short Hours Deduction</span>
                        <span className="text-xs font-semibold text-red-700">
                          -{formatCurrency(shortHoursDeduction)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Salary Breakdown</h3>
                <div className="space-y-2">
                  {/* Earnings Section */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Earnings
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Basic Salary</span>
                        <span className="text-xs font-semibold text-green-700">
                          {formatCurrency(basicSalary)}
                        </span>
                      </div>
                      {Number(employee?.food_allowance) > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-gray-600 font-medium">Food Allowance</span>
                          <span className="text-xs font-semibold text-gray-900">
                            {formatCurrency(Number(employee.food_allowance))}
                          </span>
                        </div>
                      )}
                      {Number(employee?.housing_allowance) > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-gray-600 font-medium">
                            Housing Allowance
                          </span>
                          <span className="text-xs font-semibold text-gray-900">
                            {formatCurrency(Number(employee.housing_allowance))}
                          </span>
                        </div>
                      )}
                      {Number(employee?.transport_allowance) > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-gray-600 font-medium">
                            Transport Allowance
                          </span>
                          <span className="text-xs font-semibold text-gray-900">
                            {formatCurrency(Number(employee.transport_allowance))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Overtime Pay</span>
                        <span className="text-xs font-semibold text-green-700">
                          {formatCurrency(overtimeAmount)}
                        </span>
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
                              {employee?.overtime_rate_multiplier === 0 && employee?.overtime_fixed_rate && employee.overtime_fixed_rate > 0
                                ? `${formatCurrency(Number(employee.overtime_fixed_rate))}/hr (Fixed)`
                                : `${employee?.overtime_rate_multiplier || 1.5}x (Basic/${new Date(payroll?.year || new Date().getFullYear(), payroll?.month || new Date().getMonth() + 1, 0).getDate()}/${employee?.contract_hours_per_day || 8})`}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Bonus Amount</span>
                        <span className="text-xs font-semibold text-green-700">
                          {formatCurrency(bonusAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Section */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Deductions
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">
                          Absent Days Deduction
                        </span>
                        <span className="text-xs font-semibold text-red-700">
                          -{formatCurrency(absentDeduction)}
                        </span>
                      </div>
                      {shortHoursDeduction > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-gray-600 font-medium">
                            Short Hours Deduction
                          </span>
                          <span className="text-xs font-semibold text-red-700">
                            -{formatCurrency(shortHoursDeduction)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600 font-medium">Advance Deduction</span>
                        <span className="text-xs font-semibold text-red-700">
                          -{formatCurrency(advanceDeduction)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total Section */}
                  <div className="border-t-2 border-gray-300 pt-2">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-bold text-gray-900">Net Salary</span>
                      <span className="text-sm font-bold text-green-700">
                        {formatCurrency(netSalary)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Signatures Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Chief Accountant
                </h4>
                <div className="text-sm font-semibold text-gray-900 mb-4">Samir Taima</div>
                <div className="border-t border-gray-300 pt-1 text-xs text-gray-500">Signature</div>
              </div>
              <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Verified By
                </h4>
                <div className="text-sm font-semibold text-gray-900 mb-4">
                  Salem Samhan Al-Dosri
                </div>
                <div className="border-t border-gray-300 pt-1 text-xs text-gray-500">Signature</div>
              </div>
              <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Employee
                </h4>
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
