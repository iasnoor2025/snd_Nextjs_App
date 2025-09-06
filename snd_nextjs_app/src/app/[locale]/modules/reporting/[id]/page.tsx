
'use client';


// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { ArrowLeft, Download, Edit, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';

interface Report {
  id: string;
  name: string;
  type: string;
  status: string;
  created_by: string;
  created_at: string;
  last_generated: string;
  schedule: string;
  description?: string;
  parameters?: string;
}

interface ReportData {
  success: boolean;
  data: any;
  generated_at: string;
}

export default function ViewReportPage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reports/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch report');
        }
        const data = await response.json();
        setReport(data);
      } catch (error) {
        
        toast.error(t('reporting.failed_to_fetch_report'));
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: params.id,
          reportType: report?.type,
          parameters: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result = await response.json();
      setReportData(result);
      toast.success(t('reporting.report_generated_successfully'));
    } catch (error) {
      
      toast.error(t('reporting.failed_to_generate_report'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('reporting.confirm_delete_report'))) return;

    try {
      toast.loading(t('reporting.deleting_report'));

      const response = await fetch(`/api/reports/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      toast.success(t('reporting.report_deleted_successfully'));
      router.push('/modules/reporting');
    } catch (error) {
      
      toast.error(t('reporting.failed_to_delete_report'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">{t('reporting.active')}</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">{t('reporting.draft')}</Badge>;
      case 'archived':
        return <Badge className="bg-red-100 text-red-800">{t('reporting.archived')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'employee_summary':
        return <Badge className="bg-orange-100 text-orange-800">{t('employee_summary')}</Badge>;
      case 'payroll_summary':
        return <Badge className="bg-indigo-100 text-indigo-800">{t('payroll_summary')}</Badge>;
      case 'equipment_utilization':
        return <Badge className="bg-teal-100 text-teal-800">{t('equipment_utilization')}</Badge>;
      case 'project_progress':
        return <Badge className="bg-cyan-100 text-cyan-800">{t('project_progress')}</Badge>;
      case 'rental_summary':
        return <Badge className="bg-pink-100 text-pink-800">{t('rental_summary')}</Badge>;
      case 'timesheet_summary':
        return <Badge className="bg-yellow-100 text-yellow-800">{t('timesheet_summary')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{type}</Badge>;
    }
  };

  const renderReportData = () => {
    if (!reportData?.data) return null;

    const data = reportData.data;

    switch (report?.type) {
      case 'employee_summary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{data.total_employees}</div>
                  <div className="text-sm text-gray-500">{t('total_employees')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{data.active_employees}</div>
                  <div className="text-sm text-gray-500">{t('active_employees')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{data.department_stats?.length || 0}</div>
                  <div className="text-sm text-gray-500">{t('departments')}</div>
                </CardContent>
              </Card>
            </div>

            {data.employees && data.employees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('recent_employees')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('employee_name')}</TableHead>
                        <TableHead>{t('department')}</TableHead>
                        <TableHead>{t('designation')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.employees.map((employee: any) => (
                        <TableRow key={employee.id}>
                          <TableCell>{`${employee.first_name} ${employee.last_name}`}</TableCell>
                          <TableCell>{employee.department?.name || '-'}</TableCell>
                          <TableCell>{employee.designation?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                employee.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {employee.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'payroll_summary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{data.total_payrolls}</div>
                  <div className="text-sm text-gray-500">{t('total_payrolls')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">${data.total_amount?.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{t('total_amount')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">${data.average_amount?.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{t('average_amount')}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'equipment_utilization':
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{data.total_equipment}</div>
                <div className="text-sm text-gray-500">{t('total_equipment')}</div>
              </CardContent>
            </Card>

            {data.utilization_stats && data.utilization_stats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('equipment_utilization_stats')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('equipment_name')}</TableHead>
                        <TableHead>{t('type')}</TableHead>
                        <TableHead>{t('total_rentals')}</TableHead>
                        <TableHead>{t('total_hours')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.utilization_stats.map((equipment: any) => (
                        <TableRow key={equipment.id}>
                          <TableCell>{equipment.name}</TableCell>
                          <TableCell>{equipment.type}</TableCell>
                          <TableCell>{equipment.total_rentals}</TableCell>
                          <TableCell>{equipment.total_hours?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return (
          <Card>
            <CardContent className="p-4">
              <pre className="text-sm overflow-auto">{JSON.stringify(data, null, 2)}</pre>
            </CardContent>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">{t('report_not_found')}</h2>
          <Link href="/modules/reporting">
            <Button className="mt-4">{t('back_to_reports')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Report' }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/modules/reporting">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back_to_reports')}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{report.name}</h1>
          </div>
          <div className="flex space-x-2">
            <PermissionContent action="export" subject="Report">
              <Button onClick={handleGenerate} disabled={generating}>
                <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                {generating ? t('generating') : t('generate_report')}
              </Button>
            </PermissionContent>
            <PermissionContent action="update" subject="Report">
              <Link href={`/modules/reporting/${report.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  {t('edit')}
                </Button>
              </Link>
            </PermissionContent>
            <PermissionContent action="delete" subject="Report">
              <Button variant="outline" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete')}
              </Button>
            </PermissionContent>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('report_details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('report_name')}</Label>
                  <p className="text-lg font-semibold">{report.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('report_type')}</Label>
                  <div className="mt-1">{getTypeBadge(report.type)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('status')}</Label>
                  <div className="mt-1">{getStatusBadge(report.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('schedule')}</Label>
                  <p className="text-lg">
                    {report.schedule ? t(`schedule_${report.schedule}`) : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('created_by')}</Label>
                  <p className="text-lg">{report.created_by}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('created_at')}</Label>
                  <p className="text-lg">{new Date(report.created_at).toLocaleDateString()}</p>
                </div>
                {report.last_generated && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      {t('last_generated')}
                    </Label>
                    <p className="text-lg">
                      {new Date(report.last_generated).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {report.description && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">{t('description')}</Label>
                    <p className="text-lg">{report.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {reportData && (
            <Card>
              <CardHeader>
                <CardTitle>{t('report_data')}</CardTitle>
                <CardDescription>
                  {t('generated_at')}: {new Date(reportData.generated_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>{renderReportData()}</CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
