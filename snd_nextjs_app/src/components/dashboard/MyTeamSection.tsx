'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Users, UserCheck, UserX, Clock, Calendar, Table } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  file_number: string;
  email: string;
  phone: string;
  status: string;
  hire_date: string;
  department?: { name: string };
  designation?: { name: string };
  current_location?: string;
  last_timesheet_date?: string;
  timesheet_status?: string;
}

interface MyTeamSectionProps {
  onHideSection: () => void;
}

export default function MyTeamSection({ onHideSection }: MyTeamSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchTeamMembers();
    }
  }, [session?.user?.id]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Current user ID:', session?.user?.id);
      console.log('Current user ID type:', typeof session?.user?.id);
      
      // First, find the employee record that matches the current user ID
      const employeeResponse = await fetch(`/api/employees?all=true`);
      if (!employeeResponse.ok) {
        throw new Error('Failed to fetch employees');
      }
      
      const employeeData = await employeeResponse.json();
      console.log('All employees fetched:', employeeData.data?.length || 0);
      
      if (!employeeData.success) {
        throw new Error('Failed to fetch employees');
      }
      
      // Find the employee record where userId matches current user ID
      const currentEmployee = employeeData.data?.find((emp: any) => 
        emp.user?.id?.toString() === session?.user?.id?.toString()
      );
      
      console.log('Current employee found:', currentEmployee);
      
      if (!currentEmployee) {
        console.log('No employee record found for current user');
        setTeamMembers([]);
        setCurrentEmployee(null);
        return;
      }
      
      // Set current employee in state
      setCurrentEmployee(currentEmployee);
      
      console.log('Current employee ID:', currentEmployee.id);
      console.log('Fetching team members for supervisor:', currentEmployee.id);
      
      // Now fetch employees where supervisor = current employee ID
      const response = await fetch(`/api/employees?supervisor=${currentEmployee.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      
      const data = await response.json();
      
      console.log('MyTeam API Response:', data);
      if (data.success) {
        console.log('Team members found:', data.data?.length || 0);
        setTeamMembers(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch team members');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      inactive: { variant: 'secondary' as const, label: 'Inactive' },
      terminated: { variant: 'destructive' as const, label: 'Terminated' },
      on_leave: { variant: 'outline' as const, label: 'On Leave' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTimesheetStatusBadge = (status?: string, lastDate?: string) => {
    if (!status || !lastDate) {
      return <Badge variant="outline">No Timesheet</Badge>;
    }
    
    const today = new Date();
    const lastTimesheet = new Date(lastDate);
    const daysDiff = Math.floor((today.getTime() - lastTimesheet.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      return <Badge variant="default">Today</Badge>;
    } else if (daysDiff === 1) {
      return <Badge variant="secondary">Yesterday</Badge>;
    } else if (daysDiff <= 3) {
      return <Badge variant="outline">{daysDiff} days ago</Badge>;
    } else {
      return <Badge variant="destructive">{daysDiff} days ago</Badge>;
    }
  };

  const calculateServicePeriod = (hireDate: string) => {
    const hire = new Date(hireDate);
    const today = new Date();
    
    let years = today.getFullYear() - hire.getFullYear();
    let months = today.getMonth() - hire.getMonth();
    let days = today.getDate() - hire.getDate();
    
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    
    return parts.join(', ') || 'Less than a day';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Team
          </CardTitle>
          <CardDescription>Employees under your supervision</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading team members...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Team
          </CardTitle>
          <CardDescription>Employees under your supervision</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTeamMembers} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              My Team
            </CardTitle>
            <CardDescription>
              {currentEmployee ? (
                <>
                  {teamMembers.length === 0 
                    ? `No employees under your supervision (Employee ID: ${currentEmployee.id})` 
                    : `${teamMembers.length} employee${teamMembers.length !== 1 ? 's' : ''} under your supervision (Employee ID: ${currentEmployee.id})`
                  }
                </>
              ) : (
                'Loading employee information...'
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchTeamMembers}>
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  const response = await fetch('/api/employees?all=true');
                  const data = await response.json();
                  console.log('All employees:', data);
                  if (data.success) {
                    console.log('Total employees:', data.data?.length || 0);
                    console.log('Sample employees:', data.data?.slice(0, 3));
                    console.log('Current user ID:', session?.user?.id);
                    console.log('Current employee:', currentEmployee);
                  }
                } catch (err) {
                  console.error('Error fetching all employees:', err);
                }
              }}
            >
              Debug: Show All
            </Button>
            <Button variant="outline" size="sm" onClick={onHideSection}>
              Hide
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No team members found</p>
            <p className="text-sm">You don't have any employees assigned to you as a supervisor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    File Number
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Employee
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Designation
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Current Location
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Timesheet Status
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                      {member.file_number}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {member.first_name?.[0] || ''}
                            {member.last_name?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                      {member.designation?.name || 'N/A'}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                      {member.current_location || 'N/A'}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      {getTimesheetStatusBadge(member.timesheet_status, member.last_timesheet_date)}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex items-center gap-2"
                      >
                        <Link href={`/modules/employee-management/${member.id}`}>
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
