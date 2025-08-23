'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useI18n } from '@/hooks/use-i18n';
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
  const { t } = useTranslation('customer');
  const { isRTL } = useI18n();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Fetch customers data
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/customers?page=${currentPage}&limit=10&sortBy=created_at&sortOrder=desc`
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError(t('messages.accessDenied'));
        } else if (response.status === 404) {
          setError(t('messages.loadingError'));
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        if (data.success) {
          setCustomers(data.customers || []);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          setError(data.message || t('messages.loadingError'));
        }
      }
    } catch (err) {
      
      setError(t('messages.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage]);

  const filteredCustomers = customers.filter(
    customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleSyncFromERPNext = async () => {
    
    setSyncing(true);
    toast.info(t('messages.syncStarted'));

    try {
      // First fetch customers from ERPNext
      
      const response = await fetch('/api/erpnext/customers');
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {

        // Now call the sync endpoint to save the data
        
        const syncResponse = await fetch('/api/customers/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matchedData: {
              toCreate: result.data.map((customer: any) => {
                const mappedData = {
                  data: {
                    name: customer.customer_name || customer.name || '',
                    company_name: customer.customer_name || customer.name || '',
                    contact_person: customer.contact_person || customer.customer_name || '',
                    email: customer.email_id || customer.email || '',
                    phone: customer.mobile_no || customer.phone || '',
                    address: customer.customer_address || customer.address || '',
                    city: customer.city || '',
                    state: customer.state || '',
                    postal_code: customer.pincode || customer.postal_code || '',
                    country: customer.country || '',
                    tax_number: customer.tax_id || customer.tax_number || '',
                    credit_limit: customer.credit_limit || 0,
                    payment_terms: customer.payment_terms || '',
                    notes: customer.notes || '',
                    is_active: !customer.disabled,
                    erpnext_id: customer.name || '',
                  },
                };
                
                return mappedData;
              }),
              toUpdate: [],
              toSkip: [],
            },
          }),
        });

        const syncResult = await syncResponse.json();

        if (syncResult.success) {
          const message = t('messages.syncSuccess', { count: syncResult.data.processed });
          
          toast.success(message);

          // Refresh the customer list
          fetchCustomers();
        } else {
          const errorMessage = t('messages.syncError') + ': ' + syncResult.message;
          
          toast.error(errorMessage);
        }
      } else {
        const errorMessage =
          result.data && result.data.length === 0
            ? t('messages.syncNoData')
            : t('messages.syncError');
        
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = t('messages.syncError') + ': ' + (error instanceof Error ? error.message : t('messages.errorGeneral'));
      
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

  const handleDeleteCustomer = async (customer: Customer) => {
    
    if (confirm(t('messages.deleteConfirm'))) {
      try {
        const response = await fetch(`/api/customers`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: customer.id }),
        });

        if (response.ok) {
          toast.success(t('messages.deleteSuccess'));
          fetchCustomers(); // Refresh the list
        } else {
          const error = await response.json();
          toast.error(t('messages.deleteError') + ': ' + error.message);
        }
      } catch (error) {
        
        toast.error(t('messages.deleteError'));
      }
    }
  };

  const handleAddCustomer = () => {
    
    // Navigate to customer create page
    window.location.href = '/modules/customer-management/create';
  };

  const handleExportCustomers = () => {
    
    toast.info(t('messages.exportComingSoon'));
  };

  const handleImportCustomers = () => {
    
    toast.info(t('messages.importComingSoon'));
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">{t('status.active')}</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">{t('status.inactive')}</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncFromERPNext} disabled={syncing}>
            {syncing ? t('sync.inProgress') : t('actions.syncFromERPNext')}
          </Button>
          <Button variant="outline" onClick={handleExportCustomers}>
            {t('actions.exportCustomers')}
          </Button>
          <Button variant="outline" onClick={handleImportCustomers}>
            {t('actions.importCustomers')}
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleAddCustomer}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.addCustomer')}
          </Button>
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
          <CardTitle>{t('search.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('search.placeholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" />
              {t('actions.search')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('search.resultCount', { count: filteredCustomers.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.headers.name')}</TableHead>
                <TableHead>{t('table.headers.email')}</TableHead>
                <TableHead>{t('table.headers.phone')}</TableHead>
                <TableHead>{t('table.headers.status')}</TableHead>
                <TableHead>{t('table.headers.created')}</TableHead>
                <TableHead>{t('table.headers.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map(customer => (
                <TableRow key={customer.id}>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => handleDeleteCustomer(customer)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('search.noResults')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            {t('pagination.previous')}
          </Button>
          <span className="flex items-center px-4">
            {t('pagination.page', { current: currentPage, total: totalPages })}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            {t('pagination.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
