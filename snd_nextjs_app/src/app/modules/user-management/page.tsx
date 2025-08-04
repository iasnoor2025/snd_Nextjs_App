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
// i18n refactor: All user-facing strings now use useTranslation('user')
import { useTranslation } from 'react-i18next';

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
      // Mock data for demonstration - replace with actual API call
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@ias.com',
          role: 'ADMIN',
          isActive: true,
          createdAt: '2025-07-29',
          lastLoginAt: undefined
        },
        {
          id: '2',
          name: 'Manager User',
          email: 'manager@snd.com',
          role: 'MANAGER',
          isActive: true,
          createdAt: '2025-07-29',
          lastLoginAt: undefined
        },
        {
          id: '3',
          name: 'Regular User',
          email: 'user@snd.com',
          role: 'USER',
          isActive: true,
          createdAt: '2025-07-29',
          lastLoginAt: undefined
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      // Mock data for demonstration - replace with actual API call
      const mockRoles: Role[] = [
        {
          id: '1',
          name: 'ADMIN',
          description: 'Full system access',
          permissions: ['users.read', 'users.create', 'users.update', 'users.delete'],
          isActive: true,
          createdAt: '2025-07-29',
          userCount: 1
        },
        {
          id: '2',
          name: 'MANAGER',
          description: 'Department management access',
          permissions: ['employees.read', 'employees.update', 'reports.read'],
          isActive: true,
          createdAt: '2025-07-29',
          userCount: 1
        },
        {
          id: '3',
          name: 'USER',
          description: 'Basic user access',
          permissions: ['employees.read', 'projects.read'],
          isActive: true,
          createdAt: '2025-07-29',
          userCount: 1
        }
      ];
      setRoles(mockRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
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
    
        await Promise.all([fetchUsers(), fetchRoles()]);
        
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err instanceof Error ? err.message : t('loadDataFailed'));
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
                  <Can action="create" subject="User">
                    <Button onClick={() => setIsCreateUserDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('newUser')}
                    </Button>
                  </Can>
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
                          <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'MANAGER' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
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
                            <Can action="update" subject="User">
                              <Button size="sm" variant="outline" onClick={() => openEditUserDialog(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Can>
                            <Can action="delete" subject="User">
                              <Button size="sm" variant="outline">
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

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t('roles')}</CardTitle>
                    <CardDescription>{t('manageSystemRolesAndPermissions')}</CardDescription>
                  </div>
                  <Can action="create" subject="User">
                    <Button onClick={() => setIsCreateRoleDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('newRole')}
                    </Button>
                  </Can>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('roleName')}</TableHead>
                      <TableHead>{t('description')}</TableHead>
                      <TableHead>{t('permissions')}</TableHead>
                      <TableHead>{t('users')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('created')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
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
                                +{role.permissions.length - 3} {t('more')}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{role.userCount} {t('users')}</TableCell>
                        <TableCell>
                          {role.isActive ? (
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
                            <Can action="update" subject="User">
                              <Button size="sm" variant="outline" onClick={() => openEditRoleDialog(role)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Can>
                            <Can action="delete" subject="User">
                              <Button size="sm" variant="outline">
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
        </Tabs>

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
    </ProtectedRoute>
  );
}
