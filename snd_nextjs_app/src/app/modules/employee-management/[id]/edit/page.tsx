"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Calendar, DollarSign, IdCard, Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Employee {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone: string;
  employee_id: string;
  file_number: string;
  status: string;
  hire_date: string;
  date_of_birth?: string;
  nationality: string;
  current_location?: string;
  hourly_rate?: number;
  basic_salary?: number;
  overtime_rate_multiplier?: number;
  overtime_fixed_rate?: number;
  contract_days_per_month?: number;
  contract_hours_per_day?: number;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  iqama_number?: string;
  iqama_expiry?: string;
  passport_number?: string;
  passport_expiry?: string;
  driving_license_number?: string;
  driving_license_expiry?: string;
  operator_license_number?: string;
  operator_license_expiry?: string;
  tuv_certification_number?: string;
  tuv_certification_expiry?: string;
  spsp_license_number?: string;
  spsp_license_expiry?: string;
  department?: {
    id: number;
    name: string;
  };
  designation?: {
    id: number;
    name: string;
  };
}

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

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  
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

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    employee_id: "",
    file_number: "",
    status: "active",
    hire_date: "",
    date_of_birth: "",
    nationality: "",
    current_location: "",
    hourly_rate: "",
    basic_salary: "",
    overtime_rate_multiplier: "1.5",
    overtime_fixed_rate: "",
    contract_days_per_month: "26",
    contract_hours_per_day: "8",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    iqama_number: "",
    iqama_expiry: "",
    passport_number: "",
    passport_expiry: "",
    driving_license_number: "",
    driving_license_expiry: "",
    operator_license_number: "",
    operator_license_expiry: "",
    tuv_certification_number: "",
    tuv_certification_expiry: "",
    spsp_license_number: "",
    spsp_license_expiry: "",
    department_id: "",
    designation_id: "",
  });

  // Fetch departments and designations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [departmentsResponse, designationsResponse] = await Promise.all([
          fetch('/api/departments'),
          fetch('/api/designations')
        ]);

        if (departmentsResponse.ok) {
          const deptData = await departmentsResponse.json();
          setDepartments(deptData.data || []);
        }

        if (designationsResponse.ok) {
          const desigData = await designationsResponse.json();
          setDesignations(desigData.data || []);
        }
      } catch (error) {
        console.error('Error fetching departments/designations:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/employees/${params.id}`);
        const result = await response.json();

        if (result.success) {
          const emp = result.employee;
          setEmployee(emp);
          setFormData({
            first_name: emp.first_name || "",
            middle_name: emp.middle_name || "",
            last_name: emp.last_name || "",
            email: emp.email || "",
            phone: emp.phone || "",
            employee_id: emp.employee_id || "",
            file_number: emp.file_number || "",
            status: emp.status || "active",
            hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : "",
            date_of_birth: emp.date_of_birth ? emp.date_of_birth.split('T')[0] : "",
            nationality: emp.nationality || "",
            current_location: emp.current_location || "",
            hourly_rate: emp.hourly_rate ? emp.hourly_rate.toString() : "",
            basic_salary: emp.basic_salary ? emp.basic_salary.toString() : "",
            overtime_rate_multiplier: emp.overtime_fixed_rate ? "0" : (emp.overtime_rate_multiplier ? emp.overtime_rate_multiplier.toString() : "1.5"),
            overtime_fixed_rate: emp.overtime_fixed_rate ? emp.overtime_fixed_rate.toString() : "",
            contract_days_per_month: emp.contract_days_per_month ? emp.contract_days_per_month.toString() : "26",
            contract_hours_per_day: emp.contract_hours_per_day ? emp.contract_hours_per_day.toString() : "8",
            address: emp.address || "",
            city: emp.city || "",
            state: emp.state || "",
            postal_code: emp.postal_code || "",
            country: emp.country || "",
            emergency_contact_name: emp.emergency_contact_name || "",
            emergency_contact_phone: emp.emergency_contact_phone || "",
            emergency_contact_relationship: emp.emergency_contact_relationship || "",
            iqama_number: emp.iqama_number || "",
            iqama_expiry: emp.iqama_expiry ? emp.iqama_expiry.split('T')[0] : "",
            passport_number: emp.passport_number || "",
            passport_expiry: emp.passport_expiry ? emp.passport_expiry.split('T')[0] : "",
            driving_license_number: emp.driving_license_number || "",
            driving_license_expiry: emp.driving_license_expiry ? emp.driving_license_expiry.split('T')[0] : "",
            operator_license_number: emp.operator_license_number || "",
            operator_license_expiry: emp.operator_license_expiry ? emp.operator_license_expiry.split('T')[0] : "",
            tuv_certification_number: emp.tuv_certification_number || "",
            tuv_certification_expiry: emp.tuv_certification_expiry ? emp.tuv_certification_expiry.split('T')[0] : "",
            spsp_license_number: emp.spsp_license_number || "",
            spsp_license_expiry: emp.spsp_license_expiry ? emp.spsp_license_expiry.split('T')[0] : "",
            department_id: emp.department?.id ? emp.department.id.toString() : "",
            designation_id: emp.designation?.id ? emp.designation.id.toString() : "",
          });
        } else {
          toast.error(result.message || 'Failed to fetch employee');
          router.push('/modules/employee-management');
        }
      } catch (error) {
        console.error('Error fetching employee:', error);
        toast.error('Failed to fetch employee');
        router.push('/modules/employee-management');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEmployee();
    }
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/employees/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          hourly_rate: formData.hourly_rate && formData.hourly_rate.trim() !== '' ? parseFloat(formData.hourly_rate) : null,
          basic_salary: formData.basic_salary && formData.basic_salary.trim() !== '' ? parseFloat(formData.basic_salary) : null,
          overtime_rate_multiplier: formData.overtime_fixed_rate && formData.overtime_fixed_rate.trim() !== '' ? 0 : (formData.overtime_rate_multiplier && formData.overtime_rate_multiplier.trim() !== '' ? parseFloat(formData.overtime_rate_multiplier) : 1.5),
          overtime_fixed_rate: formData.overtime_fixed_rate && formData.overtime_fixed_rate.trim() !== '' ? parseFloat(formData.overtime_fixed_rate) : null,
          contract_days_per_month: formData.contract_days_per_month ? parseInt(formData.contract_days_per_month) : 26,
          contract_hours_per_day: formData.contract_hours_per_day ? parseInt(formData.contract_hours_per_day) : 8,
          department_id: formData.department_id ? parseInt(formData.department_id) : null,
          designation_id: formData.designation_id ? parseInt(formData.designation_id) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Employee updated successfully');
        router.push(`/modules/employee-management/${params.id}`);
      } else {
        toast.error(result.message || 'Failed to update employee');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  const calculateHourlyRate = (basicSalary: number, contractDays: number, contractHours: number): number => {
    if (contractDays <= 0 || contractHours <= 0) {
      return 0;
    }
    return Math.round((basicSalary / (contractDays * contractHours)) * 100) / 100;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Auto-calculate hourly rate when basic salary, contract days, or contract hours change
      if (field === 'basic_salary' || field === 'contract_days_per_month' || field === 'contract_hours_per_day') {
        const basicSalary = parseFloat(newData.basic_salary) || 0;
        const contractDays = parseFloat(newData.contract_days_per_month) || 26;
        const contractHours = parseFloat(newData.contract_hours_per_day) || 8;
        
        const calculatedHourlyRate = calculateHourlyRate(basicSalary, contractDays, contractHours);
        newData.hourly_rate = calculatedHourlyRate.toString();
      }

      return newData;
    });
  };

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
        setFormData(prev => ({ ...prev, department_id: result.data.id.toString() }));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading employee...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Employee not found</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href={`/modules/employee-management/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <User className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Edit Employee</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={formData.middle_name}
                  onChange={(e) => handleInputChange('middle_name', e.target.value)}
                  placeholder="Enter middle name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  placeholder="Enter nationality"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID *</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  placeholder="Enter employee ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file_number">File Number</Label>
                <Input
                  id="file_number"
                  value={formData.file_number}
                  onChange={(e) => handleInputChange('file_number', e.target.value)}
                  placeholder="Enter file number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department_id">Department</Label>
                <div className="flex gap-2">
                  <Select value={formData.department_id || "none"} onValueChange={(value) => handleInputChange('department_id', value === "none" ? "" : value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Department</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id.toString()}>
                          {department.name}
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
                      const selectedDept = departments.find(d => d.id.toString() === formData.department_id);
                      if (selectedDept) {
                        setEditingDepartment(selectedDept);
                        setShowEditDepartment(true);
                      } else {
                        toast.error('Please select a department to edit');
                      }
                    }}
                    className="px-3"
                    disabled={!formData.department_id || formData.department_id === ""}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation_id">Designation</Label>
                <div className="flex gap-2">
                  <Select value={formData.designation_id || "none"} onValueChange={(value) => handleInputChange('designation_id', value === "none" ? "" : value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Designation</SelectItem>
                      {designations.map((designation) => (
                        <SelectItem key={designation.id} value={designation.id.toString()}>
                          {designation.name}
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
                      const selectedDesig = designations.find(d => d.id.toString() === formData.designation_id);
                      if (selectedDesig) {
                        setEditingDesignation(selectedDesig);
                        setShowEditDesignation(true);
                      } else {
                        toast.error('Please select a designation to edit');
                      }
                    }}
                    className="px-3"
                    disabled={!formData.designation_id || formData.designation_id === ""}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleInputChange('hire_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_location">Current Location</Label>
                <Input
                  id="current_location"
                  value={formData.current_location}
                  onChange={(e) => handleInputChange('current_location', e.target.value)}
                  placeholder="Enter current location"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basic_salary">Basic Salary</Label>
                <Input
                  id="basic_salary"
                  type="number"
                  step="0.01"
                  value={formData.basic_salary}
                  onChange={(e) => handleInputChange('basic_salary', e.target.value)}
                  placeholder="Enter basic salary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_days_per_month">Contract Days Per Month</Label>
                <Input
                  id="contract_days_per_month"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.contract_days_per_month}
                  onChange={(e) => handleInputChange('contract_days_per_month', e.target.value)}
                  placeholder="Enter contract days per month"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract_hours_per_day">Contract Hours Per Day</Label>
                <Input
                  id="contract_hours_per_day"
                  type="number"
                  min="1"
                  max="24"
                  value={formData.contract_hours_per_day}
                  onChange={(e) => handleInputChange('contract_hours_per_day', e.target.value)}
                  placeholder="Enter contract hours per day"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate (Auto-calculated)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                  placeholder="Auto-calculated hourly rate"
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Choose one overtime calculation method:
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-2">
                   <Label htmlFor="overtime_rate_multiplier">Overtime Rate Multiplier</Label>
                   <Input
                     id="overtime_rate_multiplier"
                     type="number"
                     step="0.01"
                     min="0"
                     value={parseFloat(formData.overtime_fixed_rate) > 0 ? "0" : formData.overtime_rate_multiplier}
                     placeholder="1.5"
                     readOnly
                     className="bg-gray-50"
                   />
                   <div className="text-xs text-muted-foreground">
                     Multiplies the hourly rate (e.g., 1.5x for time and a half) - Auto-calculated
                   </div>
                 </div>

                                 <div className="space-y-2">
                   <Label htmlFor="overtime_fixed_rate">Overtime Fixed Rate</Label>
                   <Input
                     id="overtime_fixed_rate"
                     type="number"
                     step="0.01"
                     min="0"
                     value={formData.overtime_fixed_rate}
                     onChange={(e) => {
                       handleInputChange('overtime_fixed_rate', e.target.value);
                       // Set multiplier to 0 when fixed rate is used
                       if (e.target.value && e.target.value.trim() !== '') {
                         handleInputChange('overtime_rate_multiplier', '0');
                       } else {
                         handleInputChange('overtime_rate_multiplier', '1.5');
                       }
                     }}
                     placeholder="Fixed rate per hour"
                   />
                   <div className="text-xs text-muted-foreground">
                     Fixed amount per overtime hour (overrides multiplier)
                   </div>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="Enter postal code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  placeholder="Enter emergency contact name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  placeholder="Enter emergency contact phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                <Input
                  id="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                  placeholder="Enter relationship"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IdCard className="h-5 w-5" />
              Documents & Licenses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iqama_number">Iqama Number</Label>
                <Input
                  id="iqama_number"
                  value={formData.iqama_number}
                  onChange={(e) => handleInputChange('iqama_number', e.target.value)}
                  placeholder="Enter Iqama number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iqama_expiry">Iqama Expiry</Label>
                <Input
                  id="iqama_expiry"
                  type="date"
                  value={formData.iqama_expiry}
                  onChange={(e) => handleInputChange('iqama_expiry', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passport_number">Passport Number</Label>
                <Input
                  id="passport_number"
                  value={formData.passport_number}
                  onChange={(e) => handleInputChange('passport_number', e.target.value)}
                  placeholder="Enter passport number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passport_expiry">Passport Expiry</Label>
                <Input
                  id="passport_expiry"
                  type="date"
                  value={formData.passport_expiry}
                  onChange={(e) => handleInputChange('passport_expiry', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driving_license_number">Driving License Number</Label>
                <Input
                  id="driving_license_number"
                  value={formData.driving_license_number}
                  onChange={(e) => handleInputChange('driving_license_number', e.target.value)}
                  placeholder="Enter driving license number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driving_license_expiry">Driving License Expiry</Label>
                <Input
                  id="driving_license_expiry"
                  type="date"
                  value={formData.driving_license_expiry}
                  onChange={(e) => handleInputChange('driving_license_expiry', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operator_license_number">Operator License Number</Label>
                <Input
                  id="operator_license_number"
                  value={formData.operator_license_number}
                  onChange={(e) => handleInputChange('operator_license_number', e.target.value)}
                  placeholder="Enter operator license number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator_license_expiry">Operator License Expiry</Label>
                <Input
                  id="operator_license_expiry"
                  type="date"
                  value={formData.operator_license_expiry}
                  onChange={(e) => handleInputChange('operator_license_expiry', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tuv_certification_number">TUV Certification Number</Label>
                <Input
                  id="tuv_certification_number"
                  value={formData.tuv_certification_number}
                  onChange={(e) => handleInputChange('tuv_certification_number', e.target.value)}
                  placeholder="Enter TUV certification number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tuv_certification_expiry">TUV Certification Expiry</Label>
                <Input
                  id="tuv_certification_expiry"
                  type="date"
                  value={formData.tuv_certification_expiry}
                  onChange={(e) => handleInputChange('tuv_certification_expiry', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spsp_license_number">SPSP License Number</Label>
                <Input
                  id="spsp_license_number"
                  value={formData.spsp_license_number}
                  onChange={(e) => handleInputChange('spsp_license_number', e.target.value)}
                  placeholder="Enter SPSP license number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spsp_license_expiry">SPSP License Expiry</Label>
                <Input
                  id="spsp_license_expiry"
                  type="date"
                  value={formData.spsp_license_expiry}
                  onChange={(e) => handleInputChange('spsp_license_expiry', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href={`/modules/employee-management/${params.id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
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
  );
} 