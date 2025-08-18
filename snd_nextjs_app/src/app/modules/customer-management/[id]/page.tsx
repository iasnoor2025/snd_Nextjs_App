'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building,
  DollarSign,
  Edit,
  FileText,
  Loader2,
  Mail,
  Package,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  companyName: string | null;
  contactPerson: string | null;
  website: string | null;
  taxNumber: string | null;
  creditLimit: number | null;
  paymentTerms: string | null;
  isActive: boolean;
  erpnextId: string | null;
  createdAt: string;
  updatedAt: string;
  status: string;
}

interface Rental {
  id: number;
  rentalNumber: string;
  equipmentName: string | null;
  startDate: string;
  expectedEndDate: string | null;
  actualEndDate: string | null;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  customerId: number;
  projectId: number | null;
  subtotal: number;
  taxAmount: number;
  discount: number;
  finalAmount: number;
  depositAmount: number;
  paymentTermsDays: number;
  createdAt: string;
  updatedAt: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string | null;
  rentalId: number | null;
  amount: number;
  dueDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function CustomerDetailClient({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch customer details
        const customerResponse = await fetch(`/api/customers/${customerId}`);
        if (!customerResponse.ok) {
          throw new Error('Failed to fetch customer');
        }
        const customerData = await customerResponse.json();

        if (!customerData.success) {
          throw new Error(customerData.message || 'Failed to fetch customer');
        }

        setCustomer(customerData.customer);

        // Fetch customer rentals
        const rentalsResponse = await fetch(`/api/rentals?customerId=${customerId}`);
        if (rentalsResponse.ok) {
          const rentalsData = await rentalsResponse.json();
          if (rentalsData.rentals) {
            setRentals(rentalsData.rentals);
          } else {
            setRentals([]);
          }
        } else {
          console.warn('Failed to fetch rentals, setting empty array');
          setRentals([]);
        }

        // For now, set empty invoices array since we don't have a dedicated invoice API
        // TODO: Implement invoice API when available
        setInvoices([]);
      } catch (error) {
        console.error('Error fetching customer data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch customer data');
        toast.error('Failed to fetch customer data');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>;
      case 'cancelled':
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">{status}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || 'Unknown'}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
      case 'partially paid':
        return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">{status}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || 'Unknown'}</Badge>;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'SAR 0.00';
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateTotalRentals = () => {
    return rentals.reduce((total, rental) => total + (rental.finalAmount || 0), 0);
  };

  const calculateTotalInvoices = () => {
    return invoices.reduce((total, invoice) => total + invoice.amount, 0);
  };

  const calculateOutstandingAmount = () => {
    const totalInvoiced = calculateTotalInvoices();
    const totalPaid = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((total, invoice) => total + invoice.amount, 0);
    return totalInvoiced - totalPaid;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">{error || 'Customer not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/modules/customer-management">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">
              Customer ID: {customer.id} • {customer.status}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/modules/customer-management/${customerId}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rentals</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rentals.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(calculateTotalRentals())} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(calculateTotalInvoices())} total invoiced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateOutstandingAmount())}</div>
            <p className="text-xs text-muted-foreground">Amount due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusBadge(customer.status)}</div>
            <p className="text-xs text-muted-foreground">
              {customer.isActive ? 'Active' : 'Inactive'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabs Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="rentals" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rentals">Rentals ({rentals.length})</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="rentals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rental History</CardTitle>
                </CardHeader>
                <CardContent>
                  {rentals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No rentals found for this customer
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rental #</TableHead>
                          <TableHead>Equipment</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rentals.map(rental => (
                          <TableRow key={rental.id}>
                            <TableCell className="font-mono">{rental.rentalNumber}</TableCell>
                            <TableCell>{rental.equipmentName || 'N/A'}</TableCell>
                            <TableCell>{formatDate(rental.startDate)}</TableCell>
                            <TableCell>
                              {formatDate(rental.actualEndDate || rental.expectedEndDate)}
                            </TableCell>
                            <TableCell>{formatCurrency(rental.finalAmount)}</TableCell>
                            <TableCell>{getStatusBadge(rental.status)}</TableCell>
                            <TableCell>{getPaymentStatusBadge(rental.paymentStatus)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice History</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No invoices found for this customer
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map(invoice => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-mono">
                              {invoice.invoiceNumber || `INV-${invoice.id}`}
                            </TableCell>
                            <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                            <TableCell>{getPaymentStatusBadge(invoice.status)}</TableCell>
                            <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Company Info</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Company Name</label>
                <p className="text-lg font-semibold">{customer.companyName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Person</label>
                <p className="text-lg">{customer.contactPerson || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tax Number</label>
                <p className="text-sm font-mono">{customer.taxNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Credit Limit</label>
                <p className="text-lg font-semibold">{formatCurrency(customer.creditLimit)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                <p className="text-lg">{customer.paymentTerms || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Contact Info</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg">{customer.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-lg">{customer.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Website</label>
                <p className="text-lg">{customer.website || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-sm">{customer.address || 'N/A'}</p>
                <p className="text-sm text-gray-500">
                  {customer.city || 'N/A'}, {customer.state || 'N/A'} {customer.country || 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Create Rental
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise immediately - this must be called unconditionally
  const { id } = use(params);

  return <CustomerDetailClient customerId={id} />;
}
