'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  BookOpen, 
  Star, 
  Users, 
  FileText, 
  Calendar,
  TrendingUp,
  Settings
} from 'lucide-react';

interface NavItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  color: string;
}

const navItems: NavItem[] = [
  {
    title: 'Skills Management',
    description: 'Manage employee skills, certifications, and proficiency levels',
    icon: <Award className="h-6 w-6" />,
    href: '/modules/employee-management/skills',
    badge: 'New',
    color: 'bg-gradient-to-r from-yellow-500 to-orange-500'
  },
  {
    title: 'Training Management',
    description: 'Create training programs, track completion, and manage costs',
    icon: <BookOpen className="h-6 w-6" />,
    href: '/modules/employee-management/training',
    badge: 'New',
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500'
  },
  {
    title: 'Performance Reviews',
    description: 'Conduct evaluations, set goals, and track employee development',
    icon: <Star className="h-6 w-6" />,
    href: '/modules/employee-management/performance-reviews',
    badge: 'New',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500'
  },
  {
    title: 'Employee Directory',
    description: 'View and manage employee information and profiles',
    icon: <Users className="h-6 w-6" />,
    href: '/modules/employee-management',
    color: 'bg-gradient-to-r from-green-500 to-emerald-500'
  },
  {
    title: 'Documents',
    description: 'Manage employee documents and file uploads',
    icon: <FileText className="h-6 w-6" />,
    href: '/modules/document-management',
    color: 'bg-gradient-to-r from-indigo-500 to-blue-500'
  },
  {
    title: 'Leave Management',
    description: 'Track employee leave requests and approvals',
    icon: <Calendar className="h-6 w-6" />,
    href: '/modules/leave-management',
    color: 'bg-gradient-to-r from-red-500 to-pink-500'
  },
  {
    title: 'Analytics',
    description: 'View employee performance metrics and reports',
    icon: <TrendingUp className="h-6 w-6" />,
    href: '/modules/analytics',
    color: 'bg-gradient-to-r from-teal-500 to-green-500'
  },
  {
    title: 'Settings',
    description: 'Configure system settings and preferences',
    icon: <Settings className="h-6 w-6" />,
    href: '/modules/settings',
    color: 'bg-gradient-to-r from-gray-500 to-slate-500'
  }
];

export default function EmployeeManagementNav() {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const handleItemClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Employee Management Hub
        </h1>
        <p className="text-lg text-gray-600">
          Comprehensive tools for managing your workforce, from skills development to performance tracking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {navItems.map((item, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
              hoveredItem === index ? 'ring-2 ring-blue-500' : ''
            }`}
            onMouseEnter={() => setHoveredItem(index)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => handleItemClick(item.href)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${item.color} text-white`}>
                  {item.icon}
                </div>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg mt-3">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          🎉 New Features Available!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Skills Management - Track employee capabilities</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Training Programs - Manage development initiatives</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Performance Reviews - Structured evaluations</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          All features are fully integrated with your existing system and ready for production use.
        </p>
      </div>
    </div>
  );
}
