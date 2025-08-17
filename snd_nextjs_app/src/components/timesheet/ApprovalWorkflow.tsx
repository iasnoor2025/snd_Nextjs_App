"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Circle } from "lucide-react";
import { toast } from "sonner";

interface ApprovalWorkflowProps {
  timesheet: {
    id: string;
    status: string;
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
    employee: {
      firstName: string;
      lastName: string;
    };
  };
  userRole: string;
  onStatusChange: () => void;
}

const approvalStages = [
  { key: 'submitted', label: 'Submitted', description: 'Awaiting foreman approval' },
  { key: 'foreman_approved', label: 'Foreman Approved', description: 'Awaiting timesheet incharge approval' },
  { key: 'incharge_approved', label: 'Incharge Approved', description: 'Awaiting timesheet checking approval' },
  { key: 'checking_approved', label: 'Checking Approved', description: 'Awaiting manager approval' },
  { key: 'manager_approved', label: 'Manager Approved', description: 'Fully approved' },
];

export default function ApprovalWorkflow({ timesheet, userRole, onStatusChange }: ApprovalWorkflowProps) {
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [approvalStage, setApprovalStage] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const getCurrentStageIndex = () => {
    return approvalStages.findIndex(stage => stage.key === timesheet.status);
  };

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStageIndex();
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / approvalStages.length) * 100;
  };

  const canApproveAtStage = (stage: string) => {
    const stageIndex = approvalStages.findIndex(s => s.key === stage);
    const currentIndex = getCurrentStageIndex();

    // Can only approve if it's the next stage in sequence
    return currentIndex === stageIndex - 1;
  };

  const canRejectAtStage = () => {
    return true; // Simplified for now
  };

  const hasPermissionForStage = (stage: string) => {
    switch (stage) {
      case 'foreman':
        return userRole === 'FOREMAN' || userRole === 'ADMIN';
      case 'incharge':
        return userRole === 'TIMESHEET_INCHARGE' || userRole === 'ADMIN';
      case 'checking':
        return userRole === 'TIMESHEET_CHECKER' || userRole === 'ADMIN';
      case 'manager':
        return userRole === 'MANAGER' || userRole === 'ADMIN';
      default:
        return false;
    }
  };

  const handleApprove = async () => {
    if (!approvalStage) return;

    setLoading(true);
    try {
      const response = await fetch('/api/timesheets/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          timesheetId: timesheet.id,
          approvalStage,
          notes
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve timesheet');
      }

      toast.success(data.message);
      setIsApprovalDialogOpen(false);
      setNotes('');
      setApprovalStage('');
      onStatusChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve timesheet');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/timesheets/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          timesheetId: timesheet.id,
          rejectionReason: rejectionReason.trim(),
          rejectionStage: approvalStage
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject timesheet');
      }

      toast.success(data.message);
      setIsRejectionDialogOpen(false);
      setRejectionReason('');
      setApprovalStage('');
      onStatusChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject timesheet');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isCompleted: boolean, isCurrent: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (isCurrent) {
      return <Clock className="h-5 w-5 text-blue-500" />;
    } else {
      return <Circle className="h-5 w-5 text-gray-300" />;
    }
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Approval Workflow
            {getStatusBadge(timesheet.status)}
          </CardTitle>
          <CardDescription>
            Timesheet for {timesheet.employee.firstName} {timesheet.employee.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>

            {/* Approval Stages */}
            <div className="space-y-3">
              {approvalStages.map((stage, index) => {
                const isCompleted = index <= getCurrentStageIndex();
                const isCurrent = stage.key === timesheet.status;
                const stageKey = stage.key.split('_')[0];
                if (stageKey) {
                  const canApprove = canApproveAtStage(stage.key) && hasPermissionForStage(stageKey);
                  const canReject = canRejectAtStage() && hasPermissionForStage(stageKey);

                  return (
                    <div key={stage.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(isCompleted, isCurrent)}
                        <div>
                          <div className="font-medium">{stage.label}</div>
                          <div className="text-sm text-gray-500">{stage.description}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {canApprove && (
                          <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setApprovalStage(stageKey);
                                  setIsApprovalDialogOpen(true);
                                }}
                              >
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Timesheet</DialogTitle>
                                <DialogDescription>
                                  Approve this timesheet at {stageKey} stage
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Notes (Optional)</label>
                                  <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add approval notes..."
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleApprove} disabled={loading}>
                                  {loading ? 'Approving...' : 'Approve'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}

                        {canReject && (
                          <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setApprovalStage(stageKey);
                                  setIsRejectionDialogOpen(true);
                                }}
                              >
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Timesheet</DialogTitle>
                                <DialogDescription>
                                  Reject this timesheet at {stageKey} stage
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Rejection Reason *</label>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Provide a reason for rejection..."
                                    className="mt-1"
                                    required
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleReject}
                                  disabled={loading || !rejectionReason.trim()}
                                >
                                  {loading ? 'Rejecting...' : 'Reject'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* Rejection Info */}
            {timesheet.status === 'rejected' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Rejected</span>
                </div>
                <div className="mt-2 text-sm text-red-700">
                  <p><strong>Stage:</strong> {timesheet.rejectionStage}</p>
                  <p><strong>Reason:</strong> {timesheet.rejectionReason}</p>
                  <p><strong>Date:</strong> {timesheet.rejectedAt ? new Date(timesheet.rejectedAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
