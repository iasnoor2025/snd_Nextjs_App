'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, Search, Filter, Download, RefreshCw, FileText, DollarSign, User, Package, Upload, Settings, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

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
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
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
    finalAmount: 0
  });

  // Get allowed actions for rental management
  const allowedActions = getAllowedActions('Rental');

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

  // Fetch rentals with filters
  const fetchRentals = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/rentals?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rentals');
      }
      const data = await response.json();
      setRentals(data || []);
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
      console.error('Failed to fetch customers:', err);
      setCustomers([]); // Ensure customers is always an array
    }
  };

  // Calculate financial fields
  const calculateFinancials = (items: RentalItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.1; // 10% tax
    const totalAmount = subtotal + tax;
    return {
      subtotal,
      taxAmount: tax,
      totalAmount,
      discount: 0,
      tax: 10, // 10% tax rate
      finalAmount: totalAmount
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
          expectedEndDate: formData.expectedEndDate ? new Date(formData.expectedEndDate).toISOString() : null,
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
          expectedEndDate: formData.expectedEndDate ? new Date(formData.expectedEndDate).toISOString() : null,
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
    if (!confirm('Are you sure you want to delete this rental?')) return;

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
      finalAmount: 0
    });
    setSelectedRental(null);
  };

  // Open edit dialog
  const openEditDialog = (rental: Rental) => {
    setSelectedRental(rental);
    setFormData({
      customerId: rental.customerId || '',
      rentalNumber: rental.rentalNumber,
      startDate: rental.startDate && rental.startDate.includes('T') ? rental.startDate.split('T')[0] : rental.startDate || '',
      expectedEndDate: rental.expectedEndDate && rental.expectedEndDate.includes('T') ? rental.expectedEndDate.split('T')[0] : rental.expectedEndDate || '',
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
      finalAmount: rental.finalAmount
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
            <p className="text-muted-foreground">Loading rentals...</p>
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
            <h1 className="text-3xl font-bold">Rental Management</h1>
            <p className="text-muted-foreground">Manage equipment rentals and contracts</p>
          </div>
          <div className="flex items-center gap-2">
            <Can action="export" subject="Rental">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </Can>

            <Can action="create" subject="Rental">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Rental
              </Button>
            </Can>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Filters</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search rentals..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={filters.paymentStatus || ''}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All payment statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All payment statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Select
                    value={filters.customerId || ''}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All customers</SelectItem>
                      {(customers || []).map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={applyFilters}>Apply Filters</Button>
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Rentals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Rentals ({(rentals || []).length})</CardTitle>
            <CardDescription>
              Manage all equipment rentals and contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rental #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rentals || []).map((rental) => (
                  <TableRow key={rental.id}>
                    <TableCell className="font-medium">{rental.rentalNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rental.customer?.name || 'N/A'}</div>
                        {rental.customer?.email && (
                          <div className="text-sm text-muted-foreground">{rental.customer.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {rental.startDate && !isNaN(new Date(rental.startDate).getTime())
                        ? format(new Date(rental.startDate), 'MMM dd, yyyy')
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {rental.expectedEndDate && !isNaN(new Date(rental.expectedEndDate).getTime())
                        ? format(new Date(rental.expectedEndDate), 'MMM dd, yyyy')
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(rental.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(rental.paymentStatus)}</TableCell>
                    <TableCell>${formatAmount(rental.totalAmount)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Can action="read" subject="Rental">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/modules/rental-management/${rental.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Can>

                        <Can action="update" subject="Rental">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(rental)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Can>

                        <Can action="delete" subject="Rental">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRental(rental.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(rentals || []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No rentals found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Rental Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Rental</DialogTitle>
              <DialogDescription>
                Create a new equipment rental contract
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rentalNumber">Rental Number</Label>
                <Input
                  id="rentalNumber"
                  value={formData.rentalNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, rentalNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="customerId">Customer</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {(customers || []).map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="expectedEndDate">Expected End Date</Label>
                <Input
                  id="expectedEndDate"
                  type="date"
                  value={formData.expectedEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="depositAmount">Deposit Amount</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="paymentTermsDays">Payment Terms (Days)</Label>
                <Input
                  id="paymentTermsDays"
                  type="number"
                  value={formData.paymentTermsDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTermsDays: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
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
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value }))}
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
                  id="hasTimesheet"
                  checked={formData.hasTimesheet}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasTimesheet: e.target.checked }))}
                />
                <Label htmlFor="hasTimesheet">Has Timesheet</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasOperators"
                  checked={formData.hasOperators}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasOperators: e.target.checked }))}
                />
                <Label htmlFor="hasOperators">Has Operators</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createRental}>Create Rental</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Rental Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Rental</DialogTitle>
              <DialogDescription>
                Update rental contract details
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editRentalNumber">Rental Number</Label>
                <Input
                  id="editRentalNumber"
                  value={formData.rentalNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, rentalNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editCustomerId">Customer</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {(customers || []).map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editStartDate">Start Date</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editExpectedEndDate">Expected End Date</Label>
                <Input
                  id="editExpectedEndDate"
                  type="date"
                  value={formData.expectedEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editDepositAmount">Deposit Amount</Label>
                <Input
                  id="editDepositAmount"
                  type="number"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editPaymentTermsDays">Payment Terms (Days)</Label>
                <Input
                  id="editPaymentTermsDays"
                  type="number"
                  value={formData.paymentTermsDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTermsDays: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
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
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, hasTimesheet: e.target.checked }))}
                />
                <Label htmlFor="editHasTimesheet">Has Timesheet</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editHasOperators"
                  checked={formData.hasOperators}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasOperators: e.target.checked }))}
                />
                <Label htmlFor="editHasOperators">Has Operators</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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

        {/* Role-based content example */}
        <RoleBased roles={['ADMIN', 'MANAGER']}>
          <Card>
            <CardHeader>
              <CardTitle>Rental Administration</CardTitle>
              <CardDescription>
                Advanced rental management features for administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Can action="approve" subject="Rental">
                  <Button variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Rentals
                  </Button>
                </Can>

                <Can action="reject" subject="Rental">
                  <Button variant="outline">
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Rentals
                  </Button>
                </Can>

                <Can action="manage" subject="Rental">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Rental Settings
                  </Button>
                </Can>
              </div>
            </CardContent>
          </Card>
        </RoleBased>
      </div>
    </ProtectedRoute>
  );
}
