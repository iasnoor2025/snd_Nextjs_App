
'use client';


// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import ApprovalWorkflow from '@/components/timesheet/ApprovalWorkflow';
import SubmitTimesheet from '@/components/timesheet/SubmitTimesheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building, Calendar, Clock, Edit, User } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Timesheet {
  id: string;
  employeeId: string;
  date: string;
  hoursWorked: number;
  overtimeHours: number;
  startTime: string;
  endTime: string;
  status: string;
  projectId?: string;
  rentalId?: string;
  assignmentId?: string;
  description?: string;
  tasksCompleted?: string;
  notes?: string;
  submittedAt?: string;
  foremanApprovalBy?: string;
  foremanApprovalAt?: string;
  foremanApprovalNotes?: string;
  timesheetInchargeApprovalBy?: string;
  timesheetInchargeApprovalAt?: string;
  timesheetInchargeApprovalNotes?: string;
  timesheetCheckingApprovalBy?: string;
  timesheetCheckingApprovalAt?: string;
  timesheetCheckingApprovalNotes?: string;
  managerApprovalBy?: string;
  managerApprovalAt?: string;
  managerApprovalNotes?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  rejectionStage?: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    user?: {
      name: string;
      email: string;
    };
  };
  project?: {
    id: string;
    name: string;
  };
  rental?: {
    id: string;
    rentalNumber: string;
  };
  assignment?: {
    id: string;
    name: string;
    type: string;
  };
  foremanApprover?: {
    id: string;
    name: string;
  };
  inchargeApprover?: {
    id: string;
    name: string;
  };
  checkingApprover?: {
    id: string;
    name: string;
  };
  managerApprover?: {
    id: string;
    name: string;
  };
  rejector?: {
    id: string;
    name: string;
  };
}

export default function TimesheetDetailPage() {
  return (
    <ProtectedRoute>
      <TimesheetDetailContent />
    </ProtectedRoute>
  );
}

function TimesheetDetailContent() {
  const params = useParams();
  const timesheetId = params.id as string;

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    const fetchTimesheet = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/timesheets/${timesheetId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch timesheet');
        }

        const data = await response.json();
        setTimesheet(data.timesheet);

        // Get user role (this would come from your auth context)
        // For now, we'll set a default role
        setUserRole('admin');
      } catch (error) {
        toast.error('Failed to load timesheet');
        
      } finally {
        setLoading(false);
      }
    };

    if (timesheetId) {
      fetchTimesheet();
    }
  }, [timesheetId]);

  const handleStatusChange = () => {
    // Refetch the timesheet to get updated status
    window.location.reload();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'submitted':
        return <Badge variant="default">Submitted</Badge>;
      case 'foreman_approved':
        return <Badge className="bg-blue-100 text-blue-800">Foreman Approved</Badge>;
      case 'incharge_approved':
        return <Badge className="bg-purple-100 text-purple-800">Incharge Approved</Badge>;
      case 'checking_approved':
        return <Badge className="bg-orange-100 text-orange-800">Checking Approved</Badge>;
      case 'manager_approved':
        return <Badge className="bg-green-100 text-green-800">Manager Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!timesheet) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Timesheet Not Found</h2>
          <p className="text-gray-600 mb-4">
            The timesheet you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/modules/timesheet-management">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Timesheets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalHours = Number(timesheet.hoursWorked) + Number(timesheet.overtimeHours);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/modules/timesheet-management">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Timesheet Details</h1>
            <p className="text-gray-600">
              {timesheet.employee.firstName} {timesheet.employee.lastName} -{' '}
              {new Date(timesheet.date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(timesheet.status)}
          <Link href={`/modules/timesheet-management/${timesheet.id}/edit`}>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timesheet Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timesheet Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Employee</div>
                    <div>
                      {timesheet.employee.firstName} {timesheet.employee.lastName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Date</div>
                    <div>{new Date(timesheet.date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Regular Hours</div>
                    <div>{timesheet.hoursWorked}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Overtime Hours</div>
                    <div>{timesheet.overtimeHours}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Total Hours</div>
                    <div className="font-semibold">{totalHours.toFixed(2)}</div>
                  </div>
                </div>

                {timesheet.project && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Project</div>
                      <div>{timesheet.project.name}</div>
                    </div>
                  </div>
                )}
              </div>

              {timesheet.description && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">Description</div>
                  <div className="text-sm">{timesheet.description}</div>
                </div>
              )}

              {timesheet.tasksCompleted && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">Tasks Completed</div>
                  <div className="text-sm">{timesheet.tasksCompleted}</div>
                </div>
              )}

              {timesheet.notes && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">Notes</div>
                  <div className="text-sm">{timesheet.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Workflow */}
          <ApprovalWorkflow
            timesheet={timesheet}
            userRole={userRole}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submit Timesheet */}
          <SubmitTimesheet timesheet={timesheet} onStatusChange={handleStatusChange} />

          {/* Approval History */}
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timesheet.submittedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Submitted</span>
                    <span>{new Date(timesheet.submittedAt).toLocaleDateString()}</span>
                  </div>
                )}

                {timesheet.foremanApprovalAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Foreman Approved</span>
                    <span>{new Date(timesheet.foremanApprovalAt).toLocaleDateString()}</span>
                  </div>
                )}

                {timesheet.timesheetInchargeApprovalAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Incharge Approved</span>
                    <span>
                      {new Date(timesheet.timesheetInchargeApprovalAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {timesheet.timesheetCheckingApprovalAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Checking Approved</span>
                    <span>
                      {new Date(timesheet.timesheetCheckingApprovalAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {timesheet.managerApprovalAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Manager Approved</span>
                    <span>{new Date(timesheet.managerApprovalAt).toLocaleDateString()}</span>
                  </div>
                )}

                {timesheet.rejectedAt && (
                  <div className="flex items-center justify-between text-sm text-red-600">
                    <span>Rejected</span>
                    <span>{new Date(timesheet.rejectedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
