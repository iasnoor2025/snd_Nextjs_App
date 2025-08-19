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
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  company_name: string;
  contact_person?: string;
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
  manager_id?: string;
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
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectManagers, setProjectManagers] = useState<Employee[]>([]);
  const [project, setProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customer_id: '',
    location_id: '',
    manager_id: '',
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
  });

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const projectResponse = (await ApiService.getProject(projectId)) as any;
      if (projectResponse.success) {
        const projectData = projectResponse.data;
        setProject(projectData);

        // Update form data with project data
        const initialFormData = {
          name: projectData.name || '',
          description: projectData.description || '',
          customer_id: projectData.customer_id?.toString() || '',
          location_id: projectData.location_id?.toString() || '',
          manager_id: projectData.manager_id?.toString() || '',
          start_date: projectData.start_date ? new Date(projectData.start_date) : undefined,
          end_date: projectData.end_date ? new Date(projectData.end_date) : undefined,
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
        };

        setFormData(initialFormData);
      } else {
        toast.error('Failed to load project details');
        router.push('/modules/project-management');
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
        
        setLocations([]);
      }

      // Fetch employees
      try {
        const employeesResponse = (await ApiService.getEmployees({ per_page: 1000 })) as any;
        if (employeesResponse.success) {
          const allEmployees = employeesResponse.data || [];
          setEmployees(allEmployees);

          // For now, show all employees since current data doesn't have proper role designations
          // This allows super admins and other users to access the project management features
          setProjectManagers(allEmployees);

          // TODO: Uncomment this when proper role designations are added to the database
          /*
          // Filter project managers: designation = "Project Manager" or role = "Project Manager"
          const projectManagers = allEmployees.filter((emp: any) => {
            const designation = emp.designation?.toLowerCase() || '';
            const role = emp.role?.toLowerCase() || '';
            return designation.includes('project manager') || role.includes('project manager');
          });
          
          // If no project managers found, include admins and super admins
          if (projectManagers.length === 0) {
            const admins = allEmployees.filter((emp: any) => {
              const designation = emp.designation?.toLowerCase() || '';
              const role = emp.role?.toLowerCase() || '';
              return designation.includes('admin') || role.includes('admin') || 
                     designation.includes('super admin') || role.includes('super admin');
            });
            
            // If no admins found either, show all employees
            if (admins.length === 0) {
              setProjectManagers(allEmployees);
            } else {
              setProjectManagers(admins);
            }
          } else {
            setProjectManagers(projectManagers);
          }
          */
        } else {
          
          setEmployees([]);
          setProjectManagers([]);
        }
      } catch (error) {
        
        setEmployees([]);
        setProjectManagers([]);
      }
    } catch (error) {
      
      toast.error('Failed to load project data');
      router.push('/modules/project-management');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.customer_id || !formData.start_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      const submitData = {
        ...formData,
        start_date: formData.start_date?.toISOString(),
        end_date: formData.end_date?.toISOString(),
        budget: parseFloat(formData.budget) || 0,
        initial_budget: parseFloat(formData.initial_budget) || 0,
      };

      const response = (await ApiService.updateProject(projectId, submitData)) as any;

      toast.success('Project updated successfully!');
      router.push(`/modules/project-management/${projectId}`);
    } catch (error) {
      
      toast.error('Failed to update project');
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading project details...</p>
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
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <Link href="/modules/project-management">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/modules/project-management/${projectId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Project</h1>
            <p className="text-muted-foreground">Update project details and information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
            <CardDescription>Essential project details and identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_id">Client *</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={value => handleInputChange('customer_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client">
                      {formData.customer_id &&
                        customers.find(c => c.id.toString() === formData.customer_id.toString())
                          ?.company_name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Describe the project scope and objectives"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location_id">Project Location</Label>
                <Select
                  value={formData.location_id}
                  onValueChange={value => handleInputChange('location_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location">
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
              <div className="space-y-2">
                <Label htmlFor="manager_id">Project Manager</Label>
                <Select
                  value={formData.manager_id}
                  onValueChange={value => handleInputChange('manager_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager">
                      {formData.manager_id &&
                        projectManagers.find(
                          e => e.id.toString() === formData.manager_id.toString()
                        ) &&
                        `${projectManagers.find(e => e.id.toString() === formData.manager_id.toString())?.first_name} ${projectManagers.find(e => e.id.toString() === formData.manager_id.toString())?.last_name}`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {projectManagers.map(employee => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.first_name} {employee.last_name}
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
              <span>Timeline & Status</span>
            </CardTitle>
            <CardDescription>Project timeline and current status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, 'PPP') : 'Pick a date'}
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
                <Label htmlFor="end_date">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, 'PPP') : 'Pick a date'}
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={value => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={value => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
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
              <span>Budget Information</span>
            </CardTitle>
            <CardDescription>Project budget and financial details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Total Budget</Label>
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
                <Label htmlFor="initial_budget">Initial Budget</Label>
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
              <span>Project Planning</span>
            </CardTitle>
            <CardDescription>Detailed project planning information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objectives">Project Objectives</Label>
                <Textarea
                  id="objectives"
                  value={formData.objectives}
                  onChange={e => handleInputChange('objectives', e.target.value)}
                  placeholder="Define project objectives"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scope">Project Scope</Label>
                <Textarea
                  id="scope"
                  value={formData.scope}
                  onChange={e => handleInputChange('scope', e.target.value)}
                  placeholder="Define project scope"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverables">Deliverables</Label>
              <Textarea
                id="deliverables"
                value={formData.deliverables}
                onChange={e => handleInputChange('deliverables', e.target.value)}
                placeholder="List project deliverables"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="constraints">Constraints</Label>
                <Textarea
                  id="constraints"
                  value={formData.constraints}
                  onChange={e => handleInputChange('constraints', e.target.value)}
                  placeholder="Project constraints"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assumptions">Assumptions</Label>
                <Textarea
                  id="assumptions"
                  value={formData.assumptions}
                  onChange={e => handleInputChange('assumptions', e.target.value)}
                  placeholder="Project assumptions"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risks">Risks</Label>
              <Textarea
                id="risks"
                value={formData.risks}
                onChange={e => handleInputChange('risks', e.target.value)}
                placeholder="Identify project risks"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link href={`/modules/project-management/${projectId}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
