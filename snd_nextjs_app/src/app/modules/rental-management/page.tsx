'use client';

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
import { PermissionContent, RoleBased, RoleContent } from '@/lib/rbac/rbac-components';
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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('rental');
  const { isRTL } = useI18n();
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
    depositAmount: '',
    paymentTermsDays: '30',
    hasTimesheet: false,
    hasOperators: false,
    status: 'pending',
    paymentStatus: 'pending',
    notes: '',
    rentalItems: [] as RentalItem[],
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    discount: 0,
    tax: 0,
    finalAmount: 0,
  });

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
      return <Badge variant="outline">{t('unknown')}</Badge>;
    }

    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">{t('pending')}</Badge>;
      case 'active':
        return <Badge variant="default">{t('active')}</Badge>;
      case 'completed':
        return <Badge variant="default">{t('completed')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge variant="outline">{t('unknown')}</Badge>;
    }

    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">{t('pending')}</Badge>;
      case 'partial':
        return <Badge variant="default">{t('partial')}</Badge>;
      case 'paid':
        return <Badge variant="default">{t('paid')}</Badge>;
      case 'overdue':
        return <Badge variant="destructive">{t('overdue')}</Badge>;
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
        throw new Error('Failed to fetch rentals');
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
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch rentals');
      setRentals([]); // Ensure rentals is always an array
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
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

  // Create rental
  const createRental = async () => {
    try {
      // Calculate financial fields
      const financials = calculateFinancials(formData.rentalItems);

      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...financials,
          depositAmount: parseFloat(formData.depositAmount) || 0,
          paymentTermsDays: parseInt(formData.paymentTermsDays),
          startDate: new Date(formData.startDate).toISOString(),
          expectedEndDate: formData.expectedEndDate
            ? new Date(formData.expectedEndDate).toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create rental');
      }

      toast.success('Rental created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchRentals();
    } catch (err) {
      toast.error('Failed to create rental');
    }
  };

  // Update rental
  const updateRental = async () => {
    if (!selectedRental) return;

    try {
      // Calculate financial fields
      const financials = calculateFinancials(formData.rentalItems);

      const response = await fetch(`/api/rentals/${selectedRental.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...financials,
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
      resetForm();
      fetchRentals();
    } catch (err) {
      toast.error('Failed to update rental');
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
          throw new Error('Failed to delete rental');
        }

        toast.success('Rental deleted successfully');
        fetchRentals();
      } catch (err) {
        toast.error('Failed to delete rental');
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
      depositAmount: '',
      paymentTermsDays: '30',
      hasTimesheet: false,
      hasOperators: false,
      status: 'pending',
      paymentStatus: 'pending',
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
      depositAmount: formatAmount(rental.depositAmount),
      paymentTermsDays: rental.paymentTermsDays.toString(),
      hasTimesheet: rental.hasTimesheet,
      hasOperators: rental.hasOperators,
      status: rental.status || 'pending',
      paymentStatus: rental.paymentStatus || 'pending',
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
            <p className="text-muted-foreground">{t('loading')}</p>
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
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex items-center gap-2">
            <PermissionContent action="export" subject="Rental">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {t('actions.export')}
              </Button>
            </PermissionContent>

            <PermissionContent action="create" subject="Rental">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('actions.add')}
              </Button>
            </PermissionContent>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('filterTitle')}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? t('hideFilters') : t('showFilters')}
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
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.headers.rentalNumber')}</TableHead>
                  <TableHead>{t('table.headers.customer')}</TableHead>
                  <TableHead>{t('table.headers.startDate')}</TableHead>
                  <TableHead>{t('table.headers.endDate')}</TableHead>
                  <TableHead>{t('table.headers.status')}</TableHead>
                  <TableHead>{t('table.headers.paymentStatus')}</TableHead>
                  <TableHead>{t('table.headers.totalAmount')}</TableHead>
                  <TableHead>{t('table.headers.actions')}</TableHead>
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
                      {rental.startDate && !isNaN(new Date(rental.startDate).getTime())
                        ? format(new Date(rental.startDate), 'MMM dd, yyyy')
                        : t('na')}
                    </TableCell>
                    <TableCell>
                      {rental.expectedEndDate && !isNaN(new Date(rental.expectedEndDate).getTime())
                        ? format(new Date(rental.expectedEndDate), 'MMM dd, yyyy')
                        : t('na')}
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
              <div className="text-center py-8 text-muted-foreground">{t('noRentalsFound')}</div>
            )}
          </CardContent>
        </Card>

        {/* Create Rental Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('createNewRental')}</DialogTitle>
              <DialogDescription>{t('createEquipmentRentalContract')}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rentalNumber">{t('rentalNumber')}</Label>
                <Input
                  id="rentalNumber"
                  value={formData.rentalNumber}
                  onChange={e => setFormData(prev => ({ ...prev, rentalNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="customerId">{t('customer')}</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={value => setFormData(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCustomer')} />
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
                <Label htmlFor="startDate">{t('startDate')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="expectedEndDate">{t('expectedEndDate')}</Label>
                <Input
                  id="expectedEndDate"
                  type="date"
                  value={formData.expectedEndDate}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="depositAmount">{t('depositAmount')}</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={e => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="paymentTermsDays">{t('paymentTermsDays')}</Label>
                <Input
                  id="paymentTermsDays"
                  type="number"
                  value={formData.paymentTermsDays}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, paymentTermsDays: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">{t('status')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="pending">{t('pending')}</SelectItem>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="completed">{t('completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentStatus">{t('paymentStatus')}</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={value => setFormData(prev => ({ ...prev, paymentStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="pending">{t('pending')}</SelectItem>
                    <SelectItem value="partial">{t('partial')}</SelectItem>
                    <SelectItem value="paid">{t('paid')}</SelectItem>
                    <SelectItem value="overdue">{t('overdue')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasTimesheet"
                  checked={formData.hasTimesheet}
                  onChange={e => setFormData(prev => ({ ...prev, hasTimesheet: e.target.checked }))}
                />
                <Label htmlFor="hasTimesheet">{t('hasTimesheet')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasOperators"
                  checked={formData.hasOperators}
                  onChange={e => setFormData(prev => ({ ...prev, hasOperators: e.target.checked }))}
                />
                <Label htmlFor="hasOperators">{t('hasOperators')}</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={createRental}>{t('createRental')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Rental Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('editRental')}</DialogTitle>
              <DialogDescription>{t('updateRentalContractDetails')}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editRentalNumber">{t('rentalNumber')}</Label>
                <Input
                  id="editRentalNumber"
                  value={formData.rentalNumber}
                  onChange={e => setFormData(prev => ({ ...prev, rentalNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editCustomerId">{t('customer')}</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={value => setFormData(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCustomer')} />
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
                <Label htmlFor="editStartDate">{t('startDate')}</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editExpectedEndDate">{t('expectedEndDate')}</Label>
                <Input
                  id="editExpectedEndDate"
                  type="date"
                  value={formData.expectedEndDate}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="editDepositAmount">{t('depositAmount')}</Label>
                <Input
                  id="editDepositAmount"
                  type="number"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={e => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editPaymentTermsDays">{t('paymentTermsDays')}</Label>
                <Input
                  id="editPaymentTermsDays"
                  type="number"
                  value={formData.paymentTermsDays}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, paymentTermsDays: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="editStatus">{t('status')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="pending">{t('pending')}</SelectItem>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="completed">{t('completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editPaymentStatus">{t('paymentStatus')}</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={value => setFormData(prev => ({ ...prev, paymentStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="pending">{t('pending')}</SelectItem>
                    <SelectItem value="partial">{t('partial')}</SelectItem>
                    <SelectItem value="paid">{t('paid')}</SelectItem>
                    <SelectItem value="overdue">{t('overdue')}</SelectItem>
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
                <Label htmlFor="editHasTimesheet">{t('hasTimesheet')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editHasOperators"
                  checked={formData.hasOperators}
                  onChange={e => setFormData(prev => ({ ...prev, hasOperators: e.target.checked }))}
                />
                <Label htmlFor="editHasOperators">{t('hasOperators')}</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="editNotes">{t('notes')}</Label>
              <Textarea
                id="editNotes"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={updateRental}>{t('updateRental')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role-based content example */}
        <RoleBased roles={['ADMIN', 'MANAGER']}>
          <Card>
            <CardHeader>
              <CardTitle>{t('rentalAdministration')}</CardTitle>
              <CardDescription>{t('advancedRentalManagementFeatures')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <PermissionContent action="approve" subject="Rental">
                  <Button variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('approveRentals')}
                  </Button>
                </PermissionContent>

                <PermissionContent action="reject" subject="Rental">
                  <Button variant="outline">
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('rejectRentals')}
                  </Button>
                </PermissionContent>

                <PermissionContent action="manage" subject="Rental">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    {t('rentalSettings')}
                  </Button>
                </PermissionContent>
              </div>
            </CardContent>
          </Card>
        </RoleBased>
      </div>
    </ProtectedRoute>
  );
}
