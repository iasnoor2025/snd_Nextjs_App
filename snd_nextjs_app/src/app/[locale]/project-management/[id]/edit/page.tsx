'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ApiService from '@/lib/api-service';
import { format } from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarIcon,
  DollarSign,
  FileText,
  Target,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';

interface Customer {
  id: string;
  name: string;
  companyName: string | null;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  country?: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  customer_id?: string;
  location_id?: string;
  start_date?: Date;
  end_date?: Date;
  status: string;
  priority: string;
  budget?: string;
  initial_budget?: string;
  notes?: string;
  objectives?: string;
  scope?: string;
  deliverables?: string;
  constraints?: string;
  assumptions?: string;
  risks?: string;
  quality_standards?: string;
  communication_plan?: string;
  stakeholder_management?: string;
  change_management?: string;
  procurement_plan?: string;
  resource_plan?: string;
  schedule_plan?: string;
  cost_plan?: string;
  quality_plan?: string;
  risk_plan?: string;
  communication_plan_detailed?: string;
  stakeholder_plan?: string;
  change_plan?: string;
  procurement_plan_detailed?: string;
  resource_plan_detailed?: string;
  schedule_plan_detailed?: string;
  cost_plan_detailed?: string;
  quality_plan_detailed?: string;
  risk_plan_detailed?: string;
  // Project team roles
  project_manager_id?: string;
  project_engineer_id?: string;
  project_foreman_id?: string;
  supervisor_id?: string;
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useI18n();
  const locale = params?.locale as string || 'en';
  const projectId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  
  // Track warnings for each employee field
  const [employeeWarnings, setEmployeeWarnings] = useState<{
    project_manager_id?: string[];
    project_engineer_id?: string[];
    project_foreman_id?: string[];
    supervisor_id?: string[];
  }>({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customer_id: '',
    location_id: '',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    status: 'planning',
    priority: 'medium',
    budget: '',
    initial_budget: '',
    notes: '',
    objectives: '',
    scope: '',
    deliverables: '',
    constraints: '',
    assumptions: '',
    risks: '',
    quality_standards: '',
    communication_plan: '',
    stakeholder_management: '',
    change_management: '',
    procurement_plan: '',
    resource_plan: '',
    schedule_plan: '',
    cost_plan: '',
    quality_plan: '',
    risk_plan: '',
    communication_plan_detailed: '',
    stakeholder_plan: '',
    change_plan: '',
    procurement_plan_detailed: '',
    resource_plan_detailed: '',
    schedule_plan_detailed: '',
    cost_plan_detailed: '',
    quality_plan_detailed: '',
    risk_plan_detailed: '',
    // Project team roles
    project_manager_id: '',
    project_engineer_id: '',
    project_foreman_id: '',
    supervisor_id: '',
  });

  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Debug: Log priority changes
  useEffect(() => {
    console.log('[Edit Page] formData.priority changed to:', formData.priority);
  }, [formData.priority]);

  // Check employee assignments when any employee field changes
  const checkEmployeeAssignments = useCallback(async (employeeId: string | undefined, fieldName: string) => {
    if (!employeeId) {
      setEmployeeWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[fieldName as keyof typeof newWarnings];
        return newWarnings;
      });
      return;
    }

    const warnings: string[] = [];
    const employeeIdNum = parseInt(employeeId);
    const warnedRentalIds = new Set<number>();

    try {
      // 1. Check employee assignments (assignment service) - across all projects and rentals
      try {
        const assignmentsResponse = await ApiService.get(`/employees/${employeeIdNum}/assignments`);
        if (assignmentsResponse.success && assignmentsResponse.data) {
          const activeAssignments = assignmentsResponse.data.filter((assignment: any) => 
            assignment.status === 'active' || assignment.status === 'pending'
          );

          activeAssignments.forEach((assignment: any) => {
            // Check if assignment is to a project - only warn if it's a DIFFERENT project
            if (assignment.project_id) {
              // Skip if assigned to THIS project - that's expected
              if (assignment.project_id.toString() === projectId) {
                return; // Don't show warning for assignments to current project
              }
              // Assignment to a different project - show warning
              const projectName = assignment.project?.name || `Project ${assignment.project_id}`;
              const startDate = assignment.start_date;
              const dateStr = startDate ? new Date(startDate).toLocaleDateString() : 'unknown date';
              warnings.push(`Already assigned to project "${projectName}" (started: ${dateStr})`);
            } else if (assignment.rental_id) {
              // Assignment to a rental - track to avoid duplicate warnings
              const rentalId = assignment.rental_id;
              if (!warnedRentalIds.has(rentalId)) {
                warnedRentalIds.add(rentalId);
                const rentalNumber = assignment.rental?.rental_number || `Rental ${rentalId}`;
                const startDate = assignment.start_date;
                const dateStr = startDate ? new Date(startDate).toLocaleDateString() : 'unknown date';
                const assignmentName = assignment.name || 'Rental Operator';
                warnings.push(`Already assigned to rental "${rentalNumber}" as "${assignmentName}" (started: ${dateStr})`);
              }
            } else if (assignment.name) {
              // Manual assignment (not linked to project or rental)
              const startDate = assignment.start_date;
              const dateStr = startDate ? new Date(startDate).toLocaleDateString() : 'unknown date';
              warnings.push(`Already has active assignment: "${assignment.name}" (started: ${dateStr})`);
            }
          });
        }
      } catch (assignmentsError) {
        console.error('Error checking employee assignments:', assignmentsError);
      }

      // 2. Check rental items where employee is operator (via previous-assignments endpoint for detailed info)
      try {
        const previousAssignmentsResponse = await ApiService.get(`/employees/${employeeIdNum}/previous-assignments`);
        if (previousAssignmentsResponse && previousAssignmentsResponse.assignments) {
          const activeRentalAssignments = previousAssignmentsResponse.assignments.filter((assignment: any) => 
            assignment.role === 'operator' && 
            (assignment.status === 'active' || !assignment.completedDate)
          );

          activeRentalAssignments.forEach((assignment: any) => {
            if (assignment.rentalId && !warnedRentalIds.has(assignment.rentalId)) {
              warnedRentalIds.add(assignment.rentalId);
              const equipmentName = assignment.equipmentName || 'Unknown Equipment';
              const rentalNumber = assignment.rentalNumber || `Rental ${assignment.rentalId}`;
              const startDate = assignment.startDate;
              const dateStr = startDate ? new Date(startDate).toLocaleDateString() : 'unknown date';
              warnings.push(`Already assigned as operator to rental "${rentalNumber}" (Equipment: ${equipmentName}, started: ${dateStr})`);
            }
          });
        }
      } catch (rentalError) {
        console.error('Error checking rental operator assignments:', rentalError);
      }

      setEmployeeWarnings(prev => ({
        ...prev,
        [fieldName]: warnings.length > 0 ? warnings : undefined,
      }));
    } catch (error) {
      console.error('Error checking employee assignments:', error);
      setEmployeeWarnings(prev => ({
        ...prev,
        [fieldName]: undefined,
      }));
    }
  }, [projectId]);

  // Check assignments when employee fields change
  useEffect(() => {
    checkEmployeeAssignments(formData.project_manager_id, 'project_manager_id');
  }, [formData.project_manager_id, checkEmployeeAssignments]);

  useEffect(() => {
    checkEmployeeAssignments(formData.project_engineer_id, 'project_engineer_id');
  }, [formData.project_engineer_id, checkEmployeeAssignments]);

  useEffect(() => {
    checkEmployeeAssignments(formData.project_foreman_id, 'project_foreman_id');
  }, [formData.project_foreman_id, checkEmployeeAssignments]);

  useEffect(() => {
    checkEmployeeAssignments(formData.supervisor_id, 'supervisor_id');
  }, [formData.supervisor_id, checkEmployeeAssignments]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const projectResponse = (await ApiService.getProject(Number(projectId))) as any;
      if (projectResponse.success) {
        const projectData = projectResponse.data;
        setProject(projectData);

        // Helper function to parse date string as local date (avoids timezone issues)
        const parseLocalDate = (dateString: string | undefined): Date | undefined => {
          if (!dateString) return undefined;
          const dateStr = dateString.split('T')[0];
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day);
        };

        // Update form data with project data
        const initialFormData = {
          name: projectData.name || '',
          description: projectData.description || '',
          customer_id: projectData.customer_id?.toString() || '',
          location_id: projectData.location_id?.toString() || '',
          start_date: parseLocalDate(projectData.start_date),
          end_date: parseLocalDate(projectData.end_date),
          status: projectData.status || 'planning',
          priority: projectData.priority || 'medium',
          budget: projectData.budget?.toString() || '',
          initial_budget: projectData.initial_budget?.toString() || '',
          notes: projectData.notes || '',
          objectives: projectData.objectives || '',
          scope: projectData.scope || '',
          deliverables: projectData.deliverables || '',
          constraints: projectData.constraints || '',
          assumptions: projectData.assumptions || '',
          risks: projectData.risks || '',
          quality_standards: projectData.quality_standards || '',
          communication_plan: projectData.communication_plan || '',
          stakeholder_management: projectData.stakeholder_management || '',
          change_management: projectData.change_management || '',
          procurement_plan: projectData.procurement_plan || '',
          resource_plan: projectData.resource_plan || '',
          schedule_plan: projectData.schedule_plan || '',
          cost_plan: projectData.cost_plan || '',
          quality_plan: projectData.quality_plan || '',
          risk_plan: projectData.risk_plan || '',
          communication_plan_detailed: projectData.communication_plan_detailed || '',
          stakeholder_plan: projectData.stakeholder_plan || '',
          change_plan: projectData.change_plan || '',
          procurement_plan_detailed: projectData.procurement_plan_detailed || '',
          resource_plan_detailed: projectData.resource_plan_detailed || '',
          schedule_plan_detailed: projectData.schedule_plan_detailed || '',
          cost_plan_detailed: projectData.cost_plan_detailed || '',
          quality_plan_detailed: projectData.quality_plan_detailed || '',
          risk_plan_detailed: projectData.risk_plan_detailed || '',
          // Project team roles - ensure proper string conversion
          project_manager_id: projectData.project_manager_id ? projectData.project_manager_id.toString() : '',
          project_engineer_id: projectData.project_engineer_id ? projectData.project_engineer_id.toString() : '',
          project_foreman_id: projectData.project_foreman_id ? projectData.project_foreman_id.toString() : '',
          supervisor_id: projectData.supervisor_id ? projectData.supervisor_id.toString() : '',
        };
        setFormData(initialFormData);
      } else {
        toast.error(t('project.messages.fetchError'));
        router.push(`/${locale}/project-management`);
      }

      // Fetch customers
      try {
        const customersResponse = (await ApiService.get('/customers?limit=1000')) as any;
        if (customersResponse.customers) {
          setCustomers(customersResponse.customers || []);
        } else {
          setCustomers([]);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]);
      }

      // Fetch locations
      try {
        const locationsResponse = (await ApiService.get('/locations?limit=1000')) as any;
        if (locationsResponse.success && locationsResponse.data) {
          setLocations(locationsResponse.data || []);
        } else {
          setLocations([]);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
        toast.error(t('project.messages.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for number formatting with thousand separators
  const formatNumber = (value: string | number | undefined): string => {
    if (!value && value !== 0) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const parseNumber = (value: string): string => {
    // Remove all non-digit characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'priority') {
      console.log('[Edit Page] Priority changed to:', value);
    }
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value,
      };
      if (field === 'priority') {
        console.log('[Edit Page] Updated formData.priority:', updated.priority);
      }
      
      // Validate dates when either date changes
      if (field === 'start_date' || field === 'end_date') {
        validateDates(field === 'start_date' ? value : prev.start_date, field === 'end_date' ? value : prev.end_date);
      }
      
      return updated;
    });
  };

  const validateDates = (startDate: Date | undefined, endDate: Date | undefined) => {
    if (startDate && endDate && endDate < startDate) {
      setDateError('End date must be after start date');
    } else {
      setDateError(null);
    }
  };

  const handleBudgetChange = (field: 'budget' | 'initial_budget', value: string) => {
    // Parse the input to remove formatting
    const parsed = parseNumber(value);
    handleInputChange(field, parsed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates before submission
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      setDateError('End date must be after start date');
      toast.error('Please fix the date validation error before saving');
      return;
    }

    setSaving(true);

    try {
      // Format dates as YYYY-MM-DD to avoid timezone issues
      const formatDateForSubmit = (date: Date | undefined) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Parse budget values, removing any formatting (commas)
      const parseBudgetValue = (value: string | undefined): number => {
        if (!value) return 0;
        const cleaned = value.toString().replace(/,/g, '');
        return parseFloat(cleaned) || 0;
      };

      const submitData = {
        ...formData,
        start_date: formatDateForSubmit(formData.start_date),
        end_date: formatDateForSubmit(formData.end_date),
        budget: parseBudgetValue(formData.budget),
        initial_budget: parseBudgetValue(formData.initial_budget),
        status: formData.status,
        priority: formData.priority,
        // Project team roles
        project_manager_id: formData.project_manager_id || null,
        project_engineer_id: formData.project_engineer_id || null,
        project_foreman_id: formData.project_foreman_id || null,
        supervisor_id: formData.supervisor_id || null,
      };

      console.log('[Edit Page] Submitting project update with priority:', submitData.priority);
      console.log('[Edit Page] Full submitData:', JSON.stringify(submitData, null, 2));

      const response = await ApiService.put(`/projects/${projectId}`, submitData);
      
      console.log('[Edit Page] Update response:', response);
      
      if (response.success) {
        toast.success(t('project.messages.updateSuccess'));
        router.push(`/${locale}/project-management/${projectId}`);
      } else {
        throw new Error(response.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project.', error);
        toast.error(t('project.messages.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: 'planning', label: 'Planning', color: 'bg-blue-100 text-blue-800' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
    { value: 'critical', label: 'Critical', color: 'bg-purple-100 text-purple-800' },
  ];

  // Reusable Employee Warning Component
  const EmployeeWarning = ({ warnings }: { warnings: string[] }) => (
    <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 space-y-2">
      <div className="flex items-start">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-yellow-800 mb-1">
            {t('project.warnings.employeeAlreadyAssigned')}
          </h4>
          <ul className="list-disc list-inside space-y-1 text-xs text-yellow-700">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
          <p className="text-xs text-yellow-600 mt-2">
            {t('project.warnings.employeeAlreadyAssignedMessage')}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">{t('project.messages.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('project.messages.projectNotFound')}</h2>
          <p className="text-gray-600 mb-4">{t('project.messages.projectNotFound')}</p>
          <Link href={`/${locale}/project-management`}>
            <Button>{t('project.actions.backToProjects')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link href={`/${locale}/project-management/${projectId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('project.actions.backToProject')}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{t('project.actions.editProject')}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t('project.edit.description')}</p>
            </div>
          </div>
          {project && (
            <div className="flex items-center gap-2">
              <Badge className={statusOptions.find(s => s.value === project.status)?.color || 'bg-gray-100 text-gray-800'}>
                {statusOptions.find(s => s.value === project.status)?.label || project.status}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>{t('project.sections.basicInformation')}</span>
            </CardTitle>
            <CardDescription>{t('project.create.essentialDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('project.fields.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder={t('project.fields.name')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_id">{t('project.fields.client')} *</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={value => handleInputChange('customer_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('project.fields.selectClient')}>
                      {formData.customer_id &&
                        customers.find(c => c.id.toString() === formData.customer_id.toString())
                          ?.companyName || customers.find(c => c.id.toString() === formData.customer_id.toString())
                          ?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.companyName || customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('project.fields.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder={t('project.fields.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location_id">{t('project.fields.location')}</Label>
                <Select
                  value={formData.location_id}
                  onValueChange={value => handleInputChange('location_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('project.fields.selectLocation')}>
                      {formData.location_id &&
                        locations.find(l => l.id.toString() === formData.location_id.toString()) &&
                        `${locations.find(l => l.id.toString() === formData.location_id.toString())?.name}, ${locations.find(l => l.id.toString() === formData.location_id.toString())?.city}, ${locations.find(l => l.id.toString() === formData.location_id.toString())?.state}`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}, {location.city}, {location.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>{t('project.sections.timelineAndStatus')}</span>
            </CardTitle>
            <CardDescription>{t('project.create.timelineDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">{t('project.fields.startDate')} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        dateError ? 'border-red-500' : ''
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, 'PPP') : t('project.fields.pickDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={date => handleInputChange('start_date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">{t('project.fields.endDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        dateError ? 'border-red-500' : ''
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, 'PPP') : t('project.fields.pickDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={date => handleInputChange('end_date', date)}
                      disabled={formData.start_date ? (date) => date < formData.start_date : undefined}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {dateError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {dateError}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">{t('project.fields.status')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={value => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    {formData.status ? (
                      <div className="flex items-center">
                        <Badge className={statusOptions.find(s => s.value === formData.status)?.color || 'bg-gray-100 text-gray-800'}>
                          {statusOptions.find(s => s.value === formData.status)?.label || formData.status}
                        </Badge>
                      </div>
                    ) : (
                      <SelectValue placeholder={t('project.statusLabels.selectStatus')} />
                    )}
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <Badge className={option.color}>{option.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">{t('project.fields.priority')}</Label>
                <Select
                  value={formData.priority}
                  onValueChange={value => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    {formData.priority ? (
                      <div className="flex items-center">
                        <Badge className={priorityOptions.find(p => p.value === formData.priority)?.color || 'bg-gray-100 text-gray-800'}>
                          {priorityOptions.find(p => p.value === formData.priority)?.label || formData.priority}
                        </Badge>
                      </div>
                    ) : (
                      <SelectValue placeholder={t('project.statusLabels.selectPriority')} />
                    )}
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {priorityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <Badge className={option.color}>{option.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>{t('project.sections.budgetInformation')}</span>
            </CardTitle>
            <CardDescription>{t('project.create.budgetDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">{t('project.fields.totalBudget')}</Label>
                <Input
                  id="budget"
                  type="text"
                  value={formatNumber(formData.budget)}
                  onChange={e => handleBudgetChange('budget', e.target.value)}
                  onBlur={e => {
                    // Format on blur
                    const parsed = parseNumber(e.target.value);
                    if (parsed) {
                      handleInputChange('budget', parsed);
                    }
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial_budget">{t('project.fields.initialBudget')}</Label>
                <Input
                  id="initial_budget"
                  type="text"
                  value={formatNumber(formData.initial_budget)}
                  onChange={e => handleBudgetChange('initial_budget', e.target.value)}
                  onBlur={e => {
                    // Format on blur
                    const parsed = parseNumber(e.target.value);
                    if (parsed) {
                      handleInputChange('initial_budget', parsed);
                    }
                  }}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Planning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{t('project.sections.projectPlanning')}</span>
            </CardTitle>
            <CardDescription>{t('project.sections.projectPlanningDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objectives">{t('project.fields.objectives')}</Label>
                <Textarea
                  id="objectives"
                  value={formData.objectives}
                  onChange={e => handleInputChange('objectives', e.target.value)}
                  placeholder={t('project.fields.objectivesPlaceholder')}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scope">{t('project.fields.scope')}</Label>
                <Textarea
                  id="scope"
                  value={formData.scope}
                  onChange={e => handleInputChange('scope', e.target.value)}
                  placeholder={t('project.fields.scopePlaceholder')}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverables">{t('project.fields.deliverables')}</Label>
              <Textarea
                id="deliverables"
                value={formData.deliverables}
                onChange={e => handleInputChange('deliverables', e.target.value)}
                placeholder={t('project.fields.deliverablesPlaceholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="constraints">{t('project.fields.constraints')}</Label>
                <Textarea
                  id="constraints"
                  value={formData.constraints}
                  onChange={e => handleInputChange('constraints', e.target.value)}
                  placeholder={t('project.fields.constraintsPlaceholder')}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assumptions">{t('project.fields.assumptions')}</Label>
                <Textarea
                  id="assumptions"
                  value={formData.assumptions}
                  onChange={e => handleInputChange('assumptions', e.target.value)}
                  placeholder={t('project.fields.assumptionsPlaceholder')}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risks">{t('project.fields.risks')}</Label>
              <Textarea
                id="risks"
                value={formData.risks}
                onChange={e => handleInputChange('risks', e.target.value)}
                placeholder={t('project.fields.risksPlaceholder')}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Project Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>{t('project.sections.projectTeam')}</span>
            </CardTitle>
            <CardDescription>{t('project.sections.projectTeamDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_manager_id">{t('project.roles.projectManager')}</Label>
                <EmployeeDropdown
                  value={formData.project_manager_id}
                  onValueChange={value => handleInputChange('project_manager_id', value)}
                  placeholder={t('project.roles.selectManager')}
                  projectId={projectId}
                />
                {employeeWarnings.project_manager_id && employeeWarnings.project_manager_id.length > 0 && (
                  <EmployeeWarning warnings={employeeWarnings.project_manager_id} />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_engineer_id">{t('project.roles.projectEngineer')}</Label>
                <EmployeeDropdown
                  value={formData.project_engineer_id}
                  onValueChange={value => handleInputChange('project_engineer_id', value)}
                  placeholder={t('project.roles.selectEngineer')}
                  projectId={projectId}
                />
                {employeeWarnings.project_engineer_id && employeeWarnings.project_engineer_id.length > 0 && (
                  <EmployeeWarning warnings={employeeWarnings.project_engineer_id} />
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_foreman_id">{t('project.roles.projectForeman')}</Label>
                <EmployeeDropdown
                  value={formData.project_foreman_id}
                  onValueChange={value => handleInputChange('project_foreman_id', value)}
                  placeholder={t('project.roles.selectForeman')}
                  projectId={projectId}
                />
                {employeeWarnings.project_foreman_id && employeeWarnings.project_foreman_id.length > 0 && (
                  <EmployeeWarning warnings={employeeWarnings.project_foreman_id} />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="supervisor_id">{t('project.roles.supervisor')}</Label>
                <EmployeeDropdown
                  value={formData.supervisor_id}
                  onValueChange={value => handleInputChange('supervisor_id', value)}
                  placeholder={t('project.roles.selectSupervisor')}
                  projectId={projectId}
                />
                {employeeWarnings.supervisor_id && employeeWarnings.supervisor_id.length > 0 && (
                  <EmployeeWarning warnings={employeeWarnings.supervisor_id} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 sm:-mx-6 mt-6 shadow-lg">
          <div className="container mx-auto flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Link href={`/${locale}/project-management/${projectId}`} className="w-full sm:w-auto">
              <Button variant="outline" type="button" className="w-full sm:w-auto">
                {t('project.buttons.cancel')}
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={saving || !!dateError}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <span className="mr-2 animate-spin">⏳</span>
                  {t('project.messages.saving')}
                </>
              ) : (
                t('project.save')
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}