'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  DollarSign,
  Package,
  User,
  Calendar,
  Clock,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Equipment {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  status: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  category: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
}

interface RentalItem {
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  days: number;
  rateType: string;
  operatorId?: string;
  notes?: string;
}

interface RentalFormData {
  customerId: string;
  rentalNumber: string;
  startDate: string;
  expectedEndDate: string;
  depositAmount: string;
  paymentTermsDays: string;
  hasTimesheet: boolean;
  hasOperators: boolean;
  status: string;
  paymentStatus: string;
  notes: string;
  rentalItems: RentalItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
}

export default function CreateRentalPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RentalFormData>({
    customerId: '',
    rentalNumber: '',
    startDate: '',
    expectedEndDate: '',
    depositAmount: '0',
    paymentTermsDays: '30',
    hasTimesheet: false,
    hasOperators: false,
    status: 'pending',
    paymentStatus: 'pending',
    notes: '',
    rentalItems: [],
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    discount: 0,
    tax: 0,
    finalAmount: 0,
  });

  // Helper function to convert Decimal to number
  const formatAmount = (amount: any): string => {
    if (amount === null || amount === undefined) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Generate rental number
  const generateRentalNumber = () => {
    const prefix = 'RENT';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${year}${month}${timestamp}`;
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  // Fetch equipment
  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (err) {
      console.error('Failed to fetch equipment:', err);
    }
  };

  // Add rental item
  const addRentalItem = () => {
    const newItem: RentalItem = {
      equipmentId: '',
      equipmentName: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      days: 1,
      rateType: 'daily',
      operatorId: '',
      notes: '',
    };
    setFormData(prev => ({
      ...prev,
      rentalItems: [...prev.rentalItems, newItem]
    }));
  };

  // Update rental item
  const updateRentalItem = (index: number, field: keyof RentalItem, value: any) => {
    const updatedItems = [...formData.rentalItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };

    // If equipment changed, update equipment name and pricing
    if (field === 'equipmentId') {
        const selectedEquipment = equipment.find(eq => eq.id === value);
        if (selectedEquipment) {
        updatedItems[index].equipmentName = selectedEquipment.name;
        updatedItems[index].unitPrice = selectedEquipment.dailyRate;
        updatedItems[index].totalPrice = selectedEquipment.dailyRate * updatedItems[index].quantity * updatedItems[index].days;
      }
    }

    // If quantity or days changed, recalculate total price
    if (field === 'quantity' || field === 'days' || field === 'unitPrice') {
      const item = updatedItems[index];
      updatedItems[index].totalPrice = item.unitPrice * item.quantity * item.days;
    }

    setFormData(prev => ({
      ...prev,
      rentalItems: updatedItems
    }));

    // Recalculate totals
    calculateTotals(updatedItems);
  };

  // Remove rental item
  const removeRentalItem = (index: number) => {
    const updatedItems = formData.rentalItems.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      rentalItems: updatedItems
    }));
    calculateTotals(updatedItems);
  };

  // Calculate totals
  const calculateTotals = (items: RentalItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.1; // 10% tax
    const discount = 0; // No discount for now
    const totalAmount = subtotal + tax - discount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount: tax,
      totalAmount: totalAmount,
      discount,
      tax: 10, // 10%
      finalAmount: totalAmount,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }

    if (!formData.startDate) {
      toast.error('Please select a start date');
      return;
    }

    if (formData.rentalItems.length === 0) {
      toast.error('Please add at least one rental item');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formData.customerId,
          rentalNumber: formData.rentalNumber,
          startDate: new Date(formData.startDate).toISOString(),
          expectedEndDate: formData.expectedEndDate ? new Date(formData.expectedEndDate).toISOString() : null,
          depositAmount: parseFloat(formData.depositAmount) || 0,
          paymentTermsDays: parseInt(formData.paymentTermsDays),
          hasTimesheet: formData.hasTimesheet,
          hasOperators: formData.hasOperators,
          status: formData.status,
          paymentStatus: formData.paymentStatus,
          notes: formData.notes,
          rentalItems: formData.rentalItems,
          subtotal: formData.subtotal,
          taxAmount: formData.taxAmount,
          totalAmount: formData.totalAmount,
          discount: formData.discount,
          tax: formData.tax,
          finalAmount: formData.finalAmount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create rental');
      }

      const rental = await response.json();
      toast.success('Rental created successfully');
      router.push(`/modules/rental-management/${rental.id}`);
    } catch (err) {
      toast.error('Failed to create rental');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchEquipment();

    // Generate rental number
    if (!formData.rentalNumber) {
      setFormData(prev => ({ ...prev, rentalNumber: generateRentalNumber() }));
  }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/modules/rental-management')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
            </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Rental</h1>
            <p className="text-muted-foreground">Create a new equipment rental contract</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic rental details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                <Label htmlFor="rentalNumber">Rental Number</Label>
                    <Input
                  id="rentalNumber"
                  value={formData.rentalNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, rentalNumber: e.target.value }))}
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div>
                <Label htmlFor="customerId">Customer</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
                </div>
                  <div>
                <Label htmlFor="expectedEndDate">Expected End Date</Label>
                    <Input
                  id="expectedEndDate"
                      type="date"
                  value={formData.expectedEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="depositAmount">Deposit Amount</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                    />
                  </div>
                  <div>
                <Label htmlFor="paymentTermsDays">Payment Terms (Days)</Label>
                    <Input
                  id="paymentTermsDays"
                  type="number"
                  value={formData.paymentTermsDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTermsDays: e.target.value }))}
                    />
                  </div>
                </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasTimesheet"
                  checked={formData.hasTimesheet}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasTimesheet: e.target.checked }))}
                />
                <Label htmlFor="hasTimesheet">Has Timesheet</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasOperators"
                  checked={formData.hasOperators}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasOperators: e.target.checked }))}
                />
                <Label htmlFor="hasOperators">Has Operators</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Additional notes about this rental..."
              />
            </div>
              </CardContent>
            </Card>

        {/* Rental Items */}
            <Card>
              <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Rental Items</CardTitle>
                <CardDescription>Add equipment to this rental</CardDescription>
              </div>
              <Button type="button" onClick={addRentalItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
            {formData.rentalItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No rental items added yet</p>
                <p className="text-sm text-muted-foreground">
                  This will create a new rental with the number &quot;{formData.rentalNumber}&quot;
                </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                {formData.rentalItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRentalItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                        <Label>Equipment</Label>
                              <Select
                          value={item.equipmentId}
                          onValueChange={(value) => updateRentalItem(index, 'equipmentId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select equipment" />
                                </SelectTrigger>
                                <SelectContent>
                                  {equipment.map((eq) => (
                              <SelectItem key={eq.id} value={eq.id}>
                                      {eq.name} - {eq.model}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateRentalItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label>Days</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.days}
                          onChange={(e) => updateRentalItem(index, 'days', parseInt(e.target.value) || 1)}
                        />
                      </div>
                            <div>
                              <Label>Rate Type</Label>
                              <Select
                          value={item.rateType}
                          onValueChange={(value) => updateRentalItem(index, 'rateType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                        <Label>Unit Price</Label>
                              <Input
                                type="number"
                                step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateRentalItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                        <Label>Total Price</Label>
                              <Input
                                type="number"
                          step="0.01"
                          value={item.totalPrice}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Notes</Label>
                        <Input
                          value={item.notes || ''}
                          onChange={(e) => updateRentalItem(index, 'notes', e.target.value)}
                          placeholder="Optional notes for this item..."
                              />
                            </div>
                          </div>
                  </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

        {/* Financial Summary */}
            <Card>
              <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Review the rental costs and totals</CardDescription>
              </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${formatAmount(formData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({formData.tax}%):</span>
                    <span>${formatAmount(formData.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-${formatAmount(formData.discount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount:</span>
                    <span>${formatAmount(formData.totalAmount)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Deposit Amount:</span>
                    <span>${formatAmount(formData.depositAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Terms:</span>
                    <span>{formData.paymentTermsDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items Count:</span>
                    <span>{formData.rentalItems.length}</span>
                  </div>
                </div>
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/modules/rental-management')}
          >
            Cancel
                </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Rental'}
                </Button>
        </div>
      </form>
    </div>
  );
}
