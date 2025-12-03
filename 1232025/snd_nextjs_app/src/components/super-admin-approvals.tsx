'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  AlertTriangle,
  BarChart3,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Shield,
  Truck,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ApprovalItem {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  module: string;
}

interface SuperAdminApprovalsProps {
  className?: string;
}

export function SuperAdminApprovals({ className }: SuperAdminApprovalsProps) {
  const { user } = useRBAC();
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalComment, setApprovalComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is SUPER_ADMIN
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    const mockApprovalItems: ApprovalItem[] = [
      {
        id: '1',
        type: 'Rental Request',
        title: 'Equipment Rental - Excavator',
        description: 'Request for excavator rental for construction project',
        status: 'pending',
        submittedBy: 'John Doe',
        submittedAt: '2025-01-15T10:30:00Z',
        priority: 'high',
        module: 'rental',
      },
      {
        id: '2',
        type: 'Timesheet Approval',
        title: 'Weekly Timesheet - Sarah Smith',
        description: 'Timesheet submission for week ending Jan 12, 2025',
        status: 'pending',
        submittedBy: 'Sarah Smith',
        submittedAt: '2025-01-14T16:45:00Z',
        priority: 'medium',
        module: 'timesheet',
      },
      {
        id: '3',
        type: 'Payroll Approval',
        title: 'Monthly Payroll - January 2025',
        description: 'Monthly payroll processing for all employees',
        status: 'pending',
        submittedBy: 'HR Manager',
        submittedAt: '2025-01-15T09:15:00Z',
        priority: 'urgent',
        module: 'payroll',
      },
      {
        id: '4',
        type: 'Leave Request',
        title: 'Vacation Leave - Mike Johnson',
        description: 'Request for 2 weeks vacation leave',
        status: 'pending',
        submittedBy: 'Mike Johnson',
        submittedAt: '2025-01-13T14:20:00Z',
        priority: 'low',
        module: 'leave',
      },
      {
        id: '5',
        type: 'Equipment Maintenance',
        title: 'Equipment Repair - Bulldozer #3',
        description: 'Maintenance request for bulldozer engine repair',
        status: 'pending',
        submittedBy: 'Maintenance Team',
        submittedAt: '2025-01-15T11:00:00Z',
        priority: 'high',
        module: 'equipment',
      },
    ];
    setApprovalItems(mockApprovalItems);
  }, []);

  const handleApproval = async (item: ApprovalItem, action: 'approve' | 'reject') => {
    setSelectedItem(item);
    setApprovalAction(action);
    setIsApprovalDialogOpen(true);
  };

  const submitApproval = async () => {
    if (!selectedItem) return;

    setLoading(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the item status
      setApprovalItems(prev =>
        prev.map(item =>
          item.id === selectedItem.id
            ? { ...item, status: approvalAction === 'approve' ? 'approved' : 'rejected' }
            : item
        )
      );

      toast.success(
        `${selectedItem.type} ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully!`
      );

      setIsApprovalDialogOpen(false);
      setSelectedItem(null);
      setApprovalComment('');
    } catch (error) {
      toast.error('Failed to process approval. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'rental':
        return <Truck className="h-4 w-4" />;
      case 'timesheet':
        return <FileText className="h-4 w-4" />;
      case 'payroll':
        return <DollarSign className="h-4 w-4" />;
      case 'leave':
        return <Calendar className="h-4 w-4" />;
      case 'equipment':
        return <Wrench className="h-4 w-4" />;
      case 'employee':
        return <Users className="h-4 w-4" />;
      case 'customer':
        return <Building className="h-4 w-4" />;
      case 'report':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isSuperAdmin) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Super Admin Approvals
          </CardTitle>
          <CardDescription>This feature is only available to SUPER_ADMIN users.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You need SUPER_ADMIN privileges to access approval management.
          </p>
        </CardContent>
      </Card>
    );
  }

  const pendingItems = approvalItems.filter(item => item.status === 'pending');
  const approvedItems = approvalItems.filter(item => item.status === 'approved');
  const rejectedItems = approvalItems.filter(item => item.status === 'rejected');

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Super Admin Approval Center
          </CardTitle>
          <CardDescription>
            Manage all system approvals with full administrative privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingItems.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved ({approvedItems.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({rejectedItems.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                All ({approvalItems.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <div className="space-y-4">
                {pendingItems.map(item => (
                  <Card key={item.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getModuleIcon(item.module)}
                            <h3 className="font-semibold">{item.title}</h3>
                            <Badge variant={getPriorityColor(item.priority)}>
                              {item.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By: {item.submittedBy}</span>
                            <span>Type: {item.type}</span>
                            <span>
                              Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproval(item, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApproval(item, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No pending approvals</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              <div className="space-y-4">
                {approvedItems.map(item => (
                  <Card key={item.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getModuleIcon(item.module)}
                            <h3 className="font-semibold">{item.title}</h3>
                            <Badge variant="outline" className="text-green-600">
                              APPROVED
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By: {item.submittedBy}</span>
                            <span>Type: {item.type}</span>
                            <span>
                              Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {approvedItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No approved items</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              <div className="space-y-4">
                {rejectedItems.map(item => (
                  <Card key={item.id} className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getModuleIcon(item.module)}
                            <h3 className="font-semibold">{item.title}</h3>
                            <Badge variant="outline" className="text-red-600">
                              REJECTED
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By: {item.submittedBy}</span>
                            <span>Type: {item.type}</span>
                            <span>
                              Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {rejectedItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No rejected items</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="flex items-center gap-2">
                        {getModuleIcon(item.module)}
                        {item.type}
                      </TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(item.priority)}>
                          {item.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.submittedBy}</TableCell>
                      <TableCell>{new Date(item.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {item.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproval(item, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproval(item, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approvalAction === 'approve' ? 'Approve' : 'Reject'} Request</DialogTitle>
            <DialogDescription>{selectedItem?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                placeholder={`Add a comment for ${approvalAction === 'approve' ? 'approval' : 'rejection'}...`}
                value={approvalComment}
                onChange={e => setApprovalComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              disabled={loading}
              className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {loading ? 'Processing...' : approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
