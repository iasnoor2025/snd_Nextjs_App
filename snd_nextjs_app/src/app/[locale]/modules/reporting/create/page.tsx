'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';

interface ReportFormData {
  name: string;
  type: string;
  description: string;
  schedule: string;
  parameters: any;
}

export default function CreateReportPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>({
    name: '',
    type: '',
    description: '',
    schedule: '',
    parameters: {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type) {
      toast.error(t('reporting.please_fill_required_fields'));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create report');
      }

      toast.success(t('reporting.report_created_successfully'));
      router.push('/modules/reporting');
    } catch (error) {
      
      toast.error(t('reporting.failed_to_create_report'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ReportFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <ProtectedRoute requiredPermission={{ action: 'create', subject: 'Report' }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/modules/reporting">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('reporting.back_to_reports')}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{t('reporting.create_report')}</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.create_new_report')}</CardTitle>
            <CardDescription>{t('reporting.create_new_report_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('reporting.report_name')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder={t('reporting.enter_report_name')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">{t('reporting.report_type')} *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={value => handleInputChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('reporting.select_report_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee_summary">{t('reporting.employee_summary')}</SelectItem>
                      <SelectItem value="payroll_summary">{t('reporting.payroll_summary')}</SelectItem>
                      <SelectItem value="equipment_utilization">
                        {t('reporting.equipment_utilization')}
                      </SelectItem>
                      <SelectItem value="project_progress">{t('reporting.project_progress')}</SelectItem>
                      <SelectItem value="rental_summary">{t('reporting.rental_summary')}</SelectItem>
                      <SelectItem value="timesheet_summary">{t('reporting.timesheet_summary')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">{t('reporting.schedule')}</Label>
                  <Select
                    value={formData.schedule}
                    onValueChange={value => handleInputChange('schedule', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('reporting.select_schedule')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t('reporting.daily')}</SelectItem>
                      <SelectItem value="weekly">{t('reporting.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('reporting.monthly')}</SelectItem>
                      <SelectItem value="quarterly">{t('reporting.quarterly')}</SelectItem>
                      <SelectItem value="yearly">{t('reporting.yearly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">{t('reporting.status')}</Label>
                  <Select value="active" disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('reporting.active')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('reporting.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  placeholder={t('reporting.enter_report_description')}
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/modules/reporting">
                  <Button type="button" variant="outline">
                    {t('cancel')}
                  </Button>
                </Link>
                <PermissionContent action="create" subject="Report">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? t('reporting.creating') : t('reporting.create_report')}
                  </Button>
                </PermissionContent>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
