'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from '@/components/protected-route';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Save, User, FileText, CreditCard, Shield, MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useConfirmationDialog } from '@/components/providers/confirmation-provider';

interface Department {
  id: number;
  name: string;
  code?: string;
}

interface Designation {
  id: number;
  name: string;
  department_id?: number;
  description?: string;
}

interface EmployeeFormData {
  // Basic Information
  first_name: string;
  middle_name?: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  hire_date?: string;
  nationality?: string;
  
  // Address
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Employment Details
  department_id?: number | null;
  designation_id?: number | null;
  supervisor?: string;
  status: string;
  
  // Salary Information
  basic_salary: number;
  food_allowance: number;
  housing_allowance: number;
  transport_allowance: number;
  hourly_rate?: number;
  absent_deduction_rate: number;
  overtime_rate_multiplier: number;
  overtime_fixed_rate?: number;
  
  // Bank Information
  bank_name?: string;
  bank_account_number?: string;
  bank_iban?: string;
  
  // Contract Details
  contract_hours_per_day: number;
  contract_days_per_month: number;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Notes
  notes?: string;
  
  // Advance Settings
  advance_salary_eligible: boolean;
  
  // Documents
  iqama_number?: string;
  iqama_expiry?: string;
  iqama_cost?: number;
  passport_number?: string;
  passport_expiry?: string;
  driving_license_number?: string;
  driving_license_expiry?: string;
  driving_license_cost?: number;
  operator_license_number?: string;
  operator_license_expiry?: string;
  operator_license_cost?: number;
  tuv_certification_number?: string;
  tuv_certification_expiry?: string;
  tuv_certification_cost?: number;
  spsp_license_number?: string;
  spsp_license_expiry?: string;
  spsp_license_cost?: number;
  
  // Operator Settings
  is_operator: boolean;
  
  // Access Control
  access_start_date?: string;
  access_end_date?: string;
  access_restriction_reason?: string;
}

export default function CreateEmployeePage() {
  const { t } = useTranslation(['common', 'employee']);
  const router = useRouter();
  const { hasPermission } = useRBAC();
  const { confirm } = useConfirmationDialog();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});

  // Add modal states
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showAddDesignation, setShowAddDesignation] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: "", code: "" });
  const [newDesignation, setNewDesignation] = useState({ name: "", description: "" });
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [addingDesignation, setAddingDesignation] = useState(false);

  // Edit modal states
  const [showEditDepartment, setShowEditDepartment] = useState(false);
  const [showEditDesignation, setShowEditDesignation] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [updatingDepartment, setUpdatingDepartment] = useState(false);
  const [updatingDesignation, setUpdatingDesignation] = useState(false);

  const [formData, setFormData] = useState<EmployeeFormData>({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    hire_date: '',
    nationality: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    department_id: null,
    designation_id: null,
    supervisor: '',
    status: 'active',
    basic_salary: 0,
    food_allowance: 0,
    housing_allowance: 0,
    transport_allowance: 0,
    hourly_rate: 0,
    absent_deduction_rate: 0,
    overtime_rate_multiplier: 1.5,
    overtime_fixed_rate: 0,
    bank_name: '',
    bank_account_number: '',
    bank_iban: '',
    contract_hours_per_day: 8,
    contract_days_per_month: 26,
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    notes: '',
    advance_salary_eligible: true,
    iqama_number: '',
    iqama_expiry: '',
    iqama_cost: 0,
    passport_number: '',
    passport_expiry: '',
    driving_license_number: '',
    driving_license_expiry: '',
    driving_license_cost: 0,
    operator_license_number: '',
    operator_license_expiry: '',
    operator_license_cost: 0,
    tuv_certification_number: '',
    tuv_certification_expiry: '',
    tuv_certification_cost: 0,
    spsp_license_number: '',
    spsp_license_expiry: '',
    spsp_license_cost: 0,
    is_operator: false,
    access_start_date: '',
    access_end_date: '',
    access_restriction_reason: '',
  });

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDepartments(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const response = await fetch('/api/designations');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDesignations(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching designations:', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchDesignations();
  }, []);

  // Check permissions
  if (!hasPermission('create', 'Employee')) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">
                  {t('common:accessDenied')}
                </h2>
                <p className="text-gray-600 mb-4">
                  {t('employee:messages.noCreatePermission')}
                </p>
                <Link href="/modules/employee-management">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('common:backToList')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  // Add new department
  const handleAddDepartment = async () => {
    if (!newDepartment.name.trim()) {
      toast.error('Department name is required');
      return;
    }

    try {
      setAddingDepartment(true);
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDepartment.name.trim(),
          code: newDepartment.code?.trim() || null,
          description: null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Department added successfully');
        setDepartments(prev => [...prev, result.data]);
        setFormData(prev => ({ ...prev, department_id: result.data.id }));
        setNewDepartment({ name: "", code: "" });
        setShowAddDepartment(false);
      } else {
        // If creation fails, try to refresh the departments list
        toast.error(result.message || 'Failed to add department');
        
        // Refresh departments list in case there was a sync issue
        try {
          const refreshResponse = await fetch('/api/departments');
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            setDepartments(refreshData.data || []);
          }
        } catch (refreshError) {
          console.error('Error refreshing departments:', refreshError);
        }
      }
    } catch (error) {
      console.error('Error adding department:', error);
      toast.error('Failed to add department. Please try again.');
      
      // Refresh departments list in case there was a sync issue
      try {
        const refreshResponse = await fetch('/api/departments');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setDepartments(refreshData.data || []);
        }
      } catch (refreshError) {
        console.error('Error refreshing departments:', refreshError);
      }
    } finally {
      setAddingDepartment(false);
    }
  };

  // Add new designation
  const handleAddDesignation = async () => {
    if (!newDesignation.name.trim()) {
      toast.error('Designation name is required');
      return;
    }

    try {
      setAddingDesignation(true);
      const response = await fetch('/api/designations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDesignation.name.trim(),
          description: newDesignation.description?.trim() || null,
          department_id: formData.department_id || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Designation added successfully');
        setDesignations(prev => [...prev, result.data]);
        setFormData(prev => ({ ...prev, designation_id: result.data.id }));
        setNewDesignation({ name: "", description: "" });
        setShowAddDesignation(false);
      } else {
        toast.error(result.message || 'Failed to add designation');
      }
    } catch (error) {
      console.error('Error adding designation:', error);
      toast.error('Failed to add designation');
    } finally {
      setAddingDesignation(false);
    }
  };

  // Edit department
  const handleEditDepartment = async () => {
    if (!editingDepartment || !editingDepartment.name.trim()) {
      toast.error('Department name is required');
      return;
    }

    try {
      setUpdatingDepartment(true);
      const response = await fetch(`/api/departments/${editingDepartment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingDepartment.name.trim(),
          code: editingDepartment.code?.trim() || null,
          description: null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Department updated successfully');
        setDepartments(prev => 
          prev.map(dept => 
            dept.id === editingDepartment.id ? result.data : dept
          )
        );
        setEditingDepartment(null);
        setShowEditDepartment(false);
      } else {
        toast.error(result.message || 'Failed to update department');
      }
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error('Failed to update department');
    } finally {
      setUpdatingDepartment(false);
    }
  };

  // Edit designation
  const handleEditDesignation = async () => {
    if (!editingDesignation || !editingDesignation.name.trim()) {
      toast.error('Designation name is required');
      return;
    }

    try {
      setUpdatingDesignation(true);
      const response = await fetch(`/api/designations/${editingDesignation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingDesignation.name.trim(),
          description: editingDesignation.description?.trim() || null,
          department_id: editingDesignation.department_id || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Designation updated successfully');
        setDesignations(prev => 
          prev.map(desig => 
            desig.id === editingDesignation.id ? result.data : desig
          )
        );
        setEditingDesignation(null);
        setShowEditDesignation(false);
      } else {
        toast.error(result.message || 'Failed to update designation');
      }
    } catch (error) {
      console.error('Error updating designation:', error);
      toast.error('Failed to update designation');
    } finally {
      setUpdatingDesignation(false);
    }
  };

  const handleInputChange = (field: keyof EmployeeFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (field: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', field);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUploadedFiles(prev => ({
            ...prev,
            [field]: result.url
          }));
          toast.success(t('employee:messages.fileUploadSuccess'));
        } else {
          toast.error(t('employee:messages.fileUploadError'));
        }
      } else {
        toast.error(t('employee:messages.fileUploadError'));
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(t('employee:messages.fileUploadError'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const employeeData = {
        ...formData,
        ...uploadedFiles
      };

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(t('employee:messages.createSuccess'));
          router.push('/modules/employee-management');
        } else {
          toast.error(result.message || t('employee:messages.createError'));
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || t('employee:messages.createError'));
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error(t('employee:messages.createError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Link href="/modules/employee-management">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common:backToList')}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{t('employee:create.title')}</h1>
          <p className="text-gray-600 mt-2">{t('employee:create.description')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('employee:create.tabs.basic')}
              </TabsTrigger>
              <TabsTrigger value="employment" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t('employee:create.tabs.employment')}
              </TabsTrigger>
              <TabsTrigger value="salary" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {t('employee:create.tabs.salary')}
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('employee:create.tabs.documents')}
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('employee:create.tabs.address')}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t('employee:create.tabs.settings')}
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('employee:create.basic.title')}</CardTitle>
                  <CardDescription>{t('employee:create.basic.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="first_name">{t('employee:fields.firstName')} *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="middle_name">{t('employee:fields.middleName')}</Label>
                      <Input
                        id="middle_name"
                        value={formData.middle_name}
                        onChange={(e) => handleInputChange('middle_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">{t('employee:fields.lastName')} *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">{t('employee:fields.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">{t('employee:fields.phone')}</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="date_of_birth">{t('employee:fields.dateOfBirth')}</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hire_date">{t('employee:fields.hireDate')}</Label>
                      <Input
                        id="hire_date"
                        type="date"
                        value={formData.hire_date}
                        onChange={(e) => handleInputChange('hire_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">{t('employee:fields.nationality')}</Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Employment Details Tab */}
            <TabsContent value="employment" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('employee:create.employment.title')}</CardTitle>
                  <CardDescription>{t('employee:create.employment.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department_id">{t('employee:fields.department')}</Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.department_id?.toString() || ""}
                          onValueChange={(value) => handleInputChange('department_id', parseInt(value))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={t('employee:fields.selectDepartment')} />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={`dept-${dept.id}`} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddDepartment(true)}
                          className="px-3"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const selectedDept = departments.find(d => d.id === formData.department_id);
                            if (selectedDept) {
                              setEditingDepartment(selectedDept);
                              setShowEditDepartment(true);
                            } else {
                              toast.error('Please select a department to edit');
                            }
                          }}
                          className="px-3"
                          disabled={!formData.department_id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const selectedDept = departments.find(d => d.id === formData.department_id);
                            if (selectedDept) {
                              const confirmed = await confirm({
                                title: t('employee:confirmDelete.department.title'),
                                description: t('employee:confirmDelete.department.description', { name: selectedDept.name }),
                                variant: "destructive",
                                confirmText: t('common:delete'),
                                cancelText: t('common:cancel'),
                              });
                              
                              if (confirmed) {
                                try {
                                  const response = await fetch(`/api/departments/${selectedDept.id}`, {
                                    method: 'DELETE',
                                  });
                                  const result = await response.json();
                                  if (result.success) {
                                    toast.success(t('employee:messages.deleteSuccess'));
                                    setDepartments(prev => prev.filter(d => d.id !== selectedDept.id));
                                    setFormData(prev => ({ ...prev, department_id: null }));
                                  } else {
                                    toast.error(result.message || t('employee:messages.deleteError'));
                                  }
                                } catch (error) {
                                  console.error('Error deleting department:', error);
                                  toast.error(t('employee:messages.deleteError'));
                                }
                              }
                            } else {
                              toast.error('Please select a department to delete');
                            }
                          }}
                          className="px-3"
                          disabled={!formData.department_id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="designation_id">{t('employee:fields.designation')}</Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.designation_id?.toString() || ""}
                          onValueChange={(value) => handleInputChange('designation_id', parseInt(value))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={t('employee:fields.selectDesignation')} />
                          </SelectTrigger>
                          <SelectContent>
                            {designations.map((desig) => (
                              <SelectItem key={`desig-${desig.id}`} value={desig.id.toString()}>
                                {desig.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddDesignation(true)}
                          className="px-3"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const selectedDesig = designations.find(d => d.id === formData.designation_id);
                            if (selectedDesig) {
                              setEditingDesignation(selectedDesig);
                              setShowEditDesignation(true);
                            } else {
                              toast.error('Please select a designation to edit');
                            }
                          }}
                          className="px-3"
                          disabled={!formData.designation_id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const selectedDesig = designations.find(d => d.id === formData.designation_id);
                            if (selectedDesig) {
                              const confirmed = await confirm({
                                title: t('employee:confirmDelete.designation.title'),
                                description: t('employee:confirmDelete.designation.description', { name: selectedDesig.name }),
                                variant: "destructive",
                                confirmText: t('common:delete'),
                                cancelText: t('common:cancel'),
                              });
                              
                              if (confirmed) {
                                try {
                                  const response = await fetch(`/api/designations/${selectedDesig.id}`, {
                                    method: 'DELETE',
                                  });
                                  const result = await response.json();
                                  if (result.success) {
                                    toast.success(t('employee:messages.deleteSuccess'));
                                    setDesignations(prev => prev.filter(d => d.id !== selectedDesig.id));
                                    setFormData(prev => ({ ...prev, designation_id: null }));
                                  } else {
                                    toast.error(result.message || t('employee:messages.deleteError'));
                                  }
                                } catch (error) {
                                  console.error('Error deleting designation:', error);
                                  toast.error(t('employee:messages.deleteError'));
                                }
                              }
                            } else {
                              toast.error('Please select a designation to delete');
                            }
                          }}
                          className="px-3"
                          disabled={!formData.designation_id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supervisor">{t('employee:fields.supervisor')}</Label>
                      <Input
                        id="supervisor"
                        value={formData.supervisor}
                        onChange={(e) => handleInputChange('supervisor', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">{t('employee:fields.status')}</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{t('employee:status.active')}</SelectItem>
                          <SelectItem value="inactive">{t('employee:status.inactive')}</SelectItem>
                          <SelectItem value="terminated">{t('employee:status.terminated')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contract_hours_per_day">{t('employee:fields.contractHoursPerDay')}</Label>
                      <Input
                        id="contract_hours_per_day"
                        type="number"
                        value={formData.contract_hours_per_day}
                        onChange={(e) => handleInputChange('contract_hours_per_day', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contract_days_per_month">{t('employee:fields.contractDaysPerMonth')}</Label>
                      <Input
                        id="contract_days_per_month"
                        type="number"
                        value={formData.contract_days_per_month}
                        onChange={(e) => handleInputChange('contract_days_per_month', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Salary Information Tab */}
            <TabsContent value="salary" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('employee:create.salary.title')}</CardTitle>
                  <CardDescription>{t('employee:create.salary.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="basic_salary">{t('employee:fields.basicSalary')} *</Label>
                      <Input
                        id="basic_salary"
                        type="number"
                        step="0.01"
                        value={formData.basic_salary}
                        onChange={(e) => handleInputChange('basic_salary', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourly_rate">{t('employee:fields.hourlyRate')}</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        step="0.01"
                        value={formData.hourly_rate}
                        onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="food_allowance">{t('employee:fields.foodAllowance')}</Label>
                      <Input
                        id="food_allowance"
                        type="number"
                        step="0.01"
                        value={formData.food_allowance}
                        onChange={(e) => handleInputChange('food_allowance', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="housing_allowance">{t('employee:fields.housingAllowance')}</Label>
                      <Input
                        id="housing_allowance"
                        type="number"
                        step="0.01"
                        value={formData.housing_allowance}
                        onChange={(e) => handleInputChange('housing_allowance', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="transport_allowance">{t('employee:fields.transportAllowance')}</Label>
                      <Input
                        id="transport_allowance"
                        type="number"
                        step="0.01"
                        value={formData.transport_allowance}
                        onChange={(e) => handleInputChange('transport_allowance', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="absent_deduction_rate">{t('employee:fields.absentDeductionRate')}</Label>
                      <Input
                        id="absent_deduction_rate"
                        type="number"
                        step="0.01"
                        value={formData.absent_deduction_rate}
                        onChange={(e) => handleInputChange('absent_deduction_rate', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="overtime_rate_multiplier">{t('employee:fields.overtimeRateMultiplier')}</Label>
                      <Input
                        id="overtime_rate_multiplier"
                        type="number"
                        step="0.1"
                        value={formData.overtime_rate_multiplier}
                        onChange={(e) => handleInputChange('overtime_rate_multiplier', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="overtime_fixed_rate">{t('employee:fields.overtimeFixedRate')}</Label>
                      <Input
                        id="overtime_fixed_rate"
                        type="number"
                        step="0.01"
                        value={formData.overtime_fixed_rate}
                        onChange={(e) => handleInputChange('overtime_fixed_rate', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bank_name">{t('employee:fields.bankName')}</Label>
                      <Input
                        id="bank_name"
                        value={formData.bank_name}
                        onChange={(e) => handleInputChange('bank_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_account_number">{t('employee:fields.bankAccountNumber')}</Label>
                      <Input
                        id="bank_account_number"
                        value={formData.bank_account_number}
                        onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_iban">{t('employee:fields.bankIban')}</Label>
                      <Input
                        id="bank_iban"
                        value={formData.bank_iban}
                        onChange={(e) => handleInputChange('bank_iban', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('employee:create.documents.title')}</CardTitle>
                  <CardDescription>{t('employee:create.documents.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Iqama Information */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">{t('employee:documents.iqama')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="iqama_number">{t('employee:fields.iqamaNumber')}</Label>
                        <Input
                          id="iqama_number"
                          value={formData.iqama_number}
                          onChange={(e) => handleInputChange('iqama_number', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="iqama_expiry">{t('employee:fields.iqamaExpiry')}</Label>
                        <Input
                          id="iqama_expiry"
                          type="date"
                          value={formData.iqama_expiry}
                          onChange={(e) => handleInputChange('iqama_expiry', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="iqama_cost">{t('employee:fields.iqamaCost')}</Label>
                        <Input
                          id="iqama_cost"
                          type="number"
                          step="0.01"
                          value={formData.iqama_cost}
                          onChange={(e) => handleInputChange('iqama_cost', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="iqama_file">{t('employee:fields.iqamaFile')}</Label>
                      <Input
                        id="iqama_file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('iqama_file', file);
                        }}
                      />
                    </div>
                  </div>

                  {/* Passport Information */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">{t('employee:documents.passport')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="passport_number">{t('employee:fields.passportNumber')}</Label>
                        <Input
                          id="passport_number"
                          value={formData.passport_number}
                          onChange={(e) => handleInputChange('passport_number', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="passport_expiry">{t('employee:fields.passportExpiry')}</Label>
                        <Input
                          id="passport_expiry"
                          type="date"
                          value={formData.passport_expiry}
                          onChange={(e) => handleInputChange('passport_expiry', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="passport_file">{t('employee:fields.passportFile')}</Label>
                      <Input
                        id="passport_file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('passport_file', file);
                        }}
                      />
                    </div>
                  </div>

                  {/* Driving License Information */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">{t('employee:documents.drivingLicense')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="driving_license_number">{t('employee:fields.drivingLicenseNumber')}</Label>
                        <Input
                          id="driving_license_number"
                          value={formData.driving_license_number}
                          onChange={(e) => handleInputChange('driving_license_number', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="driving_license_expiry">{t('employee:fields.drivingLicenseExpiry')}</Label>
                        <Input
                          id="driving_license_expiry"
                          type="date"
                          value={formData.driving_license_expiry}
                          onChange={(e) => handleInputChange('driving_license_expiry', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="driving_license_cost">{t('employee:fields.drivingLicenseCost')}</Label>
                        <Input
                          id="driving_license_cost"
                          type="number"
                          step="0.01"
                          value={formData.driving_license_cost}
                          onChange={(e) => handleInputChange('driving_license_cost', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="driving_license_file">{t('employee:fields.drivingLicenseFile')}</Label>
                      <Input
                        id="driving_license_file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('driving_license_file', file);
                        }}
                      />
                    </div>
                  </div>

                  {/* Operator License Information */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">{t('employee:documents.operatorLicense')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="operator_license_number">{t('employee:fields.operatorLicenseNumber')}</Label>
                        <Input
                          id="operator_license_number"
                          value={formData.operator_license_number}
                          onChange={(e) => handleInputChange('operator_license_number', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="operator_license_expiry">{t('employee:fields.operatorLicenseExpiry')}</Label>
                        <Input
                          id="operator_license_expiry"
                          type="date"
                          value={formData.operator_license_expiry}
                          onChange={(e) => handleInputChange('operator_license_expiry', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="operator_license_cost">{t('employee:fields.operatorLicenseCost')}</Label>
                        <Input
                          id="operator_license_cost"
                          type="number"
                          step="0.01"
                          value={formData.operator_license_cost}
                          onChange={(e) => handleInputChange('operator_license_cost', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="operator_license_file">{t('employee:fields.operatorLicenseFile')}</Label>
                      <Input
                        id="operator_license_file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('operator_license_file', file);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Address Tab */}
            <TabsContent value="address" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('employee:create.address.title')}</CardTitle>
                  <CardDescription>{t('employee:create.address.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="address">{t('employee:fields.address')}</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">{t('employee:fields.city')}</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">{t('employee:fields.state')}</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postal_code">{t('employee:fields.postalCode')}</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">{t('employee:fields.country')}</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">{t('employee:create.emergencyContact')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="emergency_contact_name">{t('employee:fields.emergencyContactName')}</Label>
                        <Input
                          id="emergency_contact_name"
                          value={formData.emergency_contact_name}
                          onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergency_contact_phone">{t('employee:fields.emergencyContactPhone')}</Label>
                        <Input
                          id="emergency_contact_phone"
                          value={formData.emergency_contact_phone}
                          onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergency_contact_relationship">{t('employee:fields.emergencyContactRelationship')}</Label>
                        <Input
                          id="emergency_contact_relationship"
                          value={formData.emergency_contact_relationship}
                          onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('employee:create.settings.title')}</CardTitle>
                  <CardDescription>{t('employee:create.settings.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="advance_salary_eligible"
                        checked={formData.advance_salary_eligible}
                        onCheckedChange={(checked) => handleInputChange('advance_salary_eligible', checked)}
                      />
                      <Label htmlFor="advance_salary_eligible">{t('employee:fields.advanceSalaryEligible')}</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_operator"
                        checked={formData.is_operator}
                        onCheckedChange={(checked) => handleInputChange('is_operator', checked)}
                      />
                      <Label htmlFor="is_operator">{t('employee:fields.isOperator')}</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="access_start_date">{t('employee:fields.accessStartDate')}</Label>
                      <Input
                        id="access_start_date"
                        type="date"
                        value={formData.access_start_date}
                        onChange={(e) => handleInputChange('access_start_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="access_end_date">{t('employee:fields.accessEndDate')}</Label>
                      <Input
                        id="access_end_date"
                        type="date"
                        value={formData.access_end_date}
                        onChange={(e) => handleInputChange('access_end_date', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="access_restriction_reason">{t('employee:fields.accessRestrictionReason')}</Label>
                    <Textarea
                      id="access_restriction_reason"
                      value={formData.access_restriction_reason}
                      onChange={(e) => handleInputChange('access_restriction_reason', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">{t('employee:fields.notes')}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end space-x-4">
            <Link href="/modules/employee-management">
              <Button variant="outline" type="button">
                {t('common:cancel')}
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('common:saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('common:save')}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Add Department Modal */}
        {showAddDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New Department</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dept_name">Department Name *</Label>
                  <Input
                    id="dept_name"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter department name"
                  />
                </div>
                <div>
                  <Label htmlFor="dept_code">Department Code</Label>
                  <Input
                    id="dept_code"
                    value={newDepartment.code}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Enter department code"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddDepartment(false);
                      setNewDepartment({ name: "", code: "" });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddDepartment}
                    disabled={addingDepartment}
                  >
                    {addingDepartment ? 'Adding...' : 'Add Department'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Designation Modal */}
        {showAddDesignation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New Designation</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="desig_name">Designation Name *</Label>
                  <Input
                    id="desig_name"
                    value={newDesignation.name}
                    onChange={(e) => setNewDesignation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter designation name"
                  />
                </div>
                <div>
                  <Label htmlFor="desig_description">Description</Label>
                  <Textarea
                    id="desig_description"
                    value={newDesignation.description}
                    onChange={(e) => setNewDesignation(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddDesignation(false);
                      setNewDesignation({ name: "", description: "" });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddDesignation}
                    disabled={addingDesignation}
                  >
                    {addingDesignation ? 'Adding...' : 'Add Designation'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Department Modal */}
        {showEditDepartment && editingDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Department</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_dept_name">Department Name *</Label>
                  <Input
                    id="edit_dept_name"
                    value={editingDepartment.name}
                    onChange={(e) => setEditingDepartment(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter department name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_dept_code">Department Code</Label>
                  <Input
                    id="edit_dept_code"
                    value={editingDepartment.code || ''}
                    onChange={(e) => setEditingDepartment(prev => prev ? { ...prev, code: e.target.value } : null)}
                    placeholder="Enter department code"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditDepartment(false);
                      setEditingDepartment(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleEditDepartment}
                    disabled={updatingDepartment}
                  >
                    {updatingDepartment ? 'Updating...' : 'Update Department'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Designation Modal */}
        {showEditDesignation && editingDesignation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Designation</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_desig_name">Designation Name *</Label>
                  <Input
                    id="edit_desig_name"
                    value={editingDesignation.name}
                    onChange={(e) => setEditingDesignation(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter designation name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_desig_description">Description</Label>
                  <Textarea
                    id="edit_desig_description"
                    value={editingDesignation.description || ''}
                    onChange={(e) => setEditingDesignation(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditDesignation(false);
                      setEditingDesignation(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleEditDesignation}
                    disabled={updatingDesignation}
                  >
                    {updatingDesignation ? 'Updating...' : 'Update Designation'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 