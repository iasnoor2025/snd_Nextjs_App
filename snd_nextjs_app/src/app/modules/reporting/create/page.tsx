'use client';

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
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface ReportFormData {
  name: string;
  type: string;
  description: string;
  schedule: string;
  parameters: any;
}

export default function CreateReportPage() {
  const { t } = useTranslation('reporting');
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
      toast.error(t('please_fill_required_fields'));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/modules/reporting/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create report');
      }

      toast.success(t('report_created_successfully'));
      router.push('/modules/reporting');
    } catch (error) {
      
      toast.error(t('failed_to_create_report'));
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
                {t('back_to_reports')}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{t('create_report')}</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('create_new_report')}</CardTitle>
            <CardDescription>{t('create_new_report_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('report_name')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder={t('enter_report_name')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">{t('report_type')} *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={value => handleInputChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_report_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee_summary">{t('employee_summary')}</SelectItem>
                      <SelectItem value="payroll_summary">{t('payroll_summary')}</SelectItem>
                      <SelectItem value="equipment_utilization">
                        {t('equipment_utilization')}
                      </SelectItem>
                      <SelectItem value="project_progress">{t('project_progress')}</SelectItem>
                      <SelectItem value="rental_summary">{t('rental_summary')}</SelectItem>
                      <SelectItem value="timesheet_summary">{t('timesheet_summary')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">{t('schedule')}</Label>
                  <Select
                    value={formData.schedule}
                    onValueChange={value => handleInputChange('schedule', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_schedule')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t('daily')}</SelectItem>
                      <SelectItem value="weekly">{t('weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('monthly')}</SelectItem>
                      <SelectItem value="quarterly">{t('quarterly')}</SelectItem>
                      <SelectItem value="yearly">{t('yearly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">{t('status')}</Label>
                  <Select value="active" disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('active')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  placeholder={t('enter_report_description')}
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
                    {loading ? t('creating') : t('create_report')}
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
