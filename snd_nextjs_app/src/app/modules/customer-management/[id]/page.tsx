"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Edit,
  Mail,
  Building,
  User,
  Package,
  DollarSign,
  FileText,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  company_name: string;
  contact_person: string;
  website: string;
  tax_number: string;
  credit_limit: number;
  payment_terms: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Rental {
  id: string;
  rental_number: string;
  equipment_name: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  payment_status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  rental_number: string;
  amount: number;
  due_date: string;
  status: string;
  created_at: string;
}

// Mock data
const mockCustomer: Customer = {
  id: "1",
  name: "John Smith",
  email: "john.smith@construction.com",
  phone: "+1-555-0123",
  address: "123 Construction Ave",
  city: "New York",
  state: "NY",
  country: "USA",
  company_name: "Smith Construction Co.",
  contact_person: "John Smith",
  website: "www.smithconstruction.com",
  tax_number: "TAX-123456789",
  credit_limit: 50000.00,
  payment_terms: "Net 30",
  is_active: true,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z"
};

const mockRentals: Rental[] = [
  {
    id: "1",
    rental_number: "RENT-2024-001",
    equipment_name: "Excavator CAT 320",
    start_date: "2024-01-15",
    end_date: "2024-01-25",
    total_amount: 5000.00,
    status: "Active",
    payment_status: "Partially Paid"
  },
  {
    id: "2",
    rental_number: "RENT-2024-002",
    equipment_name: "Bulldozer CAT D6",
    start_date: "2024-01-20",
    end_date: "2024-01-30",
    total_amount: 3500.00,
    status: "Completed",
    payment_status: "Paid"
  }
];

const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoice_number: "INV-2024-001",
    rental_number: "RENT-2024-001",
    amount: 5000.00,
    due_date: "2024-02-15",
    status: "Partially Paid",
    created_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    invoice_number: "INV-2024-002",
    rental_number: "RENT-2024-002",
    amount: 3500.00,
    due_date: "2024-02-20",
    status: "Paid",
    created_at: "2024-01-20T10:00:00Z"
  }
];

function CustomerDetailClient({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCustomer(mockCustomer);
      setRentals(mockRentals);
      setInvoices(mockInvoices);
      setLoading(false);
    }, 500);
  }, [customerId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "Completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "Cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "Partially Paid":
        return <Badge className="bg-yellow-100 text-yellow-800">Partially Paid</Badge>;
      case "Overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "Partially Paid":
        return <Badge className="bg-yellow-100 text-yellow-800">Partially Paid</Badge>;
      case "Overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
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

  const calculateTotalRentals = () => {
    return rentals.reduce((total, rental) => total + rental.total_amount, 0);
  };

  const calculateTotalInvoices = () => {
    return invoices.reduce((total, invoice) => total + invoice.amount, 0);
  };

  const calculateOutstandingAmount = () => {
    return calculateTotalInvoices() - calculateTotalRentals();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading customer details...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Customer not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/modules/customer-management">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Customer Details</h1>
            <p className="text-gray-500">{customer.name}</p>
          </div>
        </div>
        <Link href={`/modules/customer-management/${customer.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Customer
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Customer Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Customer Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer Name</label>
                  <p className="text-lg font-semibold">{customer.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    {customer.is_active ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Company</label>
                  <p className="text-lg">{customer.company_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Person</label>
                  <p className="text-lg">{customer.contact_person}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{customer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-lg">{customer.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Website</label>
                  <p className="text-lg">{customer.website}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tax Number</label>
                  <p className="text-lg font-mono">{customer.tax_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Credit Limit</label>
                  <p className="text-lg">{formatCurrency(customer.credit_limit)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                  <p className="text-lg">{customer.payment_terms}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-lg">{customer.address}</p>
                <p className="text-sm text-gray-500">{customer.city}, {customer.state} {customer.country}</p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="rentals" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rentals">Rentals</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="rentals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Rental History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Rentals</p>
                      <p className="text-2xl font-bold text-blue-600">{rentals.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotalRentals())}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Active Rentals</p>
                      <p className="text-2xl font-bold text-purple-600">{rentals.filter(r => r.status === "Active").length}</p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rental #</TableHead>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rentals.map((rental) => (
                        <TableRow key={rental.id}>
                          <TableCell className="font-mono">{rental.rental_number}</TableCell>
                          <TableCell>{rental.equipment_name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(rental.start_date)} - {formatDate(rental.end_date)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(rental.total_amount)}</TableCell>
                          <TableCell>{getStatusBadge(rental.status)}</TableCell>
                          <TableCell>{getPaymentStatusBadge(rental.payment_status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Invoice History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Invoices</p>
                      <p className="text-2xl font-bold text-green-600">{invoices.length}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculateTotalInvoices())}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Outstanding</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(calculateOutstandingAmount())}</p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Rental #</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                          <TableCell className="font-mono">{invoice.rental_number}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{formatDate(invoice.due_date)}</TableCell>
                          <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Documents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No documents uploaded yet</p>
                    <Button variant="outline" className="mt-4">
                      Upload Document
                    </Button>
                  </div>
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
                <p className="text-lg font-semibold">{customer.company_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Person</label>
                <p className="text-lg">{customer.contact_person}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tax Number</label>
                <p className="text-sm font-mono">{customer.tax_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Credit Limit</label>
                <p className="text-lg font-semibold">{formatCurrency(customer.credit_limit)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                <p className="text-lg">{customer.payment_terms}</p>
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
                <p className="text-lg">{customer.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-lg">{customer.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Website</label>
                <p className="text-lg">{customer.website}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-sm">{customer.address}</p>
                <p className="text-sm text-gray-500">{customer.city}, {customer.state} {customer.country}</p>
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

export default function CustomerDetailPageWrapper({ params }: { params: Promise<{ id: string }> }) {
  // This wrapper is a server component
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    params.then(({ id }) => setId(id));
  }, [params]);
  if (!id) return null;
  return <CustomerDetailClient customerId={id} />;
}
