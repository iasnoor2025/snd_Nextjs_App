'use client';

import { Button } from '@/components/ui/button';
import { 
  Users, 
  BarChart3, 
  DollarSign, 
  Settings, 
  Wrench, 
  Truck, 
  FileText, 
  FolderOpen,
  UserCheck
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  variant: 'default' | 'secondary' | 'outline' | 'ghost';
  action: () => void;
}

interface QuickActionsProps {
  userRole?: string;
  className?: string;
}

export function QuickActions({ userRole, className = '' }: QuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      id: 'user-management',
      title: 'User Management',
      subtitle: 'Manage users, roles & permissions',
      icon: <Users className="h-6 w-6" />,
      variant: 'default',
      action: () => {
        // TODO: Implement navigation
      }
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'Business intelligence & reports',
      icon: <BarChart3 className="h-6 w-6" />,
      variant: 'secondary',
      action: () => {
        // TODO: Implement navigation
      }
    },
    {
      id: 'payroll',
      title: 'Payroll',
      subtitle: 'Salary & compensation management',
      icon: <DollarSign className="h-6 w-6" />,
      variant: 'outline',
      action: () => {
        // TODO: Implement navigation
      }
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'System configuration',
      icon: <Settings className="h-6 w-6" />,
      variant: 'ghost',
      action: () => {
        // TODO: Implement navigation
      }
    },
    {
      id: 'equipment',
      title: 'Equipment',
      subtitle: 'Manage equipment & maintenance',
      icon: <Wrench className="h-6 w-6" />,
      variant: 'default',
      action: () => {
        // TODO: Implement navigation
      }
    },
    {
      id: 'rentals',
      title: 'Rentals',
      subtitle: 'Equipment rental tracking',
      icon: <Truck className="h-6 w-6" />,
      variant: 'secondary',
      action: () => {
        // TODO: Implement navigation
      }
    },
    {
      id: 'documents',
      title: 'Documents',
      subtitle: 'File & document management',
      icon: <FileText className="h-6 w-6" />,
      variant: 'outline',
      action: () => {
        // TODO: Implement navigation
      }
    },
    {
      id: 'projects',
      title: 'Projects',
      subtitle: 'Project planning & tracking',
      icon: <FolderOpen className="h-6 w-6" />,
      variant: 'ghost',
      action: () => {
        // TODO: Implement navigation
      }
    },
    {
      id: 'employee-management',
      title: 'Employee Management',
      subtitle: 'Manage employee information & profiles',
      icon: <UserCheck className="h-6 w-6" />,
      variant: 'default',
      action: () => {
        // TODO: Implement navigation
      }
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
          <p className="text-muted-foreground">
            Access frequently used actions and shortcuts
          </p>
        </div>
        <Button variant="outline" size="sm">
          Hide Section
        </Button>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant}
            onClick={action.action}
            className="h-24 p-4 flex flex-col items-center justify-center space-y-2"
          >
            {action.icon}
            <div className="text-center">
              <div className="font-semibold text-sm">{action.title}</div>
              <div className="text-xs opacity-90">{action.subtitle}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
