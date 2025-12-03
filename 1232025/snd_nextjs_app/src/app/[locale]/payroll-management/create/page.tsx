'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, Plus, Save } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { useParams } from 'next/navigation';
interface Employee {
  id: string;
  name: string;
  employee_id: string;
  department: string;
  position: string;
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'John Doe',
    employee_id: 'EMP001',
    department: 'Engineering',
    position: 'Software Engineer',
  },
  {
    id: '2',
    name: 'Jane Smith',
    employee_id: 'EMP002',
    department: 'Marketing',
    position: 'Marketing Manager',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    employee_id: 'EMP003',
    department: 'Sales',
    position: 'Sales Representative',
  },
];

export default function CreatePayrollPage() {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [formData, setFormData] = useState({
    employee_id: '',
    period: '',
    gross_pay: '',
    net_pay: '',
    basic_salary: '',
    allowances: '',
    overtime_hours: '',
    overtime_rate: '',
    payment_date: undefined as Date | undefined,
    payment_method: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Payroll created successfully');
      // Redirect to payroll list
      window.location.href = `/${locale}/payroll-management`;
    } catch (error) {
      toast.error('Failed to create payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateNetPay = () => {
    const gross = parseFloat(formData.gross_pay) || 0;
    return gross;
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/${locale}/payroll-management`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Payroll</h1>
          <p className="text-gray-600">Add a new payroll record for an employee</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
              <CardDescription>Select the employee for this payroll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee</Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={value => handleInputChange('employee_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockEmployees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.employee_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Payroll Period</Label>
                  <Select
                    value={formData.period}
                    onValueChange={value => handleInputChange('period', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="January 2024">January 2024</SelectItem>
                      <SelectItem value="February 2024">February 2024</SelectItem>
                      <SelectItem value="March 2024">March 2024</SelectItem>
                      <SelectItem value="April 2024">April 2024</SelectItem>
                      <SelectItem value="May 2024">May 2024</SelectItem>
                      <SelectItem value="June 2024">June 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Details */}
          <Card>
            <CardHeader>
              <CardTitle>Salary Details</CardTitle>
              <CardDescription>Enter salary and compensation information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basic_salary">Basic Salary</Label>
                  <Input
                    id="basic_salary"
                    type="number"
                    placeholder="0.00"
                    value={formData.basic_salary}
                    onChange={e => handleInputChange('basic_salary', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allowances">Allowances</Label>
                  <Input
                    id="allowances"
                    type="number"
                    placeholder="0.00"
                    value={formData.allowances}
                    onChange={e => handleInputChange('allowances', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gross_pay">Gross Pay</Label>
                  <Input
                    id="gross_pay"
                    type="number"
                    placeholder="0.00"
                    value={formData.gross_pay}
                    onChange={e => handleInputChange('gross_pay', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overtime */}
          <Card>
            <CardHeader>
              <CardTitle>Overtime</CardTitle>
              <CardDescription>Enter overtime hours and rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overtime_hours">Overtime Hours</Label>
                  <Input
                    id="overtime_hours"
                    type="number"
                    placeholder="0"
                    value={formData.overtime_hours}
                    onChange={e => handleInputChange('overtime_hours', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overtime_rate">Overtime Rate</Label>
                  <Input
                    id="overtime_rate"
                    type="number"
                    placeholder="0.00"
                    value={formData.overtime_rate}
                    onChange={e => handleInputChange('overtime_rate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Set payment date and method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Payment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.payment_date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.payment_date
                          ? format(formData.payment_date, 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.payment_date}
                        onSelect={date => handleInputChange('payment_date', date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={value => handleInputChange('payment_method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>Add any additional notes or comments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any additional notes..."
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href={`/${locale}/payroll-management`}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Payroll
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
