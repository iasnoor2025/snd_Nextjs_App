'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from '@/components/protected-route';
import { Can, CanAny, RoleBased, AccessDenied } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Employee {
  id: number;
  file_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  department: string;
  designation: string;
  status: string;
  hire_date: string | null;
  basic_salary: number;
  phone?: string;
  nationality?: string;
  hourly_rate: number;
}

export default function EmployeeManagementPage() {
  const { t } = useTranslation(['common']);
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
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

  // Get allowed actions for employee management
  const allowedActions = getAllowedActions('Employee');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setEmployees(result.data);
          setFilteredEmployees(result.data);
        } else {
          setEmployees([]);
          setFilteredEmployees([]);
          toast.error('Invalid response format from server');
        }
      } else {
        setEmployees([]);
        setFilteredEmployees([]);
        toast.error('Failed to fetch employees');
      }
    } catch (error) {
      setEmployees([]);
      setFilteredEmployees([]);
      toast.error('Failed to fetch employees');
    } finally {
      setIsLoading(false);
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
        toast.success(result.message);
        await fetchEmployees(); // Refresh the list
      } else {
        toast.error('Failed to sync employees');
      }
    } catch (error) {
      toast.error('Failed to sync employees');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.full_name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`Employee ${employee.full_name} deleted successfully`);
        await fetchEmployees(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete employee');
      }
    } catch (error) {
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

    let filtered = employees.filter(employee => {
      const matchesSearch =
        employee.file_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof Employee];
      let bValue: any = b[sortField as keyof Employee];

      if (sortField === 'file_number') {
        return sortDirection === 'asc'
          ? naturalSort(aValue, bValue)
          : naturalSort(bValue, aValue);
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
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
  }, [searchTerm, statusFilter, departmentFilter, sortField, sortDirection, itemsPerPage]);

  if (isLoading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Employee' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading employees...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Employee' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Employee Management</h1>
            <p className="text-muted-foreground">
              Manage employee information and sync with ERPNext
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Can action="sync" subject="Employee">
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isSyncing ? 'Syncing...' : 'Sync with ERPNext'}
              </Button>
            </Can>

            <Can action="create" subject="Employee">
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </Can>

            <Can action="export" subject="Employee">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </Can>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee List</CardTitle>
            <CardDescription>
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} employees
            </CardDescription>
          </CardHeader>
          <CardContent>
                          <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
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
                      <div className="flex items-center gap-1">
                        File Number
                        {getSortIcon('file_number')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('full_name')}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {getSortIcon('full_name')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-1">
                        Email
                        {getSortIcon('email')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('department')}
                    >
                      <div className="flex items-center gap-1">
                        Department
                        {getSortIcon('department')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('hireDate')}
                    >
                      <div className="flex items-center gap-1">
                        Hire Date
                        {getSortIcon('hireDate')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                            ? 'No employees match your filters.'
                            : 'No employees found.'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-mono">{employee.file_number}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {employee.full_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.designation}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{employee.hire_date || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Can action="read" subject="Employee">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewEmployee(employee)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Can>

                            <Can action="read" subject="Employee">
                              <Link href={`/modules/employee-management/${employee.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </Can>

                            <Can action="update" subject="Employee">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEmployee(employee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Can>

                            <Can action="delete" subject="Employee">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleDeleteEmployee(employee)}
                                disabled={isDeleting}
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
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {totalPages > 1 ? `Page ${currentPage} of ${totalPages}` : `Showing ${totalItems} employees`}
                </div>
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
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
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
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
              <div className="flex gap-2">
                <Can action="import" subject="Employee">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
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
                  <p className="text-sm text-muted-foreground">{selectedEmployee.file_number}</p>
                </div>
                <div>
                  <Label>Full Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.full_name}</p>
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
                  <p className="text-sm text-muted-foreground">{selectedEmployee.department}</p>
                </div>
                <div>
                  <Label>Designation</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.designation}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedEmployee.status === 'active' ? 'default' : 'secondary'}>
                    {selectedEmployee.status}
                  </Badge>
                </div>
                <div>
                  <Label>Hire Date</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.hire_date || 'N/A'}</p>
                </div>
                <div>
                  <Label>Basic Salary</Label>
                  <p className="text-sm text-muted-foreground">${selectedEmployee.basic_salary}</p>
                </div>
                <div>
                  <Label>Nationality</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.nationality || 'N/A'}</p>
                </div>
                <div>
                  <Label>Hourly Rate</Label>
                  <p className="text-sm text-muted-foreground">${selectedEmployee.hourly_rate}</p>
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
                  <Input id="file_number" defaultValue={selectedEmployee.file_number} disabled />
                </div>
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" defaultValue={selectedEmployee.first_name} />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" defaultValue={selectedEmployee.last_name} />
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
                  <Select defaultValue={selectedEmployee.department}>
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
                  <Input id="designation" defaultValue={selectedEmployee.designation} />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue={selectedEmployee.status}>
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
                  <Input id="basic_salary" type="number" defaultValue={selectedEmployee.basic_salary} />
                </div>
                <div>
                  <Label htmlFor="basic_salary">Hourly Rate</Label>
                  <Input id="hourly_rate" type="number" step="0.01" defaultValue={selectedEmployee.hourly_rate} />
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
