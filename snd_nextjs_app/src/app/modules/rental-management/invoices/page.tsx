"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  RefreshCw,
  Download,
  Printer,
  Filter,
  MoreHorizontal,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Mail,
  Clock,
  AlertCircle,
  CreditCard,
  Banknote,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { usePrint } from "@/hooks/use-print";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Customer {
  id: number;
  name: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
}

interface Rental {
  id: number;
  rental_number: string;
  customer: Customer;
}

interface Invoice {
  id: number;
  invoice_number: string;
  rental: Rental;
  amount: number;
  status: string;
  due_date: string;
  is_overdue: boolean;
  is_paid: boolean;
  paid_amount: number;
  outstanding_amount: number;
  payment_terms_days: number;
  tax_amount: number;
  discount_amount: number;
  subtotal: number;
  notes: string;
  created_at: string;
  updated_at: string;
  nextPossibleStates?: string[];
}

interface PaginatedResponse {
  data: Invoice[];
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { printRef, handlePrint } = usePrint({
    documentTitle: "Rental-Invoices-List",
    waitForImages: true,
    onPrintError: (error) => {
      console.error('Print error details:', error);
      // Continue with print even if there are image errors
    }
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        // Simulate API call with filters
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData = getMockInvoicesData(search, status, startDate, endDate, currentPage);
        setInvoices(mockData);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast.error('Failed to fetch invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [search, status, startDate, endDate, currentPage]);

  const getMockInvoicesData = (search: string = '', status: string = 'all', startDate: string = '', endDate: string = '', page: number = 1): PaginatedResponse => {
    const mockInvoices = [
      {
        id: 1,
        invoice_number: "INV-2024-001",
        rental: {
          id: 1,
          rental_number: "RENT-2024-001",
          customer: {
            id: 1,
            name: "ABC Construction Ltd",
            company_name: "ABC Construction Ltd",
            contact_person: "John Smith",
            email: "john@abcconstruction.com",
            phone: "+1-555-0123"
          }
        },
        amount: 15000.00,
        status: "partially_paid",
        due_date: "2024-02-14",
        is_overdue: false,
        is_paid: false,
        paid_amount: 5000.00,
        outstanding_amount: 10000.00,
        payment_terms_days: 30,
        tax_amount: 1214.29,
        discount_amount: 500.00,
        subtotal: 14285.71,
        notes: "Invoice for equipment rental",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T15:30:00Z",
        nextPossibleStates: ["send-reminder", "mark-paid", "extend-due-date"]
      },
      {
        id: 2,
        invoice_number: "INV-2024-002",
        rental: {
          id: 2,
          rental_number: "RENT-2024-002",
          customer: {
            id: 2,
            name: "XYZ Developers",
            company_name: "XYZ Developers",
            contact_person: "Jane Doe",
            email: "jane@xyzdevelopers.com",
            phone: "+1-555-0456"
          }
        },
        amount: 12400.00,
        status: "paid",
        due_date: "2024-01-31",
        is_overdue: false,
        is_paid: true,
        paid_amount: 12400.00,
        outstanding_amount: 0,
        payment_terms_days: 30,
        tax_amount: 971.43,
        discount_amount: 0,
        subtotal: 11428.57,
        notes: "Completed rental invoice",
        created_at: "2024-01-31T10:00:00Z",
        updated_at: "2024-02-01T14:20:00Z",
        nextPossibleStates: []
      },
      {
        id: 3,
        invoice_number: "INV-2024-003",
        rental: {
          id: 3,
          rental_number: "RENT-2024-003",
          customer: {
            id: 3,
            name: "City Projects Ltd",
            company_name: "City Projects Ltd",
            contact_person: "Bob Wilson",
            email: "bob@cityprojects.com",
            phone: "+1-555-0789"
          }
        },
        amount: 24800.00,
        status: "overdue",
        due_date: "2024-02-01",
        is_overdue: true,
        is_paid: false,
        paid_amount: 0,
        outstanding_amount: 24800.00,
        payment_terms_days: 30,
        tax_amount: 1942.86,
        discount_amount: 0,
        subtotal: 22857.14,
        notes: "Overdue invoice - requires immediate attention",
        created_at: "2024-02-01T10:00:00Z",
        updated_at: "2024-02-01T10:00:00Z",
        nextPossibleStates: ["send-reminder", "mark-paid", "extend-due-date", "send-collection"]
      }
    ];

    // Filter invoices based on search and status
    let filteredInvoices = mockInvoices;

    if (search) {
      filteredInvoices = filteredInvoices.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        invoice.rental.rental_number.toLowerCase().includes(search.toLowerCase()) ||
        invoice.rental.customer.company_name.toLowerCase().includes(search.toLowerCase()) ||
        invoice.rental.customer.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== 'all') {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status);
    }

    if (startDate) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.created_at >= startDate);
    }

    if (endDate) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.due_date <= endDate);
    }

    // Pagination
    const perPage = 10;
    const total = filteredInvoices.length;
    const lastPage = Math.ceil(total / perPage);
    const from = (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);
    const paginatedInvoices = filteredInvoices.slice((page - 1) * perPage, page * perPage);

    return {
      data: paginatedInvoices,
      current_page: page,
      last_page: lastPage,
      per_page: perPage,
      total,
      from,
      to,
      next_page_url: page < lastPage ? `?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `?page=${page - 1}` : null,
      first_page_url: "?page=1",
      last_page_url: `?page=${lastPage}`,
      path: "/modules/rental-management/invoices",
      links: []
    };
  };

  const handleDelete = async (id: number) => {
    try {
      toast.loading('Deleting invoice...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Invoice deleted successfully');
      // Refresh the list
      const mockData = getMockInvoicesData(search, status, startDate, endDate, currentPage);
      setInvoices(mockData);
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>;
      case "partially_paid":
        return <Badge className="bg-yellow-100 text-yellow-800">Partially Paid</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
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
    const mockData = getMockInvoicesData(search, status, startDate, endDate, currentPage);
    setInvoices(mockData);
    toast.success('Invoices refreshed');
  };

  const handleWorkflowAction = async (invoiceId: number, action: string) => {
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
        <div className="text-lg">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="p-6" ref={printRef}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            Manage rental invoices and payment tracking
          </p>
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
          <Link href="/modules/rental-management/invoices/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
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
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Showing {invoices?.from || 0} to {invoices?.to || 0} of {invoices?.total || 0} invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Rental #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices?.data.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>
                    <Link href={`/modules/rental-management/${invoice.rental.id}`} className="text-blue-600 hover:underline">
                      {invoice.rental.rental_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.rental.customer.company_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.rental.customer.contact_person}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(invoice.amount)}
                  </TableCell>
                  <TableCell>
                    <span className={invoice.paid_amount > 0 ? "text-green-600" : "text-gray-500"}>
                      {formatCurrency(invoice.paid_amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={invoice.outstanding_amount > 0 ? "text-red-600" : "text-green-600"}>
                      {formatCurrency(invoice.outstanding_amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center space-x-1 ${invoice.is_overdue ? 'text-red-600' : ''}`}>
                      <span>{formatDate(invoice.due_date)}</span>
                      {invoice.is_overdue && <AlertCircle className="h-4 w-4" />}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/modules/rental-management/invoices/${invoice.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/modules/rental-management/invoices/${invoice.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        {invoice.nextPossibleStates?.includes('mark-paid') && (
                          <DropdownMenuItem onClick={() => handleWorkflowAction(invoice.id, 'mark-paid')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                        {invoice.nextPossibleStates?.includes('send-reminder') && (
                          <DropdownMenuItem onClick={() => handleWorkflowAction(invoice.id, 'send-reminder')}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Reminder
                          </DropdownMenuItem>
                        )}
                        {invoice.nextPossibleStates?.includes('extend-due-date') && (
                          <DropdownMenuItem onClick={() => handleWorkflowAction(invoice.id, 'extend-due-date')}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Extend Due Date
                          </DropdownMenuItem>
                        )}
                        {invoice.nextPossibleStates?.includes('send-collection') && (
                          <DropdownMenuItem onClick={() => handleWorkflowAction(invoice.id, 'send-collection')}>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Send to Collection
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {invoices && invoices.last_page > 1 && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * invoices.per_page) + 1} to{" "}
                  {Math.min(currentPage * invoices.per_page, invoices.total)} of{" "}
                  {invoices.total} results
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
                        {currentPage > 3 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                      </>
                    )}

                    {/* Current page and surrounding pages */}
                    {(() => {
                      const pages = [];
                      const startPage = Math.max(1, currentPage - 1);
                      const endPage = Math.min(invoices.last_page, currentPage + 1);

                      for (let page = startPage; page <= endPage; page++) {
                        pages.push(page);
                      }

                      return pages.map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ));
                    })()}

                    {/* Last page */}
                    {currentPage < invoices.last_page - 1 && (
                      <>
                        {currentPage < invoices.last_page - 2 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(invoices.last_page)}
                          className="w-8 h-8 p-0"
                        >
                          {invoices.last_page}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(invoices.last_page, currentPage + 1))}
                    disabled={currentPage === invoices.last_page}
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
  );
}
