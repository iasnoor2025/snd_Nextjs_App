'use client';

import { ProtectedRoute } from '@/components/protected-route';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { useI18n } from '@/hooks/use-i18n';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Edit, Eye, Plus, Search, Trash2, RefreshCw, Users, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { toast } from 'sonner';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
  isActive: boolean;
}

export default function CustomerManagementPage() {
  const { t, isRTL } = useI18n();
  const { user, hasPermission, getAllowedActions } = useRBAC();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Get allowed actions for customer management
  const allowedActions = getAllowedActions('Customer');

  // Fetch customers data
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/customers?page=${currentPage}&limit=${itemsPerPage}&sort_by=${sortBy}&sort_order=${sortOrder}`
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError(t('common.messages.accessDenied'));
        } else if (response.status === 404) {
          setError(t('common.messages.loadingError'));
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        console.log('Fetched customers data:', data);
        if (data.success) {
          console.log('Setting customers:', data.customers?.length, 'total pages:', data.pagination?.totalPages);
          setCustomers(data.customers || []);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          setError(data.message || t('common.messages.loadingError'));
        }
      }
    } catch (err) {
      
      setError(t('common.messages.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear search when coming from redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('refresh')) {
      setSearchTerm('');
      // Remove the refresh param from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    fetchCustomers();
  }, [currentPage, sortBy, sortOrder, itemsPerPage]);

  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true; // Show all if no search term
    const search = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.phone?.toLowerCase().includes(search)
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleSyncFromERPNext = async () => {
    setSyncing(true);
    toast.info(t('common.messages.syncStarted'));

    try {
      // Use the new enhanced sync endpoint
      const syncResponse = await fetch('/api/customers/sync/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const syncResult = await syncResponse.json();

      if (syncResult.success) {
        const message = t('common.messages.syncSuccess', { count: syncResult.data.processed });
        toast.success(message);

        // Refresh the customer list
        fetchCustomers();
      } else {
        const errorMessage = t('common.messages.syncError') + ': ' + syncResult.message;
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = t('common.messages.syncError') + ': ' + (error instanceof Error ? error.message : t('common.messages.errorGeneral'));
      toast.error(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    
    // Navigate to customer detail page
    window.location.href = `/modules/customer-management/${customer.id}`;
  };

  const handleEditCustomer = (customer: Customer) => {
    
    // Navigate to customer edit page
    window.location.href = `/modules/customer-management/${customer.id}/edit`;
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/customers`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: customerToDelete.id }),
      });

      if (response.ok) {
        toast.success(t('common.messages.deleteSuccess'));
        fetchCustomers(); // Refresh the list
        setDeleteDialogOpen(false);
        setCustomerToDelete(null);
      } else {
        const error = await response.json();
        toast.error(t('common.messages.deleteError') + ': ' + error.message);
      }
    } catch (error) {
      toast.error(t('common.messages.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const handleAddCustomer = () => {
    
    // Navigate to customer create page
    window.location.href = '/modules/customer-management/create';
  };

  const handleExportCustomers = () => {
    
    toast.info(t('common.messages.exportComingSoon'));
  };

  const handleImportCustomers = () => {
    
    toast.info(t('common.messages.importComingSoon'));
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">{t('common.status.active')}</Badge>
    ) : (
              <Badge className="bg-gray-100 text-gray-800">{t('common.status.inactive')}</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              {t('customer.title')}
            </h1>
            <p className="text-muted-foreground">{t('customer.description')}</p>
          </div>
          <div className="flex gap-2">
            {hasPermission('create', 'Customer') && (
              <Button 
                onClick={handleAddCustomer}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('customer.actions.add_customer')}
              </Button>
            )}
            {hasPermission('sync', 'Customer') && (
              <Button
                onClick={handleSyncFromERPNext}
                disabled={syncing}
                variant="outline"
                className="flex items-center gap-2"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {syncing ? t('customer.sync.inProgress') : t('customer.actions.sync_from_erpnext')}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-800">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('customer.search.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder={t('customer.search.placeholder')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <Button type="submit" variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
              <div className="w-[250px]">
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px]">
                <label className="text-sm font-medium mb-2 block">Order</label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('customer.search.resultCount', { count: String(filteredCustomers.length) })}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Sl #</TableHead>
                  <TableHead>{t('customer.table.headers.name')}</TableHead>
                  <TableHead>{t('customer.table.headers.email')}</TableHead>
                  <TableHead>{t('customer.table.headers.phone')}</TableHead>
                  <TableHead>{t('customer.table.headers.status')}</TableHead>
                  <TableHead>{t('customer.table.headers.created')}</TableHead>
                  <TableHead>{t('customer.table.headers.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer, index) => {
                  // Calculate serial number based on pagination
                  const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{serialNumber}</TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hasPermission('update', 'Customer') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('delete', 'Customer') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleDeleteCustomer(customer)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t('customer.search.noResults')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Pagination */}
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Showing {filteredCustomers.length} of {customers.length} customers
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select value={String(itemsPerPage)} onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {t('customer.pagination.previous')}
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                {t('customer.pagination.next')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
              
              <span className="ml-4 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('customer.delete.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {customerToDelete && (
                  <>
                    {t('customer.delete.description')}
                    {' '}
                    <strong>{customerToDelete.name}</strong>?
                    {' '}
                    {t('customer.delete.warning')}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>
                {t('common.actions.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteCustomer}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.actions.loading')}
                  </>
                ) : (
                  t('common.actions.delete')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
