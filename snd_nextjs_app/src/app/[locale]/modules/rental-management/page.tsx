'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';


import { ProtectedRoute } from '@/components/protected-route';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { PermissionContent, RoleContent } from '@/lib/rbac/rbac-components';
import { PermissionBased } from '@/components/PermissionBased';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { format } from 'date-fns';
import {
  CheckCircle,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Upload,
  User,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
// i18n refactor: All user-facing strings now use useTranslation('rental')
import { useI18n } from '@/hooks/use-i18n';
import {
  batchTranslateNames,
  convertToArabicNumerals,
  getTranslatedName,
} from '@/lib/translation-utils';
import { useDeleteConfirmations } from '@/lib/utils/confirmation-utils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { cn } from '@/lib/utils';


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

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
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
}

interface Filters {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  paymentStatus?: string;
}

export default function RentalManagementPage() {
  const router = useRouter();
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const { t, isRTL } = useI18n();
  const { confirmDeleteRental } = useDeleteConfirmations();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [translatedNames, setTranslatedNames] = useState<{ [key: string]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [formData, setFormData] = useState({
    customerId: '',
    rentalNumber: '',
    startDate: '',
    expectedEndDate: '',
    supervisor: '',
    notes: '',
    rentalItems: [] as RentalItem[],
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    discount: 0,
    tax: 0,
    finalAmount: 0,
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // Get allowed actions for rental management
  const allowedActions = getAllowedActions('Rental');

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

  // Get status badge color
  const getStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge variant="outline">{t('rental.unknown')}</Badge>;
    }

    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">{t('rental.pending')}</Badge>;
      case 'active':
        return <Badge variant="default">{t('rental.active')}</Badge>;
      case 'completed':
        return <Badge variant="default">{t('rental.completed')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('rental.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge variant="outline">{t('rental.unknown')}</Badge>;
    }

    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">{t('rental.pending')}</Badge>;
      case 'partial':
        return <Badge variant="default">{t('rental.partial')}</Badge>;
      case 'paid':
        return <Badge variant="default">{t('rental.paid')}</Badge>;
      case 'overdue':
        return <Badge variant="destructive">{t('rental.overdue')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Fetch rentals with filters
  const fetchRentals = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters && typeof filters === 'object') {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') queryParams.append(key, value);
        });
      }

      const response = await fetch(`/api/rentals?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(t('rental.messages.fetchError'));
      }
      const data = await response.json();
      
      // Recalculate financial totals for each rental based on their items
      const rentalsWithCalculatedTotals = (data || []).map((rental: any) => {
        if (rental.rentalItems && rental.rentalItems.length > 0) {
          const financials = calculateFinancials(rental.rentalItems);
          return { ...rental, ...financials };
        }
        return rental;
      });
      
      setRentals(rentalsWithCalculatedTotals);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rental.messages.generalError'));
      toast.error(t('rental.messages.fetchError'));
      setRentals([]); // Ensure rentals is always an array
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=1000'); // Get all customers
      if (response.ok) {
        const data = await response.json();
        // The API returns an object with customers array, not a direct array
        setCustomers(data.customers || []);
      }
    } catch (err) {
      
      setCustomers([]); // Ensure customers is always an array
    }
  };

  // Calculate financial fields
  const calculateFinancials = (items: RentalItem[]) => {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = parseFloat(item.totalPrice?.toString() || '0') || 0;
      return sum + itemTotal;
    }, 0);
    
    // Get tax rate from the first rental item or use default
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

  // Validate form
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.customerId) {
      errors.customerId = t('rental.validation.customerRequired');
    }
    
    if (!formData.rentalNumber) {
      errors.rentalNumber = t('rental.validation.rentalNumberRequired');
    }
    
    // Date validations
    if (formData.startDate && formData.expectedEndDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.expectedEndDate);
      if (end < start) {
        errors.expectedEndDate = 'Expected end date cannot be before start date';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create rental
  const createRental = async () => {
    if (!validateForm()) {
      toast.error(t('rental.validation.fixErrors'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate financial fields
      const financials = calculateFinancials(formData.rentalItems);

      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...financials,
          expectedEndDate: formData.expectedEndDate
            ? new Date(formData.expectedEndDate).toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('rental.messages.createError'));
      }

      toast.success(t('rental.messages.createSuccess'));
      setIsCreateDialogOpen(false);
      resetForm();
      fetchRentals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('rental.messages.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update rental
  const updateRental = async () => {
    if (!selectedRental) return;

    try {
      // Guard: expectedEndDate must be >= startDate when both provided
      if (formData.startDate && formData.expectedEndDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.expectedEndDate);
        if (end < start) {
          toast.error('Expected end date cannot be before start date');
          return;
        }
      }

      // Calculate financial fields
      const financials = calculateFinancials(formData.rentalItems);

      const response = await fetch(`/api/rentals/${selectedRental.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formData.customerId,
          rentalNumber: formData.rentalNumber,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          expectedEndDate: formData.expectedEndDate
            ? new Date(formData.expectedEndDate).toISOString()
            : null,
          supervisor: formData.supervisor || null,
          notes: formData.notes || '',
          ...financials,
        }),
      });

      if (!response.ok) {
        throw new Error(t('rental.messages.updateError'));
      }

      toast.success(t('rental.messages.updateSuccess'));
      setIsEditDialogOpen(false);
      resetForm();
      fetchRentals();
    } catch (err) {
      toast.error(t('rental.messages.updateError'));
    }
  };

  // Delete rental
  const deleteRental = async (id: string) => {
    const confirmed = await confirmDeleteRental();
    if (confirmed) {
      try {
        const response = await fetch(`/api/rentals/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(t('rental.messages.deleteError'));
        }

        toast.success(t('rental.messages.deleteSuccess'));
        fetchRentals();
      } catch (err) {
        toast.error(t('rental.messages.deleteError'));
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      customerId: '',
      rentalNumber: '',
      startDate: '',
      expectedEndDate: '',
      supervisor: '',
      notes: '',
      rentalItems: [],
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      discount: 0,
      tax: 0,
      finalAmount: 0,
    });
    setSelectedRental(null);
  };

  // Open edit dialog
  const openEditDialog = (rental: Rental) => {
    setSelectedRental(rental);
    setFormData({
      customerId: rental.customerId || '',
      rentalNumber: rental.rentalNumber,
      startDate:
        rental.startDate && rental.startDate.includes('T')
          ? rental.startDate.split('T')[0]
          : rental.startDate || '',
      expectedEndDate:
        rental.expectedEndDate && rental.expectedEndDate.includes('T')
          ? rental.expectedEndDate.split('T')[0]
          : rental.expectedEndDate || '',
      supervisor: rental.supervisor || '',
      notes: rental.notes || '',
      rentalItems: rental.rentalItems || [],
      subtotal: rental.subtotal,
      taxAmount: rental.taxAmount,
      totalAmount: rental.totalAmount,
      discount: rental.discount,
      tax: rental.tax,
      finalAmount: rental.finalAmount,
    });
    setIsEditDialogOpen(true);
  };

  // Apply filters
  const applyFilters = () => {
    fetchRentals();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    fetchRentals();
  };

  // Generate rental number
  const generateRentalNumber = () => {
    const prefix = 'RENT';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${year}${month}${timestamp}`;
  };

  useEffect(() => {
    fetchRentals();
    fetchCustomers();
  }, []);

  // Trigger batch translation when rentals data changes
  useEffect(() => {
    if (rentals.length > 0 && isRTL) {
      const names = rentals.map(rental => rental.customer?.name).filter(Boolean) as string[];
      batchTranslateNames(names, isRTL, setTranslatedNames);
    }
  }, [rentals, isRTL]);

  useEffect(() => {
    if (isCreateDialogOpen && !formData.rentalNumber) {
      setFormData(prev => ({ ...prev, rentalNumber: generateRentalNumber() }));
    }
  }, [isCreateDialogOpen]);

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Rental' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('rental.messages.loading')}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Rental' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('rental.dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('rental.dashboard.description')}</p>
          </div>
          <div className="flex items-center gap-2">
            <PermissionContent action="export" subject="Rental">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {t('rental.actions.export')}
              </Button>
            </PermissionContent>

            <PermissionContent action="create" subject="Rental">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('rental.actions.add')}
              </Button>
            </PermissionContent>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('rental.dashboard.filterTitle')}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? t('rental.hideFilters') : t('rental.dashboard.showFilters')}
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">{t('rental.search')}</Label>
                  <Input
                    id="search"
                    placeholder={t('rental.searchRentals')}
                    value={filters.search || ''}
                    onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="status">{t('rental.status')}</Label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('rental.allStatuses')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="all">{t('rental.allStatuses')}</SelectItem>
                      <SelectItem value="pending">{t('rental.pending')}</SelectItem>
                      <SelectItem value="active">{t('rental.active')}</SelectItem>
                      <SelectItem value="completed">{t('rental.completed')}</SelectItem>
                      <SelectItem value="cancelled">{t('rental.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentStatus">{t('rental.paymentStatus')}</Label>
                  <Select
                    value={filters.paymentStatus || ''}
                    onValueChange={value => setFilters(prev => ({ ...prev, paymentStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('rental.allPaymentStatuses')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="all">{t('rental.allPaymentStatuses')}</SelectItem>
                      <SelectItem value="pending">{t('rental.pending')}</SelectItem>
                      <SelectItem value="partial">{t('rental.partial')}</SelectItem>
                      <SelectItem value="paid">{t('rental.paid')}</SelectItem>
                      <SelectItem value="overdue">{t('rental.overdue')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer">{t('rental.customer')}</Label>
                  <Select
                    value={filters.customerId || ''}
                    onValueChange={value => setFilters(prev => ({ ...prev, customerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('rental.allCustomers')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="all">{t('rental.allCustomers')}</SelectItem>
                      {(customers || []).map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={applyFilters}>{t('rental.applyFilters')}</Button>
                <Button variant="outline" onClick={clearFilters}>
                  {t('rental.clearFilters')}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Rentals Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('rental.dashboard.title')}</CardTitle>
            <CardDescription>{t('rental.dashboard.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('rental.table.headers.rentalNumber')}</TableHead>
                  <TableHead>{t('rental.table.headers.customer')}</TableHead>
                  <TableHead>{t('rental.table.headers.supervisor')}</TableHead>
                  <TableHead>{t('rental.table.headers.startDate')}</TableHead>
                  <TableHead>{t('rental.table.headers.endDate')}</TableHead>
                  <TableHead>{t('rental.table.headers.status')}</TableHead>
                  <TableHead>{t('rental.table.headers.paymentStatus')}</TableHead>
                  <TableHead>{t('rental.table.headers.totalAmount')}</TableHead>
                  <TableHead>{t('rental.table.headers.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rentals || []).map(rental => (
                  <TableRow key={rental.id}>
                    <TableCell className="font-medium">
                      {convertToArabicNumerals(rental.rentalNumber, isRTL)}
                    </TableCell>
                    <TableCell>
                      {getTranslatedName(
                        rental.customer?.name,
                        isRTL,
                        translatedNames,
                        setTranslatedNames
                      )}
                    </TableCell>
                    <TableCell>
                      {rental.supervisor ? (
                        <span className="text-sm">
                          {rental.supervisor_details ? (
                            `${rental.supervisor_details.name} (File: ${rental.supervisor_details.file_number})`
                          ) : (
                            `ID: ${rental.supervisor}`
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {t('rental.na')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {rental.startDate && !isNaN(new Date(rental.startDate).getTime()) ? (
                        new Date(rental.startDate).getFullYear() === 2099 ? (
                          <span className="text-muted-foreground text-sm">
                            {t('rental.notStarted')}
                          </span>
                        ) : (
                          format(new Date(rental.startDate), 'MMM dd, yyyy')
                        )
                      ) : (
                        t('rental.na')
                      )}
                    </TableCell>
                    <TableCell>
                      {rental.expectedEndDate && !isNaN(new Date(rental.expectedEndDate).getTime())
                        ? format(new Date(rental.expectedEndDate), 'MMM dd, yyyy')
                        : t('rental.na')}
                    </TableCell>
                    <TableCell>{getStatusBadge(rental.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(rental.paymentStatus)}</TableCell>
                    <TableCell className="font-mono">
                      SAR {convertToArabicNumerals(formatAmount(rental.totalAmount), isRTL)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <PermissionContent action="read" subject="Rental">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/modules/rental-management/${rental.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </PermissionContent>

                        <PermissionContent action="update" subject="Rental">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(rental)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </PermissionContent>

                        <PermissionContent action="delete" subject="Rental">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRental(rental.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </PermissionContent>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(rentals || []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">{t('rental.dashboard.noRentalsFound')}</div>
            )}
          </CardContent>
        </Card>

        {/* Create Rental Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('rental.createNewRental')}</DialogTitle>
              <DialogDescription>{t('rental.createEquipmentRentalContract')}</DialogDescription>
            </DialogHeader>
                        <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rentalNumber" className={cn("text-sm font-medium", formErrors.rentalNumber && "text-red-500")}>
                    {t('rental.fields.rentalNumber')} *
                  </Label>
                  <Input
                    id="rentalNumber"
                    value={formData.rentalNumber}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, rentalNumber: e.target.value }));
                      setFormErrors(prev => ({ ...prev, rentalNumber: '' }));
                    }}
                    className={cn(formErrors.rentalNumber && "border-red-500 focus:border-red-500")}
                    readOnly
                  />
                  {formErrors.rentalNumber && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.rentalNumber}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="customerId" className={cn("text-sm font-medium", formErrors.customerId && "text-red-500")}>
                    {t('rental.fields.customer')} *
                  </Label>
                  <SearchableSelect
                    value={formData.customerId}
                    onValueChange={value => {
                      console.log('Selected customer:', value); // Debug log
                      setFormData(prev => ({ ...prev, customerId: value }));
                      setFormErrors(prev => ({ ...prev, customerId: '' }));
                    }}
                    options={customers.map(customer => ({
                      value: customer.id.toString(),
                      label: customer.name,
                      email: customer.email,
                      phone: customer.phone
                    }))}
                    placeholder={t('rental.fields.selectCustomer')}
                    searchPlaceholder={t('rental.searchCustomers')}
                    emptyMessage={t('rental.noCustomersFound')}
                    required
                    searchFields={['label', 'email', 'phone']}
                    loading={loading}
                    error={formErrors.customerId}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="expectedEndDate" className="text-sm font-medium">
                  {t('rental.fields.expectedEndDate')}
                </Label>
                <Input
                  id="expectedEndDate"
                  type="date"
                  value={formData.expectedEndDate}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))
                  }
                  className="w-full"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('rental.expectedEndDateOptional')}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">{t('rental.fields.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFormErrors({});
                }}
                disabled={isSubmitting}
              >
                {t('rental.actions.cancel')}
              </Button>
              <Button 
                onClick={createRental} 
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('rental.creating')}
                  </>
                ) : (
                  t('rental.actions.createRental')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                <Label htmlFor="editCustomerId">{t('rental.fields.customer')}</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={value => setFormData(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('rental.fields.selectCustomer')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {(customers || []).map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editStartDate">{t('rental.fields.startDate')}</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData(prev => {
                    const newStart = e.target.value;
                    // If expected end date exists and is before new start, snap it to start
                    if (prev.expectedEndDate && newStart && new Date(prev.expectedEndDate) < new Date(newStart)) {
                      return { ...prev, startDate: newStart, expectedEndDate: newStart };
                    }
                    return { ...prev, startDate: newStart };
                  })}
                />
              </div>
              <div>
                <Label htmlFor="editExpectedEndDate">{t('rental.fields.expectedEndDate')}</Label>
                <Input
                  id="editExpectedEndDate"
                  type="date"
                  value={formData.expectedEndDate}
                  min={formData.startDate || undefined}
                  onChange={e => {
                    const val = e.target.value;
                    // If start date exists and new end is before start, block and show toast
                    if (formData.startDate && val && new Date(val) < new Date(formData.startDate)) {
                      toast.error('Expected end date cannot be before start date');
                      return;
                    }
                    setFormData(prev => ({ ...prev, expectedEndDate: val }));
                  }}
                />
              </div>
              <div>
                <Label htmlFor="editSupervisor">{t('rental.fields.supervisor')}</Label>
                {/* EmployeeDropdown for supervisor selection */}
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

      </div>
    </ProtectedRoute>
  );
}
