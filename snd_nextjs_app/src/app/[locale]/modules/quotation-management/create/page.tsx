'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Package,
  Plus,
  Save,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
  daily_rate: number;
  hourly_rate: number;
  weekly_rate: number;
  monthly_rate: number;
}

interface Employee {
  id: number;
  name: string;
  employee_id: string;
  is_operator: boolean;
  is_driver: boolean;
}

interface QuotationItem {
  id?: number;
  equipment_id: number;
  equipment?: Equipment;
  operator_id?: number;
  operator?: Employee;
  description?: string;
  quantity: number;
  rate: number;
  rate_type: string;
  total_amount: number;
}

interface FormData {
  customer_id: number;
  quotation_number: string;
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
  quotation_items: QuotationItem[];
}

export default function CreateQuotationPage() {
  const [formData, setFormData] = useState<FormData>({
    customer_id: 0,
    quotation_number: '',
    issue_date: '',
    valid_until: '',
    status: 'draft',
    subtotal: 0,
    discount_percentage: 0,
    discount_amount: 0,
    tax_percentage: 8.5,
    tax_amount: 0,
    total_amount: 0,
    notes: '',
    terms_and_conditions: 'Standard terms and conditions apply. Payment terms: 30 days net.',
    quotation_items: [],
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [operators, setOperators] = useState<Employee[]>([]);
  const [drivers, setDrivers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextQuotationNumber, setNextQuotationNumber] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch customers
        const customersResponse = await fetch('/api/customers?limit=1000'); // Get all customers
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          setCustomers(customersData.customers || []); // Fix: use customers instead of data
        }

        // Fetch equipment
        const equipmentResponse = await fetch('/api/equipment');
        if (equipmentResponse.ok) {
          const equipmentData = await equipmentResponse.json();
          setEquipment(equipmentData.data || []);
        }

        // Fetch operators and drivers
        const employeesResponse = await fetch('/api/employees');
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          const operators = employeesData.data?.filter((emp: Employee) => emp.is_operator) || [];
          const drivers = employeesData.data?.filter((emp: Employee) => emp.is_driver) || [];
          setOperators(operators);
          setDrivers(drivers);
        }

        // Generate next quotation number
        setNextQuotationNumber(`QUOT-2024-${Math.floor(Math.random() * 1000) + 1}`);
      } catch (error) {
        
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addQuotationItem = () => {
    const newItem: QuotationItem = {
      equipment_id: 0,
      quantity: 1,
      rate: 0,
      rate_type: 'daily',
      total_amount: 0,
    };
    setFormData(prev => ({
      ...prev,
      quotation_items: [...prev.quotation_items, newItem],
    }));
  };

  const removeQuotationItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      quotation_items: prev.quotation_items.filter((_, i) => i !== index),
    }));
  };

  const updateQuotationItem = (index: number, field: keyof QuotationItem, value: any) => {
    setFormData(prev => {
      const updatedItems = [...prev.quotation_items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };

      // Recalculate total amount for this item
      if (field === 'quantity' || field === 'rate') {
        const item = updatedItems[index];
        updatedItems[index].total_amount = item.quantity * item.rate;
      }

      return { ...prev, quotation_items: updatedItems };
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.quotation_items.reduce((sum, item) => sum + item.total_amount, 0);
    const discountAmount = subtotal * (formData.discount_percentage / 100);
    const taxAmount = (subtotal - discountAmount) * (formData.tax_percentage / 100);
    const total = subtotal - discountAmount + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: total,
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.quotation_items, formData.discount_percentage, formData.tax_percentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.quotation_items.length === 0) {
      toast.error('Please add at least one quotation item');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create quotation');
      }

      const result = await response.json();
      toast.success('Quotation created successfully');

      // Redirect to the new quotation
      window.location.href = `/modules/quotation-management/${result.data.id}`;
    } catch (error) {
      
      toast.error('Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading form data...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/modules/quotation-management">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotations
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create Quotation</h1>
            <p className="text-muted-foreground">Create a new quotation for equipment rental</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quotation_number">Quotation Number</Label>
                    <Input
                      id="quotation_number"
                      value={formData.quotation_number}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, quotation_number: e.target.value }))
                      }
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_id">Customer</Label>
                    <Select
                      value={formData.customer_id.toString()}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, customer_id: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.companyName || customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="issue_date">Issue Date</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={formData.issue_date}
                      onChange={e => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="valid_until">Valid Until</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      value={formData.valid_until}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, valid_until: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quotation Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Quotation Items</span>
                  </CardTitle>
                  <Button type="button" onClick={addQuotationItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.quotation_items.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No items added yet. Click &quot;Add Item&quot; to get started.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Rate Type</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.quotation_items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.equipment_id.toString()}
                              onValueChange={value =>
                                updateQuotationItem(index, 'equipment_id', parseInt(value))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select equipment" />
                              </SelectTrigger>
                              <SelectContent>
                                {equipment.map(eq => (
                                  <SelectItem key={eq.id} value={eq.id.toString()}>
                                    {eq.name} - {eq.model}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.operator_id?.toString() || 'none'}
                              onValueChange={value =>
                                updateQuotationItem(index, 'operator_id', value === 'none' ? null : parseInt(value))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select operator" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No operator</SelectItem>
                                {operators.map(op => (
                                  <SelectItem key={op.id} value={op.id.toString()}>
                                    {op.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e =>
                                updateQuotationItem(index, 'quantity', parseInt(e.target.value))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={e =>
                                updateQuotationItem(index, 'rate', parseFloat(e.target.value))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.rate_type}
                              onValueChange={value =>
                                updateQuotationItem(index, 'rate_type', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">
                              {formatCurrency(item.total_amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuotationItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Notes and Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Notes & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes for the quotation..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
                  <Textarea
                    id="terms_and_conditions"
                    value={formData.terms_and_conditions}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, terms_and_conditions: e.target.value }))
                    }
                    placeholder="Terms and conditions..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(formData.subtotal)}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Discount</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {formData.discount_percentage}%
                        </p>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.discount_percentage}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            discount_percentage: parseFloat(e.target.value),
                          }))
                        }
                        className="w-20"
                      />
                    </div>
                    <p className="text-sm text-blue-600">
                      {formatCurrency(formData.discount_amount)}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Tax</p>
                        <p className="text-lg font-semibold text-yellow-600">
                          {formData.tax_percentage}%
                        </p>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.tax_percentage}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            tax_percentage: parseFloat(e.target.value),
                          }))
                        }
                        className="w-20"
                      />
                    </div>
                    <p className="text-sm text-yellow-600">{formatCurrency(formData.tax_amount)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(formData.total_amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Quotation'}
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Send
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
