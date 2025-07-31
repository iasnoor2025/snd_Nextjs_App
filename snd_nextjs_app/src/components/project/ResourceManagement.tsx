'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, FileText, Clock, DollarSign, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import apiService from '@/lib/api';

interface ProjectResource {
  id: string;
  type: string;
  name: string;
  description?: string;
  quantity?: number;
  unit_cost?: number;
  total_cost?: number;
  date?: string;
  status?: string;
  equipment_name?: string;
  operator_name?: string;
  worker_name?: string;
  position?: string;
  daily_rate?: number;
  days_worked?: number;
  material_name?: string;
  unit?: string;
  liters?: number;
  price_per_liter?: number;
  fuel_type?: string;
  category?: string;
  expense_description?: string;
  notes?: string;
  usage_hours?: number;
}

interface Equipment {
  id: string;
  name: string;
  modelNumber?: string;
  status: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface ResourceManagementProps {
  projectId: string;
  showAddButton?: boolean;
  maxDisplay?: number;
}

export default function ResourceManagement({
  projectId,
  showAddButton = true,
  maxDisplay
}: ResourceManagementProps) {
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('equipment');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch resources
      const resourcesResponse = await apiService.getProjectResources(projectId) as any;
      setResources(resourcesResponse.data || []);

      // Fetch equipment for dropdown
      const equipmentResponse = await apiService.getEquipment() as any;
      setEquipment(equipmentResponse.data || []);

      // Fetch employees for dropdown
      const employeesResponse = await apiService.getEmployees() as any;
      setEmployees(employeesResponse.data || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const resourceData = {
        ...formData,
        type: selectedType,
        project_id: projectId
      };

      await apiService.createProjectResource(projectId, resourceData);
      toast.success('Resource added successfully');
      setDialogOpen(false);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Error creating resource:', error);
      toast.error('Failed to add resource');
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'equipment':
        return <Building2 className="h-4 w-4" />;
      case 'manpower':
        return <Users className="h-4 w-4" />;
      case 'material':
        return <FileText className="h-4 w-4" />;
      case 'fuel':
        return <Clock className="h-4 w-4" />;
      case 'expense':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderEquipmentForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="equipment_id">Equipment</Label>
          <Select onValueChange={(value) => setFormData({...formData, equipment_id: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select equipment" />
            </SelectTrigger>
            <SelectContent>
              {equipment.map((eq) => (
                <SelectItem key={eq.id} value={eq.id}>
                  {eq.name} - {eq.modelNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="equipment_type">Equipment Type</Label>
          <Input
            id="equipment_type"
            placeholder="e.g., Excavator, Crane"
            value={formData.equipment_type || ''}
            onChange={(e) => setFormData({...formData, equipment_type: e.target.value})}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="operator_name">Operator Name</Label>
          <Input
            id="operator_name"
            placeholder="Operator name"
            value={formData.operator_name || ''}
            onChange={(e) => setFormData({...formData, operator_name: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="usage_hours">Usage Hours</Label>
          <Input
            id="usage_hours"
            type="number"
            placeholder="Hours used"
            value={formData.usage_hours || ''}
            onChange={(e) => setFormData({...formData, usage_hours: parseFloat(e.target.value)})}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unit_cost">Unit Cost per Hour</Label>
          <Input
            id="unit_cost"
            type="number"
            placeholder="Cost per hour"
            value={formData.unit_cost || ''}
            onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value)})}
          />
        </div>
        <div>
          <Label htmlFor="maintenance_cost">Maintenance Cost</Label>
          <Input
            id="maintenance_cost"
            type="number"
            placeholder="Maintenance cost"
            value={formData.maintenance_cost || ''}
            onChange={(e) => setFormData({...formData, maintenance_cost: parseFloat(e.target.value)})}
          />
        </div>
      </div>
    </div>
  );

  const renderManpowerForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employee_id">Employee</Label>
          <Select onValueChange={(value) => setFormData({...formData, employee_id: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="worker_name">Worker Name</Label>
          <Input
            id="worker_name"
            placeholder="Worker name"
            value={formData.worker_name || ''}
            onChange={(e) => setFormData({...formData, worker_name: e.target.value})}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            placeholder="e.g., Skilled Worker, Foreman"
            value={formData.position || ''}
            onChange={(e) => setFormData({...formData, position: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="daily_rate">Daily Rate</Label>
          <Input
            id="daily_rate"
            type="number"
            placeholder="Daily rate"
            value={formData.daily_rate || ''}
            onChange={(e) => setFormData({...formData, daily_rate: parseFloat(e.target.value)})}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="days_worked">Days Worked</Label>
        <Input
          id="days_worked"
          type="number"
          placeholder="Number of days"
          value={formData.days_worked || ''}
          onChange={(e) => setFormData({...formData, days_worked: parseInt(e.target.value)})}
        />
      </div>
    </div>
  );

  const renderMaterialForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="material_name">Material Name</Label>
        <Input
          id="material_name"
          placeholder="e.g., Steel Beams, Concrete"
          value={formData.material_name || ''}
          onChange={(e) => setFormData({...formData, material_name: e.target.value})}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            placeholder="Quantity"
            value={formData.quantity || ''}
            onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            placeholder="e.g., pieces, kg, m³"
            value={formData.unit || ''}
            onChange={(e) => setFormData({...formData, unit: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="unit_cost">Unit Cost</Label>
          <Input
            id="unit_cost"
            type="number"
            placeholder="Cost per unit"
            value={formData.unit_cost || ''}
            onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value)})}
          />
        </div>
      </div>
    </div>
  );

  const renderFuelForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fuel_type">Fuel Type</Label>
          <Select onValueChange={(value) => setFormData({...formData, fuel_type: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="gasoline">Gasoline</SelectItem>
              <SelectItem value="lpg">LPG</SelectItem>
              <SelectItem value="electric">Electric</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="liters">Liters</Label>
          <Input
            id="liters"
            type="number"
            placeholder="Liters consumed"
            value={formData.liters || ''}
            onChange={(e) => setFormData({...formData, liters: parseFloat(e.target.value)})}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="price_per_liter">Price per Liter</Label>
        <Input
          id="price_per_liter"
          type="number"
          placeholder="Price per liter"
          value={formData.price_per_liter || ''}
          onChange={(e) => setFormData({...formData, price_per_liter: parseFloat(e.target.value)})}
        />
      </div>
    </div>
  );

  const renderExpenseForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="category">Category</Label>
        <Select onValueChange={(value) => setFormData({...formData, category: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transportation">Transportation</SelectItem>
            <SelectItem value="utilities">Utilities</SelectItem>
            <SelectItem value="supplies">Supplies</SelectItem>
            <SelectItem value="services">Services</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="expense_description">Description</Label>
        <Textarea
          id="expense_description"
          placeholder="Expense description"
          value={formData.expense_description || ''}
          onChange={(e) => setFormData({...formData, expense_description: e.target.value})}
        />
      </div>
      <div>
        <Label htmlFor="unit_cost">Amount</Label>
        <Input
          id="unit_cost"
          type="number"
          placeholder="Expense amount"
          value={formData.unit_cost || ''}
          onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value)})}
        />
      </div>
    </div>
  );

  const renderFormByType = () => {
    switch (selectedType) {
      case 'equipment':
        return renderEquipmentForm();
      case 'manpower':
        return renderManpowerForm();
      case 'material':
        return renderMaterialForm();
      case 'fuel':
        return renderFuelForm();
      case 'expense':
        return renderExpenseForm();
      default:
        return null;
    }
  };

  const filterResourcesByType = (type: string) => {
    return resources.filter(resource => resource.type === type);
  };

  const displayResources = maxDisplay ? resources.slice(0, maxDisplay) : resources;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {showAddButton && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Project Resources</h2>
            <p className="text-gray-600">Manage project resources and allocations</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
                <DialogDescription>
                  Add a new resource to the project. Select the resource type and fill in the details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="resource_type">Resource Type</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="manpower">Manpower</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="fuel">Fuel</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Resource Name</Label>
                  <Input
                    id="name"
                    placeholder="Resource name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Resource description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                {renderFormByType()}

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Resource
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Resources by Type */}
      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="manpower">Manpower</TabsTrigger>
          <TabsTrigger value="material">Materials</TabsTrigger>
          <TabsTrigger value="fuel">Fuel</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Equipment Resources</span>
              </CardTitle>
              <CardDescription>
                {filterResourcesByType('equipment').length} equipment resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterResourcesByType('equipment').map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{resource.name}</h4>
                        {resource.status && (
                          <Badge className={getStatusColor(resource.status)}>
                            {resource.status}
                          </Badge>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {resource.equipment_name && <span>Equipment: {resource.equipment_name}</span>}
                        {resource.operator_name && <span>Operator: {resource.operator_name}</span>}
                        {resource.usage_hours && <span>Hours: {resource.usage_hours}</span>}
                        {resource.unit_cost && <span>Rate: ${resource.unit_cost}/hr</span>}
                        {resource.total_cost && <span>Total: ${resource.total_cost}</span>}
                        {resource.date && <span>Date: {new Date(resource.date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filterResourcesByType('equipment').length === 0 && (
                  <p className="text-center text-gray-500 py-8">No equipment resources found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manpower">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Manpower Resources</span>
              </CardTitle>
              <CardDescription>
                {filterResourcesByType('manpower').length} manpower resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterResourcesByType('manpower').map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{resource.name}</h4>
                        {resource.status && (
                          <Badge className={getStatusColor(resource.status)}>
                            {resource.status}
                          </Badge>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {resource.worker_name && <span>Worker: {resource.worker_name}</span>}
                        {resource.position && <span>Position: {resource.position}</span>}
                        {resource.daily_rate && <span>Rate: ${resource.daily_rate}/day</span>}
                        {resource.days_worked && <span>Days: {resource.days_worked}</span>}
                        {resource.total_cost && <span>Total: ${resource.total_cost}</span>}
                        {resource.date && <span>Date: {new Date(resource.date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filterResourcesByType('manpower').length === 0 && (
                  <p className="text-center text-gray-500 py-8">No manpower resources found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="material">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Material Resources</span>
              </CardTitle>
              <CardDescription>
                {filterResourcesByType('material').length} material resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterResourcesByType('material').map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{resource.name}</h4>
                        {resource.status && (
                          <Badge className={getStatusColor(resource.status)}>
                            {resource.status}
                          </Badge>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {resource.material_name && <span>Material: {resource.material_name}</span>}
                        {resource.quantity && <span>Qty: {resource.quantity}</span>}
                        {resource.unit && <span>Unit: {resource.unit}</span>}
                        {resource.unit_cost && <span>Rate: ${resource.unit_cost}/unit</span>}
                        {resource.total_cost && <span>Total: ${resource.total_cost}</span>}
                        {resource.date && <span>Date: {new Date(resource.date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filterResourcesByType('material').length === 0 && (
                  <p className="text-center text-gray-500 py-8">No material resources found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Fuel Resources</span>
              </CardTitle>
              <CardDescription>
                {filterResourcesByType('fuel').length} fuel resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterResourcesByType('fuel').map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{resource.name}</h4>
                        {resource.status && (
                          <Badge className={getStatusColor(resource.status)}>
                            {resource.status}
                          </Badge>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {resource.fuel_type && <span>Type: {resource.fuel_type}</span>}
                        {resource.liters && <span>Liters: {resource.liters}</span>}
                        {resource.price_per_liter && <span>Price: ${resource.price_per_liter}/L</span>}
                        {resource.total_cost && <span>Total: ${resource.total_cost}</span>}
                        {resource.date && <span>Date: {new Date(resource.date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filterResourcesByType('fuel').length === 0 && (
                  <p className="text-center text-gray-500 py-8">No fuel resources found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Expense Resources</span>
              </CardTitle>
              <CardDescription>
                {filterResourcesByType('expense').length} expense resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterResourcesByType('expense').map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{resource.name}</h4>
                        {resource.status && (
                          <Badge className={getStatusColor(resource.status)}>
                            {resource.status}
                          </Badge>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {resource.category && <span>Category: {resource.category}</span>}
                        {resource.expense_description && <span>Description: {resource.expense_description}</span>}
                        {resource.unit_cost && <span>Amount: ${resource.unit_cost}</span>}
                        {resource.date && <span>Date: {new Date(resource.date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filterResourcesByType('expense').length === 0 && (
                  <p className="text-center text-gray-500 py-8">No expense resources found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
