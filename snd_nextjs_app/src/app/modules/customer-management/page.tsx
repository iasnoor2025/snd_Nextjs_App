'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, User, Building, Mail, Phone, Download, Upload } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  companyName?: string;
  isActive: boolean;
  status: string;
  createdAt: string;
}

export default function CustomerManagementPage() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    companyName: '',
    isActive: true,
    status: 'active'
  });

  // Get allowed actions for customer management
  const allowedActions = getAllowedActions('Customer');

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  // Create customer
  const createCustomer = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      toast.success('Customer created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to create customer');
    }
  };

  // Update customer
  const updateCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCustomer.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }

      toast.success('Customer updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to update customer');
    }
  };

  // Delete customer
  const deleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const response = await fetch('/api/customers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to delete customer');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      companyName: '',
      isActive: true,
      status: 'active'
    });
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      country: customer.country || '',
      companyName: customer.companyName || '',
      isActive: customer.isActive,
      status: customer.status
    });
    setIsEditDialogOpen(true);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Customer' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Customer' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Customer' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Customer Management</h1>
            <p className="text-muted-foreground">Manage customer information and relationships</p>
          </div>
          <div className="flex items-center gap-2">
            <Can action="export" subject="Customer">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </Can>

            <Can action="import" subject="Customer">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </Can>

            <Can action="create" subject="Customer">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Customer
              </Button>
            </Can>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>All customer records and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.companyName || 'N/A'}</TableCell>
                    <TableCell>{customer.contactPerson || 'N/A'}</TableCell>
                    <TableCell>{customer.email || 'N/A'}</TableCell>
                    <TableCell>{customer.phone || 'N/A'}</TableCell>
                    <TableCell>
                      {customer.city && customer.state ? `${customer.city}, ${customer.state}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Can action="read" subject="Customer">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Can>

                        <Can action="update" subject="Customer">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Can>

                        <Can action="delete" subject="Customer">
                          <Button size="sm" variant="outline" onClick={() => deleteCustomer(customer.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                <Can action="manage" subject="Customer">
                  <Button variant="outline">
                    Bulk Operations
                  </Button>
                </Can>

                <Can action="export" subject="Customer">
                  <Button variant="outline">
                    Generate Reports
                  </Button>
                </Can>
              </div>
            </CardContent>
          </Card>
        </RoleBased>

        {/* Create Dialog */}
        {isCreateDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Customer</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createCustomer}>
                  Create Customer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        {isEditDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Customer</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-companyName">Company Name</Label>
                  <Input
                    id="edit-companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contactPerson">Contact Person</Label>
                  <Input
                    id="edit-contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-address">Address</Label>
                  <Textarea
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-city">City</Label>
                    <Input
                      id="edit-city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-state">State</Label>
                    <Input
                      id="edit-state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-country">Country</Label>
                  <Input
                    id="edit-country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateCustomer}>
                  Update Customer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
