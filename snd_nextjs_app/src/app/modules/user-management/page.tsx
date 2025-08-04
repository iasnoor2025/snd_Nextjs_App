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
                            <Can action="update" subject="User">
                              <Button size="sm" variant="outline" onClick={() => openEditRoleDialog(role)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Can>
                            <Can action="delete" subject="User">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => deleteRole(role.id)}
                                disabled={role.userCount > 0}
                              >
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
    </ProtectedRoute>
  );
}
