"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from '@/components/protected-route';
import { PermissionContent, RoleContent, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Eye, Edit, Trash2, Plus, BarChart3, TrendingUp, PieChart, Activity, Download, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';

interface AnalyticsReport {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  created_by: string;
  created_date: string;
  last_generated: string | null;
  schedule: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AnalyticsReportResponse {
  data: AnalyticsReport[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

// Mock data
const mockAnalyticsReports: AnalyticsReport[] = [
  {
    id: "1",
    name: "Monthly Revenue Report",
    type: "Revenue Analysis",
    description: "Comprehensive monthly revenue analysis with trends and projections",
    status: "Active",
    created_by: "John Smith",
    created_date: "2024-01-15T10:00:00Z",
    last_generated: "2024-01-15T08:00:00Z",
    schedule: "Monthly",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    name: "Equipment Utilization Report",
    type: "Equipment Analysis",
    description: "Equipment usage statistics and efficiency metrics",
    status: "Active",
    created_by: "Sarah Wilson",
    created_date: "2024-01-14T14:30:00Z",
    last_generated: "2024-01-14T06:00:00Z",
    schedule: "Weekly",
    is_active: true,
    created_at: "2024-01-14T14:30:00Z",
    updated_at: "2024-01-14T14:30:00Z"
  },
  {
    id: "3",
    name: "Customer Retention Analysis",
    type: "Customer Analysis",
    description: "Customer retention rates and loyalty program effectiveness",
    status: "Inactive",
    created_by: "David Lee",
    created_date: "2024-01-13T09:15:00Z",
    last_generated: "2024-01-13T07:00:00Z",
    schedule: "Monthly",
    is_active: false,
    created_at: "2024-01-13T09:15:00Z",
    updated_at: "2024-01-13T09:15:00Z"
  },
  {
    id: "4",
    name: "Employee Performance Dashboard",
    type: "HR Analytics",
    description: "Employee productivity and performance metrics",
    status: "Active",
    created_by: "Emily Chen",
    created_date: "2024-01-12T11:20:00Z",
    last_generated: "2024-01-12T09:00:00Z",
    schedule: "Weekly",
    is_active: true,
    created_at: "2024-01-12T11:20:00Z",
    updated_at: "2024-01-12T11:20:00Z"
  },
  {
    id: "5",
    name: "Safety Incident Trends",
    type: "Safety Analytics",
    description: "Safety incident trends and risk assessment analysis",
    status: "Active",
    created_by: "Alex Rodriguez",
    created_date: "2024-01-11T15:45:00Z",
    last_generated: "2024-01-11T13:00:00Z",
    schedule: "Monthly",
    is_active: true,
    created_at: "2024-01-11T15:45:00Z",
    updated_at: "2024-01-11T15:45:00Z"
  },
  {
    id: "6",
    name: "Inventory Turnover Report",
    type: "Inventory Analysis",
    description: "Inventory turnover rates and stock level optimization",
    status: "Active",
    created_by: "Mike Johnson",
    created_date: "2024-01-10T12:30:00Z",
    last_generated: "2024-01-10T10:00:00Z",
    schedule: "Weekly",
    is_active: true,
    created_at: "2024-01-10T12:30:00Z",
    updated_at: "2024-01-10T12:30:00Z"
  },
  {
    id: "7",
    name: "Project Profitability Analysis",
    type: "Project Analytics",
    description: "Project profitability and cost analysis",
    status: "Inactive",
    created_by: "Lisa Brown",
    created_date: "2024-01-09T16:20:00Z",
    last_generated: "2024-01-09T14:00:00Z",
    schedule: "Monthly",
    is_active: false,
    created_at: "2024-01-09T16:20:00Z",
    updated_at: "2024-01-09T16:20:00Z"
  },
  {
    id: "8",
    name: "Customer Satisfaction Survey",
    type: "Customer Analytics",
    description: "Customer satisfaction scores and feedback analysis",
    status: "Active",
    created_by: "Tom Davis",
    created_date: "2024-01-08T13:45:00Z",
    last_generated: "2024-01-08T11:00:00Z",
    schedule: "Quarterly",
    is_active: true,
    created_at: "2024-01-08T13:45:00Z",
    updated_at: "2024-01-08T13:45:00Z"
  }
];

export default function AnalyticsPage() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const { t } = useTranslation('analytics');
  const [reports, setReports] = useState<AnalyticsReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);

  // Get allowed actions for analytics
  const allowedActions = getAllowedActions('Report');

  useEffect(() => {
    const fetchAnalyticsReports = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: perPage.toString(),
          ...(search && { search }),
          ...(status && status !== 'all' && { status }),
          ...(type && type !== 'all' && { type }),
        });

        const response = await fetch(`/api/analytics?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics reports');
        }

        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error('Error fetching analytics reports:', error);
        toast.error('Failed to fetch analytics reports');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsReports();
  }, [search, status, type, perPage, currentPage]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this analytics report?")) {
      // Simulate API call
      setTimeout(() => {
        toast.success("Analytics report deleted successfully");
        // Refresh data
        setLoading(true);
        setTimeout(() => {
          const updatedData = mockAnalyticsReports.filter(report => report.id !== id);
          const filteredData = updatedData.filter(report => {
            const matchesSearch = report.name.toLowerCase().includes(search.toLowerCase()) ||
                                 report.description.toLowerCase().includes(search.toLowerCase()) ||
                                 report.created_by.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = status === "all" || report.status === status;
            const matchesType = type === "all" || report.type === type;
            return matchesSearch && matchesStatus && matchesType;
          });

          const total = filteredData.length;
          const lastPage = Math.ceil(total / perPage);
          const startIndex = (currentPage - 1) * perPage;
          const endIndex = startIndex + perPage;
          const paginatedData = filteredData.slice(startIndex, endIndex);

          setReports({
            data: paginatedData,
            current_page: currentPage,
            last_page: lastPage,
            per_page: perPage,
            total,
            next_page_url: currentPage < lastPage ? `/analytics-reports?page=${currentPage + 1}` : null,
            prev_page_url: currentPage > 1 ? `/analytics-reports?page=${currentPage - 1}` : null
          });
          setLoading(false);
        }, 300);
      }, 500);
    }
  };

  const handleGenerate = (id: string) => {
    // Simulate API call
    setTimeout(() => {
      toast.success("Report generation started successfully");
      // Update the last generated date in mock data
      const updatedData = mockAnalyticsReports.map(report =>
        report.id === id
          ? { ...report, last_generated: new Date().toISOString() }
          : report
      );

      // Refresh data
      setLoading(true);
      setTimeout(() => {
        const filteredData = updatedData.filter(report => {
          const matchesSearch = report.name.toLowerCase().includes(search.toLowerCase()) ||
                               report.description.toLowerCase().includes(search.toLowerCase()) ||
                               report.created_by.toLowerCase().includes(search.toLowerCase());
          const matchesStatus = status === "all" || report.status === status;
          const matchesType = type === "all" || report.type === type;
          return matchesSearch && matchesStatus && matchesType;
        });

        const total = filteredData.length;
        const lastPage = Math.ceil(total / perPage);
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        setReports({
          data: paginatedData,
          current_page: currentPage,
          last_page: lastPage,
          per_page: perPage,
          total,
          next_page_url: currentPage < lastPage ? `/analytics-reports?page=${currentPage + 1}` : null,
          prev_page_url: currentPage > 1 ? `/analytics-reports?page=${currentPage - 1}` : null
        });
        setLoading(false);
      }, 300);
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      Active: "bg-green-100 text-green-800",
      Inactive: "bg-gray-100 text-gray-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Error: "bg-red-100 text-red-800"
    };
    return <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      "Revenue Analysis": "bg-blue-100 text-blue-800",
      "Equipment Analysis": "bg-green-100 text-green-800",
      "Customer Analysis": "bg-purple-100 text-purple-800",
      "HR Analytics": "bg-yellow-100 text-yellow-800",
      "Safety Analytics": "bg-red-100 text-red-800",
      "Inventory Analysis": "bg-orange-100 text-orange-800",
      "Project Analytics": "bg-indigo-100 text-indigo-800"
    };
    return <Badge className={typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}>{type}</Badge>;
  };

  const getScheduleBadge = (schedule: string) => {
    const scheduleColors = {
      Daily: "bg-green-100 text-green-800",
      Weekly: "bg-blue-100 text-blue-800",
      Monthly: "bg-purple-100 text-purple-800",
      Quarterly: "bg-orange-100 text-orange-800",
      Yearly: "bg-red-100 text-red-800"
    };
    return <Badge className={scheduleColors[schedule as keyof typeof scheduleColors] || "bg-gray-100 text-gray-800"}>{schedule}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      "Revenue Analysis": BarChart3,
      "Equipment Analysis": Activity,
      "Customer Analysis": TrendingUp,
      "HR Analytics": BarChart3,
      "Safety Analytics": Activity,
      "Inventory Analysis": BarChart3,
      "Project Analytics": PieChart
    };
    const Icon = icons[type as keyof typeof icons] || BarChart3;
    return <Icon className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('loading_reports')}</div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Report' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{t('analytics_management')}</h1>
          </div>
          <div className="flex space-x-2">
            <PermissionContent action="export" subject="Report">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t('export_reports')}
              </Button>
            </PermissionContent>

            <PermissionContent action="create" subject="Report">
              <Link href="/modules/analytics/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('create_report')}
                </Button>
              </Link>
            </PermissionContent>
          </div>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('analytics_reports')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder={t('search_reports')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_status')}</SelectItem>
                  <SelectItem value="Active">{t('active')}</SelectItem>
                  <SelectItem value="Inactive">{t('inactive')}</SelectItem>
                  <SelectItem value="Pending">{t('pending')}</SelectItem>
                  <SelectItem value="Error">{t('error')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_types')}</SelectItem>
                  <SelectItem value="Revenue Analysis">{t('revenue_analysis')}</SelectItem>
                  <SelectItem value="Equipment Analysis">{t('equipment_analysis')}</SelectItem>
                  <SelectItem value="Customer Analysis">{t('customer_analysis')}</SelectItem>
                  <SelectItem value="HR Analytics">{t('hr_analytics')}</SelectItem>
                  <SelectItem value="Safety Analytics">{t('safety_analytics')}</SelectItem>
                  <SelectItem value="Inventory Analysis">{t('inventory_analysis')}</SelectItem>
                  <SelectItem value="Project Analytics">{t('project_analytics')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('report')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('schedule')}</TableHead>
                  <TableHead>{t('last_generated')}</TableHead>
                  <TableHead>{t('created_by')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports?.data.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{report.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(report.type)}
                        {getTypeBadge(report.type)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>{getScheduleBadge(report.schedule)}</TableCell>
                    <TableCell>
                      {report.last_generated ? formatDate(report.last_generated) : t('never_generated')}
                    </TableCell>
                    <TableCell>{report.created_by}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <PermissionContent action="read" subject="Report">
                          <Link href={`/modules/analytics/${report.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </PermissionContent>

                        <PermissionContent action="manage" subject="Report">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerate(report.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Activity className="h-4 w-4" />
                          </Button>
                        </PermissionContent>

                        <PermissionContent action="update" subject="Report">
                          <Link href={`/modules/analytics/${report.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
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
                ))}
              </TableBody>
            </Table>
          </div>

          {reports && reports.last_page > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                {t('showing_results', {
                  start: ((reports.current_page - 1) * reports.per_page) + 1,
                  end: Math.min(reports.current_page * reports.per_page, reports.total),
                  total: reports.total
                })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, reports.current_page - 1))}
                  disabled={reports.current_page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('previous')}
                </Button>

                <div className="flex items-center gap-1">
                  {/* First page */}
                  {reports.current_page > 2 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        className="w-8 h-8 p-0"
                      >
                        1
                      </Button>
                      {reports.current_page > 3 && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                    </>
                  )}

                  {/* Current page and surrounding pages */}
                  {(() => {
                    const pages = [];
                    const startPage = Math.max(1, reports.current_page - 1);
                    const endPage = Math.min(reports.last_page, reports.current_page + 1);

                    for (let page = startPage; page <= endPage; page++) {
                      pages.push(page);
                    }

                    return pages.map((page) => (
                      <Button
                        key={page}
                        variant={reports.current_page === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ));
                  })()}

                  {/* Last page */}
                  {reports.current_page < reports.last_page - 1 && (
                    <>
                      {reports.current_page < reports.last_page - 2 && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(reports.last_page)}
                        className="w-8 h-8 p-0"
                      >
                        {reports.last_page}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(reports.last_page, reports.current_page + 1))}
                  disabled={reports.current_page === reports.last_page}
                >
                  {t('next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role-based content example */}
      <RoleBased roles={['ADMIN', 'MANAGER']}>
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics_administration')}</CardTitle>
            <CardDescription>
              {t('advanced_analytics_management_features')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <PermissionContent action="manage" subject="Report">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('analytics_settings')}
                </Button>
              </PermissionContent>

              <PermissionContent action="export" subject="Report">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  {t('generate_all_reports')}
                </Button>
              </PermissionContent>

              <PermissionContent action="manage" subject="Report">
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {t('schedule_reports')}
                </Button>
              </PermissionContent>
            </div>
          </CardContent>
        </Card>
      </RoleBased>
    </div>
  </ProtectedRoute>
  );
}
