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
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/use-i18n';

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
  const { t } = useTranslation('customer');
  const { isRTL } = useI18n();
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
          
          setRentals([]);
        }

        // For now, set empty invoices array since we don't have a dedicated invoice API
        // TODO: Implement invoice API when available
        setInvoices([]);
      } catch (error) {
        
        setError(error instanceof Error ? error.message : t('messages.loadingError'));
        toast.error(t('messages.loadingError'));
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
        return <Badge className="bg-green-100 text-green-800">{t(`status.${status}`)}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">{t(`status.${status}`)}</Badge>;
      case 'cancelled':
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">{t(`status.${status}`)}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{t(`status.${status}`) || t('status.unknown')}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">{t(`status.${status}`)}</Badge>;
      case 'partially paid':
        return <Badge className="bg-yellow-100 text-yellow-800">{t(`status.${status}`)}</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">{t(`status.${status}`)}</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">{t(`status.${status}`)}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{t(`status.${status}`) || t('status.unknown')}</Badge>;
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
    if (!dateString) return t('common.notAvailable');
    return new Date(dateString).toLocaleDateString('ar-SA', {
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
                     <p className="text-muted-foreground">{t('messages.loadingCustomer')}</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
                     <p className="text-muted-foreground">{error || t('messages.customerNotFound')}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            {t('actions.back')}
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
{t('actions.backToCustomers')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">
{t('fields.customerId')}: {customer.id} • {customer.status}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/modules/customer-management/${customerId}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
{t('actions.editCustomer')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalRentals')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rentals.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(calculateTotalRentals())} {t('stats.totalValue')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalInvoices')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(calculateTotalInvoices())} {t('stats.totalInvoiced')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.outstanding')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateOutstandingAmount())}</div>
            <p className="text-xs text-muted-foreground">{t('stats.amountDue')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('fields.status')}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusBadge(customer.status)}</div>
            <p className="text-xs text-muted-foreground">
              {customer.isActive ? t('status.active') : t('status.inactive')}
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
              <TabsTrigger value="rentals">{t('tabs.rentals')} ({rentals.length})</TabsTrigger>
              <TabsTrigger value="invoices">{t('tabs.invoices')} ({invoices.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="rentals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('tabs.rentalHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {rentals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
{t('messages.noRentalsFound')}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('table.headers.rentalNumber')}</TableHead>
                          <TableHead>{t('table.headers.equipment')}</TableHead>
                          <TableHead>{t('table.headers.startDate')}</TableHead>
                          <TableHead>{t('table.headers.endDate')}</TableHead>
                          <TableHead>{t('table.headers.amount')}</TableHead>
                          <TableHead>{t('table.headers.status')}</TableHead>
                          <TableHead>{t('table.headers.payment')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rentals.map(rental => (
                          <TableRow key={rental.id}>
                            <TableCell className="font-mono">{rental.rentalNumber}</TableCell>
                                                         <TableCell>{rental.equipmentName || t('common.notAvailable')}</TableCell>
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
                  <CardTitle>{t('tabs.invoiceHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
{t('messages.noInvoicesFound')}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('table.headers.invoiceNumber')}</TableHead>
                          <TableHead>{t('table.headers.amount')}</TableHead>
                          <TableHead>{t('table.headers.dueDate')}</TableHead>
                          <TableHead>{t('table.headers.status')}</TableHead>
                          <TableHead>{t('table.headers.created')}</TableHead>
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
                <span>{t('sections.companyInfo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('fields.companyName')}</label>
                                 <p className="text-lg font-semibold">{customer.companyName || t('common.notAvailable')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('fields.contactPerson')}</label>
                                 <p className="text-lg">{customer.contactPerson || t('common.notAvailable')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('fields.taxNumber')}</label>
                                 <p className="text-sm font-mono">{customer.taxNumber || t('common.notAvailable')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('fields.creditLimit')}</label>
                <p className="text-lg font-semibold">{formatCurrency(customer.creditLimit)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('fields.paymentTerms')}</label>
                                 <p className="text-lg">{customer.paymentTerms || t('common.notAvailable')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>{t('sections.contactInfo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('fields.email')}</label>
                                 <p className="text-lg">{customer.email || t('common.notAvailable')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('fields.phone')}</label>
                                 <p className="text-lg">{customer.phone || t('common.notAvailable')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('fields.website')}</label>
                                 <p className="text-lg">{customer.website || t('common.notAvailable')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('fields.address')}</label>
                                 <p className="text-sm">{customer.address || t('common.notAvailable')}</p>
                <p className="text-sm text-gray-500">
                                     {customer.city || t('common.notAvailable')}, {customer.state || t('common.notAvailable')} {customer.country || t('common.notAvailable')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('sections.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                {t('actions.createRental')}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                {t('actions.createInvoice')}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                {t('actions.generateReport')}
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
