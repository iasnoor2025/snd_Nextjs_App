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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarCheck,
  CheckCircle,
  CircleDashed,
  Clock,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  MoreHorizontal,
  Package,
  Plus,
  Printer,
  Receipt,
  Share2,
  Trash2,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RentalItem {
  id: string;
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  days?: number;
  rateType: string;
  operatorId?: string;
  status?: string;
  notes?: string;
}

interface Payment {
  id: string;
  rentalId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  status: string;
  notes?: string;
}

interface Invoice {
  id: string;
  rentalId: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string;
  issuedDate: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface WorkflowEvent {
  id: string;
  action: string;
  description: string;
  performedBy: string;
  performedAt: string;
  status: string;
}

interface Rental {
  id: string;
  rentalNumber: string;
  customerId?: string;
  customer?: Customer;
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  status?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  paymentStatus?: string;
  notes?: string;
  depositAmount: number;
  paymentTermsDays: number;
  hasTimesheet: boolean;
  hasOperators: boolean;
  createdAt: string;
  updatedAt: string;
  rentalItems?: RentalItem[];
  payments?: Payment[];
  invoices?: Invoice[];
  statusLogs?: any[];
  quotationId?: string;
  approvedAt?: string;
  mobilizationDate?: string;
  invoiceDate?: string;
  paymentDueDate?: string;
  completedAt?: string;
}

interface TimelineEvent {
  id: string;
  name: string;
  description: string;
  date: string | null;
  icon: React.ElementType;
  color: string;
  active: boolean;
  status: 'completed' | 'current' | 'upcoming';
}

// Workflow Timeline Component
function UnifiedTimeline({ rental }: { rental: Rental }) {
  const generateTimelineEvents = (): TimelineEvent[] => {
    if (!rental) return [];

    const safeFormatDate = (date: string | null | undefined): string | null => {
      if (!date) return null;
      try {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          
          return null;
        }
        return format(dateObj, 'MMM d, yyyy');
      } catch (e) {
        
        return null;
      }
    };

    const events: TimelineEvent[] = [
      {
        id: 'created',
        name: 'Created',
        description: 'Rental request created',
        date: safeFormatDate(rental.createdAt),
        icon: CircleDashed,
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        active: true,
        status: 'completed',
      },
      {
        id: 'quotation',
        name: 'Quotation',
        description: 'Quotation generated',
        date: safeFormatDate(rental.quotationId ? rental.createdAt : null),
        icon: FileText,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        active: !!(
          rental.quotationId ||
          rental.status === 'quotation_generated' ||
          rental.statusLogs?.some((log: any) => log.newStatus === 'quotation_generated')
        ),
        status:
          rental.quotationId ||
          rental.status === 'quotation_generated' ||
          rental.statusLogs?.some((log: any) => log.newStatus === 'quotation_generated')
            ? 'completed'
            : 'upcoming',
      },
      {
        id: 'quotation_approved',
        name: 'Quotation Approved',
        description: 'Approved by customer',
        date: safeFormatDate(rental.approvedAt),
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700 border-green-200',
        active: !!(
          rental.approvedAt || rental.statusLogs?.some((log: any) => log.newStatus === 'approved')
        ),
        status:
          rental.approvedAt || rental.statusLogs?.some((log: any) => log.newStatus === 'approved')
            ? 'completed'
            : 'upcoming',
      },
      {
        id: 'mobilization',
        name: 'Mobilization',
        description: 'Equipment delivery',
        date: safeFormatDate(rental.mobilizationDate),
        icon: Truck,
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        active: !!(
          rental.mobilizationDate ||
          rental.status === 'mobilization' ||
          rental.statusLogs?.some((log: any) => log.newStatus === 'mobilization')
        ),
        status:
          rental.mobilizationDate ||
          rental.status === 'mobilization' ||
          rental.statusLogs?.some((log: any) => log.newStatus === 'mobilization')
            ? 'completed'
            : 'upcoming',
      },
      {
        id: 'active',
        name: 'Active',
        description: 'Rental in progress',
        date: safeFormatDate(rental.startDate),
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        active: rental.status === 'active' || false,
        status:
          rental.status === 'active'
            ? 'current'
            : rental.status === 'completed'
              ? 'completed'
              : 'upcoming',
      },
      {
        id: 'completed',
        name: 'Completed',
        description: 'Rental finished',
        date: safeFormatDate(rental.actualEndDate || rental.completedAt),
        icon: CalendarCheck,
        color: 'bg-green-100 text-green-700 border-green-200',
        active: !!(rental.actualEndDate || rental.completedAt),
        status: rental.actualEndDate || rental.completedAt ? 'completed' : 'upcoming',
      },
      {
        id: 'invoice',
        name: 'Invoice Created',
        description: 'Invoice generated',
        date: safeFormatDate(rental.invoiceDate),
        icon: Receipt,
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        active: !!(rental.invoiceDate || (rental.invoices && rental.invoices.length > 0)),
        status:
          rental.invoiceDate || (rental.invoices && rental.invoices.length > 0)
            ? 'completed'
            : 'upcoming',
      },
      {
        id: 'overdue',
        name: 'Overdue',
        description: 'Payment overdue',
        date: safeFormatDate(rental.paymentDueDate),
        icon: AlertCircle,
        color: 'bg-red-100 text-red-700 border-red-200',
        active: rental.status === 'overdue',
        status: rental.status === 'overdue' ? 'current' : 'upcoming',
      },
    ];

    return events;
  };

  const timelineEvents = generateTimelineEvents();
  const activeEvents = timelineEvents.filter(event => event.active);

  // Map status logs to workflow events
  const auditEvents =
    rental.statusLogs?.map((log: any) => ({
      id: log.id,
      action: log.newStatus,
      description: log.reason,
      performedBy: log.changedBy,
      performedAt: log.changedAt,
      status: log.newStatus,
    })) || [];

  // Action handlers
  const handleGenerateQuotation = async () => {
    try {
      const response = await fetch(`/api/rentals/${rental.id}/quotation`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quotation');
      }
      toast.success('Quotation generated successfully');
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate quotation');
    }
  };

  const handleApproveQuotation = async () => {
    try {
      const response = await fetch(`/api/rentals/${rental.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve quotation');
      }
      toast.success('Quotation approved successfully');
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve quotation');
    }
  };

  const handleStartMobilization = async () => {
    try {
      const response = await fetch(`/api/rentals/${rental.id}/mobilize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start mobilization');
      }
      toast.success('Mobilization started successfully');
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start mobilization');
    }
  };

  const handleActivateRental = async () => {
    try {
      const response = await fetch(`/api/rentals/${rental.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate rental');
      }
      toast.success('Rental activated successfully');
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate rental');
    }
  };

  const handleCompleteRental = async () => {
    try {
      const response = await fetch(`/api/rentals/${rental.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete rental');
      }
      toast.success('Rental completed successfully');
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete rental');
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const response = await fetch(`/api/rentals/${rental.id}/invoice`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate invoice');
      }
      toast.success('Invoice generated successfully');
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate invoice');
    }
  };

  // Get action button for each event
  const getActionButton = (event: TimelineEvent) => {
    switch (event.id) {
      case 'quotation':
        if (
          !rental.quotationId &&
          rental.status !== 'quotation_generated' &&
          !rental.statusLogs?.some((log: any) => log.newStatus === 'quotation_generated')
        ) {
          return (
            <Button size="sm" onClick={handleGenerateQuotation} className="mt-2">
              <FileText className="w-3 h-3 mr-1" />
              Generate Quotation
            </Button>
          );
        }
        break;
      case 'quotation_approved':
        if (
          (rental.quotationId || rental.status === 'quotation_generated') &&
          !rental.approvedAt &&
          !rental.statusLogs?.some((log: any) => log.newStatus === 'approved')
        ) {
          return (
            <Button size="sm" onClick={handleApproveQuotation} className="mt-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              Approve Quotation
            </Button>
          );
        }
        break;
      case 'mobilization':
        if (
          (rental.approvedAt || rental.status === 'approved') &&
          !rental.mobilizationDate &&
          rental.status !== 'mobilization' &&
          !rental.statusLogs?.some((log: any) => log.newStatus === 'mobilization')
        ) {
          return (
            <Button size="sm" onClick={handleStartMobilization} className="mt-2">
              <Truck className="w-3 h-3 mr-1" />
              Start Mobilization
            </Button>
          );
        }
        break;
      case 'active':
        if (
          rental.mobilizationDate &&
          rental.status !== 'active' &&
          rental.status !== 'completed'
        ) {
          return (
            <Button size="sm" onClick={handleActivateRental} className="mt-2">
              <Clock className="w-3 h-3 mr-1" />
              Activate Rental
            </Button>
          );
        }
        break;
      case 'completed':
        if (rental.status === 'active' && !rental.actualEndDate) {
          return (
            <Button size="sm" onClick={handleCompleteRental} className="mt-2">
              <CalendarCheck className="w-3 h-3 mr-1" />
              Complete Rental
            </Button>
          );
        }
        break;
      case 'invoice':
        if ((rental.status === 'completed' || rental.actualEndDate) && !rental.invoiceDate) {
          return (
            <Button size="sm" onClick={handleGenerateInvoice} className="mt-2">
              <Receipt className="w-3 h-3 mr-1" />
              Generate Invoice
            </Button>
          );
        } else if (rental.invoiceDate && rental.invoices && rental.invoices.length > 0) {
          return (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`/api/rentals/${rental.id}/invoice/download`, '_blank')}
              >
                <Download className="w-3 h-3 mr-1" />
                Download PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(
                    `${process.env.NEXT_PUBLIC_ERPNEXT_URL}/app/sales-invoice/${rental.invoices?.[0]?.id || ''}`,
                    '_blank'
                  )
                }
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View in ERPNext
              </Button>
            </div>
          );
        }
        break;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental Timeline</CardTitle>
        <CardDescription>Complete workflow and activity timeline</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Workflow Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Workflow Progress</h3>
            <ol className="relative border-l border-muted">
              {timelineEvents.map((event, index) => (
                <li key={event.id} className="mb-6 ml-6">
                  <span
                    className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ${event.color}`}
                  >
                    <event.icon className="h-3 w-3" />
                  </span>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 flex items-center text-sm font-semibold">{event.name}</h3>
                      {event.date && (
                        <time className="mb-1 block text-xs font-normal text-muted-foreground">
                          {event.date}
                        </time>
                      )}
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                      <Badge
                        variant={
                          event.status === 'completed'
                            ? 'default'
                            : event.status === 'current'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="mt-1"
                      >
                        {event.status}
                      </Badge>
                    </div>
                    {getActionButton(event)}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Activity Log */}
          {auditEvents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Activity Log</h3>
              <ol className="relative border-l border-muted">
                {auditEvents.map((event: WorkflowEvent, index: number) => (
                  <li key={event.id || index} className="mb-4 ml-6">
                    <span
                      className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ${
                        event.status === 'cancelled'
                          ? 'border-red-200 bg-red-100 text-red-700'
                          : event.status === 'rejected'
                            ? 'border-yellow-200 bg-yellow-100 text-yellow-700'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                      }`}
                    >
                      <AlertCircle className="h-3 w-3" />
                    </span>
                    <div>
                      <h3 className="mb-1 flex items-center text-sm font-semibold">
                        {event.action || event.status}
                      </h3>
                      {event.performedAt && (
                        <time className="mb-1 block text-xs font-normal text-muted-foreground">
                          {format(new Date(event.performedAt), 'MMM dd, yyyy HH:mm')}
                        </time>
                      )}
                      <p className="text-xs text-muted-foreground">{event.description || ''}</p>
                      {event.performedBy && (
                        <p className="text-xs text-muted-foreground">By: {event.performedBy}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Key Events Summary */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Key Events</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Rental Created</p>
                  <p className="text-xs text-muted-foreground">
                    {rental.createdAt && !isNaN(new Date(rental.createdAt).getTime())
                      ? format(new Date(rental.createdAt), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {rental.quotationId && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Quotation Generated</p>
                    <p className="text-xs text-muted-foreground">
                      {rental.createdAt && !isNaN(new Date(rental.createdAt).getTime())
                        ? format(new Date(rental.createdAt), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              {rental.approvedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Quotation Approved</p>
                    <p className="text-xs text-muted-foreground">
                      {rental.approvedAt && !isNaN(new Date(rental.approvedAt).getTime())
                        ? format(new Date(rental.approvedAt), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              {rental.mobilizationDate && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Mobilization Started</p>
                    <p className="text-xs text-muted-foreground">
                      {rental.mobilizationDate &&
                      !isNaN(new Date(rental.mobilizationDate).getTime())
                        ? format(new Date(rental.mobilizationDate), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              {rental.status === 'active' && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Rental Started</p>
                    <p className="text-xs text-muted-foreground">
                      {rental.startDate && !isNaN(new Date(rental.startDate).getTime())
                        ? format(new Date(rental.startDate), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              {rental.status === 'completed' && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Rental Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {rental.actualEndDate && !isNaN(new Date(rental.actualEndDate).getTime())
                        ? format(new Date(rental.actualEndDate), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RentalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rentalId = params.id as string;

  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    rentalNumber: '',
    startDate: '',
    expectedEndDate: '',
    depositAmount: '',
    paymentTermsDays: '30',
    hasTimesheet: false,
    hasOperators: false,
    status: 'pending',
    paymentStatus: 'pending',
    notes: '',
  });

  const [itemFormData, setItemFormData] = useState({
    id: '',
    equipmentId: '',
    equipmentName: '',
    unitPrice: 0,
    totalPrice: 0,
    rateType: 'daily',
    operatorId: '',
    status: 'active',
    notes: '',
    actionType: 'update', // 'handover', 'remove', 'add', 'update'
  });

  const [equipment, setEquipment] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Helper function to convert Decimal to number
  const formatAmount = (amount: any): string => {
    if (amount === null || amount === undefined) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Get status badge color
  const getStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge variant="outline">Unknown</Badge>;
    }

    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge variant="outline">Unknown</Badge>;
    }

    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'partial':
        return <Badge variant="default">Partial</Badge>;
      case 'paid':
        return <Badge variant="default">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Fetch rental details
  const fetchRental = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rentals/${rentalId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rental');
      }
      const data = await response.json();

      setRental(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch rental details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch equipment
  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      if (!response.ok) {
        throw new Error('Failed to fetch equipment');
      }
      const data = await response.json();
      setEquipment(data.data || data.equipment || []);
    } catch (err) {
      
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      setEmployees(data.data || data.employees || []);
    } catch (err) {
      
    }
  };

  // Update rental
  const updateRental = async () => {
    if (!rental) return;

    try {
      const response = await fetch(`/api/rentals/${rental.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          depositAmount: parseFloat(formData.depositAmount) || 0,
          paymentTermsDays: parseInt(formData.paymentTermsDays),
          startDate: new Date(formData.startDate).toISOString(),
          expectedEndDate: formData.expectedEndDate
            ? new Date(formData.expectedEndDate).toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update rental');
      }

      toast.success('Rental updated successfully');
      setIsEditDialogOpen(false);
      fetchRental();
    } catch (err) {
      toast.error('Failed to update rental');
    }
  };

  // Delete rental
  const deleteRental = async () => {
    if (!rental) return;

    if (!confirm('Are you sure you want to delete this rental?')) return;

    try {
      const response = await fetch(`/api/rentals/${rental.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete rental');
      }

      toast.success('Rental deleted successfully');
      router.push('/modules/rental-management');
    } catch (err) {
      toast.error('Failed to delete rental');
    }
  };

  // Generate invoice
  const generateInvoice = async () => {
    if (!rental) return;

    try {
      const response = await fetch(`/api/rentals/${rental.id}/invoice`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      toast.success('Invoice generated successfully');
      fetchRental();
    } catch (err) {
      toast.error('Failed to generate invoice');
    }
  };

  // Generate quotation
  const generateQuotation = async () => {
    if (!rental) return;

    try {
      const response = await fetch(`/api/rentals/${rental.id}/quotation`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quotation');
      }

      toast.success('Quotation generated successfully');
      fetchRental();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate quotation');
    }
  };

  // Approve quotation
  const handleApproveQuotation = async () => {
    if (!rental) return;

    try {
      const response = await fetch(`/api/rentals/${rental.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve quotation');
      }

      toast.success('Quotation approved successfully');
      fetchRental();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve quotation');
    }
  };

  // Start mobilization
  const handleStartMobilization = async () => {
    if (!rental) return;

    try {
      const response = await fetch(`/api/rentals/${rental.id}/mobilize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start mobilization');
      }

      toast.success('Mobilization started successfully');
      fetchRental();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start mobilization');
    }
  };

  // Activate rental
  const handleActivateRental = async () => {
    if (!rental) return;

    try {
      const response = await fetch(`/api/rentals/${rental.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate rental');
      }

      toast.success('Rental activated successfully');
      fetchRental();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate rental');
    }
  };

  // Complete rental
  const handleCompleteRental = async () => {
    if (!rental) return;

    try {
      const response = await fetch(`/api/rentals/${rental.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete rental');
      }

      toast.success('Rental completed successfully');
      fetchRental();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete rental');
    }
  };

  // Open edit dialog
  const openEditDialog = () => {
    if (!rental) return;

    setFormData({
      customerId: rental.customerId || '',
      rentalNumber: rental.rentalNumber,
      startDate: rental.startDate.split('T')[0],
      expectedEndDate: rental.expectedEndDate ? rental.expectedEndDate.split('T')[0] : '',
      depositAmount: formatAmount(rental.depositAmount),
      paymentTermsDays: rental.paymentTermsDays.toString(),
      hasTimesheet: rental.hasTimesheet,
      hasOperators: rental.hasOperators,
      status: rental.status || 'pending',
      paymentStatus: rental.paymentStatus || 'pending',
      notes: rental.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  // Add rental item
  const addRentalItem = async () => {
    if (!rental) return;

    // Validate required fields
    if (!itemFormData.equipmentName || !itemFormData.unitPrice) {
      toast.error('Please fill in all required fields: Equipment and Unit Price');
      return;
    }

    try {
      // Calculate total price
      const totalPrice = itemFormData.unitPrice;

      const requestData = {
        ...itemFormData,
        totalPrice,
        rentalId: rental.id,
      };

      const response = await fetch(`/api/rentals/${rental.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        throw new Error(errorData.error || 'Failed to add rental item');
      }

      toast.success('Rental item added successfully');
      setIsAddItemDialogOpen(false);

      // Reset form
      setItemFormData({
        id: '',
        equipmentId: '',
        equipmentName: '',
        unitPrice: 0,
        totalPrice: 0,
        rateType: 'daily',
        operatorId: '',
        status: 'active',
        notes: '',
        actionType: 'update',
      });

      // Refresh rental data
      fetchRental();
    } catch (err) {
      toast.error('Failed to add rental item');
    }
  };

  const openEditItemDialog = (item: any) => {
    setItemFormData({
      id: item.id,
      equipmentId: item.equipment_id?.toString() || item.equipmentId?.toString() || '',
      equipmentName: item.equipment_name || item.equipmentName || '',
      unitPrice: item.unit_price || item.unitPrice || 0,
      totalPrice: item.total_price || item.totalPrice || 0,
      rateType: item.rate_type || item.rateType || 'daily',
      operatorId: item.operatorId?.toString() || '',
      status: item.status || 'active',
      notes: item.notes || '',
      actionType: 'update', // Default to update mode
    });
    setIsEditItemDialogOpen(true);
  };

  const updateRentalItem = async () => {
    if (!rental) return;

    // Validate required fields
    if (!itemFormData.equipmentName || !itemFormData.unitPrice) {
      toast.error('Please fill in all required fields: Equipment and Unit Price');
      return;
    }

    try {
      // Calculate total price
      const totalPrice = itemFormData.unitPrice;

      const requestData = {
        ...itemFormData,
        totalPrice,
      };

      const response = await fetch(`/api/rentals/${rental.id}/items/${itemFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        throw new Error(errorData.error || 'Failed to update rental item');
      }

      toast.success('Rental item updated successfully');
      setIsEditItemDialogOpen(false);

      // Reset form
      setItemFormData({
        id: '',
        equipmentId: '',
        equipmentName: '',
        unitPrice: 0,
        totalPrice: 0,
        rateType: 'daily',
        operatorId: '',
        status: 'active',
        notes: '',
        actionType: 'update',
      });

      // Refresh rental data
      fetchRental();
    } catch (err) {
      toast.error('Failed to update rental item');
    }
  };

  const handleOperatorAction = (actionType: string) => {
    setItemFormData(prev => ({ ...prev, actionType }));

    // Show appropriate message based on action type
    switch (actionType) {
      case 'handover':
        toast.info(
          'Operator Handover Mode: Previous operator will be ended, new operator will be assigned'
        );
        break;
      case 'remove':
        toast.info('Remove Operator Mode: Current operator assignment will be deleted');
        break;
      case 'add':
        toast.info('Add Operator Mode: New operator will be assigned');
        break;
      case 'update':
        toast.info('Update Mode: Operator will be updated based on rental status');
        break;
    }
  };

  const deleteRentalItem = async (itemId: string) => {
    if (!rental) return;

    if (!confirm('Are you sure you want to delete this rental item?')) return;

    try {
      const response = await fetch(`/api/rentals/${rental.id}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        throw new Error(errorData.error || 'Failed to delete rental item');
      }

      toast.success('Rental item deleted successfully');
      fetchRental();
    } catch (err) {
      toast.error('Failed to delete rental item');
    }
  };

  useEffect(() => {
    if (rentalId) {
      fetchRental();
      fetchEquipment();
      fetchEmployees();
    }
  }, [rentalId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 text-lg">Error: {error || 'Rental not found'}</p>
          <Button onClick={() => router.push('/modules/rental-management')} className="mt-4">
            Back to Rentals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/modules/rental-management')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Rental #{rental.rentalNumber}</h1>
            <p className="text-muted-foreground">
              {rental.customer?.name} •{' '}
              {rental.startDate && !isNaN(new Date(rental.startDate).getTime())
                ? format(new Date(rental.startDate), 'MMM dd, yyyy')
                : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openEditDialog}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={deleteRental}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusBadge(rental.status)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPaymentStatusBadge(rental.paymentStatus)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatAmount(rental.totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rental.rentalItems?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Rental Details */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Rental Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Rental Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Rental Number</Label>
                      <p className="text-sm text-muted-foreground">{rental.rentalNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Customer</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.customer?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Start Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.startDate && !isNaN(new Date(rental.startDate).getTime())
                          ? format(new Date(rental.startDate), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Expected End Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.expectedEndDate &&
                        !isNaN(new Date(rental.expectedEndDate).getTime())
                          ? format(new Date(rental.expectedEndDate), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Actual End Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.actualEndDate && !isNaN(new Date(rental.actualEndDate).getTime())
                          ? format(new Date(rental.actualEndDate), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Payment Terms</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.paymentTermsDays} days
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Deposit Amount</Label>
                      <p className="text-sm text-muted-foreground">
                        ${formatAmount(rental.depositAmount)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.createdAt && !isNaN(new Date(rental.createdAt).getTime())
                          ? format(new Date(rental.createdAt), 'MMM dd, yyyy HH:mm')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {rental.notes && (
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm text-muted-foreground mt-1">{rental.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${formatAmount(rental.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({rental.tax}%):</span>
                      <span>${formatAmount(rental.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-${formatAmount(rental.discount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total Amount:</span>
                      <span>${formatAmount(rental.totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflow" className="space-y-6">
              {/* Unified Timeline */}
              <UnifiedTimeline rental={rental} />
            </TabsContent>

            <TabsContent value="items" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Rental Items</CardTitle>
                    <Button size="sm" onClick={() => setIsAddItemDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total Price</TableHead>
                        <TableHead>Rate Type</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rental.rentalItems?.map(item => {
                        // Find operator name from employees list
                        const operatorId = item.operatorId;
                        const operator = employees.find(
                          emp => emp.id.toString() === operatorId?.toString()
                        );
                        const operatorName = operator
                          ? `${operator.first_name} ${operator.last_name}`
                          : 'N/A';

                        return (
                          <TableRow key={item.id}>
                            <TableCell>{item.equipmentName}</TableCell>
                            <TableCell>${formatAmount(item.unitPrice)}</TableCell>
                            <TableCell>${formatAmount(item.totalPrice)}</TableCell>
                            <TableCell>{item.rateType}</TableCell>
                            <TableCell>{operatorName}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                                {item.status || 'active'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditItemDialog(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteRentalItem(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {(!rental.rentalItems || rental.rentalItems.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No rental items found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Payments</CardTitle>
                    <Button size="sm" onClick={() => setIsAddPaymentDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rental.payments?.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>${formatAmount(payment.amount)}</TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell>{payment.reference}</TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(!rental.payments || rental.payments.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">No payments found</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Invoices</CardTitle>
                    <Button size="sm" onClick={generateInvoice}>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Invoice
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rental.invoices?.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                          <TableCell>${formatAmount(invoice.amount)}</TableCell>
                          <TableCell>{getPaymentStatusBadge(invoice.status)}</TableCell>
                          <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(!rental.invoices || rental.invoices.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">No invoices found</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Actions & Customer Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!rental.quotationId &&
                rental.status !== 'quotation_generated' &&
                !rental.statusLogs?.some((log: any) => log.newStatus === 'quotation_generated') && (
                  <Button className="w-full" onClick={generateQuotation}>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Quotation
                  </Button>
                )}
              {(rental.quotationId ||
                rental.status === 'quotation_generated' ||
                rental.statusLogs?.some((log: any) => log.newStatus === 'quotation_generated')) && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/modules/rental-management/${rental.id}/quotation`)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Quotation
                </Button>
              )}
              {(rental.quotationId || rental.status === 'quotation_generated') &&
                !rental.approvedAt &&
                !rental.statusLogs?.some((log: any) => log.newStatus === 'approved') && (
                  <Button className="w-full" variant="outline" onClick={handleApproveQuotation}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Quotation
                  </Button>
                )}
              {(rental.approvedAt || rental.status === 'approved') &&
                !rental.mobilizationDate &&
                rental.status !== 'mobilization' &&
                !rental.statusLogs?.some((log: any) => log.newStatus === 'mobilization') && (
                  <Button className="w-full" variant="outline" onClick={handleStartMobilization}>
                    <Truck className="w-4 h-4 mr-2" />
                    Start Mobilization
                  </Button>
                )}
              {(rental.mobilizationDate || rental.status === 'mobilization') &&
                rental.status !== 'active' &&
                rental.status !== 'completed' && (
                  <Button className="w-full" variant="outline" onClick={handleActivateRental}>
                    <Clock className="w-4 h-4 mr-2" />
                    Activate Rental
                  </Button>
                )}
              {rental.status === 'active' && !rental.actualEndDate && (
                <Button className="w-full" variant="outline" onClick={handleCompleteRental}>
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Complete Rental
                </Button>
              )}
              {(rental.status === 'completed' || rental.actualEndDate) &&
                !rental.invoiceDate &&
                !rental.invoices?.length && (
                  <Button className="w-full" variant="outline" onClick={generateInvoice}>
                    <Receipt className="w-4 h-4 mr-2" />
                    Generate Invoice
                  </Button>
                )}
              <Button className="w-full" variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print Rental
              </Button>
              <Button className="w-full" variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {rental.customer && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{rental.customer.name}</p>
                </div>
                {rental.customer.email && (
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{rental.customer.email}</p>
                  </div>
                )}
                {rental.customer.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">{rental.customer.phone}</p>
                  </div>
                )}
                {rental.customer.address && (
                  <div>
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-sm text-muted-foreground">{rental.customer.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Rental Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Rental</DialogTitle>
            <DialogDescription>Update rental contract details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editRentalNumber">Rental Number</Label>
              <Input
                id="editRentalNumber"
                value={formData.rentalNumber}
                onChange={e => setFormData(prev => ({ ...prev, rentalNumber: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editStartDate">Start Date</Label>
              <Input
                id="editStartDate"
                type="date"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editExpectedEndDate">Expected End Date</Label>
              <Input
                id="editExpectedEndDate"
                type="date"
                value={formData.expectedEndDate}
                onChange={e => setFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editDepositAmount">Deposit Amount</Label>
              <Input
                id="editDepositAmount"
                type="number"
                step="0.01"
                value={formData.depositAmount}
                onChange={e => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editPaymentTermsDays">Payment Terms (Days)</Label>
              <Input
                id="editPaymentTermsDays"
                type="number"
                value={formData.paymentTermsDays}
                onChange={e => setFormData(prev => ({ ...prev, paymentTermsDays: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={formData.status}
                onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editPaymentStatus">Payment Status</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={value => setFormData(prev => ({ ...prev, paymentStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editHasTimesheet"
                checked={formData.hasTimesheet}
                onChange={e => setFormData(prev => ({ ...prev, hasTimesheet: e.target.checked }))}
              />
              <Label htmlFor="editHasTimesheet">Has Timesheet</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editHasOperators"
                checked={formData.hasOperators}
                onChange={e => setFormData(prev => ({ ...prev, hasOperators: e.target.checked }))}
              />
              <Label htmlFor="editHasOperators">Has Operators</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="editNotes">Notes</Label>
            <Textarea
              id="editNotes"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateRental}>Update Rental</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Rental Item</DialogTitle>
            <DialogDescription>Add a new item to this rental</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipment">Equipment</Label>
              <Select
                value={itemFormData.equipmentId}
                onValueChange={value => {
                  const selectedEquipment = equipment.find(eq => eq.id.toString() === value);

                  setItemFormData(prev => ({
                    ...prev,
                    equipmentId: value,
                    equipmentName: selectedEquipment?.name || '',
                    unitPrice: selectedEquipment?.daily_rate || 0,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map(eq => (
                    <SelectItem key={eq.id} value={eq.id.toString()}>
                      {eq.name} - ${eq.daily_rate}/day
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="operator">Operator</Label>
              <Select
                value={itemFormData.operatorId}
                onValueChange={value => setItemFormData(prev => ({ ...prev, operatorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operator (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.first_name} {emp.last_name} - {emp.employee_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={itemFormData.unitPrice}
                onChange={e =>
                  setItemFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="rateType">Rate Type</Label>
              <Select
                value={itemFormData.rateType}
                onValueChange={value => setItemFormData(prev => ({ ...prev, rateType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rate type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={itemFormData.status}
                onValueChange={value => setItemFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={itemFormData.notes}
              onChange={e => setItemFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Enter any additional notes"
            />
          </div>

          {/* Operator Action Type Selection for Add Item */}
          <div className="space-y-3">
            <Label>Operator Assignment Action</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={itemFormData.actionType === 'add' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleOperatorAction('add')}
                className="text-xs"
              >
                ➕ Add New
              </Button>
              <Button
                type="button"
                variant={itemFormData.actionType === 'update' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleOperatorAction('update')}
                className="text-xs"
              >
                🔧 Update
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {itemFormData.actionType === 'add' && 'New operator will be assigned'}
              {itemFormData.actionType === 'update' &&
                'Operator will be updated based on rental status'}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addRentalItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Rental Item</DialogTitle>
            <DialogDescription>Update the rental item details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editEquipment">Equipment</Label>
              <Select
                value={itemFormData.equipmentId}
                onValueChange={value => {
                  const selectedEquipment = equipment.find(eq => eq.id.toString() === value);
                  setItemFormData(prev => ({
                    ...prev,
                    equipmentId: value,
                    equipmentName: selectedEquipment?.name || '',
                    unitPrice: selectedEquipment?.daily_rate || 0,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map(eq => (
                    <SelectItem key={eq.id} value={eq.id.toString()}>
                      {eq.name} - ${eq.daily_rate}/day
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editOperator">Operator</Label>
              <Select
                value={itemFormData.operatorId}
                onValueChange={value => setItemFormData(prev => ({ ...prev, operatorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operator (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.first_name} {emp.last_name} - {emp.employee_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editUnitPrice">Unit Price</Label>
              <Input
                id="editUnitPrice"
                type="number"
                step="0.01"
                value={itemFormData.unitPrice}
                onChange={e =>
                  setItemFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="editRateType">Rate Type</Label>
              <Select
                value={itemFormData.rateType}
                onValueChange={value => setItemFormData(prev => ({ ...prev, rateType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rate type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={itemFormData.status}
                onValueChange={value => setItemFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="editNotes">Notes</Label>
            <Textarea
              id="editNotes"
              value={itemFormData.notes}
              onChange={e => setItemFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Enter any additional notes"
            />
          </div>

          {/* Operator Action Type Selection */}
          <div className="space-y-3">
            <Label>Operator Change Action</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={itemFormData.actionType === 'handover' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleOperatorAction('handover')}
                className="text-xs"
              >
                🔄 Handover
              </Button>
              <Button
                type="button"
                variant={itemFormData.actionType === 'remove' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleOperatorAction('remove')}
                className="text-xs"
              >
                ❌ Remove
              </Button>
              <Button
                type="button"
                variant={itemFormData.actionType === 'add' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleOperatorAction('add')}
                className="text-xs"
              >
                ➕ Add New
              </Button>
              <Button
                type="button"
                variant={itemFormData.actionType === 'update' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleOperatorAction('update')}
                className="text-xs"
              >
                🔧 Update
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {itemFormData.actionType === 'handover' &&
                'Previous operator will be ended, new operator will be assigned'}
              {itemFormData.actionType === 'remove' &&
                'Current operator assignment will be deleted'}
              {itemFormData.actionType === 'add' && 'New operator will be assigned'}
              {itemFormData.actionType === 'update' &&
                'Operator will be updated based on rental status'}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateRentalItem}>Update Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
