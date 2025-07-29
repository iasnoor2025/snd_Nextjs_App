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

interface Payroll {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_number: string;
  department: string;
  position: string;
  period: string;
  gross_pay: number;
  net_pay: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_pay: number;
  payment_date: string;
  payment_method: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const mockPayroll: Payroll = {
  id: "1",
  employee_id: "1",
  employee_name: "John Doe",
  employee_number: "EMP001",
  department: "Engineering",
  position: "Software Engineer",
  period: "January 2024",
  gross_pay: 5000,
  net_pay: 3800,
  basic_salary: 4000,
  allowances: 500,
  deductions: 1200,
  overtime_hours: 10,
  overtime_rate: 25,
  overtime_pay: 250,
  payment_date: "2024-01-31",
  payment_method: "bank_transfer",
  status: "processed",
  notes: "Regular monthly payroll with overtime compensation for project deadlines.",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-30T14:30:00Z"
};

export default function PayrollDetailsPage() {
  const params = useParams();
  const payrollId = params.id as string;

  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading payroll data
    setTimeout(() => {
      setPayroll(mockPayroll);
      setLoading(false);
    }, 1000);
  }, [payrollId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-green-100 text-green-800">Processed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
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

  const handleDownloadPayslip = () => {
    // Simulate download
    console.log("Downloading payslip for payroll:", payrollId);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    // Simulate share functionality
    console.log("Sharing payroll details");
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
            <p className="text-gray-600">Payroll #{payroll.id} - {payroll.period}</p>
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
                <CardTitle className="text-xl">{payroll.employee_name}</CardTitle>
                <CardDescription>
                  {payroll.position} • {payroll.department}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  ${payroll.net_pay.toLocaleString()}
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
                  <div className="text-sm">{payroll.employee_name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Employee ID</div>
                  <div className="text-sm">{payroll.employee_number}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Department</div>
                  <div className="text-sm">{payroll.department}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Position</div>
                  <div className="text-sm">{payroll.position}</div>
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
                  <div className="text-sm">{payroll.period}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Payment Date</div>
                  <div className="text-sm">{format(new Date(payroll.payment_date), "PPP")}</div>
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
                    <span>${payroll.basic_salary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allowances</span>
                    <span>${payroll.allowances.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Pay ({payroll.overtime_hours} hrs @ ${payroll.overtime_rate}/hr)</span>
                    <span>${payroll.overtime_pay.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Gross Pay</span>
                    <span className="text-green-600">${payroll.gross_pay.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold mb-3 text-red-700">Deductions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Deductions</span>
                    <span className="text-red-600">-${payroll.deductions.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Net Pay</span>
                    <span className="text-green-600">${payroll.net_pay.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
