'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { PermissionContent, RoleContent } from '@/lib/rbac/rbac-components';
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
// i18n refactor: All user-facing strings now use useTranslation('user')
import { useTranslation } from 'react-i18next';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  role_id: number;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface Role {
  id: string;
  name: string;
  guard_name: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
}

export default function UserManagementPage() {
  const { t } = useTranslation('user');
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
    role: '',
    isActive: true
  });

  // Role management states
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    guard_name: 'web'
  });

  // Permissions state
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<any[]>([]);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      console.error('Error fetching roles:', error);
      throw error;
    }
  };

  // Fetch all permissions
  const fetchPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const response = await fetch('/api/permissions');
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
  const fetchRolePermissions = async (roleId: string) => {
    try {
      const response = await fetch(`/api/roles/${roleId}/permissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch role permissions');
      }
      const data = await response.json();
      setSelectedRolePermissions(data.permissions || []);
      return data;
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      throw error;
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
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      toast.success(t('userCreatedSuccess'));
      setIsCreateUserDialogOpen(false);
      resetUserForm();
      fetchUsers();
    } catch (err) {
      toast.error(t('userCreateFailed'));
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

      toast.success(t('userUpdatedSuccess'));
      setIsEditUserDialogOpen(false);
      resetUserForm();
      fetchUsers();
    } catch (err) {
      toast.error(t('userUpdateFailed'));
    }
  };

  // Delete user
  const deleteUser = async (id: string) => {
    if (!confirm(t('confirmDeleteUser'))) return;

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast.success(t('userDeletedSuccess'));
      fetchUsers();
    } catch (err) {
      toast.error(t('userDeleteFailed'));
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

      toast.success(t('roleCreatedSuccess'));
      setIsCreateRoleDialogOpen(false);
      resetRoleForm();
      fetchRoles();
    } catch (err) {
      toast.error(t('roleCreateFailed'));
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

      toast.success(t('roleUpdatedSuccess'));
      setIsEditRoleDialogOpen(false);
      resetRoleForm();
      fetchRoles();
    } catch (err) {
      toast.error(t('roleUpdateFailed'));
    }
  };

  // Delete role
  const deleteRole = async (id: string) => {
    if (!confirm(t('confirmDeleteRole'))) return;

    try {
      const response = await fetch('/api/roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete role');
      }

      toast.success(t('roleDeletedSuccess'));
      fetchRoles();
    } catch (err) {
      toast.error(t('roleDeleteFailed'));
    }
  };

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role: roles.length > 0 ? roles[0].name : '',
      isActive: true
    });
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: '',
      guard_name: 'web'
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
      guard_name: role.guard_name
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
        console.error('Error in fetchData:', err);
        setError(err instanceof Error ? err.message : t('loadDataFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Set default role when roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !userFormData.role) {
      setUserFormData(prev => ({
        ...prev,
        role: roles[0].name
      }));
    }
  }, [roles, userFormData.role]);

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
          <div className="text-red-500">{t('error')}: {error}</div>
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
                    <CardDescription>{t('manageSystemUsersAndRoles')}</CardDescription>
                  </div>
                  <PermissionContent action="create" subject="User">
                    <Button onClick={() => setIsCreateUserDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('newUser')}
                    </Button>
                  </PermissionContent>
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
                      <TableHead>{t('created')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.role === 'SUPER_ADMIN' ? 'destructive' : 
                                           user.role === 'ADMIN' ? 'default' : 
                                           user.role === 'MANAGER' ? 'secondary' :
                                           user.role === 'SUPERVISOR' ? 'outline' :
                                           user.role === 'OPERATOR' ? 'secondary' :
                                           user.role === 'EMPLOYEE' ? 'default' : 'outline'}>
                              {user.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {user.role === 'SUPER_ADMIN' && '(1)'}
                              {user.role === 'ADMIN' && '(2)'}
                              {user.role === 'MANAGER' && '(3)'}
                              {user.role === 'SUPERVISOR' && '(4)'}
                              {user.role === 'OPERATOR' && '(5)'}
                              {user.role === 'EMPLOYEE' && '(6)'}
                              {user.role === 'USER' && '(7)'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {t('active')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              {t('inactive')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : t('never')}
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/modules/user-management/${user.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <PermissionContent action="update" subject="User">
                              <Button size="sm" variant="outline" onClick={() => openEditUserDialog(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </PermissionContent>
                            <PermissionContent action="delete" subject="User">
                              <Button size="sm" variant="outline" onClick={() => deleteUser(user.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </PermissionContent>
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
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t('roles')}</CardTitle>
                    <CardDescription>{t('manageSystemRolesAndPermissions')}</CardDescription>
                  </div>
                  <PermissionContent action="create" subject="User">
                    <Button onClick={() => setIsCreateRoleDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('newRole')}
                    </Button>
                  </PermissionContent>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('roleName')}</TableHead>
                      <TableHead>{t('guardName')}</TableHead>
                      <TableHead>{t('users')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('created')}</TableHead>
                      <TableHead>{t('updated')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              role.name === 'SUPER_ADMIN' ? 'destructive' :
                              role.name === 'ADMIN' ? 'default' :
                              role.name === 'MANAGER' ? 'secondary' :
                              role.name === 'SUPERVISOR' ? 'outline' :
                              role.name === 'OPERATOR' ? 'secondary' :
                              role.name === 'EMPLOYEE' ? 'default' : 'outline'
                            }>
                              {role.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {role.name === 'SUPER_ADMIN' && t('fullSystemAccess')}
                              {role.name === 'ADMIN' && t('systemAdministration')}
                              {role.name === 'MANAGER' && t('departmentManagement')}
                              {role.name === 'SUPERVISOR' && t('teamSupervision')}
                              {role.name === 'OPERATOR' && t('basicOperations')}
                              {role.name === 'EMPLOYEE' && t('employeeAccess')}
                              {role.name === 'USER' && t('readOnlyAccess')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{role.guard_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{role.userCount}</span>
                            <span className="text-sm text-muted-foreground">{t('users')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {t('active')}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(role.updatedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/modules/user-management/role/${role.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <PermissionContent action="update" subject="User">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => openPermissionDialog(role)}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            </PermissionContent>
                            <PermissionContent action="update" subject="User">
                              <Button size="sm" variant="outline" onClick={() => openEditRoleDialog(role)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </PermissionContent>
                            <PermissionContent action="delete" subject="User">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => deleteRole(role.id)}
                                disabled={role.userCount > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </PermissionContent>
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t('permissions')}</CardTitle>
                    <CardDescription>{t('manageSystemPermissionsAndAccess')}</CardDescription>
                  </div>
                  <PermissionContent action="create" subject="Settings">
                    <Button onClick={() => {}}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('newPermission')}
                    </Button>
                  </PermissionContent>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPermissions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-lg">{t('loadingPermissions')}</div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Permission Categories */}
                    {(() => {
                      // Group permissions by resource
                      const permissionGroups: { [key: string]: any[] } = {};
                      permissions.forEach(permission => {
                        const [action, resource] = permission.name.split('.');
                        if (!permissionGroups[resource]) {
                          permissionGroups[resource] = [];
                        }
                        permissionGroups[resource].push(permission);
                      });

                      return Object.entries(permissionGroups).map(([resource, perms]) => (
                        <div key={resource} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold capitalize">
                              {resource.replace('-', ' ')}
                            </h3>
                            <Badge variant="outline">{perms.length} permissions</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {perms.map(permission => (
                              <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  <span className="text-sm font-medium">
                                    {permission.name.split('.')[0]}
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {permission.name}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Role Summary Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('roleSummary')}</CardTitle>
            <CardDescription>{t('roleHierarchyAndStatistics')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Role Hierarchy */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">{t('roleHierarchy')}</h4>
                <div className="space-y-2 text-sm">
                  {roles.map((role) => {
                    // Define role hierarchy priority (lower number = higher priority)
                    const roleHierarchy = {
                      'SUPER_ADMIN': 1,
                      'ADMIN': 2,
                      'MANAGER': 3,
                      'SUPERVISOR': 4,
                      'OPERATOR': 5,
                      'EMPLOYEE': 6,
                      'USER': 7
                    };
                    
                    const priority = roleHierarchy[role.name as keyof typeof roleHierarchy] || 7;
                    
                    return (
                      <div key={role.id} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Badge variant={
                            role.name === 'SUPER_ADMIN' ? 'destructive' :
                            role.name === 'ADMIN' ? 'default' :
                            role.name === 'MANAGER' ? 'secondary' :
                            role.name === 'SUPERVISOR' ? 'outline' :
                            role.name === 'OPERATOR' ? 'secondary' :
                            role.name === 'EMPLOYEE' ? 'default' : 'outline'
                          } className="text-xs">
                            {role.name}
                          </Badge>
                          <span className="text-muted-foreground">({priority})</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {role.name === 'SUPER_ADMIN' && t('fullSystemAccess')}
                          {role.name === 'ADMIN' && t('systemAdministration')}
                          {role.name === 'MANAGER' && t('departmentManagement')}
                          {role.name === 'SUPERVISOR' && t('teamSupervision')}
                          {role.name === 'OPERATOR' && t('basicOperations')}
                          {role.name === 'EMPLOYEE' && t('employeeAccess')}
                          {role.name === 'USER' && t('readOnlyAccess')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Role Statistics */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">{t('roleStatistics')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('totalRoles')}</span>
                    <span className="font-medium">{roles.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('totalUsers')}</span>
                    <span className="font-medium">{users.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('activeRoles')}</span>
                    <span className="font-medium">{roles.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('rolesWithUsers')}</span>
                    <span className="font-medium">{roles.filter(r => r.userCount > 0).length}</span>
                  </div>
                </div>
              </div>

              {/* Permissions Summary */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">{t('permissionsSummary')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('totalPermissions')}</span>
                    <span className="font-medium">{permissions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('permissionCategories')}</span>
                    <span className="font-medium">
                      {(() => {
                        const categories = new Set();
                        permissions.forEach(permission => {
                          const [, resource] = permission.name.split('.');
                          categories.add(resource);
                        });
                        return categories.size;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('mostUsedPermissions')}</span>
                    <span className="font-medium">
                      {(() => {
                        const permissionCounts: { [key: string]: number } = {};
                        permissions.forEach(permission => {
                          const [action] = permission.name.split('.');
                          permissionCounts[action] = (permissionCounts[action] || 0) + 1;
                        });
                        const mostUsed = Object.entries(permissionCounts)
                          .sort(([,a], [,b]) => b - a)[0];
                        return mostUsed ? mostUsed[0] : 'N/A';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">{t('quickActions')}</h4>
                <div className="space-y-2">
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createNewRole')}
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    {t('managePermissions')}
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    {t('roleSettings')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Administration Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('userAdministration')}</CardTitle>
            <CardDescription>{t('advancedUserManagementFeaturesForAdministrators')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                {t('userSettings')}
              </Button>
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                {t('exportAllUsers')}
              </Button>
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                {t('bulkUserOperations')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createNewUser')}</DialogTitle>
            <DialogDescription>{t('createNewUserDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={userFormData.name}
                onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('enterName')}
              />
            </div>
            <div>
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t('enterEmail')}
              />
            </div>
            <div>
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={t('enterPassword')}
              />
            </div>
            <div>
              <Label htmlFor="role">{t('role')}</Label>
              <Select value={userFormData.role} onValueChange={(value) => setUserFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
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
                onChange={(e) => setUserFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <Label htmlFor="isActive">{t('active')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={createUser}>
              {t('createUser')}
            </Button>
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
                onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('enterName')}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">{t('email')}</Label>
              <Input
                id="edit-email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t('enterEmail')}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">{t('password')} ({t('optional')})</Label>
              <Input
                id="edit-password"
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={t('enterNewPassword')}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">{t('role')}</Label>
              <Select value={userFormData.role} onValueChange={(value) => setUserFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
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
                onChange={(e) => setUserFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <Label htmlFor="edit-isActive">{t('active')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={updateUser}>
              {t('updateUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createNewRole')}</DialogTitle>
            <DialogDescription>{t('createNewRoleDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">{t('roleName')}</Label>
              <Input
                id="role-name"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('enterRoleName')}
              />
            </div>
            <div>
              <Label htmlFor="role-guard">{t('guardName')}</Label>
              <Input
                id="role-guard"
                value={roleFormData.guard_name}
                onChange={(e) => setRoleFormData(prev => ({ ...prev, guard_name: e.target.value }))}
                placeholder="web"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={createRole}>
              {t('createRole')}
            </Button>
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
              <Label htmlFor="edit-role-name">{t('roleName')}</Label>
              <Input
                id="edit-role-name"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('enterRoleName')}
              />
            </div>
            <div>
              <Label htmlFor="edit-role-guard">{t('guardName')}</Label>
              <Input
                id="edit-role-guard"
                value={roleFormData.guard_name}
                onChange={(e) => setRoleFormData(prev => ({ ...prev, guard_name: e.target.value }))}
                placeholder="web"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={updateRole}>
              {t('updateRole')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permission Management Dialog */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('managePermissions')} - {selectedRoleForPermissions?.name}
            </DialogTitle>
            <DialogDescription>
              {t('selectPermissionsForRole')}
            </DialogDescription>
          </DialogHeader>
          
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">{t('loadingPermissions')}</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Permission Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  // Group permissions by resource
                  const permissionGroups: { [key: string]: any[] } = {};
                  permissions.forEach(permission => {
                    const [action, resource] = permission.name.split('.');
                    if (!permissionGroups[resource]) {
                      permissionGroups[resource] = [];
                    }
                    permissionGroups[resource].push(permission);
                  });

                  return Object.entries(permissionGroups).map(([resource, perms]) => (
                    <div key={resource} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">
                        {resource.replace('-', ' ')}
                      </h4>
                      <div className="space-y-2">
                        {perms.map(permission => {
                          const isSelected = selectedRolePermissions.some(
                            rp => rp.id === permission.id
                          );
                          
                          return (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`permission-${permission.id}`}
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRolePermissions(prev => [...prev, permission]);
                                  } else {
                                    setSelectedRolePermissions(prev => 
                                      prev.filter(p => p.id !== permission.id)
                                    );
                                  }
                                }}
                                className="rounded"
                              />
                              <Label 
                                htmlFor={`permission-${permission.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {permission.name.split('.')[0]}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRolePermissions(permissions);
                  }}
                >
                  {t('selectAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRolePermissions([]);
                  }}
                >
                  {t('clearAll')}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={() => updateRolePermissions(selectedRolePermissions.map(p => p.id))}
              disabled={loadingPermissions}
            >
              {t('updatePermissions')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
