'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, User, Shield, Mail, Calendar, CheckCircle, XCircle, Settings } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  userCount: number;
}

export default function UserManagementPage() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get allowed actions for user management
  const allowedActions = getAllowedActions('User');

  // User management states
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    isActive: true
  });

  // Role management states
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true
  });

  // Available permissions
  const availablePermissions = [
    'users.read', 'users.create', 'users.update', 'users.delete',
    'roles.read', 'roles.create', 'roles.update', 'roles.delete',
    'equipment.read', 'equipment.create', 'equipment.update', 'equipment.delete',
    'rentals.read', 'rentals.create', 'rentals.update', 'rentals.delete',
    'employees.read', 'employees.create', 'employees.update', 'employees.delete',
    'projects.read', 'projects.create', 'projects.update', 'projects.delete',
    'reports.read', 'reports.create', 'reports.update', 'reports.delete',
    'settings.read', 'settings.update',
    'analytics.read'
  ];

  // Fetch users
  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await fetch('/api/users');
      console.log('Users response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Users API error:', errorText);
        throw new Error(`Failed to fetch users: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('Users data:', data);
      setUsers(data);
    } catch (err) {
      console.error('Users fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch users');
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      console.log('Fetching roles...');
      const response = await fetch('/api/roles');
      console.log('Roles response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Roles API error:', errorText);
        throw new Error(`Failed to fetch roles: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch roles');
    }
  };

  // Create user
  const createUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      toast.success('User created successfully');
      setIsCreateUserDialogOpen(false);
      resetUserForm();
      fetchUsers();
    } catch (err) {
      toast.error('Failed to create user');
    }
  };

  // Update user
  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          ...userFormData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      toast.success('User updated successfully');
      setIsEditUserDialogOpen(false);
      resetUserForm();
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  // Delete user
  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  // Create role
  const createRole = async () => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleFormData),
      });

      if (!response.ok) {
        throw new Error('Failed to create role');
      }

      toast.success('Role created successfully');
      setIsCreateRoleDialogOpen(false);
      resetRoleForm();
      fetchRoles();
    } catch (err) {
      toast.error('Failed to create role');
    }
  };

  // Update role
  const updateRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRole.id,
          ...roleFormData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      toast.success('Role updated successfully');
      setIsEditRoleDialogOpen(false);
      resetRoleForm();
      fetchRoles();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  // Delete role
  const deleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch('/api/roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete role');
      }

      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (err) {
      toast.error('Failed to delete role');
    }
  };

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role: 'USER',
      isActive: true
    });
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: '',
      description: '',
      permissions: [],
      isActive: true
    });
  };

  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive
    });
    setIsEditUserDialogOpen(true);
  };

  const openEditRoleDialog = (role: Role) => {
    setSelectedRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive
    });
    setIsEditRoleDialogOpen(true);
  };

  const handlePermissionToggle = (permission: string) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Starting to fetch data...');
        await Promise.all([fetchUsers(), fetchRoles()]);
        console.log('Data fetching completed');
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'User' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading user management...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'User' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'User' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User & Role Management</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
          <div className="flex space-x-2">
            <Can action="export" subject="User">
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Export Users
              </Button>
            </Can>

            <Can action="manage" subject="User">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                User Settings
              </Button>
            </Can>
          </div>
        </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles ({roles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage system users and their roles</CardDescription>
                </div>
                <Can action="create" subject="User">
                  <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>Add a new user to the system.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">Name</Label>
                          <Input
                            id="name"
                            value={userFormData.name}
                            onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="email" className="text-right">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={userFormData.email}
                            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="password" className="text-right">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={userFormData.password}
                            onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="role" className="text-right">Role</Label>
                          <Select value={userFormData.role} onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MANAGER">Manager</SelectItem>
                              <SelectItem value="USER">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="isActive" className="text-right">Status</Label>
                          <Select value={userFormData.isActive.toString()} onValueChange={(value) => setUserFormData({ ...userFormData, isActive: value === 'true' })}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Active</SelectItem>
                              <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={createUser}>
                          Create User
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </Can>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'MANAGER' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                    <div className="flex space-x-2">
                      <Can action="read" subject="User">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/modules/user-management/${user.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Can>

                      <Can action="update" subject="User">
                        <Button size="sm" variant="outline" onClick={() => openEditUserDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Can>

                      <Can action="delete" subject="User">
                        <Button size="sm" variant="outline" onClick={() => deleteUser(user.id)}>
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
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Roles</CardTitle>
                  <CardDescription>Manage user roles and permissions</CardDescription>
                </div>
                <Can action="create" subject="User">
                  <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                        <DialogDescription>Add a new role with specific permissions.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="roleName" className="text-right">Role Name</Label>
                          <Input
                            id="roleName"
                            value={roleFormData.name}
                            onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="roleDescription" className="text-right">Description</Label>
                          <Textarea
                            id="roleDescription"
                            value={roleFormData.description}
                            onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="roleStatus" className="text-right">Status</Label>
                          <Select value={roleFormData.isActive.toString()} onValueChange={(value) => setRoleFormData({ ...roleFormData, isActive: value === 'true' })}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Active</SelectItem>
                              <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label className="text-right pt-2">Permissions</Label>
                          <div className="col-span-3 space-y-2 max-h-60 overflow-y-auto">
                            {availablePermissions.map((permission) => (
                              <div key={permission} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={permission}
                                  checked={roleFormData.permissions.includes(permission)}
                                  onChange={() => handlePermissionToggle(permission)}
                                  className="rounded"
                                />
                                <Label htmlFor={permission} className="text-sm">
                                  {permission}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={createRole}>
                          Create Role
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </Can>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{role.userCount} users</TableCell>
                      <TableCell>
                        {role.isActive ? (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/modules/user-management/role/${role.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditRoleDialog(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteRole(role.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Name</Label>
              <Input
                id="edit-name"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right">Password</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Leave blank to keep current"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">Role</Label>
              <Select value={userFormData.role} onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">Status</Label>
              <Select value={userFormData.isActive.toString()} onValueChange={(value) => setUserFormData({ ...userFormData, isActive: value === 'true' })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={updateUser}>
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role information and permissions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-roleName" className="text-right">Role Name</Label>
              <Input
                id="edit-roleName"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-roleDescription" className="text-right">Description</Label>
              <Textarea
                id="edit-roleDescription"
                value={roleFormData.description}
                onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-roleStatus" className="text-right">Status</Label>
              <Select value={roleFormData.isActive.toString()} onValueChange={(value) => setRoleFormData({ ...roleFormData, isActive: value === 'true' })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Permissions</Label>
              <div className="col-span-3 space-y-2 max-h-60 overflow-y-auto">
                {availablePermissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-${permission}`}
                      checked={roleFormData.permissions.includes(permission)}
                      onChange={() => handlePermissionToggle(permission)}
                      className="rounded"
                    />
                    <Label htmlFor={`edit-${permission}`} className="text-sm">
                      {permission}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={updateRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role-based content example */}
      <RoleBased roles={['ADMIN']}>
        <Card>
          <CardHeader>
            <CardTitle>User Administration</CardTitle>
            <CardDescription>
              Advanced user management features for administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Can action="manage" subject="User">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  User Settings
                </Button>
              </Can>

              <Can action="export" subject="User">
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Export All Users
                </Button>
              </Can>

              <Can action="manage" subject="User">
                <Button variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Bulk User Operations
                </Button>
              </Can>
            </div>
          </CardContent>
        </Card>
      </RoleBased>
    </div>
  </ProtectedRoute>
  );
}
