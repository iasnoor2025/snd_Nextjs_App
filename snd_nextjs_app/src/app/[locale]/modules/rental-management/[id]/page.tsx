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
import { useI18n } from '@/hooks/use-i18n';
import { 
  RentalItemConfirmationDialog
} from '@/components/rental';
import { useRentalItemConfirmation } from '@/hooks/use-rental-item-confirmation';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';

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
  supervisor?: string;
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
function UnifiedTimeline({ rental, t }: { rental: Rental; t: any }) {
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
        name: t('rental.created'),
        description: t('rental.rentalRequestCreated'),
        date: safeFormatDate(rental.createdAt),
        icon: CircleDashed,
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        active: true,
        status: 'completed',
      },
      {
        id: 'quotation',
        name: t('rental.quotation'),
        description: t('rental.quotationGenerated'),
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
        name: t('rental.quotationApproved'),
        description: t('rental.approvedByCustomer'),
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
        name: t('rental.mobilization'),
        description: t('rental.equipmentDelivery'),
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
        name: t('rental.active'),
        description: t('rental.rentalInProgress'),
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
        name: t('rental.completed'),
        description: t('rental.rentalFinished'),
        date: safeFormatDate(rental.actualEndDate || rental.completedAt),
        icon: CalendarCheck,
        color: 'bg-green-100 text-green-700 border-green-200',
        active: !!(rental.actualEndDate || rental.completedAt),
        status: rental.actualEndDate || rental.completedAt ? 'completed' : 'upcoming',
      },
      {
        id: 'invoice',
        name: t('rental.invoiceCreated'),
        description: t('rental.invoiceGenerated'),
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
        name: t('rental.overdue'),
        description: t('rental.paymentOverdue'),
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
              {t('rental.generateQuotation')}
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
              {t('rental.approveQuotation')}
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
              {t('rental.startMobilization')}
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
              {t('rental.activateRental')}
            </Button>
          );
        }
        break;
      case 'completed':
        if (rental.status === 'active' && !rental.actualEndDate) {
          return (
            <Button size="sm" onClick={handleCompleteRental} className="mt-2">
              <CalendarCheck className="w-3 h-3 mr-1" />
              {t('rental.completeRental')}
            </Button>
          );
        }
        break;
      case 'invoice':
        if ((rental.status === 'completed' || rental.actualEndDate) && !rental.invoiceDate) {
          return (
            <Button size="sm" onClick={handleGenerateInvoice} className="mt-2">
              <Receipt className="w-3 h-3 mr-1" />
              {t('rental.generateInvoice')}
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
        <CardTitle>{t('rental.rentalTimeline')}</CardTitle>
        <CardDescription>{t('rental.workflowTimeline')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Workflow Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">{t('rental.workflowProgress')}</h3>
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
                        {event.status === 'completed' ? t('rental.completed') :
                         event.status === 'current' ? t('rental.current') :
                         event.status === 'upcoming' ? t('rental.upcoming') : event.status}
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
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">{t('rental.keyEvents')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">{t('rental.rentalCreated')}</p>
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
                    <p className="text-sm font-medium">{t('rental.quotationGenerated')}</p>
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
                    <p className="text-sm font-medium">{t('rental.quotationApproved')}</p>
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
  const { t } = useI18n();
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
    supervisor: '',
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
  const [supervisorDetails, setSupervisorDetails] = useState<any>(null);

  // Helper function to convert Decimal to number
  const formatAmount = (amount: any): string => {
    if (amount === null || amount === undefined) return '0';
    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (isNaN(num)) return '0';
    
    // Format with comma separators for thousands
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  // Calculate financial totals from rental items
  const calculateFinancials = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = parseFloat(item.totalPrice?.toString() || '0') || 0;
      return sum + itemTotal;
    }, 0);
    
    const taxRate = 15; // Default 15% VAT for KSA
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;
    
    return {
      subtotal,
      taxAmount,
      totalAmount,
      discount: 0,
      tax: taxRate,
      finalAmount: totalAmount,
    };
  };

  // Recalculate totals when rental items change
  const recalculateTotals = () => {
    if (rental && rental.rentalItems) {
      const financials = calculateFinancials(rental.rentalItems);
      // Update the rental object with calculated values
      setRental(prev => prev ? { ...prev, ...financials } : null);
    }
  };

  // Fetch supervisor details when rental loads
  useEffect(() => {
    if (rental?.supervisor) {
      fetchSupervisorDetails(rental.supervisor);
    }
  }, [rental?.supervisor]);

  // Fetch supervisor details
  const fetchSupervisorDetails = async (supervisorId: string) => {
    if (!supervisorId) return;
    
    try {
      const response = await fetch(`/api/employees/${supervisorId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.employee) {
          setSupervisorDetails(data.employee);
        }
      }
    } catch (error) {
      console.error('Failed to fetch supervisor details:', error);
    }
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
      let data = await response.json();

      // Recalculate financial totals from rental items
      if (data.rentalItems && data.rentalItems.length > 0) {
        const financials = calculateFinancials(data.rentalItems);
        data = { ...data, ...financials };
      }

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
      supervisor: rental.supervisor || '',
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

  // Handle delete with confirmation dialog
  const handleDeleteItem = (item: RentalItem) => {
    confirmation.showDeleteConfirmation(
      item.equipmentName,
      'This action cannot be undone. Are you sure you want to delete this rental item?',
      () => {
        deleteRentalItem(item.id);
      }
    );
  };

  // Add useEffect to recalculate totals when rental items change
  useEffect(() => {
    if (rental && rental.rentalItems) {
      recalculateTotals();
    }
  }, [rental?.rentalItems]);

  // Initial data fetch
  useEffect(() => {
    fetchRental();
    fetchEquipment();
    fetchEmployees();
  }, [rentalId]);

  // Add confirmation hook for rental item actions
  const confirmation = useRentalItemConfirmation();

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
            {t('rental.edit')}
          </Button>
          <Button variant="outline" onClick={deleteRental}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t('rental.delete')}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('rental.fields.status')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusBadge(rental.status)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('rental.fields.paymentStatus')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPaymentStatusBadge(rental.paymentStatus)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('rental.totalAmount')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                         <div className="text-2xl font-bold">SAR {formatAmount(rental.totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('rental.rentalItems')}</CardTitle>
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
              <TabsTrigger value="details">{t('rental.tabs.details')}</TabsTrigger>
              <TabsTrigger value="workflow">{t('rental.tabs.workflow')}</TabsTrigger>
              <TabsTrigger value="items">{t('rental.tabs.items')}</TabsTrigger>
              <TabsTrigger value="payments">{t('rental.tabs.payments')}</TabsTrigger>
              <TabsTrigger value="invoices">{t('rental.tabs.invoices')}</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Rental Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('rental.rentalInformation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">{t('rental.fields.rentalNumber')}</Label>
                      <p className="text-sm text-muted-foreground">{rental.rentalNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('rental.fields.customer')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.customer?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('rental.fields.startDate')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.startDate && !isNaN(new Date(rental.startDate).getTime()) ? (
                          new Date(rental.startDate).getFullYear() === 2099 ? (
                            t('rental.notStarted')
                          ) : (
                            format(new Date(rental.startDate), 'MMM dd, yyyy')
                          )
                        ) : (
                          'N/A'
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('rental.fields.expectedEndDate')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.expectedEndDate &&
                        !isNaN(new Date(rental.expectedEndDate).getTime())
                          ? format(new Date(rental.expectedEndDate), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('rental.fields.actualEndDate')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.actualEndDate && !isNaN(new Date(rental.actualEndDate).getTime())
                          ? format(new Date(rental.actualEndDate), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('rental.fields.paymentTermsDays')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.paymentTermsDays} {t('rental.days')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('rental.fields.depositAmount')}</Label>
                      <p className="text-sm text-muted-foreground">
                        ${formatAmount(rental.depositAmount)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('rental.fields.createdAt')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.createdAt && !isNaN(new Date(rental.createdAt).getTime())
                          ? format(new Date(rental.createdAt), 'MMM dd, yyyy HH:mm')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('rental.fields.supervisor')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {supervisorDetails ? (
                          `${supervisorDetails.first_name} ${supervisorDetails.last_name} (File: ${supervisorDetails.file_number})`
                        ) : rental.supervisor ? (
                          `${t('rental.loading')} (ID: ${rental.supervisor})`
                        ) : (
                          t('rental.notAssigned')
                        )}
                      </p>

                    </div>
                  </div>

                  {rental.notes && (
                    <div>
                      <Label className="text-sm font-medium">{t('rental.fields.notes')}</Label>
                      <p className="text-sm text-muted-foreground mt-1">{rental.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('rental.financialSummary')}</CardTitle>
                  <CardDescription>{t('rental.calculatedTotals')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('rental.subtotal')}:</span>
                                             <span className="font-mono">SAR {formatAmount(rental.subtotal)}</span>
                    </div>
                    
                    {rental.discount && rental.discount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span className="text-sm font-medium">{t('rental.discount')} ({rental.discount}%):</span>
                                                 <span className="font-mono">-SAR {formatAmount(rental.discount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('rental.tax')} ({rental.tax || 15}%):</span>
                                             <span className="font-mono">SAR {formatAmount(rental.taxAmount)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{t('rental.totalAmount')}:</span>
                                             <span className="font-mono text-primary">SAR {formatAmount(rental.totalAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{t('rental.finalAmount')}:</span>
                                             <span className="font-mono">SAR {formatAmount(rental.finalAmount)}</span>
                    </div>
                    
                    {rental.depositAmount && rental.depositAmount > 0 && (
                      <>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{t('rental.fields.depositAmount')}:</span>
                          <span className="font-mono text-blue-600">SAR {formatAmount(rental.depositAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <span>{t('rental.remainingBalance')}:</span>
                                                     <span className="font-mono">SAR {formatAmount((rental.finalAmount || rental.totalAmount) - (rental.depositAmount || 0))}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflow" className="space-y-6">
              {/* Unified Timeline */}
                              <UnifiedTimeline rental={rental} t={t} />
            </TabsContent>

            <TabsContent value="items" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{t('rental.rentalItems')}</CardTitle>
                    <Button size="sm" onClick={() => setIsAddItemDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('rental.addItem')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('rental.equipment')}</TableHead>
                        <TableHead>{t('rental.unitPrice')}</TableHead>
                        <TableHead>{t('rental.rateType')}</TableHead>
                        <TableHead>{t('rental.duration')}</TableHead>
                        <TableHead>{t('rental.totalPrice')}</TableHead>
                        <TableHead>{t('rental.operator')}</TableHead>
                        <TableHead>{t('rental.status')}</TableHead>
                        <TableHead>{t('rental.actions')}</TableHead>
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

                        // Calculate duration if we have start and end dates
                        let durationText = 'N/A';
                        if (rental.startDate && rental.expectedEndDate) {
                          const startDate = new Date(rental.startDate);
                          const endDate = new Date(rental.expectedEndDate);
                          const rateType = item.rateType || 'daily';
                          
                          if (rateType === 'hourly') {
                            const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
                            durationText = `${hours} hours`;
                          } else if (rateType === 'weekly') {
                            const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                            durationText = `${weeks} weeks`;
                          } else if (rateType === 'monthly') {
                            const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
                            durationText = `${months} months`;
                          } else {
                            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                            durationText = `${days} days`;
                          }
                        }

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.equipmentName}</TableCell>
                                                         <TableCell className="font-mono">SAR {formatAmount(item.unitPrice)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {item.rateType || 'daily'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{durationText}</TableCell>
                                                         <TableCell className="font-mono font-semibold">SAR {formatAmount(item.totalPrice)}</TableCell>
                            <TableCell className="text-sm">{operatorName}</TableCell>
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
                                  onClick={() => handleDeleteItem(item)}
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
                      {t('rental.noRentalItemsFound')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{t('rental.payments')}</CardTitle>
                    <Button size="sm" onClick={() => setIsAddPaymentDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('rental.addPayment')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('rental.date')}</TableHead>
                        <TableHead>{t('rental.amount')}</TableHead>
                        <TableHead>{t('rental.method')}</TableHead>
                        <TableHead>{t('rental.reference')}</TableHead>
                        <TableHead>{t('rental.table.headers.status')}</TableHead>
                        <TableHead>{t('rental.table.headers.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rental.payments?.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                          </TableCell>
                                                     <TableCell>SAR {formatAmount(payment.amount)}</TableCell>
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
                    <div className="text-center py-8 text-muted-foreground">{t('rental.noPaymentsFound')}</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{t('rental.invoices')}</CardTitle>
                    <Button size="sm" onClick={generateInvoice}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('rental.generateInvoice')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('rental.invoiceNumber')}</TableHead>
                        <TableHead>{t('rental.amount')}</TableHead>
                        <TableHead>{t('rental.table.headers.status')}</TableHead>
                        <TableHead>{t('rental.dueDate')}</TableHead>
                        <TableHead>{t('rental.table.headers.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rental.invoices?.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                                                     <TableCell>SAR {formatAmount(invoice.amount)}</TableCell>
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
                    <div className="text-center py-8 text-muted-foreground">{t('rental.noInvoicesFound')}</div>
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
              <CardTitle>{t('rental.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!rental.quotationId &&
                rental.status !== 'quotation_generated' &&
                !rental.statusLogs?.some((log: any) => log.newStatus === 'quotation_generated') && (
                  <Button className="w-full" onClick={generateQuotation}>
                    <FileText className="w-4 h-4 mr-2" />
                    {t('rental.generateQuotation')}
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
                  {t('rental.viewQuotation')}
                </Button>
              )}
              {(rental.quotationId || rental.status === 'quotation_generated') &&
                !rental.approvedAt &&
                !rental.statusLogs?.some((log: any) => log.newStatus === 'approved') && (
                  <Button className="w-full" variant="outline" onClick={handleApproveQuotation}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('rental.approveQuotation')}
                  </Button>
                )}
              {(rental.approvedAt || rental.status === 'approved') &&
                !rental.mobilizationDate &&
                rental.status !== 'mobilization' &&
                !rental.statusLogs?.some((log: any) => log.newStatus === 'mobilization') && (
                  <Button className="w-full" variant="outline" onClick={handleStartMobilization}>
                    <Truck className="w-4 h-4 mr-2" />
                    {t('rental.startMobilization')}
                  </Button>
                )}
              {(rental.mobilizationDate || rental.status === 'mobilization') &&
                rental.status !== 'active' &&
                rental.status !== 'completed' && (
                  <Button className="w-full" variant="outline" onClick={handleActivateRental}>
                    <Clock className="w-4 h-4 mr-2" />
                                        {t('rental.activateRental')}
                  </Button>
                )}
              {rental.status === 'active' && !rental.actualEndDate && (
                <Button className="w-full" variant="outline" onClick={handleCompleteRental}>
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  {t('rental.completeRental')}
                  </Button>
              )}
              {(rental.status === 'completed' || rental.actualEndDate) &&
                !rental.invoiceDate &&
                !rental.invoices?.length && (
                  <Button className="w-full" variant="outline" onClick={generateInvoice}>
                    <Receipt className="w-4 h-4 mr-2" />
                    {t('rental.generateInvoice')}
                  </Button>
                )}
              <Button className="w-full" variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                {t('rental.printRental')}
              </Button>
              <Button className="w-full" variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                {t('rental.share')}
              </Button>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {rental.customer && (
            <Card>
              <CardHeader>
                <CardTitle>{t('rental.customerInformation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">{t('rental.name')}</Label>
                  <p className="text-sm text-muted-foreground">{rental.customer.name}</p>
                </div>
                {rental.customer.email && (
                  <div>
                    <Label className="text-sm font-medium">{t('rental.email')}</Label>
                    <p className="text-sm text-muted-foreground">{rental.customer.email}</p>
                  </div>
                )}
                {rental.customer.phone && (
                  <div>
                    <Label className="text-sm font-medium">{t('rental.phone')}</Label>
                    <p className="text-sm text-muted-foreground">{rental.customer.phone}</p>
                  </div>
                )}
                {rental.customer.address && (
                  <div>
                    <Label className="text-sm font-medium">{t('rental.address')}</Label>
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
            <DialogTitle>{t('rental.actions.editRental')}</DialogTitle>
            <DialogDescription>{t('rental.updateRentalContractDetails')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editRentalNumber">{t('rental.fields.rentalNumber')}</Label>
              <Input
                id="editRentalNumber"
                value={formData.rentalNumber}
                onChange={e => setFormData(prev => ({ ...prev, rentalNumber: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editStartDate">{t('rental.fields.startDate')}</Label>
              <Input
                id="editStartDate"
                type="date"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editExpectedEndDate">{t('rental.fields.expectedEndDate')}</Label>
              <Input
                id="editExpectedEndDate"
                type="date"
                value={formData.expectedEndDate}
                onChange={e => setFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editSupervisor">{t('rental.fields.supervisor')}</Label>
              <EmployeeDropdown
                value={formData.supervisor}
                onValueChange={(value) => {
                  console.log('Supervisor selected in edit:', value);
                  setFormData(prev => ({ ...prev, supervisor: value }));
                }}
                placeholder={t('rental.fields.selectSupervisor')}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="editNotes">{t('rental.notes')}</Label>
            <Textarea
              id="editNotes"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('rental.cancel')}
            </Button>
            <Button onClick={updateRental}>{t('rental.updateRental')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('rental.addItem')}</DialogTitle>
            <DialogDescription>{t('rental.addItemDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipment">{t('rental.equipment')}</Label>
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
                  <SelectValue placeholder={t('rental.selectEquipment')} />
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
              <Label htmlFor="operator">{t('rental.operator')}</Label>
              <Select
                value={itemFormData.operatorId}
                onValueChange={value => setItemFormData(prev => ({ ...prev, operatorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('rental.selectOperator')} />
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
              <Label htmlFor="unitPrice">{t('rental.unitPrice')}</Label>
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
              <Label htmlFor="rateType">{t('rental.rateType')}</Label>
              <Select
                value={itemFormData.rateType}
                onValueChange={value => setItemFormData(prev => ({ ...prev, rateType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('rental.selectRateType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('rental.daily')}</SelectItem>
                  <SelectItem value="weekly">{t('rental.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('rental.monthly')}</SelectItem>
                  <SelectItem value="hourly">{t('rental.hourly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">{t('rental.status')}</Label>
              <Select
                value={itemFormData.status}
                onValueChange={value => setItemFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('rental.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('rental.active')}</SelectItem>
                  <SelectItem value="inactive">{t('rental.inactive')}</SelectItem>
                  <SelectItem value="maintenance">{t('rental.maintenance')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">{t('rental.notes')}</Label>
            <Textarea
              id="notes"
              value={itemFormData.notes}
              onChange={e => setItemFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder={t('rental.enterNotes')}
            />
          </div>

          {/* Operator Action Type Selection for Add Item */}
          <div className="space-y-3">
            <Label>{t('rental.operatorAssignmentAction')}</Label>
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
                <SelectValue placeholder={t('rental.selectStatus')} />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('rental.active')}</SelectItem>
                  <SelectItem value="inactive">{t('rental.inactive')}</SelectItem>
                  <SelectItem value="maintenance">{t('rental.maintenance')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="editNotes">{t('rental.notes')}</Label>
                          <Textarea
                id="editNotes"
                value={itemFormData.notes}
                onChange={e => setItemFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder={t('rental.enterNotes')}
              />
          </div>

          {/* Operator Action Type Selection */}
          <div className="space-y-3">
            <Label>{t('rental.operatorAssignmentAction')}</Label>
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
              {t('rental.cancel')}
            </Button>
            <Button onClick={updateRentalItem}>{t('rental.updateRental')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rental Item Confirmation Dialog */}
      <RentalItemConfirmationDialog
        isOpen={confirmation.confirmationState.isOpen}
        onClose={confirmation.hideConfirmation}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.confirmationState.title}
        description={confirmation.confirmationState.description}
        actionType={confirmation.confirmationState.actionType}
        itemName={confirmation.confirmationState.itemName}
        isLoading={false}
      />
    </div>
  );
}
