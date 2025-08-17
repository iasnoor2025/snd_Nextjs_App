'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
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
      
      const response = await fetch(`/api/customers?page=${currentPage}&limit=10&sortBy=created_at&sortOrder=desc`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. You do not have permission to view customers.');
        } else if (response.status === 404) {
          setError('Customers API endpoint not found.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        if (data.success) {
          setCustomers(data.customers || []);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          setError(data.message || 'Failed to fetch customers');
        }
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to fetch customers from database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage]);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleSyncFromERPNext = async () => {
    console.log('Sync from ERPNext clicked');
    setSyncing(true);
    toast.info('Starting sync from ERPNext...');
    
    try {
      // First fetch customers from ERPNext
      console.log('Fetching customers from ERPNext...');
      const response = await fetch('/api/erpnext/customers');
      const result = await response.json();
      
      console.log('ERPNext response:', result);

      if (result.success && result.data && result.data.length > 0) {
        console.log(`Found ${result.data.length} customers in ERPNext`);
        
        // Now call the sync endpoint to save the data
        console.log('Calling sync endpoint...');
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
                  }
                };
                console.log('Mapped customer data:', mappedData);
                return mappedData;
              }),
              toUpdate: [],
              toSkip: []
            }
          })
        });

        const syncResult = await syncResponse.json();
        console.log('Sync result:', syncResult);

        if (syncResult.success) {
          const message = `Successfully synced ${syncResult.data.processed} customers from ERPNext!`;
          console.log(message);
          toast.success(message);
          
          // Refresh the customer list
          fetchCustomers();
        } else {
          const errorMessage = `Failed to sync customers: ${syncResult.message}`;
          console.error(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        const errorMessage = result.data && result.data.length === 0 
          ? 'No customers found in ERPNext' 
          : 'Failed to fetch customers from ERPNext';
        console.error(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = `Error syncing customers: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    console.log('View customer clicked:', customer);
    // Navigate to customer detail page
    window.location.href = `/modules/customer-management/${customer.id}`;
  };

  const handleEditCustomer = (customer: Customer) => {
    console.log('Edit customer clicked:', customer);
    // Navigate to customer edit page
    window.location.href = `/modules/customer-management/${customer.id}/edit`;
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    console.log('Delete customer clicked:', customer);
    if (confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
      try {
        const response = await fetch(`/api/customers`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: customer.id }),
        });

        if (response.ok) {
          toast.success('Customer deleted successfully!');
          fetchCustomers(); // Refresh the list
        } else {
          const error = await response.json();
          toast.error(`Failed to delete customer: ${error.message}`);
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Error deleting customer');
      }
    }
  };

  const handleAddCustomer = () => {
    console.log('Add customer clicked');
    // Navigate to customer create page
    window.location.href = '/modules/customer-management/create';
  };

  const handleExportCustomers = () => {
    console.log('Export customers clicked');
    toast.info('Export functionality coming soon!');
  };

  const handleImportCustomers = () => {
    console.log('Import customers clicked');
    toast.info('Import functionality coming soon!');
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-muted-foreground">Manage your customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncFromERPNext} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync from ERPNext'}
          </Button>
          <Button variant="outline" onClick={handleExportCustomers}>
            Export
          </Button>
          <Button variant="outline" onClick={handleImportCustomers}>
            Import
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleAddCustomer}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
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
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewCustomer(customer)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditCustomer(customer)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteCustomer(customer)}>
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
              <p className="text-muted-foreground">No customers found</p>
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
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
