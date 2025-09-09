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
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  Package,
  Plus,
  Printer,
  Send,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Types based on Laravel data structure
interface Customer {
  id: number;
  name: string;
  companyName: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
}

interface Equipment {
  id: number;
  name: string;
  model: string;
  manufacturer: string;
  serial_number: string;
  status: string;
}

interface Employee {
  id: number;
  name: string;
  employee_id: string;
  first_name: string;
  last_name: string;
}

interface QuotationItem {
  id: number;
  equipment_id: number;
  equipment: Equipment;
  operator_id?: number;
  operator?: Employee;
  description?: string;
  quantity: number;
  rate: number;
  rate_type: string;
  total_amount: number;
}

interface QuotationHistory {
  id: number;
  action: string;
  from_status?: string;
  to_status: string;
  notes?: string;
  user: {
    id: number;
    name: string;
  };
  created_at: string;
}

interface Quotation {
  id: number;
  quotation_number: string;
  customer_id: number;
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
  terms_and_conditions: string;
  created_by: number;
  rental_id?: number;
  approved_at?: string;
  approved_by?: number;
  is_separate: boolean;
  created_at: string;
  updated_at: string;
  quotationItems: QuotationItem[];
}

interface ApiResponse {
  quotation: Quotation;
  quotationItems: {
    data: QuotationItem[];
    total: number;
  };
  canApprove: boolean;
  canReject: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

function QuotationDetailClient({ quotationId }: { quotationId: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotationData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/quotations/${quotationId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quotation data');
        }
        const quotationData = await response.json();
        setData(quotationData);
      } catch {
        // Fallback to mock data for development
        setData(getMockData());
      } finally {
        setLoading(false);
      }
    };

    fetchQuotationData();
  }, [quotationId]);

  const getMockData = (): ApiResponse => {
    return {
      quotation: {
        id: parseInt(quotationId),
        quotation_number: `QUOT-2024-${quotationId.padStart(3, '0')}`,
        customer_id: 1,
        customer: {
          id: 1,
          name: 'ABC Construction Ltd',
          companyName: 'ABC Construction Ltd',
          contactPerson: 'John Smith',
          email: 'john@abcconstruction.com',
          phone: '+1-555-0123',
        },
        issue_date: '2024-01-15',
        valid_until: '2024-02-15',
        status: 'sent',
        subtotal: 15000.0,
        discount_percentage: 5.0,
        discount_amount: 750.0,
        tax_percentage: 8.5,
        tax_amount: 1275.0,
        total_amount: 15525.0,
        notes:
          'Equipment quotation for downtown construction project. Includes operator and delivery.',
        terms_and_conditions: 'Standard terms and conditions apply. Payment terms: 30 days net.',
        created_by: 1,
        is_separate: true,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        quotationItems: [
          {
            id: 1,
            equipment_id: 1,
            equipment: {
              id: 1,
              name: 'Excavator CAT 320',
              model: 'CAT 320',
              manufacturer: 'Caterpillar',
              serial_number: 'CAT320-2024-001',
              status: 'active',
            },
            operator_id: 1,
            operator: {
              id: 1,
              name: 'Mike Johnson',
              employee_id: 'EMP001',
              first_name: 'Mike',
              last_name: 'Johnson',
            },
            description: 'Excavator with operator for excavation work',
            quantity: 1,
            rate: 500.0,
            rate_type: 'daily',
            total_amount: 15000.0,
          },
        ],
      },
      quotationItems: {
        data: [
          {
            id: 1,
            equipment_id: 1,
            equipment: {
              id: 1,
              name: 'Excavator CAT 320',
              model: 'CAT 320',
              manufacturer: 'Caterpillar',
              serial_number: 'CAT320-2024-001',
              status: 'active',
            },
            operator_id: 1,
            operator: {
              id: 1,
              name: 'Mike Johnson',
              employee_id: 'EMP001',
              first_name: 'Mike',
              last_name: 'Johnson',
            },
            description: 'Excavator with operator for excavation work',
            quantity: 1,
            rate: 500.0,
            rate_type: 'daily',
            total_amount: 15000.0,
          },
        ],
        total: 1,
      },
      canApprove: true,
      canReject: true,
      canEdit: true,
      canDelete: true,
    };
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
    };
    return (
      <Badge
        className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
      >
        {status}
      </Badge>
    );
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleAction = async (action: string) => {
    try {
      toast.loading(`Processing ${action}...`);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${action} completed successfully`);
    } catch {
      toast.error(`Failed to ${action}`);
    }
  };

  const handleApprove = async () => {
    try {
      toast.loading('Approving quotation...');
      const response = await fetch(`/api/quotations/${quotationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve quotation');
      }

      toast.success('Quotation approved successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to approve quotation');
    }
  };

  const handleReject = async () => {
    try {
      toast.loading('Rejecting quotation...');
      const response = await fetch(`/api/quotations/${quotationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject quotation');
      }

      toast.success('Quotation rejected successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to reject quotation');
    }
  };

  const handleSendEmail = async () => {
    try {
      toast.loading('Sending quotation...');
      const response = await fetch(`/api/quotations/${quotationId}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send quotation');
      }

      toast.success('Quotation sent successfully');
    } catch (error) {
      toast.error('Failed to send quotation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading quotation details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading quotation details</div>
      </div>
    );
  }

  const { quotation, quotationItems, canApprove, canReject, canEdit, canDelete } = data;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/modules/quotation-management">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotations
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Quotation Details</h1>
            <p className="text-gray-500">Quotation #{quotation.quotation_number}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Link href={`/modules/quotation-management/${quotation.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Quotation
              </Button>
            </Link>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Quotation Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Quotation Information</span>
                {getStatusBadge(quotation.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Quotation Number</label>
                  <p className="text-lg font-semibold">{quotation.quotation_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="text-lg">{quotation.customer.companyName || quotation.customer.name}</p>
                  <p className="text-sm text-gray-500">{quotation.customer.contactPerson}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Issue Date</label>
                  <p className="text-lg">{formatDate(quotation.issue_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Valid Until</label>
                  <p className="text-lg">{formatDate(quotation.valid_until)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subtotal</label>
                  <p className="text-lg">{formatCurrency(quotation.subtotal)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Discount</label>
                  <p className="text-lg">
                    {quotation.discount_percentage}% ({formatCurrency(quotation.discount_amount)})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tax</label>
                  <p className="text-lg">
                    {quotation.tax_percentage}% ({formatCurrency(quotation.tax_amount)})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Amount</label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(quotation.total_amount)}
                  </p>
                </div>
              </div>
              {quotation.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">{quotation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="items">Quotation Items</TabsTrigger>
              <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Quotation Items</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Rate Type</TableHead>
                        <TableHead>Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotationItems.data.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.equipment.name}</div>
                              <div className="text-sm text-gray-500">{item.equipment.model}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.operator ? (
                              <div>
                                <div className="font-medium">{item.operator.name}</div>
                                <div className="text-sm text-gray-500">
                                  {item.operator.employee_id}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">No operator</span>
                            )}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.rate)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.rate_type}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(item.total_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Terms & Conditions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-md">
                      {quotation.terms_and_conditions}
                    </div>
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
                <User className="h-5 w-5" />
                <span>Customer Info</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Company</label>
                <p className="text-lg font-semibold">{quotation.customer.companyName || quotation.customer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Person</label>
                <p className="text-lg">{quotation.customer.contactPerson}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm">{quotation.customer.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-sm">{quotation.customer.phone}</p>
              </div>
              <Button variant="outline" className="w-full">
                View Customer Details
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canApprove && quotation.status === 'sent' && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-green-600"
                  onClick={handleApprove}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Quotation
                </Button>
              )}
              {canReject && quotation.status === 'sent' && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600"
                  onClick={handleReject}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Quotation
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" onClick={handleSendEmail}>
                <Send className="h-4 w-4 mr-2" />
                Send by Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Printer className="h-4 w-4 mr-2" />
                Print Quotation
              </Button>
              {quotation.status === 'approved' && (
                <Button variant="outline" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  Convert to Rental
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quotation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(quotation.subtotal)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Discount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(quotation.discount_amount)}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tax</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(quotation.tax_amount)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(quotation.total_amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function QuotationDetailPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => setId(id));
  }, [params]);

  if (!id) return null;

  return <QuotationDetailClient quotationId={id} />;
}
