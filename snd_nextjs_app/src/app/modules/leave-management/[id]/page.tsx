"use client";

import React from "react";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Download,
  Share2,
  MoreHorizontal,
  Eye,
  History,
  CalendarDays,
  UserCheck,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { useRBAC } from "@/lib/rbac/rbac-context";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface LeaveRequest {
  id: string;
  employee_name: string;
  employee_id: string;
  employee_avatar?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: string;
  submitted_date: string;
  approved_by: string | null;
  approved_date: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
  department?: string;
  position?: string;
  total_leave_balance?: number;
  leave_taken_this_year?: number;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  approval_history?: Array<{
    id: string;
    action: string;
    approver: string;
    date: string;
    comments: string;
  }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<object>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<object>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Leave Request Detail Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="text-muted-foreground">
              We encountered an error while loading the leave request details.
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LeaveRequestDetailPage() {
  const { t } = useI18n();
  const { hasPermission, user } = useRBAC();
  const params = useParams();
  const router = useRouter();
  const leaveId = params.id as string;

  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchLeaveRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call with better error handling
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Mock data with more realistic structure
      const mockLeaveRequest: LeaveRequest = {
        id: leaveId,
        employee_name: "John Smith",
        employee_id: "EMP001",
        employee_avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        leave_type: "Annual Leave",
        start_date: "2024-02-15",
        end_date: "2024-02-20",
        days_requested: 5,
        reason: "Family vacation to Europe. Planning to visit multiple countries including France, Italy, and Spain. This is a long-planned trip that has been postponed twice due to work commitments.",
        status: "Pending",
        submitted_date: "2024-01-15T10:00:00Z",
        approved_by: null,
        approved_date: null,
        comments: null,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        department: "Engineering",
        position: "Senior Software Engineer",
        total_leave_balance: 25,
        leave_taken_this_year: 8,
        attachments: [
          {
            id: "1",
            name: "Travel_Itinerary.pdf",
            url: "#",
            type: "application/pdf"
          },
          {
            id: "2", 
            name: "Flight_Bookings.pdf",
            url: "#",
            type: "application/pdf"
          }
        ],
        approval_history: [
          {
            id: "1",
            action: "Submitted",
            approver: "John Smith",
            date: "2024-01-15T10:00:00Z",
            comments: "Leave request submitted for approval"
          }
        ]
      };
      
      setLeaveRequest(mockLeaveRequest);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leave request';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [leaveId]);

  useEffect(() => {
    if (leaveId) {
      fetchLeaveRequest();
    }
  }, [leaveId, fetchLeaveRequest]);

  const handleEdit = useCallback(() => {
    router.push(`/modules/leave-management/${leaveId}/edit`);
  }, [router, leaveId]);

  const handleDelete = useCallback(async () => {
    if (!leaveRequest) return;
    
    if (!confirm(`Are you sure you want to delete this leave request? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Leave request deleted successfully');
      router.push('/modules/leave-management');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete leave request';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [leaveRequest, router]);

  const handleApprove = useCallback(async () => {
    if (!leaveRequest) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLeaveRequest(prev => prev ? { ...prev, status: 'Approved', approved_by: user?.name || 'Current User', approved_date: new Date().toISOString() } : null);
      toast.success('Leave request approved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve leave request';
      toast.error(errorMessage);
    }
  }, [leaveRequest, user]);

  const handleReject = useCallback(async () => {
    if (!leaveRequest) return;
    
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLeaveRequest(prev => prev ? { ...prev, status: 'Rejected', comments: reason } : null);
      toast.success('Leave request rejected');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject leave request';
      toast.error(errorMessage);
    }
  }, [leaveRequest]);

  const getStatusBadge = useCallback((status: string) => {
    const statusConfig = {
      'Pending': { variant: 'secondary' as const, icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      'Approved': { variant: 'default' as const, icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      'Rejected': { variant: 'destructive' as const, icon: XCircle, color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const calculateLeaveProgress = useCallback(() => {
    if (!leaveRequest?.total_leave_balance || !leaveRequest?.leave_taken_this_year) return 0;
    return (leaveRequest.leave_taken_this_year / leaveRequest.total_leave_balance) * 100;
  }, [leaveRequest]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}. Please try refreshing the page or contact support if the problem persists.
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button onClick={fetchLeaveRequest} variant="outline">
            Retry
          </Button>
          <Button onClick={() => router.push('/modules/leave-management')}>
            Back to Leave Management
          </Button>
        </div>
      </div>
    );
  }

  if (!leaveRequest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
          <h2 className="text-2xl font-bold">Leave Request Not Found</h2>
          <p className="text-muted-foreground">
            The leave request you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/modules/leave-management')}>
            Back to Leave Management
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-6 space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/modules/leave-management')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Leave Request Details</h1>
              <p className="text-muted-foreground">ID: {leaveRequest.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasPermission('leave-requests.edit', 'leave-request') && (
              <Button onClick={handleEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {hasPermission('leave-requests.delete', 'leave-request') && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <History className="h-4 w-4 mr-2" />
                  View History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status Banner */}
        <Alert className={`border-l-4 ${
          leaveRequest.status === 'Approved' ? 'border-green-500 bg-green-50' :
          leaveRequest.status === 'Rejected' ? 'border-red-500 bg-red-50' :
          'border-yellow-500 bg-yellow-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {leaveRequest.status === 'Approved' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
               leaveRequest.status === 'Rejected' ? <XCircle className="h-4 w-4 text-red-600" /> :
               <Clock className="h-4 w-4 text-yellow-600" />}
              <span className="font-medium">
                {leaveRequest.status === 'Approved' ? 'Leave Request Approved' :
                 leaveRequest.status === 'Rejected' ? 'Leave Request Rejected' :
                 'Leave Request Pending Approval'}
              </span>
            </div>
            {leaveRequest.status === 'Pending' && hasPermission('leave-requests.approve', 'leave-request') && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleApprove}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={handleReject}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </Alert>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Employee Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Employee Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={leaveRequest.employee_avatar} />
                      <AvatarFallback>{leaveRequest.employee_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{leaveRequest.employee_name}</p>
                      <p className="text-sm text-muted-foreground">{leaveRequest.employee_id}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Department</span>
                      <span className="text-sm font-medium">{leaveRequest.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Position</span>
                      <span className="text-sm font-medium">{leaveRequest.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {getStatusBadge(leaveRequest.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Leave Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Leave Type</span>
                      <span className="text-sm font-medium">{leaveRequest.leave_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Days Requested</span>
                      <span className="text-sm font-medium">{leaveRequest.days_requested} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Start Date</span>
                      <span className="text-sm font-medium">{formatDate(leaveRequest.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">End Date</span>
                      <span className="text-sm font-medium">{formatDate(leaveRequest.end_date)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Leave Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Balance</span>
                      <span className="text-sm font-medium">{leaveRequest.total_leave_balance} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Used This Year</span>
                      <span className="text-sm font-medium">{leaveRequest.leave_taken_this_year} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Remaining</span>
                      <span className="text-sm font-medium">
                        {(leaveRequest.total_leave_balance || 0) - (leaveRequest.leave_taken_this_year || 0)} days
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage</span>
                        <span>{Math.round(calculateLeaveProgress())}%</span>
                      </div>
                      <Progress value={calculateLeaveProgress()} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reason */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Reason for Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{leaveRequest.reason}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Approval Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Approval Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Submitted Date</span>
                      <span className="text-sm font-medium">{formatDateTime(leaveRequest.submitted_date)}</span>
                    </div>
                    {leaveRequest.approved_by && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Approved By</span>
                        <span className="text-sm font-medium">{leaveRequest.approved_by}</span>
                      </div>
                    )}
                    {leaveRequest.approved_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Approved Date</span>
                        <span className="text-sm font-medium">{formatDateTime(leaveRequest.approved_date)}</span>
                      </div>
                    )}
                    {leaveRequest.comments && (
                      <div className="pt-2 border-t">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium mb-1">Comments</p>
                            <p className="text-sm text-muted-foreground">{leaveRequest.comments}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* System Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm font-medium">{formatDateTime(leaveRequest.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-sm font-medium">{formatDateTime(leaveRequest.updated_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Request ID</span>
                      <span className="text-sm font-medium font-mono">{leaveRequest.id}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveRequest.attachments && leaveRequest.attachments.length > 0 ? (
                  <div className="space-y-3">
                    {leaveRequest.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{attachment.name}</p>
                            <p className="text-sm text-muted-foreground">{attachment.type}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No attachments uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Approval History</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveRequest.approval_history && leaveRequest.approval_history.length > 0 ? (
                  <div className="space-y-4">
                    {leaveRequest.approval_history.map((history) => (
                      <div key={history.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{history.action}</p>
                            <span className="text-sm text-muted-foreground">{formatDateTime(history.date)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">by {history.approver}</p>
                          {history.comments && (
                            <p className="text-sm mt-2">{history.comments}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No approval history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}

export default function LeaveRequestDetailPageWrapper() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LeaveRequestDetailPage />
    </Suspense>
  );
} 