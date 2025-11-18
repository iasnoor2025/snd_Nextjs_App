'use client';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useI18n } from '@/hooks/use-i18n';
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { useRBAC, usePermission } from '@/lib/rbac/rbac-context';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  batchTranslateNames,
  convertToArabicNumerals,
  getTranslatedName,
} from '@/lib/translation-utils';
import { useDeleteConfirmations } from '@/lib/utils/confirmation-utils';
import { cn } from '@/lib/utils';
import { getExpiryStatus, getExpiryStatusText } from '@/lib/utils/expiry-utils';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

interface Employee {
  id: number;
  file_number: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  department: string | null;
  department_details?: { name: string } | null;
  designation: string | null;
  designation_details?: { name: string } | null;
  status: string | null;
  hire_date: string | null;
  basic_salary: number | null;
  phone?: string | null;
  nationality?: string | null;
  hourly_rate: number | null;
  overtime_rate_multiplier?: number | null;
  overtime_fixed_rate?: number | null;
  iqama_number?: string | null;
  iqama_expiry?: string | null;
  passport_number?: string | null;
  passport_expiry?: string | null;
  driving_license_number?: string | null;
  driving_license_expiry?: string | null;
  operator_license_number?: string | null;
  operator_license_expiry?: string | null;
  tuv_certification_number?: string | null;
  tuv_certification_expiry?: string | null;
  spsp_license_number?: string | null;
  spsp_license_expiry?: string | null;
  is_external?: boolean;
  company_name?: string | null;
  image_url?: string | null;
  image_is_card?: boolean;
  current_assignment?: {
    id: number;
    type: string;
    name: string;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    notes: string | null;
    project?: {
      id: number;
      name: string;
      location: string | null;
    } | null;
    rental?: {
      id: number;
      project_name: string;
      rental_number: string;
      location: string | null;
    } | null;
  } | null;
}

export default function EmployeeManagementPage() {
  const { t, isRTL } = useI18n();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const { user } = useRBAC();
  const { hasPermission } = usePermission();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [externalFilter, setExternalFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('file_number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDeleting, setIsDeleting] = useState(false);

  // Statistics state
  const [statistics, setStatistics] = useState({
    totalEmployees: 0,
    currentlyAssigned: 0,
    projectAssignments: 0,
    rentalAssignments: 0,
    employeesOnLeave: 0,
    externalEmployees: 0,
  });



  // State for translated names
  const [translatedNames, setTranslatedNames] = useState<{ [key: string]: string }>({});

  // Trigger batch translation when employees data changes
  useEffect(() => {
    if (employees.length > 0 && isRTL) {
      const names = employees.map(emp => emp.full_name).filter(Boolean) as string[];
      batchTranslateNames(names, isRTL, setTranslatedNames);
    }
  }, [employees, isRTL]);

  // Debug function for assignment data
  const debugAssignments = () => {

    const employeesWithAssignments = employees.filter(
      emp => emp.current_assignment && emp.current_assignment.id
    );
    const employeesWithoutAssignments = employees.filter(
      emp => !emp.current_assignment || !emp.current_assignment.id
    );

    // Show first few employees with assignments
    
    employeesWithAssignments.slice(0, 3).forEach(_emp => {
      
    });

    // Show first few employees without assignments
    
    employeesWithoutAssignments.slice(0, 3).forEach(_emp => {
      
    });
  };

  // Make debug function available globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).debugAssignments = debugAssignments;
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      // Skip fetch if data already exists
      if (employees.length > 0 && statistics.totalEmployees > 0) {
        return;
      }

      const isEmployeeUser = user?.role === 'EMPLOYEE';

      if (isEmployeeUser) {
        // For employee users, fetch employees first, then calculate statistics
        await fetchEmployees();
        // Statistics will be calculated from the employees array in fetchStatistics
        await fetchStatistics();
      } else {
        // For admin/manager users, fetch both in parallel
        await Promise.all([fetchEmployees(), fetchStatistics()]);
      }
    };
    loadData();
  }, [user?.role]); // Add user.role as dependency to reload when role changes

  const fetchEmployees = async () => {
    try {
      // Check if user is an employee role - they should only see their own record
      const isEmployeeUser = user?.role === 'EMPLOYEE';

      // For employee users, don't use the 'all=true' parameter to get filtered data
      const url = isEmployeeUser
        ? `/api/employees?_t=${Date.now()}`
        : `/api/employees?all=true&_t=${Date.now()}`;

      const response = await fetch(url);
      
      if (response.ok) {
        const result = (await response.json()) as { success: boolean; data?: Employee[] };
        
        if (result.success && Array.isArray(result.data)) {
          setEmployees(result.data);
        } else {
          setEmployees([]);
          toast.error(t('employee.messages.fetchError'));
        }
      } else {
        setEmployees([]);
        toast.error(t('employee.messages.fetchError'));
      }
    } catch (error) {
      console.error('Error in fetchEmployees:', error);
      setEmployees([]);
      toast.error(t('employee.messages.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Check if user is an employee role - they should only see their own statistics
      const isEmployeeUser = user?.role === 'EMPLOYEE';

      if (isEmployeeUser) {
        // For employee users, calculate statistics from their own employee data
        // This will be called after fetchEmployees, so employees array will be populated
        const ownEmployee = employees[0]; // Employee users will only have their own record
        if (ownEmployee) {
          setStatistics({
            totalEmployees: 1,
            currentlyAssigned: ownEmployee.current_assignment ? 1 : 0,
            projectAssignments: ownEmployee.current_assignment?.type === 'project' ? 1 : 0,
            rentalAssignments: ownEmployee.current_assignment?.type === 'rental' ? 1 : 0,
            employeesOnLeave: 0, // Employee users can't see leave statistics
            externalEmployees: ownEmployee.is_external ? 1 : 0,
          });
        } else {
          setStatistics({
            totalEmployees: 0,
            currentlyAssigned: 0,
            projectAssignments: 0,
            rentalAssignments: 0,
            employeesOnLeave: 0,
            externalEmployees: 0,
          });
        }
      } else {
        // For admin/manager users, fetch statistics from API
        const response = await fetch('/api/employees/statistics');
        if (response.ok) {
          const result = (await response.json()) as { success: boolean; data?: typeof statistics };
          if (result.success && result.data) {
            setStatistics(result.data);
          }
        } else {
          
          // Fallback: use employees array length for total count
          setStatistics({
            totalEmployees: employees.length,
            currentlyAssigned: employees.filter(emp => emp.current_assignment).length,
            projectAssignments: employees.filter(emp => emp.current_assignment?.type === 'project')
              .length,
            rentalAssignments: employees.filter(emp => emp.current_assignment?.type === 'rental')
              .length,
            employeesOnLeave: 0, // Fallback doesn't calculate leave count
            externalEmployees: employees.filter(emp => emp.is_external === true).length,
          });
        }
      }
    } catch {
      
      // Fallback: use employees array length for total count
      setStatistics({
        totalEmployees: employees.length,
        currentlyAssigned: employees.filter(emp => emp.current_assignment).length,
        projectAssignments: employees.filter(emp => emp.current_assignment?.type === 'project')
          .length,
        rentalAssignments: employees.filter(emp => emp.current_assignment?.type === 'rental')
          .length,
        employeesOnLeave: 0, // Fallback doesn't calculate leave count
        externalEmployees: employees.filter(emp => emp.is_external === true).length,
      });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/employees/sync', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success(t('employee.messages.syncSuccess'));

        await fetchEmployees(); // Refresh the list
              } else {
          toast.error(t('employee.messages.syncError'));
        }
      } catch {
        toast.error(t('employee.messages.syncError'));
    } finally {
      setIsSyncing(false);
    }
  };

  const { confirmDeleteEmployee } = useDeleteConfirmations();

  const handleDeleteEmployee = async (employee: Employee) => {
    const confirmed = await confirmDeleteEmployee(employee.full_name || 'this employee');
    if (confirmed) {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/employees/${employee.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success(`Employee ${employee.full_name || 'deleted'} successfully`);
          await fetchEmployees(); // Refresh the list
        } else {
          const error = await response.json();
          toast.error(error.message || 'Failed to delete employee');
        }
      } catch {
        toast.error('Failed to delete employee');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/employees/export', {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'employees.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Employees exported successfully');
      } else {
        toast.error('Failed to export employees');
      }
    } catch {
      toast.error('Failed to export employees');
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const naturalSort = (a: string, b: string) => {
    const aParts = a.match(/(\d+|\D+)/g) || [];
    const bParts = b.match(/(\d+|\D+)/g) || [];

    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
      const aPart = aParts[i];
      const bPart = bParts[i];

      if (aPart && bPart) {
        if (/\d/.test(aPart) && /\d/.test(bPart)) {
          const diff = parseInt(aPart) - parseInt(bPart);
          if (diff !== 0) return diff;
        } else {
          const diff = aPart.localeCompare(bPart);
          if (diff !== 0) return diff;
        }
      }
    }

    return aParts.length - bParts.length;
  };

  const filteredAndSortedEmployees = useMemo(() => {
    // Ensure employees is always an array
    if (!Array.isArray(employees)) {
      return [];
    }

    const filtered = employees.filter(employee => {
      const matchesSearch =
        (employee.file_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (employee.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (employee.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (employee.iqama_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      const matchesDepartment =
        departmentFilter === 'all' || employee.department?.name === departmentFilter;
      const matchesAssignment =
        assignmentFilter === 'all' ||
        (assignmentFilter === 'assigned' &&
          employee.current_assignment &&
          employee.current_assignment.id &&
          employee.current_assignment.status === 'active' &&
          employee.current_assignment.name) ||
        (assignmentFilter === 'unassigned' &&
          (!employee.current_assignment ||
            !employee.current_assignment.id ||
            employee.current_assignment.status !== 'active' ||
            !employee.current_assignment.name));

      const matchesExternal =
        externalFilter === 'all' ||
        (externalFilter === 'external' && employee.is_external === true) ||
        (externalFilter === 'internal' && (!employee.is_external || employee.is_external === false));

      const matchesCompany =
        companyFilter === 'all' ||
        (employee.company_name && employee.company_name === companyFilter);

      return matchesSearch && matchesStatus && matchesDepartment && matchesAssignment && matchesExternal && matchesCompany;
    });

    filtered.sort((a, b) => {
      const aValue: unknown = a[sortField as keyof Employee];
      const bValue: unknown = b[sortField as keyof Employee];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

      if (sortField === 'file_number') {
        return sortDirection === 'asc'
          ? naturalSort(String(aValue), String(bValue))
          : naturalSort(String(bValue), String(aValue));
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Fallback for mixed types
      const aStr = String(aValue);
      const bStr = String(bValue);
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

    return filtered;
  }, [
    employees,
    searchTerm,
    statusFilter,
    departmentFilter,
    assignmentFilter,
    externalFilter,
    companyFilter,
    sortField,
    sortDirection,
  ]);

  // Pagination logic
  const totalItems = filteredAndSortedEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = filteredAndSortedEmployees.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    departmentFilter,
    assignmentFilter,
    externalFilter,
    companyFilter,
    sortField,
    sortDirection,
    itemsPerPage,
  ]);

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Employee' }}>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('employee.messages.loading')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {user?.role === 'EMPLOYEE'
                ? t('employee.title') + ' - My Profile'
                : t('employee.title')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {user?.role === 'EMPLOYEE'
                ? t('employee.subtitle') + ' - You are viewing your own employee record'
                : t('employee.subtitle')}
            </p>
          </div>

          <div className={`flex flex-wrap items-center gap-2 w-full sm:w-auto ${isRTL ? 'flex-row-reverse justify-end sm:justify-start' : 'justify-start sm:justify-end'}`}>
            <PermissionContent action="sync" subject="Employee">
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2"
              >
                <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isSyncing ? t('employee.sync.syncing') : t('employee.sync.button')}
              </Button>
            </PermissionContent>

            <PermissionContent action="create" subject="Employee">
              <Link href={`/${locale}/employee-management/create`}>
                <Button>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('employee.actions.add')}
                </Button>
              </Link>
            </PermissionContent>

            <PermissionContent action="export" subject="Employee">
              <Button variant="outline" onClick={handleExport}>
                <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('employee.actions.export')}
              </Button>
            </PermissionContent>
          </div>
        </div>

        {/* Assignment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('employee.statistics.totalEmployees')}
                  </p>
                  <p className="text-2xl font-bold">{statistics.totalEmployees}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">👥</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('employee.statistics.currentlyAssigned')}
                  </p>
                  <p className="text-2xl font-bold">{statistics.currentlyAssigned}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">📋</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('employee.statistics.projectAssignments')}
                  </p>
                  <p className="text-2xl font-bold">{statistics.projectAssignments}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">🏗️</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('employee.statistics.rentalAssignments')}
                  </p>
                  <p className="text-2xl font-bold">{statistics.rentalAssignments}</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm">🚛</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('employee.statistics.employeesOnLeave')}
                  </p>
                  <p className="text-2xl font-bold">{statistics.employeesOnLeave}</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">🏖️</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('employee.statistics.externalEmployees')}
                  </p>
                  <p className="text-2xl font-bold">{statistics.externalEmployees}</p>
                </div>
                <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 text-sm">🌐</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('employee.title')}</CardTitle>
            <CardDescription>
              {t('employee.pagination.showing', {
                start: String(startIndex + 1),
                end: String(Math.min(endIndex, totalItems)),
                total: String(totalItems),
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex-1">
                <div className="relative">
                  <Search
                    className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4`}
                  />
                  <Input
                    placeholder={t('employee.actions.search')}
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page when searching
                    }}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                  />
                </div>
              </div>

              <Select
                value={statusFilter}
                onValueChange={value => {
                  setStatusFilter(value);
                  setCurrentPage(1); // Reset to first page when filtering
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('employee.filters.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('employee.filters.all')}</SelectItem>
                  <SelectItem value="active">{t('employee.status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('employee.status.inactive')}</SelectItem>
                  <SelectItem value="on_leave">{t('employee.status.onLeave')}</SelectItem>
                  <SelectItem value="left">{t('employee.status.left')}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={departmentFilter}
                onValueChange={value => {
                  setDepartmentFilter(value);
                  setCurrentPage(1); // Reset to first page when filtering
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('employee.filters.department')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('employee.filters.all')}</SelectItem>
                  <SelectItem value="HR">{t('employee.departments.hr')}</SelectItem>
                  <SelectItem value="IT">{t('employee.departments.it')}</SelectItem>
                  <SelectItem value="Finance">{t('employee.departments.finance')}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={assignmentFilter}
                onValueChange={value => {
                  setAssignmentFilter(value);
                  setCurrentPage(1); // Reset to first page when filtering
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('employee.filters.assignmentStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('employee.filters.allAssignments')}</SelectItem>
                  <SelectItem value="assigned">{t('employee.filters.currentlyAssigned')}</SelectItem>
                  <SelectItem value="unassigned">{t('employee.filters.notAssigned')}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={externalFilter}
                onValueChange={value => {
                  setExternalFilter(value);
                  setCurrentPage(1);
                  // Reset company filter when switching to internal
                  if (value !== 'external') {
                    setCompanyFilter('all');
                  }
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Employee Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  <SelectItem value="internal">Internal Only</SelectItem>
                  <SelectItem value="external">External Only</SelectItem>
                </SelectContent>
              </Select>

              {externalFilter === 'external' && (
                <Select
                  value={companyFilter}
                  onValueChange={value => {
                    setCompanyFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {Array.from(
                      new Set(
                        employees
                          .filter(emp => emp.is_external && emp.company_name)
                          .map(emp => emp.company_name)
                          .filter(Boolean)
                      )
                    )
                      .sort()
                      .map(company => (
                        <SelectItem key={company} value={company as string}>
                          {company}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

                         {/* Search Results Summary */}
             {(searchTerm ||
               statusFilter !== 'all' ||
               departmentFilter !== 'all' ||
               assignmentFilter !== 'all' ||
               externalFilter !== 'all' ||
               companyFilter !== 'all') && (
               <div className="mb-4 p-3 bg-muted/50 rounded-md">
                 <div className="text-sm text-muted-foreground">
                   {(() => {
                     let summary = t('employee.searchResults.summary', {
                       filtered: String(filteredAndSortedEmployees.length),
                       total: String(employees.length)
                     });
                     
                     if (searchTerm) {
                       summary += t('employee.searchResults.withSearchTerm', { searchTerm });
                     }
                     
                     if (statusFilter !== 'all') {
                       summary += t('employee.searchResults.withStatus', { statusFilter });
                     }
                     
                     if (departmentFilter !== 'all') {
                       summary += t('employee.searchResults.withDepartment', { departmentFilter });
                     }
                     
                     if (assignmentFilter !== 'all') {
                       if (assignmentFilter === 'assigned') {
                         summary += t('employee.searchResults.assigned');
                       } else {
                         summary += t('employee.searchResults.notAssigned');
                       }
                     }
                     
                     return summary;
                   })()}
                 </div>
               </div>
             )}

            {/* Employee User Notice */}
            {user?.role === 'EMPLOYEE' && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> You are viewing your own employee record. As an employee
                  user, you can only see and manage your own information.
                </div>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee.table.headers.image') || 'Image'}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('file_number')}
                    >
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee.table.headers.fileNumber')}
                        {getSortIcon('file_number')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('full_name')}
                    >
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee.table.headers.name')}
                        {getSortIcon('full_name')}
                      </div>
                    </TableHead>
                    
                    
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('iqama_number')}
                    >
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee.table.headers.iqamaNumber')}
                        {getSortIcon('iqama_number')}
                      </div>
                    </TableHead>
                    
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('nationality')}
                    >
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee.table.headers.nationality')}
                        {getSortIcon('nationality')}
                      </div>
                    </TableHead>
                    
                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee.table.headers.hasSPSP')}
                      </div>
                    </TableHead>
                    
                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee.table.headers.currentAssignment')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('status')}
                    >
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee.table.headers.status')}
                        {getSortIcon('status')}
                      </div>
                    </TableHead>

                    <TableHead className={isRTL ? 'text-left' : 'text-right'}>
                      {t('employee.table.headers.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentEmployees.length === 0 ? (
                    <TableRow>
                                             <TableCell colSpan={10} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {user?.role === 'EMPLOYEE'
                            ? 'No employee record found for your account. Please contact your administrator.'
                            : searchTerm ||
                                statusFilter !== 'all' ||
                                departmentFilter !== 'all' ||
                                assignmentFilter !== 'all'
                              ? t('employee.messages.noEmployeesFilter')
                              : t('employee.messages.noEmployees')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentEmployees.map(employee => (
                      <TableRow key={employee.id}>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          <Avatar className="h-10 w-10">
                            {employee.image_url ? (
                              <AvatarImage 
                                src={employee.image_url} 
                                alt={employee.full_name || 'Employee'}
                                className={cn('h-full w-full object-cover', employee.image_is_card ? 'object-left' : 'object-center')}
                                style={employee.image_is_card ? {
                                  objectPosition: 'left center',
                                  transform: 'scale(2.6) translateX(-10%)',
                                  transformOrigin: 'left center'
                                } : undefined}
                              />
                            ) : null}
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                              {employee.full_name 
                                ? employee.full_name.charAt(0).toUpperCase()
                                : employee.file_number 
                                  ? employee.file_number.charAt(0).toUpperCase()
                                  : 'E'}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                                                 <TableCell className={`font-mono ${isRTL ? 'text-right' : 'text-left'}`}>
                           {convertToArabicNumerals(employee.file_number, isRTL) || t('employee.na')}
                         </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                                                             {getTranslatedName(
                                 employee.full_name,
                                 isRTL,
                                 translatedNames,
                                 setTranslatedNames
                               ) || t('employee.na')}
                              {employee.current_assignment && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs",
                                    employee.current_assignment.type === 'project'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                      : employee.current_assignment.type === 'rental'
                                        ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                                        : employee.current_assignment.type === 'manual'
                                          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                  )}
                                >
                                                                      {employee.current_assignment.type === 'project'
                                      ? `📋 ${t('employee.assignment.project')}`
                                      : employee.current_assignment.type === 'rental'
                                        ? `🚛 ${t('employee.assignment.rental')}`
                                        : employee.current_assignment.type === 'manual'
                                          ? `🔧 ${t('employee.assignment.manual')}`
                                          : `📋 ${t('employee.assignment.assigned')}`}
                                </Badge>
                              )}
                            </div>
                                                         <div className="text-sm text-muted-foreground">
                               {employee.designation?.name || t('employee.na')}
                             </div>
                          </div>
                        </TableCell>
                                                 
                        
                                                 <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                           {employee.iqama_number ? (
                             <div>
                                                               <div className={`font-medium ${employee.iqama_expiry ? (getExpiryStatus(employee.iqama_expiry).status === 'expired' ? 'text-red-600' : 'text-green-600') : ''}`}>
                                 {convertToArabicNumerals(employee.iqama_number, isRTL)}
                                 {employee.iqama_expiry && getExpiryStatus(employee.iqama_expiry).status === 'expired' && (
                                   <span className="ml-1 text-xs">⚠️</span>
                                 )}
                               </div>
                               {employee.iqama_expiry && (
                                 <div className={`text-xs ${getExpiryStatus(employee.iqama_expiry).textColor}`}>
                                   {getExpiryStatusText(employee.iqama_expiry)}
                                 </div>
                               )}
                             </div>
                           ) : (
                             t('employee.na')
                           )}
                         </TableCell>
                        
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          {employee.nationality || t('employee.na')}
                        </TableCell>
                        
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          {employee.spsp_license_number ? (
                            (() => {
                              const expiryStatus = employee.spsp_license_expiry 
                                ? getExpiryStatus(employee.spsp_license_expiry) 
                                : null;
                              const isExpired = expiryStatus?.status === 'expired';
                              
                              return (
                                <Badge 
                                  variant="default" 
                                  className={
                                    isExpired
                                      ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                      : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                  }
                                >
                                  Yes
                                  {isExpired && <span className="ml-1 text-xs">⚠️</span>}
                                </Badge>
                              );
                            })()
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          {employee.current_assignment ? (
                            <div>
                              <div className="font-medium">{employee.current_assignment.name}</div>
                                                              <div className="text-sm text-muted-foreground">
                                  {employee.current_assignment.type === 'project'
                                    ? t('employee.assignment.project')
                                    : employee.current_assignment.type === 'rental'
                                      ? t('employee.assignment.rental')
                                      : employee.current_assignment.type === 'manual'
                                        ? t('employee.assignment.manual')
                                        : t('employee.assignment.assigned')}
                                </div>
                            </div>
                          ) : (
                                                          <span className="text-muted-foreground">
                                {t('employee.assignment.noAssignment')}
                              </span>
                          )}
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          <Badge
                            variant={
                              employee.current_assignment && employee.current_assignment.status === 'active'
                                ? 'default'
                                : employee.status === 'active'
                                  ? 'default'
                                  : employee.status === 'on_leave'
                                    ? 'secondary'
                                    : employee.status === 'inactive'
                                      ? 'destructive'
                                    : employee.status === 'left'
                                      ? 'destructive'
                                      : 'secondary'
                            }
                            className={cn(
                              employee.current_assignment && employee.current_assignment.status === 'active'
                                ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
                                : employee.status === 'active' 
                                  ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                  : employee.status === 'on_leave' 
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
                                    : employee.status === 'inactive'
                                      ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                      : employee.status === 'left'
                                        ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                        : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                            )}
                          >
                            {employee.current_assignment && employee.current_assignment.status === 'active'
                              ? t('employee.status.assigned')
                              : employee.status === 'active'
                                ? t('employee.status.active')
                                : employee.status === 'inactive'
                                  ? t('employee.status.inactive')
                                  : employee.status === 'on_leave'
                                    ? t('employee.status.onLeave')
                                    : employee.status === 'left'
                                      ? t('employee.status.left')
                                      : employee.status || t('employee.na')}
                          </Badge>
                        </TableCell>

                                                 <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                           <div
                             className={`flex items-center gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}
                           >
                             {hasPermission('read', 'Employee') && (
                               <Link href={`/${locale}/employee-management/${employee.id}`}>
                                 <Button variant="ghost" size="sm" title="View Details">
                                   <Eye className="h-4 w-4" />
                                 </Button>
                               </Link>
                             )}

                                                           {hasPermission('read', 'Assignment') && (
                                <Link href={`/${locale}/employee-management/${employee.id}`}>
                                  <Button variant="ghost" size="sm" title="Manage Assignments">
                                    <div className="h-4 w-4 flex items-center justify-center">
                                      <span className="text-xs">📋</span>
                                    </div>
                                  </Button>
                                </Link>
                              )}

                             {hasPermission('update', 'Employee') && (
                               <Link href={`/${locale}/employee-management/${employee.id}/edit`}>
                                 <Button variant="ghost" size="sm" title="Edit Employee">
                                   <Edit className="h-4 w-4" />
                                 </Button>
                               </Link>
                             )}

                             {hasPermission('delete', 'Employee') && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="text-destructive hover:text-destructive"
                                 onClick={() => handleDeleteEmployee(employee)}
                                 disabled={isDeleting}
                                 title="Delete Employee"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             )}
                           </div>
                         </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div
              className={`flex items-center justify-between mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}
                >
                                     {totalPages > 1
                     ? t('employee.pagination.showing', {
                         start: String(startIndex + 1),
                         end: String(Math.min(endIndex, totalItems)),
                         total: String(totalItems),
                       })
                     : t('employee.pagination.showing', {
                         start: String(totalItems),
                         end: String(totalItems),
                         total: String(totalItems),
                       })}
                </div>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm text-muted-foreground">
                    {t('employee.pagination.show')}:
                  </span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={value => setItemsPerPage(Number(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                                          {t('employee.pagination.perPage')}
                  </span>
                </div>
              </div>
              {totalPages > 1 && (
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                                          {isRTL ? (
                        <>
                          {t('employee.pagination.next')}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                                              <>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          {t('employee.pagination.previous')}
                        </>
                    )}
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* First page */}
                    {currentPage > 2 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          className="w-8 h-8 p-0"
                        >
                          1
                        </Button>
                        {currentPage > 3 && <span className="px-2 text-muted-foreground">...</span>}
                      </>
                    )}

                    {/* Current page and surrounding pages */}
                    {(() => {
                      const pages: number[] = [];
                      const startPage = Math.max(1, currentPage - 1);
                      const endPage = Math.min(totalPages, currentPage + 1);

                      for (let page = startPage; page <= endPage; page++) {
                        pages.push(page);
                      }

                      return pages.map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ));
                    })()}

                    {/* Last page */}
                    {currentPage < totalPages - 1 && (
                      <>
                        {currentPage < totalPages - 2 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                                          {isRTL ? (
                        <>
                          {t('employee.pagination.previous')}
                          <ChevronLeft className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                                              <>
                          {t('employee.pagination.next')}
                          <ChevronRight className="h-4 w-4 mr-1" />
                        </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </ProtectedRoute>
  );
}
