'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';


import DocumentManager from '@/components/shared/DocumentManager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  postalCode: string | null;
  companyName: string | null;
  contactPerson: string | null;
  website: string | null;
  taxNumber: string | null;
  vatNumber: string | null;
  creditLimit: number | null;
  creditLimitUsed: number | null;
  creditLimitRemaining: number | null;
  paymentTerms: string | null;
  currentDue: number | null;
  totalValue: number | null;
  outstandingAmount: number | null;
  currency: string | null;
  customerType: string | null;
  customerGroup: string | null;
  territory: string | null;
  salesPerson: string | null;
  defaultPriceList: string | null;
  defaultCurrency: string | null;
  language: string | null;
  isActive: boolean;
  erpnextId: string | null;
  createdAt: string;
  updatedAt: string;
  status: string;
  notes: string | null;
  remarks: string | null;
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
  const { t } = useI18n();
  const { isRTL } = useI18n();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState('general');

  useEffect(() => {
    const fetchCustomerData = async () => {
      // Skip fetch if data already exists
      if (customer && rentals.length > 0) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch customer stats (includes customer, rentals, invoices, and financial data)
        const statsResponse = await fetch(`/api/customers/${customerId}/stats`);
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch customer stats');
        }
        const statsData = await statsResponse.json();

        if (!statsData.success) {
          throw new Error(statsData.message || 'Failed to fetch customer stats');
        }

        console.log('📊 Stats data received:', statsData);
        console.log('📊 Total rentals:', statsData.stats?.totalRentals);
        console.log('📊 Total invoices:', statsData.stats?.totalInvoices);
        console.log('📊 Outstanding:', statsData.stats?.outstandingAmount);

        // Set customer from stats (fallback to fetching customer directly if needed)
        if (statsData.stats && !customer) {
          // We have the customer name, but we need to fetch full customer data
          const customerResponse = await fetch(`/api/customers/${customerId}`);
          if (customerResponse.ok) {
            const customerData = await customerResponse.json();
            if (customerData.success) {
              setCustomer(customerData.customer);
            }
          }
        }

        // Set rentals from stats
        if (statsData.rentals && rentals.length === 0) {
          setRentals(statsData.rentals);
        } else if (!statsData.rentals) {
          setRentals([]);
        }

        // Create invoices array from rental invoices
        if (statsData.stats.totalInvoices > 0 && invoices.length === 0) {
          // Transform rentals into invoice-like objects for display
          const rentalInvoices = statsData.rentals
            .filter((rental: any) => rental.id)
            .map((rental: any) => ({
              id: rental.id,
              invoiceId: rental.rentalNumber || `RENTAL-${rental.id}`,
              amount: parseFloat(rental.finalAmount || rental.totalAmount || '0'),
              status: rental.paymentStatus || 'pending',
              dueDate: rental.expectedEndDate || null,
              createdAt: rental.createdAt,
              updatedAt: rental.updatedAt,
            }));
          setInvoices(rentalInvoices);
        } else if (statsData.stats.totalInvoices === 0 && invoices.length === 0) {
          setInvoices([]);
        }
      } catch (error) {
        
        setError(error instanceof Error ? error.message : t('customer.messages.loadingError'));
        toast.error(t('customer.messages.loadingError'));
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
        return <Badge className="bg-green-100 text-green-800">{t(`customer.status.${status}`)}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">{t(`customer.status.${status}`)}</Badge>;
      case 'cancelled':
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">{t(`customer.status.${status}`)}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{t(`customer.status.${status}`) || t('customer.status.unknown')}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">{t(`customer.status.${status}`)}</Badge>;
      case 'partially paid':
        return <Badge className="bg-yellow-100 text-yellow-800">{t(`customer.status.${status}`)}</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">{t(`customer.status.${status}`)}</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">{t(`customer.status.${status}`)}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{t(`customer.status.${status}`) || t('customer.status.unknown')}</Badge>;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'SAR 0.00';
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('customer.common.notAvailable');
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
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
                     <p className="text-muted-foreground">{t('customer.messages.loadingCustomer')}</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
                     <p className="text-muted-foreground">{error || t('customer.messages.customerNotFound')}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            {t('customer.actions.back')}
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
{t('customer.actions.backToCustomers')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">
{t('customer.fields.customerId')}: {customer.id} • {customer.status}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/modules/customer-management/${customerId}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
{t('customer.actions.editCustomer')}
            </Button>
          </Link>
        </div>
      </div>

             {/* Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">{t('customer.stats.totalRentals')}</CardTitle>
             <Package className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{rentals.length}</div>
             <p className="text-xs text-muted-foreground">
               {formatCurrency(calculateTotalRentals())} {t('customer.stats.totalValue')}
             </p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">{t('customer.stats.totalInvoices')}</CardTitle>
             <FileText className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{invoices.length}</div>
             <p className="text-xs text-muted-foreground">
               {formatCurrency(calculateTotalInvoices())} {t('customer.stats.totalInvoiced')}
             </p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">{t('customer.stats.outstanding')}</CardTitle>
             <DollarSign className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{formatCurrency(calculateOutstandingAmount())}</div>
             <p className="text-xs text-muted-foreground">{t('customer.stats.amountDue')}</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">{t('customer.fields.status')}</CardTitle>
             <User className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{getStatusBadge(customer.status)}</div>
             <p className="text-xs text-muted-foreground">
               {customer.isActive ? t('customer.status.active') : t('customer.status.inactive')}
             </p>
           </CardContent>
         </Card>
       </div>

       {/* Additional ERPNext Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">{t('customer.stats.creditLimit')}</CardTitle>
             <DollarSign className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{formatCurrency(customer.creditLimit)}</div>
             <p className="text-xs text-muted-foreground">
               {t('customer.stats.remaining')}: {formatCurrency(customer.creditLimitRemaining)}
             </p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">{t('customer.stats.currentDue')}</CardTitle>
             <DollarSign className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{formatCurrency(customer.currentDue)}</div>
             <p className="text-xs text-muted-foreground">{t('customer.stats.overdue')}</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">{t('customer.stats.totalValue')}</CardTitle>
             <DollarSign className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{formatCurrency(customer.totalValue)}</div>
             <p className="text-xs text-muted-foreground">{t('customer.stats.lifetime')}</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">{t('customer.stats.currency')}</CardTitle>
             <DollarSign className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{customer.currency || 'SAR'}</div>
             <p className="text-xs text-muted-foreground">{t('customer.stats.defaultCurrency')}</p>
           </CardContent>
         </Card>
       </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabs Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="rentals" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rentals">{t('customer.tabs.rentals')} ({rentals.length})</TabsTrigger>
              <TabsTrigger value="invoices">{t('customer.tabs.invoices')} ({invoices.length})</TabsTrigger>
              <TabsTrigger value="documents">{t('customer.tabs.documents')}</TabsTrigger>
            </TabsList>

            <TabsContent value="rentals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('customer.tabs.rentalHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {rentals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
{t('customer.messages.noRentalsFound')}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('customer.table.headers.rentalNumber')}</TableHead>
                          <TableHead>{t('customer.table.headers.equipment')}</TableHead>
                          <TableHead>{t('customer.table.headers.startDate')}</TableHead>
                          <TableHead>{t('customer.table.headers.endDate')}</TableHead>
                          <TableHead>{t('customer.table.headers.amount')}</TableHead>
                          <TableHead>{t('customer.table.headers.status')}</TableHead>
                          <TableHead>{t('customer.table.headers.payment')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rentals.map(rental => (
                          <TableRow key={rental.id}>
                            <TableCell className="font-mono">{rental.rentalNumber}</TableCell>
                                                         <TableCell>{rental.equipmentName || t('customer.common.notAvailable')}</TableCell>
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
                  <CardTitle>{t('customer.tabs.invoiceHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
{t('customer.messages.noInvoicesFound')}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('customer.table.headers.invoiceNumber')}</TableHead>
                          <TableHead>{t('customer.table.headers.amount')}</TableHead>
                          <TableHead>{t('customer.table.headers.dueDate')}</TableHead>
                          <TableHead>{t('customer.table.headers.status')}</TableHead>
                          <TableHead>{t('customer.table.headers.created')}</TableHead>
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

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('customer.tabs.documents')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentManager
                    title={t('customer.documents.title')}
                    description={t('customer.documents.description')}
                    loadDocuments={async () => {
                      try {
                        const response = await fetch(`/api/customers/${customerId}/documents`);
                        if (!response.ok) {
                          const errorData = await response.json();
                          console.error('API Error:', errorData);
                          throw new Error(errorData.error || t('customer.documents.errorLoadingDocuments'));
                        }
                        const data = await response.json();
                        return data.documents || [];
                      } catch (error) {
                        console.error('Error loading customer documents:', error);
                        toast.error(t('customer.documents.errorLoadingDocuments'));
                        return [];
                      }
                    }}
                    uploadDocument={async (file, extra) => {
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('document_type', extra?.document_type || 'general');
                      if (extra?.document_name) {
                        formData.append('document_name', extra.document_name);
                      }
                      if (extra?.description) {
                        formData.append('description', extra.description);
                      }

                      const response = await fetch(`/api/customers/${customerId}/documents`, {
                        method: 'POST',
                        body: formData,
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || t('customer.documents.uploadFailed'));
                      }

                      const result = await response.json();
                      toast.success(t('customer.documents.uploadSuccess'));
                      return result;
                    }}
                    deleteDocument={async (documentId) => {
                      const response = await fetch(`/api/customers/${customerId}/documents?documentId=${documentId}`, {
                        method: 'DELETE',
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || t('customer.documents.deleteFailed'));
                      }

                      const result = await response.json();
                      toast.success(t('customer.documents.deleteSuccess'));
                      return result;
                    }}
                    downloadDocument={async (documentId) => {
                      const response = await fetch(`/api/customers/${customerId}/documents/${documentId}/download`, {
                        method: 'GET',
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || t('customer.documents.downloadFailed'));
                      }

                      // Get the blob from the response
                      const blob = await response.blob();
                      
                      // Create a download link
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      
                      // Get filename from Content-Disposition header if available
                      const contentDisposition = response.headers.get('Content-Disposition');
                      let fileName = 'document';
                      if (contentDisposition) {
                        const matches = contentDisposition.match(/filename="?([^"]+)"?/);
                        if (matches && matches[1]) {
                          fileName = decodeURIComponent(matches[1]);
                        }
                      }
                      
                      link.download = fileName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      // Clean up the blob URL
                      window.URL.revokeObjectURL(url);
                      
                      toast.success(t('customer.documents.downloadStarted'));
                    }}
                    renderExtraControls={
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Document Type</label>
                        <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="license">License</SelectItem>
                            <SelectItem value="certificate">Certificate</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="commercial_registration">Commercial Registration</SelectItem>
                            <SelectItem value="tax_certificate">Tax Certificate</SelectItem>
                            <SelectItem value="vat_certificate">VAT Certificate</SelectItem>
                            <SelectItem value="bank_details">Bank Details</SelectItem>
                            <SelectItem value="credit_agreement">Credit Agreement</SelectItem>
                            <SelectItem value="purchase_order">P.O (Purchase Order)</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    }
                    getExtraUploadData={() => {
                      return {
                        document_type: selectedDocumentType || 'general',
                      };
                    }}
                  />
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
                 <span>{t('customer.sections.companyInfo')}</span>
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.companyName')}</label>
                 <p className="text-lg font-semibold">{customer.companyName || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.contactPerson')}</label>
                 <p className="text-lg">{customer.contactPerson || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.taxNumber')}</label>
                 <p className="text-sm font-mono">{customer.taxNumber || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.vatNumber')}</label>
                 <p className="text-sm font-mono">{customer.vatNumber || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.creditLimit')}</label>
                 <p className="text-lg font-semibold">{formatCurrency(customer.creditLimit)}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.paymentTerms')}</label>
                 <p className="text-lg">{customer.paymentTerms || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.customerType')}</label>
                 <p className="text-lg">{customer.customerType || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.customerGroup')}</label>
                 <p className="text-lg">{customer.customerGroup || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.territory')}</label>
                 <p className="text-lg">{customer.territory || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.salesPerson')}</label>
                 <p className="text-lg">{customer.salesPerson || t('customer.common.notAvailable')}</p>
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle className="flex items-center space-x-2">
                 <Mail className="h-5 w-5" />
                 <span>{t('customer.sections.contactInfo')}</span>
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.email')}</label>
                 <p className="text-lg">{customer.email || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.phone')}</label>
                 <p className="text-lg">{customer.phone || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.website')}</label>
                 <p className="text-lg">{customer.website || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.address')}</label>
                 <p className="text-sm">{customer.address || t('customer.common.notAvailable')}</p>
                 <p className="text-sm text-gray-500">
                   {customer.city || t('customer.common.notAvailable')}, {customer.state || t('customer.common.notAvailable')} {customer.country || t('customer.common.notAvailable')}
                 </p>
                 <p className="text-sm text-gray-500">
                   {t('customer.fields.postalCode')}: {customer.postalCode || t('customer.common.notAvailable')}
                 </p>
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle className="flex items-center space-x-2">
                 <DollarSign className="h-5 w-5" />
                 <span>{t('customer.sections.financialInfo')}</span>
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.currency')}</label>
                 <p className="text-lg font-semibold">{customer.currency || 'SAR'}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.defaultPriceList')}</label>
                 <p className="text-lg">{customer.defaultPriceList || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.language')}</label>
                 <p className="text-lg">{customer.language || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.notes')}</label>
                 <p className="text-sm">{customer.notes || t('customer.common.notAvailable')}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">{t('customer.fields.remarks')}</label>
                 <p className="text-sm">{customer.remarks || t('customer.common.notAvailable')}</p>
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle>{t('customer.sections.quickActions')}</CardTitle>
             </CardHeader>
             <CardContent className="space-y-2">
               <Button variant="outline" className="w-full justify-start">
                 <Package className="h-4 w-4 mr-2" />
                 {t('customer.actions.createRental')}
               </Button>
               <Button variant="outline" className="w-full justify-start">
                 <DollarSign className="h-4 w-4 mr-2" />
                 {t('customer.actions.createInvoice')}
               </Button>
               <Button variant="outline" className="w-full justify-start">
                 <FileText className="h-4 w-4 mr-2" />
                 {t('customer.actions.generateReport')}
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
