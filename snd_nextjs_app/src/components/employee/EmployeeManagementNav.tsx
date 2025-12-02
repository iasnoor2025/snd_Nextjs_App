'use client';

import { useState } from 'react';
import { useRouter , useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
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

const getNavItems = (locale: string): NavItem[] => [
  {
    title: 'Employee Directory',
    description: 'View and manage employee information and profiles',
    icon: <Users className="h-6 w-6" />,
    href: `/${locale}/employee-management`,
    color: 'bg-gradient-to-r from-green-500 to-emerald-500'
  },
  {
    title: 'Documents',
    description: 'Manage employee documents and file uploads',
    icon: <FileText className="h-6 w-6" />,
    href: `/${locale}/document-management`,
    color: 'bg-gradient-to-r from-indigo-500 to-blue-500'
  },
  {
    title: 'Leave Management',
    description: 'Track employee leave requests and approvals',
    icon: <Calendar className="h-6 w-6" />,
    href: `/${locale}/leave-management`,
    color: 'bg-gradient-to-r from-red-500 to-pink-500'
  },
  {
    title: 'Analytics',
    description: 'View employee performance metrics and reports',
    icon: <TrendingUp className="h-6 w-6" />,
    href: `/${locale}/analytics`,
    color: 'bg-gradient-to-r from-teal-500 to-green-500'
  },
  {
    title: 'Settings',
    description: 'Configure system settings and preferences',
    icon: <Settings className="h-6 w-6" />,
    href: `/${locale}/settings`,
    color: 'bg-gradient-to-r from-gray-500 to-slate-500'
  }
];

export default function EmployeeManagementNav() {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const params = useParams();
  const locale = params?.locale as string || 'en';
  const navItems = getNavItems(locale);
  
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
          Comprehensive tools for managing your workforce and employee information
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


    </div>
  );
}
