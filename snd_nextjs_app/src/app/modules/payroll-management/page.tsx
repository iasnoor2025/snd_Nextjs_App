"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  FileText,
  BarChart3,
  TrendingUp,
  Settings,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Printer,
  Share2,
  FileDown,
  Ban,
  AlertCircle,
  CheckSquare,
  Square,
  Play,
  Zap,
  CalendarDays,
  Users,
  Upload,
  Shield,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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

interface PayrollResponse {
  data: Payroll[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  first_page_url: string;
  last_page_url: string;
  path: string;
  links: any[];
}

export default function PayrollManagementPage() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [payrolls, setPayrolls] = useState<PayrollResponse | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayrolls, setSelectedPayrolls] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateEmployee, setGenerateEmployee] = useState<string>("all");
  const [generateStartMonth, setGenerateStartMonth] = useState<string>("");
  const [generateEndMonth, setGenerateEndMonth] = useState<string>("");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");

  // Get allowed actions for payroll management
  const allowedActions = getAllowedActions('Payroll');

  // Fetch payrolls from API
  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: "10"
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (monthFilter) {
        params.append("month", monthFilter.toISOString().slice(0, 7)); // Format as YYYY-MM
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/payroll?${params}`);
      const data = await response.json();

      if (data.success) {
        setPayrolls(data);
      } else {
        toast.error("Failed to fetch payrolls");
      }
    } catch (error) {
      toast.error("Error fetching payrolls");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for filter
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
    fetchPayrolls();
    fetchEmployees();
  }, [currentPage, statusFilter, monthFilter, searchTerm]);

  const handleGenerate = async () => {
    if (!monthFilter) {
      toast.error("Please select a month");
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch("/api/payroll/generate-monthly", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ month: monthFilter.toISOString().slice(0, 7) }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setIsGenerateDialogOpen(false);
        setMonthFilter(undefined);
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to generate payroll");
      }
    } catch (error) {
      toast.error("Error generating payroll");
      console.error("Error:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateApproved = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/payroll/generate-payroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setIsApproveDialogOpen(false);
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to generate payroll for approved timesheets");
      }
    } catch (error) {
      toast.error("Error generating payroll for approved timesheets");
      console.error("Error:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAllMonths = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/payroll/generate-all-months", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: null, // No specific employee filter for all months
          start_month: monthFilter?.toISOString().slice(0, 7) || null,
          end_month: monthFilter?.toISOString().slice(0, 7) || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setIsGenerateDialogOpen(false);
        setMonthFilter(undefined);
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to generate payroll for all months");
      }
    } catch (error) {
      toast.error("Error generating payroll for all months");
      console.error("Error:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (payrollId: number) => {
    try {
      const response = await fetch(`/api/payroll/${payrollId}/approve`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Payroll approved successfully");
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to approve payroll");
      }
    } catch (error) {
      toast.error("Error approving payroll");
      console.error("Error:", error);
    }
  };

  const handleProcessPayment = async (payrollId: number) => {
    try {
      const response = await fetch(`/api/payroll/${payrollId}/process-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_method: "bank_transfer",
          reference: `PAY-${payrollId}-${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Payment processed successfully");
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to process payment");
      }
    } catch (error) {
      toast.error("Error processing payment");
      console.error("Error:", error);
    }
  };

  const handleCancel = async (payrollId: number) => {
    if (!confirm("Are you sure you want to cancel this payroll?")) {
      return;
    }

    try {
      const response = await fetch(`/api/payroll/${payrollId}/cancel`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Payroll cancelled successfully");
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to cancel payroll");
      }
    } catch (error) {
      toast.error("Error cancelling payroll");
      console.error("Error:", error);
    }
  };

  const handleDelete = async (payrollId: number) => {
    if (!confirm("Are you sure you want to delete this payroll?")) {
      return;
    }

    try {
      const response = await fetch(`/api/payroll/${payrollId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Payroll deleted successfully");
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to delete payroll");
      }
    } catch (error) {
      toast.error("Error deleting payroll");
      console.error("Error:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPayrolls.size === 0) {
      toast.error("Please select payrolls to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedPayrolls.size} payroll(s)?`)) {
      return;
    }

    try {
      const response = await fetch("/api/payroll/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payroll_ids: Array.from(selectedPayrolls) }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setSelectedPayrolls(new Set());
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to delete payrolls");
      }
    } catch (error) {
      toast.error("Error deleting payrolls");
      console.error("Error:", error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayrolls(new Set(payrolls?.data.map(p => p.id) || []));
    } else {
      setSelectedPayrolls(new Set());
    }
  };

  const handleSelectPayroll = (payrollId: number, checked: boolean) => {
    if (checked) {
      setSelectedPayrolls(prev => new Set([...prev, payrollId]));
    } else {
      setSelectedPayrolls(prev => new Set([...prev].filter(id => id !== payrollId)));
    }
  };

  const handleDownloadPayslip = async (payrollId: number) => {
    try {
      const response = await fetch(`/api/payroll/${payrollId}/payslip`);
      const data = await response.json();

      if (data.success) {
        // In a real implementation, this would generate and download a PDF
        toast.success("Payslip downloaded successfully");
      } else {
        toast.error(data.message || "Failed to download payslip");
      }
    } catch (error) {
      toast.error("Error downloading payslip");
      console.error("Error:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, text: "Pending" },
      approved: { variant: "default" as const, text: "Approved" },
      paid: { variant: "default" as const, text: "Paid" },
      cancelled: { variant: "destructive" as const, text: "Cancelled" },
      processed: { variant: "default" as const, text: "Processed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: "secondary" as const, text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Payroll' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payrolls...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Payroll' }}>
      <div className="w-full space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Payroll Management</h1>
            <p className="text-muted-foreground">Manage employee payrolls and payments</p>
          </div>
          <div className="flex gap-2">
            <Can action="export" subject="Payroll">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </Can>

            <Can action="create" subject="Payroll">
              <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Generate Monthly
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Monthly Payroll</DialogTitle>
                  <DialogDescription>
                    Generate payroll for all employees for a specific month
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="generate-month">Select Month</Label>
                    <Input
                      id="generate-month"
                      type="month"
                      value={monthFilter ? monthFilter.toISOString().slice(0, 7) : ""}
                      onChange={(e) => setMonthFilter(new Date(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)} disabled={generating}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerate} disabled={generating}>
                    {generating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Payroll"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </Can>

          <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Generate for Approved
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Payroll for Approved Timesheets</DialogTitle>
                <DialogDescription>
                  Generate payroll for all employees who have manager-approved timesheets
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={generating}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateApproved} disabled={generating}>
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Payroll"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Generate All Months
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Payroll for All Months</DialogTitle>
                <DialogDescription>
                  Generate payroll for all months that need it (checks for approved timesheets and skips existing payrolls)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="generate-employee">Employee (Optional)</Label>
                  <Select value={generateEmployee} onValueChange={setGenerateEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="generate-start-month">Start Month (Optional)</Label>
                  <Input
                    id="generate-start-month"
                    type="month"
                    value={generateStartMonth}
                    onChange={(e) => setGenerateStartMonth(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="generate-end-month">End Month (Optional)</Label>
                  <Input
                    id="generate-end-month"
                    type="month"
                    value={generateEndMonth}
                    onChange={(e) => setGenerateEndMonth(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)} disabled={generating}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateAllMonths} disabled={generating}>
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Payroll"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link href="/modules/payroll-management/reports">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </Link>
          <Link href="/modules/payroll-management/salary-advances">
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Salary Advances
            </Button>
          </Link>
          <Link href="/modules/payroll-management/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Link href="/modules/payroll-management/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Payroll
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search payrolls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                value={monthFilter ? monthFilter.toISOString().slice(0, 7) : ""}
                onChange={(e) => setMonthFilter(new Date(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPayrolls.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedPayrolls.size} payroll(s) selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPayrolls(new Set())}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payrolls Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payrolls ({payrolls?.total || 0} total)</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedPayrolls.size === (payrolls?.data.length || 0) && (payrolls?.data.length || 0) > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Final Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls?.data.map((payroll) => (
                    <TableRow key={payroll.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPayrolls.has(payroll.id)}
                          onCheckedChange={(checked) =>
                            handleSelectPayroll(payroll.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payroll.employee.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {payroll.employee.department} • {payroll.employee.designation}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(payroll.year, payroll.month - 1).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{formatCurrency(payroll.base_salary)}</TableCell>
                      <TableCell>{formatCurrency(payroll.overtime_amount)}</TableCell>
                      <TableCell>{formatCurrency(payroll.bonus_amount)}</TableCell>
                      <TableCell>{formatCurrency(payroll.deduction_amount)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payroll.final_amount)}</TableCell>
                      <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                      <TableCell>{formatDate(payroll.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/modules/payroll-management/${payroll.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/modules/payroll-management/${payroll.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPayslip(payroll.id)}
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          {payroll.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(payroll.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {payroll.status === "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProcessPayment(payroll.id)}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          {payroll.status !== "paid" && payroll.status !== "cancelled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(payroll.id)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(payroll.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {payrolls && payrolls.last_page > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={payrolls.last_page}
                    totalItems={payrolls.total}
                    itemsPerPage={payrolls.per_page}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Role-based content example */}
      <RoleBased roles={['ADMIN', 'MANAGER']}>
        <Card>
          <CardHeader>
            <CardTitle>Payroll Administration</CardTitle>
            <CardDescription>
              Advanced payroll management features for administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Can action="approve" subject="Payroll">
                <Button variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve All Pending
                </Button>
              </Can>

              <Can action="manage" subject="Payroll">
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Payroll Settings
                </Button>
              </Can>

              <Can action="export" subject="Payroll">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Reports
                </Button>
              </Can>
            </div>
          </CardContent>
        </Card>
      </RoleBased>
    </div>
  </ProtectedRoute>
  );
}
