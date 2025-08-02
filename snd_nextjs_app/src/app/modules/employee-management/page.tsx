'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Plus, Download, Upload, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Employee {
  id: number;
  file_number: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  department: string | null;
  designation: string | null;
  status: string | null;
  hire_date: string | null;
  basic_salary: number | null;
  phone?: string | null;
  nationality?: string | null;
  hourly_rate: number | null;
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
  const { t } = useTranslation(['common', 'employee']);
  const { isRTL } = useI18n();
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('file_number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Statistics state
  const [statistics, setStatistics] = useState({
    totalEmployees: 0,
    currentlyAssigned: 0,
    projectAssignments: 0,
    rentalAssignments: 0
  });

  // Get allowed actions for employee management
  const allowedActions = getAllowedActions('Employee');
  
  // Debug logging
  

  useEffect(() => {
    const loadData = async () => {
      await fetchEmployees();
      await fetchStatistics();
    };
    loadData();
  }, []);

  const fetchEmployees = async () => {
    try {
      // Fetch all employees for search and sorting functionality
      const response = await fetch('/api/employees?all=true');
      if (response.ok) {
        const result = await response.json() as { success: boolean; data?: Employee[] };
        if (result.success && Array.isArray(result.data)) {
          setEmployees(result.data);
          setFilteredEmployees(result.data);
        } else {
          setEmployees([]);
          setFilteredEmployees([]);
          toast.error(t('employee:messages.fetchError'));
        }
      } else {
        setEmployees([]);
        setFilteredEmployees([]);
        toast.error(t('employee:messages.fetchError'));
      }
    } catch (_error) {
      setEmployees([]);
      setFilteredEmployees([]);
      toast.error(t('employee:messages.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/employees/statistics');
      if (response.ok) {
        const result = await response.json() as { success: boolean; data?: any };
        if (result.success && result.data) {
          setStatistics(result.data);
        }
      } else {
        console.error('Statistics API returned error:', response.status);
        // Fallback: use employees array length for total count
        setStatistics({
          totalEmployees: employees.length,
          currentlyAssigned: employees.filter(emp => emp.current_assignment).length,
          projectAssignments: employees.filter(emp => emp.current_assignment?.type === 'project').length,
          rentalAssignments: employees.filter(emp => emp.current_assignment?.type === 'rental').length
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Fallback: use employees array length for total count
      setStatistics({
        totalEmployees: employees.length,
        currentlyAssigned: employees.filter(emp => emp.current_assignment).length,
        projectAssignments: employees.filter(emp => emp.current_assignment?.type === 'project').length,
        rentalAssignments: employees.filter(emp => emp.current_assignment?.type === 'rental').length
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
        const result = await response.json();
        toast.success(t('employee:messages.syncSuccess'));

        await fetchEmployees(); // Refresh the list
      } else {
        toast.error(t('employee:messages.syncError'));
      }
    } catch (_error) {
      toast.error(t('employee:messages.syncError'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestERPNext = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/test-erpnext');
      const result = await response.json();

      if (result.success) {
        toast.success('ERPNext test completed - check console for details');

      } else {
        toast.error(`ERPNext test failed: ${result.message}`);
        console.error('ERPNext test failed:', result);
      }
    } catch (_error) {
      toast.error('Failed to test ERPNext connection');
      console.error('ERPNext test error:', _error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCheckEnvironment = async () => {
    try {
      const response = await fetch('/api/debug/env');
      const result = await response.json();

      if (result.success) {
        toast.success('Environment check completed - check console for details');

      } else {
        toast.error(`Environment check failed: ${result.message}`);
        console.error('Environment check failed:', result);
      }
    } catch (_error) {
      toast.error('Failed to check environment');
      console.error('Environment check error:', _error);
    }
  };



  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.full_name || 'this employee'}?`)) {
      return;
    }

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
    } catch (_error) {
      toast.error('Failed to delete employee');
    } finally {
      setIsDeleting(false);
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
    } catch (error) {
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
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const naturalSort = (a: string, b: string) => {
    const aParts = a.match(/(\d+|\D+)/g) || [];
    const bParts = b.match(/(\d+|\D+)/g) || [];

    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
      const aPart = aParts[i];
      const bPart = bParts[i];

      if (/\d/.test(aPart) && /\d/.test(bPart)) {
        const diff = parseInt(aPart) - parseInt(bPart);
        if (diff !== 0) return diff;
      } else {
        const diff = aPart.localeCompare(bPart);
        if (diff !== 0) return diff;
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
        (employee.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
      const matchesAssignment = assignmentFilter === 'all' || 
        (assignmentFilter === 'assigned' && employee.current_assignment) ||
        (assignmentFilter === 'unassigned' && !employee.current_assignment);

      return matchesSearch && matchesStatus && matchesDepartment && matchesAssignment;
    });

    filtered.sort((a, b) => {
      const aValue: any = a[sortField as keyof Employee];
      const bValue: any = b[sortField as keyof Employee];

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
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return filtered;
  }, [employees, searchTerm, statusFilter, departmentFilter, sortField, sortDirection]);

  // Pagination logic
  const totalItems = filteredAndSortedEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = filteredAndSortedEmployees.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, assignmentFilter, sortField, sortDirection, itemsPerPage]);

  if (isLoading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Employee' }}>
        <div className="flex items-center justify-center h-64">
                  <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('employee:messages.loading')}</p>
        </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Employee' }}>
      <div className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold">{t('employee:title')}</h1>
            <p className="text-muted-foreground">{t('employee:subtitle')}</p>
          </div>

          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Can action="sync" subject="Employee">
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                variant="outline"
              >
                <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isSyncing ? 'Syncing...' : 'Sync with ERPNext'}
              </Button>
            </Can>

            <Can action="sync" subject="Employee">
              <Button
                onClick={handleTestERPNext}
                disabled={isSyncing}
                variant="outline"
              >
                <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isSyncing ? 'Testing...' : 'Test ERPNext Connection'}
              </Button>
            </Can>

            <Can action="sync" subject="Employee">
              <Button
                onClick={handleCheckEnvironment}
                disabled={isSyncing}
                variant="outline"
              >
                <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isSyncing ? 'Checking...' : 'Check Environment'}
              </Button>
            </Can>

            <Can action="create" subject="Employee">
              <Link href="/modules/employee-management/create">
                <Button>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('employee:actions.add')}
                </Button>
              </Link>
            </Can>

            <Can action="export" subject="Employee">
              <Button variant="outline" onClick={handleExport}>
                <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                Export
              </Button>
            </Can>
          </div>
        </div>

        {/* Assignment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Currently Assigned</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Project Assignments</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Rental Assignments</p>
                  <p className="text-2xl font-bold">{statistics.rentalAssignments}</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm">🚛</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('employee:title')}</CardTitle>
            <CardDescription>
              {t('employee:pagination.showing', { 
                start: startIndex + 1, 
                end: Math.min(endIndex, totalItems), 
                total: totalItems 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
                          <div className={`flex items-center gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <div className="relative">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4`} />
                    <Input
                      placeholder={t('employee:actions.search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={isRTL ? 'pr-10' : 'pl-10'}
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t('employee:filters.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('employee:filters.all')}</SelectItem>
                    <SelectItem value="active">{t('employee:status.active')}</SelectItem>
                    <SelectItem value="inactive">{t('employee:status.inactive')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t('employee:filters.department')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('employee:filters.all')}</SelectItem>
                    <SelectItem value="HR">{t('employee:departments.hr')}</SelectItem>
                    <SelectItem value="IT">{t('employee:departments.it')}</SelectItem>
                    <SelectItem value="Finance">{t('employee:departments.finance')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Assignment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignments</SelectItem>
                    <SelectItem value="assigned">Currently Assigned</SelectItem>
                    <SelectItem value="unassigned">Not Assigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('file_number')}
                    >
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee:table.headers.fileNumber')}
                        {getSortIcon('file_number')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('full_name')}
                    >
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee:table.headers.name')}
                        {getSortIcon('full_name')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('email')}
                    >
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee:table.headers.email')}
                        {getSortIcon('email')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('department')}
                    >
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee:table.headers.department')}
                        {getSortIcon('department')}
                      </div>
                    </TableHead>
                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        Current Assignment
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('status')}
                    >
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee:table.headers.status')}
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('hireDate')}
                    >
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {t('employee:table.headers.hireDate')}
                        {getSortIcon('hireDate')}
                      </div>
                    </TableHead>
                    <TableHead className={isRTL ? 'text-left' : 'text-right'}>{t('employee:table.headers.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' || assignmentFilter !== 'all'
                            ? t('employee:messages.noEmployeesFilter')
                            : t('employee:messages.noEmployees')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className={`font-mono ${isRTL ? 'text-right' : 'text-left'}`}>{employee.file_number || 'N/A'}</TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {employee.full_name || 'N/A'}
                              {employee.current_assignment && (
                                <Badge variant="outline" className="text-xs">
                                  {employee.current_assignment.type === 'project' ? '📋 Project' : 
                                   employee.current_assignment.type === 'rental' ? '🚛 Rental' : 
                                   employee.current_assignment.type === 'manual' ? '🔧 Equipment' : '📋 Assigned'}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.designation || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>{employee.email || 'N/A'}</TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>{employee.department || 'N/A'}</TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          {employee.current_assignment ? (
                            <div className="space-y-1">
                              <div className="font-medium text-sm">
                                {employee.current_assignment.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {employee.current_assignment.type === 'project' && employee.current_assignment.project ? (
                                  <span>Project: {employee.current_assignment.project.name}</span>
                                ) : employee.current_assignment.type === 'rental' && employee.current_assignment.rental ? (
                                  <span>Rental: {employee.current_assignment.rental.project_name} - {employee.current_assignment.rental.rental_number}</span>
                                ) : employee.current_assignment.type === 'manual' ? (
                                  <span>Equipment Assignment: {employee.current_assignment.name}</span>
                                ) : (
                                  <span>{employee.current_assignment.type}</span>
                                )}
                              </div>
                              {employee.current_assignment.location && (
                                <div className="text-xs text-muted-foreground">
                                  📍 {employee.current_assignment.location}
                                </div>
                              )}
                              {employee.current_assignment.start_date && (
                                <div className="text-xs text-muted-foreground">
                                  Since: {new Date(employee.current_assignment.start_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No assignment</span>
                          )}
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>{employee.hire_date || 'N/A'}</TableCell>
                        <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                          <div className={`flex items-center gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                            <Can action="read" subject="Employee">
                              <Link href={`/modules/employee-management/${employee.id}`}>
                                <Button variant="ghost" size="sm" title="View Details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </Can>

                            <Can action="read" subject="Employee">
                              <Link href={`/modules/employee-management/${employee.id}`}>
                                <Button variant="ghost" size="sm" title="Manage Assignments">
                                  <div className="h-4 w-4 flex items-center justify-center">
                                    <span className="text-xs">📋</span>
                                  </div>
                                </Button>
                              </Link>
                            </Can>

                            <Can action="update" subject="Employee">
                              <Link href={`/modules/employee-management/${employee.id}/edit`}>
                                <Button variant="ghost" size="sm" title="Edit Employee">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            </Can>

                            <Can action="delete" subject="Employee">
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
                            </Can>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className={`flex items-center justify-between mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                  {totalPages > 1 ? `Page ${currentPage} of ${totalPages}` : `Showing ${totalItems} employees`}
                </div>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm text-muted-foreground">Show:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
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
                  <span className="text-sm text-muted-foreground">per page</span>
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
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
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
                        {currentPage > 3 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                      </>
                    )}

                    {/* Current page and surrounding pages */}
                    {(() => {
                      const pages = [];
                      const startPage = Math.max(1, currentPage - 1);
                      const endPage = Math.min(totalPages, currentPage + 1);

                      for (let page = startPage; page <= endPage; page++) {
                        pages.push(page);
                      }

                      return pages.map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
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
                        Previous
                        <ChevronLeft className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role-based content example */}
        <RoleBased roles={['ADMIN', 'MANAGER']}>
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>
                Additional actions available for administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Can action="import" subject="Employee">
                  <Button variant="outline">
                    <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    Import Employees
                  </Button>
                </Can>

                <Can action="manage" subject="Department">
                  <Button variant="outline">
                    Manage Departments
                  </Button>
                </Can>
              </div>
            </CardContent>
          </Card>
        </RoleBased>

        {/* View Employee Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
              <DialogDescription>
                View detailed information about the employee
              </DialogDescription>
            </DialogHeader>
            {selectedEmployee && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>File Number</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.file_number || 'N/A'}</p>
                </div>
                <div>
                  <Label>Full Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.full_name || 'N/A'}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.email || 'N/A'}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label>Department</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.department || 'N/A'}</p>
                </div>
                <div>
                  <Label>Designation</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.designation || 'N/A'}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedEmployee.status === 'active' ? 'default' : 'secondary'}>
                    {selectedEmployee.status || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <Label>Hire Date</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.hire_date || 'N/A'}</p>
                </div>
                <div>
                  <Label>Basic Salary</Label>
                  <p className="text-sm text-muted-foreground">${selectedEmployee.basic_salary || 'N/A'}</p>
                </div>
                <div>
                  <Label>Nationality</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.nationality || 'N/A'}</p>
                </div>
                <div>
                  <Label>Hourly Rate</Label>
                  <p className="text-sm text-muted-foreground">${selectedEmployee.hourly_rate || 'N/A'}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Employee Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update employee information
              </DialogDescription>
            </DialogHeader>
            {selectedEmployee && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="file_number">File Number</Label>
                  <Input id="file_number" defaultValue={selectedEmployee.file_number || ''} disabled />
                </div>
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" defaultValue={selectedEmployee.first_name || ''} />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" defaultValue={selectedEmployee.last_name || ''} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={selectedEmployee.email || ''} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue={selectedEmployee.phone || ''} />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select defaultValue={selectedEmployee.department || ''}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input id="designation" defaultValue={selectedEmployee.designation || ''} />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue={selectedEmployee.status || ''}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input id="hire_date" type="date" defaultValue={selectedEmployee.hire_date || ''} />
                </div>
                <div>
                  <Label htmlFor="basic_salary">Basic Salary</Label>
                  <Input id="basic_salary" type="number" defaultValue={selectedEmployee.basic_salary || ''} />
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate</Label>
                  <Input id="hourly_rate" type="number" step="0.01" defaultValue={selectedEmployee.hourly_rate || ''} />
                </div>
                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input id="nationality" defaultValue={selectedEmployee.nationality || ''} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('Employee updated successfully');
                setIsEditModalOpen(false);
                fetchEmployees();
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Employee Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Enter employee information to create a new employee record
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new_file_number">File Number *</Label>
                <Input id="new_file_number" placeholder="Enter file number" />
              </div>
              <div>
                <Label htmlFor="new_first_name">First Name *</Label>
                <Input id="new_first_name" placeholder="Enter first name" />
              </div>
              <div>
                <Label htmlFor="new_last_name">Last Name *</Label>
                <Input id="new_last_name" placeholder="Enter last name" />
              </div>
              <div>
                <Label htmlFor="new_email">Email</Label>
                <Input id="new_email" type="email" placeholder="Enter email" />
              </div>
              <div>
                <Label htmlFor="new_phone">Phone</Label>
                <Input id="new_phone" placeholder="Enter phone number" />
              </div>
              <div>
                <Label htmlFor="new_department">Department</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new_designation">Designation</Label>
                <Input id="new_designation" placeholder="Enter designation" />
              </div>
              <div>
                <Label htmlFor="new_status">Status</Label>
                <Select defaultValue="active">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new_hire_date">Hire Date</Label>
                <Input id="new_hire_date" type="date" />
              </div>
              <div>
                <Label htmlFor="new_basic_salary">Basic Salary</Label>
                <Input id="new_basic_salary" type="number" placeholder="5000" />
              </div>
              <div>
                <Label htmlFor="new_hourly_rate">Hourly Rate</Label>
                <Input id="new_hourly_rate" type="number" step="0.01" placeholder="25.00" />
              </div>
              <div>
                <Label htmlFor="new_nationality">Nationality</Label>
                <Input id="new_nationality" placeholder="Enter nationality" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('Employee added successfully');
                setIsAddModalOpen(false);
                fetchEmployees();
              }}>
                Add Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
