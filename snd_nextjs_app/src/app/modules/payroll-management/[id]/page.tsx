"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Download, FileText, Printer, Share2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

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
    // Simulate download
    console.log("Downloading payslip for payroll:", payrollId);
    toast.success("Payslip download started");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    // Simulate share functionality
    console.log("Sharing payroll details");
    toast.success("Payroll details shared");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading payroll details...</span>
        </div>
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Payroll not found</h2>
          <p className="text-gray-600">The requested payroll could not be found.</p>
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/modules/payroll-management">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Payroll Details</h1>
            <p className="text-gray-600">Payroll #{payroll.id} - {period}</p>
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
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Header Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{employeeName}</CardTitle>
                <CardDescription>
                  {payroll.employee?.designation || 'N/A'} • {payroll.employee?.department || 'N/A'}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(payroll.final_amount)}
                </div>
                <div className="text-sm text-gray-500">Net Pay</div>
                {getStatusBadge(payroll.status)}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Employee Name</div>
                  <div className="text-sm">{employeeName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Employee ID</div>
                  <div className="text-sm">{payroll.employee?.file_number || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Department</div>
                  <div className="text-sm">{payroll.employee?.department || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Position</div>
                  <div className="text-sm">{payroll.employee?.designation || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payroll Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Payroll Period</div>
                  <div className="text-sm">{period}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Payment Date</div>
                  <div className="text-sm">
                    {payroll.paid_at ? format(new Date(payroll.paid_at), "PPP") : 'Not paid yet'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Payment Method</div>
                  <div className="text-sm">{getPaymentMethodLabel(payroll.payment_method)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <div className="text-sm">{getStatusBadge(payroll.status)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Salary Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Breakdown</CardTitle>
            <CardDescription>Detailed breakdown of earnings and deductions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Earnings */}
              <div>
                <h4 className="font-semibold mb-3 text-green-700">Earnings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Basic Salary</span>
                    <span>{formatCurrency(payroll.base_salary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Pay</span>
                    <span>{formatCurrency(payroll.overtime_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bonus</span>
                    <span>{formatCurrency(payroll.bonus_amount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Gross Pay</span>
                    <span className="text-green-600">{formatCurrency(grossPay)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold mb-3 text-red-700">Deductions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tax & Other Deductions</span>
                    <span className="text-red-600">-{formatCurrency(payroll.deduction_amount)}</span>
                  </div>
                  {payroll.advance_deduction > 0 && (
                    <div className="flex justify-between">
                      <span>Advance Deduction</span>
                      <span className="text-red-600">-{formatCurrency(payroll.advance_deduction)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Net Pay</span>
                    <span className="text-green-600">{formatCurrency(payroll.final_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Items */}
        {payroll.items && payroll.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payroll Items</CardTitle>
              <CardDescription>Detailed breakdown of all payroll components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payroll.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-gray-500">{item.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.amount)}</div>
                      {item.is_taxable && (
                        <div className="text-xs text-gray-500">Taxable ({item.tax_rate}%)</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {payroll.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{payroll.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Audit Information */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-sm font-medium text-gray-500">Created</div>
                <div className="text-sm">{format(new Date(payroll.created_at), "PPP 'at' p")}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Last Updated</div>
                <div className="text-sm">{format(new Date(payroll.updated_at), "PPP 'at' p")}</div>
              </div>
              {payroll.approved_at && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Approved</div>
                  <div className="text-sm">{format(new Date(payroll.approved_at), "PPP 'at' p")}</div>
                </div>
              )}
              {payroll.paid_at && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Paid</div>
                  <div className="text-sm">{format(new Date(payroll.paid_at), "PPP 'at' p")}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
