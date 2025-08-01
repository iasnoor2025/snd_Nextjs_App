"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Briefcase,
  FileBox,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Receipt,
  Loader2,
  AlertCircle,
  Download,
  IdCard,
  Car,
  Truck,
  History,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useI18n } from "@/hooks/use-i18n";
import { useRBAC } from "@/lib/rbac/rbac-context";
import TimesheetSummary from "@/components/employee/timesheets/TimesheetSummary";
import TimesheetList from "@/components/employee/timesheets/TimesheetList";
import PaymentHistory from "@/components/employee/PaymentHistory";
import DocumentsTab from "@/components/employee/DocumentsTab";
import AssignmentsTab from "@/components/employee/AssignmentsTab";

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
  basic_salary?: number;
  food_allowance?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  department?: { id: number; name: string };
  designation?: { id: number; name: string };
  supervisor?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
  iqama_number?: string;
  iqama_expiry?: string;
  iqama_file?: string;
  passport_number?: string;
  passport_expiry?: string;
  passport_file?: string;
  driving_license_number?: string;
  driving_license_expiry?: string;
  driving_license_file?: string;
  operator_license_number?: string;
  operator_license_expiry?: string;
  operator_license_file?: string;
  tuv_certification_number?: string;
  tuv_certification_expiry?: string;
  tuv_certification_file?: string;
  spsp_license_number?: string;
  spsp_license_expiry?: string;
  spsp_license_file?: string;
}

export default function EmployeeShowPage() {
  const { t } = useI18n();
  const { hasPermission } = useRBAC();
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal-info");
  
  // Assignment related state
  const [currentAssignment, setCurrentAssignment] = useState<any>(null);
  const [strictAssignmentHistory, setStrictAssignmentHistory] = useState<any[]>([]);
  const [isManualAssignmentDialogOpen, setIsManualAssignmentDialogOpen] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualAssignment, setManualAssignment] = useState({
    name: '',
    location: '',
    start_date: '',
    end_date: '',
    notes: '',
  });
  const [editAssignment, setEditAssignment] = useState<any>(null);
  const [isEditAssignmentDialogOpen, setIsEditAssignmentDialogOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<number | null>(null);

  // Advances state
  const [currentBalance, setCurrentBalance] = useState(0);
  const [monthlyDeduction, setMonthlyDeduction] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceReason, setAdvanceReason] = useState("");
  const [isAdvanceRequestDialogOpen, setIsAdvanceRequestDialogOpen] = useState(false);
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);
  const [isRepaymentDialogOpen, setIsRepaymentDialogOpen] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [selectedAdvance, setSelectedAdvance] = useState<number | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPayslipMonth, setSelectedPayslipMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [advances, setAdvances] = useState<any[]>([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [selectedAdvanceForReject, setSelectedAdvanceForReject] = useState<any>(null);
  const [selectedAdvanceForRepayment, setSelectedAdvanceForRepayment] = useState<any>(null);

  // Filter approved advances for repayment
  const approvedAdvances = advances.filter((advance: any) => advance.status === 'approved');

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData();
      fetchAdvances();
    }
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      const data = await response.json();
      setEmployee(data.employee || data);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      toast.error("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvances = async () => {
    setLoadingAdvances(true);
    try {
      const response = await fetch(`/api/employee/advances?employeeId=${employeeId}`);
      const data = await response.json();
      if (data.success) {
        setAdvances(data.advances || []);
        // Calculate current balance from approved advances only
        const approvedAdvances = data.advances.filter((advance: any) => advance.status === 'approved');
        const totalBalance = approvedAdvances.reduce((sum: number, advance: any) => sum + Number(advance.amount), 0);
        setCurrentBalance(totalBalance);
      }
    } catch (error) {
      console.error("Error fetching advances:", error);
      toast.error("Failed to load advances");
    } finally {
      setLoadingAdvances(false);
    }
  };

  const handleApproveAdvance = async (advanceId: number) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Advance approved successfully');
        fetchAdvances(); // Refresh the advances list
      } else {
        toast.error(data.error || 'Failed to approve advance');
      }
    } catch (error) {
      console.error('Error approving advance:', error);
      toast.error('Failed to approve advance');
    }
  };

  const handleRejectAdvance = async (advanceId: number, reason: string) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Advance rejected successfully');
        setIsRejectDialogOpen(false);
        setRejectionReason('');
        setSelectedAdvanceForReject(null);
        fetchAdvances(); // Refresh the advances list
      } else {
        toast.error(data.error || 'Failed to reject advance');
      }
    } catch (error) {
      console.error('Error rejecting advance:', error);
      toast.error('Failed to reject advance');
    }
  };

  const handleRepayment = async (advanceId: number, amount: string) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}/repay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repaymentAmount: amount }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Repayment recorded successfully');
        setIsRepaymentDialogOpen(false);
        setRepaymentAmount('');
        setSelectedAdvanceForRepayment(null);
        fetchAdvances(); // Refresh the advances list
      } else {
        toast.error(data.error || 'Failed to record repayment');
      }
    } catch (error) {
      console.error('Error recording repayment:', error);
      toast.error('Failed to record repayment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading employee data...</span>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Employee not found</h2>
          <p className="mt-2 text-muted-foreground">The employee you're looking for doesn't exist.</p>
          <Button className="mt-4" asChild>
            <Link href="/modules/employee-management">Back to Employees</Link>
          </Button>
        </div>
      </div>
    );
  }

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
          {hasPermission('edit', 'Employee') && (
          <Button size="sm" asChild>
            <Link href={`/modules/employee-management/${employee.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
              )}
              {hasPermission('delete', 'Employee') && (
            <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
              )}
        </div>
      </div>

      <Separator />

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="personal-info" className="w-full">
        <TabsList className="flex w-full justify-between rounded-lg border bg-muted/30 p-1 shadow-sm">
          <TabsTrigger value="personal-info" className="flex items-center gap-2 px-3 py-2">
            <User className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="employment" className="flex items-center gap-2 px-3 py-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Employment</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2 px-3 py-2">
            <FileBox className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2 px-3 py-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Assignments</span>
          </TabsTrigger>
          <TabsTrigger value="timesheets" className="flex items-center gap-2 px-3 py-2">
            <Clock className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Timesheets</span>
          </TabsTrigger>
          <TabsTrigger value="leaves" className="flex items-center gap-2 px-3 py-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Leaves</span>
          </TabsTrigger>
          <TabsTrigger value="advances" className="flex items-center gap-2 px-3 py-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Advances</span>
          </TabsTrigger>
          <TabsTrigger value="resignations" className="flex items-center gap-2 px-3 py-2">
            <FileText className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Resignations</span>
          </TabsTrigger>
          <TabsTrigger value="final-settlements" className="flex items-center gap-2 px-3 py-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">Final Settlements</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal-info" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Personal and identification details</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Contact Information</h3>
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
                          <dd className="text-sm">{format(new Date(employee.date_of_birth), 'PPP')}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                    <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Emergency Contact</h3>
                    {employee.emergency_contact_name || employee.emergency_contact_phone ? (
                      <dl className="space-y-2">
                        {employee.emergency_contact_name && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">Name</dt>
                            <dd className="text-sm">{employee.emergency_contact_name}</dd>
                    </div>
                  )}
                        {employee.emergency_contact_phone && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">Phone</dt>
                            <dd className="text-sm">{employee.emergency_contact_phone}</dd>
                      </div>
                    )}
                      </dl>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No emergency contact information</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
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
                          <dd className="text-sm">{format(new Date(employee.iqama_expiry), 'PPP')}</dd>
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
                          <dd className="text-sm">{format(new Date(employee.passport_expiry), 'PPP')}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Licenses & Certifications</h3>
                    {employee.driving_license_number || employee.operator_license_number || 
                     employee.tuv_certification_number || employee.spsp_license_number ? (
                    <dl className="space-y-2">
                  {employee.driving_license_number && (
                        <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">Driving License</dt>
                          <dd className="text-sm">{employee.driving_license_number}</dd>
                        </div>
                    )}
                        {employee.driving_license_expiry && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">License Expiry</dt>
                            <dd className="text-sm">{format(new Date(employee.driving_license_expiry), 'PPP')}</dd>
                          </div>
                        )}
                  {employee.operator_license_number && (
                        <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">Operator License</dt>
                          <dd className="text-sm">{employee.operator_license_number}</dd>
                        </div>
                    )}
                        {employee.operator_license_expiry && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">Operator License Expiry</dt>
                            <dd className="text-sm">{format(new Date(employee.operator_license_expiry), 'PPP')}</dd>
                          </div>
                        )}
                  {employee.tuv_certification_number && (
                        <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">TÜV Certification</dt>
                          <dd className="text-sm">{employee.tuv_certification_number}</dd>
                        </div>
                        )}
                        {employee.tuv_certification_expiry && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">TÜV Certification Expiry</dt>
                            <dd className="text-sm">{format(new Date(employee.tuv_certification_expiry), 'PPP')}</dd>
                          </div>
                        )}
                  {employee.spsp_license_number && (
                        <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">SPSP License</dt>
                          <dd className="text-sm">{employee.spsp_license_number}</dd>
                        </div>
                        )}
                        {employee.spsp_license_expiry && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">SPSP License Expiry</dt>
                            <dd className="text-sm">{format(new Date(employee.spsp_license_expiry), 'PPP')}</dd>
                          </div>
                        )}
                      </dl>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No licenses or certifications available</p>
                  )}
                  </div>
                </div>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
              <CardTitle>Employment Details</CardTitle>
              <CardDescription>Work and position details</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Employment Timeline</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">Hire Date</dt>
                        <dd className="text-sm">
                          {employee.hire_date ? format(new Date(employee.hire_date), 'PPP') : 'Not set'}
                        </dd>
                      </div>
                        <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">Service Period</dt>
                        <dd className="text-sm">
                          {(() => {
                            const hireDate = employee.hire_date ? new Date(employee.hire_date) : new Date();
                            const today = new Date();

                            let years = today.getFullYear() - hireDate.getFullYear();
                            let months = today.getMonth() - hireDate.getMonth();
                            let days = today.getDate() - hireDate.getDate();

                            if (days < 0) {
                              months--;
                              const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                              days += lastMonth.getDate();
                            }
                            if (months < 0) {
                              years--;
                              months += 12;
                            }

                            const parts = [];
                            if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
                            if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
                            if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);

                            return parts.join(', ') || 'Less than a day';
                          })()}
                        </dd>
                        </div>
                    </dl>
                  </div>
                </div>

                        <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Salary & Benefits</h3>
                  <div className="mb-4 rounded-lg bg-muted/30 p-5">
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm font-medium">Basic Salary</span>
                      <span className="text-base font-semibold">SAR {Number(employee.basic_salary || 0).toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <dl className="space-y-2">
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">Hourly Rate</dt>
                      <dd className="text-sm">SAR {Number(employee.hourly_rate || 0).toFixed(2)}</dd>
                    </div>
                    {Number(employee.food_allowance || 0) > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">Food Allowance</dt>
                        <dd className="text-sm">SAR {Number(employee.food_allowance).toFixed(2)}</dd>
                      </div>
                      )}
                    {Number(employee.housing_allowance || 0) > 0 && (
                        <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">Housing Allowance</dt>
                        <dd className="text-sm">SAR {Number(employee.housing_allowance).toFixed(2)}</dd>
                    </div>
                      )}
                    {Number(employee.transport_allowance || 0) > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">Transport Allowance</dt>
                        <dd className="text-sm">SAR {Number(employee.transport_allowance).toFixed(2)}</dd>
                  </div>
                      )}
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6 space-y-6">
          <DocumentsTab employeeId={parseInt(employeeId)} />
        </TabsContent>

                        <TabsContent value="assignments" className="mt-6 space-y-6">
                          <AssignmentsTab employeeId={parseInt(employeeId)} />
                        </TabsContent>

        <TabsContent value="timesheets" className="mt-6">
          <Card>
            <CardHeader>
                  <CardTitle>Timesheet Records</CardTitle>
                  <CardDescription>View and manage employee timesheet records</CardDescription>
            </CardHeader>
            <CardContent>
                            {/* Payslip Button with Month Selector */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="w-full min-w-[140px] sm:w-auto">
                  <select 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={selectedPayslipMonth}
                    onChange={(e) => setSelectedPayslipMonth(e.target.value)}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const date = subMonths(new Date(), i);
                      return (
                        <option key={i} value={format(date, 'yyyy-MM')}>
                          {format(date, 'MMMM yyyy')}
                        </option>
                      );
                    })}
                  </select>
                    </div>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full sm:w-auto"
                  asChild
                >
                  <Link 
                    href={`/modules/employee-management/${employee?.id}/payslip?month=${selectedPayslipMonth}`}
                    target="_blank"
                  >
                    View Payslip
                  </Link>
                      </Button>
                    </div>
      {/* Timesheet Summary */}
      <div className="mb-4">
        <TimesheetSummary employeeId={employee?.id} />
                    </div>
      {/* Add Timesheet Button and Dialog */}
      {hasPermission('create', 'Timesheet') && (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4 mb-4">Add Timesheet</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Timesheet</DialogTitle>
            </DialogHeader>
            {/* TimesheetForm component will go here */}
            <div className="text-muted-foreground italic">Timesheet form will appear here.</div>
          </DialogContent>
        </Dialog>
      )}
      {/* Timesheet List */}
      <div className="mt-4">
        <TimesheetList employeeId={employee?.id} />
                    </div>
              </CardContent>
                  </Card>
          </TabsContent>

        <TabsContent value="leaves" className="mt-6 space-y-6">
                <Card>
              <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Leave History</CardTitle>
                  <CardDescription>View and manage employee leave records</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline">
                    <History className="mr-2 h-4 w-4" />
                    View All
                      </Button>
                    </div>
              </div>
                  </CardHeader>
                  <CardContent>
              <div className="space-y-6">
                {/* Leave Summary */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">Total Leaves</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">0</div>
                  </CardContent>
                  </Card>
                <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">Approved Leaves</CardTitle>
                  </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">0</div>
                  </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                  </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">0</div>
                  </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">Rejected Leaves</CardTitle>
                  </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">0</div>
                  </CardContent>
                </Card>
              </div>

                {/* Leave Records */}
          <Card>
            <CardHeader>
                    <CardTitle>Recent Leave Requests</CardTitle>
            </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Leave Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Start Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              End Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Duration
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                              No leave requests found
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advances" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Advance Payment Management</CardTitle>
                  <CardDescription>Track and manage employee advance payments and deductions</CardDescription>
                </div>
                <div className="flex gap-2">
                              <Button
                    variant="outline"
                    onClick={() => setIsAdvanceRequestDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    New Advance
                  </Button>
                  <Dialog open={isRepaymentDialogOpen} onOpenChange={setIsRepaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="flex items-center gap-2"
                        disabled={approvedAdvances.length === 0}
                      >
                        <CreditCard className="h-4 w-4" />
                        Make Repayment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Repayment</DialogTitle>
                        <DialogDescription>
                          Enter the repayment amount. For partial repayments, the amount must be at least the total
                          monthly deduction.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {approvedAdvances.length === 0 ? (
                          <div className="p-6 text-center">
                            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
                            <h3 className="mb-2 text-lg font-medium">No Active Advances</h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                              There are no approved advances available for repayment.
                            </p>
                            <Button variant="outline" onClick={() => setIsRepaymentDialogOpen(false)}>
                              Close
                </Button>
              </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid gap-2">
                              <label htmlFor="repaymentAdvance" className="text-sm font-medium">Select Advance</label>
                <Select
                                value={selectedAdvanceForRepayment?.id?.toString() || ''}
                  onValueChange={(value) => {
                                  const advance = approvedAdvances.find(a => a.id.toString() === value);
                                  setSelectedAdvanceForRepayment(advance);
                                  setRepaymentAmount('');
                  }}
                >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an advance to repay" />
                  </SelectTrigger>
                  <SelectContent>
                                  {approvedAdvances.map((advance) => (
                                    <SelectItem key={advance.id} value={advance.id.toString()}>
                                      SAR {Number(advance.amount).toFixed(2)} - {advance.reason}
                        </SelectItem>
                                  ))}
                  </SelectContent>
                </Select>
              </div>
                            {selectedAdvanceForRepayment && (
                              <div className="space-y-4">
                                <div className="rounded-lg border p-4 bg-muted/50">
                                  <h4 className="font-medium mb-2">Advance Details</h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>Amount: SAR {Number(selectedAdvanceForRepayment.amount).toFixed(2)}</div>
                                    <div>Monthly Deduction: SAR {selectedAdvanceForRepayment.monthly_deduction ? Number(selectedAdvanceForRepayment.monthly_deduction).toFixed(2) : 'Not set'}</div>
                                    <div>Repaid Amount: SAR {selectedAdvanceForRepayment.repaid_amount ? Number(selectedAdvanceForRepayment.repaid_amount).toFixed(2) : '0.00'}</div>
                                    <div>Remaining Balance: SAR {selectedAdvanceForRepayment.remaining_balance ? Number(selectedAdvanceForRepayment.remaining_balance).toFixed(2) : Number(selectedAdvanceForRepayment.amount).toFixed(2)}</div>
                                  </div>
                                </div>
                                <div className="grid gap-2">
                                  <label htmlFor="repaymentAmount" className="text-sm font-medium">Repayment Amount (SAR)</label>
                                  <Input
                                    id="repaymentAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={repaymentAmount}
                                    onChange={(e) => setRepaymentAmount(e.target.value)}
                                    placeholder="Enter repayment amount"
                                  />
                                  {selectedAdvanceForRepayment.monthly_deduction && (
                                    <p className="text-xs text-muted-foreground">
                                      Minimum repayment: SAR {Number(selectedAdvanceForRepayment.monthly_deduction).toFixed(2)}
                                    </p>
                                  )}
              </div>
                    </div>
                            )}
                    </div>
                        )}
                    </div>
                      {approvedAdvances.length > 0 && (
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsRepaymentDialogOpen(false);
                              setRepaymentAmount('');
                              setSelectedAdvanceForRepayment(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              if (selectedAdvanceForRepayment && repaymentAmount) {
                                handleRepayment(selectedAdvanceForRepayment.id, repaymentAmount);
                              } else {
                                toast.error('Please select an advance and enter repayment amount');
                              }
                            }}
                            disabled={!selectedAdvanceForRepayment || !repaymentAmount}
                          >
                            Record Repayment
                          </Button>
                        </DialogFooter>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
                  </CardHeader>
            
            {/* Advance Request Dialog */}
            <Dialog open={isAdvanceRequestDialogOpen} onOpenChange={setIsAdvanceRequestDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Advance</DialogTitle>
                  <DialogDescription>Enter advance payment details</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="amount" className="text-sm font-medium">Amount (SAR)</label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                    </div>
                  <div className="grid gap-2">
                    <label htmlFor="monthlyDeduction" className="text-sm font-medium">Monthly Deduction (SAR)</label>
                    <Input
                      id="monthlyDeduction"
                      type="number"
                      step="0.01"
                      min="0"
                      value={monthlyDeduction}
                      onChange={(e) => setMonthlyDeduction(e.target.value)}
                      placeholder="Enter monthly deduction amount"
                    />
              </div>
                  <div className="grid gap-2">
                    <label htmlFor="reason" className="text-sm font-medium">Reason</label>
                    <Textarea
                      id="reason"
                      value={advanceReason}
                      onChange={(e) => setAdvanceReason(e.target.value)}
                      placeholder="Enter reason for advance"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAdvanceRequestDialogOpen(false);
                      setAdvanceAmount('');
                      setAdvanceReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      try {
                        // Validate form
                        if (!advanceAmount || !advanceReason) {
                          toast.error('Please fill in Amount and Reason fields');
                          return;
                        }

                        if (parseFloat(advanceAmount) <= 0) {
                          toast.error('Amount must be greater than 0');
                          return;
                        }

                        // Handle advance request submission
                        const response = await fetch('/api/employee/advances', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            employeeId: employeeId,
                            amount: advanceAmount,
                            monthly_deduction: monthlyDeduction,
                            reason: advanceReason,
                          }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                          setIsAdvanceRequestDialogOpen(false);
                          setAdvanceAmount('');
                          setAdvanceReason('');
                          toast.success('Advance request submitted successfully');
                          // Refresh the advances list
                          fetchAdvances();
                        } else {
                          toast.error(data.error || 'Failed to submit advance request');
                        }
                      } catch (error) {
                        console.error('Error submitting advance request:', error);
                        toast.error('Failed to submit advance request');
                      }
                    }}
                  >
                    Submit
                </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Reject Advance Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Advance Request</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for rejecting this advance request.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="rejectionReason" className="text-sm font-medium">Rejection Reason</label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsRejectDialogOpen(false);
                      setRejectionReason('');
                      setSelectedAdvanceForReject(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (selectedAdvanceForReject && rejectionReason.trim()) {
                        handleRejectAdvance(selectedAdvanceForReject.id, rejectionReason);
                      } else {
                        toast.error('Please provide a rejection reason');
                      }
                    }}
                    disabled={!rejectionReason.trim()}
                  >
                    Reject Advance
                                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                      Configurable
                            </Badge>
                </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="1.00"
                        min="0"
                        value={monthlyDeduction}
                        onChange={(e) => setMonthlyDeduction(e.target.value)}
                        className="w-32 text-2xl font-bold text-primary"
                        placeholder="0.00"
                      />
                      <span className="text-2xl font-bold text-primary">SAR</span>
                </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Current Monthly Deduction</span>
                      <span className="font-medium">
                        SAR {Number(monthlyDeduction || 0).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Company will decide monthly deduction</p>
                  </div>
                </div>

                {/* Estimated Repayment Card */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Estimated Repayment</h3>
                    <Badge variant="outline" className="bg-muted/50">
                      Projected
                    </Badge>
                </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <p className="text-2xl font-bold text-primary">
                        {monthlyDeduction ? Math.ceil(Number(currentBalance) / Number(monthlyDeduction)) : 0}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">months</span>
                      </p>
              </div>
                    <p className="text-xs text-muted-foreground">Based on current balance and monthly deduction</p>
                  </div>
                </div>
              </div>

              {/* Modern Advance History Card */}
              <Card className="mt-6 shadow-sm border border-gray-200 bg-white rounded-lg">
                <CardHeader className="bg-muted/50 rounded-t-lg p-4 flex flex-row items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">Advance History</CardTitle>
            </CardHeader>
                <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Deduction</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {loadingAdvances ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-muted-foreground">Loading advances...</span>
                              </div>
                            </td>
                          </tr>
                        ) : advances.length === 0 ? (
                          <tr>
                                                          <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground italic">
                              No advance records found.
                            </td>
                          </tr>
                        ) : (
                          advances.map((advance) => (
                            <tr key={advance.id} className="hover:bg-muted/50">
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">SAR {Number(advance.amount).toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">SAR {Number(advance.monthly_deduction || 0).toFixed(2)}</td>
                              <td className="px-6 py-4 max-w-[200px] truncate">{advance.reason}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{new Date(advance.created_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                    advance.status === 'approved' ? 'default' :
                                    advance.status === 'pending' ? 'secondary' :
                                    advance.status === 'rejected' ? 'destructive' :
                                    'outline'
                                  }
                                  className={
                                    advance.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    advance.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    advance.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {advance.status.charAt(0).toUpperCase() + advance.status.slice(1)}
                            </Badge>
                              </td>
                              <td className="px-6 py-4 capitalize">{advance.purpose === 'advance' ? 'Request' : Number(advance.amount) < 0 ? 'Repayment' : 'Payment'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                 <div className="flex items-center justify-end gap-2">
                                   {advance.status === 'pending' && (
                                     <>
                              <Button
                                size="sm"
                                         variant="outline"
                                         onClick={() => handleApproveAdvance(advance.id)}
                              >
                                         Approve
                              </Button>
                              <Button
                                size="sm"
                                         variant="outline"
                                         onClick={() => {
                                           setSelectedAdvanceForReject(advance);
                                           setIsRejectDialogOpen(true);
                                         }}
                                       >
                                         Reject
                              </Button>
                                     </>
                                   )}
                  <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => {
                                       // Handle view details
                                       toast.info('View advance details');
                                     }}
                                   >
                                     View
                  </Button>
                </div>
                              </td>
                            </tr>
                          ))
              )}
                      </tbody>
                    </table>
                </div>
            </CardContent>
          </Card>
            </CardContent>
          </Card>
          <PaymentHistory employeeId={parseInt(employeeId)} />
        </TabsContent>

        <TabsContent value="resignations" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resignation History</CardTitle>
              <CardDescription>View and manage resignation requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Working Day
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted On
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No resignation requests found
                      </td>
                    </tr>
                                          </tbody>
                      </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="final-settlements" className="mt-6 space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Final Settlement</h2>
              {hasPermission('create', 'FinalSettlement') && (
                <Button>Create Settlement</Button>
              )}
            </div>

          <Card>
            <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Receipt className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No final settlements found for this employee.</p>
                  {hasPermission('create', 'FinalSettlement') && (
                    <Button className="mt-4">Create New Settlement</Button>
                  )}
                </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}