'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, Calendar, Clock, Plus, User } from 'lucide-react';
import { useRouter , useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  assignments?: Assignment[];
}

interface Assignment {
  id: string;
  type: string;
  name: string;
  projectId?: string;
  rentalId?: string;
  project?: {
    id: string;
    name: string;
  };
  rental?: {
    id: string;
    rentalNumber: string;
    projectName?: string;
  };
}

interface Project {
  id: string;
  name: string;
  location?: string;
}

interface Rental {
  id: string;
  rentalNumber: string;
  equipment?: {
    name: string;
  };
}

interface AssignmentBlock {
  id: number;
  projectId: string;
  rentalId: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export default function CreateTimesheetPage() {
  return (
    <ProtectedRoute>
      <CreateTimesheetContent />
    </ProtectedRoute>
  );
}

function CreateTimesheetContent() {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const router = useRouter();
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Assignment creation popup state
  const [showAssignmentPopup, setShowAssignmentPopup] = useState(false);
  const [selectedEmployeeForAssignment, setSelectedEmployeeForAssignment] =
    useState<Employee | null>(null);
  const [newAssignmentData, setNewAssignmentData] = useState({
    type: 'manual',
    name: '',
    projectId: '',
    rentalId: '',
    location: '',
    notes: '',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<any>({});

  // Form data for single timesheet
  const [data, setData] = useState({
    employeeId: '',
    assignmentId: 'none',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: '8',
    overtimeHours: '0',
    projectId: 'none',
    rentalId: 'none',
    description: '',
    tasksCompleted: '',
    startTime: '08:00',
    endTime: '17:00',
  });

  // Bulk mode data
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  );
  const [dailyOvertimeHours, setDailyOvertimeHours] = useState<Record<string, string>>({});
  const [dailyNormalHours, setDailyNormalHours] = useState<Record<string, string>>({});
  const [assignmentBlocks, setAssignmentBlocks] = useState<AssignmentBlock[]>([
    {
      id: 1,
      projectId: 'none',
      rentalId: 'none',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      description: '',
    },
  ]);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesRes, projectsRes, rentalsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/projects'),
        fetch('/api/rentals'),
      ]);

      // Check if responses are ok before parsing
      if (!employeesRes.ok || !projectsRes.ok || !rentalsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const employeesData = await employeesRes.json();
      const projectsData = await projectsRes.json();
      const rentalsData = await rentalsRes.json();

      // Ensure data is always an array, even if API returns unexpected format
      setEmployees(Array.isArray(employeesData.data) ? employeesData.data : Array.isArray(employeesData) ? employeesData : []);
      setProjects(Array.isArray(projectsData.data) ? projectsData.data : Array.isArray(projectsData) ? projectsData : []);
      setRentals(Array.isArray(rentalsData.data) ? rentalsData.data : Array.isArray(rentalsData) ? rentalsData : []);
    } catch (error) {
      console.error('Failed to load timesheet data:', error);
      toast.error('Failed to load data');
      // Ensure arrays are set to empty arrays on error
      setEmployees([]);
      setProjects([]);
      setRentals([]);
    } finally {
      setLoading(false);
    }
  };

  const setFormData = (key: string, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  // Get available assignments for selected employee
  const selectedEmployee = employees.find(e => e.id === data.employeeId);
  const availableAssignments = selectedEmployee?.assignments || [];

  // Bulk mode helpers
  const generateDailyOvertimeHours = (start: Date, end: Date) => {
    const newDailyOvertimeHours: Record<string, string> = {};
    const newDailyNormalHours: Record<string, string> = {};
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      newDailyOvertimeHours[dateStr] = '0';
      newDailyNormalHours[dateStr] = '8';
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setDailyOvertimeHours(newDailyOvertimeHours);
    setDailyNormalHours(newDailyNormalHours);
  };

  const addAssignmentBlock = () => {
    setAssignmentBlocks(prev => [
      ...prev,
      {
        id: Date.now(),
        projectId: 'none',
        rentalId: 'none',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        description: '',
      },
    ]);
  };

  const removeAssignmentBlock = (id: number) => {
    setAssignmentBlocks(prev => prev.filter(b => b.id !== id));
  };

  const updateAssignmentBlock = (id: number, field: string, value: string) => {
    setAssignmentBlocks(prev => prev.map(b => (b.id === id ? { ...b, [field]: value } : b)));
  };

  // Update daily grid when bulk mode or date range changes
  useEffect(() => {
    if (isBulkMode && startDate && endDate) {
      generateDailyOvertimeHours(startDate, endDate);
    }
  }, [isBulkMode, startDate, endDate]);

  const handleEmployeeChange = (employeeId: string) => {
    setFormData('employeeId', employeeId);
    setFormData('assignmentId', 'none'); // Reset assignment when employee changes
    setFormData('projectId', 'none'); // Reset project when employee changes
    setFormData('rentalId', 'none'); // Reset rental when employee changes

    // Check if employee has assignments
    const employee = employees.find(e => e.id === employeeId);
    if (employee && (!employee.assignments || employee.assignments.length === 0)) {
      setSelectedEmployeeForAssignment(employee);
      setShowAssignmentPopup(true);
    }
  };

  const handleAssignmentChange = (assignmentId: string) => {
    setFormData('assignmentId', assignmentId);
    // Clear project/rental when assignment is selected
    setFormData('projectId', 'none');
    setFormData('rentalId', 'none');
  };

  const handleProjectChange = (projectId: string) => {
    setFormData('projectId', projectId);
  };

  const handleRentalChange = (rentalId: string) => {
    setFormData('rentalId', rentalId);
  };

  // Assignment creation functions
  const redirectToAssignmentPage = () => {
    const type = newAssignmentData.type;
    const employeeId = selectedEmployeeForAssignment?.id;

    if (type === 'project' && newAssignmentData.projectId) {
      router.push(`/${locale}/project-management/projects/${newAssignmentData.projectId}/resources`);
    } else if (type === 'rental' && newAssignmentData.rentalId) {
      router.push(`/${locale}/rental-management/rentals/${newAssignmentData.rentalId}`);
    } else {
      router.push(`/${locale}/employee-management/employees/${employeeId}/assignments/create`);
    }
  };

  const closeAssignmentPopup = () => {
    setShowAssignmentPopup(false);
    setSelectedEmployeeForAssignment(null);
    setNewAssignmentData({
      type: 'manual',
      name: '',
      projectId: '',
      rentalId: '',
      location: '',
      notes: '',
      startDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      // Convert 'none' values back to null for API
      const apiData = {
        employee_id: data.employeeId,
        assignment_id: data.assignmentId === 'none' ? null : data.assignmentId,
        date: data.date,
        hours_worked: data.hoursWorked,
        overtime_hours: data.overtimeHours,
        project_id: data.projectId === 'none' ? null : data.projectId,
        rental_id: data.rentalId === 'none' ? null : data.rentalId,
        description: data.description,
        tasks_completed: data.tasksCompleted,
        start_time: data.startTime,
        end_time: data.endTime,
      };

      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        toast.success('Timesheet created successfully');
        router.push(`/${locale}/timesheet-management`);
      } else {
        const errorData = await response.json();
        setErrors(errorData.errors || {});
        Object.keys(errorData.errors || {}).forEach(key => {
          toast.error(errorData.errors[key][0] || errorData.errors[key]);
        });
      }
    } catch (error) {
      
      toast.error('Failed to create timesheet');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!data.employeeId) {
      toast.error('Please select an employee');
      return;
    }

    setProcessing(true);
    try {
      const assignments: Array<{
        employee_id: string;
        assignment_id: string | null;
        date_from: string;
        date_to: string;
        project_id: string | null;
        rental_id: string | null;
        hours_worked: string;
        overtime_hours: string;
        description: string;
        tasks: string;
        start_time: string;
        end_time: string;
        daily_hours: Record<string, { normal: string; overtime: string }>;
      }> = [];

      // If assignment blocks are empty or invalid, create a default block using bulk date range
      let blocksToProcess = assignmentBlocks;
      if (
        assignmentBlocks.length === 0 ||
        assignmentBlocks.every(block => !block.startDate || !block.endDate)
      ) {
        blocksToProcess = [
          {
            id: 1,
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            projectId: assignmentBlocks[0]?.projectId || 'none',
            rentalId: assignmentBlocks[0]?.rentalId || 'none',
            description: assignmentBlocks[0]?.description || '',
          },
        ];
      }

      for (const block of blocksToProcess) {
        if (!block.startDate || !block.endDate) {
          continue;
        }

        // Get hours for this block's date range
        const current = new Date(block.startDate);
        const end = new Date(block.endDate);
        const blockHours: Record<string, { normal: string; overtime: string }> = {};

        while (current <= end) {
          const dateStr = format(current, 'yyyy-MM-dd');
          const normalHours = dailyNormalHours[dateStr] || '8';
          const overtimeHours = dailyOvertimeHours[dateStr] || '0';

          // Convert 'A' and invalid values to '0'
          const cleanNormalHours =
            normalHours === 'A' || normalHours === '' || isNaN(parseFloat(normalHours))
              ? '0'
              : normalHours;
          const cleanOvertimeHours =
            overtimeHours === 'A' || overtimeHours === '' || isNaN(parseFloat(overtimeHours))
              ? '0'
              : overtimeHours;

          // Only include days with hours
          if (parseFloat(cleanNormalHours) > 0 || parseFloat(cleanOvertimeHours) > 0) {
            blockHours[dateStr] = {
              normal: cleanNormalHours,
              overtime: cleanOvertimeHours,
            };
          }

          current.setDate(current.getDate() + 1);
        }

        // Create assignment object for this block
        assignments.push({
          employee_id: data.employeeId,
          assignment_id: data.assignmentId === 'none' ? null : data.assignmentId,
          date_from: block.startDate,
          date_to: block.endDate,
          project_id: block.projectId !== 'none' ? block.projectId : null,
          rental_id: block.rentalId !== 'none' ? block.rentalId : null,
          hours_worked: '8', // Default hours
          overtime_hours: '0', // Default overtime
          description: block.description || data.description,
          tasks: data.tasksCompleted,
          start_time: data.startTime,
          end_time: data.endTime,
          daily_hours: blockHours, // Include daily hours for processing
        });
      }

      if (assignments.length === 0) {
        toast.error('No valid assignments to create');
        setProcessing(false);
        return;
      }

      const response = await fetch('/api/timesheets/bulk-split', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignments }),
      });

      const responseData = await response.json();
      if (response.ok && responseData.message) {
        toast.success(
          `${responseData.count || assignments.length} timesheets created successfully`
        );
        setProcessing(false);
        router.push(`/${locale}/timesheet-management`);
      } else {
        
        toast.error(responseData.error || 'Failed to create timesheets');
        setProcessing(false);
      }
    } catch (error) {
      
      toast.error('Failed to create timesheets');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Create Timesheet</h1>
          </div>
          <p className="text-muted-foreground">Record work hours and assignment details</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/${locale}/timesheet-management`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Timesheets
        </Button>
      </div>

      {/* Bulk Mode Toggle */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bulk_mode"
              checked={isBulkMode}
              onCheckedChange={checked => {
                setIsBulkMode(checked as boolean);
                if (checked) {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  setStartDate(firstDay);
                  setEndDate(lastDay);
                  generateDailyOvertimeHours(firstDay, lastDay);
                }
              }}
            />
            <Label htmlFor="bulk_mode">Bulk Mode</Label>
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      {isBulkMode ? (
        <form onSubmit={handleBulkSubmit} className="space-y-6">
          {/* Employee Selection for Bulk */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Employee Selection
              </CardTitle>
              <CardDescription>Select employee for bulk timesheet creation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <EmployeeDropdown
                  value={data.employeeId}
                  onValueChange={handleEmployeeChange}
                  label="Employee"
                  placeholder="Select an employee"
                  required={true}
                  error={errors?.employeeId}
                />
              </div>

              {/* Assignment Selection for Bulk */}
              {availableAssignments.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="assignment_id">Assignment (Optional)</Label>
                  <Select value={data.assignmentId} onValueChange={handleAssignmentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific assignment</SelectItem>
                      {availableAssignments.map(assignment => (
                        <SelectItem key={assignment.id} value={assignment.id}>
                          {assignment.type === 'project' && assignment.project
                            ? `Project: ${assignment.project.name}`
                            : assignment.type === 'rental' && assignment.rental
                              ? `Rental: ${assignment.rental.rentalNumber || assignment.rental.projectName || 'Unknown Rental'}`
                              : `${assignment.type}: ${assignment.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date Range Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Date Range
              </CardTitle>
              <CardDescription>Select the date range for bulk timesheet creation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="month_picker">Month</Label>
                  <Input
                    type="month"
                    value={format(startDate, 'yyyy-MM')}
                    onChange={e => {
                      if (e.target.value) {
                        const [year, month] = e.target.value.split('-').map(Number);
                        const firstDay = new Date(year, month - 1, 1);
                        const lastDay = new Date(year, month, 0);
                        setStartDate(firstDay);
                        setEndDate(lastDay);
                        generateDailyOvertimeHours(firstDay, lastDay);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    type="date"
                    value={format(endDate, 'yyyy-MM-dd')}
                    onChange={e => setEndDate(new Date(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Blocks */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Blocks</CardTitle>
              <CardDescription>
                Define different assignments for different date ranges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignmentBlocks.map((block, index) => (
                <div key={block.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Block {index + 1}</h4>
                    {assignmentBlocks.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAssignmentBlock(block.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Project</Label>
                      <Select
                        value={block.projectId}
                        onValueChange={value => updateAssignmentBlock(block.id, 'projectId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No project</SelectItem>
                          {projects.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Rental</Label>
                      <Select
                        value={block.rentalId}
                        onValueChange={value => updateAssignmentBlock(block.id, 'rentalId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rental" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No rental</SelectItem>
                          {rentals.map(rental => (
                            <SelectItem key={rental.id} value={rental.id}>
                              {rental.rentalNumber} -{' '}
                              {rental.equipment?.name || 'Unknown Equipment'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={block.startDate}
                        onChange={e => updateAssignmentBlock(block.id, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={block.endDate}
                        onChange={e => updateAssignmentBlock(block.id, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Description</Label>
                    <Textarea
                      value={block.description}
                      onChange={e => updateAssignmentBlock(block.id, 'description', e.target.value)}
                      placeholder="Description for this assignment block..."
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addAssignmentBlock}>
                <Plus className="mr-2 h-4 w-4" />
                Add Assignment Block
              </Button>
            </CardContent>
          </Card>

          {/* Daily Hours Grid */}
          {Object.keys(dailyNormalHours).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Hours</CardTitle>
                <CardDescription>Set normal and overtime hours for each day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed rounded-lg border border-gray-200 text-sm shadow-sm">
                    <thead className="bg-white">
                      <tr>
                        {Object.keys(dailyNormalHours).map(date => {
                          const day = new Date(date).getDay();
                          const isFriday = day === 5;
                          return (
                            <th
                              key={date}
                              className={`sticky top-0 z-10 border-b border-gray-200 text-center align-middle font-semibold ${isFriday ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-900'}`}
                              style={{
                                width: '40px',
                                minWidth: '40px',
                                maxWidth: '40px',
                                padding: '6px 0',
                              }}
                            >
                              {new Date(date).getDate()}
                            </th>
                          );
                        })}
                      </tr>
                      <tr>
                        {Object.keys(dailyOvertimeHours).map(date => {
                          const day = new Date(date).getDay();
                          const isFriday = day === 5;
                          return (
                            <th
                              key={date}
                              className={`sticky top-8 z-10 border-b border-gray-200 text-center align-middle font-semibold ${isFriday ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-900'}`}
                              style={{
                                width: '40px',
                                minWidth: '40px',
                                maxWidth: '40px',
                                padding: '4px 0',
                              }}
                            >
                              {format(new Date(date), 'EEE')}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {Object.keys(dailyNormalHours).map(date => {
                          const value = dailyNormalHours[date];
                          const isAbsent = value === 'A';
                          const isZero = value === '0' || value === '';
                          const isOvertime = parseFloat(value) > 8;
                          return (
                            <td
                              key={date}
                              className={`border-b border-gray-200 p-1 ${isAbsent ? 'bg-red-100' : isZero ? 'bg-gray-50' : isOvertime ? 'bg-blue-50' : 'bg-green-50'}`}
                            >
                              <input
                                type="text"
                                value={value}
                                onChange={e =>
                                  setDailyNormalHours(prev => ({ ...prev, [date]: e.target.value }))
                                }
                                className={`w-full text-center border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded ${isAbsent ? 'text-red-600' : isZero ? 'text-gray-500' : isOvertime ? 'text-blue-600' : 'text-green-600'}`}
                                style={{ fontSize: '12px', padding: '2px' }}
                                placeholder="8"
                              />
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        {Object.keys(dailyOvertimeHours).map(date => {
                          const value = dailyOvertimeHours[date];
                          const isAbsent = value === 'A';
                          const isZero = value === '0' || value === '';
                          const hasOvertime = parseFloat(value) > 0;
                          return (
                            <td
                              key={date}
                              className={`border-b border-gray-200 p-1 ${isAbsent ? 'bg-red-100' : isZero ? 'bg-gray-50' : hasOvertime ? 'bg-blue-50' : 'bg-green-50'}`}
                            >
                              <input
                                type="text"
                                value={value}
                                onChange={e =>
                                  setDailyOvertimeHours(prev => ({
                                    ...prev,
                                    [date]: e.target.value,
                                  }))
                                }
                                className={`w-full text-center border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded ${isAbsent ? 'text-red-600' : isZero ? 'text-gray-500' : hasOvertime ? 'text-blue-600' : 'text-green-600'}`}
                                style={{ fontSize: '12px', padding: '2px' }}
                                placeholder="0"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    <strong>Instructions:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Enter normal hours in the first row (default: 8)</li>
                    <li>Enter overtime hours in the second row (default: 0)</li>
                    <li>Use &apos;A&apos; for absent days or &apos;0&apos; for no work</li>
                    <li>Fridays are highlighted in blue (weekend)</li>
                  </ul>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-2">Legend:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 font-medium">8</span>
                      <span>= regular hours</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600 font-medium">More than 8</span>
                      <span>= overtime hours</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600 font-medium">A</span>
                      <span>= absent</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 font-medium">F</span>
                      <span>= Friday (weekend)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={processing}>
              {processing ? 'Creating Timesheets...' : 'Create Timesheets'}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSingleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Employee & Assignment Section */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Employee & Assignment
                </CardTitle>
                <CardDescription>Select the employee and their work assignment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee *</Label>
                  <Select value={data.employeeId} onValueChange={handleEmployeeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.employeeId && (
                    <p className="text-sm text-red-600">{errors.employeeId}</p>
                  )}
                </div>

                {/* Assignment Selection */}
                {availableAssignments.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="assignment_id">Assignment (Optional)</Label>
                    <Select value={data.assignmentId} onValueChange={handleAssignmentChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an assignment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific assignment</SelectItem>
                        {availableAssignments.map(assignment => (
                          <SelectItem key={assignment.id} value={assignment.id}>
                            {assignment.type === 'project' && assignment.project
                              ? `Project: ${assignment.project.name}`
                              : assignment.type === 'rental' && assignment.rental
                                ? `Rental: ${assignment.rental.rentalNumber || assignment.rental.projectName || 'Unknown Rental'}`
                                : `${assignment.type}: ${assignment.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Assignment Display */}
                {data.assignmentId && data.assignmentId !== 'none' && (
                  <div className="rounded-lg border p-4 bg-blue-50">
                    <h4 className="font-medium text-sm text-blue-800 mb-2">Selected Assignment</h4>
                    <div className="text-sm text-blue-700">
                      {(() => {
                        const assignment = availableAssignments.find(
                          a => a.id === data.assignmentId
                        );
                        if (!assignment) return 'Assignment not found';

                        if (assignment.type === 'project' && assignment.project) {
                          return `Project: ${assignment.project.name}`;
                        } else if (assignment.type === 'rental' && assignment.rental) {
                          return `Rental: ${assignment.rental.rentalNumber || assignment.rental.projectName || 'Unknown Rental'}`;
                        } else {
                          return `${assignment.type}: ${assignment.name}`;
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Project/Rental Selection (when no assignment) */}
                {(!data.assignmentId || data.assignmentId === 'none') && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="project_id">Project (Optional)</Label>
                      <Select value={data.projectId} onValueChange={handleProjectChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No project</SelectItem>
                          {projects.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rental_id">Rental (Optional)</Label>
                      <Select value={data.rentalId} onValueChange={handleRentalChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a rental" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No rental</SelectItem>
                          {rentals.map(rental => (
                            <SelectItem key={rental.id} value={rental.id}>
                              {rental.rentalNumber} -{' '}
                              {rental.equipment?.name || 'Unknown Equipment'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Warning when no assignment and employee has assignments */}
                {(!data.assignmentId || data.assignmentId === 'none') &&
                  availableAssignments.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This employee has active assignments. Consider selecting one above or use
                        project/rental fields to create a new assignment.
                      </AlertDescription>
                    </Alert>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Time Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Time Details
              </CardTitle>
              <CardDescription>Work date and hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  type="date"
                  value={data.date}
                  onChange={e => setFormData('date', e.target.value)}
                />
                {errors?.date && <p className="text-sm text-red-600">{errors.date}</p>}
              </div>

              {/* Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours_worked">Regular Hours *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={data.hoursWorked}
                    onChange={e => setFormData('hoursWorked', e.target.value)}
                    placeholder="8"
                  />
                  {errors?.hoursWorked && (
                    <p className="text-sm text-red-600">{errors.hoursWorked}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overtime_hours">Overtime Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={data.overtimeHours}
                    onChange={e => setFormData('overtimeHours', e.target.value)}
                    placeholder="0"
                  />
                  {errors?.overtimeHours && (
                    <p className="text-sm text-red-600">{errors.overtimeHours}</p>
                  )}
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    type="time"
                    value={data.startTime}
                    onChange={e => setFormData('startTime', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    type="time"
                    value={data.endTime}
                    onChange={e => setFormData('endTime', e.target.value)}
                  />
                </div>
              </div>

              {/* Total Hours Display */}
              <div className="rounded-lg bg-muted/30 p-3">
                <div className="text-sm font-medium text-muted-foreground">Total Hours</div>
                <div className="text-2xl font-bold">
                  {(
                    parseFloat(data.hoursWorked || '0') + parseFloat(data.overtimeHours || '0')
                  ).toFixed(1)}
                  h
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Section */}
          <Card>
            <CardHeader>
              <CardTitle>Work Description</CardTitle>
              <CardDescription>Describe the work performed and tasks completed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    value={data.description}
                    onChange={e => setFormData('description', e.target.value)}
                    placeholder="Brief description of work performed..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tasks_completed">Tasks Completed</Label>
                  <Textarea
                    value={data.tasksCompleted}
                    onChange={e => setFormData('tasksCompleted', e.target.value)}
                    placeholder="List of completed tasks..."
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={processing}>
              {processing ? 'Creating Timesheet...' : 'Create Timesheet'}
            </Button>
          </div>
        </form>
      )}

      {/* Assignment Creation Dialog */}
      <Dialog open={showAssignmentPopup} onOpenChange={setShowAssignmentPopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Assignment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This employee has no active assignments. You&apos;ll be redirected to the
                appropriate page to view details and create assignments.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Assignment Type</Label>
              <Select
                value={newAssignmentData.type}
                onValueChange={value =>
                  setNewAssignmentData(prev => ({
                    ...prev,
                    type: value,
                    name: '',
                    location: '',
                    projectId: '',
                    rentalId: '',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Assignment</SelectItem>
                  <SelectItem value="project">Project Assignment</SelectItem>
                  <SelectItem value="rental">Rental Assignment</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select the type of assignment you want to create. You&apos;ll complete the details
                on the assignment page.
              </p>
            </div>

            {newAssignmentData.type === 'project' && (
              <div className="space-y-2">
                <Label>Project (Optional)</Label>
                <Select
                  value={newAssignmentData.projectId}
                  onValueChange={value =>
                    setNewAssignmentData(prev => ({ ...prev, projectId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project to pre-fill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a project to pre-fill</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Don&apos;t forget to save your timesheet before leaving this page.
                </p>
              </div>
            )}

            {newAssignmentData.type === 'rental' && (
              <div className="space-y-2">
                <Label>Rental (Optional)</Label>
                <Select
                  value={newAssignmentData.rentalId}
                  onValueChange={value =>
                    setNewAssignmentData(prev => ({ ...prev, rentalId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a rental to pre-fill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a rental to pre-fill</SelectItem>
                    {rentals.map(rental => (
                      <SelectItem key={rental.id} value={rental.id}>
                        {rental.rentalNumber} - {rental.equipment?.name || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Don&apos;t forget to save your timesheet before leaving this page.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAssignmentPopup}>
              Cancel
            </Button>
            <Button onClick={redirectToAssignmentPage}>Go to Assignment Page</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
