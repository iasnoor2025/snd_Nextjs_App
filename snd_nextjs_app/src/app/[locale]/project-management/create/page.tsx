'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import ApiService from '@/lib/api-service';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Building2,
  CalendarIcon,
  DollarSign,
  FileText,
  MapPin,
  Plus,
  Save,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter , useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { SearchableSelect } from '@/components/ui/searchable-select';

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
  budget?: number;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [project, setProject] = useState<Project | null>(null);

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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch customers
      try {
        const customersResponse = (await ApiService.get('/customers?limit=1000')) as any;
        if (customersResponse.customers) {
          setCustomers(customersResponse.customers || []);
        } else {
          
          setCustomers([]);
        }
      } catch (error) {
        
        setCustomers([]);
      }

      // Fetch locations (optional - might not be implemented yet)
      try {
        const locationsResponse = (await ApiService.get('/locations?limit=1000')) as any;
        if (locationsResponse.success && locationsResponse.data) {
          setLocations(locationsResponse.data || []);
        } else {
          
          setLocations([]);
        }
      } catch (error) {
        
        setLocations([]);
      }

      // Fetch employees
      try {
        const employeesResponse = (await ApiService.getEmployees({ per_page: 1000 })) as any;
        if (employeesResponse.success) {
          const allEmployees = employeesResponse.data || [];
          // setEmployees(allEmployees); // This line is removed as per the edit hint
        } else {
          
          // setEmployees([]); // This line is removed as per the edit hint
        }
      } catch (error) {
        
        // setEmployees([]); // This line is removed as per the edit hint
      }
      } catch (error) {
        
        toast.error(t('project.messages.fetchError') || 'Failed to load initial data');
      }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.customer_id || !formData.start_date) {
      toast.error(t('project.validation.validationError') || 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        start_date: formData.start_date?.toISOString(),
        end_date: formData.end_date?.toISOString(),
        budget: parseFloat(formData.budget) || 0,
        initial_budget: parseFloat(formData.initial_budget) || 0,
        // Project team roles
        project_manager_id: formData.project_manager_id || null,
        project_engineer_id: formData.project_engineer_id || null,
        project_foreman_id: formData.project_foreman_id || null,
        supervisor_id: formData.supervisor_id || null,
      };

      const response = (await ApiService.createProject(submitData)) as any;

      // TODO: Project file upload endpoint doesn't exist yet
      if (selectedFiles.length > 0) {
        const formDataFiles = new FormData();
        selectedFiles.forEach(file => {
          formDataFiles.append('files[]', file);
        });
        await ApiService.post(`/projects/${response.data.id}/files`, formDataFiles);
      }

      toast.success(t('project.messages.createSuccess') || 'Project created successfully!');
      router.push(`/${locale}/project-management/${response.data.id}`);
    } catch (error) {
      
      toast.error(t('project.messages.createError') || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'planning', label: t('project.status_options.planning'), color: 'bg-blue-100 text-blue-800' },
    { value: 'active', label: t('project.status_options.active'), color: 'bg-green-100 text-green-800' },
    { value: 'on_hold', label: t('project.status_options.on_hold'), color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: t('project.status_options.completed'), color: 'bg-gray-100 text-gray-800' },
    { value: 'cancelled', label: t('project.status_options.cancelled'), color: 'bg-red-100 text-red-800' },
  ];

  const priorityOptions = [
    { value: 'low', label: t('project.priority_options.low'), color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: t('project.priority_options.medium'), color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: t('project.priority_options.high'), color: 'bg-red-100 text-red-800' },
    { value: 'critical', label: t('project.priority_options.critical'), color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/${locale}/project-management`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('project.actions.backToProjects')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t('project.create.title')}</h1>
            <p className="text-muted-foreground">
              {t('project.create.description')}
            </p>
          </div>
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
                <SearchableSelect
                  value={formData.customer_id}
                  onValueChange={value => handleInputChange('customer_id', value)}
                  options={customers.map(customer => ({
                    value: customer.id.toString(),
                    label: customer.companyName || customer.name,
                    email: customer.email || '',
                    phone: customer.phone || '',
                    name: customer.name,
                  }))}
                  placeholder={t('project.fields.selectClient')}
                  searchPlaceholder={t('project.fields.selectClient')}
                  emptyMessage={t('project.messages.noCustomersFound') || 'No customers found'}
                  required
                  searchFields={['label', 'name', 'email', 'phone']}
                  loading={loading}
                />
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
                <SearchableSelect
                  value={formData.location_id}
                  onValueChange={value => handleInputChange('location_id', value)}
                  options={locations.map(location => ({
                    value: location.id.toString(),
                    label: `${location.name}, ${location.city}, ${location.state}`,
                    name: location.name,
                    city: location.city,
                    state: location.state,
                  }))}
                  placeholder={t('project.fields.selectLocation')}
                  searchPlaceholder={t('project.fields.selectLocation')}
                  emptyMessage={t('project.messages.noLocationsFound') || 'No locations found'}
                  searchFields={['label', 'name', 'city', 'state']}
                  loading={loading}
                />
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
                      className="w-full justify-start text-left font-normal"
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
                      className="w-full justify-start text-left font-normal"
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                    <SelectValue placeholder={t('project.statusLabels.selectStatus')} />
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
                    <SelectValue placeholder={t('project.statusLabels.selectPriority')} />
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
                  type="number"
                  value={formData.budget}
                  onChange={e => handleInputChange('budget', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial_budget">{t('project.fields.initialBudget')}</Label>
                <Input
                  id="initial_budget"
                  type="number"
                  value={formData.initial_budget}
                  onChange={e => handleInputChange('initial_budget', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_engineer_id">{t('project.roles.projectEngineer')}</Label>
                <EmployeeDropdown
                  value={formData.project_engineer_id}
                  onValueChange={value => handleInputChange('project_engineer_id', value)}
                  placeholder={t('project.roles.selectEngineer')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_foreman_id">{t('project.roles.projectForeman')}</Label>
                <EmployeeDropdown
                  value={formData.project_foreman_id}
                  onValueChange={value => handleInputChange('project_foreman_id', value)}
                  placeholder={t('project.roles.selectForeman')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supervisor_id">{t('project.roles.supervisor')}</Label>
                <EmployeeDropdown
                  value={formData.supervisor_id}
                  onValueChange={value => handleInputChange('supervisor_id', value)}
                  placeholder={t('project.roles.selectSupervisor')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{t('project.sections.projectDocuments')}</span>
            </CardTitle>
            <CardDescription>{t('project.sections.projectDocumentsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documents">{t('project.documents.uploadDocuments')}</Label>
              <Input
                id="documents"
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <p className="text-sm text-muted-foreground">
                {t('project.documents.supportedFormats')}
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>{t('project.documents.selectedFiles')}</Label>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        {t('project.documents.remove')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('project.sections.additionalNotes')}</CardTitle>
            <CardDescription>{t('project.sections.additionalNotesDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('project.fields.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
                placeholder={t('project.notes.placeholder')}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link href={`/${locale}/project-management`}>
            <Button variant="outline" type="button">
              {t('project.buttons.cancel')}
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('project.buttons.creatingProject')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('project.buttons.createProject')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
