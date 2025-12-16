'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { useRBAC } from '@/lib/rbac/rbac-context';
import { format } from 'date-fns';
import {
    Briefcase,
    Edit,
    Plus,
    RefreshCw,
    Search,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useI18n } from '@/hooks/use-i18n';

interface Assignment {
    id: number;
    name: string;
    type: string;
    location?: string;
    start_date: string;
    end_date?: string;
    status: string;
    notes?: string;
    project_id?: number;
    rental_id?: number;
    employee_id?: number;
    employee?: {
        id: number;
        name: string;
        fileNumber?: string;
    };
    project?: {
        id: number;
        name: string;
    };
    rental?: {
        id: number;
        rental_number: string;
        project_name: string;
    };
    created_at: string;
    updated_at: string;
}

interface ApiAssignment {
    id: number;
    employeeId: number;
    projectId?: number;
    assignmentType: string;
    status: string;
    startDate: string;
    endDate?: string;
    name?: string;
    location?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    employee?: {
        id: number;
        firstName: string;
        lastName: string;
        fileNumber: string;
        userId: number;
    };
    project?: {
        id: number;
        name: string;
    };
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

interface ManualAssignmentSectionProps {
    employeeId?: number;
    onHideSection?: () => void;
    allowAllEmployees?: boolean;
}

export default function ManualAssignmentSection({ employeeId: propEmployeeId, onHideSection, allowAllEmployees = false }: ManualAssignmentSectionProps) {
    const { hasPermission } = useRBAC();
    const { data: session } = useSession();
    const { t } = useI18n();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
    const [allEmployees, setAllEmployees] = useState<Array<{ id: number, name: string, fileNumber: string }>>([]);
    const [showAllEmployees, setShowAllEmployees] = useState(false);
    const [fetchingEmployees, setFetchingEmployees] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Form state
    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        type: 'manual',
        location: '',
        start_date: '',
        end_date: '',
        status: 'active',
        notes: '',
    });
    const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
    const [selectedEmployeeFileNumber, setSelectedEmployeeFileNumber] = useState<string>('');



    useEffect(() => {
        // If propEmployeeId is provided, use it; otherwise try to get from session
        if (propEmployeeId) {
            setCurrentEmployeeId(propEmployeeId);
        } else if (session?.user?.id) {
            // Try to get employee ID from session
            fetchEmployeeIdFromSession();
        }
    }, [propEmployeeId, session]);

    useEffect(() => {
        if (allowAllEmployees) {
            fetchAssignments();
        } else if (currentEmployeeId) {
            fetchAssignments();
        }
    }, [currentEmployeeId, allowAllEmployees]);



    useEffect(() => {
        // Filter assignments based on search term and status (only show active)
        if (searchTerm.trim() === '') {
            // Show only active assignments when no search term
            const activeAssignments = assignments.filter(assignment => assignment.status === 'active');
            setFilteredAssignments(activeAssignments);
            setShowAllEmployees(false);
        } else {
            const searchLower = searchTerm.toLowerCase().trim();
            const searchTrimmed = searchTerm.trim();
            
            // Check if search term is a potential exact file number match
            const isExactFileNumberSearch = /^\d+$/.test(searchTrimmed);
            
            // If searching for exact file number, check for exact match first
            if (isExactFileNumberSearch && allowAllEmployees) {
                // Ensure employees are fetched first
                if (allEmployees.length === 0 && !fetchingEmployees) {
                    fetchAllEmployees();
                    // Return early - will re-run when employees are loaded
                    return;
                }
                
                // Check if there's an employee with exact file number
                const exactFileNumberEmployee = allEmployees.find(emp => 
                    String(emp.fileNumber || '').trim() === searchTrimmed
                );
                
                if (exactFileNumberEmployee) {
                    // Check if this employee has any active assignments
                    const exactFileNumberAssignments = assignments.filter(assignment =>
                        assignment.status === 'active' &&
                        assignment.employee_id === exactFileNumberEmployee.id
                    );
                    
                    if (exactFileNumberAssignments.length > 0) {
                        // Employee has assignments - show only their assignments
                        setFilteredAssignments(exactFileNumberAssignments);
                        setShowAllEmployees(false);
                    } else {
                        // Employee exists but has no active assignments - show employee view
                        setShowAllEmployees(true);
                        setFilteredAssignments([]);
                    }
                    setCurrentPage(1);
                    return;
                }
            }
            
            // Regular search - filter assignments
            let filteredAssignments: Assignment[] = [];
            
            if (isExactFileNumberSearch) {
                // For numeric searches, prioritize exact file number matches in assignments
                const exactFileNumberAssignments = assignments.filter(assignment =>
                    assignment.status === 'active' &&
                    assignment.employee?.fileNumber &&
                    String(assignment.employee.fileNumber).trim() === searchTrimmed
                );
                
                if (exactFileNumberAssignments.length > 0) {
                    // Found exact file number match - show only those
                    filteredAssignments = exactFileNumberAssignments;
                } else {
                    // No exact match found - show empty (will show employee view instead)
                    filteredAssignments = [];
                }
            } else {
                // For non-numeric searches, do regular matching
                filteredAssignments = assignments.filter(assignment =>
                    assignment.status === 'active' && (
                        assignment.name?.toLowerCase().includes(searchLower) ||
                        assignment.employee?.name?.toLowerCase().includes(searchLower) ||
                        assignment.type?.toLowerCase().includes(searchLower) ||
                        assignment.status?.toLowerCase().includes(searchLower) ||
                        assignment.notes?.toLowerCase().includes(searchLower) ||
                        // Search by employee file number if available
                        (assignment.employee?.fileNumber && assignment.employee.fileNumber.toLowerCase().includes(searchLower))
                    )
                );
            }

            // If we found assignments, show them
            if (filteredAssignments.length > 0) {
                setFilteredAssignments(filteredAssignments);
                setShowAllEmployees(false);
            } else {
                // If no assignments match, search through all employees
                setShowAllEmployees(true);
                setFilteredAssignments([]);
                // Fetch employees if not already fetched and we need to show them
                if (allowAllEmployees && allEmployees.length === 0 && !fetchingEmployees) {
                    fetchAllEmployees();
                }
            }
        }
        
        // Reset to first page when search term changes
        setCurrentPage(1);
    }, [assignments, searchTerm, allEmployees, allowAllEmployees, fetchingEmployees]);

    // Fetch all employees for search - fetch immediately when allowAllEmployees is true
    useEffect(() => {
        if (allowAllEmployees && allEmployees.length === 0 && !fetchingEmployees) {
            fetchAllEmployees();
        }
    }, [allowAllEmployees, allEmployees.length, fetchingEmployees]);

        const fetchAllEmployees = async () => {
      try {
        setFetchingEmployees(true);
        // Fetch all employees without pagination limits
        const response = await fetch('/api/employees?limit=1000&page=1');
        if (response.ok) {
            const data = await response.json();
            
            // Check if we need to fetch more pages
            let allEmployeesData = data.data || [];
            const totalPages = data.meta?.totalPages || data.last_page || 1;
            
            // If there are more pages, fetch them all
            if (totalPages > 1) {
                for (let page = 2; page <= totalPages; page++) {
                    const nextResponse = await fetch(`/api/employees?limit=1000&page=${page}`);
                    if (nextResponse.ok) {
                        const nextData = await nextResponse.json();
                        allEmployeesData = [...allEmployeesData, ...(nextData.data || [])];
                    }
                }
            }
            
            const employees = allEmployeesData.map((emp: any) => ({
                id: emp.id,
                name: `${emp.first_name || emp.firstName || ''} ${emp.last_name || emp.lastName || ''}`.trim() || 'Unknown Employee',
                fileNumber: String(emp.file_number || emp.employee_id || emp.fileNumber || emp.employeeNumber || emp.empCode || emp.code || '').trim()
            }));
            setAllEmployees(employees);
        } else {
            console.error('Failed to fetch employees:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch all employees:', error);
      } finally {
        setFetchingEmployees(false);
      }
    };

    const fetchEmployeeIdFromSession = async () => {
        try {
            const response = await fetch('/api/employee-dashboard');
            if (response.ok) {
                const data = await response.json();
                if (data.employee?.id) {
                    setCurrentEmployeeId(data.employee.id);
                } else {
                    setError('Employee not found');
                    setLoading(false);
                }
            } else {
                setError('Failed to fetch employee data');
                setLoading(false);
            }
        } catch (error) {
            setError('Failed to fetch employee data');
            setLoading(false);
        }
    };

    // Pagination functions
    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Calculate pagination data
    const getCurrentPageData = () => {
        if (showAllEmployees) {
            const filteredEmployees = allEmployees.filter(emp => {
                if (!searchTerm) return true;
                const searchTrimmed = searchTerm.trim();
                const searchLower = searchTerm.toLowerCase().trim();
                
                // Check if search is a number (potential exact file number match)
                const isNumericSearch = /^\d+$/.test(searchTrimmed);
                
                if (isNumericSearch) {
                    // For numeric searches, only show exact file number match
                    const fileNumberStr = String(emp.fileNumber || '').trim();
                    return fileNumberStr === searchTrimmed;
                } else {
                    // For non-numeric searches, do regular matching
                    const nameMatch = emp.name.toLowerCase().includes(searchLower);
                    const fileNumberStr = String(emp.fileNumber || '').toLowerCase().trim();
                    const fileNumberMatch = fileNumberStr.includes(searchLower);
                    return nameMatch || fileNumberMatch;
                }
            });
            
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            return filteredEmployees.slice(startIndex, endIndex);
        } else {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            return filteredAssignments.slice(startIndex, endIndex);
        }
    };

    // Get paginated employees data
    const getCurrentPageEmployees = () => {
        const filteredEmployees = allEmployees.filter(emp => {
            if (!searchTerm) return true;
            const searchTrimmed = searchTerm.trim();
            const searchLower = searchTerm.toLowerCase().trim();
            
            // Check if search is a number (potential exact file number match)
            const isNumericSearch = /^\d+$/.test(searchTrimmed);
            
            if (isNumericSearch) {
                // For numeric searches, only show exact file number match
                const fileNumberStr = String(emp.fileNumber || '').trim();
                return fileNumberStr === searchTrimmed;
            } else {
                // For non-numeric searches, do regular matching
                const nameMatch = emp.name.toLowerCase().includes(searchLower);
                const fileNumberStr = String(emp.fileNumber || '').toLowerCase().trim();
                const fileNumberMatch = fileNumberStr.includes(searchLower);
                return nameMatch || fileNumberMatch;
            }
        });
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredEmployees.slice(startIndex, endIndex);
    };

    // Get paginated assignments data
    const getCurrentPageAssignments = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAssignments.slice(startIndex, endIndex);
    };

    const getTotalItems = () => {
        if (showAllEmployees) {
            return allEmployees.filter(emp => {
                if (!searchTerm) return true;
                const searchTrimmed = searchTerm.trim();
                const searchLower = searchTerm.toLowerCase().trim();
                
                // Check if search is a number (potential exact file number match)
                const isNumericSearch = /^\d+$/.test(searchTrimmed);
                
                if (isNumericSearch) {
                    // For numeric searches, only show exact file number match
                    const fileNumberStr = String(emp.fileNumber || '').trim();
                    return fileNumberStr === searchTrimmed;
                } else {
                    // For non-numeric searches, do regular matching
                    const nameMatch = emp.name.toLowerCase().includes(searchLower);
                    const fileNumberStr = String(emp.fileNumber || '').toLowerCase().trim();
                    const fileNumberMatch = fileNumberStr.includes(searchLower);
                    return nameMatch || fileNumberMatch;
                }
            }).length;
        } else {
            return filteredAssignments.length;
        }
    };

    // Update total pages when data changes
    useEffect(() => {
        const total = getTotalItems();
        const pages = Math.ceil(total / itemsPerPage);
        setTotalPages(pages);
        
        // Reset to first page if current page is out of bounds
        if (currentPage > pages && pages > 0) {
            setCurrentPage(1);
        }
    }, [filteredAssignments, allEmployees, searchTerm, showAllEmployees]);





    const fetchAssignments = async () => {
        if (allowAllEmployees) {
            // Fetch all employee assignments
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/assignments?limit=1000&page=1');
                if (response.ok) {
                    const data = await response.json();

                    // Map API response to component's expected format
                    const mappedAssignments = (data.data || []).map((assignment: ApiAssignment) => ({
                        id: assignment.id,
                        name: assignment.name || 'Unnamed Assignment',
                        type: assignment.assignmentType || 'manual',
                        location: assignment.location || 'Not specified',
                        start_date: assignment.startDate || '',
                        end_date: assignment.endDate || '',
                        status: assignment.status || 'pending',
                        notes: assignment.notes || '',
                        project_id: assignment.projectId,
                        rental_id: null, // API doesn't have rental_id
                        employee_id: assignment.employeeId,
                        employee: assignment.employee ? {
                            id: assignment.employee.id,
                            name: `${assignment.employee.firstName || ''} ${assignment.employee.lastName || ''}`.trim() || 'Unknown Employee',
                            fileNumber: assignment.employee.fileNumber || ''
                        } : null,
                        project: assignment.project,
                        rental: null,
                        created_at: assignment.createdAt || '',
                        updated_at: assignment.updatedAt || ''
                    }));

                    setAssignments(mappedAssignments);
                } else {
                    const errorData = await response.json();
                    setError(errorData.error || 'Failed to load assignments');
                }
            } catch (error) {
                setError('Failed to load assignments');
            } finally {
                setLoading(false);
            }
            return;
        }

        // Original logic for single employee
        if (!currentEmployeeId) {
            setLoading(false);
            setError('Employee ID not provided');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/employees/${currentEmployeeId}/assignments`);
            if (response.ok) {
                const data = await response.json();
                setAssignments(data.data || []);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to load assignments');
            }
        } catch (error) {
            setError('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };



    const handleCreate = async () => {
        const targetEmployeeId = allowAllEmployees ? formData.employeeId : currentEmployeeId;

        if (!targetEmployeeId) {
            toast.error('Employee ID not provided');
            return;
        }

        if (!formData.name || !formData.start_date) {
            toast.error('Assignment name and start date are required');
            return;
        }

        if (allowAllEmployees && !formData.employeeId) {
            toast.error('Please select an employee');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/api/employees/${targetEmployeeId}/assignments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                // Server handles closing previous assignments; no client-side forcing needed
                toast.success('Assignment created successfully.');
                setShowCreateDialog(false);
                setFormData({
                    employeeId: '',
                    name: '',
                    type: 'manual',
                    location: '',
                    start_date: '',
                    end_date: '',
                    status: 'active',
                    notes: '',
                });
                setSelectedEmployeeName('');
                setSelectedEmployeeFileNumber('');
                fetchAssignments();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to create assignment');
            }
        } catch (error) {
            toast.error('Failed to create assignment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async () => {
        if (!currentEmployeeId) {
            toast.error('Employee ID not provided');
            return;
        }

        if (!selectedAssignment || !formData.name || !formData.start_date) {
            toast.error('Assignment name and start date are required');
            return;
        }

        setSubmitting(true);
        try {
            const targetEmployeeIdForEdit = allowAllEmployees && selectedAssignment?.employee_id
                ? selectedAssignment.employee_id
                : currentEmployeeId;

            const response = await fetch(`/api/employees/${targetEmployeeIdForEdit}/assignments/${selectedAssignment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    type: formData.type,
                    location: formData.location,
                    startDate: formData.start_date,
                    endDate: formData.end_date,
                    status: formData.status,
                    notes: formData.notes,
                }),
            });

            if (response.ok) {
                toast.success('Assignment updated successfully');
                setShowEditDialog(false);
                setSelectedAssignment(null);
                setFormData({
                    employeeId: '',
                    name: '',
                    type: 'manual',
                    location: '',
                    start_date: '',
                    end_date: '',
                    status: 'active',
                    notes: '',
                });
                setSelectedEmployeeName('');
                setSelectedEmployeeFileNumber('');
                fetchAssignments();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to update assignment');
            }
        } catch (error) {
            toast.error('Failed to update assignment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedAssignment) return;

        setDeletingId(selectedAssignment.id);
        try {
            // First, delete the current assignment
            const response = await fetch('/api/assignments', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: selectedAssignment.id
                }),
            });

            if (response.ok) {
                // If this was an active assignment, find and activate the next completed assignment
                if (selectedAssignment.status === 'active' && selectedAssignment.employee_id) {
                    // Find the most recent completed assignment for this employee
                    const completedAssignments = assignments.filter(a => 
                        a.employee_id === selectedAssignment.employee_id && 
                        a.status === 'completed' &&
                        a.id !== selectedAssignment.id
                    );

                    if (completedAssignments.length > 0) {
                        // Sort by creation date to get the most recent
                        const mostRecentCompleted = completedAssignments.sort((a, b) => 
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        )[0];

                        // Update the most recent completed assignment to active and remove end date
                        if (mostRecentCompleted) {
                            try {
                                await fetch('/api/assignments', {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        id: mostRecentCompleted.id,
                                        status: 'active',
                                        end_date: null, // Remove end date
                                        employeeId: mostRecentCompleted.employee_id,
                                        assignmentType: mostRecentCompleted.type,
                                        startDate: mostRecentCompleted.start_date,
                                        notes: mostRecentCompleted.notes,
                                        projectId: mostRecentCompleted.project_id
                                    }),
                                });
                            } catch (updateError) {
                                console.warn('Failed to activate previous assignment:', updateError);
                            }
                        }
                    }
                }

                toast.success('Assignment deleted successfully');
                setShowDeleteDialog(false);
                setSelectedAssignment(null);
                fetchAssignments();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to delete assignment');
            }
        } catch (error) {
            toast.error('Failed to delete assignment');
        } finally {
            setDeletingId(null);
        }
    };

    const openEditDialog = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setFormData({
            employeeId: currentEmployeeId?.toString() || '',
            name: assignment.name,
            type: assignment.type,
            location: assignment.location || '',
            start_date: assignment.start_date,
            end_date: assignment.end_date || '',
            status: assignment.status,
            notes: assignment.notes || '',
        });
        setShowEditDialog(true);
    };

    const openDeleteDialog = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setShowDeleteDialog(true);
    };

    const openNewAssignmentDialog = (assignment: Assignment) => {
        // Pre-fill the form with the employee ID from the selected assignment
        setFormData({
            employeeId: assignment.employee_id?.toString() || '',
            name: '',
            type: 'manual',
            location: '',
            start_date: '',
            end_date: '',
            status: 'active',
            notes: '',
        });
        setShowCreateDialog(true);
    };



    const getStatusBadge = (status: string) => {
        if (!status) return null;

        const statusColors: { [key: string]: string } = {
            active: 'bg-green-100 text-green-800',
            completed: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800',
        };

        return (
            <Badge className={statusColors[status] || statusColors.pending}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const getTypeBadge = (type: string) => {
        if (!type) return null;

        const typeColors: { [key: string]: string } = {
            manual: 'bg-gray-100 text-gray-800',
            project: 'bg-blue-100 text-blue-800',
            rental: 'bg-purple-100 text-purple-800',
            rental_item: 'bg-purple-100 text-purple-800',
        };

        return (
            <Badge className={typeColors[type] || typeColors.manual}>
                {type === 'rental_item' ? 'Rental' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
        );
    };

    const isValidDate = (dateString: string) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    };

    const formatDate = (dateString: string) => {
        if (!isValidDate(dateString)) return 'Invalid date';
        return format(new Date(dateString), 'MMM d, yyyy');
    };



    if (!currentEmployeeId) {
        return (
            <div className="mb-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" />
                                    {t('dashboard.manualAssignments.title')}
                                </CardTitle>
                                <CardDescription>
                                    {allowAllEmployees
                                        ? t('dashboard.manualAssignments.description')
                                        : t('dashboard.manualAssignments.descriptionSingle')
                                    }
                                </CardDescription>
                            </div>
                            {onHideSection && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onHideSection}
                                    className="text-xs"
                                >
                                    {t('dashboard.manualAssignments.hideSection')}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">{t('dashboard.manualAssignments.employeeIdRequired')}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.manualAssignments.employeeIdRequiredDescription')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">{t('dashboard.manualAssignments.loadingAssignments')}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <div className="text-center">
                    <div className="font-medium text-red-600">{t('dashboard.manualAssignments.errorLoadingAssignments')}</div>
                    <div className="mt-1 text-sm text-red-600">{error}</div>
                    <div className="mt-4 flex justify-center">
                        <Button variant="outline" onClick={fetchAssignments} className="bg-white">
                            <RefreshCw className="mr-2 h-4 w-4" /> {t('dashboard.manualAssignments.tryAgain')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }



    return (
        <div className="mb-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5" />
                                {t('dashboard.manualAssignments.title')}
                            </CardTitle>
                            <CardDescription>
                                {allowAllEmployees
                                    ? t('dashboard.manualAssignments.description')
                                    : t('dashboard.manualAssignments.descriptionSingle')
                                }
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {onHideSection && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onHideSection}
                                    className="text-xs"
                                >
                                    {t('dashboard.manualAssignments.hideSection')}
                                </Button>
                            )}
                            {hasPermission('create', 'employee-assignment') && (
                                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Add New Assignment</DialogTitle>
                                            <DialogDescription>
                                                {allowAllEmployees ? 'Create a new assignment for the selected employee' : 'Create a new assignment for yourself'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            {allowAllEmployees && selectedEmployeeName && (
                                                <div>
                                                    <Label>Employee</Label>
                                                    <div className="p-3 bg-muted rounded-md border">
                                                        <span className="font-medium">{selectedEmployeeName}</span>
                                                        <span className="ml-2 text-sm text-muted-foreground">
                                                            (File: {selectedEmployeeFileNumber})
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <Label htmlFor="name">Assignment Name *</Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder="Enter assignment name"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="type">Assignment Type</Label>
                                                <Select
                                                    value={formData.type}
                                                    onValueChange={value => setFormData(prev => ({ ...prev, type: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select assignment type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="manual">Manual</SelectItem>
                                                        <SelectItem value="project">Project</SelectItem>
                                                        <SelectItem value="rental">Rental</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="location">Location</Label>
                                                <Input
                                                    id="location"
                                                    value={formData.location}
                                                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                                    placeholder="Enter location"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="start_date">Start Date *</Label>
                                                    <Input
                                                        id="start_date"
                                                        type="date"
                                                        value={formData.start_date}
                                                        onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="end_date">End Date</Label>
                                                    <Input
                                                        id="end_date"
                                                        type="date"
                                                        value={formData.end_date}
                                                        onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="status">Status</Label>
                                                <Select
                                                    value={formData.status}
                                                    onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="notes">Notes</Label>
                                                <Textarea
                                                    id="notes"
                                                    value={formData.notes}
                                                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                                    placeholder="Enter notes (optional)"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleCreate}
                                                disabled={submitting || !formData.name || !formData.start_date || (allowAllEmployees && !formData.employeeId)}
                                            >
                                                {submitting ? (
                                                    <>
                                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Create
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {assignments.length > 0 ? (
                        <div className="space-y-4">
                            {/* Search Bar */}
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('dashboard.manualAssignments.searchPlaceholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {t('dashboard.manualAssignments.assignmentsCount', { 
                                        filtered: String(filteredAssignments.length), 
                                        total: String(assignments.filter(a => a.status === 'active').length) 
                                    })}
                                </div>
                            </div>



                            {/* Dynamic Table - Shows Assignments or All Employees */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/50">
                                            <th className="text-left p-3 font-medium text-sm text-foreground">{t('dashboard.manualAssignments.tableHeaders.fileNumber')}</th>
                                            <th className="text-left p-3 font-medium text-sm text-foreground">{t('dashboard.manualAssignments.tableHeaders.employeeName')}</th>
                                            {!showAllEmployees && (
                                                <>
                                                    <th className="text-left p-3 font-medium text-sm text-foreground">{t('dashboard.manualAssignments.tableHeaders.assignment')}</th>
                                                    <th className="text-left p-3 font-medium text-sm text-foreground">{t('dashboard.manualAssignments.tableHeaders.type')}</th>
                                                    <th className="text-left p-3 font-medium text-sm text-foreground">{t('dashboard.manualAssignments.tableHeaders.location')}</th>
                                                    <th className="text-left p-3 font-medium text-sm text-foreground">{t('dashboard.manualAssignments.tableHeaders.startDate')}</th>
                                                    <th className="text-left p-3 font-medium text-sm text-foreground">{t('dashboard.manualAssignments.tableHeaders.endDate')}</th>
                                                    <th className="text-left p-3 font-medium text-sm text-foreground">{t('dashboard.manualAssignments.tableHeaders.status')}</th>
                                                </>
                                            )}
                                            <th className="text-left p-3 font-medium text-sm text-foreground">{t('dashboard.manualAssignments.tableHeaders.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {showAllEmployees ? (
                                            fetchingEmployees ? (
                                                <tr>
                                                    <td colSpan={3} className="p-8 text-center text-muted-foreground">
                                                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                                        Loading employees...
                                                    </td>
                                                </tr>
                                            ) : getCurrentPageEmployees().length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="p-8 text-center text-muted-foreground">
                                                        No employees found matching "{searchTerm}"
                                                    </td>
                                                </tr>
                                            ) : (
                                                // Show paginated employees when searching
                                                getCurrentPageEmployees().map(employee => (
                                                    <tr key={employee.id} className="border-b border-border hover:bg-muted/20">
                                                        <td className="p-3 text-sm text-foreground">
                                                            <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                                                                {employee.fileNumber || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-sm text-foreground">
                                                            <span className="font-medium">{employee.name}</span>
                                                        </td>
                                                        <td className="p-3 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                {hasPermission('create', 'employee-assignment') && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        onClick={() => {
                                                                            setFormData({
                                                                                employeeId: employee.id.toString(),
                                                                                name: '',
                                                                                type: 'manual',
                                                                                location: '',
                                                                                start_date: '',
                                                                                end_date: '',
                                                                                status: 'active',
                                                                                notes: '',
                                                                            });
                                                                            setSelectedEmployeeName(employee.name);
                                                                            setSelectedEmployeeFileNumber(employee.fileNumber);
                                                                            setShowCreateDialog(true);
                                                                        }}
                                                                    >
                                                                        <Plus className="mr-1 h-3 w-3" />
                                                                        {t('dashboard.manualAssignments.actions.assign')}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )
                                        ) : (
                                            // Show paginated assignments
                                            getCurrentPageAssignments().map(assignment => (
                                                <tr key={assignment.id} className="border-b border-border hover:bg-muted/20">
                                                    <td className="p-3 text-sm text-foreground">
                                                        <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                                                            {assignment.employee?.fileNumber || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-sm text-foreground">
                                                        {allowAllEmployees && assignment.employee ? (
                                                            <span className="font-medium">{assignment.employee.name}</span>
                                                        ) : assignment.employee_id ? (
                                                            <span className="text-muted-foreground">Employee #{assignment.employee_id}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">Current User</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-sm text-foreground">
                                                        <div className="font-medium">{assignment.name || 'Unnamed Assignment'}</div>
                                                        {assignment.notes && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {assignment.notes}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-sm text-foreground">
                                                        {getTypeBadge(assignment.type) || <span className="text-muted-foreground">Unknown</span>}
                                                    </td>
                                                    <td className="p-3 text-sm text-foreground">
                                                        {assignment.location || 'Not specified'}
                                                    </td>
                                                    <td className="p-3 text-sm text-foreground">
                                                        {assignment.start_date ? formatDate(assignment.start_date) : 'Not set'}
                                                    </td>
                                                    <td className="p-3 text-sm text-foreground">
                                                        {assignment.end_date ? formatDate(assignment.end_date) : 'Ongoing'}
                                                    </td>
                                                    <td className="p-3 text-sm text-foreground">
                                                        {getStatusBadge(assignment.status) || <span className="text-muted-foreground">Unknown</span>}
                                                    </td>
                                                    <td className="p-3 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            {hasPermission('update', 'employee-assignment') && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => openEditDialog(assignment)}
                                                                >
                                                                    <Edit className="mr-1 h-3 w-3" />
                                                                    {t('dashboard.manualAssignments.actions.edit')}
                                                                </Button>
                                                            )}
                                                            {hasPermission('create', 'employee-assignment') && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    onClick={() => openNewAssignmentDialog(assignment)}
                                                                >
                                                                    {t('dashboard.manualAssignments.actions.newAssignment')}
                                                                </Button>
                                                            )}
                                                            {hasPermission('delete', 'employee-assignment') && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => openDeleteDialog(assignment)}
                                                                >
                                                                    <Trash2 className="mr-1 h-3 w-3" />
                                                                    {t('dashboard.manualAssignments.actions.delete')}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary */}
                            <div className="text-center text-sm text-muted-foreground">
                                {showAllEmployees ? (
                                    <>
                                        Total: {getTotalItems()} employee{getTotalItems() !== 1 ? 's' : ''} found
                                        {searchTerm && (
                                            <span className="ml-2 text-xs">
                                                (searching all employees)
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        Total: {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
                                        {searchTerm && (
                                            <span className="ml-2 text-xs">
                                                (filtered from {assignments.filter(a => a.status === 'active').length} active)
                                            </span>
                                        )}
                                        {filteredAssignments.length > itemsPerPage && (
                                            <span className="ml-2 text-xs">(page {currentPage} of {totalPages})</span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Pagination Controls */}
                            {(totalPages > 1) && (
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToPreviousPage}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => goToPage(page)}
                                                className="w-8 h-8 p-0"
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                            
                            {/* Page Info - Always show when there are items */}
                            {getTotalItems() > 0 && (
                                <div className="text-center text-xs text-muted-foreground mt-2">
                                    {showAllEmployees && totalPages > 1 ? (
                                        <>Page {currentPage} of {totalPages} • </>
                                    ) : !showAllEmployees && filteredAssignments.length > itemsPerPage ? (
                                        <>Page {currentPage} of {totalPages} • </>
                                    ) : null}
                                    {showAllEmployees ? (
                                        <>Showing {Math.min(itemsPerPage, getCurrentPageData().length)} of {getTotalItems()} items</>
                                    ) : (
                                        filteredAssignments.length > itemsPerPage ? (
                                            <>Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredAssignments.length)} of {filteredAssignments.length} assignments</>
                                        ) : (
                                            <>Showing all {filteredAssignments.length} assignments</>
                                        )
                                    )}
                                </div>
                            )}


                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium mb-2">{t('dashboard.manualAssignments.noAssignmentsFound')}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {allowAllEmployees
                                    ? t('dashboard.manualAssignments.noAssignmentsDescription')
                                    : t('dashboard.manualAssignments.noAssignmentsDescriptionSingle')
                                }
                            </p>
                            {hasPermission('create', 'employee-assignment') && (
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('dashboard.manualAssignments.createFirstAssignment')}
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Assignment</DialogTitle>
                        <DialogDescription>Update assignment details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Assignment Name *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter assignment name"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-type">Assignment Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={value => setFormData(prev => ({ ...prev, type: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select assignment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">Manual</SelectItem>
                                    <SelectItem value="project">Project</SelectItem>
                                    <SelectItem value="rental">Rental</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit-location">Location</Label>
                            <Input
                                id="edit-location"
                                value={formData.location}
                                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Enter location"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-start-date">Start Date *</Label>
                                <Input
                                    id="edit-start-date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-end-date">End Date</Label>
                                <Input
                                    id="edit-end-date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="edit-status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit-notes">Notes</Label>
                            <Textarea
                                id="edit-notes"
                                value={formData.notes}
                                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Enter notes (optional)"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEdit}
                            disabled={submitting || !formData.name || !formData.start_date}
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Update
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Assignment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this assignment? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deletingId !== null}>
                            {deletingId !== null ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
