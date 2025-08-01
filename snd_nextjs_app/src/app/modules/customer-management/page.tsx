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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, User, Building, Mail, Phone, Download, Upload, Search, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  companyName?: string;
  isActive: boolean;
  status: string;
  erpnext_id?: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CustomerStatistics {
  totalCustomers: number;
  activeCustomers: number;
  erpnextSyncedCustomers: number;
  localOnlyCustomers: number;
}

export default function CustomerManagementPage() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isShowDialogOpen, setIsShowDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    companyName: '',
    isActive: true,
    status: 'active'
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [statistics, setStatistics] = useState<CustomerStatistics>({
    totalCustomers: 0,
    activeCustomers: 0,
    erpnextSyncedCustomers: 0,
    localOnlyCustomers: 0
  });

  // Pagination and filtering state
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get allowed actions for customer management
  const allowedActions = getAllowedActions('Customer');

  // Fetch customers with pagination and filtering
  const fetchCustomers = async (page = pagination.page, limit = pagination.limit) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/customers?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      
      // Map database snake_case to frontend camelCase
      const mappedCustomers = data.customers.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        contactPerson: customer.contact_person,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        country: customer.country,
        companyName: customer.company_name,
        isActive: customer.is_active,
        status: customer.status,
        erpnext_id: customer.erpnext_id,
        createdAt: customer.created_at,
      }));
      
      setCustomers(mappedCustomers);
      setPagination(data.pagination);
      setStatistics({
        totalCustomers: data.statistics.totalCustomers,
        activeCustomers: data.statistics.activeCustomers,
        erpnextSyncedCustomers: data.statistics.erpnextSyncedCustomers,
        localOnlyCustomers: data.statistics.localOnlyCustomers,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  // Create customer
  const createCustomer = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      toast.success('Customer created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to create customer');
    }
  };

  // Update customer
  const updateCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCustomer.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }

      toast.success('Customer updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to update customer');
    }
  };

  // Delete customer
  const deleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const response = await fetch('/api/customers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to delete customer');
    }
  };

  // Sync customers from ERPNext
  const syncCustomersFromERPNext = async () => {

    setSyncLoading(true);
    
    try {
      // Step 1: Check data from ERPNext
      
      toast.info('Checking data from ERPNext...');
      
      const checkResponse = await fetch('/api/customers/sync/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!checkResponse.ok) {
        const errorText = await checkResponse.text();
        console.error('Check failed:', errorText);
        throw new Error(`Failed to check ERPNext data: ${checkResponse.status} ${checkResponse.statusText}`);
      }

      const checkResult = await checkResponse.json();
      
      
      if (!checkResult.success) {
        toast.error(checkResult.message || 'Failed to check ERPNext data');
        return;
      }

      // Step 2: Match data
      
      toast.info('Matching data with existing customers...');
      
      const matchResponse = await fetch('/api/customers/sync/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          erpnextData: checkResult.data,
          existingCustomers: customers 
        }),
      });

      if (!matchResponse.ok) {
        const errorText = await matchResponse.text();
        console.error('Match failed:', errorText);
        throw new Error(`Failed to match data: ${matchResponse.status} ${matchResponse.statusText}`);
      }

      const matchResult = await matchResponse.json();
      
      
      if (!matchResult.success) {
        toast.error(matchResult.message || 'Failed to match data');
        return;
      }

      // Step 3: Sync data
      
      toast.info('Syncing matched data...');
      
      const syncResponse = await fetch('/api/customers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matchedData: matchResult.data 
        }),
      });

      
      if (!syncResponse.ok) {
        const errorText = await syncResponse.text();
        console.error('Sync failed:', errorText);
        throw new Error(`Failed to sync customers: ${syncResponse.status} ${syncResponse.statusText}`);
      }

      const syncResult = await syncResponse.json();
      
      
      if (syncResult.success) {
        toast.success(`Sync completed! ${syncResult.data.processed} customers processed (${syncResult.data.created} created, ${syncResult.data.updated} updated)`);
        fetchCustomers();
      } else {
        toast.error(syncResult.message || 'Failed to sync customers');
      }
      
    } catch (err) {
      console.error('Sync error:', err);
      toast.error(`Failed to sync customers from ERPNext: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSyncLoading(false);
    }
  };

  // Search and filter handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchLoading(true);
      fetchCustomers(1, pagination.limit).finally(() => {
        setSearchLoading(false);
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers(1, pagination.limit);
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers(1, pagination.limit);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchCustomers(page, pagination.limit);
  };

  const handleItemsPerPageChange = (limit: number) => {
    setPagination(prev => ({ ...prev, page: 1, limit }));
    fetchCustomers(1, limit);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      companyName: '',
      isActive: true,
      status: 'active'
    });
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      country: customer.country || '',
      companyName: customer.companyName || '',
      isActive: customer.isActive,
      status: customer.status
    });
    setIsEditDialogOpen(true);
  };

  const openShowDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsShowDialogOpen(true);
  };

  useEffect(() => {
    fetchCustomers();

  }, []);

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Customer' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Customer' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Customer' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Customer Management</h1>
            <p className="text-muted-foreground">
              Manage customer information and relationships
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={syncCustomersFromERPNext}
              disabled={syncLoading}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? 'Syncing...' : 'Sync from ERPNext'}
            </Button>

            <Can action="export" subject="Customer">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </Can>

            <Can action="import" subject="Customer">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </Can>

            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{statistics.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Customers</p>
                  <p className="text-2xl font-bold">{statistics.activeCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ERPNext Synced</p>
                  <p className="text-2xl font-bold">{statistics.erpnextSyncedCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Building className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Local Only</p>
                  <p className="text-2xl font-bold">{statistics.localOnlyCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>
              All customer records and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                    disabled={searchLoading}
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {sortBy === 'name' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('company_name')}
                  >
                    <div className="flex items-center gap-1">
                      Company
                      {sortBy === 'company_name' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      {sortBy === 'email' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortBy === 'status' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Sync</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold">No customers found</p>
                          <p className="text-muted-foreground">
                            {searchTerm || statusFilter !== 'all' 
                              ? 'Try adjusting your search or filter criteria'
                              : 'Get started by adding your first customer'
                            }
                          </p>
                        </div>
                        {!searchTerm && statusFilter === 'all' && (
                          <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Customer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{customer.name}</div>
                          {customer.erpnext_id && (
                            <div className="text-xs text-muted-foreground">ID: {customer.erpnext_id}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.companyName || customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.contactPerson ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.contactPerson}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-blue-600 hover:underline cursor-pointer">
                            {customer.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-green-600">{customer.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.city || customer.state ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-xs">📍</span>
                          </div>
                          <span>
                            {customer.city && customer.state 
                              ? `${customer.city}, ${customer.state}`
                              : customer.city || customer.state
                            }
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.erpnext_id ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          ERPNext
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Local
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => openShowDialog(customer)}
                          className="h-8 w-8 p-0"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => openEditDialog(customer)}
                          className="h-8 w-8 p-0"
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => deleteCustomer(customer.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {/* First page */}
                      {pagination.page > 2 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            className="w-8 h-8 p-0"
                          >
                            1
                          </Button>
                          {pagination.page > 3 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                        </>
                      )}

                      {/* Current page and surrounding pages */}
                      {(() => {
                        const pages = [];
                        const startPage = Math.max(1, pagination.page - 1);
                        const endPage = Math.min(pagination.totalPages, pagination.page + 1);

                        for (let page = startPage; page <= endPage; page++) {
                          pages.push(page);
                        }

                        return pages.map((page) => (
                          <Button
                            key={page}
                            variant={pagination.page === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ));
                      })()}

                      {/* Last page */}
                      {pagination.page < pagination.totalPages - 1 && (
                        <>
                          {pagination.page < pagination.totalPages - 2 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.totalPages)}
                            className="w-8 h-8 p-0"
                          >
                            {pagination.totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role-based content example */}
        <RoleBased roles={['ADMIN', 'MANAGER']}>
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>
                Additional actions available for administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Can action="manage" subject="Customer">
                  <Button variant="outline">
                    Bulk Operations
                  </Button>
                </Can>

                <Can action="export" subject="Customer">
                  <Button variant="outline">
                    Generate Reports
                  </Button>
                </Can>
              </div>
            </CardContent>
          </Card>
        </RoleBased>

        {/* Create Dialog */}
        {isCreateDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Customer</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createCustomer}>
                  Create Customer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        {isEditDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Customer</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-companyName">Company Name</Label>
                  <Input
                    id="edit-companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contactPerson">Contact Person</Label>
                  <Input
                    id="edit-contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-address">Address</Label>
                  <Textarea
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-city">City</Label>
                    <Input
                      id="edit-city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-state">State</Label>
                    <Input
                      id="edit-state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-country">Country</Label>
                  <Input
                    id="edit-country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateCustomer}>
                  Update Customer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Show Customer Dialog */}
        {isShowDialogOpen && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Customer Details</h2>
                <Button variant="outline" size="sm" onClick={() => setIsShowDialogOpen(false)}>
                  ×
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <p className="text-lg font-semibold">{selectedCustomer.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Company Name</Label>
                  <p className="text-lg">{selectedCustomer.companyName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Contact Person</Label>
                  <p className="text-lg">{selectedCustomer.contactPerson || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-lg">{selectedCustomer.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="text-lg">{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge variant={selectedCustomer.isActive ? 'default' : 'secondary'}>
                    {selectedCustomer.status}
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Address</Label>
                  <p className="text-lg whitespace-pre-wrap">{selectedCustomer.address || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">City</Label>
                  <p className="text-lg">{selectedCustomer.city || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">State</Label>
                  <p className="text-lg">{selectedCustomer.state || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Country</Label>
                  <p className="text-lg">{selectedCustomer.country || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">ERPNext ID</Label>
                  <p className="text-lg">{selectedCustomer.erpnext_id || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created At</Label>
                  <p className="text-lg">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsShowDialogOpen(false)}>
                  Close
                </Button>
                <Can action="update" subject="Customer">
                  <Button onClick={() => {
                    setIsShowDialogOpen(false);
                    openEditDialog(selectedCustomer);
                  }}>
                    Edit Customer
                  </Button>
                </Can>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
