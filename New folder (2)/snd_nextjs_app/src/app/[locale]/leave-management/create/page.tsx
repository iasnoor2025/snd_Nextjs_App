
'use client';


// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
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
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { useRouter , useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';

interface LeaveRequestForm {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export default function CreateLeaveRequestPage() {
  return (
    <ProtectedRoute>
      <CreateLeaveRequestContent />
    </ProtectedRoute>
  );
}

function CreateLeaveRequestContent() {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LeaveRequestForm>({
    employee_id: '',
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const leaveTypes = [
    'Annual Leave',
    'Sick Leave',
    'Personal Leave',
    'Maternity Leave',
    'Study Leave',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.employee_id) {
        toast.error(t('leave.please_select_employee'));
        return;
      }
      if (!formData.leave_type) {
        toast.error(t('leave.please_select_leave_type'));
        return;
      }
      if (!formData.start_date) {
        toast.error(t('leave.please_select_start_date'));
        return;
      }
      if (!formData.end_date) {
        toast.error(t('leave.please_select_end_date'));
        return;
      }
      if (!formData.reason) {
        toast.error(t('leave.please_provide_reason'));
        return;
      }

      // Calculate days requested
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const daysRequested =
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (daysRequested < 1) {
        toast.error(t('leave.end_date_after_start'));
        return;
      }

      // Validate that dates are not in the far future (optional business rule)
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
      if (startDate > maxFutureDate) {
        toast.error(t('leave.start_date_too_far_future'));
        return;
      }

      // Submit leave request
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          days: daysRequested,
        }),
      });

      if (response.ok) {
        toast.success(t('leave.leave_request_submitted_successfully'));
        router.push(`/${locale}/leave-management`);
      } else {
        try {
          const error = await response.json();
          toast.error(error.error || error.message || t('leave.failed_to_submit_leave_request'));
        } catch (parseError) {
          
          toast.error(t('leave.failed_to_submit_leave_request'));
        }
      }
    } catch (error) {
      
      toast.error(t('leave.failed_to_submit_leave_request'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof LeaveRequestForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push(`/${locale}/leave-management`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('leave.back_to_leave_management')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('leave.request_leave')}</h1>
            <p className="text-muted-foreground">{t('leave.submit_new_leave_request')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              {t('leave.employee_selection')}
            </CardTitle>
            <CardDescription>{t('leave.select_employee_requesting_leave')}</CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeDropdown
              value={formData.employee_id}
              onValueChange={value => handleInputChange('employee_id', value)}
              label="Employee"
              placeholder="Select an employee"
              required={true}
            />
          </CardContent>
        </Card>

        {/* Leave Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              {t('leave.leave_details')}
            </CardTitle>
            <CardDescription>{t('leave.provide_leave_request_details')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Leave Type */}
            <div className="space-y-2">
              <Label htmlFor="leave_type">{t('leave.leave_type_required')}</Label>
              <Select
                value={formData.leave_type}
                onValueChange={value => handleInputChange('leave_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('leave.select_leave_type')} />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">{t('leave.start_date_required')}</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={e => handleInputChange('start_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">{t('leave.end_date_required')}</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={e => handleInputChange('end_date', e.target.value)}
                  min={formData.start_date}
                />
                <p className="text-xs text-gray-500">
                  {t('leave.end_date_can_be_updated')}
                </p>
              </div>
            </div>

            {/* Days Calculation Display */}
            {formData.start_date && formData.end_date && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    {t('leave.requested_days')}:
                  </span>
                  <span className="text-sm font-bold text-blue-900">
                    {Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} {t('leave.days')}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {t('leave.days_calculation_note')}
                </p>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">{t('leave.reason_for_leave')}</Label>
              <Textarea
                value={formData.reason}
                onChange={e => handleInputChange('reason', e.target.value)}
                placeholder={t('leave.provide_detailed_reason')}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 text-lg">
              {t('leave.early_return_info_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-green-700">
              <p>• {t('leave.early_return_info_1')}</p>
              <p>• {t('leave.early_return_info_2')}</p>
              <p>• {t('leave.early_return_info_3')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${locale}/leave-management`)}
          >
            {t('leave.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('leave.submitting') : t('leave.submit_leave_request')}
          </Button>
        </div>
      </form>
    </div>
  );
}
