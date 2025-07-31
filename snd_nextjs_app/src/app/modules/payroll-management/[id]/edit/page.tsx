"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Loader2, User, Calendar, DollarSign, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";

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

export default function EditPayrollPage() {
  const params = useParams();
  const router = useRouter();
  const payrollId = params.id as string;

  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    base_salary: "",
    overtime_amount: "",
    bonus_amount: "",
    deduction_amount: "",
    advance_deduction: "",
    notes: "",
    status: ""
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Fetch payroll data from API
    const fetchPayroll = async () => {
      try {
        setInitialLoading(true);
        const response = await fetch(`/api/payroll/${payrollId}`);
        const data = await response.json();

        if (data.success) {
          setPayroll(data.data);
          setFormData({
            base_salary: data.data.base_salary.toString(),
            overtime_amount: data.data.overtime_amount.toString(),
            bonus_amount: data.data.bonus_amount.toString(),
            deduction_amount: data.data.deduction_amount.toString(),
            advance_deduction: data.data.advance_deduction.toString(),
            notes: data.data.notes || "",
            status: data.data.status
          });
        } else {
          toast.error("Failed to fetch payroll details");
        }
      } catch (error) {
        console.error("Error fetching payroll:", error);
        toast.error("Error fetching payroll details");
      } finally {
        setInitialLoading(false);
      }
    };

    if (payrollId) {
      fetchPayroll();
    }
  }, [payrollId]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    if (payrollId) {
      fetchEmployees();
    }
  }, [payrollId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/payroll/${payrollId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base_salary: parseFloat(formData.base_salary),
          overtime_amount: parseFloat(formData.overtime_amount),
          bonus_amount: parseFloat(formData.bonus_amount),
          deduction_amount: parseFloat(formData.deduction_amount),
          advance_deduction: parseFloat(formData.advance_deduction),
          notes: formData.notes,
          status: formData.status
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Payroll updated successfully");
        router.push(`/modules/payroll-management/${payrollId}`);
      } else {
        toast.error(data.message || "Failed to update payroll");
      }
    } catch (error) {
      console.error("Error updating payroll:", error);
      toast.error("Error updating payroll");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateNetPay = () => {
    const baseSalary = parseFloat(formData.base_salary) || 0;
    const overtimeAmount = parseFloat(formData.overtime_amount) || 0;
    const bonusAmount = parseFloat(formData.bonus_amount) || 0;
    const deductionAmount = parseFloat(formData.deduction_amount) || 0;
    const advanceDeduction = parseFloat(formData.advance_deduction) || 0;

    return baseSalary + overtimeAmount + bonusAmount - deductionAmount - advanceDeduction;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  if (initialLoading) {
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

  const netPay = calculateNetPay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href={`/modules/payroll-management/${payrollId}`}>
                <Button variant="ghost" size="sm" className="hover:bg-white/80">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Payroll</h1>
                <p className="text-gray-600">Modify payroll record for {employeeName}</p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn("text-sm font-medium", statusColors[formData.status as keyof typeof statusColors])}
            >
              {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
            </Badge>
          </div>

          <form onSubmit={handleSubmit}>
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
                      <div className="text-2xl font-bold">{formatCurrency(netPay)}</div>
                      <div className="text-blue-100 text-sm">Net Pay</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">File Number</p>
                        <p className="font-semibold">{payroll.employee?.file_number || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Salary Components */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Status Selection */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        Payroll Status
                      </CardTitle>
                      <CardDescription>Update the payroll processing status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Salary Breakdown */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        Salary Breakdown
                      </CardTitle>
                      <CardDescription>Edit salary components and amounts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="base_salary" className="text-sm font-medium">Base Salary</Label>
                          <Input
                            id="base_salary"
                            type="number"
                            step="0.01"
                            value={formData.base_salary}
                            onChange={(e) => handleInputChange("base_salary", e.target.value)}
                            placeholder="0.00"
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="overtime_amount" className="text-sm font-medium">Overtime Amount</Label>
                          <Input
                            id="overtime_amount"
                            type="number"
                            step="0.01"
                            value={formData.overtime_amount}
                            onChange={(e) => handleInputChange("overtime_amount", e.target.value)}
                            placeholder="0.00"
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bonus_amount" className="text-sm font-medium">Bonus Amount</Label>
                          <Input
                            id="bonus_amount"
                            type="number"
                            step="0.01"
                            value={formData.bonus_amount}
                            onChange={(e) => handleInputChange("bonus_amount", e.target.value)}
                            placeholder="0.00"
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deduction_amount" className="text-sm font-medium">Deduction Amount</Label>
                          <Input
                            id="deduction_amount"
                            type="number"
                            step="0.01"
                            value={formData.deduction_amount}
                            onChange={(e) => handleInputChange("deduction_amount", e.target.value)}
                            placeholder="0.00"
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="advance_deduction" className="text-sm font-medium">Advance Deduction</Label>
                          <Input
                            id="advance_deduction"
                            type="number"
                            step="0.01"
                            value={formData.advance_deduction}
                            onChange={(e) => handleInputChange("advance_deduction", e.target.value)}
                            placeholder="0.00"
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        Notes
                      </CardTitle>
                      <CardDescription>Add any additional notes about this payroll</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        placeholder="Add any notes about this payroll..."
                        rows={4}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-6">
                  {/* Salary Summary */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-indigo-600" />
                        </div>
                        Salary Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Base Salary:</span>
                          <span className="font-semibold">{formatCurrency(parseFloat(formData.base_salary) || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Overtime:</span>
                          <span className="font-semibold text-blue-600">{formatCurrency(parseFloat(formData.overtime_amount) || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Bonus:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(parseFloat(formData.bonus_amount) || 0)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Deductions:</span>
                          <span className="font-semibold text-red-600">-{formatCurrency(parseFloat(formData.deduction_amount) || 0)}</span>
                        </div>
                        {parseFloat(formData.advance_deduction) > 0 && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600">Advance Deduction:</span>
                            <span className="font-semibold text-red-600">-{formatCurrency(parseFloat(formData.advance_deduction) || 0)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center py-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg px-3">
                          <span className="font-bold text-gray-900">Net Pay:</span>
                          <span className="font-bold text-2xl text-green-600">{formatCurrency(netPay)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Link href={`/modules/payroll-management/${payrollId}`}>
                        <Button variant="outline" className="w-full justify-start">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/modules/payroll-management/${payrollId}/payslip`}>
                        <Button variant="outline" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          View Payslip
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6">
                <Link href={`/modules/payroll-management/${payrollId}`}>
                  <Button variant="outline" type="button" className="px-8">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
