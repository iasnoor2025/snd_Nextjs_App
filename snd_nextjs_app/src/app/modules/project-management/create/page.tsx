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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import apiService from '@/lib/api';
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
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
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

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectManagers, setProjectManagers] = useState<Employee[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch customers
      try {
        const customersResponse = (await apiService.get('/customers?limit=1000')) as any;
        if (customersResponse.customers) {
          setCustomers(customersResponse.customers || []);
        } else {
          console.error('Failed to fetch customers');
          setCustomers([]);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]);
      }

      // Fetch locations (optional - might not be implemented yet)
      try {
        const locationsResponse = (await apiService.get('/locations?limit=1000')) as any;
        if (locationsResponse.success && locationsResponse.data) {
          setLocations(locationsResponse.data || []);
        } else {
          console.log('Locations API not available yet');
          setLocations([]);
        }
      } catch (error) {
        console.log('Locations API not available yet');
        setLocations([]);
      }

      // Fetch employees
      try {
        const employeesResponse = (await apiService.getEmployees({ per_page: 1000 })) as any;
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
          console.error('Failed to fetch employees');
          setEmployees([]);
          setProjectManagers([]);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        setEmployees([]);
        setProjectManagers([]);
      }
    } catch (error) {
      console.error('Error in fetchInitialData:', error);
      toast.error('Failed to load initial data');
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
      toast.error('Please fill in all required fields');
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
      };

      const response = (await apiService.createProject(submitData)) as any;

      // TODO: Project file upload endpoint doesn't exist yet
      // if (selectedFiles.length > 0) {
      //   const formDataFiles = new FormData();
      //   selectedFiles.forEach(file => {
      //     formDataFiles.append('files[]', file);
      //   });
      //   await apiService.post(`/projects/${response.data.id}/files`, formDataFiles);
      // }

      toast.success('Project created successfully!');
      router.push(`/modules/project-management/${response.data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/modules/project-management">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create New Project</h1>
            <p className="text-muted-foreground">
              Set up a new construction project with all necessary details
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="constraints">Constraints</Label>
                <Textarea
                  id="constraints"
                  value={formData.constraints}
                  onChange={e => handleInputChange('constraints', e.target.value)}
                  placeholder="List project constraints"
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assumptions">Assumptions</Label>
                <Textarea
                  id="assumptions"
                  value={formData.assumptions}
                  onChange={e => handleInputChange('assumptions', e.target.value)}
                  placeholder="List project assumptions"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="risks">Initial Risks</Label>
                <Textarea
                  id="risks"
                  value={formData.risks}
                  onChange={e => handleInputChange('risks', e.target.value)}
                  placeholder="Identify initial project risks"
                  rows={3}
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
              <span>Project Documents</span>
            </CardTitle>
            <CardDescription>Upload relevant project documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documents">Upload Documents</Label>
              <Input
                id="documents"
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <p className="text-sm text-muted-foreground">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files</Label>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        Remove
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
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Any additional information about the project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes or comments"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link href="/modules/project-management">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating Project...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Project
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
