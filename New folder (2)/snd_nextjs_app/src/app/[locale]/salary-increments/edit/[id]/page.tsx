'use client';

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
import { Textarea } from '@/components/ui/textarea';
import ApiService from '@/lib/api-service';
import {
  salaryIncrementService,
  type SalaryIncrement,
} from '@/lib/services/salary-increment-service';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLoginRedirect } from '@/hooks/use-login-redirect';

export default function EditSalaryIncrementPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { redirectToLogin } = useLoginRedirect();
  const locale = params?.locale as string || 'en';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [increment, setIncrement] = useState<SalaryIncrement | null>(null);

  const [formData, setFormData] = useState({
    increment_type: '',
    increment_percentage: undefined as number | undefined,
    increment_amount: undefined as number | undefined,
    reason: '',
    effective_date: '',
    notes: '',
    new_base_salary: undefined as number | undefined,
    new_food_allowance: undefined as number | undefined,
    new_housing_allowance: undefined as number | undefined,
    new_transport_allowance: undefined as number | undefined,
    apply_to_allowances: false,
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      redirectToLogin(true);
      return;
    }

    loadIncrement();
  }, [session, status, redirectToLogin]);

  const loadIncrement = async () => {
    try {
      setLoading(true);
      const incrementId = params.id as string;
      const response = await ApiService.get(`/salary-increments/${incrementId}`);
      const incrementData = response.data;

      if (!incrementData) {
        toast.error('Salary increment not found');
        router.push(`/${locale}/salary-increments`);
        return;
      }

      setIncrement(incrementData);
      setFormData({
        increment_type: incrementData.increment_type,
        increment_percentage: incrementData.increment_percentage
          ? parseFloat(String(incrementData.increment_percentage))
          : undefined,
        increment_amount: incrementData.increment_amount
          ? parseFloat(String(incrementData.increment_amount))
          : undefined,
        reason: incrementData.reason || '',
        effective_date: incrementData.effective_date
          ? new Date(incrementData.effective_date).toISOString().split('T')[0]
          : '',
        notes: incrementData.notes || '',
        new_base_salary: incrementData.new_base_salary
          ? parseFloat(String(incrementData.new_base_salary))
          : undefined,
        new_food_allowance: incrementData.new_food_allowance
          ? parseFloat(String(incrementData.new_food_allowance))
          : undefined,
        new_housing_allowance: incrementData.new_housing_allowance
          ? parseFloat(String(incrementData.new_housing_allowance))
          : undefined,
        new_transport_allowance: incrementData.new_transport_allowance
          ? parseFloat(String(incrementData.new_transport_allowance))
          : undefined,
        apply_to_allowances: incrementData.apply_to_allowances || false,
      });
    } catch (error) {
      
      toast.error('Failed to load salary increment');
      router.push(`/${locale}/salary-increments`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!increment) return;

    try {
      setSaving(true);

      const dataToSend = {
        ...formData,
        increment_percentage: formData.increment_percentage || undefined,
        increment_amount: formData.increment_amount || undefined,
        new_base_salary: formData.new_base_salary || undefined,
        new_food_allowance: formData.new_food_allowance || undefined,
        new_housing_allowance: formData.new_housing_allowance || undefined,
        new_transport_allowance: formData.new_transport_allowance || undefined,
      };

      await ApiService.put(`/salary-increments/${increment.id}`, dataToSend);
      toast.success('Salary increment updated successfully');
      router.push(`/${locale}/salary-increments`);
    } catch (error) {
      
      toast.error('Failed to update salary increment');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!increment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Salary increment not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.push(`/${locale}/salary-increments`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Salary Increment</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Salary Increment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="employee">Employee</Label>
                <Input
                  id="employee"
                  value={`${increment.employee?.first_name} ${increment.employee?.last_name} (${increment.employee?.employee_id})`}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="increment_type">Increment Type</Label>
                <Select
                  value={formData.increment_type}
                  onValueChange={value => handleInputChange('increment_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select increment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="amount">Fixed Amount</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="annual_review">Annual Review</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="market_adjustment">Market Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.increment_type === 'percentage' && (
                <div>
                  <Label htmlFor="increment_percentage">Increment Percentage (%)</Label>
                  <Input
                    id="increment_percentage"
                    type="number"
                    step="0.01"
                    value={formData.increment_percentage || ''}
                    onChange={e =>
                      handleInputChange(
                        'increment_percentage',
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    placeholder="Enter percentage"
                  />
                </div>
              )}

              {formData.increment_type === 'amount' && (
                <div>
                  <Label htmlFor="increment_amount">Increment Amount (SAR)</Label>
                  <Input
                    id="increment_amount"
                    type="number"
                    step="0.01"
                    value={formData.increment_amount || ''}
                    onChange={e =>
                      handleInputChange(
                        'increment_amount',
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    placeholder="Enter amount"
                  />
                </div>
              )}

              {(formData.increment_type === 'promotion' ||
                formData.increment_type === 'annual_review' ||
                formData.increment_type === 'performance' ||
                formData.increment_type === 'market_adjustment') && (
                <>
                  <div>
                    <Label htmlFor="new_base_salary">New Base Salary (SAR)</Label>
                    <Input
                      id="new_base_salary"
                      type="number"
                      step="0.01"
                      value={formData.new_base_salary || ''}
                      onChange={e =>
                        handleInputChange(
                          'new_base_salary',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="Enter new base salary"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new_food_allowance">New Food Allowance (SAR)</Label>
                    <Input
                      id="new_food_allowance"
                      type="number"
                      step="0.01"
                      value={formData.new_food_allowance || ''}
                      onChange={e =>
                        handleInputChange(
                          'new_food_allowance',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="Enter new food allowance"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new_housing_allowance">New Housing Allowance (SAR)</Label>
                    <Input
                      id="new_housing_allowance"
                      type="number"
                      step="0.01"
                      value={formData.new_housing_allowance || ''}
                      onChange={e =>
                        handleInputChange(
                          'new_housing_allowance',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="Enter new housing allowance"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new_transport_allowance">New Transport Allowance (SAR)</Label>
                    <Input
                      id="new_transport_allowance"
                      type="number"
                      step="0.01"
                      value={formData.new_transport_allowance || ''}
                      onChange={e =>
                        handleInputChange(
                          'new_transport_allowance',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="Enter new transport allowance"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date}
                  onChange={e => handleInputChange('effective_date', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={e => handleInputChange('reason', e.target.value)}
                  placeholder="Enter reason for salary increment"
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes (optional)"
                />
              </div>

              {formData.increment_type === 'percentage' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="apply_to_allowances"
                    checked={formData.apply_to_allowances}
                    onChange={e => handleInputChange('apply_to_allowances', e.target.checked)}
                  />
                  <Label htmlFor="apply_to_allowances">Apply percentage to allowances</Label>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${locale}/salary-increments`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
