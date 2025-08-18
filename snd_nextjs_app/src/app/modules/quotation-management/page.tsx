'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { usePrint } from '@/hooks/use-print';
import {
  Calendar,
  Download,
  Edit,
  Eye,
  FileText,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
// i18n refactor: All user-facing strings now use useTranslation('quotation')
import { useTranslation } from 'react-i18next';

interface Customer {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
}

interface QuotationItem {
  id: number;
  equipment_id: number;
  equipment: {
    id: number;
    name: string;
    model: string;
  };
  quantity: number;
  rate: number;
  rate_type: string;
  total_amount: number;
}

interface Quotation {
  id: number;
  quotation_number: string;
  customer: Customer;
  issue_date: string;
  valid_until: string;
  status: string;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
  quotationItems: QuotationItem[];
}

interface PaginatedResponse {
  data: Quotation[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  first_page_url: string;
  last_page_url: string;
  path: string;
  links: any[];
}

export default function QuotationManagementPage() {
  const { t } = useTranslation('quotation');
  const [quotations, setQuotations] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { printRef, handlePrint } = usePrint({
    documentTitle: 'Quotation-List',
    waitForImages: true,
    onPrintError: error => {
      console.error('Print error details:', error);
      // Continue with print even if there are image errors
    },
  });

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          ...(search && { search }),
          ...(status !== 'all' && { status }),
          ...(startDate && { start_date: startDate }),
          ...(endDate && { end_date: endDate }),
        });

        const response = await fetch(`/api/quotations?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quotations');
        }
        const data = await response.json();
        setQuotations(data);
      } catch (error) {
        console.error('Error fetching quotations:', error);
        toast.error('Failed to load quotations');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, [search, status, startDate, endDate, currentPage]);

  const handleDelete = async (id: number) => {
    try {
      toast.loading('Deleting quotation...');
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete quotation');
      }

      toast.success('Quotation deleted successfully');
      // Refresh the list
      window.location.reload();
    } catch (error) {
      toast.error('Failed to delete quotation');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">{t('status.draft')}</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">{t('status.sent')}</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">{t('status.approved')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">{t('status.rejected')}</Badge>;
      case 'expired':
        return <Badge className="bg-orange-100 text-orange-800">{t('status.expired')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" ref={printRef}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('quotation_management.title')}</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('quotation_management.refresh')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('quotation_management.export')}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t('quotation_management.print')}
          </Button>
          <Link href="/modules/quotation-management/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('quotation_management.create_quotation')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('quotation_management.search_placeholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('quotation_management.filter_status_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('quotation_management.all_status')}</SelectItem>
              <SelectItem value="draft">{t('quotation_management.status.draft')}</SelectItem>
              <SelectItem value="sent">{t('quotation_management.status.sent')}</SelectItem>
              <SelectItem value="approved">{t('quotation_management.status.approved')}</SelectItem>
              <SelectItem value="rejected">{t('quotation_management.status.rejected')}</SelectItem>
              <SelectItem value="expired">{t('quotation_management.status.expired')}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder={t('quotation_management.from_date_placeholder')}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full sm:w-40"
          />
          <Input
            type="date"
            placeholder={t('quotation_management.to_date_placeholder')}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('quotation_management.quotations')}</CardTitle>
              <CardDescription>
                {t('quotation_management.manage_quotations_description')}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {t('quotation_management.showing_quotations', {
                  from: quotations?.from || 0,
                  to: quotations?.to || 0,
                  total: quotations?.total || 0,
                })}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('quotation_management.quotation_number')}</TableHead>
                <TableHead>{t('quotation_management.customer')}</TableHead>
                <TableHead>{t('quotation_management.status')}</TableHead>
                <TableHead>{t('quotation_management.issue_date')}</TableHead>
                <TableHead>{t('quotation_management.valid_until')}</TableHead>
                <TableHead>{t('quotation_management.total_amount')}</TableHead>
                <TableHead>{t('quotation_management.items')}</TableHead>
                <TableHead className="text-right">{t('quotation_management.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations?.data.map(quotation => (
                <TableRow key={quotation.id}>
                  <TableCell className="font-mono font-medium">
                    {quotation.quotation_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{quotation.customer.company_name}</div>
                      <div className="text-sm text-gray-500">
                        {quotation.customer.contact_person}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(quotation.issue_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(quotation.valid_until)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(quotation.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {quotation.quotationItems.length} {t('quotation_management.items_count')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link href={`/modules/quotation-management/${quotation.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/modules/quotation-management/${quotation.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/modules/quotation-management/${quotation.id}/print`}>
                        <Button variant="ghost" size="sm">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/modules/quotation-management/${quotation.id}/pdf`}>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(quotation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {quotations && quotations.last_page > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                {t('quotation_management.showing_results', {
                  from: quotations.from,
                  to: quotations.to,
                  total: quotations.total,
                })}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!quotations.prev_page_url}
                  onClick={() => setCurrentPage(quotations.current_page - 1)}
                >
                  {t('quotation_management.previous')}
                </Button>
                <span className="text-sm">
                  {t('quotation_management.page_of', {
                    current: quotations.current_page,
                    total: quotations.last_page,
                  })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!quotations.next_page_url}
                  onClick={() => setCurrentPage(quotations.current_page + 1)}
                >
                  {t('quotation_management.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
