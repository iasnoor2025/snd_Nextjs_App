'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import ApiService from '@/lib/api-service';
import { format } from 'date-fns';
import { CalendarIcon, Receipt, Settings, Pencil, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

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

interface ExpenseCategory {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  isActive: boolean;
}

export default function ExpenseDialog({
  open,
  onOpenChange,
  projectId,
  initialData,
  onSuccess,
}: ExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categoriesList, setCategoriesList] = useState<ExpenseCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryManageOpen, setCategoryManageOpen] = useState(false);
  const [formData, setFormData] = useState<ExpenseResource>({
    category: '',
    amount: 0,
    total_cost: 0,
    date: '',
    description: '',
    expense_description: '',
    notes: '',
    status: 'pending',
  });

  // Helper function to parse date string as local date (avoids timezone issues)
  const parseLocalDate = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;
    const dateStr = dateString.split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month - 1, day);
  };

  // Helper function to format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch expense categories from API
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await ApiService.get('/expense-categories');
      if (response.success && response.data) {
        setCategoriesList(response.data);
      }
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      toast.error('Failed to load expense categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Ensure date is in YYYY-MM-DD format
        date: initialData.date ? initialData.date.split('T')[0] : '',
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
        status: 'pending',
      });
    }
  }, [initialData]);

  // Calculate total cost when amount changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      total_cost: prev.amount || 0,
    }));
  }, [formData.amount]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
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

      // Transform frontend field names to match API expectations
      const submitData = {
        title: `${formData.category} Expense`,
        description: formData.description,
        category: formData.category,
        amount: formData.amount,
        expenseDate: formData.date,
        receiptNumber: '', // Default empty receipt number
        paymentMethod: 'cash', // Default payment method
        vendor: '', // Default empty vendor
        notes: formData.notes,
        assignedTo: null, // Default null assigned to
        type: 'expense',
        name: `${formData.category} Expense`,
        total_cost: formData.amount || 0,
      };

      if (initialData?.id) {
        await ApiService.put(`/projects/${projectId}/expenses?id=${initialData.id}`, submitData);
        toast.success('Expense updated successfully');
      } else {
        await ApiService.createProjectExpense(Number(projectId), submitData);
        toast.success('Expense added successfully');
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
            {initialData
              ? 'Update the details for this expense resource.'
              : 'Add a new expense resource to this project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Section */}
          <div className="rounded-lg bg-muted/40 p-4">
            <h3 className="text-lg font-semibold">Add New Expense</h3>
            <p className="text-sm text-muted-foreground">
              Fill in the details below to add a new expense to the project.
            </p>
          </div>

          {/* Main Form Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Category and Amount */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="category">Category</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCategoryManageOpen(true)}
                      className="h-7 px-2 text-xs"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
                  </div>
                  <Select
                    value={formData.category || undefined}
                    onValueChange={value => handleInputChange('category', value)}
                    disabled={loadingCategories}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCategories ? "Loading..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesList.length === 0 && !loadingCategories ? (
                        <SelectItem value="no-categories" disabled>
                          No categories available
                        </SelectItem>
                      ) : (
                        categoriesList.map(category => (
                          <SelectItem key={category.id} value={category.name}>
                            <div className="flex items-center gap-2">
                              {category.icon && <span>{category.icon}</span>}
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (SAR)</Label>
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
                      SAR
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount || ''}
                      onChange={e => handleInputChange('amount', parseFloat(e.target.value))}
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
                        {formData.date 
                          ? (() => {
                              const date = parseLocalDate(formData.date);
                              return date ? format(date, 'PPP') : formData.date;
                            })()
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date ? parseLocalDate(formData.date) || undefined : undefined}
                        onSelect={date =>
                          handleInputChange('date', formatDateForInput(date))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || 'pending'}
                    onValueChange={value => handleInputChange('status', value)}
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
                  onChange={e => handleInputChange('description', e.target.value)}
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
                  onChange={e => handleInputChange('notes', e.target.value)}
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
                  {categoriesList.find(cat => cat.name === formData.category)?.name ||
                    'Not selected'}
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

      {/* Expense Category Management Dialog */}
      <ExpenseCategoryManageDialog
        open={categoryManageOpen}
        onOpenChange={setCategoryManageOpen}
        categories={categoriesList}
        onRefresh={fetchCategories}
      />
    </Dialog>
  );
}

// Expense Category Management Dialog Component
interface ExpenseCategoryManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExpenseCategory[];
  onRefresh: () => void;
}

function ExpenseCategoryManageDialog({
  open,
  onOpenChange,
  categories,
  onRefresh,
}: ExpenseCategoryManageDialogProps) {
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '💰',
    color: '#EF4444',
  });

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name || '',
        description: editingCategory.description || '',
        icon: editingCategory.icon || '💰',
        color: editingCategory.color || '#EF4444',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '💰',
        color: '#EF4444',
      });
    }
  }, [editingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        toast.error('Category name is required');
        return;
      }

      if (editingCategory) {
        // Update
        await ApiService.put(`/expense-categories/${editingCategory.id}`, formData);
        toast.success('Expense category updated successfully');
      } else {
        // Create
        await ApiService.post('/expense-categories', formData);
        toast.success('Expense category created successfully');
      }

      onRefresh();
      setEditingCategory(null);
      setFormData({ name: '', description: '', icon: '💰', color: '#EF4444' });
    } catch (error: any) {
      console.error('Error saving expense category:', error);
      const errorMessage = error?.message || error?.response?.message || error?.response?.data?.message || error?.response?.data?.error || 'Failed to save expense category';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category: ExpenseCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await ApiService.delete(`/expense-categories/${category.id}`);
      toast.success('Expense category deleted successfully');
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting expense category:', error);
      const errorMessage = error?.message || error?.response?.message || error?.response?.data?.message || error?.response?.data?.error || 'Failed to delete expense category';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-red-600" />
            <span>Manage Expense Categories</span>
          </DialogTitle>
          <DialogDescription>
            Create, edit, or delete expense categories that can be used in projects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create/Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {editingCategory ? 'Edit Expense Category' : 'Add New Expense Category'}
              </h3>
              {editingCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCategory(null)}
                >
                  Cancel Edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Accommodation, Transportation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="💰"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#EF4444"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingCategory ? 'Update Category' : 'Add Category'}
            </Button>
          </form>

          {/* Categories List */}
          <div className="space-y-2">
            <h3 className="font-semibold">Existing Categories</h3>
            <div className="border rounded-lg divide-y">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No categories found. Create your first category above.
                </div>
              ) : (
                categories.map(category => (
                  <div
                    key={category.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {category.icon && (
                        <span className="text-2xl">{category.icon}</span>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-muted-foreground">{category.description}</div>
                        )}
                      </div>
                      {category.color && (
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCategory(category)}
                        disabled={loading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
