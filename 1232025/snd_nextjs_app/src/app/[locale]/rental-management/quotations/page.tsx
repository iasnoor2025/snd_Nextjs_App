'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Mail,
  MoreHorizontal,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useParams } from 'next/navigation';
interface Customer {
  id: number;
  name: string;
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
    manufacturer: string;
  };
  rate: number;
  rate_type: string;
  days: number;
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
  tax_percentage: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  terms_conditions: string;
  notes: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  nextPossibleStates?: string[];
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
  links: Array<{ url: string | null; label: string; active: boolean }>;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { printRef, handlePrint } = usePrint({
    documentTitle: 'Rental-Quotations-List',
    waitForImages: true,
    onPrintError: error => {
      // Continue with print even if there are image errors
    },
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setLoading(true);
        // Simulate API call with filters
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData = getMockQuotationsData(search, status, startDate, endDate, currentPage);
        setQuotations(mockData);
      } catch (error) {
        toast.error('Failed to fetch quotations');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, [search, status, startDate, endDate, currentPage]);

  const getMockQuotationsData = (
    search: string = '',
    status: string = 'all',
    startDate: string = '',
    endDate: string = '',
    page: number = 1
  ): PaginatedResponse => {
    const mockQuotations = [
      {
        id: 1,
        quotation_number: 'QUOT-2024-001',
        customer: {
          id: 1,
          name: 'ABC Construction Ltd',
          company_name: 'ABC Construction Ltd',
          contact_person: 'John Smith',
          email: 'john@abcconstruction.com',
          phone: '+1-555-0123',
        },
        issue_date: '2024-01-08',
        valid_until: '2024-01-22',
        status: 'pending',
        subtotal: 14285.71,
        tax_percentage: 8.5,
        tax_amount: 1214.29,
        discount_amount: 500.0,
        total_amount: 15000.0,
        terms_conditions: 'Standard rental terms apply',
        notes: 'Equipment needed for downtown construction project',
        created_by: 1,
        created_at: '2024-01-08T09:00:00Z',
        updated_at: '2024-01-08T09:00:00Z',
        nextPossibleStates: ['approve', 'reject', 'send-email'],
        quotationItems: [
          {
            id: 1,
            equipment_id: 1,
            equipment: {
              id: 1,
              name: 'Excavator CAT 320',
              model: 'CAT 320',
              manufacturer: 'Caterpillar',
            },
            rate: 500.0,
            rate_type: 'daily',
            days: 30,
            total_amount: 15000.0,
          },
        ],
      },
      {
        id: 2,
        quotation_number: 'QUOT-2024-002',
        customer: {
          id: 2,
          name: 'XYZ Developers',
          company_name: 'XYZ Developers',
          contact_person: 'Jane Doe',
          email: 'jane@xyzdevelopers.com',
          phone: '+1-555-0456',
        },
        issue_date: '2024-01-10',
        valid_until: '2024-01-24',
        status: 'approved',
        subtotal: 11428.57,
        tax_percentage: 8.5,
        tax_amount: 971.43,
        discount_amount: 0,
        total_amount: 12400.0,
        terms_conditions: 'Standard rental terms apply',
        notes: 'Residential development project',
        created_by: 1,
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-12T14:30:00Z',
        nextPossibleStates: ['convert-to-rental', 'send-email'],
        quotationItems: [
          {
            id: 2,
            equipment_id: 2,
            equipment: {
              id: 2,
              name: 'Bulldozer Komatsu D65',
              model: 'D65',
              manufacturer: 'Komatsu',
            },
            rate: 400.0,
            rate_type: 'daily',
            days: 31,
            total_amount: 12400.0,
          },
        ],
      },
      {
        id: 3,
        quotation_number: 'QUOT-2024-003',
        customer: {
          id: 3,
          name: 'City Projects Ltd',
          company_name: 'City Projects Ltd',
          contact_person: 'Bob Wilson',
          email: 'bob@cityprojects.com',
          phone: '+1-555-0789',
        },
        issue_date: '2024-01-12',
        valid_until: '2024-01-26',
        status: 'rejected',
        subtotal: 22857.14,
        tax_percentage: 8.5,
        tax_amount: 1942.86,
        discount_amount: 0,
        total_amount: 24800.0,
        terms_conditions: 'Standard rental terms apply',
        notes: 'Municipal infrastructure project',
        created_by: 1,
        created_at: '2024-01-12T11:00:00Z',
        updated_at: '2024-01-15T16:45:00Z',
        nextPossibleStates: ['resubmit', 'archive'],
        quotationItems: [
          {
            id: 3,
            equipment_id: 3,
            equipment: {
              id: 3,
              name: 'Crane Liebherr LTM 1100',
              model: 'LTM 1100',
              manufacturer: 'Liebherr',
            },
            rate: 800.0,
            rate_type: 'daily',
            days: 31,
            total_amount: 24800.0,
          },
        ],
      },
    ];

    // Filter quotations based on search and status
    let filteredQuotations = mockQuotations;

    if (search) {
      filteredQuotations = filteredQuotations.filter(
        quotation =>
          quotation.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
          quotation.customer.company_name.toLowerCase().includes(search.toLowerCase()) ||
          quotation.customer.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== 'all') {
      filteredQuotations = filteredQuotations.filter(quotation => quotation.status === status);
    }

    if (startDate) {
      filteredQuotations = filteredQuotations.filter(quotation => quotation.issue_date >= startDate);
    }

    if (endDate) {
      filteredQuotations = filteredQuotations.filter(quotation => quotation.valid_until <= endDate);
    }

    // Pagination
    const perPage = 10;
    const total = filteredQuotations.length;
    const lastPage = Math.ceil(total / perPage);
    const from = (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);
    const paginatedQuotations = filteredQuotations.slice((page - 1) * perPage, page * perPage);

    return {
      data: paginatedQuotations,
      current_page: page,
      last_page: lastPage,
      per_page: perPage,
      total,
      from,
      to,
      next_page_url: page < lastPage ? `?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `?page=${page - 1}` : null,
      first_page_url: '?page=1',
      last_page_url: `?page=${lastPage}`,
      path: '/api/quotations',
      links: [],
    };
  };

  const handleDelete = async (id: number) => {
    try {
      toast.loading('Deleting quotation...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Quotation deleted successfully');
      const mockData = getMockQuotationsData(search, status, startDate, endDate, currentPage);
      setQuotations(mockData);
    } catch (error) {
      toast.error('Failed to delete quotation');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      case 'converted':
        return <Badge className="bg-blue-100 text-blue-800">Converted</Badge>;
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRefresh = () => {
    const mockData = getMockQuotationsData(search, status, startDate, endDate, currentPage);
    setQuotations(mockData);
    toast.success('Quotations refreshed');
  };

  const handleWorkflowAction = async (quotationId: number, action: string) => {
    try {
      toast.loading(`Processing ${action}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${action} completed successfully`);
      handleRefresh();
    } catch (error) {
      toast.error(`Failed to ${action}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading quotations...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Print container - only visible when printing */}
      <div ref={printRef} className="hidden print:block">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Quotations</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Quotations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Total Amount</TableHead>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main content - visible normally, hidden when printing */}
      <div className="block print:hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Quotations</h1>
            <p className="text-muted-foreground">Manage equipment rental quotations and proposals</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Link href={`/${locale}/rental-management/quotations/create`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Quotation
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? <XCircle className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Search</label>
                  <Input
                    placeholder="Search quotations..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">From Date</label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">To Date</label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Quotations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Quotations</CardTitle>
            <CardDescription>
              Showing {quotations?.from || 0} to {quotations?.to || 0} of {quotations?.total || 0}{' '}
              quotations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Actions</TableHead>
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
                        <div className="text-sm text-gray-500">{quotation.customer.contact_person}</div>
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
                      <div className="flex items-center space-x-2">
                        <Link href={`/${locale}/rental-management/quotations/${quotation.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/${locale}/rental-management/quotations/${quotation.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleWorkflowAction(quotation.id, 'approve')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleWorkflowAction(quotation.id, 'reject')}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleWorkflowAction(quotation.id, 'send-email')}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(quotation.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {quotations && quotations.last_page > 1 && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * quotations.per_page + 1} to{' '}
                    {Math.min(currentPage * quotations.per_page, quotations.total)} of{' '}
                    {quotations.total} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {/* First page */}
                      {currentPage > 2 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            className="w-8 h-8 p-0"
                          >
                            1
                          </Button>
                          {currentPage > 3 && <span className="px-2 text-muted-foreground">...</span>}
                        </>
                      )}

                      {/* Current page and surrounding pages */}
                      {(() => {
                        const pages: number[] = [];
                        const startPage = Math.max(1, currentPage - 1);
                        const endPage = Math.min(quotations.last_page, currentPage + 1);

                        for (let page = startPage; page <= endPage; page++) {
                          pages.push(page);
                        }

                        return pages.map(page => (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ));
                      })()}

                      {/* Last page */}
                      {currentPage < quotations.last_page - 1 && (
                        <>
                          {currentPage < quotations.last_page - 2 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(quotations.last_page)}
                            className="w-8 h-8 p-0"
                          >
                            {quotations.last_page}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(quotations.last_page, currentPage + 1))}
                      disabled={currentPage === quotations.last_page}
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
      </div>
    </div>
  );
}
