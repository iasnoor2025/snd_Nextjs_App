'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import apiService from '@/lib/api';

interface ExpenseResource {
  id?: string;
  category?: string;
  amount?: number;
  total_cost?: number;
  date?: string;
  description?: string;
  expense_description?: string;
  notes?: string;
  status?: string;
}

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialData?: ExpenseResource | null;
  onSuccess: () => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'meals', label: 'Meals' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'safety', label: 'Safety' },
  { value: 'permits', label: 'Permits' },
  { value: 'other', label: 'Other' }
];

export default function ExpenseDialog({
  open,
  onOpenChange,
  projectId,
  initialData,
  onSuccess
}: ExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ExpenseResource>({
    category: '',
    amount: 0,
    total_cost: 0,
    date: '',
    description: '',
    expense_description: '',
    notes: '',
    status: 'pending'
  });

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        category: '',
        amount: 0,
        total_cost: 0,
        date: '',
        description: '',
        expense_description: '',
        notes: '',
        status: 'pending'
      });
    }
  }, [initialData]);

  // Calculate total cost when amount changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      total_cost: prev.amount || 0
    }));
  }, [formData.amount]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.category) {
        toast.error('Please select a category');
        return;
      }
      if (!formData.amount || formData.amount <= 0) {
        toast.error('Amount must be greater than 0');
        return;
      }
      if (!formData.date) {
        toast.error('Date is required');
        return;
      }
      if (!formData.description) {
        toast.error('Description is required');
        return;
      }

      const submitData = {
        ...formData,
        type: 'expense',
        name: `${formData.category} Expense`,
        total_cost: formData.amount || 0
      };

      // TODO: Project resource endpoints don't exist yet
      // Implement these when the endpoints become available
      if (initialData?.id) {
        // await apiService.put(`/projects/${projectId}/resources/${initialData.id}`, submitData);
        toast.success('Expense resource update feature not implemented yet');
      } else {
        // await apiService.post(`/projects/${projectId}/resources`, submitData);
        toast.success('Expense resource add feature not implemented yet');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving expense resource:', error);
      toast.error('Failed to save expense resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-red-600" />
            <span>{initialData ? 'Edit Expense Resource' : 'Add Expense Resource'}</span>
          </DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details for this expense resource.' : 'Add a new expense resource to this project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Section */}
          <div className="rounded-lg bg-muted/40 p-4">
            <h3 className="text-lg font-semibold">Add New Expense</h3>
            <p className="text-sm text-muted-foreground">Fill in the details below to add a new expense to the project.</p>
          </div>

          {/* Main Form Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Category and Amount */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category || ''}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (SAR)</Label>
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">SAR</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount || ''}
                      onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="pl-12"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Date and Status */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(new Date(formData.date), 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date ? new Date(formData.date) : undefined}
                        onSelect={(date) => handleInputChange('date', date?.toISOString().split('T')[0] || '')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || 'pending'}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter a detailed description of the expense"
                  className="min-h-[120px]"
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes or comments"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="rounded-lg bg-muted/40 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">
                  {EXPENSE_CATEGORIES.find(cat => cat.value === formData.category)?.label || 'Not selected'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium">SAR {formData.amount || '0.00'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{formData.status || 'Pending'}</p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initialData ? 'Update Resource' : 'Add Resource'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
