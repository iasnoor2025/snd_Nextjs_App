'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ApiService from '@/lib/api-service';
import {
  salaryIncrementService,
  type CreateSalaryIncrementData,
} from '@/lib/services/salary-increment-service';
import { ArrowLeft, Calculator, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
  basic_salary: number;
  food_allowance: number;
  housing_allowance: number;
  transport_allowance: number;
  department?: {
    name: string;
  };
  position?: {
    title: string;
  };
}

const incrementTypes = {
  percentage: 'Percentage Increase',
  amount: 'Fixed Amount Increase',
  promotion: 'Promotion',
  annual_review: 'Annual Review',
  performance: 'Performance Based',
  market_adjustment: 'Market Adjustment',
};

export default function CreateSalaryIncrementPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState<'percentage' | 'fixed'>('percentage');
  const [formData, setFormData] = useState<CreateSalaryIncrementData>({
    employee_id: 0,
    increment_type: 'percentage',
    reason: '',
    effective_date: '',
    notes: '',
    apply_to_allowances: false,
  });
  const [calculatedSalary, setCalculatedSalary] = useState({
    current_base: 0,
    current_food: 0,
    current_housing: 0,
    current_transport: 0,
    current_total: 0,
    new_base: 0,
    new_food: 0,
    new_housing: 0,
    new_transport: 0,
    new_total: 0,
    increase_amount: 0,
    increase_percentage: 0,
  });

  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (selectedEmployee) {
      calculateNewSalary();
    }
  }, [
    selectedEmployee,
    formData.increment_percentage,
    formData.increment_amount,
    formData.increment_type,
    calculationMethod,
  ]);

  const calculateNewSalary = () => {
    if (!selectedEmployee) return;

    // Convert to numbers and ensure they are valid - handle Decimal types properly
    const baseSalary = parseFloat(String(selectedEmployee.basic_salary || 0));
    const foodAllowance = parseFloat(String(selectedEmployee.food_allowance || 0));
    const housingAllowance = parseFloat(String(selectedEmployee.housing_allowance || 0));
    const transportAllowance = parseFloat(String(selectedEmployee.transport_allowance || 0));

    // Debug logging

    const currentTotal = baseSalary + foodAllowance + housingAllowance + transportAllowance;

    let newBase = baseSalary;
    let newFood = foodAllowance;
    let newHousing = housingAllowance;
    let newTransport = transportAllowance;
    let increaseAmount = 0;
    let increasePercentage = 0;

    if (calculationMethod === 'percentage' && formData.increment_percentage) {
      const percentageIncrease = parseFloat(String(formData.increment_percentage)) / 100;
      newBase = baseSalary * (1 + percentageIncrease);
      newFood = foodAllowance * (1 + percentageIncrease);
      newHousing = housingAllowance * (1 + percentageIncrease);
      newTransport = transportAllowance * (1 + percentageIncrease);
      increasePercentage = parseFloat(String(formData.increment_percentage));
    } else if (calculationMethod === 'fixed' && formData.increment_amount) {
      const incrementAmount = parseFloat(String(formData.increment_amount));

      // Distribute fixed amount proportionally across all components
      if (currentTotal > 0) {
        const baseRatio = baseSalary / currentTotal;
        const foodRatio = foodAllowance / currentTotal;
        const housingRatio = housingAllowance / currentTotal;
        const transportRatio = transportAllowance / currentTotal;

        newBase = baseSalary + incrementAmount * baseRatio;
        newFood = foodAllowance + incrementAmount * foodRatio;
        newHousing = housingAllowance + incrementAmount * housingRatio;
        newTransport = transportAllowance + incrementAmount * transportRatio;
        increasePercentage = (incrementAmount / currentTotal) * 100;
      } else {
        // If current total is 0, add the full amount to base salary
        newBase = baseSalary + incrementAmount;
        increasePercentage = 0;
      }
    }

    const newTotal = newBase + newFood + newHousing + newTransport;
    increaseAmount = newTotal - currentTotal;

    // Debug logging for results

    setCalculatedSalary({
      current_base: baseSalary,
      current_food: foodAllowance,
      current_housing: housingAllowance,
      current_transport: transportAllowance,
      current_total: currentTotal,
      new_base: newBase,
      new_food: newFood,
      new_housing: newHousing,
      new_transport: newTransport,
      new_total: newTotal,
      increase_amount: increaseAmount,
      increase_percentage: increasePercentage,
    });

    // Update form data with calculated values
    setFormData(prev => ({
      ...prev,
      new_base_salary: newBase,
      new_food_allowance: newFood,
      new_housing_allowance: newHousing,
      new_transport_allowance: newTransport,
    }));
  };

  const handleEmployeeChange = async (employeeId: string) => {

    if (!employeeId) {
      setSelectedEmployee(null);
      setFormData(prev => ({ ...prev, employee_id: 0 }));
      return;
    }

    setFormData(prev => ({ ...prev, employee_id: parseInt(employeeId) }));

    try {
      // Fetch full employee details including salary information
      const response = await ApiService.get(`/employees/${employeeId}`);

      // The employee API returns data in response.employee, not response.data
      const employeeData = (response as any)?.employee || response?.data;

      if (employeeData) {

        setSelectedEmployee(employeeData);

      } else {
        toast.error('Failed to load employee details');
        setSelectedEmployee(null);
      }
    } catch (error) {
      
      toast.error('Failed to load employee details');
      setSelectedEmployee(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id) {
      toast.error('Please select an employee');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Please enter a reason');
      return;
    }

    if (!formData.effective_date) {
      toast.error('Please select an effective date');
      return;
    }

    if (calculationMethod === 'percentage' && !formData.increment_percentage) {
      toast.error('Please enter increment percentage');
      return;
    }

    if (calculationMethod === 'fixed' && !formData.increment_amount) {
      toast.error('Please enter increment amount');
      return;
    }

    // Prepare the data to send
    const dataToSend: CreateSalaryIncrementData = {
      ...formData,
      // Map calculation method to correct increment type
      increment_type: (calculationMethod === 'percentage' ? 'percentage' : 'amount') as
        | 'percentage'
        | 'amount'
        | 'promotion'
        | 'annual_review'
        | 'performance'
        | 'market_adjustment',
      // Set apply_to_allowances based on calculation method
      apply_to_allowances: calculationMethod === 'percentage',
    };

    // Only include the relevant increment field based on calculation method
    if (calculationMethod === 'percentage' && formData.increment_percentage) {
      dataToSend.increment_percentage = formData.increment_percentage;
    }
    if (calculationMethod === 'fixed' && formData.increment_amount) {
      dataToSend.increment_amount = formData.increment_amount;
    }
   try {
      setLoading(true);
      await salaryIncrementService.createSalaryIncrement(dataToSend);
      toast.success('Salary increment created successfully');
      router.push('/modules/salary-increments');
    } catch (error) {
      
      toast.error('Failed to create salary increment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    const validAmount = amount == null || isNaN(Number(amount)) ? 0 : Number(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
    }).format(validAmount);
  };

  const hasSalaryData = (employee: Employee) => {
    const baseSalary = parseFloat(String(employee.basic_salary || 0));
    const foodAllowance = parseFloat(String(employee.food_allowance || 0));
    const housingAllowance = parseFloat(String(employee.housing_allowance || 0));
    const transportAllowance = parseFloat(String(employee.transport_allowance || 0));
    return baseSalary + foodAllowance + housingAllowance + transportAllowance > 0;
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    return null; // Will redirect to login
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-xl leading-tight font-semibold text-gray-800">
          Create Salary Increment
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>Select the employee for salary increment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <EmployeeDropdown
                value={formData.employee_id?.toString() || ''}
                onValueChange={handleEmployeeChange}
                label="Employee"
                placeholder="Select an employee"
                required={true}
                showSearch={true}
              />
            </div>

            {!selectedEmployee && formData.employee_id && (
              <div className="text-sm text-yellow-600 font-medium mt-2">
                Loading employee details...
              </div>
            )}

            {!formData.employee_id && (
              <div className="text-sm text-red-600 font-medium mt-2">
                Please select an employee to continue.
              </div>
            )}

            {selectedEmployee && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 font-medium">Current Employee Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-600">Department:</span>
                    <span className="ml-2 font-medium">
                      {selectedEmployee.department?.name || 'No Department'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Position:</span>
                    <span className="ml-2 font-medium">
                      {selectedEmployee.position?.title || 'No Position'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Increment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Increment Details</CardTitle>
            <CardDescription>Specify the increment type and amount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <fieldset
              disabled={!selectedEmployee}
              className={!selectedEmployee ? 'opacity-50 pointer-events-none' : ''}
            >
              <div>
                <Label htmlFor="increment_type">Increment Type</Label>
                <Select
                  value={formData.increment_type}
                  onValueChange={value => {
                    setFormData(prev => ({ ...prev, increment_type: value as any }));
                    if (value === 'amount') {
                      setCalculationMethod('fixed');
                      setFormData(prev => {
                        const newData = { ...prev };
                        delete newData.increment_percentage;
                        return newData;
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select increment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {incrementTypes && typeof incrementTypes === 'object' && Object.entries(incrementTypes).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Calculation Method</Label>
                <div className="mt-2 flex gap-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="percentage"
                      name="calculationMethod"
                      value="percentage"
                      checked={calculationMethod === 'percentage'}
                      onChange={() => {
                        setCalculationMethod('percentage');
                        setFormData(prev => {
                          const newData = { ...prev };
                          delete newData.increment_amount;
                          return newData;
                        });
                      }}
                    />
                    <Label htmlFor="percentage">Percentage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="fixed"
                      name="calculationMethod"
                      value="fixed"
                      checked={calculationMethod === 'fixed'}
                      onChange={() => {
                        setCalculationMethod('fixed');
                        setFormData(prev => {
                          const newData = { ...prev };
                          delete newData.increment_percentage;
                          return newData;
                        });
                      }}
                    />
                    <Label htmlFor="fixed">Fixed Amount</Label>
                  </div>
                </div>
              </div>

              {calculationMethod === 'percentage' ? (
                <div>
                  <Label htmlFor="increment_percentage">Increment Percentage (%)</Label>
                  <Input
                    id="increment_percentage"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.increment_percentage || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        increment_percentage: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="Enter percentage (e.g., 10.5 for 10.5%)"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="increment_amount">Increment Amount (SAR)</Label>
                  <Input
                    id="increment_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.increment_amount || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        increment_amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="Enter fixed amount (e.g., 5000)"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date}
                  onChange={e => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </fieldset>
          </CardContent>
        </Card>

        {/* Salary Calculation Preview */}
        {selectedEmployee && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Salary Calculation Preview
              </CardTitle>
              <CardDescription>Preview of the new salary breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasSalaryData(selectedEmployee) && (
                <div className="mb-4 text-sm text-red-600 font-medium">
                  Warning: This employee has no salary or allowance data set. Calculation will
                  always be zero.
                </div>
              )}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Current Salary */}
                <div>
                  <h4 className="mb-3 font-medium text-gray-900">Current Salary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Salary:</span>
                      <span>{formatCurrency(calculatedSalary.current_base)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Food Allowance:</span>
                      <span>{formatCurrency(calculatedSalary.current_food)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Housing Allowance:</span>
                      <span>{formatCurrency(calculatedSalary.current_housing)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport Allowance:</span>
                      <span>{formatCurrency(calculatedSalary.current_transport)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Total:</span>
                      <span>{formatCurrency(calculatedSalary.current_total)}</span>
                    </div>
                  </div>
                </div>

                {/* New Salary - Only show when increment values are provided */}
                {(formData.increment_percentage || formData.increment_amount) && (
                  <>
                    <div>
                      <h4 className="mb-3 font-medium text-green-900">New Salary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Salary:</span>
                          <span>{formatCurrency(calculatedSalary.new_base)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Food Allowance:</span>
                          <span>{formatCurrency(calculatedSalary.new_food)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Housing Allowance:</span>
                          <span>{formatCurrency(calculatedSalary.new_housing)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transport Allowance:</span>
                          <span>{formatCurrency(calculatedSalary.new_transport)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-medium">
                          <span>Total:</span>
                          <span>{formatCurrency(calculatedSalary.new_total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Increase Summary */}
                    <div>
                      <h4 className="mb-3 font-medium text-blue-900">Increase Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Increase Amount:</span>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(calculatedSalary.increase_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Increase Percentage:</span>
                          <span className="font-medium text-green-600">
                            +{calculatedSalary.increase_percentage.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly Impact:</span>
                          <span className="font-medium text-blue-600">
                            +{formatCurrency(calculatedSalary.increase_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annual Impact:</span>
                          <span className="font-medium text-blue-600">
                            +{formatCurrency(calculatedSalary.increase_amount * 12)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reason and Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Justification</CardTitle>
            <CardDescription>
              Provide reason and additional notes for this increment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for Increment</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain the reason for this salary increment"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes or comments"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Salary Increment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
