'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  CalendarCheck,
  CheckCircle,
  CircleDashed,
  Clock,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  MoreHorizontal,
  Package,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Share2,
  Trash2,
  Truck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { 
  RentalItemConfirmationDialog
} from '@/components/rental';
import { useRentalItemConfirmation } from '@/hooks/use-rental-item-confirmation';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { EquipmentDropdown } from '@/components/ui/equipment-dropdown';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  operatorFirstName?: string;
  operatorLastName?: string;
  supervisorId?: string;
  supervisorFirstName?: string;
  supervisorLastName?: string;
  status?: string;
  notes?: string;
  startDate?: string;
  equipmentIstimara?: string;
  completedDate?: string;
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

type RentalItemSortableColumn =
  | 'index'
  | 'equipment'
  | 'unitPrice'
  | 'rateType'
  | 'startDate'
  | 'duration'
  | 'totalPrice'
  | 'operator'
  | 'supervisor'
  | 'status';

type RentalItemSortDirection = 'asc' | 'desc';

interface RentalItemSortConfig {
  column: RentalItemSortableColumn;
  direction: RentalItemSortDirection;
}

interface RentalItemWithIndex {
  item: RentalItem;
  originalIndex: number;
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
  outstandingAmount?: string;
  paymentTermsDays: number;
  hasTimesheet: boolean;
  hasOperators: boolean;
  supervisor?: string;
  area?: string;
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
function UnifiedTimeline({ rental, t, fetchRental }: { rental: Rental | null; t: any; fetchRental: () => Promise<void> }) {
  const confirmation = useRentalItemConfirmation();
  
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

  if (!rental) {
    return null;
  }

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
      // Refresh rental data instead of full page reload
      await fetchRental();
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
      // Refresh rental data instead of full page reload
      await fetchRental();
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
      // Refresh rental data instead of full page reload
      await fetchRental();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start mobilization');
    }
  };

  const handleActivateRental = async () => {
    try {
      const response = await fetch(`/api/rentals/${rental.id}/activate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate rental');
      }
      toast.success('Rental activated successfully');
      // Refresh rental data instead of full page reload
      await fetchRental();
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
      // Refresh rental data instead of full page reload
      await fetchRental();
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
      // Refresh rental data instead of full page reload
      await fetchRental();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate invoice');
    }
  };

  // Confirm then complete rental is triggered inline where needed

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
            <Button size="sm" onClick={() => confirmation.showConfirmDialog(
              'Complete Rental',
              'Are you sure you want to complete this rental? All active items will be marked as completed.',
              () => handleCompleteRental()
            )} className="mt-2">
              <CalendarCheck className="w-3 h-3 mr-1" />
              {t('rental.completeRental')}
            </Button>
          );
        } else if (rental.status === 'completed') {
          return (
            <Button size="sm" variant="outline" onClick={() => confirmation.showConfirmDialog(
              'Reactivate Rental',
              'Are you sure you want to reactivate this rental?',
              () => handleActivateRental()
            )} className="mt-2">
              <RefreshCw className="w-3 h-3 mr-1" />
              Reactivate
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

// Helper function to get first two words of a name
function getShortName(fullName: string): string {
  if (!fullName) return '';
  const words = fullName.trim().split(/\s+/);
  return words.slice(0, 2).join(' ');
}

function getAssignmentRentalLabel(assignment: any): string {
  const customerLabel = assignment.customerCompanyName || assignment.customerName;
  if (customerLabel) {
    const rentalSuffix = assignment.rentalNumber ? ` (Rental ${assignment.rentalNumber})` : '';
    return `${customerLabel}${rentalSuffix}`;
  }
  if (assignment.rentalNumber) {
    return `Rental ${assignment.rentalNumber}`;
  }
  return 'Rental assignment';
}

export default function RentalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const { t } = useI18n();
  const rentalId = params.id as string;

  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [isMonthSelectionOpen, setIsMonthSelectionOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [erpnextInvoiceAmount, setErpnextInvoiceAmount] = useState<number | null>(null);
  const [isManualInvoiceDialogOpen, setIsManualInvoiceDialogOpen] = useState(false);
  const [isManualPaymentDialogOpen, setIsManualPaymentDialogOpen] = useState(false);
  const [manualInvoiceId, setManualInvoiceId] = useState('');
  const [manualPaymentId, setManualPaymentId] = useState('');
  const [rentalInvoices, setRentalInvoices] = useState<any[]>([]);
  const [rentalPayments, setRentalPayments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    rentalNumber: '',
    startDate: '',
    expectedEndDate: '',
    supervisor: '',
    area: '',
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
    supervisorId: '',
    status: 'active',
    notes: '',
    actionType: 'update', // 'handover', 'remove', 'add', 'update'
    startDate: '', // New field for item start date
  });

  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);
  const [previousAssignmentWarnings, setPreviousAssignmentWarnings] = useState<string[]>([]);
  const [loadingPreviousAssignments, setLoadingPreviousAssignments] = useState(false);
  const [equipmentAssignmentWarnings, setEquipmentAssignmentWarnings] = useState<string[]>([]);
  const [loadingEquipmentAssignments, setLoadingEquipmentAssignments] = useState(false);
  const [operatorAssignmentsForTooltip, setOperatorAssignmentsForTooltip] = useState<any[]>([]);
  const [rentalItemsSortConfig, setRentalItemsSortConfig] = useState<RentalItemSortConfig>({
    column: 'equipment',
    direction: 'asc',
  });

  const rentalItemsWithIndex = useMemo<RentalItemWithIndex[]>(() => {
    return (rental?.rentalItems || [])
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter((entry): entry is RentalItemWithIndex => Boolean(entry.item));
  }, [rental?.rentalItems]);

  const getRentalItemDurationMeta = (item: RentalItem) => {
    let label = 'N/A';
    let durationMs = 0;
    const itemStartDate = item?.startDate && item.startDate !== '' ? item.startDate : rental?.startDate;
    const itemCompletedDate = item?.completedDate || (item as any).completed_date;

    if (itemStartDate) {
      const startDate = new Date(itemStartDate);
      let endDate: Date;

      if (itemCompletedDate) {
        endDate = new Date(itemCompletedDate);
      } else if (rental?.status === 'completed' && rental?.expectedEndDate) {
        endDate = new Date(rental.expectedEndDate);
      } else {
        endDate = new Date();
      }

      if (endDate < startDate) {
        endDate = startDate;
      }

      durationMs = Math.max(0, endDate.getTime() - startDate.getTime());
      const rateType = item?.rateType || 'daily';

      if (rateType === 'hourly') {
        const hours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
        label = `${hours} hours`;
      } else if (rateType === 'weekly') {
        const weeks = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7)));
        label = `${weeks} weeks`;
      } else if (rateType === 'monthly') {
        const months = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 30)));
        label = `${months} months`;
      } else {
        const days = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
        label = `${days} days`;
      }
    }

    return { label, durationMs };
  };

  const getRentalItemSortableValue = (entry: RentalItemWithIndex, column: RentalItemSortableColumn) => {
    const item = entry.item;
    switch (column) {
      case 'index':
        return entry.originalIndex;
      case 'equipment':
        return item?.equipmentName || '';
      case 'unitPrice':
        return toNumericValue(item?.unitPrice ?? 0);
      case 'rateType':
        return item?.rateType || '';
      case 'startDate': {
        const startDate = item?.startDate && item.startDate !== '' ? item.startDate : rental?.startDate;
        return startDate ? new Date(startDate).getTime() : 0;
      }
      case 'duration':
        return getRentalItemDurationMeta(item).durationMs;
      case 'totalPrice':
        return calculateItemTotal(item, rental || undefined);
      case 'operator': {
        const firstName = item?.operatorFirstName;
        const lastName = item?.operatorLastName;
        if (firstName || lastName) {
          return `${firstName || ''} ${lastName || ''}`.trim();
        }
        return item?.operatorId ? `Operator ${item.operatorId}` : '';
      }
      case 'supervisor': {
        const firstName = item?.supervisorFirstName;
        const lastName = item?.supervisorLastName;
        if (firstName || lastName) {
          return `${firstName || ''} ${lastName || ''}`.trim();
        }
        return item?.supervisorId ? `Supervisor ${item.supervisorId}` : '';
      }
      case 'status':
        return item?.status || '';
      default:
        return '';
    }
  };

  const sortedRentalItems = useMemo(() => {
    const items = [...rentalItemsWithIndex];
    if (items.length === 0) return items;

    const { column, direction } = rentalItemsSortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;

    return items.sort((a, b) => {
      const aValue = getRentalItemSortableValue(a, column);
      const bValue = getRentalItemSortableValue(b, column);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * multiplier;
      }

      return String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' }) * multiplier;
    });
  }, [rentalItemsWithIndex, rentalItemsSortConfig, rental]);

  const handleRentalItemSort = (column: RentalItemSortableColumn) => {
    setRentalItemsSortConfig(prev => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: 'asc' };
    });
  };

  const renderRentalItemSortIcon = (column: RentalItemSortableColumn) => {
    if (rentalItemsSortConfig.column !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    }

    return rentalItemsSortConfig.direction === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-primary" />
    );
  };

  const RentalItemSortableHeader = ({ column, label }: { column: RentalItemSortableColumn; label: string }) => (
    <button
      type="button"
      onClick={() => handleRentalItemSort(column)}
      className="flex w-full items-center gap-1 text-left font-medium text-muted-foreground hover:text-primary focus-visible:outline-none"
    >
      <span>{label}</span>
      {renderRentalItemSortIcon(column)}
    </button>
  );

  // Debug form data changes
  useEffect(() => {
    console.log('Form data changed:', itemFormData);
  }, [itemFormData]);

  // Check for duplicates when adding item
  useEffect(() => {
    if (!isAddItemDialogOpen || !rental?.rentalItems || rental.rentalItems.length === 0) {
      setDuplicateWarnings([]);
      return;
    }

    const warnings: string[] = [];
    const existingItems = rental.rentalItems.filter(item => item.status === 'active');

    // Check for duplicate equipment with same operator
    if (itemFormData.equipmentId && itemFormData.operatorId) {
      const duplicate = existingItems.find(item => 
        item.equipmentId?.toString() === itemFormData.equipmentId.toString() &&
        item.operatorId?.toString() === itemFormData.operatorId.toString()
      );
      
      if (duplicate) {
        const equipmentName = duplicate.equipmentName || `Equipment ${duplicate.equipmentId}`;
        const startDate = (duplicate as any).startDate || (duplicate as any).start_date;
        const dateStr = startDate ? new Date(startDate).toLocaleDateString() : 'rental start date';
        warnings.push(`Same equipment (${equipmentName}) and operator already assigned with active status (started: ${dateStr})`);
      }
    }

    // Check for duplicate equipment (even with different operator)
    if (itemFormData.equipmentId) {
      const equipmentDuplicates = existingItems.filter(item => 
        item.equipmentId?.toString() === itemFormData.equipmentId.toString()
      );
      
      if (equipmentDuplicates.length > 0 && !warnings.some(w => w.includes('equipment'))) {
        const equipmentName = equipmentDuplicates[0].equipmentName || `Equipment ${equipmentDuplicates[0].equipmentId}`;
        warnings.push(`Equipment "${equipmentName}" already has ${equipmentDuplicates.length} active item(s) in this rental`);
      }
    }

    // Check for duplicate operator (even with different equipment)
    if (itemFormData.operatorId) {
      const operatorDuplicates = existingItems.filter(item => 
        item.operatorId?.toString() === itemFormData.operatorId.toString()
      );
      
      if (operatorDuplicates.length > 0 && !warnings.some(w => w.includes('operator'))) {
        const firstDuplicate = operatorDuplicates[0] as any;
        const operatorName = firstDuplicate.operatorFirstName && firstDuplicate.operatorLastName
          ? `${firstDuplicate.operatorFirstName} ${firstDuplicate.operatorLastName}`
          : `Operator ${firstDuplicate.operatorId}`;
        warnings.push(`Operator "${operatorName}" already assigned to ${operatorDuplicates.length} active item(s) in this rental`);
      }
    }

    // Check for overlapping dates
    if (itemFormData.startDate && itemFormData.equipmentId) {
      const newStartDate = new Date(itemFormData.startDate);
      const overlappingItems = existingItems.filter(item => {
        if (item.equipmentId?.toString() !== itemFormData.equipmentId.toString()) return false;
        const itemStartDate = (item as any).startDate || (item as any).start_date;
        if (!itemStartDate) return false;
        
        const itemStart = new Date(itemStartDate);
        const itemCompletedDate = (item as any).completedDate || (item as any).completed_date;
        const itemEnd = itemCompletedDate ? new Date(itemCompletedDate) : new Date();
        
        return newStartDate >= itemStart && newStartDate <= itemEnd;
      });

      if (overlappingItems.length > 0) {
        warnings.push(`Start date overlaps with ${overlappingItems.length} existing active item(s) for this equipment`);
      }
    }

    setDuplicateWarnings(warnings);
  }, [itemFormData.equipmentId, itemFormData.operatorId, itemFormData.startDate, rental?.rentalItems, isAddItemDialogOpen]);

  // Check for previous assignments when operator is selected
  useEffect(() => {
    const checkPreviousAssignments = async () => {
      if (!isAddItemDialogOpen || !itemFormData.operatorId) {
        setPreviousAssignmentWarnings([]);
        return;
      }

      setLoadingPreviousAssignments(true);
      try {
        const response = await fetch(`/api/employees/${itemFormData.operatorId}/previous-assignments`);
        if (!response.ok) {
          throw new Error('Failed to fetch previous assignments');
        }

        const data = await response.json();
        const warnings: string[] = [];

        // If employee is supervisor/foreman, don't show warnings (can have multiple assignments)
        if (data.isSupervisorOrForeman) {
          setPreviousAssignmentWarnings([]);
          setLoadingPreviousAssignments(false);
          return;
        }

        if (data.assignments && data.assignments.length > 0) {
          data.assignments.forEach((assignment: any) => {
            // Skip if it's for the current rental
            if (assignment.rentalId && rental?.id && assignment.rentalId.toString() === rental.id.toString()) {
              return;
            }

            // Only show warnings for operator assignments, not supervisor
            if (assignment.role !== 'operator') {
              return;
            }

            const startDate = assignment.startDate 
              ? new Date(assignment.startDate).toLocaleDateString() 
              : 'unknown date';
            const endDate = assignment.endDate 
              ? new Date(assignment.endDate).toLocaleDateString() 
              : 'ongoing';

            if (assignment.rentalId && assignment.rentalNumber) {
              const equipmentInfo = assignment.equipmentName 
                ? ` for equipment "${assignment.equipmentName}"` 
                : '';
              const assignmentLabel = getAssignmentRentalLabel(assignment);
              warnings.push(
                `Active assignment to ${assignmentLabel}${equipmentInfo} (Started: ${startDate}, ${assignment.endDate ? `Ends: ${endDate}` : 'Ongoing'})`
              );
            } else if (assignment.projectId) {
              warnings.push(
                `Active assignment to Project ID ${assignment.projectId} (Started: ${startDate}, ${assignment.endDate ? `Ends: ${endDate}` : 'Ongoing'})`
              );
            } else {
              warnings.push(
                `Active assignment (Started: ${startDate}, ${assignment.endDate ? `Ends: ${endDate}` : 'Ongoing'})`
              );
            }
          });
        }

        setPreviousAssignmentWarnings(warnings);
      } catch (error) {
        console.error('Error checking previous assignments:', error);
        setPreviousAssignmentWarnings([]);
      } finally {
        setLoadingPreviousAssignments(false);
      }
    };

    checkPreviousAssignments();
  }, [itemFormData.operatorId, isAddItemDialogOpen, rental?.id]);

  // Check for previous equipment assignments when equipment is selected
  useEffect(() => {
    const checkEquipmentAssignments = async () => {
      if (!isAddItemDialogOpen || !itemFormData.equipmentId) {
        setEquipmentAssignmentWarnings([]);
        return;
      }

      setLoadingEquipmentAssignments(true);
      try {
        const response = await fetch(`/api/equipment/${itemFormData.equipmentId}/previous-assignments`);
        if (!response.ok) {
          throw new Error('Failed to fetch equipment assignments');
        }

        const data = await response.json();
        const warnings: string[] = [];

        if (data.assignments && data.assignments.length > 0) {
          data.assignments.forEach((assignment: any) => {
            // Skip if it's for the current rental
            if (assignment.rentalId && rental?.id && assignment.rentalId.toString() === rental.id.toString()) {
              return;
            }

            // Handle timestamp format (equipmentRentalHistory uses timestamps)
            let startDateStr = 'unknown date';
            let endDateStr = 'ongoing';
            
            if (assignment.startDate) {
              try {
                // Handle both timestamp strings and date strings
                const dateStr = typeof assignment.startDate === 'string' 
                  ? assignment.startDate.split('T')[0] 
                  : assignment.startDate;
                startDateStr = new Date(dateStr).toLocaleDateString();
              } catch (e) {
                startDateStr = String(assignment.startDate);
              }
            }
            
            if (assignment.endDate) {
              try {
                const dateStr = typeof assignment.endDate === 'string' 
                  ? assignment.endDate.split('T')[0] 
                  : assignment.endDate;
                endDateStr = new Date(dateStr).toLocaleDateString();
              } catch (e) {
                endDateStr = String(assignment.endDate);
              }
            }

            if (assignment.rentalId && assignment.rentalNumber) {
              const operatorInfo = assignment.employeeFirstName && assignment.employeeLastName
                ? ` with operator ${assignment.employeeFirstName} ${assignment.employeeLastName}`
                : '';
              const assignmentLabel = getAssignmentRentalLabel(assignment);
              warnings.push(
                `Active assignment to ${assignmentLabel}${operatorInfo} (Started: ${startDateStr}, ${assignment.endDate ? `Ends: ${endDateStr}` : 'Ongoing'})`
              );
            } else if (assignment.projectId && assignment.projectName) {
              const operatorInfo = assignment.employeeFirstName && assignment.employeeLastName
                ? ` with operator ${assignment.employeeFirstName} ${assignment.employeeLastName}`
                : '';
              warnings.push(
                `Active assignment to Project "${assignment.projectName}"${operatorInfo} (Started: ${startDateStr}, ${assignment.endDate ? `Ends: ${endDateStr}` : 'Ongoing'})`
              );
            } else {
              warnings.push(
                `Active assignment (Started: ${startDateStr}, ${assignment.endDate ? `Ends: ${endDateStr}` : 'Ongoing'})`
              );
            }
          });
        }

        setEquipmentAssignmentWarnings(warnings);
      } catch (error) {
        console.error('Error checking equipment assignments:', error);
        setEquipmentAssignmentWarnings([]);
      } finally {
        setLoadingEquipmentAssignments(false);
      }
    };

    checkEquipmentAssignments();
  }, [itemFormData.equipmentId, isAddItemDialogOpen, rental?.id]);

  // Fetch operator assignments for tooltip display
  useEffect(() => {
    const fetchOperatorAssignmentsForTooltip = async () => {
      if (!itemFormData.operatorId) {
        setOperatorAssignmentsForTooltip([]);
        return;
      }

      try {
        const response = await fetch(`/api/employees/${itemFormData.operatorId}/previous-assignments`);
        if (response.ok) {
          const data = await response.json();
          setOperatorAssignmentsForTooltip(data.assignments || []);
        }
      } catch (error) {
        console.error('Error fetching operator assignments for tooltip:', error);
        setOperatorAssignmentsForTooltip([]);
      }
    };

    fetchOperatorAssignmentsForTooltip();
  }, [itemFormData.operatorId]);

  const [equipment, setEquipment] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [supervisorDetails, setSupervisorDetails] = useState<any>(null);
  const [equipmentNames, setEquipmentNames] = useState<{[key: string]: string}>({});
  const [activeTab, setActiveTab] = useState('details');
  const confirmation = useRentalItemConfirmation();

  // Fetch equipment names for rental items (needed by fetchRental)
  const fetchEquipmentNames = async (rentalItems: any[]) => {
    const equipmentIds = rentalItems
      .filter(item => item.equipmentId && item.equipmentName?.startsWith('Equipment '))
      .map(item => item.equipmentId);
    
    if (equipmentIds.length === 0) return;
    
    try {
      // Use the existing equipment data if available, otherwise fetch all equipment
      let equipmentData = equipment;
      if (equipmentData.length === 0) {
        const response = await fetch('/api/equipment?limit=1000');
        if (response.ok) {
          const data = await response.json();
          equipmentData = data.data || data.equipment || [];
          setEquipment(equipmentData);
        }
      }
      
      // Map equipment IDs to names
      const namesMap: {[key: string]: string} = {};
      equipmentIds.forEach(id => {
        const eq = equipmentData.find((e: any) => e.id?.toString() === id.toString());
        if (eq) {
          namesMap[id] = eq.name || `Equipment ${id}`;
        }
      });
      
      setEquipmentNames(prev => ({ ...prev, ...namesMap }));
    } catch (error) {
      console.error('Failed to fetch equipment names:', error);
    }
  };

  // Fetch rental invoices (try database first, then ERPNext)
  const fetchRentalInvoices = async () => {
    try {
      // Try local database approach first (now that migration is complete)
      const response = await fetch(`/api/rentals/${rentalId}/invoices`);
      if (response.ok) {
        const invoices = await response.json();
        setRentalInvoices(invoices);
        return;
      }
    } catch (error) {
      console.error('Failed to fetch rental invoices from database:', error);
    }

    // Fallback: Try ERPNext-only approach
    try {
      const response = await fetch(`/api/rentals/${rentalId}/invoices-erpnext`);
      if (response.ok) {
        const invoices = await response.json();
        // Transform ERPNext invoices to match our UI format
        const transformedInvoices = invoices.map((invoice: any, index: number) => ({
          id: index + 1,
          invoiceId: invoice.name,
          amount: invoice.grand_total || invoice.total || '0',
          status: invoice.status || 'pending',
          dueDate: invoice.due_date,
          invoiceDate: invoice.posting_date
        }));
        setRentalInvoices(transformedInvoices);
        return;
      }
    } catch (error) {
      console.error('Failed to fetch invoices from ERPNext:', error);
    }

    // Final fallback: Use invoices from rental
    if (rental?.invoices && rental.invoices.length > 0) {
      setRentalInvoices(rental.invoices.map((invoice, index) => ({
        id: invoice.id || String(index + 1),
        invoiceId: invoice.invoiceNumber || invoice.id,
        amount: invoice.amount,
        status: invoice.status,
        dueDate: undefined,
        invoiceDate: undefined
      })));
    } else {
      setRentalInvoices([]);
    }
  };

  // Fetch rental payments
  const fetchRentalPayments = async () => {
    try {
      const response = await fetch(`/api/rentals/${rentalId}/payments`);
      if (response.ok) {
        const payments = await response.json();
        setRentalPayments(payments);
      } else {
        setRentalPayments([]);
      }
    } catch (error) {
      console.error('Failed to fetch rental payments:', error);
      setRentalPayments([]);
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

      // Recalculate financial totals from rental items ONLY if no invoice exists
      // Once an invoice is generated, use the amounts from the database (ERPNext amounts)
      if ((!data.invoices || data.invoices.length === 0) && data.rentalItems && data.rentalItems.length > 0) {
        const financials = calculateFinancials(data.rentalItems);
        data = { ...data, ...financials };
        
        // Update the database with recalculated totals so listing page shows correct values
        try {
          await fetch(`/api/rentals/${rentalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subtotal: financials.subtotal,
              taxAmount: financials.taxAmount,
              totalAmount: financials.totalAmount,
              finalAmount: financials.finalAmount,
            }),
          });
        } catch (err) {
          console.error('Failed to update rental totals:', err);
        }
      }

      setRental(data);
      
      console.log('Rental data received:', data);
      console.log('Rental items:', data.rentalItems);
      if (data.rentalItems) {
        data.rentalItems.forEach((item, index) => {
          console.log(`Frontend Item ${index + 1}:`, {
            id: item.id,
            equipmentName: item.equipmentName,
            startDate: item.startDate,
            status: item.status
          });
        });
      }
      
      // Fetch rental invoices and payments
      fetchRentalInvoices();
      fetchRentalPayments();
      
      // Fetch equipment names for rental items that have fallback names
      if (data.rentalItems && data.rentalItems.length > 0) {
        fetchEquipmentNames(data.rentalItems);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch rental details');
    } finally {
      setLoading(false);
    }
  };

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

  const toNumericValue = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const cleaned = typeof value === 'string' ? value.replace(/,/g, '') : value;
    const parsed = typeof cleaned === 'number' ? cleaned : Number(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const calculateItemTotal = (item: RentalItem, rental?: Rental): number => {
    if (!item) return 0;
  
    const storedTotalPrice = toNumericValue(item?.totalPrice);
    const { unitPrice, quantity = 1, rateType = 'daily', startDate: itemStartDate } = item;
    const basePrice = parseFloat(unitPrice?.toString() || '0') || 0;
    const itemCompletedDate = item.completedDate || (item as any).completed_date;
    const effectiveStartDate = itemStartDate || rental?.startDate;

    if (effectiveStartDate) {
      const startDate = new Date(effectiveStartDate);
      let endDate: Date;

      if (itemCompletedDate) {
        endDate = new Date(itemCompletedDate);
      } else if (rental?.status === 'completed' && rental?.expectedEndDate) {
        endDate = new Date(rental.expectedEndDate);
      } else {
        endDate = new Date();
      }

      if (endDate < startDate) {
        endDate = startDate;
      }

      if (rateType === 'hourly') {
        const hoursDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
        return basePrice * hoursDiff * quantity;
      } else if (rateType === 'weekly') {
        const weeksDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));
        return basePrice * weeksDiff * quantity;
      } else if (rateType === 'monthly') {
        const monthsDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        return basePrice * monthsDiff * quantity;
      } else {
        const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        return basePrice * daysDiff * quantity;
      }
    }
  
    return storedTotalPrice;
  };

  const calculateRentalDerivedTotals = (rental: Rental) => {
    const itemDerivedTotal = (rental.rentalItems || []).reduce(
      (sum, item) => sum + calculateItemTotal(item, rental),
      0
    );
    const taxRate = rental?.tax ?? 15;
    const derivedVatAmount =
      itemDerivedTotal > 0
        ? rental?.taxAmount && rental.taxAmount > 0
          ? rental.taxAmount
          : itemDerivedTotal * (taxRate / 100)
        : 0;
    const derivedTotalWithVat = itemDerivedTotal > 0 ? itemDerivedTotal + derivedVatAmount : 0;
    const fallbackTotal = rental.totalAmount ?? rental.finalAmount ?? rental.subtotal ?? 0;
    const actualTotalAmount = derivedTotalWithVat > 0 ? derivedTotalWithVat : fallbackTotal;

    return {
      itemDerivedTotal,
      derivedVatAmount,
      derivedTotalWithVat,
      actualTotalAmount,
    };
  };

  // Calculate financial totals from rental items
  const calculateFinancials = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => {
      // Calculate item total based on rate type and duration
      const itemTotal = calculateItemTotal(item);
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

  // Recalculate totals when rental dates change
  useEffect(() => {
    if (rental && rental.rentalItems && rental.startDate && rental.expectedEndDate) {
      recalculateTotals();
    }
  }, [rental?.startDate, rental?.expectedEndDate]);

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

  // Fetch ERPNext invoice amount
  const fetchErpnextInvoiceAmount = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/erpnext/invoice/${invoiceId}`);
      if (response.ok) {
        const invoiceData = await response.json();
        if (invoiceData.grand_total) {
          setErpnextInvoiceAmount(parseFloat(invoiceData.grand_total));
        }
      }
    } catch (error) {
      console.error('Failed to fetch ERPNext invoice amount:', error);
    }
  };

  // Link existing invoice from ERPNext
  const linkManualInvoice = async () => {
    if (!manualInvoiceId.trim()) {
      toast.error('Please enter an invoice ID');
      return;
    }

    try {
      const response = await fetch(`/api/rentals/${rentalId}/link-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: manualInvoiceId.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to link invoice');
      }

      toast.success('Invoice linked successfully');
      setIsManualInvoiceDialogOpen(false);
      setManualInvoiceId('');
      fetchRental(); // Refresh rental data first
      fetchRentalInvoices(); // Then refresh invoice list
    } catch (error) {
      console.error('Error linking invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to link invoice');
    }
  };

  // Link existing payment from ERPNext
  const linkManualPayment = async () => {
    if (!manualPaymentId.trim()) {
      toast.error('Please enter a payment ID');
      return;
    }

    try {
      const response = await fetch(`/api/rentals/${rentalId}/link-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: manualPaymentId.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to link payment');
      }

      toast.success('Payment linked successfully');
      setIsManualPaymentDialogOpen(false);
      setManualPaymentId('');
      fetchRental(); // Refresh rental data first
      fetchRentalPayments(); // Then refresh payment list
    } catch (error) {
      console.error('Error linking payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to link payment');
    }
  };

  // Fetch only rental items (for updates without full refresh)
  const fetchRentalItems = async () => {
    if (!rental) return;
    
    try {
      const response = await fetch(`/api/rentals/${rentalId}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch rental items');
      }
      const items = await response.json();

      // Update rental items in state
      setRental(prev => {
        if (!prev) return prev;
        
        // Recalculate financial totals from rental items ONLY if no invoice exists
        let updatedRental = { ...prev, rentalItems: items };
        if ((!prev.invoices || prev.invoices.length === 0) && items && items.length > 0) {
          const financials = calculateFinancials(items);
          updatedRental = { ...updatedRental, ...financials };
        }
        
        return updatedRental;
      });

      // Fetch equipment names for rental items that have fallback names
      if (items && items.length > 0) {
        fetchEquipmentNames(items);
      }
    } catch (err) {
      console.error('Failed to fetch rental items:', err);
      toast.error('Failed to refresh rental items');
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
      // Request all employees to ensure we get the one with ID 1
      const response = await fetch('/api/employees?all=true');
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      const employeesData = data.data || data.employees || [];
      console.log('Fetched employees data:', {
        responseData: data,
        employeesData: employeesData.slice(0, 3),
        totalCount: employeesData.length
      });
      setEmployees(employeesData);
      
    } catch (err) {
      console.error('Error fetching employees:', err);
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

  // Sync equipment assignments to rental items
  const syncEquipmentAssignments = async () => {
    if (!rental) return;

    try {
      const response = await fetch(`/api/rentals/${rental.id}/sync-equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync equipment assignments');
      }

      const result = await response.json();
      toast.success(result.message);
      
      // Refresh rental data to show new items
      fetchRental();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sync equipment assignments');
    }
  };

  // Generate automated monthly invoices for all active rentals
  const generateAutomatedMonthlyInvoices = async () => {
    try {
      const response = await fetch('/api/billing/automated-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate automated monthly invoices');
      }

      const result = await response.json();
      toast.success(result.message);
      
      // Refresh rental data to show updated invoice info
      fetchRental();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate automated monthly invoices');
    }
  };

  // Generate monthly invoice for active rental
  const generateMonthlyInvoice = async () => {
    if (!rental) return;

    // Show month selection dialog
    setIsMonthSelectionOpen(true);
  };

  // Generate invoice for selected month
  const generateInvoiceForMonth = async () => {
    if (!rental || !selectedMonth) return;

    try {
      console.log('Generating invoice for month:', selectedMonth);
      console.log('Rental ID:', rental.id);
      
      const response = await fetch(`/api/rentals/${rental.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          billingMonth: selectedMonth
        })
      });

      console.log('Invoice API response status:', response.status);
      console.log('Invoice API response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Invoice API error:', errorData);
        throw new Error(errorData.error || `Failed to generate monthly invoice (${response.status})`);
      }

      const result = await response.json();
      console.log('Invoice API success:', result);
      toast.success(result.message || 'Invoice generated successfully');
      
      // Close dialog and refresh rental data
      setIsMonthSelectionOpen(false);
      setSelectedMonth('');
      fetchRental();
    } catch (err) {
      console.error('Invoice generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate monthly invoice';
      toast.error(errorMessage);
      
      // Close dialog on error
      setIsMonthSelectionOpen(false);
      setSelectedMonth('');
    }
  };

  // Sync all invoices to detect deleted invoices
  const syncAllInvoices = async () => {
    try {
      const response = await fetch('/api/billing/sync-all-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync all invoices');
      }

      const result = await response.json();
      
      // Show detailed results
      const { summary } = result;
      let message = `Sync completed: ${summary.totalProcessed} processed`;
      if (summary.deletedFromERPNext > 0) {
        message += `, ${summary.deletedFromERPNext} deleted from ERPNext`;
      }
      if (summary.statusUpdated > 0) {
        message += `, ${summary.statusUpdated} status updated`;
      }
      if (summary.errors > 0) {
        message += `, ${summary.errors} errors`;
      }
      
      toast.success(message);
      
      // Refresh rental data and invoices to show updated status
      fetchRental();
      fetchRentalInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sync all invoices');
    }
  };

  // Sync payment status from ERPNext
  const syncPaymentStatus = async () => {
    if (!rental) return;

    try {
      const response = await fetch('/api/billing/monthly', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync payment status');
      }

      const result = await response.json();
      toast.success(result.message);
      
      // Refresh rental data to show updated payment status
      fetchRental();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sync payment status');
    }
  };

  // Clean up duplicate rental items
  const cleanupDuplicates = async () => {
    if (!rental) return;

    try {
      const response = await fetch(`/api/rentals/${rental.id}/cleanup-duplicates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cleanup duplicates');
      }

      const result = await response.json();
      toast.success(result.message);
      
      // Refresh rental data to show cleaned items
      fetchRental();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cleanup duplicates');
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
      router.push(`/${locale}/rental-management`);
    } catch (err) {
      toast.error('Failed to delete rental');
    }
  };

  // Generate invoice
  const generateInvoice = async () => {
    if (!rental) return;

    // Show month selection dialog
    setIsMonthSelectionOpen(true);
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
        method: 'PUT',
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
      area: rental.area || '',
      notes: rental.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  // Add rental item
  const addRentalItem = async () => {
    if (!rental) return;

    console.log('Form data before submission:', itemFormData);

    // Validate required fields
    if (!itemFormData.equipmentId || !itemFormData.unitPrice) {
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

      console.log('Sending rental item data:', requestData);

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
        supervisorId: '',
        status: 'active',
        notes: '',
        actionType: 'update',
        startDate: '',
      });

      // Refresh only rental items (no full page refresh)
      fetchRentalItems();
    } catch (err) {
      toast.error('Failed to add rental item');
    }
  };

  const openEditItemDialog = (item: any) => {
    // Format start date for input field (YYYY-MM-DD format)
    let formattedStartDate = '';
    if (item.startDate || item.start_date) {
      const dateValue = item.startDate || item.start_date;
      if (dateValue) {
        // If it's already a string in YYYY-MM-DD format, use it directly
        // Otherwise, convert Date object or ISO string to YYYY-MM-DD
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        if (!isNaN(date.getTime())) {
          formattedStartDate = date.toISOString().split('T')[0];
        }
      }
    }

    setItemFormData({
      id: item.id,
      equipmentId: item.equipment_id?.toString() || item.equipmentId?.toString() || '',
      equipmentName: item.equipment_name || item.equipmentName || '',
      unitPrice: item.unit_price || item.unitPrice || 0,
      totalPrice: item.total_price || item.totalPrice || 0,
      rateType: item.rate_type || item.rateType || 'daily',
      operatorId: item.operatorId?.toString() || '',
      supervisorId: item.supervisorId?.toString?.() || item.supervisor_id?.toString?.() || '',
      status: item.status || 'active',
      notes: item.notes || '',
      actionType: 'update', // Default to update mode
      startDate: formattedStartDate, // Properly formatted start date for date input
    });
    setIsEditItemDialogOpen(true);
  };

  const updateRentalItem = async () => {
    if (!rental) return;

    // Validate required fields
    if (!itemFormData.equipmentId || !itemFormData.unitPrice) {
      toast.error('Please fill in all required fields: Equipment and Unit Price');
      return;
    }

    try {
      // Calculate total price
      const totalPrice = itemFormData.unitPrice;

      const requestData = {
        ...itemFormData,
        totalPrice,
        startDate: itemFormData.startDate || null, // Explicitly include startDate
      };

      console.log('Updating rental item with data:', requestData);
      console.log('Start date value:', itemFormData.startDate);

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
        supervisorId: '',
        status: 'active',
        notes: '',
        actionType: 'update',
        startDate: '',
      });

      // Refresh only rental items (no full page refresh)
      fetchRentalItems();
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
          'Operator Handover Mode: Old rental item will be completed, new item will be created with new operator'
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
      
      // Refresh only rental items (no full page refresh)
      fetchRentalItems();
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

  // Handle completing/returning rental item
  const completeRentalItem = async (item: RentalItem, returnDate?: string) => {
    if (!rental) return;

    try {
      const response = await fetch(`/api/rentals/${rental.id}/items/${item.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnDate: returnDate || new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete rental item');
      }

      toast.success(`${item.equipmentName} returned successfully`);
      
      // Refresh only rental items
      fetchRentalItems();
    } catch (err) {
      toast.error(`Failed to return ${item.equipmentName}`);
    }
  };

  // Handle complete with confirmation dialog
  const handleCompleteItem = (item: RentalItem) => {
    // Get the item's start date (use item start date or rental start date)
    const itemStartDate = item.startDate && item.startDate !== '' 
      ? item.startDate 
      : rental?.startDate 
        ? rental.startDate 
        : undefined;
    
    confirmation.showReturnConfirmation(
      item.equipmentName,
      'Select the return date for this equipment. This will mark it as completed.',
      (returnDate) => {
        completeRentalItem(item, returnDate);
      },
      itemStartDate
    );
  };

  // Confirmation helper for completing rental (defined after confirmation hook)
  function showCompleteRentalConfirm() {
    confirmation.showConfirmDialog(
      'Complete Rental',
      'Are you sure you want to complete this rental? All active items will be marked as completed.',
      () => handleCompleteRental()
    );
  }

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
          <Button onClick={() => router.push(`/${locale}/rental-management`)} className="mt-4">
            Back to Rentals
          </Button>
        </div>
      </div>
    );
  }

  const displayedTotalAmount = rental?.totalAmount ?? rental?.finalAmount ?? rental?.subtotal ?? 0;
  const invoiceTotalAmount = rentalInvoices.reduce(
    (sum, invoice) => sum + toNumericValue(invoice?.amount),
    0
  );
  const paymentTotalAmount = rentalPayments.reduce(
    (sum, payment) => sum + toNumericValue(payment?.amount),
    0
  );
  const itemDerivedTotal = (rental?.rentalItems || []).reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );
  const taxRate = rental?.tax ?? 15;
  const derivedVatAmount =
    itemDerivedTotal > 0
      ? rental?.taxAmount && rental.taxAmount > 0
        ? rental.taxAmount
        : itemDerivedTotal * (taxRate / 100)
      : 0;
  const derivedTotalWithVat = itemDerivedTotal > 0 ? itemDerivedTotal + derivedVatAmount : 0;
  const actualTotalAmount =
    derivedTotalWithVat > 0
      ? derivedTotalWithVat
      : invoiceTotalAmount > 0
        ? invoiceTotalAmount
        : displayedTotalAmount;
  const outstandingBalance = actualTotalAmount - paymentTotalAmount;
  const outstandingLabel = outstandingBalance >= 0 ? 'Outstanding' : 'Overpaid';
  const outstandingValue = Math.abs(outstandingBalance);
  const outstandingClassName = outstandingBalance >= 0 ? 'text-destructive' : 'text-emerald-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/${locale}/rental-management`)}>
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
            <div className="text-2xl font-bold">{getStatusBadge(rental?.status)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('rental.fields.paymentStatus')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPaymentStatusBadge(rental?.paymentStatus)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('rental.totalAmount')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SAR {formatAmount(actualTotalAmount)}</div>
            {(invoiceTotalAmount > 0 || paymentTotalAmount > 0 || itemDerivedTotal > 0) && (
              <div className="mt-1 text-xs text-muted-foreground space-x-3">
                <span>Invoice Total: SAR {formatAmount(invoiceTotalAmount)}</span>
                <span>Payments: SAR {formatAmount(paymentTotalAmount)}</span>
                <span>Item Base: SAR {formatAmount(itemDerivedTotal)}</span>
                {itemDerivedTotal > 0 && (
                  <span>
                    VAT ({taxRate}%): SAR {formatAmount(derivedVatAmount)}
                  </span>
                )}
                <span>
                  {outstandingLabel}:{' '}
                  <span className={outstandingClassName}>SAR {formatAmount(outstandingValue)}</span>
                </span>
              </div>
            )}
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
      <div className={`grid grid-cols-1 ${activeTab === 'items' || activeTab === 'report' ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
        {/* Left Column - Rental Details */}
        <div className={activeTab === 'items' || activeTab === 'report' ? 'space-y-6' : 'lg:col-span-2 space-y-6'}>
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="details">{t('rental.tabs.details')}</TabsTrigger>
              <TabsTrigger value="workflow">{t('rental.tabs.workflow')}</TabsTrigger>
              <TabsTrigger value="items">{t('rental.tabs.items')}</TabsTrigger>
              <TabsTrigger value="payments">{t('rental.tabs.payments')}</TabsTrigger>
              <TabsTrigger value="invoices">{t('rental.tabs.invoices')}</TabsTrigger>
              <TabsTrigger value="report">{t('rental.tabs.report')}</TabsTrigger>
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
                          `${getShortName(`${supervisorDetails.first_name} ${supervisorDetails.last_name}`)} (File: ${supervisorDetails.file_number})`
                        ) : rental.supervisor ? (
                          `${t('rental.loading')} (ID: ${rental.supervisor})`
                        ) : (
                          t('rental.notAssigned')
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Area</Label>
                      <p className="text-sm text-muted-foreground">
                        {rental.area || t('rental.notAssigned')}
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
              {/* Monthly Billing Controls */}
              {rental.status === 'active' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Billing</CardTitle>
                    <CardDescription>Generate monthly invoices and sync payment status with ERPNext</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Button 
                        onClick={generateAutomatedMonthlyInvoices}
                        className="flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Generate All Monthly Invoices
                      </Button>
                      <Button 
                        onClick={generateMonthlyInvoice}
                        disabled={!rental || (rental.invoices && rental.invoices.length > 0)}
                        className="flex items-center gap-2"
                      >
                        <Receipt className="w-4 h-4" />
                        Generate Monthly Invoice
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={syncPaymentStatus}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Sync Payment Status
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={syncAllInvoices}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Sync All Invoices
                      </Button>
                    </div>
                    {rental.invoices && rental.invoices.length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          <strong>Invoice Generated:</strong> {rental.invoices[0]?.invoiceNumber || rental.invoices[0]?.id}
                        </p>
                        <p className="text-sm text-green-600">
                          Payment Status: {rental.paymentStatus}
                        </p>
                        {rental.outstandingAmount && parseFloat(rental.outstandingAmount) > 0 && (
                          <p className="text-sm text-green-600">
                            Outstanding: SAR {formatAmount(rental.outstandingAmount)}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Unified Timeline */}
              <UnifiedTimeline rental={rental} t={t} fetchRental={fetchRental} />
            </TabsContent>

            <TabsContent value="items" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{t('rental.rentalItems')}</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={syncEquipmentAssignments}
                        disabled={!rental || rental.rentalItems?.length > 0}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Equipment
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={cleanupDuplicates}
                        disabled={!rental || !rental.rentalItems?.length}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clean Duplicates
                      </Button>
                      <Button size="sm" onClick={() => setIsAddItemDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('rental.addItem')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <RentalItemSortableHeader column="index" label="Sl#" />
                        </TableHead>
                        <TableHead>
                          <RentalItemSortableHeader column="equipment" label={t('rental.equipment')} />
                        </TableHead>
                        <TableHead>
                          <RentalItemSortableHeader column="unitPrice" label={t('rental.unitPrice')} />
                        </TableHead>
                        <TableHead>
                          <RentalItemSortableHeader column="rateType" label={t('rental.rateType')} />
                        </TableHead>
                        <TableHead>
                          <RentalItemSortableHeader column="startDate" label="Start Date" />
                        </TableHead>
                        <TableHead>
                          <RentalItemSortableHeader column="duration" label={t('rental.duration')} />
                        </TableHead>
                        <TableHead>
                          <RentalItemSortableHeader column="totalPrice" label={t('rental.totalPrice')} />
                        </TableHead>
                        <TableHead>
                          <RentalItemSortableHeader column="operator" label={t('rental.operator')} />
                        </TableHead>
                        <TableHead>
                          <RentalItemSortableHeader column="supervisor" label={t('rental.fields.supervisor')} />
                        </TableHead>
                        <TableHead>
                          <RentalItemSortableHeader column="status" label={t('rental.status')} />
                        </TableHead>
                        <TableHead>{t('rental.table.headers.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedRentalItems.map(({ item }, index) => {
                        // Debug logging for rental item data
                        console.log('Rental item data:', {
                          itemId: item?.id,
                          equipmentName: item?.equipmentName,
                          operatorId: item?.operatorId,
                          operatorIdType: typeof item?.operatorId,
                          hasOperatorId: item?.operatorId !== null && item?.operatorId !== undefined
                        });
                        
                        // Get operator name directly from API response
                        let operatorName = 'N/A';
                        
                        if (item?.operatorId && item?.operatorFirstName && item?.operatorLastName) {
                          operatorName = `${item.operatorFirstName} ${item.operatorLastName}`;
                        } else if (item?.operatorId) {
                          operatorName = `Employee ${item.operatorId}`;
                        }

                        // Supervisor name
                        let supervisorName = '-';
                        if (item?.supervisorId && (item as any).supervisorFirstName && (item as any).supervisorLastName) {
                          supervisorName = getShortName(`${(item as any).supervisorFirstName} ${(item as any).supervisorLastName}`);
                        } else if (item?.supervisorId) {
                          supervisorName = `Employee ${item.supervisorId}`;
                        }
                        
                        console.log('Operator data from API:', {
                          operatorId: item?.operatorId,
                          operatorFirstName: item?.operatorFirstName,
                          operatorLastName: item?.operatorLastName,
                          operatorName
                        });

                        // Calculate duration based on actual rental period
                        const { label: durationText } = getRentalItemDurationMeta(item);

                        return (
                          <TableRow key={item?.id}>
                            <TableCell className="w-12 text-center">{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              {(() => {
                                const name = item?.equipmentName?.startsWith('Equipment ') && item?.equipmentId 
                                ? (equipmentNames[item.equipmentId.toString()] || item.equipmentName)
                                  : item?.equipmentName || 'N/A';
                                const plate = (item as any)?.equipmentIstimara;
                                return plate ? `${name} (${plate})` : name;
                              })()}
                            </TableCell>
                                                         <TableCell className="font-mono">SAR {formatAmount(item?.unitPrice)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {item?.rateType || 'daily'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item?.startDate && item.startDate !== '' 
                                ? format(new Date(item.startDate), 'MMM dd, yyyy')
                                : rental?.startDate 
                                  ? `Rental: ${format(new Date(rental.startDate), 'MMM dd, yyyy')}`
                                  : 'N/A'
                              }
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{durationText}</TableCell>
                                                         <TableCell className="font-mono font-semibold">SAR {formatAmount(calculateItemTotal(item, rental || undefined))}</TableCell>
                            <TableCell className="text-sm">{operatorName}</TableCell>
                            <TableCell className="text-sm">{supervisorName}</TableCell>
                            <TableCell>
                              <Badge variant={item?.status === 'active' ? 'default' : 'secondary'}>
                                {item?.status || 'active'}
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
                                {item?.status === 'active' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCompleteItem(item)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Return Equipment"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
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
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setIsManualPaymentDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Link Payment
                      </Button>
                      <Button size="sm" onClick={() => setIsAddPaymentDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('rental.addPayment')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment ID</TableHead>
                        <TableHead>{t('rental.amount')}</TableHead>
                        <TableHead>{t('rental.date')}</TableHead>
                        <TableHead>{t('rental.table.headers.status')}</TableHead>
                        <TableHead>{t('rental.table.headers.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rentalPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.paymentId}</TableCell>
                          <TableCell>SAR {formatAmount(parseFloat(payment.amount))}</TableCell>
                          <TableCell>
                            {payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM dd, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`/api/erpnext/payment/${payment.paymentId}`, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to unlink payment ${payment.paymentId}?`)) {
                                    try {
                                      const response = await fetch(`/api/rentals/${rentalId}/payments/${payment.paymentId}/unlink`, {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' }
                                      });
                                      const result = await response.json();
                                      if (result.success) {
                                        toast.success(result.message);
                                        fetchRentalPayments();
                                      } else {
                                        toast.error(result.error || 'Failed to unlink payment');
                                      }
                                    } catch (err) {
                                      console.error('Error unlinking payment:', err);
                                      toast.error('Failed to unlink payment');
                                    }
                                  }
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {rentalPayments.length === 0 && (
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
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setIsManualInvoiceDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Link Invoice
                      </Button>
                      <Button size="sm" onClick={generateInvoice}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('rental.generateInvoice')}
                      </Button>
                    </div>
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
                      {rentalInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.invoiceId}</TableCell>
                          <TableCell>SAR {formatAmount(parseFloat(invoice.amount))}</TableCell>
                          <TableCell>{getPaymentStatusBadge(invoice.status)}</TableCell>
                          <TableCell>
                            {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`/api/erpnext/invoice/${invoice.invoiceId}`, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/rentals/${rentalId}/invoices/${invoice.invoiceId}/sync`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' }
                                    });
                                    const result = await response.json();
                                    if (result.success) {
                                      toast.success(result.message);
                                      fetchRentalInvoices();
                                    } else {
                                      toast.error(result.error || 'Failed to sync invoice');
                                    }
                                  } catch (err) {
                                    console.error('Error syncing invoice:', err);
                                    toast.error('Failed to sync invoice');
                                  }
                                }}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to unlink invoice ${invoice.invoiceId}?`)) {
                                    try {
                                      const response = await fetch(`/api/rentals/${rentalId}/invoices/${invoice.invoiceId}/unlink`, {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' }
                                      });
                                      const result = await response.json();
                                      if (result.success) {
                                        toast.success(result.message);
                                        fetchRentalInvoices();
                                      } else {
                                        toast.error(result.error || 'Failed to unlink invoice');
                                      }
                                    } catch (err) {
                                      console.error('Error unlinking invoice:', err);
                                      toast.error('Failed to unlink invoice');
                                    }
                                  }
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {rentalInvoices.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">{t('rental.noInvoicesFound')}</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="report" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Monthly Items Report</CardTitle>
                      <CardDescription>Rental items grouped by month with monthly summaries</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Create printable HTML content in a new window
                          const rentalItems = rental?.rentalItems || [];
                          
                          const monthlyData = rentalItems.reduce((acc: any, item: any) => {
                            const itemStartDate = item.startDate || rental?.startDate;
                            if (!itemStartDate) return acc;
                            
                            const startDate = new Date(itemStartDate);
                            
                          // Determine end date for this item (prefer per-item completedDate)
                          let endDate = new Date();
                          const itemCompletedDate = item.completedDate || (item as any).completed_date;
                          if (itemCompletedDate) {
                            endDate = new Date(itemCompletedDate);
                          } else if (rental.status === 'completed' && rental.actualEndDate) {
                            endDate = new Date(rental.actualEndDate);
                          }
                            
                            // Generate entries for each month the item was active
                            const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                            const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                            
                            while (currentMonth <= endMonth) {
                              const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
                              const monthLabel = format(currentMonth, 'MMMM yyyy');
                              
                              if (!acc[monthKey]) {
                                acc[monthKey] = {
                                  monthLabel,
                                  items: [],
                                  totalItems: 0,
                                  totalAmount: 0,
                                  activeItems: 0,
                                  completedItems: 0
                                };
                              }
                              
                              // Calculate amount for this specific month
                              const itemStartForCalc = new Date(item.startDate);
                              itemStartForCalc.setHours(0, 0, 0, 0);
                              
                              const reportMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                              reportMonthStart.setHours(0, 0, 0, 0);
                              const reportMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                              reportMonthEnd.setHours(23, 59, 59, 999);
                              
                              const startInMonth = itemStartForCalc > reportMonthStart ? itemStartForCalc : reportMonthStart;
                              let endInMonth = reportMonthEnd;

                              // If the item's overall end is before this month starts, skip this month
                              const overallItemEnd = endDate;
                              if (overallItemEnd < reportMonthStart) {
                                currentMonth.setMonth(currentMonth.getMonth() + 1);
                                continue;
                              }
                              // If the item starts after this month ends, skip
                              if (itemStartForCalc > reportMonthEnd) {
                                currentMonth.setMonth(currentMonth.getMonth() + 1);
                                continue;
                              }
                              
                              // Prefer the item's completedDate when determining the end within this month
                              const itemCompletedDateForMonth = item.completedDate || (item as any).completed_date;
                              if (itemCompletedDateForMonth) {
                                const completed = new Date(itemCompletedDateForMonth);
                                completed.setHours(23, 59, 59, 999);
                                if (completed >= reportMonthStart && completed <= reportMonthEnd) {
                                  endInMonth = completed;
                                } else if (completed < reportMonthStart) {
                                  // Completed before this month – item not active this month
                                  endInMonth = reportMonthStart;
                                }
                              } else if (rental.status === 'completed' && rental.actualEndDate) {
                                const actualEnd = new Date(rental.actualEndDate);
                                actualEnd.setHours(23, 59, 59, 999);
                                if (actualEnd >= reportMonthStart && actualEnd <= reportMonthEnd) {
                                  endInMonth = actualEnd;
                                }
                              } else {
                                const today = new Date();
                                today.setHours(23, 59, 59, 999);
                                if (today >= reportMonthStart && today <= reportMonthEnd) {
                                  endInMonth = today;
                                }
                              }
                              
                              if (startInMonth <= endInMonth) {
                                const startDay = startInMonth.getDate();
                                const endDay = endInMonth.getDate();
                                const days = endDay - startDay + 1; // +1 for inclusive counting
                                
                                const itemAmount = (parseFloat(item.unitPrice || 0) || 0) * Math.max(days, 0);
                                acc[monthKey].totalAmount += itemAmount;
                              } else {
                                currentMonth.setMonth(currentMonth.getMonth() + 1);
                                continue;
                              }
                              
                              acc[monthKey].items.push(item);
                              acc[monthKey].totalItems += 1;
                              
                              if (item.status === 'active') {
                                acc[monthKey].activeItems += 1;
                              } else if (item.status === 'completed' || item.status === 'removed') {
                                acc[monthKey].completedItems += 1;
                              }
                              
                              // Move to next month
                              currentMonth.setMonth(currentMonth.getMonth() + 1);
                            }
                            
                            return acc;
                          }, {});
                          
                          let sortedMonths = Object.keys(monthlyData).sort().reverse();
                          
                          // Filter by selected month if not "all"
                          if (selectedMonth && selectedMonth !== 'all') {
                            sortedMonths = sortedMonths.filter(key => key === selectedMonth);
                          }
                          
                          let html = `
                            <html>
                              <head>
                                <title>Monthly Items Report - ${rental?.rentalNumber}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; padding: 10px; margin: 0; font-size: 12px; }
                                  h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; font-size: 20px; }
                                  h2 { color: #666; margin-top: 15px; margin-bottom: 5px; font-size: 16px; }
                                  table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: auto; font-size: 12px; }
                                  th, td { border: 1px solid #ddd; padding: 3px 5px; text-align: left; }
                                  th { background-color: #f2f2f2; font-weight: bold; font-size: 12px; }
                                  td { font-size: 12px; }
                                  .sl-col { width: 35px; text-align: center; }
                                  .equipment-col { min-width: 120px; }
                                  .price-col { width: 80px; text-align: right; }
                                  .rate-col { width: 60px; text-align: center; }
                                  .date-col { width: 95px; }
                                  .operator-col { min-width: 110px; }
                                  .duration-col { width: 75px; text-align: center; }
                                  .total-col { width: 100px; text-align: right; font-weight: bold; }
                                  .completed-col { width: 100px; }
                                  .summary { background-color: #f9f9f9; padding: 8px; margin: 10px 0; border-radius: 4px; font-size: 12px; }
                                  .month-section { page-break-after: auto; margin-bottom: 15px; }
                                  @media print {
                                    body { padding: 6px; font-size: 11px; }
                                    .no-print { display: none; }
                                    table { font-size: 11px; }
                                    th, td { padding: 2px 4px; font-size: 11px; }
                                  }
                                </style>
                              </head>
                              <body>
                                <h1>Monthly Items Report</h1>
                                <div class="summary">
                                  <strong>Rental Number:</strong> ${rental?.rentalNumber}<br/>
                                  <strong>Customer:</strong> ${rental?.customer?.name || 'N/A'}<br/>
                                  <strong>Report Date:</strong> ${format(new Date(), 'MMM dd, yyyy')}
                                </div>
                          `;
                          
                          sortedMonths.forEach(monthKey => {
                            const monthData = monthlyData[monthKey];
                            html += `
                              <div class="month-section">
                                <h2>${monthData.monthLabel}</h2>
                                <div class="summary">
                                  <strong>Total Items:</strong> ${monthData.totalItems} | 
                                  <strong>Active:</strong> ${monthData.activeItems} | 
                                  <strong>Total Value:</strong> SAR ${formatAmount(monthData.totalAmount)}
                                </div>
                                <table>
                                  <thead>
                                    <tr>
                                      <th class="sl-col">Sl#</th>
                                      <th class="equipment-col">Equipment</th>
                                      <th class="price-col">Unit Price</th>
                                      <th class="rate-col">Rate</th>
                                      <th class="date-col">Start Date</th>
                                      <th class="operator-col">Operator</th>
                                      <th class="operator-col">Supervisor</th>
                                      <th class="duration-col">Duration</th>
                                      <th class="total-col">Total</th>
                                      <th class="completed-col">Completed Date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                            `;
                            
                            // Group items by supervisor
                            const groupedBySupervisor = monthData.items.reduce((acc: any, item: any) => {
                              const supervisorKey = item?.supervisorId 
                                ? (item?.supervisorFirstName && item?.supervisorLastName
                                  ? getShortName(`${item.supervisorFirstName} ${item.supervisorLastName}`)
                                  : `Employee ${item.supervisorId}`)
                                : 'No Supervisor';
                              
                              if (!acc[supervisorKey]) {
                                acc[supervisorKey] = [];
                              }
                              acc[supervisorKey].push(item);
                              return acc;
                            }, {});
                            
                            const supervisorKeys = Object.keys(groupedBySupervisor).sort();
                            const hasMultipleSupervisors = supervisorKeys.length > 1;
                            let globalIndex = 0;
                            
                            supervisorKeys.forEach((supervisorKey) => {
                              const supervisorItems = groupedBySupervisor[supervisorKey];
                              
                              // Add supervisor header row if multiple supervisors
                              if (hasMultipleSupervisors) {
                                html += `
                                  <tr style="background-color: #f2f2f2;">
                                    <td colspan="10" style="font-weight: bold; padding: 6px;">Supervisor: ${supervisorKey}</td>
                                  </tr>
                                `;
                              }
                              
                              supervisorItems.forEach((item: any) => {
                              const baseName = item.equipmentName?.startsWith('Equipment ') && item.equipmentId 
                                ? (equipmentNames[item.equipmentId.toString()] || item.equipmentName)
                                : item.equipmentName || 'N/A';
                              const plate = item?.equipmentIstimara;
                              const equipmentName = plate ? `${baseName} (${plate})` : baseName;
                              
                              let operatorName = 'N/A';
                              if (item?.operatorId && item?.operatorFirstName && item?.operatorLastName) {
                                operatorName = `${item.operatorFirstName} ${item.operatorLastName}`;
                              } else if (item?.operatorId) {
                                operatorName = `Employee ${item.operatorId}`;
                              }
                              
                              // Get supervisor name
                              let supervisorName = 'N/A';
                              if (item?.supervisorId && item?.supervisorFirstName && item?.supervisorLastName) {
                                supervisorName = getShortName(`${item.supervisorFirstName} ${item.supervisorLastName}`);
                              } else if (item?.supervisorId) {
                                supervisorName = `Employee ${item.supervisorId}`;
                              }
                              
                              // Calculate duration and display start date for this specific month
                              let durationText = 'N/A';
                              let displayStartDate = 'N/A';
                              let monthlyTotal = 0;
                              
                              if (item.startDate) {
                                const itemStartDate = new Date(item.startDate);
                                itemStartDate.setHours(0, 0, 0, 0);
                                
                                // Parse month and year from monthLabel (e.g., "October 2025")
                                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                const monthParts = monthData.monthLabel.split(' ');
                                const year = parseInt(monthParts[1]);
                                const monthNum = monthNames.indexOf(monthParts[0]);
                                
                                // Get first and last day of the month
                                const monthStart = new Date(year, monthNum, 1);
                                monthStart.setHours(0, 0, 0, 0);
                                const monthEnd = new Date(year, monthNum + 1, 0);
                                monthEnd.setHours(23, 59, 59, 999);
                                
                                // Determine what start date to show for this month
                                if (itemStartDate.getTime() === monthStart.getTime()) {
                                  // Started on 1st of this month
                                  displayStartDate = format(itemStartDate, 'MMM dd, yyyy');
                                } else if (itemStartDate >= monthStart && itemStartDate < new Date(year, monthNum + 1, 1)) {
                                  // Started mid-month in this month
                                  displayStartDate = format(itemStartDate, 'MMM dd, yyyy');
                                } else {
                                  // This is a month after the start - show first of month
                                  displayStartDate = format(monthStart, 'MMM dd, yyyy');
                                }
                                
                                // Determine the start date in this month for duration calculation
                                const startInMonth = itemStartDate > monthStart ? itemStartDate : monthStart;
                                
                                // Determine the end date in this month
                                let endInMonth = monthEnd;
                                
                                // Check if item has a completed date and use it for duration calculation
                                const itemCompletedDate = (item.completedDate || (item as any).completed_date);
                                if (itemCompletedDate && item.status === 'completed') {
                                  const completedDate = new Date(itemCompletedDate);
                                  completedDate.setHours(23, 59, 59, 999);
                                  // If completed date is within this month, use it as end date
                                  if (completedDate >= monthStart && completedDate <= monthEnd) {
                                    endInMonth = completedDate;
                                  } else if (completedDate < monthStart) {
                                    // If completed before this month, item wasn't active this month
                                    endInMonth = monthStart;
                                  }
                                  // If completed after this month, use month end (item was active all month)
                                } else if (rental.status === 'completed' && rental.actualEndDate) {
                                  // Fallback to rental end date if item doesn't have completed date
                                  const actualEnd = new Date(rental.actualEndDate);
                                  actualEnd.setHours(23, 59, 59, 999);
                                  if (actualEnd >= monthStart && actualEnd <= monthEnd) {
                                    endInMonth = actualEnd;
                                  }
                                } else {
                                  // For active rentals, use today if within the month
                                  const today = new Date();
                                  today.setHours(23, 59, 59, 999);
                                  if (today >= monthStart && today <= monthEnd) {
                                    endInMonth = today;
                                  }
                                }
                                
                                // Calculate days - ensure we don't go outside the month
                                if (itemStartDate <= monthEnd) {
                                  const startDay = startInMonth.getDate();
                                  const endDay = endInMonth.getDate();
                                  const days = endDay - startDay + 1; // +1 for inclusive counting
                                  durationText = days >= 1 ? `${days} days` : '1 day';
                                  
                                  // Calculate monthly total
                                  monthlyTotal = (parseFloat(item.unitPrice || 0) || 0) * Math.max(days, 1);
                                } else {
                                  durationText = '0 days';
                                  monthlyTotal = 0;
                                }
                              }
                              
                              // Determine completed date display - only show in the month when completed
                              let completedDateDisplay = '-';
                              if (item.status === 'completed' && (item.completedDate || (item as any).completed_date)) {
                                const completedDate = new Date((item.completedDate || (item as any).completed_date));
                                completedDate.setHours(0, 0, 0, 0);
                                
                                // Check if completed date falls within the current report month
                                const [monthName, yearStr] = monthData.monthLabel.split(' ');
                                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                const reportMonth = monthNames.indexOf(monthName);
                                const reportYear = parseInt(yearStr);
                                
                                const reportMonthStart = new Date(reportYear, reportMonth, 1);
                                reportMonthStart.setHours(0, 0, 0, 0);
                                const reportMonthEnd = new Date(reportYear, reportMonth + 1, 0);
                                reportMonthEnd.setHours(23, 59, 59, 999);
                                
                                // Only show completed date if it's in this month
                                if (completedDate >= reportMonthStart && completedDate <= reportMonthEnd) {
                                  completedDateDisplay = format(completedDate, 'MMM dd, yyyy');
                                }
                              }
                              
                              globalIndex++;
                              html += `
                                <tr>
                                  <td class="sl-col">${globalIndex}</td>
                                  <td class="equipment-col">${equipmentName}</td>
                                  <td class="price-col">SAR ${parseFloat(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                  <td class="rate-col">${item.rateType || 'daily'}</td>
                                  <td class="date-col">${displayStartDate}</td>
                                  <td class="operator-col">${operatorName}</td>
                                  <td class="operator-col">${supervisorName}</td>
                                  <td class="duration-col">${durationText}</td>
                                  <td class="total-col">SAR ${monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                  <td class="completed-col">${completedDateDisplay}</td>
                                </tr>
                              `;
                            });
                            });
                            
                            html += `
                                  </tbody>
                                </table>
                              </div>
                            `;
                          });
                          
                          html += `
                              </body>
                            </html>
                          `;
                          
                          // Open print window
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(html);
                            printWindow.document.close();
                            setTimeout(() => printWindow.print(), 250);
                          }
                        }}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                      <Button 
                        size="sm"
                        onClick={async () => {
                          try {
                            // Fetch PDF from API
                            const url = `/api/rentals/${rentalId}/report/pdf?month=${selectedMonth || 'all'}`;
                            const response = await fetch(url);
                            
                            if (!response.ok) {
                              toast.error('Failed to generate PDF');
                              return;
                            }
                            
                            // Get the PDF blob
                            const blob = await response.blob();
                            
                            // Create download link
                            const downloadUrl = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = downloadUrl;
                            link.download = `Monthly_Items_Report_${rental?.rentalNumber}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(downloadUrl);
                            
                            toast.success('Report downloaded successfully');
                          } catch (error) {
                            console.error('Error downloading report:', error);
                            toast.error('Failed to download report');
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </Button>
                      <Select value={selectedMonth || 'all'} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Months</SelectItem>
                          {(() => {
                            // Get unique months from rental items (including all active months)
                            const months = new Set<string>();
                            (rental?.rentalItems || []).forEach((item: any) => {
                              const itemStartDate = item.startDate || rental?.startDate;
                              if (itemStartDate) {
                                const startDate = new Date(itemStartDate);
                                let endDate = new Date();
                                if (rental.status === 'completed' && rental.actualEndDate) {
                                  endDate = new Date(rental.actualEndDate);
                                }
                                
                                // Add all months from start to end
                                const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                                const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                                
                                while (currentMonth <= endMonth) {
                                  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
                                  months.add(monthKey);
                                  currentMonth.setMonth(currentMonth.getMonth() + 1);
                                }
                              }
                            });
                            return Array.from(months).sort().reverse().map(monthKey => {
                              const [year, month] = monthKey.split('-');
                              const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                              return { key: monthKey, label: format(date, 'MMMM yyyy') };
                            });
                          })().map(({ key, label }) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Group rental items by month based on start date
                    const rentalItems = rental?.rentalItems || [];
                    
                    // First, identify handover relationships across all items
                    // A handover is when an item is completed and a new item with different operator starts for same equipment
                    const handoverMap = new Map<string, string>(); // Maps completed item ID to new operator item ID
                    const allItemsSorted = [...rentalItems].sort((a: any, b: any) => {
                      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
                      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
                      return dateA - dateB;
                    });
                    
                    for (let i = 0; i < allItemsSorted.length; i++) {
                      const item = allItemsSorted[i];
                      const baseName = item.equipmentName?.startsWith('Equipment ') && item.equipmentId 
                        ? (equipmentNames[item.equipmentId.toString()] || item.equipmentName)
                        : item.equipmentName || 'N/A';
                      const plate = item?.equipmentIstimara;
                      const itemEquipmentName = plate ? `${baseName} (${plate})` : baseName;
                      
                      if (item.status === 'completed' && item.completedDate) {
                        // Look for a new item with different operator for same equipment that started after completion
                        for (let j = i + 1; j < allItemsSorted.length; j++) {
                          const nextItem = allItemsSorted[j];
                          const nextEquipmentName = nextItem.equipmentName?.startsWith('Equipment ') && nextItem.equipmentId 
                            ? (equipmentNames[nextItem.equipmentId.toString()] || nextItem.equipmentName)
                            : nextItem.equipmentName;
                          
                          if (itemEquipmentName === nextEquipmentName && 
                              item.operatorId !== nextItem.operatorId &&
                              nextItem.startDate) {
                            const completedDate = new Date(item.completedDate);
                            const nextStartDate = new Date(nextItem.startDate);
                            
                            // New item started on or after completion
                            if (nextStartDate >= completedDate) {
                              handoverMap.set(item.id, nextItem.id);
                              break; // Found handover, move to next item
                            }
                          }
                        }
                      }
                    }
                    
                    const monthlyData = rentalItems.reduce((acc: any, item: any) => {
                      const itemStartDate = item.startDate || rental?.startDate;
                      if (!itemStartDate) return acc;
                      
                      const startDate = new Date(itemStartDate);
                      
                      // Determine end date for this item (prefer the item's completedDate)
                      let endDate = new Date();
                      const itemCompletedDate = item.completedDate || (item as any).completed_date;
                      if (itemCompletedDate) {
                        endDate = new Date(itemCompletedDate);
                      } else if (rental.status === 'completed' && rental.actualEndDate) {
                        endDate = new Date(rental.actualEndDate);
                      }
                      
                      // Generate entries for each month the item was active
                      const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                      
                      while (currentMonth <= endMonth) {
                        const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
                        const monthLabel = format(currentMonth, 'MMMM yyyy');
                        
                        if (!acc[monthKey]) {
                          acc[monthKey] = {
                            monthLabel,
                            items: [],
                            totalItems: 0,
                            totalAmount: 0,
                            activeItems: 0,
                            completedItems: 0
                          };
                        }
                        
                        // Calculate amount for this specific month
                        const itemStartDate = new Date(item.startDate);
                        const [monthName, yearStr] = monthLabel.split(' ');
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        const reportMonth = monthNames.indexOf(monthName);
                        const reportYear = parseInt(yearStr);
                        
                        const monthStart = new Date(reportYear, reportMonth, 1);
                        const monthEnd = new Date(reportYear, reportMonth + 1, 0);
                        
                        // If the item ended before this month starts, skip
                        if (endDate < monthStart) {
                          currentMonth.setMonth(currentMonth.getMonth() + 1);
                          continue;
                        }
                        // If the item starts after this month ends, skip
                        if (itemStartDate > monthEnd) {
                          currentMonth.setMonth(currentMonth.getMonth() + 1);
                          continue;
                        }

                        const startInMonth = itemStartDate > monthStart ? itemStartDate : monthStart;
                        let endInMonth = monthEnd;

                        // Prefer per-item completed date if exists within this month
                        if (itemCompletedDate) {
                          const completed = new Date(itemCompletedDate);
                          if (completed < monthEnd && completed >= monthStart) {
                            endInMonth = completed;
                          } else if (completed < monthStart) {
                            endInMonth = monthStart;
                          }
                        } else if (rental.status === 'completed' && rental.actualEndDate) {
                          const actualEnd = new Date(rental.actualEndDate);
                          if (actualEnd < monthEnd && actualEnd >= monthStart) {
                            endInMonth = actualEnd;
                          }
                        } else {
                          const today = new Date();
                          if (today >= monthStart && today <= monthEnd) {
                            endInMonth = today;
                          }
                        }

                        if (startInMonth <= endInMonth) {
                          const startDay = startInMonth.getDate();
                          const endDay = endInMonth.getDate();
                          const days = endDay - startDay + 1; // +1 inclusive
                          const itemAmount = (parseFloat(item.unitPrice || 0) || 0) * Math.max(days, 0);
                          acc[monthKey].totalAmount += itemAmount;

                          acc[monthKey].items.push(item);
                          acc[monthKey].totalItems += 1;
                          if (item.status === 'active') {
                            acc[monthKey].activeItems += 1;
                          } else if (item.status === 'completed' || item.status === 'removed') {
                            acc[monthKey].completedItems += 1;
                          }
                          
                          // If this item has a handover (completed and new operator started), 
                          // only show the handover item in the month where the completion actually happened
                          if (handoverMap.has(item.id) && item.status === 'completed' && item.completedDate) {
                            const completedDate = item.completedDate ? new Date(item.completedDate) : null;
                            
                            // Only add handover item if the completion happened in THIS specific month
                            if (completedDate && completedDate >= monthStart && completedDate <= monthEnd) {
                              const handoverItemId = handoverMap.get(item.id);
                              const handoverItem = rentalItems.find((ri: any) => ri.id === handoverItemId);
                              
                              if (handoverItem && !acc[monthKey].items.find((ri: any) => ri.id === handoverItemId)) {
                                const handoverStartDate = handoverItem.startDate ? new Date(handoverItem.startDate) : null;
                                
                                if (handoverStartDate && handoverStartDate >= completedDate) {
                                  // Calculate amount for handover item in this month (only if it started in this month)
                                  if (handoverStartDate >= monthStart && handoverStartDate <= monthEnd) {
                                    const handoverStartInMonth = handoverStartDate > monthStart ? handoverStartDate : monthStart;
                                    const handoverEndInMonth = monthEnd;
                                    if (handoverStartInMonth <= handoverEndInMonth) {
                                      const handoverStartDay = handoverStartInMonth.getDate();
                                      const handoverEndDay = handoverEndInMonth.getDate();
                                      const handoverDays = handoverEndDay - handoverStartDay + 1;
                                      const handoverAmount = (Number(handoverItem.unitPrice) || 0) * Math.max(handoverDays, 0);
                                      acc[monthKey].totalAmount += handoverAmount;
                                    }
                                  }
                                  
                                  // Add handover item to this month's items to show continuity
                                  acc[monthKey].items.push(handoverItem);
                                  acc[monthKey].totalItems += 1;
                                  if (handoverItem.status === 'active') {
                                    acc[monthKey].activeItems += 1;
                                  }
                                }
                              }
                            }
                          }
                        }
                        
                        // Move to next month
                        currentMonth.setMonth(currentMonth.getMonth() + 1);
                      }
                      
                      return acc;
                    }, {});
                    
                    // Sort by month (newest first)
                    let sortedMonths = Object.keys(monthlyData).sort().reverse();
                    
                    // Filter by selected month if not "all"
                    if (selectedMonth && selectedMonth !== 'all') {
                      sortedMonths = sortedMonths.filter(key => key === selectedMonth);
                    }
                    
                    return sortedMonths.length > 0 ? (
                      <div className="space-y-3">
                        {sortedMonths.map((monthKey) => {
                          const monthData = monthlyData[monthKey];
                          return (
                            <Card key={monthKey} className="text-sm">
                              <CardHeader className="pb-2 pt-2.5 px-3">
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-lg font-semibold">{monthData.monthLabel}</CardTitle>
                                  <div className="flex gap-3 text-xs">
                                    <div className="flex flex-col">
                                      <span className="text-muted-foreground text-[11px]">Items</span>
                                      <span className="font-semibold text-sm">{monthData.totalItems}</span>
                                    </div>
                                    <div className="flex flex-col text-green-600">
                                      <span className="text-muted-foreground text-[11px]">Active</span>
                                      <span className="font-semibold text-sm">{monthData.activeItems}</span>
                                    </div>
                                    <div className="flex flex-col text-blue-600">
                                      <span className="text-muted-foreground text-[11px]">Value</span>
                                      <span className="font-semibold text-sm">SAR {formatAmount(monthData.totalAmount)}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="p-2">
                                <div className="overflow-x-auto">
                                  {(() => {
                                    // Remove duplicates (in case handover items were added)
                                    const uniqueItems = monthData.items.filter((item: any, index: number, self: any[]) => 
                                      index === self.findIndex((t: any) => t.id === item.id)
                                    );
                                    
                                    // Group items by equipment to show handover continuity
                                    const groupedByEquipment = uniqueItems.reduce((acc: any, item: any) => {
                                      const baseName = item.equipmentName?.startsWith('Equipment ') && item.equipmentId 
                                        ? (equipmentNames[item.equipmentId.toString()] || item.equipmentName)
                                        : item.equipmentName || 'N/A';
                                      const plate = item?.equipmentIstimara;
                                      const equipmentName = plate ? `${baseName} (${plate})` : baseName;
                                      const equipmentKey = equipmentName || 'Unknown Equipment';
                                      
                                      if (!acc[equipmentKey]) {
                                        acc[equipmentKey] = [];
                                      }
                                      acc[equipmentKey].push(item);
                                      return acc;
                                    }, {});
                                    
                                    // Sort items within each equipment group by active status first, then by start date
                                    Object.keys(groupedByEquipment).forEach(key => {
                                      groupedByEquipment[key].sort((a: any, b: any) => {
                                        // First sort by active status (active items first, then completed)
                                        const aIsActive = a.status === 'active';
                                        const bIsActive = b.status === 'active';
                                        
                                        if (aIsActive && !bIsActive) return -1; // Active comes first
                                        if (!aIsActive && bIsActive) return 1; // Active comes first
                                        
                                        // If both have same status, sort by start date
                                        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
                                        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
                                        if (dateA !== dateB) return dateA - dateB;
                                        
                                        return 0;
                                      });
                                    });
                                    
                                    // Flatten and sort equipment groups
                                    const equipmentKeys = Object.keys(groupedByEquipment).sort();
                                    const allItems: any[] = [];
                                    equipmentKeys.forEach(key => {
                                      allItems.push(...groupedByEquipment[key]);
                                    });
                                    
                                    return (
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="border-b">
                                        <TableHead className="w-10 text-center text-sm py-1 px-1">Sl#</TableHead>
                                        <TableHead className="text-sm py-1 px-2 min-w-[110px] font-semibold">Equipment</TableHead>
                                        <TableHead className="text-sm py-1 px-1 w-24">Unit Price</TableHead>
                                        <TableHead className="text-sm py-1 px-1 w-16">Rate</TableHead>
                                        <TableHead className="text-sm py-1 px-1 w-24">Start Date</TableHead>
                                        <TableHead className="text-sm py-1 px-1 min-w-[100px]">Operator</TableHead>
                                            <TableHead className="text-sm py-1 px-1 min-w-[110px]">Supervisor</TableHead>
                                        <TableHead className="text-sm py-1 px-1 w-20">Duration</TableHead>
                                        <TableHead className="text-sm py-1 px-1 w-28">Total</TableHead>
                                        <TableHead className="text-sm py-1 px-1 w-28">Completed Date</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                          {allItems.map((item: any, itemIndex: number) => {
                                      const baseName = item.equipmentName?.startsWith('Equipment ') && item.equipmentId 
                                        ? (equipmentNames[item.equipmentId.toString()] || item.equipmentName)
                                        : item.equipmentName || 'N/A';
                                      const plate = item?.equipmentIstimara;
                                      const equipmentName = plate ? `${baseName} (${plate})` : baseName;
                                      
                                      // Get operator name directly from API response
                                      let operatorName = 'N/A';
                                      if (item?.operatorId && item?.operatorFirstName && item?.operatorLastName) {
                                        operatorName = `${item.operatorFirstName} ${item.operatorLastName}`;
                                      } else if (item?.operatorId) {
                                        operatorName = `Employee ${item.operatorId}`;
                                      }
                                                  
                                                  // Get supervisor name
                                                  let supervisorName = 'N/A';
                                                  if (item?.supervisorId && item?.supervisorFirstName && item?.supervisorLastName) {
                                                    supervisorName = getShortName(`${item.supervisorFirstName} ${item.supervisorLastName}`);
                                                  } else if (item?.supervisorId) {
                                                    supervisorName = `Employee ${item.supervisorId}`;
                                                  }
                                      
                                      // Check if this is a handover using the handoverMap
                                      // A handover item is one that was started after a completed item with different operator
                                      const isHandoverItem = Array.from(handoverMap.values()).includes(item.id);
                                      
                                      // Check if this is the completed item that has a handover
                                      const isCompletedWithHandover = handoverMap.has(item.id);
                                      
                                      // Also check if previous item in list is the completed item for this handover
                                      const isHandoverContinuation = itemIndex > 0 && (() => {
                                        const prevItem = allItems[itemIndex - 1];
                                        const prevEquipmentName = prevItem.equipmentName?.startsWith('Equipment ') && prevItem.equipmentId 
                                          ? (equipmentNames[prevItem.equipmentId.toString()] || prevItem.equipmentName)
                                          : prevItem.equipmentName;
                                        
                                        if (equipmentName !== prevEquipmentName) return false;
                                        
                                        // Check if previous item is the completed item that this item is a handover for
                                        return handoverMap.has(prevItem.id) && handoverMap.get(prevItem.id) === item.id;
                                      })();
                                      
                                      const showHandoverHighlight = isHandoverItem || isCompletedWithHandover || isHandoverContinuation;
                                      
                                      // Calculate duration for this specific month
                                      let durationText = 'N/A';
                                      if (item.startDate) {
                                        const itemStartDate = new Date(item.startDate);
                                        itemStartDate.setHours(0, 0, 0, 0);
                                        
                                        // Parse month and year from monthLabel (e.g., "October 2025")
                                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                        const monthParts = monthData.monthLabel.split(' ');
                                        const year = parseInt(monthParts[1]);
                                        const monthNum = monthNames.indexOf(monthParts[0]);
                                        
                                        // Get first and last day of the month
                                        const monthStart = new Date(year, monthNum, 1);
                                        monthStart.setHours(0, 0, 0, 0);
                                        const monthEnd = new Date(year, monthNum + 1, 0);
                                        monthEnd.setHours(23, 59, 59, 999);
                                        
                                        // Determine the start date in this month
                                        const startInMonth = itemStartDate > monthStart ? itemStartDate : monthStart;
                                        
                                        // Determine the end date in this month
                                        let endInMonth = monthEnd;
                                        
                                        // Check if item has a completed date and use it for duration calculation
                                        const itemCompletedDate = (item.completedDate || (item as any).completed_date);
                                        if (itemCompletedDate && item.status === 'completed') {
                                          const completedDate = new Date(itemCompletedDate);
                                          completedDate.setHours(23, 59, 59, 999);
                                          // If completed date is within this month, use it as end date
                                          if (completedDate >= monthStart && completedDate <= monthEnd) {
                                            endInMonth = completedDate;
                                          } else if (completedDate < monthStart) {
                                            // If completed before this month, item wasn't active this month
                                            endInMonth = monthStart;
                                          }
                                          // If completed after this month, use month end (item was active all month)
                                        } else if (rental.status === 'completed' && rental.actualEndDate) {
                                          // Fallback to rental end date if item doesn't have completed date
                                          const actualEnd = new Date(rental.actualEndDate);
                                          actualEnd.setHours(23, 59, 59, 999);
                                          if (actualEnd >= monthStart && actualEnd <= monthEnd) {
                                            endInMonth = actualEnd;
                                          }
                                        } else {
                                          // For active rentals, use today if within the month
                                          const today = new Date();
                                          today.setHours(23, 59, 59, 999);
                                          if (today >= monthStart && today <= monthEnd) {
                                            endInMonth = today;
                                          }
                                        }
                                        
                                        // Calculate days - ensure we don't go outside the month
                                        if (itemStartDate > monthEnd) {
                                          durationText = '0 days';
                                        } else {
                                          // Calculate days by getting day components (inclusive)
                                          const startDay = startInMonth.getDate();
                                          const endDay = endInMonth.getDate();
                                          const days = endDay - startDay + 1; // +1 for inclusive counting
                                          durationText = days >= 1 ? `${days} days` : '1 day';
                                        }
                                      }
                                      
                                        // Determine what start date to show for this month
                                        // For handover items, always show the actual start date
                                        let displayStartDate = 'N/A';
                                        if (item.startDate && item.startDate !== '') {
                                          const itemStartDate = new Date(item.startDate);
                                          itemStartDate.setHours(0, 0, 0, 0);
                                          
                                          // Check if this is the actual start month or a subsequent month
                                          const [monthName, yearStr] = monthData.monthLabel.split(' ');
                                          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                          const reportMonth = monthNames.indexOf(monthName);
                                          const reportYear = parseInt(yearStr);
                                          
                                          const reportMonthStart = new Date(reportYear, reportMonth, 1);
                                          reportMonthStart.setHours(0, 0, 0, 0);
                                          
                                          // For handover items, always show the actual start date if it's in this month
                                          if (showHandoverHighlight && itemStartDate >= reportMonthStart && itemStartDate < new Date(reportYear, reportMonth + 1, 1)) {
                                            displayStartDate = format(itemStartDate, 'MMM dd, yyyy');
                                          } else if (itemStartDate.getTime() === reportMonthStart.getTime()) {
                                            // Started on 1st of this month - show the actual date
                                            displayStartDate = format(itemStartDate, 'MMM dd, yyyy');
                                          } else if (itemStartDate >= reportMonthStart && itemStartDate < new Date(reportYear, reportMonth + 1, 1)) {
                                            // Started mid-month in this month - show the actual start date
                                            displayStartDate = format(itemStartDate, 'MMM dd, yyyy');
                                          } else {
                                            // This is a month after the start - show first of month
                                            displayStartDate = format(reportMonthStart, 'MMM dd, yyyy');
                                          }
                                        } else if (rental?.startDate) {
                                          displayStartDate = `Rental: ${format(new Date(rental.startDate), 'MMM dd, yyyy')}`;
                                        }
                                      
                                      // Determine completed date display - only show in the month when completed
                                      let completedDateDisplay = '-';
                                      if (item.status === 'completed' && (item.completedDate || (item as any).completed_date)) {
                                        const completedDate = new Date((item.completedDate || (item as any).completed_date));
                                        completedDate.setHours(0, 0, 0, 0);
                                        
                                        // Check if completed date falls within the current report month
                                        const [monthName, yearStr] = monthData.monthLabel.split(' ');
                                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                        const reportMonth = monthNames.indexOf(monthName);
                                        const reportYear = parseInt(yearStr);
                                        
                                        const reportMonthStart = new Date(reportYear, reportMonth, 1);
                                        reportMonthStart.setHours(0, 0, 0, 0);
                                        const reportMonthEnd = new Date(reportYear, reportMonth + 1, 0);
                                        reportMonthEnd.setHours(23, 59, 59, 999);
                                        
                                        // Only show completed date if it's in this month
                                        if (completedDate >= reportMonthStart && completedDate <= reportMonthEnd) {
                                          completedDateDisplay = format(completedDate, 'MMM dd, yyyy');
                                        }
                                      }
                                      
                                      return (
                                        <TableRow key={item.id} className={`border-b ${showHandoverHighlight ? 'bg-blue-50/50' : ''}`}>
                                                      <TableCell className="w-10 text-center text-sm py-1 px-1">{itemIndex + 1}</TableCell>
                                          <TableCell className="font-medium text-sm py-1 px-2 min-w-[110px]">{equipmentName}</TableCell>
                                          <TableCell className="font-mono text-sm py-1 px-1 w-24">SAR {formatAmount(item.unitPrice)}</TableCell>
                                          <TableCell className="text-sm py-1 px-1 w-16">
                                            <Badge variant="outline" className="capitalize text-xs px-1.5 py-0.5 h-5">
                                              {item.rateType || 'daily'}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-sm text-muted-foreground py-1 px-1 w-24">
                                            {displayStartDate}
                                          </TableCell>
                                          <TableCell className="text-sm text-muted-foreground py-1 px-1 min-w-[100px]">{operatorName}</TableCell>
                                                      <TableCell className="text-sm text-muted-foreground py-1 px-1 min-w-[110px]">{supervisorName}</TableCell>
                                          <TableCell className="text-sm text-muted-foreground py-1 px-1 w-20">{durationText}</TableCell>
                                          <TableCell className="font-mono font-semibold text-sm py-1 px-1 w-28">
                                            {(() => {
                                              const days = parseInt(durationText.replace(' days', '')) || 1;
                                              const unitPrice = parseFloat(item.unitPrice || 0) || 0;
                                              const monthlyTotal = unitPrice * days;
                                              return `SAR ${formatAmount(monthlyTotal.toString())}`;
                                            })()}
                                          </TableCell>
                                          <TableCell className="text-sm text-muted-foreground py-1 px-1 w-28">{completedDateDisplay}</TableCell>
                                        </TableRow>
                                                  );
                                                })}
                                    </TableBody>
                                  </Table>
                                    );
                                  })()}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No rental items available for this rental
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Actions & Customer Info */}
        {activeTab !== 'items' && (
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
                  onClick={() => router.push(`/${locale}/rental-management/${rental.id}/quotation`)}
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
                <Button className="w-full" variant="outline" onClick={() => confirmation.showConfirmDialog(
                  'Complete Rental',
                  'Are you sure you want to complete this rental? All active items will be marked as completed.',
                  () => handleCompleteRental()
                )}>
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  {t('rental.completeRental')}
                  </Button>
              )}
              {rental.status === 'completed' && (
                <Button className="w-full" variant="outline" onClick={() => confirmation.showConfirmDialog(
                  'Reactivate Rental',
                  'Are you sure you want to reactivate this rental?',
                  () => handleActivateRental()
                )}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reactivate
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
        )}
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
                  setFormData(prev => ({ ...prev, supervisor: value }));
                }}
                placeholder={t('rental.fields.selectSupervisor')}
              />
            </div>
            <div>
              <Label htmlFor="editArea">Area</Label>
              <Input
                id="editArea"
                value={formData.area}
                onChange={e => setFormData(prev => ({ ...prev, area: e.target.value }))}
                placeholder="Enter area/location"
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
              <EquipmentDropdown
                value={itemFormData.equipmentId}
                onValueChange={value => {
                  const selectedEquipment = equipment.find(eq => eq.id.toString() === value);

                  setItemFormData(prev => ({
                    ...prev,
                    equipmentId: value,
                    equipmentName: selectedEquipment?.name || '',
                    unitPrice: selectedEquipment?.dailyRate || selectedEquipment?.daily_rate || 0,
                  }));
                  // Reset equipment assignment warnings when equipment changes
                  setEquipmentAssignmentWarnings([]);
                }}
                placeholder={t('rental.selectEquipment')}
                label={t('rental.equipment')}
                required
              />
              {loadingEquipmentAssignments && (
                <div className="text-xs text-muted-foreground mt-1">Checking equipment assignments...</div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <EmployeeDropdown
                    value={itemFormData.operatorId}
                    onValueChange={value => {
                      setItemFormData(prev => ({ ...prev, operatorId: value }));
                      // Reset previous assignment warnings when operator changes
                      setPreviousAssignmentWarnings([]);
                    }}
                    placeholder={t('rental.selectOperator')}
                    label={t('rental.operator')}
                  />
                </div>
                {itemFormData.operatorId && operatorAssignmentsForTooltip.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="mt-6 text-orange-600 hover:text-orange-700"
                        onClick={(e) => e.preventDefault()}
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-xs mb-2">Active Assignments:</p>
                        {operatorAssignmentsForTooltip
                          .filter((assignment: any) => {
                            // Skip current rental
                            return !(assignment.rentalId && rental?.id && assignment.rentalId.toString() === rental.id.toString());
                          })
                          .slice(0, 5)
                          .map((assignment: any, index: number) => {
                            const startDate = assignment.startDate 
                              ? new Date(assignment.startDate).toLocaleDateString() 
                              : 'unknown';
                            const equipmentInfo = assignment.equipmentName 
                              ? ` - ${assignment.equipmentName}` 
                              : '';
                            const role = assignment.role || 'operator';
                            const roleLabel = role === 'supervisor' ? 'Supervisor' : 'Operator';
                            
                            if (assignment.rentalNumber) {
                              return (
                                <p key={index} className="text-xs">
                                  <span className="font-medium">{roleLabel}</span>: Rental {assignment.rentalNumber}{equipmentInfo} ({startDate})
                                </p>
                              );
                            } else if (assignment.projectId) {
                              return (
                                <p key={index} className="text-xs">
                                  <span className="font-medium">{roleLabel}</span>: Project {assignment.projectId} ({startDate})
                                </p>
                              );
                            }
                            return null;
                          })}
                        {operatorAssignmentsForTooltip.filter((a: any) => 
                          !(a.rentalId && rental?.id && a.rentalId.toString() === rental.id.toString())
                        ).length > 5 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{operatorAssignmentsForTooltip.filter((a: any) => 
                              !(a.rentalId && rental?.id && a.rentalId.toString() === rental.id.toString())
                            ).length - 5} more
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {loadingPreviousAssignments && (
                <div className="text-xs text-muted-foreground mt-1">Checking previous assignments...</div>
              )}
            </div>
            <div>
              <EmployeeDropdown
                value={itemFormData.supervisorId}
                onValueChange={value => setItemFormData(prev => ({ ...prev, supervisorId: value }))}
                placeholder={t('rental.fields.selectSupervisor')}
                label={t('rental.fields.supervisor')}
              />
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

            {/* Date Selection for Active Rentals Only */}
            {rental?.status === 'active' && (
              <div className="col-span-2">
                <Label htmlFor="itemStartDate">Item Start Date</Label>
                <Input
                  id="itemStartDate"
                  type="date"
                  value={itemFormData.startDate || new Date().toISOString().split('T')[0]}
                  onChange={e => setItemFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="mt-1"
                  min={rental?.startDate}
                  max={new Date().toISOString().split('T')[0]}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Select the start date for this item
                </div>
              </div>
            )}

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

          {/* Equipment Previous Assignment Warning */}
          {equipmentAssignmentWarnings.length > 0 && (
            <div className="rounded-md bg-orange-50 border border-orange-200 p-3 space-y-2">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-orange-800 mb-1">Equipment Active Assignments Detected</h4>
                  <p className="text-xs text-orange-700 mb-2">
                    This equipment has active assignments that may conflict with this new assignment:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-orange-700">
                    {equipmentAssignmentWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-orange-600 mt-2">
                    Please review the equipment's current assignments before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Operator Previous Assignment Warning */}
          {previousAssignmentWarnings.length > 0 && (
            <div className="rounded-md bg-orange-50 border border-orange-200 p-3 space-y-2">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-orange-800 mb-1">Operator Active Assignments Detected</h4>
                  <p className="text-xs text-orange-700 mb-2">
                    This operator has active assignments that may conflict with this new assignment:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-orange-700">
                    {previousAssignmentWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-orange-600 mt-2">
                    Please review the operator's current assignments before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Warning */}
          {duplicateWarnings.length > 0 && (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 space-y-2">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-1">Potential Duplicate Detected</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-yellow-700">
                    {duplicateWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-yellow-600 mt-2">
                    Please review before adding. You may want to use the existing item or update it instead.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddItemDialogOpen(false);
              setDuplicateWarnings([]);
              setPreviousAssignmentWarnings([]);
              setEquipmentAssignmentWarnings([]);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={addRentalItem} 
              variant={duplicateWarnings.length > 0 || previousAssignmentWarnings.length > 0 || equipmentAssignmentWarnings.length > 0 ? 'outline' : 'default'}
            >
              {duplicateWarnings.length > 0 || previousAssignmentWarnings.length > 0 || equipmentAssignmentWarnings.length > 0 ? 'Add Anyway' : 'Add Item'}
            </Button>
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
                    unitPrice: selectedEquipment?.dailyRate || selectedEquipment?.daily_rate || 0,
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
              <EmployeeDropdown
                value={itemFormData.operatorId}
                onValueChange={value => setItemFormData(prev => ({ ...prev, operatorId: value }))}
                placeholder="Select operator (optional)"
                label="Operator"
              />
            </div>
            <div>
              <EmployeeDropdown
                value={itemFormData.supervisorId}
                onValueChange={value => setItemFormData(prev => ({ ...prev, supervisorId: value }))}
                placeholder="Select supervisor (optional)"
                label="Supervisor/Foreman"
              />
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
            <div>
              <Label htmlFor="editStartDate">Start Date</Label>
              <Input
                id="editStartDate"
                type="date"
                value={itemFormData.startDate || ''}
                onChange={e => setItemFormData(prev => ({ ...prev, startDate: e.target.value }))}
                min={rental?.startDate ? rental.startDate.split('T')[0] : undefined}
                max={new Date().toISOString().split('T')[0]}
              />
              {itemFormData.startDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {new Date(itemFormData.startDate).toLocaleDateString()}
                </p>
              )}
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
                'Old rental item will be completed, new item will be created with new operator'}
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

      {/* Month Selection Dialog */}
      <Dialog open={isMonthSelectionOpen} onOpenChange={setIsMonthSelectionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Billing Month</DialogTitle>
            <DialogDescription>Choose the month for which to generate the invoice</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="billingMonth">Billing Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a month" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    if (!rental?.startDate) return [];
                    
                    const startDate = new Date(rental.startDate);
                    const currentDate = new Date();
                    const months = [];
                    
                    // Start from rental start date month
                    let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                    
                    // Generate months from start date to current month only
                    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    
                    while (currentMonth <= endDate) {
                      const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
                      const monthValue = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
                      
                      months.push(
                        <SelectItem key={monthValue} value={monthValue}>
                          {monthName}
                        </SelectItem>
                      );
                      
                      // Move to next month
                      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                    }
                    
                    return months;
                  })()}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsMonthSelectionOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={generateInvoiceForMonth}
                disabled={!selectedMonth}
              >
                Generate Invoice
              </Button>
            </div>
          </div>
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
        showReturnDate={confirmation.confirmationState.showReturnDate}
        minReturnDate={confirmation.confirmationState.minReturnDate}
      />

      {/* Manual Invoice Linking Dialog */}
      <Dialog open={isManualInvoiceDialogOpen} onOpenChange={setIsManualInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Existing Invoice</DialogTitle>
            <DialogDescription>
              Enter the invoice ID from ERPNext to link it to this rental.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="manualInvoiceId">Invoice ID</Label>
              <Input
                id="manualInvoiceId"
                placeholder="e.g., ACC-SINV-2025-00001"
                value={manualInvoiceId}
                onChange={(e) => setManualInvoiceId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualInvoiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={linkManualInvoice} disabled={!manualInvoiceId.trim()}>
              Link Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Payment Linking Dialog */}
      <Dialog open={isManualPaymentDialogOpen} onOpenChange={setIsManualPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Existing Payment</DialogTitle>
            <DialogDescription>
              Enter the payment ID from ERPNext to link it to this rental.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="manualPaymentId">Payment ID</Label>
              <Input
                id="manualPaymentId"
                placeholder="e.g., ACC-PAY-2025-00001"
                value={manualPaymentId}
                onChange={(e) => setManualPaymentId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={linkManualPayment} disabled={!manualPaymentId.trim()}>
              Link Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
