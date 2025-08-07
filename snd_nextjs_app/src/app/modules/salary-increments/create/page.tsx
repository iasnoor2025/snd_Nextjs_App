'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { salaryIncrementService, type CreateSalaryIncrementData } from '@/lib/services/salary-increment-service';
import ApiService from '@/lib/api-service';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
  basic_salary: number;
  food_allowance: number;
  housing_allowance: number;
  transport_allowance: number;
}

export default function CreateSalaryIncrementPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSalaryIncrementData>({
    employee_id: 0,
    increment_type: 'percentage',
    reason: '',
    effective_date: '',
    notes: '',
  });
  const [calculatedSalary, setCalculatedSalary] = useState({
    new_base_salary: 0,
    new_food_allowance: 0,
    new_housing_allowance: 0,
    new_transport_allowance: 0,
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
  }, [selectedEmployee, formData.increment_type, formData.increment_percentage, formData.increment_amount, formData.apply_to_allowances]);



  const calculateNewSalary = () => {
    if (!selectedEmployee) return;

    const currentSalary = {
      base_salary: selectedEmployee.basic_salary,
      food_allowance: selectedEmployee.food_allowance,
      housing_allowance: selectedEmployee.housing_allowance,
      transport_allowance: selectedEmployee.transport_allowance,
    };

    let newSalary = { ...currentSalary };

    switch (formData.increment_type) {
      case 'percentage':
        if (formData.increment_percentage) {
          const percentage = formData.increment_percentage / 100;
          newSalary.base_salary = currentSalary.base_salary * (1 + percentage);
          
          if (formData.apply_to_allowances) {
            newSalary.food_allowance = currentSalary.food_allowance * (1 + percentage);
            newSalary.housing_allowance = currentSalary.housing_allowance * (1 + percentage);
            newSalary.transport_allowance = currentSalary.transport_allowance * (1 + percentage);
          }
        }
        break;

      case 'amount':
        if (formData.increment_amount) {
          newSalary.base_salary = currentSalary.base_salary + formData.increment_amount;
        }
        break;

      case 'promotion':
      case 'annual_review':
      case 'performance':
      case 'market_adjustment':
        newSalary = {
          base_salary: formData.new_base_salary || currentSalary.base_salary,
          food_allowance: formData.new_food_allowance || currentSalary.food_allowance,
          housing_allowance: formData.new_housing_allowance || currentSalary.housing_allowance,
          transport_allowance: formData.new_transport_allowance || currentSalary.transport_allowance,
        };
        break;
    }

    setCalculatedSalary(newSalary);
  };

  const handleEmployeeChange = (employeeId: string) => {
    setFormData(prev => ({ ...prev, employee_id: parseInt(employeeId) }));
    // Fetch employee details for salary calculations
    if (employeeId) {
      fetchEmployeeDetails(parseInt(employeeId));
    } else {
      setSelectedEmployee(null);
    }
  };

  const fetchEmployeeDetails = async (employeeId: number) => {
    try {
      const response = await ApiService.get(`/employees/${employeeId}`);
      setSelectedEmployee(response.data);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast.error('Failed to load employee details');
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

    try {
      setLoading(true);
      await salaryIncrementService.createSalaryIncrement(formData);
      toast.success('Salary increment created successfully');
      router.push('/modules/salary-increments');
    } catch (error) {
      console.error('Error creating salary increment:', error);
      toast.error('Failed to create salary increment');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTotalSalary = () => {
    if (!selectedEmployee) return 0;
    return selectedEmployee.basic_salary + 
           selectedEmployee.food_allowance + 
           selectedEmployee.housing_allowance + 
           selectedEmployee.transport_allowance;
  };

  const getNewTotalSalary = () => {
    return calculatedSalary.new_base_salary + 
           calculatedSalary.new_food_allowance + 
           calculatedSalary.new_housing_allowance + 
           calculatedSalary.new_transport_allowance;
  };

  const getIncrementAmount = () => {
    return getNewTotalSalary() - getCurrentTotalSalary();
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
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create Salary Increment</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
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

            <div>
              <Label htmlFor="increment_type">Increment Type *</Label>
              <Select
                value={formData.increment_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, increment_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Increase</SelectItem>
                  <SelectItem value="amount">Fixed Amount Increase</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="annual_review">Annual Review</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="market_adjustment">Market Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter the reason for this salary increment"
              />
            </div>

            <div>
              <Label htmlFor="effective_date">Effective Date *</Label>
              <Input
                id="effective_date"
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes (optional)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Increment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Increment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.increment_type === 'percentage' && (
              <div>
                <Label htmlFor="increment_percentage">Percentage Increase *</Label>
                <Input
                  id="increment_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.increment_percentage || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, increment_percentage: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter percentage (e.g., 5.5 for 5.5%)"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="apply_to_allowances"
                    checked={formData.apply_to_allowances || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, apply_to_allowances: checked as boolean }))}
                  />
                  <Label htmlFor="apply_to_allowances">Apply percentage to allowances</Label>
                </div>
              </div>
            )}

            {formData.increment_type === 'amount' && (
              <div>
                <Label htmlFor="increment_amount">Amount Increase *</Label>
                <Input
                  id="increment_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.increment_amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, increment_amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter amount in SAR"
                />
              </div>
            )}

            {(formData.increment_type === 'promotion' || formData.increment_type === 'annual_review' || 
              formData.increment_type === 'performance' || formData.increment_type === 'market_adjustment') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_base_salary">New Base Salary</Label>
                  <Input
                    id="new_base_salary"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.new_base_salary || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_base_salary: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter new base salary"
                  />
                </div>
                <div>
                  <Label htmlFor="new_food_allowance">New Food Allowance</Label>
                  <Input
                    id="new_food_allowance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.new_food_allowance || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_food_allowance: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter new food allowance"
                  />
                </div>
                <div>
                  <Label htmlFor="new_housing_allowance">New Housing Allowance</Label>
                  <Input
                    id="new_housing_allowance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.new_housing_allowance || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_housing_allowance: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter new housing allowance"
                  />
                </div>
                <div>
                  <Label htmlFor="new_transport_allowance">New Transport Allowance</Label>
                  <Input
                    id="new_transport_allowance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.new_transport_allowance || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_transport_allowance: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter new transport allowance"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary Summary */}
        {selectedEmployee && (
          <Card>
            <CardHeader>
              <CardTitle>Salary Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Current Salary</Label>
                  <div className="text-lg">
                    SAR {getCurrentTotalSalary().toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Base: SAR {selectedEmployee.basic_salary.toLocaleString()}<br />
                    Food: SAR {selectedEmployee.food_allowance.toLocaleString()}<br />
                    Housing: SAR {selectedEmployee.housing_allowance.toLocaleString()}<br />
                    Transport: SAR {selectedEmployee.transport_allowance.toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">New Salary</Label>
                  <div className="text-lg">
                    SAR {getNewTotalSalary().toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Base: SAR {calculatedSalary.new_base_salary.toLocaleString()}<br />
                    Food: SAR {calculatedSalary.new_food_allowance.toLocaleString()}<br />
                    Housing: SAR {calculatedSalary.new_housing_allowance.toLocaleString()}<br />
                    Transport: SAR {calculatedSalary.new_transport_allowance.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Increment Amount:</span>
                  <span className="text-lg font-bold text-green-600">
                    +SAR {getIncrementAmount().toLocaleString()}
                  </span>
                </div>
                {formData.increment_type === 'percentage' && formData.increment_percentage && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-semibold">Percentage Increase:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formData.increment_percentage}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Increment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
