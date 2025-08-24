'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PermissionContent, RoleContent } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  Mail,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// Drizzle schema types
interface User {
  id: number;
  name: string;
  email: string;
  roleId?: number; // Optional since API might not always return it
  role_id?: number; // API returns this field
  role: string; // API returns role name as string
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface Role {
  id: number;
  name: string;
  guardName: string;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

interface Permission {
  id: number;
  name: string;
  guardName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function UserManagementPage() {
  const { t } = useTranslation('user');
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
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
    roleId: '',
    isActive: true,
  });

  // Role management states
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    guardName: 'web',
  });

  // Permissions state
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<Permission[]>([]);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<number, Permission[]>>({});

  // Fetch users with role information
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      
      throw error;
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      const rolesData = await response.json();
      setRoles(rolesData);
    } catch (error) {
      
      throw error;
    }
  };

  // Fetch all permissions
  const fetchPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const response = await fetch('/api/permissions?limit=all');
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      const data = await response.json();
      setPermissions(data.permissions || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Fetch permissions for a specific role
  const fetchRolePermissions = async (roleId: number) => {
    try {
      const response = await fetch(`/api/roles/${roleId}/permissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch role permissions');
      }
      const data = await response.json();
      setSelectedRolePermissions(data.data || []);
      return data;
    } catch (error) {
      
      throw error;
    }
  };

  // Fetch permissions for all roles
  const fetchAllRolePermissions = async () => {
    try {
      console.log('Fetching permissions for all roles...');
      const permissionsMap: Record<number, Permission[]> = {};

      for (const role of roles) {
        try {
          console.log(`Fetching permissions for role: ${role.name}`);
          const response = await fetch(`/api/roles/${role.id}/permissions`);
                      if (response.ok) {
              const data = await response.json();
              console.log(`Permissions fetched for role ${role.name}:`, data.data?.length || 0);
              permissionsMap[role.id] = data.data || [];
            } else {
              console.error(`Failed to fetch permissions for role ${role.name}:`, response.status);
              permissionsMap[role.id] = [];
            }
          } catch (error) {
            console.error(`Error fetching permissions for role ${role.name}:`, error);
            permissionsMap[role.id] = [];
          }
      }

      setRolePermissions(permissionsMap);
      console.log('All role permissions fetched successfully');
    } catch (error) {
      console.error('Error fetching all role permissions:', error);
    }
  };

  // Open permission management dialog
  const openPermissionDialog = async (role: Role) => {
    setSelectedRoleForPermissions(role);
    setIsPermissionDialogOpen(true);
    await fetchRolePermissions(role.id);
  };

  // Update role permissions
  const updateRolePermissions = async (permissionIds: number[]) => {
    if (!selectedRoleForPermissions) return;

    try {
      const response = await fetch(`/api/roles/${selectedRoleForPermissions.id}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissionIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role permissions');
      }

      toast.success('Role permissions updated successfully');
      setIsPermissionDialogOpen(false);
      setSelectedRoleForPermissions(null);
      setSelectedRolePermissions([]);
    } catch (error) {
      console.error('Error updating role permissions:', error);
      toast.error('Failed to update role permissions');
    }
  };

  // Create user
  const createUser = async () => {
    try {
      // Convert roleId to role name for API
      const selectedRole = roles.find(r => r.id.toString() === userFormData.roleId);
      const roleName = selectedRole?.name || 'EMPLOYEE';

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userFormData,
          role: roleName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      toast.success('User created successfully');
      setIsCreateUserDialogOpen(false);
      setUserFormData({ name: '', email: '', password: '', roleId: '', isActive: true });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  // Update user
  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      // Convert roleId to role name for API
      const selectedRole = roles.find(r => r.id.toString() === userFormData.roleId);
      const roleName = selectedRole?.name || 'EMPLOYEE';

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedUser.id,
          ...userFormData,
          role: roleName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      toast.success('User updated successfully');
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      setUserFormData({ name: '', email: '', password: '', roleId: '', isActive: true });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  // Delete user
  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  // Create role
  const createRole = async () => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create role');
      }

      toast.success('Role created successfully');
      setIsCreateRoleDialogOpen(false);
      setRoleFormData({ name: '', guardName: 'web' });
      fetchRoles();
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create role');
    }
  };

  // Update role
  const updateRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch('/api/roles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedRole.id,
          ...roleFormData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      toast.success('Role updated successfully');
      setIsEditRoleDialogOpen(false);
      setSelectedRole(null);
      setRoleFormData({ name: '', guardName: 'web' });
      fetchRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  // Delete role
  const deleteRole = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch('/api/roles', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: roleId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete role');
      }

      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete role');
    }
  };

  // Open edit user dialog
  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);

    // Find the role ID by matching the role name
    const matchingRole = roles.find(r => r.name === user.role);
    const roleId = matchingRole?.id?.toString() || user.role_id?.toString() || '';

    setUserFormData({
      name: user.name,
      email: user.email,
      password: '',
      roleId: roleId,
      isActive: user.isActive,
    });
    setIsEditUserDialogOpen(true);
  };

  // Open edit role dialog
  const openEditRoleDialog = (role: Role) => {
    setSelectedRole(role);
    setRoleFormData({
      name: role.name,
      guardName: role.guardName,
    });
    setIsEditRoleDialogOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        await Promise.all([fetchUsers(), fetchRoles(), fetchPermissions()]);
      } catch (err) {
        console.error('Error loading user management data:', err);
        setError(err instanceof Error ? err.message : t('loadDataFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch role permissions when roles are loaded
  useEffect(() => {
    if (roles.length > 0) {
      fetchAllRolePermissions();
    }
  }, [roles]);

  // Set default role when roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !userFormData.roleId) {
      setUserFormData(prev => ({
        ...prev,
        roleId: roles[0]?.id.toString() || '',
      }));
    }
  }, [roles, userFormData.roleId]);

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'User' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loadingUserManagement')}</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'User' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">
            {t('error')}: {error}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'User' }}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('userRoleManagementTitle')}</h1>
            <p className="text-muted-foreground">{t('userRoleManagementDescription')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              {t('exportUsers')}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              {t('userSettings')}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('users')} ({users.length})
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('roles')} ({roles.length})
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('permissions')} ({permissions.length})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t('users')}</CardTitle>
                    <CardDescription>{t('manageUsersDescription')}</CardDescription>
                  </div>
                  {allowedActions.includes('create') && (
                    <Button onClick={() => setIsCreateUserDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('createUser')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name')}</TableHead>
                      <TableHead>{t('email')}</TableHead>
                      <TableHead>{t('role')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('lastLogin')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.role || 'Unknown'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? t('active') : t('inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : t('never')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {allowedActions.includes('read') && (
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {allowedActions.includes('update') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditUserDialog(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {allowedActions.includes('delete') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            {/* Roles Summary Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Roles Overview
                    </CardTitle>
                    <CardDescription>Summary of roles and their permissions</CardDescription>
                  </div>
                  <Button
                    onClick={fetchAllRolePermissions}
                    disabled={loadingPermissions}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${loadingPermissions ? 'animate-spin' : ''}`}
                    />
                    Refresh Permissions
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{roles.length}</div>
                    <div className="text-sm text-muted-foreground">Total Roles</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(rolePermissions).reduce(
                        (total, perms) => total + (perms?.length || 0),
                        0
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Permissions Assigned</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{permissions.length}</div>
                    <div className="text-sm text-muted-foreground">System Permissions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t('roles')}</CardTitle>
                    <CardDescription>{t('manageRolesDescription')}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAllRolePermissions}
                      disabled={loadingPermissions}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${loadingPermissions ? 'animate-spin' : ''}`}
                      />
                      {t('refreshPermissions') || 'Refresh'}
                    </Button>
                    {allowedActions.includes('create') && (
                      <Button onClick={() => setIsCreateRoleDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('createRole')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name')}</TableHead>
                      <TableHead>{t('guardName')}</TableHead>
                      <TableHead>{t('permissions')}</TableHead>
                      <TableHead>{t('users')}</TableHead>
                      <TableHead>{t('createdAt')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map(role => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.guardName}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {rolePermissions[role.id] ? (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-1">
                                  {rolePermissions[role.id]?.slice(0, 3).map(permission => (
                                    <Badge
                                      key={permission.id}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {permission.name}
                                    </Badge>
                                  ))}
                                  {(rolePermissions[role.id]?.length || 0) > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{(rolePermissions[role.id]?.length || 0) - 3} more
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Total: {rolePermissions[role.id]?.length || 0} permissions
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Loading...</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {users.filter(u => u.role === role.name).length}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPermissionDialog(role)}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            {allowedActions.includes('update') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditRoleDialog(role)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {allowedActions.includes('delete') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteRole(role.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('permissions')}</CardTitle>
                <CardDescription>{t('systemPermissionsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name')}</TableHead>
                      <TableHead>{t('guardName')}</TableHead>
                      <TableHead>{t('createdAt')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map(permission => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">{permission.name}</TableCell>
                        <TableCell>{permission.guardName}</TableCell>
                        <TableCell>
                          {permission.createdAt
                            ? new Date(permission.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create User Dialog */}
        <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createUser')}</DialogTitle>
              <DialogDescription>{t('createUserDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  value={userFormData.name}
                  onChange={e => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={userFormData.email}
                  onChange={e => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={userFormData.password}
                  onChange={e => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="role">{t('role')}</Label>
                <Select
                  value={userFormData.roleId}
                  onValueChange={value => setUserFormData(prev => ({ ...prev, roleId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={userFormData.isActive}
                  onChange={e => setUserFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <Label htmlFor="isActive">{t('isActive')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={createUser}>{t('create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('editUser')}</DialogTitle>
              <DialogDescription>{t('editUserDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">{t('name')}</Label>
                <Input
                  id="edit-name"
                  value={userFormData.name}
                  onChange={e => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">{t('email')}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={userFormData.email}
                  onChange={e => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-password">
                  {t('password')} ({t('leaveBlankToKeep')})
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={userFormData.password}
                  onChange={e => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">{t('role')}</Label>
                <Select
                  value={userFormData.roleId}
                  onValueChange={value => setUserFormData(prev => ({ ...prev, roleId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={userFormData.isActive}
                  onChange={e => setUserFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <Label htmlFor="edit-isActive">{t('isActive')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={updateUser}>{t('update')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Role Dialog */}
        <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createRole')}</DialogTitle>
              <DialogDescription>{t('createRoleDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">{t('name')}</Label>
                <Input
                  id="role-name"
                  value={roleFormData.name}
                  onChange={e => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="role-guard">{t('guardName')}</Label>
                <Input
                  id="role-guard"
                  value={roleFormData.guardName}
                  onChange={e => setRoleFormData(prev => ({ ...prev, guardName: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={createRole}>{t('create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('editRole')}</DialogTitle>
              <DialogDescription>{t('editRoleDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-role-name">{t('name')}</Label>
                <Input
                  id="edit-role-name"
                  value={roleFormData.name}
                  onChange={e => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-role-guard">{t('guardName')}</Label>
                <Input
                  id="edit-role-guard"
                  value={roleFormData.guardName}
                  onChange={e => setRoleFormData(prev => ({ ...prev, guardName: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={updateRole}>{t('update')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Permission Management Dialog */}
        <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {t('managePermissions')} - {selectedRoleForPermissions?.name}
              </DialogTitle>
              <DialogDescription>{t('selectPermissionsForRole')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {permissions.map(permission => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`permission-${permission.id}`}
                    checked={selectedRolePermissions.some(p => p.id === permission.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedRolePermissions(prev => [...prev, permission]);
                      } else {
                        setSelectedRolePermissions(prev =>
                          prev.filter(p => p.id !== permission.id)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={`permission-${permission.id}`}>{permission.name}</Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={() => updateRolePermissions(selectedRolePermissions.map(p => p.id))}>
                {t('updatePermissions')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
