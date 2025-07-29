"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Edit,
  Eye,
  Download,
  Printer,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  FileText,
  Award,
  Car,
  Truck,
  IdCard,
  CreditCard,
  History,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  Loader2,
  FileBox,
  Upload,
  Receipt,
  Ellipsis
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import AssignmentModal from "@/components/AssignmentModal";
import { DailyTimesheetRecords } from "@/components/DailyTimesheetRecords";

interface Employee {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone: string;
  employee_id: string;
  file_number: string;
  status: string;
  hire_date: string;
  date_of_birth?: string;
  nationality: string;
  current_location?: string;
  hourly_rate?: number;
  monthly_deduction?: number;
  department?: {
    id: number;
    name: string;
  };
  designation?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  supervisor?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  erp_employee_id?: string;
  iqama_number?: string;
  iqama_expiry?: string;
  iqama_cost?: number;
  passport_number?: string;
  passport_expiry?: string;
  driving_license_number?: string;
  driving_license_expiry?: string;
  driving_license_cost?: number;
  operator_license_number?: string;
  operator_license_expiry?: string;
  operator_license_cost?: number;
  tuv_certification_number?: string;
  tuv_certification_expiry?: string;
  tuv_certification_cost?: number;
  spsp_license_number?: string;
  spsp_license_expiry?: string;
  spsp_license_cost?: number;
  current_assignment?: any;
}

interface Timesheet {
  id: number;
  date: string;
  clock_in?: string;
  clock_out?: string;
  regular_hours?: number;
  overtime_hours?: number;
  status: string;
  project?: {
    id: string;
    name: string;
  };
  rental?: {
    id: string;
    rentalNumber: string;
    projectName: string;
  };
  assignment?: {
    id: string;
    name: string;
    type: string;
  };
  notes?: string;
  description?: string;
  tasksCompleted?: string;
}

interface LeaveRequest {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  return_date?: string;
}

interface Advance {
  id: number;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'partially_repaid';
  created_at: string;
  type: 'advance' | 'advance_payment';
  monthly_deduction?: number;
  repaid_amount?: number;
  remaining_balance?: number;
}

interface Assignment {
  id: string;
  name: string;
  type: string;
  status: string;
  location?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  assignedById?: string;
  projectId?: string;
  rentalId?: string;
  assignedBy?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
    status: string;
  };
  rental?: {
    id: string;
    rentalNumber: string;
    projectName: string;
    status: string;
  };
}

interface FinalSettlement {
  id: number;
  settlement_date: string;
  amount: number;
  status: string;
  reason?: string;
}

export default function EmployeeShowPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal-info");
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [finalSettlements, setFinalSettlements] = useState<FinalSettlement[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [totalRepaid, setTotalRepaid] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedPayslipDate, setSelectedPayslipDate] = useState(new Date());
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData();
    }
  }, [employeeId]);

  // Refetch timesheets when selected month changes
  useEffect(() => {
    if (employeeId && selectedMonth) {
      fetchTimesheetsForMonth();
    }
  }, [employeeId, selectedMonth]);

  const fetchTimesheetsForMonth = async () => {
    try {
      console.log('Fetching timesheets for month:', selectedMonth);
      const response = await fetch(`/api/employees/${employeeId}/timesheets?month=${selectedMonth}`);
      const data = await response.json();
      console.log('Timesheets data:', data);
      setTimesheets(data.data || []);
    } catch (error) {
      console.error('Error fetching timesheets for month:', error);
    }
  };

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      // Fetch employee data
      const employeeResponse = await fetch(`/api/employees/${employeeId}`);
      const employeeData = await employeeResponse.json();

      // Handle the API response structure - employee data might be nested or direct
      const employee = employeeData.employee || employeeData;
      setEmployee(employee);

      // Fetch related data
      const [timesheetsRes, leaveRequestsRes, advancesRes, assignmentsRes, settlementsRes] = await Promise.all([
        fetch(`/api/employees/${employeeId}/timesheets?month=${selectedMonth}`),
        fetch(`/api/employees/${employeeId}/leave-requests`),
        fetch(`/api/employees/${employeeId}/advances`),
        fetch(`/api/employees/${employeeId}/assignments`),
        fetch(`/api/employees/${employeeId}/final-settlements`)
      ]);

      const timesheetsData = await timesheetsRes.json();
      const leaveRequestsData = await leaveRequestsRes.json();
      const advancesData = await advancesRes.json();
      const assignmentsData = await assignmentsRes.json();
      const settlementsData = await settlementsRes.json();

      setTimesheets(timesheetsData.data || []);
      setLeaveRequests(leaveRequestsData.data || []);
      setAdvances(advancesData.data || []);
      setAssignments(assignmentsData.assignments || []);
      setFinalSettlements(settlementsData.data || []);

      // Calculate current balance
      const totalAdvances = advancesData.data?.reduce((sum: number, advance: Advance) =>
        advance.status === 'approved' ? sum + advance.amount : sum, 0) || 0;
      const totalRepaidAmount = advancesData.data?.reduce((sum: number, advance: Advance) =>
        sum + (advance.repaid_amount || 0), 0) || 0;

      setCurrentBalance(totalAdvances - totalRepaidAmount);
      setTotalRepaid(totalRepaidAmount);

    } catch (error) {
      console.error("Error fetching employee data:", error);
      toast.error("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status) return null;

    const statusConfig = {
      active: { variant: "default", className: "bg-green-100 text-green-800 border-green-300" },
      inactive: { variant: "secondary", className: "bg-gray-100 text-gray-800 border-gray-300" },
      on_leave: { variant: "outline", className: "bg-blue-100 text-blue-800 border-blue-300" },
      terminated: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-300" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;

    return (
      <Badge variant={config.variant as any} className={config.className}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const calculateMonthlySummary = (timesheetData: Timesheet[]) => {
    const totalHours = timesheetData.reduce((sum, timesheet) =>
      sum + (timesheet.regular_hours || 0), 0);
    const totalOvertime = timesheetData.reduce((sum, timesheet) =>
      sum + (timesheet.overtime_hours || 0), 0);
    const totalDays = timesheetData.length;

    return { totalHours, totalOvertime, totalDays };
  };

  // Format timesheet data for daily records component
  const formatDailyRecords = (timesheets: Timesheet[]) => {
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);
    const daysInMonth = endDate.getDate();

    // Create an array for all days in the month
    const dailyRecords = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(Number(year), Number(month) - 1, i + 1);
      return {
        date: format(date, 'yyyy-MM-dd'),
        day: format(date, 'd'),
        dayName: format(date, 'EEE'),
        regularHours: 0,
        overtimeHours: 0,
        status: 'absent',
        isWeekend: date.getDay() === 0 || date.getDay() === 6, // 0 is Sunday, 6 is Saturday
      };
    });

    // Fill in the timesheet data
    timesheets.forEach((timesheet) => {
      const date = format(new Date(timesheet.date), 'yyyy-MM-dd');
      const record = dailyRecords.find((r) => r.date === date);
      if (record) {
        record.regularHours = Number(timesheet?.regular_hours || 0);
        record.overtimeHours = Number(timesheet?.overtime_hours || 0);
        record.status = timesheet?.status || 'present';
      }
    });

    return dailyRecords;
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setShowAssignmentModal(true);
  };

  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const [assignmentDeleteDialogOpen, setAssignmentDeleteDialogOpen] = useState(false);

  const handleDeleteAssignment = (assignmentId: string) => {
    setAssignmentToDelete(assignmentId);
    setAssignmentDeleteDialogOpen(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    setAssignmentLoading(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/assignments/${assignmentToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Assignment deleted successfully');
        fetchEmployeeData(); // Refresh the data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    } finally {
      setAssignmentLoading(false);
    }
  };

    const handleDeleteEmployee = () => {
    if (!employee) return;
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employee) return;

    try {
      toast.loading("Deleting employee...");

      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      toast.success("Employee deleted successfully");
      // Redirect to employee list
      window.location.href = '/modules/employee-management';
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error("Failed to delete employee");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading employee information...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <h3 className="mt-2 text-lg font-semibold">Employee not found</h3>
          <p className="mt-1 text-muted-foreground">The requested employee could not be found.</p>
          <Button className="mt-4" asChild>
            <Link href="/modules/employee-management">Back to Employees</Link>
          </Button>
        </div>
      </div>
    );
  }

  const monthlySummary = calculateMonthlySummary(timesheets);

  return (
    <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {employee.first_name?.[0] || ''}
              {employee.last_name?.[0] || ''}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {employee.first_name} {employee.middle_name ? `${employee.middle_name} ` : ''}
              {employee.last_name}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{employee.designation?.name || 'No Designation'}</span>
              <span className="text-xs">•</span>
              <span>ID: {employee.employee_id || 'N/A'}</span>
              {employee.status && getStatusBadge(employee.status)}
              <span className="text-xs">•</span>
              <Badge
                variant="outline"
                className={
                  !employee.current_location
                    ? 'border-gray-200 bg-gray-50 text-gray-500'
                    : employee.current_location === 'Available'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : employee.current_location === 'Inactive'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : employee.current_location.startsWith('On Leave')
                          ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                          : 'border-blue-200 bg-blue-50 text-blue-700'
                }
              >
                {employee.current_location || 'Not Assigned'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/modules/employee-management">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/modules/employee-management/${employee.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteEmployee}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button size="sm" asChild>
            <Link href={`/modules/employee-management/${employee.id}/advances`}>
              <CreditCard className="mr-2 h-4 w-4" />
              View Advances
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="personal-info" className="w-full">
        <TabsList className="flex w-full justify-between rounded-lg border bg-muted/30 p-1 shadow-sm">
          <TabsTrigger
            value="personal-info"
            className="flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <User className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger
            value="employment"
            className="flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Briefcase className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Employment</span>
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <FileBox className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger
            value="assignments"
            className="flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Assignments</span>
          </TabsTrigger>
          <TabsTrigger
            value="timesheets"
            className="flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Clock className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Timesheets</span>
          </TabsTrigger>
          <TabsTrigger
            value="leaves"
            className="flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Leaves</span>
          </TabsTrigger>
          <TabsTrigger
            value="advances"
            className="flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Advances</span>
          </TabsTrigger>
          <TabsTrigger
            value="resignations"
            className="flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Resignations</span>
          </TabsTrigger>
          <TabsTrigger
            value="final-settlements"
            className="flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Receipt className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Final Settlements</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal-info" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Basic Information</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">Full Name</dt>
                        <dd className="text-sm">
                          {employee.first_name} {employee.middle_name ? `${employee.middle_name} ` : ''}
                          {employee.last_name}
                        </dd>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">Phone</dt>
                        <dd className="text-sm">{employee.phone || 'Not set'}</dd>
                      </div>
                      {employee.nationality && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Nationality</dt>
                          <dd className="text-sm">{employee.nationality}</dd>
                        </div>
                      )}
                      {employee.date_of_birth && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Date of Birth</dt>
                          <dd className="text-sm">{formatDate(employee.date_of_birth)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Identification</h3>
                    <dl className="space-y-2">
                      {employee.iqama_number && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Iqama Number</dt>
                          <dd className="text-sm">{employee.iqama_number}</dd>
                        </div>
                      )}
                      {employee.iqama_expiry && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Iqama Expiry</dt>
                          <dd className="text-sm">{formatDate(employee.iqama_expiry)}</dd>
                        </div>
                      )}
                      {employee.passport_number && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Passport Number</dt>
                          <dd className="text-sm">{employee.passport_number}</dd>
                        </div>
                      )}
                      {employee.passport_expiry && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Passport Expiry</dt>
                          <dd className="text-sm">{formatDate(employee.passport_expiry)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Emergency Contact</h3>
                    <dl className="space-y-2">
                      {employee.emergency_contact_name && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Contact Name</dt>
                          <dd className="text-sm">{employee.emergency_contact_name}</dd>
                        </div>
                      )}
                      {employee.emergency_contact_phone && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Contact Phone</dt>
                          <dd className="text-sm">{employee.emergency_contact_phone}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Licenses & Certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {employee.driving_license_number && (
                    <div>
                      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Driving License</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">License Number</dt>
                          <dd className="text-sm">{employee.driving_license_number}</dd>
                        </div>
                        {employee.driving_license_expiry && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">Expiry Date</dt>
                            <dd className="text-sm">{formatDate(employee.driving_license_expiry)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {employee.operator_license_number && (
                    <div>
                      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Operator License</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">License Number</dt>
                          <dd className="text-sm">{employee.operator_license_number}</dd>
                        </div>
                        {employee.operator_license_expiry && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">Expiry Date</dt>
                            <dd className="text-sm">{formatDate(employee.operator_license_expiry)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {employee.tuv_certification_number && (
                    <div>
                      <h3 className="mb-3 text-sm font-medium text-muted-foreground">TUV Certification</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Certification Number</dt>
                          <dd className="text-sm">{employee.tuv_certification_number}</dd>
                        </div>
                        {employee.tuv_certification_expiry && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">Expiry Date</dt>
                            <dd className="text-sm">{formatDate(employee.tuv_certification_expiry)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {employee.spsp_license_number && (
                    <div>
                      <h3 className="mb-3 text-sm font-medium text-muted-foreground">SPSP License</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">License Number</dt>
                          <dd className="text-sm">{employee.spsp_license_number}</dd>
                        </div>
                        {employee.spsp_license_expiry && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">Expiry Date</dt>
                            <dd className="text-sm">{formatDate(employee.spsp_license_expiry)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Position Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Position Information</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">Employee ID</dt>
                        <dd className="text-sm">{employee.employee_id}</dd>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">File Number</dt>
                        <dd className="text-sm">{employee.file_number || 'Not assigned'}</dd>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">Designation</dt>
                        <dd className="text-sm">{employee.designation?.name || 'Not assigned'}</dd>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">Department</dt>
                        <dd className="text-sm">{employee.department?.name || 'Not assigned'}</dd>
                      </div>
                      {employee.supervisor && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Supervisor</dt>
                          <dd className="text-sm">{employee.supervisor}</dd>
                        </div>
                      )}
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">Status</dt>
                        <dd className="text-sm">{getStatusBadge(employee.status)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Employment Details</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">Hire Date</dt>
                        <dd className="text-sm">{formatDate(employee.hire_date)}</dd>
                      </div>
                      {employee.hourly_rate && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Hourly Rate</dt>
                          <dd className="text-sm">{formatCurrency(employee.hourly_rate)}</dd>
                        </div>
                      )}
                      {employee.monthly_deduction && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Monthly Deduction</dt>
                          <dd className="text-sm">{formatCurrency(employee.monthly_deduction)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Current Balance Card */}
                  <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">Current Balance</h3>
                      <Badge variant="outline" className="bg-muted/50">
                        {Number(currentBalance) > 0 ? 'Active' : 'No Balance'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold text-destructive">SAR {Number(currentBalance).toFixed(2)}</p>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-destructive transition-all duration-500"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Monthly Deduction Card */}
                  <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">Monthly Deduction</h3>
                      <Badge variant="outline" className="bg-muted/50">
                        Active
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold text-primary">
                        SAR {employee.monthly_deduction ? employee.monthly_deduction.toFixed(2) : '0.00'}
                      </p>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all duration-500"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total Repaid Card */}
                  <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">Total Repaid</h3>
                      <Badge variant="outline" className="bg-muted/50">
                        {totalRepaid > 0 ? 'Repaid' : 'No Repayments'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold text-green-600">SAR {Number(totalRepaid).toFixed(2)}</p>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-green-600 transition-all duration-500"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBox className="h-5 w-5" />
                Employee Documents
              </CardTitle>
              <CardDescription>
                Manage employee documents and certifications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Iqama Document */}
                {employee.iqama_number && (
                  <Card className="border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary/50 transition-colors">
                    <IdCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Iqama</h3>
                    <p className="text-sm text-muted-foreground mb-4">{employee.iqama_number}</p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Passport Document */}
                {employee.passport_number && (
                  <Card className="border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary/50 transition-colors">
                    <IdCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Passport</h3>
                    <p className="text-sm text-muted-foreground mb-4">{employee.passport_number}</p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Driving License */}
                {employee.driving_license_number && (
                  <Card className="border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary/50 transition-colors">
                    <Car className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Driving License</h3>
                    <p className="text-sm text-muted-foreground mb-4">{employee.driving_license_number}</p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Operator License */}
                {employee.operator_license_number && (
                  <Card className="border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary/50 transition-colors">
                    <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Operator License</h3>
                    <p className="text-sm text-muted-foreground mb-4">{employee.operator_license_number}</p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </Card>
                )}

                {/* TUV Certification */}
                {employee.tuv_certification_number && (
                  <Card className="border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary/50 transition-colors">
                    <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">TUV Certification</h3>
                    <p className="text-sm text-muted-foreground mb-4">{employee.tuv_certification_number}</p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </Card>
                )}

                {/* SPSP License */}
                {employee.spsp_license_number && (
                  <Card className="border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary/50 transition-colors">
                    <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">SPSP License</h3>
                    <p className="text-sm text-muted-foreground mb-4">{employee.spsp_license_number}</p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Upload New Document */}
                <Card className="border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary/50 transition-colors">
                  <Plus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Upload Document</h3>
                  <p className="text-sm text-muted-foreground mb-4">Add a new document</p>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timesheets Tab */}
        <TabsContent value="timesheets" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Timesheet Records</CardTitle>
                  <CardDescription>View and manage employee timesheet records</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => window.open('/modules/timesheet-management', '_blank')}>
                    <History className="mr-2 h-4 w-4" />
                    View All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Payslip Button with Month Selector */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Select
                  value={format(selectedPayslipDate, 'yyyy-MM')}
                  onValueChange={(value) => {
                    const [year, month] = value.split('-').map(Number);
                    setSelectedPayslipDate(new Date(year, month - 1, 1));
                  }}
                >
                  <SelectTrigger className="w-full min-w-[140px] sm:w-auto">
                    <SelectValue placeholder={format(selectedPayslipDate, 'MMMM yyyy')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const date = subMonths(new Date(), i);
                      return (
                        <SelectItem key={i} value={format(date, 'yyyy-MM')}>
                          {format(date, 'MMMM yyyy')}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button variant="default" size="sm" className="w-full sm:w-auto">
                  <Printer className="mr-2 h-4 w-4" />
                  View Payslip
                </Button>
              </div>

              {/* Timesheet Month Selector */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Select
                  value={selectedMonth}
                  onValueChange={(value) => {
                    setSelectedMonth(value);
                    // The useEffect will automatically refetch data when selectedMonth changes
                  }}
                >
                  <SelectTrigger className="w-full min-w-[140px] sm:w-auto">
                    <SelectValue placeholder={format(new Date(selectedMonth + '-01'), 'MMMM yyyy')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const date = subMonths(new Date(), i);
                      return (
                        <SelectItem key={i} value={format(date, 'yyyy-MM')}>
                          {format(date, 'MMMM yyyy')}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Daily Timesheet Records Calendar */}
              <div className="mb-6">
                <DailyTimesheetRecords
                  timesheets={formatDailyRecords(timesheets)}
                  selectedMonth={selectedMonth}
                  showSummary={false}
                />
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Regular Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {monthlySummary.totalHours.toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Overtime Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {monthlySummary.totalOvertime.toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(monthlySummary.totalHours + monthlySummary.totalOvertime).toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Days Worked
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {timesheets.length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Add Timesheet Button */}
              <div className="mb-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Timesheet
                </Button>
              </div>

              {/* Timesheet List */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Detailed Timesheet Records</h3>
                {timesheets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Clock In</TableHead>
                          <TableHead>Clock Out</TableHead>
                          <TableHead>Regular Hours</TableHead>
                          <TableHead>Overtime</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timesheets.map((timesheet) => (
                          <TableRow key={timesheet.id}>
                            <TableCell className="font-medium">{formatDate(timesheet.date)}</TableCell>
                            <TableCell>{timesheet.clock_in || '-'}</TableCell>
                            <TableCell>{timesheet.clock_out || '-'}</TableCell>
                            <TableCell>{timesheet.regular_hours || 0}</TableCell>
                            <TableCell>{timesheet.overtime_hours || 0}</TableCell>
                            <TableCell className="font-medium">
                              {((timesheet.regular_hours || 0) + (timesheet.overtime_hours || 0)).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {timesheet.project?.name || timesheet.rental?.projectName || timesheet.assignment?.name || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  timesheet.status === 'approved' ? 'default' :
                                  timesheet.status === 'pending' ? 'secondary' :
                                  timesheet.status === 'rejected' ? 'destructive' : 'outline'
                                }
                              >
                                {timesheet.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Ellipsis className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Timesheets Found</h3>
                    <p className="text-muted-foreground">No timesheet records available for this employee.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advances Tab */}
        <TabsContent value="advances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Advance Requests
              </CardTitle>
              <CardDescription>
                Employee advance requests and payment history
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {advances.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Repaid Amount</TableHead>
                        <TableHead>Remaining Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {advances.map((advance) => (
                        <TableRow key={advance.id}>
                          <TableCell className="font-medium">
                            {formatCurrency(advance.amount)}
                          </TableCell>
                          <TableCell>{advance.reason}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                advance.status === 'approved' ? 'default' :
                                advance.status === 'pending' ? 'secondary' :
                                advance.status === 'rejected' ? 'destructive' : 'outline'
                              }
                            >
                              {advance.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(advance.created_at)}</TableCell>
                          <TableCell>{formatCurrency(advance.repaid_amount || 0)}</TableCell>
                          <TableCell>{formatCurrency(advance.remaining_balance || advance.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Advance Requests</h3>
                  <p className="text-muted-foreground">No advance requests found for this employee.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Employee Assignments
                  </CardTitle>
                  <CardDescription>
                    Manage employee assignments to projects, rentals, and other tasks
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAssignmentModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Assignment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {assignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assignment Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned By</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">{assignment.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {assignment.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{assignment.location || 'N/A'}</TableCell>
                          <TableCell>{formatDate(assignment.startDate)}</TableCell>
                          <TableCell>
                            {assignment.endDate ? formatDate(assignment.endDate) : 'Ongoing'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                assignment.status === 'active' ? 'default' :
                                assignment.status === 'completed' ? 'secondary' :
                                assignment.status === 'pending' ? 'outline' : 'destructive'
                              }
                            >
                              {assignment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {assignment.assignedBy?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAssignment(assignment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAssignment(assignment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Assignments Found</h3>
                  <p className="text-muted-foreground">No assignments found for this employee.</p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowAssignmentModal(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Assignment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Requests
              </CardTitle>
              <CardDescription>
                Employee leave requests and history
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {leaveRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Return Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveRequests.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">{leave.leave_type}</TableCell>
                          <TableCell>{formatDate(leave.start_date)}</TableCell>
                          <TableCell>{formatDate(leave.end_date)}</TableCell>
                          <TableCell>{leave.reason}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                leave.status === 'approved' ? 'default' :
                                leave.status === 'pending' ? 'secondary' :
                                leave.status === 'rejected' ? 'destructive' : 'outline'
                              }
                            >
                              {leave.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{leave.return_date ? formatDate(leave.return_date) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Leave Requests</h3>
                  <p className="text-muted-foreground">No leave requests found for this employee.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resignations Tab */}
        <TabsContent value="resignations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resignation Requests
              </CardTitle>
              <CardDescription>
                Employee resignation requests and history
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Resignation Requests</h3>
                <p className="text-muted-foreground">No resignation requests found for this employee.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Final Settlements Tab */}
        <TabsContent value="final-settlements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Final Settlements
              </CardTitle>
              <CardDescription>
                Employee final settlement records
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {finalSettlements.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Settlement Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {finalSettlements.map((settlement) => (
                        <TableRow key={settlement.id}>
                          <TableCell>{formatDate(settlement.settlement_date)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(settlement.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                settlement.status === 'approved' ? 'default' :
                                settlement.status === 'pending' ? 'secondary' :
                                settlement.status === 'rejected' ? 'destructive' : 'outline'
                              }
                            >
                              {settlement.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{settlement.reason || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Final Settlements</h3>
                  <p className="text-muted-foreground">No final settlement records found for this employee.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <AssignmentModal
          employeeId={employeeId}
          assignment={editingAssignment}
          onClose={() => {
            setShowAssignmentModal(false);
            setEditingAssignment(null);
          }}
          onSuccess={() => {
            setShowAssignmentModal(false);
            setEditingAssignment(null);
            fetchEmployeeData();
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Employee"
        description={`Are you sure you want to delete ${employee?.first_name} ${employee?.last_name}? This action cannot be undone.`}
        confirmText="Delete Employee"
        cancelText="Cancel"
        onConfirm={confirmDeleteEmployee}
        variant="destructive"
      />

      {/* Assignment Confirmation Dialog */}
      <ConfirmationDialog
        open={assignmentDeleteDialogOpen}
        onOpenChange={setAssignmentDeleteDialogOpen}
        title="Delete Assignment"
        description="Are you sure you want to delete this assignment? This action cannot be undone."
        confirmText="Delete Assignment"
        cancelText="Cancel"
        onConfirm={confirmDeleteAssignment}
        variant="destructive"
      />
    </div>
  );
}
