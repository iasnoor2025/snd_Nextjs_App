'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PermissionContent, RoleContent } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Download, Edit, Eye, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
}

interface PaginatedResponse {
  data: Report[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export default function ReportingPage() {
  const { t } = useTranslation('reporting');
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [reports, setReports] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Get allowed actions for reporting
  const allowedActions = getAllowedActions('Report');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          ...(search && { search }),
          ...(status && status !== 'all' && { status }),
          ...(type && type !== 'all' && { type }),
        });

        const response = await fetch(`/modules/reporting/api/reports?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }

        const data = await response.json();
        setReports(data);
      } catch (error) {
        
        toast.error(t('failed_to_fetch_reports'));
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [search, status, type, currentPage, t]);

  const handleDelete = async (reportId: string) => {
    try {
      toast.loading(t('deleting_report'));

      const response = await fetch(`/modules/reporting/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      toast.success(t('report_deleted_successfully'));

      // Refresh the reports list
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status && status !== 'all' && { status }),
        ...(type && type !== 'all' && { type }),
      });

      const refreshResponse = await fetch(`/modules/reporting/api/reports?${params}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setReports(data);
      }
    } catch (error) {
      
      toast.error(t('failed_to_delete_report'));
    }
  };

  const handleGenerate = async (reportId: string, reportType: string) => {
    try {
      toast.loading(t('generating_report'));

      const response = await fetch('/modules/reporting/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          reportType,
          parameters: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
            endDate: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result = await response.json();
      toast.success(t('report_generated_successfully'));

      // Refresh the reports list to update last_generated
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status && status !== 'all' && { status }),
        ...(type && type !== 'all' && { type }),
      });

      const refreshResponse = await fetch(`/modules/reporting/api/reports?${params}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setReports(data);
      }
    } catch (error) {
      
      toast.error(t('failed_to_generate_report'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">{t('active')}</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">{t('draft')}</Badge>;
      case 'archived':
        return <Badge className="bg-red-100 text-red-800">{t('archived')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'financial':
        return <Badge className="bg-blue-100 text-blue-800">{t('financial')}</Badge>;
      case 'operational':
        return <Badge className="bg-green-100 text-green-800">{t('operational')}</Badge>;
      case 'project':
        return <Badge className="bg-purple-100 text-purple-800">{t('project')}</Badge>;
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

  const getReportType = (type: string) => {
    switch (type) {
      case 'employee_summary':
        return 'employee_summary';
      case 'payroll_summary':
        return 'payroll_summary';
      case 'equipment_utilization':
        return 'equipment_utilization';
      case 'project_progress':
        return 'project_progress';
      case 'rental_summary':
        return 'rental_summary';
      case 'timesheet_summary':
        return 'timesheet_summary';
      default:
        return 'employee_summary'; // Default fallback
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Report' }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('page_title')}</h1>
          <div className="flex space-x-2">
            <PermissionContent action="export" subject="Report">
              <Button
                onClick={() => handleGenerate('', 'employee_summary')}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('generate_reports_button')}
              </Button>
            </PermissionContent>
            <PermissionContent action="create" subject="Report">
              <Link href="/modules/reporting/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('create_report_button')}
                </Button>
              </Link>
            </PermissionContent>
          </div>
        </div>

        <div className="grid gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('search_reports_placeholder')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('filter_by_status_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_status')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="draft">{t('draft')}</SelectItem>
                <SelectItem value="archived">{t('archived')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('filter_by_type_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_types')}</SelectItem>
                <SelectItem value="employee_summary">{t('employee_summary')}</SelectItem>
                <SelectItem value="payroll_summary">{t('payroll_summary')}</SelectItem>
                <SelectItem value="equipment_utilization">{t('equipment_utilization')}</SelectItem>
                <SelectItem value="project_progress">{t('project_progress')}</SelectItem>
                <SelectItem value="rental_summary">{t('rental_summary')}</SelectItem>
                <SelectItem value="timesheet_summary">{t('timesheet_summary')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('reports_title')}</CardTitle>
                <CardDescription>{t('manage_automated_reports_description')}</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {t('total_reports', { count: reports?.total || 0 })}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('report_name')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('created_by')}</TableHead>
                  <TableHead>{t('schedule')}</TableHead>
                  <TableHead>{t('last_generated')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports?.data && reports.data.length > 0 ? (
                  reports.data.map(report => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.name}</div>
                          {report.description && (
                            <div className="text-sm text-gray-500">{report.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(report.type)}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>{report.created_by}</TableCell>
                      <TableCell>
                        {report.schedule ? t(`schedule_${report.schedule}`) : '-'}
                      </TableCell>
                      <TableCell>
                        {report.last_generated
                          ? new Date(report.last_generated).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <PermissionContent action="read" subject="Report">
                            <Link href={`/modules/reporting/${report.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </PermissionContent>
                          <PermissionContent action="update" subject="Report">
                            <Link href={`/modules/reporting/${report.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </PermissionContent>
                          <PermissionContent action="export" subject="Report">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerate(report.id, getReportType(report.type))}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </PermissionContent>
                          <PermissionContent action="delete" subject="Report">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(report.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionContent>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">{t('no_reports_found')}</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Role-based content for administrators and managers */}
        <RoleContent role="ADMIN">
          <Card>
            <CardHeader>
              <CardTitle>{t('administration')}</CardTitle>
              <CardDescription>
                {t('advanced_reporting_features_for_administrators')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <PermissionContent action="manage" subject="Report">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {t('exportAllReports')}
                  </Button>
                </PermissionContent>
                <PermissionContent action="manage" subject="Report">
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('scheduleReports')}
                  </Button>
                </PermissionContent>
                <PermissionContent action="manage" subject="Report">
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    {t('reportTemplates')}
                  </Button>
                </PermissionContent>
              </div>
            </CardContent>
          </Card>
        </RoleContent>
      </div>
    </ProtectedRoute>
  );
}
