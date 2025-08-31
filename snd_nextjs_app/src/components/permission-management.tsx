'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Shield, Users, Settings, FileText, Calendar, Truck, Wrench, Building, ChartBar, UserCheck, CreditCard, Clock, FolderOpen, Briefcase, MapPin, Shield as Safety } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  guardName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Role {
  id: number;
  name: string;
  guardName: string;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

interface PermissionManagementProps {
  permissions: Permission[];
  roles: Role[];
  selectedRole: Role | null;
  selectedPermissions: Permission[];
  onPermissionChange: (permissions: Permission[]) => void;
  onRoleChange: (role: Role | null) => void;
  loading?: boolean;
}

// Permission category configuration
const PERMISSION_CATEGORIES = {
  'Core System': {
    icon: Settings,
    color: 'bg-red-100 text-red-800',
    permissions: ['*', 'manage.all', 'sync.all', 'reset.all']
  },
  'User Management': {
    icon: Users,
    color: 'bg-blue-100 text-blue-800',
    permissions: ['User', 'Role', 'Permission', 'own-profile', 'own-preferences']
  },
  'Employee Management': {
    icon: UserCheck,
    color: 'bg-green-100 text-green-800',
    permissions: ['Employee', 'employee-document', 'employee-assignment', 'employee-leave', 'employee-skill', 'employee-training', 'employee-performance', 'employee-resignation', 'employee-dashboard', 'employee-data']
  },
  'Customer Management': {
    icon: Users,
    color: 'bg-purple-100 text-purple-800',
    permissions: ['Customer', 'customer-document', 'customer-project']
  },
  'Equipment Management': {
    icon: Truck,
    color: 'bg-orange-100 text-orange-800',
    permissions: ['Equipment', 'equipment-rental', 'equipment-maintenance', 'equipment-history', 'equipment-document']
  },
  'Maintenance Management': {
    icon: Wrench,
    color: 'bg-yellow-100 text-yellow-800',
    permissions: ['Maintenance', 'maintenance-item', 'maintenance-schedule']
  },
  'Rental Management': {
    icon: FolderOpen,
    color: 'bg-indigo-100 text-indigo-800',
    permissions: ['Rental', 'rental-item', 'rental-history', 'rental-contract']
  },
  'Quotation Management': {
    icon: FileText,
    color: 'bg-pink-100 text-pink-800',
    permissions: ['Quotation', 'quotation-term', 'quotation-item']
  },
  'Payroll Management': {
    icon: CreditCard,
    color: 'bg-emerald-100 text-emerald-800',
    permissions: ['Payroll', 'payroll-item', 'payroll-run', 'tax-document', 'SalaryIncrement', 'Advance']
  },
  'Timesheet Management': {
    icon: Clock,
    color: 'bg-cyan-100 text-cyan-800',
    permissions: ['Timesheet', 'time-entry', 'weekly-timesheet', 'timesheet-approval', 'own-timesheet']
  },
  'Project Management': {
    icon: Briefcase,
    color: 'bg-violet-100 text-violet-800',
    permissions: ['Project', 'project-task', 'project-milestone', 'project-template', 'project-risk', 'project-manpower', 'project-equipment', 'project-material', 'project-fuel', 'project-expense', 'project-subcontractor']
  },
  'Leave Management': {
    icon: Calendar,
    color: 'bg-teal-100 text-teal-800',
    permissions: ['Leave', 'time-off-request', 'own-leave']
  },
  'Department & Organization': {
    icon: Building,
    color: 'bg-slate-100 text-slate-800',
    permissions: ['Department', 'Designation', 'organizational-unit', 'Skill', 'Training']
  },
  'Reports & Analytics': {
    icon: ChartBar,
    color: 'bg-amber-100 text-amber-800',
    permissions: ['Report', 'Analytics']
  },
  'Company & Safety': {
    icon: Safety,
    color: 'bg-gray-100 text-gray-800',
    permissions: ['Company', 'Safety', 'Location']
  },
  'Document Management': {
    icon: FileText,
    color: 'bg-rose-100 text-rose-800',
    permissions: ['document-approval']
  },
  'Assignment Management': {
    icon: MapPin,
    color: 'bg-lime-100 text-lime-800',
    permissions: ['Assignment']
  }
};

export function PermissionManagement({
  permissions,
  roles,
  selectedRole,
  selectedPermissions,
  onPermissionChange,
  onRoleChange,
  loading = false
}: PermissionManagementProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<number, Permission[]>>({});

  // Get permission category
  const getPermissionCategory = (permissionName: string): string => {
    // Extract the subject from permission name (e.g., "read.User" -> "User")
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
      'Assignment': 'Assignment Management'
    };

    // Check direct mappings first
    if (subject && directMappings[subject]) {
      return directMappings[subject];
    }

    // Check category configurations
    for (const [category, config] of Object.entries(PERMISSION_CATEGORIES)) {
      if (config.permissions.some(p => subject === p || (subject && subject.includes(p)))) {
        return category;
      }
    }

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
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = getPermissionCategory(permission.name);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Toggle all permissions in a category
  const toggleCategoryPermissions = (category: string, select: boolean) => {
    const categoryPermissions = groupedPermissions[category] || [];
    const currentSelectedIds = selectedPermissions.map(p => p.id);
    
    if (select) {
      // Add all permissions from this category
      const newPermissions = [...selectedPermissions];
      categoryPermissions.forEach(permission => {
        if (!currentSelectedIds.includes(permission.id)) {
          newPermissions.push(permission);
        }
      });
      onPermissionChange(newPermissions);
    } else {
      // Remove all permissions from this category
      const newPermissions = selectedPermissions.filter(
        permission => !categoryPermissions.some(cp => cp.id === permission.id)
      );
      onPermissionChange(newPermissions);
    }
  };

  // Toggle individual permission
  const togglePermission = (permission: Permission, checked: boolean) => {
    if (checked) {
      onPermissionChange([...selectedPermissions, permission]);
    } else {
      onPermissionChange(selectedPermissions.filter(p => p.id !== permission.id));
    }
  };

  // Load role permissions when role changes
  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole.id);
    }
  }, [selectedRole]);

  const fetchRolePermissions = async (roleId: number) => {
    try {
      const response = await fetch(`/api/roles/${roleId}/permissions`);
      if (response.ok) {
        const data = await response.json();
        setRolePermissions(prev => ({
          ...prev,
          [roleId]: data.data || []
        }));
        // Set selected permissions to current role permissions
        onPermissionChange(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Select Role
          </CardTitle>
          <CardDescription>Choose a role to manage its permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {roles.map(role => (
              <Button
                key={role.id}
                variant={selectedRole?.id === role.id ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => onRoleChange(role)}
                disabled={loading}
              >
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">{role.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {rolePermissions[role.id]?.length || 0} perms
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permission Categories */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Permissions for {selectedRole.name}
            </CardTitle>
            <CardDescription>
              Manage permissions by category. Select or deselect entire categories or individual permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                const IconComponent = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES]?.icon || Settings;
                const colorClass = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES]?.color || 'bg-gray-100 text-gray-800';
                const isExpanded = expandedCategories.includes(category);
                const selectedCount = categoryPermissions.filter(p => 
                  selectedPermissions.some(sp => sp.id === p.id)
                ).length;
                const allSelected = selectedCount === categoryPermissions.length;
                const someSelected = selectedCount > 0 && selectedCount < categoryPermissions.length;

                return (
                                     <div key={category} className="border rounded-lg">
                     <Button
                       variant="ghost"
                       className="w-full justify-between p-4 h-auto"
                       onClick={() => toggleCategory(category)}
                     >
                       <div className="flex items-center gap-3">
                         <IconComponent className="h-5 w-5" />
                         <div className="text-left">
                           <div className="font-medium">{category}</div>
                           <div className="text-sm text-muted-foreground">
                             {selectedCount} of {categoryPermissions.length} permissions selected
                           </div>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         <Badge className={colorClass}>
                           {categoryPermissions.length}
                         </Badge>
                         {isExpanded ? (
                           <ChevronDown className="h-4 w-4" />
                         ) : (
                           <ChevronRight className="h-4 w-4" />
                         )}
                       </div>
                     </Button>
                     
                     {isExpanded && (
                       <div className="space-y-3 p-4 border-t">
                         {/* Category Actions */}
                         <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                           <span className="text-sm font-medium">Category Actions</span>
                           <div className="flex gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => toggleCategoryPermissions(category, !allSelected)}
                               className="text-xs"
                             >
                               {allSelected ? 'Deselect All' : 'Select All'}
                             </Button>
                             {someSelected && (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => toggleCategoryPermissions(category, true)}
                                 className="text-xs"
                               >
                                 Select All
                               </Button>
                             )}
                           </div>
                         </div>

                         {/* Permissions Grid */}
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                           {categoryPermissions.map(permission => {
                             const isSelected = selectedPermissions.some(p => p.id === permission.id);
                             const [action, subject] = permission.name.split('.');
                             
                             return (
                               <div
                                 key={permission.id}
                                 className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                               >
                                 <Checkbox
                                   checked={isSelected}
                                   onCheckedChange={(checked) => 
                                     togglePermission(permission, checked as boolean)
                                   }
                                 />
                                 <div className="flex-1 min-w-0">
                                   <div className="text-sm font-medium truncate">
                                     {permission.name}
                                   </div>
                                   <div className="text-xs text-muted-foreground">
                                     {action} • {subject}
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}
                   </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>Permission Summary</CardTitle>
            <CardDescription>
              Overview of selected permissions for {selectedRole.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {selectedPermissions.length}
                </div>
                <div className="text-sm text-muted-foreground">Selected Permissions</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {permissions.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Permissions</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(groupedPermissions).length}
                </div>
                <div className="text-sm text-muted-foreground">Permission Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
