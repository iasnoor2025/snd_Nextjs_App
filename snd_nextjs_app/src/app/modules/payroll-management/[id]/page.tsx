"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  FileText, 
  Printer, 
  Share2, 
  Loader2, 
  User, 
  Calendar, 
  DollarSign, 
  Building, 
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Copy
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

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
  currency: string;
  created_at: string;
  updated_at: string;
  items: PayrollItem[];
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  paid: CheckCircle,
  cancelled: AlertCircle
};

export default function PayrollDetailsPage() {
  const params = useParams();
  const payrollId = params.id as string;

  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payroll/${payrollId}`);
      const data = await response.json();

      if (data.success) {
        setPayroll(data.data);
      } else {
        toast.error("Failed to fetch payroll details");
      }
    } catch (error) {
      console.error("Error fetching payroll:", error);
      toast.error("Error fetching payroll details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (payrollId) {
      fetchPayroll();
    }
  }, [payrollId]);

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return "Not specified";
    
    switch (method) {
      case "bank_transfer":
        return "Bank Transfer";
      case "check":
        return "Check";
      case "cash":
        return "Cash";
      default:
        return method;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  const handleDownloadPayslip = () => {
    console.log("Downloading payslip for payroll:", payrollId);
    toast.success("Payslip download started");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    console.log("Sharing payroll details");
    toast.success("Payroll details shared");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-700">Loading payroll details...</h3>
            <p className="text-gray-500">Please wait while we fetch the payroll information</p>
          </div>
        </div>
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payroll Not Found</h2>
            <p className="text-gray-600 mb-6">The requested payroll could not be found or may have been removed.</p>
            <Link href="/modules/payroll-management">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payroll Management
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const employeeName = payroll.employee ? 
    (payroll.employee.full_name || `${payroll.employee.first_name} ${payroll.employee.last_name}`) : 
    'Unknown Employee';

  const period = new Date(payroll.year, payroll.month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const grossPay = payroll.base_salary + payroll.overtime_amount + payroll.bonus_amount;
  const StatusIcon = statusIcons[payroll.status as keyof typeof statusIcons] || Clock;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/modules/payroll-management">
                <Button variant="ghost" size="sm" className="hover:bg-white/80">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Payroll Details</h1>
                <p className="text-gray-600">Payroll #{payroll.id} • {period}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPayslip}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Link href={`/modules/payroll-management/${payroll.id}/payslip`}>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View Payslip
                </Button>
              </Link>
              <Link href={`/modules/payroll-management/${payroll.id}/edit`}>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Payroll Overview Card */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Payroll #{payroll.id}</CardTitle>
                    <CardDescription className="text-blue-100">
                      {period} • {employeeName}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{formatCurrency(payroll.final_amount)}</div>
                    <div className="text-blue-100 text-sm">Net Pay</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Employee</p>
                      <p className="font-semibold">{employeeName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Period</p>
                      <p className="font-semibold">{period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Building className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-semibold">{payroll.employee?.department || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Briefcase className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Position</p>
                      <p className="font-semibold">{payroll.employee?.designation || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Employee Information */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      Employee Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Employee Name</Label>
                          <p className="text-lg font-semibold">{employeeName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Employee ID</Label>
                          <p className="text-lg">{payroll.employee?.file_number || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Department</Label>
                          <p className="text-lg">{payroll.employee?.department || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Position</Label>
                          <p className="text-lg">{payroll.employee?.designation || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payroll Information */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      Payroll Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Payroll Period</Label>
                          <p className="text-lg font-semibold">{period}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Payment Date</Label>
                          <p className="text-lg">
                            {payroll.paid_at ? format(new Date(payroll.paid_at), "PPP") : 'Not paid yet'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Payment Method</Label>
                          <p className="text-lg">{getPaymentMethodLabel(payroll.payment_method)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Status</Label>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4 text-gray-500" />
                            <Badge 
                              variant="outline" 
                              className={cn("text-sm font-medium", statusColors[payroll.status as keyof typeof statusColors])}
                            >
                              {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Salary Breakdown */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-indigo-600" />
                      </div>
                      Salary Breakdown
                    </CardTitle>
                    <CardDescription>Detailed breakdown of earnings and deductions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* Earnings */}
                      <div>
                        <h4 className="font-semibold mb-4 text-green-700 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Earnings
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-700">Basic Salary</span>
                            <span className="font-semibold">{formatCurrency(payroll.base_salary)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-700">Overtime Pay</span>
                            <span className="font-semibold text-blue-600">{formatCurrency(payroll.overtime_amount)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-700">Bonus</span>
                            <span className="font-semibold text-green-600">{formatCurrency(payroll.bonus_amount)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center py-2">
                            <span className="font-bold text-gray-900">Gross Pay</span>
                            <span className="font-bold text-xl text-green-600">{formatCurrency(grossPay)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div>
                        <h4 className="font-semibold mb-4 text-red-700 flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Deductions
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-700">Tax & Other Deductions</span>
                            <span className="font-semibold text-red-600">-{formatCurrency(payroll.deduction_amount)}</span>
                          </div>
                          {payroll.advance_deduction > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-gray-700">Advance Deduction</span>
                              <span className="font-semibold text-red-600">-{formatCurrency(payroll.advance_deduction)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between items-center py-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg px-4">
                            <span className="font-bold text-gray-900">Net Pay</span>
                            <span className="font-bold text-2xl text-green-600">{formatCurrency(payroll.final_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                

                {/* Notes */}
                {payroll.notes && (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <FileText className="h-5 w-5 text-yellow-600" />
                        </div>
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">{payroll.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href={`/modules/payroll-management/${payroll.id}/edit`}>
                      <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Payroll
                      </Button>
                    </Link>
                    <Link href={`/modules/payroll-management/${payroll.id}/payslip`}>
                      <Button variant="outline" className="w-full justify-start">
                        <Eye className="h-4 w-4 mr-2" />
                        View Payslip
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full justify-start" onClick={handleDownloadPayslip}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Payslip
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={handlePrint}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </CardContent>
                </Card>

                {/* Audit Information */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Audit Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Created</Label>
                        <p className="text-sm">{format(new Date(payroll.created_at), "PPP 'at' p")}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                        <p className="text-sm">{format(new Date(payroll.updated_at), "PPP 'at' p")}</p>
                      </div>
                      {payroll.approved_at && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Approved</Label>
                          <p className="text-sm">{format(new Date(payroll.approved_at), "PPP 'at' p")}</p>
                        </div>
                      )}
                      {payroll.paid_at && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Paid</Label>
                          <p className="text-sm">{format(new Date(payroll.paid_at), "PPP 'at' p")}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Details */}
                {payroll.payment_reference && (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Payment Method</Label>
                          <p className="text-sm font-semibold">{getPaymentMethodLabel(payroll.payment_method)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Reference</Label>
                          <p className="text-sm font-mono bg-gray-100 p-2 rounded">{payroll.payment_reference}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
