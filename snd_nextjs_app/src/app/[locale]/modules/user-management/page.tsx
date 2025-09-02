
'use client';


// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

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

import { PermissionManagement } from '@/components/permission-management';
import { useTranslations } from '@/hooks/use-translations';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  User,
} from 'lucide-react';

import { useEffect, useState } from 'react';

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
  const { t } = useTranslations();
  const { getAllowedActions } = useRBAC();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure users is always an array - with additional safety
  const safeUsers = Array.isArray(users) ? users : [];
  const safeRoles = Array.isArray(roles) ? roles : [];
  const safePermissions = Array.isArray(permissions) ? permissions : [];
  


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
      // Fetching users
      const response = await fetch('/api/users');
              // API response received
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData = await response.json();
              // Users data received
      
      // The API returns { success: true, users: [...] }
      let usersArray = [];
      if (usersData && typeof usersData === 'object' && Array.isArray(usersData.users)) {
        usersArray = usersData.users;
      } else if (Array.isArray(usersData)) {
        // Fallback: if the API returns the array directly
        usersArray = usersData;
      }
      
              // Final users array processed
      setUsers(usersArray);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      // Always set an empty array on error
      setUsers([]);
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
      
      // Ensure we always set an array
      let rolesArray = [];
      if (Array.isArray(rolesData)) {
        rolesArray = rolesData;
      }
      
      setRoles(rolesArray);
    } catch (error) {
      console.error('Error in fetchRoles:', error);
      // Always set an empty array on error
      setRoles([]);
      throw error;
    }
  };

  // Fetch all permissions
  const fetchPermissions = async () => {
    try {
      setLoadingPermissions(true);
      console.log('Fetching permissions...');
      const response = await fetch('/api/permissions?limit=all');
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      const data = await response.json();
      console.log('Permissions API response:', data);
      
      // Ensure we always set an array
      let permissionsArray = [];
      if (data && typeof data === 'object' && Array.isArray(data.permissions)) {
        permissionsArray = data.permissions;
      } else if (Array.isArray(data)) {
        // Fallback: if the API returns the array directly
        permissionsArray = data;
      }
      
      console.log('Final permissions array:', permissionsArray);
      setPermissions(permissionsArray);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Always set an empty array on error
      setPermissions([]);
      throw error;
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Fetch permissions for a specific role
  const fetchRolePermissions = async (roleId: number) => {
    try {
      console.log(`Fetching permissions for role ${roleId}...`);
      const response = await fetch(`/api/roles/${roleId}/permissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch role permissions');
      }
      const data = await response.json();
      console.log(`Role ${roleId} permissions response:`, data);
      setSelectedRolePermissions(data.data || []);
      return data;
    } catch (error) {
      console.error(`Error fetching role ${roleId} permissions:`, error);
      throw error;
    }
  };

    // Fetch permissions for all roles
  const fetchAllRolePermissions = async () => {
    try {
      console.log('Fetching permissions for all roles...');
      console.log('Available roles:', safeRoles);
      const permissionsMap: Record<number, Permission[]> = {};

      if (safeRoles.length > 0) {
        for (const role of safeRoles) {
          try {
            console.log(`Fetching permissions for role: ${role.name} (ID: ${role.id})`);
            const response = await fetch(`/api/roles/${role.id}/permissions`);
            if (response.ok) {
              const data = await response.json();
              console.log(`Permissions fetched for role ${role.name}:`, data.data?.length || 0);
              console.log(`Permissions data for role ${role.name}:`, data.data);
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
      }

      console.log('Final permissions map:', permissionsMap);
      setRolePermissions(permissionsMap);
      console.log('All role permissions fetched successfully');
    } catch (error) {
      console.error('Error fetching all role permissions:', error);
    }
  };

  // Open permission management dialog
  const openPermissionDialog = async (role: Role) => {
    console.log('Opening permission dialog for role:', role);
    console.log('Available permissions:', permissions);
    console.log('Current role permissions:', rolePermissions);
    
    setSelectedRoleForPermissions(role);
    setIsPermissionDialogOpen(true);
    await fetchRolePermissions(role.id);
  };

  // Update role permissions
  const updateRolePermissions = async (permissionIds: number[]) => {
    if (!selectedRoleForPermissions) return;

    try {
      console.log('Updating role permissions:', { roleId: selectedRoleForPermissions.id, permissionIds });
      console.log('Available permissions:', permissions);

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

      const result = await response.json();
      console.log('API response:', result);

      // Update the local role permissions state immediately
      // Get the permission objects that match the selected IDs
      const updatedPermissions = permissions.filter(p => permissionIds.includes(p.id));
      console.log('Updated permissions for local state:', updatedPermissions);
      
      setRolePermissions(prev => ({
        ...prev,
        [selectedRoleForPermissions.id]: updatedPermissions
      }));

      toast.success('Role permissions updated successfully');
      setIsPermissionDialogOpen(false);
      setSelectedRoleForPermissions(null);
      setSelectedRolePermissions([]);
      
      // Refresh all role permissions to ensure consistency
      console.log('Refreshing all role permissions...');
      await fetchAllRolePermissions();
      console.log('Role permissions refresh completed');
    } catch (error) {
      console.error('Error updating role permissions:', error);
      toast.error('Failed to update role permissions');
    }
  };

  // Create user
  const createUser = async () => {
    try {
      // Convert roleId to role name for API
      const selectedRole = safeRoles.find(r => r.id.toString() === userFormData.roleId);
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
      const selectedRole = safeRoles.find(r => r.id.toString() === userFormData.roleId);
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

      toast.success(t('user.messages.updateSuccess'));
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      setUserFormData({ name: '', email: '', password: '', roleId: '', isActive: true });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : t('user.messages.updateError'));
    }
  };

  // Delete user
  const deleteUser = async (userId: number) => {
    if (!confirm(t('user.messages.deleteConfirm'))) return;

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

      toast.success(t('user.messages.deleteSuccess'));
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : t('user.messages.deleteError'));
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

  // Helper function to categorize permissions
  const getPermissionCategory = (permissionName: string): string => {
    if (permissionName === '*' || permissionName === 'manage.all' || permissionName === 'sync.all' || permissionName === 'reset.all') {
      return 'Core System';
    }
    
    const [_action, subject] = permissionName.split('.');
    
    // Direct mapping for specific permissions
    const directMappings: Record<string, string> = {
      'own-profile': 'User Management',
      'own-preferences': 'User Management',
      'own-timesheet': 'Timesheet Management',
      'own-leave': 'Leave Management',
      'employee-dashboard': 'Employee Management',
      'employee-data': 'Employee Management',
      'SalaryIncrement': 'Payroll Management',
      'Advance': 'Payroll Management',
      'document-approval': 'Document Management',
      'Assignment': 'Assignment Management',
      'equipment-document': 'Equipment Management'
    };

    // Check direct mappings first
    if (subject && directMappings[subject]) {
      return directMappings[subject];
    }

    // Comprehensive categorization based on subject
    switch (subject) {
      case 'User':
      case 'Role':
      case 'Permission':
        return 'User Management';
      case 'Employee':
      case 'employee-document':
      case 'employee-assignment':
      case 'employee-leave':
      case 'employee-skill':
      case 'employee-training':
      case 'employee-performance':
      case 'employee-resignation':
        return 'Employee Management';
      case 'Customer':
      case 'customer-document':
      case 'customer-project':
        return 'Customer Management';
      case 'Equipment':
      case 'equipment-rental':
      case 'equipment-maintenance':
      case 'equipment-history':
        return 'Equipment Management';
      case 'Maintenance':
      case 'maintenance-item':
      case 'maintenance-schedule':
        return 'Maintenance Management';
      case 'Rental':
      case 'rental-item':
      case 'rental-history':
      case 'rental-contract':
        return 'Rental Management';
      case 'Quotation':
      case 'quotation-term':
      case 'quotation-item':
        return 'Quotation Management';
      case 'Payroll':
      case 'payroll-item':
      case 'payroll-run':
      case 'tax-document':
        return 'Payroll Management';
      case 'Timesheet':
      case 'time-entry':
      case 'weekly-timesheet':
      case 'timesheet-approval':
        return 'Timesheet Management';
      case 'Project':
      case 'project-task':
      case 'project-milestone':
      case 'project-template':
      case 'project-risk':
      case 'project-manpower':
      case 'project-equipment':
      case 'project-material':
      case 'project-fuel':
      case 'project-expense':
      case 'project-subcontractor':
        return 'Project Management';
      case 'Leave':
      case 'time-off-request':
        return 'Leave Management';
      case 'Department':
      case 'Designation':
      case 'organizational-unit':
      case 'Skill':
      case 'Training':
        return 'Department & Organization';
      case 'Report':
      case 'Analytics':
        return 'Reports & Analytics';
      case 'Company':
      case 'Safety':
      case 'Location':
        return 'Company & Safety';
      case 'Document':
        return 'Document Management';
      default:
        // Fallback categorization based on subject
        const fallbackMappings: Record<string, string> = {
          'User': 'User Management',
          'Role': 'User Management',
          'Permission': 'User Management',
          'Employee': 'Employee Management',
          'Customer': 'Customer Management',
          'Equipment': 'Equipment Management',
          'Maintenance': 'Maintenance Management',
          'Rental': 'Rental Management',
          'Quotation': 'Quotation Management',
          'Payroll': 'Payroll Management',
          'Timesheet': 'Timesheet Management',
          'Project': 'Project Management',
          'Leave': 'Leave Management',
          'Department': 'Department & Organization',
          'Designation': 'Department & Organization',
          'Report': 'Reports & Analytics',
          'Analytics': 'Reports & Analytics',
          'Company': 'Company & Safety',
          'Safety': 'Company & Safety',
          'Location': 'Company & Safety',
          'Skill': 'Department & Organization',
          'Training': 'Department & Organization'
        };

        return (subject && fallbackMappings[subject]) || 'Core System';
    }
  };

  // Helper function to toggle all permissions in a category
  const toggleCategoryPermissions = (category: string, categoryPermissions: Permission[], select: boolean) => {
    if (select) {
      // Add all permissions from this category
      const newPermissions = [...(Array.isArray(selectedRolePermissions) ? selectedRolePermissions : [])];
      categoryPermissions.forEach(permission => {
        if (!newPermissions.some(p => p.id === permission.id)) {
          newPermissions.push(permission);
        }
      });
      setSelectedRolePermissions(newPermissions);
    } else {
      // Remove all permissions from this category
      const newPermissions = (Array.isArray(selectedRolePermissions) ? selectedRolePermissions : []).filter(
        permission => !categoryPermissions.some(cp => cp.id === permission.id)
      );
      setSelectedRolePermissions(newPermissions);
    }
  };

  // Open edit user dialog
  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);

    // Find the role ID by matching the role name
    const matchingRole = safeRoles.find(r => r.name === user.role);
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
        // useEffect fetchData called
        setLoading(true);
        setError(null);
        
        // Initialize with empty arrays to prevent undefined state
        setUsers([]);
        setRoles([]);
        setPermissions([]);

        // Calling Promise.all
        await Promise.all([fetchUsers(), fetchRoles(), fetchPermissions()]);
                  // Promise.all completed
      } catch (err) {
        console.error('Error loading user management data:', err);
        setError(err instanceof Error ? err.message : t('user.loadDataFailed'));
        
        // Ensure we always have arrays even on error
        setUsers([]);
        setRoles([]);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch role permissions when roles are loaded
  useEffect(() => {
    if (safeRoles.length > 0) {
      console.log('Roles loaded, fetching role permissions...');
      fetchAllRolePermissions();
    }
  }, [safeRoles]);

  // Set default role when roles are loaded
  useEffect(() => {
    if (safeRoles.length > 0 && !userFormData.roleId) {
      setUserFormData(prev => ({
        ...prev,
        roleId: safeRoles[0]?.id.toString() || '',
      }));
    }
  }, [safeRoles, userFormData.roleId]);

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'User' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('user.loadingUserManagement')}</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'User' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">
            {t('user.error')}: {error}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Additional safety check - if anything is still undefined, show error
  if (typeof users === 'undefined' || typeof roles === 'undefined' || typeof permissions === 'undefined') {
    return (
      <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'User' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">
            {t('user.error')}: Data not properly initialized
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
            <h1 className="text-3xl font-bold">{t('user.userRoleManagementTitle')}</h1>
            <p className="text-muted-foreground">{t('user.userRoleManagementDescription')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              {t('user.exportUsers')}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              {t('user.userSettings')}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('user.users')} ({safeUsers.length})
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('user.roles')} ({safeRoles.length})
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('user.permissions')} ({safePermissions.length})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t('user.users')}</CardTitle>
                    <CardDescription>{t('user.manageUsersDescription')}</CardDescription>
                  </div>
                  {allowedActions.includes('create') && (
                    <Button onClick={() => setIsCreateUserDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('user.createUser')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('user.name')}</TableHead>
                      <TableHead>{t('user.email')}</TableHead>
                      <TableHead>{t('user.role')}</TableHead>
                      <TableHead>{t('user.status')}</TableHead>
                      <TableHead>{t('user.lastLogin')}</TableHead>
                      <TableHead>{t('user.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeUsers.length > 0 ? (
                      safeUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.role || 'Unknown'}</Badge>
                          </TableCell>
                          <TableCell>
                                                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                {user.isActive ? t('user.active') : t('user.inactive')}
                              </Badge>
                          </TableCell>
                          <TableCell>
                            {user.lastLoginAt
                              ? (
                                <div className="text-sm">
                                  <div>{new Date(user.lastLoginAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'numeric', 
                                    day: 'numeric'
                                  })}</div>
                          
                                </div>
                              )
                              : (
                                <span className="text-muted-foreground text-sm">
                                  {t('user.never')}
                                </span>
                              )}
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          {loading ? t('loading') : t('noUsersFound')}
                        </TableCell>
                      </TableRow>
                    )}
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
                        {t('user.createRole')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('user.name')}</TableHead>
                      <TableHead>{t('user.guardName')}</TableHead>
                      <TableHead>{t('user.permissions')}</TableHead>
                      <TableHead>{t('user.users')}</TableHead>
                      <TableHead>{t('user.createdAt')}</TableHead>
                      <TableHead>{t('user.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeRoles.length > 0 ? (
                      safeRoles.map(role => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell>{role.guardName}</TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {rolePermissions[role.id] ? (
                                <div className="space-y-2">
                                                                                                  <div className="flex flex-wrap gap-1">
                                  {Array.isArray(rolePermissions[role.id]) && (rolePermissions[role.id]?.length || 0) > 0 ? (
                                    rolePermissions[role.id]?.slice(0, 3).map(permission => (
                                      <Badge
                                        key={permission.id}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {permission.name}
                                      </Badge>
                                    ))
                                  ) : null}
                                  {Array.isArray(rolePermissions[role.id]) && (rolePermissions[role.id]?.length || 0) > 3 && (
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
                              {safeUsers.filter(u => u.role === role.name).length}
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          {loading ? t('user.loading') : t('user.noRolesFound')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <PermissionManagement
              permissions={safePermissions}
              roles={safeRoles}
              selectedRole={selectedRoleForPermissions}
              selectedPermissions={selectedRolePermissions}
              onPermissionChange={setSelectedRolePermissions}
              onRoleChange={setSelectedRoleForPermissions}
              loading={loadingPermissions}
            />
            
            {/* Save Permissions Button */}
            {selectedRoleForPermissions && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Save Changes</h3>
                      <p className="text-sm text-muted-foreground">
                        Save the permission changes for {selectedRoleForPermissions.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRoleForPermissions(null);
                          setSelectedRolePermissions([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          const permissionIds = selectedRolePermissions.map(p => p.id);
                          updateRolePermissions(permissionIds);
                        }}
                        disabled={loadingPermissions}
                      >
                        Save Permissions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
                    {safeRoles.length > 0 ? (
                      safeRoles.map(role => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-roles" disabled>
                        {t('noRolesAvailable')}
                      </SelectItem>
                    )}
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
                <Label htmlFor="isActive">{t('user.isActive')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                {t('user.cancel')}
              </Button>
              <Button onClick={createUser}>{t('user.create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('user.editUser')}</DialogTitle>
              <DialogDescription>{t('user.editUserDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">{t('user.name')}</Label>
                <Input
                  id="edit-name"
                  value={userFormData.name}
                  onChange={e => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">{t('user.email')}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={userFormData.email}
                  onChange={e => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-password">
                  {t('user.password')} ({t('user.leaveBlankToKeep')})
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={userFormData.password}
                  onChange={e => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">{t('user.role')}</Label>
                <Select
                  value={userFormData.roleId}
                  onValueChange={value => setUserFormData(prev => ({ ...prev, roleId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('user.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    {safeRoles.length > 0 ? (
                      safeRoles.map(role => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-roles" disabled>
                        {t('noRolesAvailable')}
                      </SelectItem>
                    )}
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
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                {t('managePermissions')} - {selectedRoleForPermissions?.name}
              </DialogTitle>
              <DialogDescription>{t('selectPermissionsForRole')}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {(() => {
                console.log('Rendering permissions dialog with:', { safePermissions, selectedRolePermissions });
                
                // Group permissions by category
                const groupedPermissions: Record<string, Permission[]> = {};
                
                safePermissions.forEach(permission => {
                  const category = getPermissionCategory(permission.name);
                  if (!groupedPermissions[category]) {
                    groupedPermissions[category] = [];
                  }
                  groupedPermissions[category].push(permission);
                });

                console.log('Grouped permissions:', groupedPermissions);

                return Object.entries(groupedPermissions).map(([category, permissions]) => {
                  const allSelected = permissions.every(p => 
                    Array.isArray(selectedRolePermissions) && 
                    selectedRolePermissions.some(sp => sp.id === p.id)
                  );


                  return (
                    <div key={category} className="space-y-3 border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCategoryPermissions(category, permissions, !allSelected)}
                            className="text-xs"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                          <span className="text-sm text-gray-500">
                            {permissions.filter(p => 
                              Array.isArray(selectedRolePermissions) && 
                              selectedRolePermissions.some(sp => sp.id === p.id)
                            ).length} / {permissions.length}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {permissions.map(permission => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`permission-${permission.id}`}
                              checked={Array.isArray(selectedRolePermissions) ? 
                                selectedRolePermissions.some(p => p.id === permission.id) : false}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedRolePermissions(prev => [...(Array.isArray(prev) ? prev : []), permission]);
                                } else {
                                  setSelectedRolePermissions(prev =>
                                    Array.isArray(prev) ? prev.filter(p => p.id !== permission.id) : []
                                  );
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <Label 
                              htmlFor={`permission-${permission.id}`} 
                              className="text-sm font-medium text-gray-700 cursor-pointer"
                            >
                              {permission.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <DialogFooter className="border-t pt-4">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-gray-500">
                  Total: {Array.isArray(selectedRolePermissions) ? selectedRolePermissions.length : 0} permissions selected
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
                    {t('user.cancel')}
                  </Button>
                  <Button onClick={() => {
                    console.log('Update button clicked with permissions:', selectedRolePermissions);
                    const permissionIds = Array.isArray(selectedRolePermissions) ? selectedRolePermissions.map(p => p.id) : [];
                    console.log('Permission IDs to update:', permissionIds);
                    updateRolePermissions(permissionIds);
                  }}>
                    {t('user.updatePermissions')}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
