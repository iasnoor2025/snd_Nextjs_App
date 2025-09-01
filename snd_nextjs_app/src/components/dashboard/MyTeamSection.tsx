'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Users, Table } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/hooks/use-i18n';

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
  current_assignment?: {
    type: string;
    name?: string;
    project?: { name: string };
    rental?: { rental_number: string };
  };
}

interface MyTeamSectionProps {
  onHideSection: () => void;
}

export default function MyTeamSection({ onHideSection }: MyTeamSectionProps) {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<{ id: number; [key: string]: unknown } | null>(null);
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
      const currentEmployee = employeeData.data?.find((emp: { user?: { id?: string | number }; [key: string]: unknown }) => 
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
      active: { variant: 'default' as const, label: t('dashboard.myTeam.status.active') },
      inactive: { variant: 'secondary' as const, label: t('dashboard.myTeam.status.inactive') },
      terminated: { variant: 'destructive' as const, label: t('dashboard.myTeam.status.terminated') },
      on_leave: { variant: 'outline' as const, label: t('dashboard.myTeam.status.onLeave') },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTimesheetStatusBadge = (status?: string, lastDate?: string) => {
    if (!status || !lastDate) {
      return <Badge variant="outline">{t('dashboard.myTeam.timesheetStatus.noTimesheet')}</Badge>;
    }
    
    const today = new Date();
    const lastTimesheet = new Date(lastDate);
    const daysDiff = Math.floor((today.getTime() - lastTimesheet.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      return <Badge variant="default">{t('dashboard.myTeam.timesheetStatus.today')}</Badge>;
    } else if (daysDiff === 1) {
      return <Badge variant="secondary">{t('dashboard.myTeam.timesheetStatus.yesterday')}</Badge>;
    } else if (daysDiff <= 3) {
      return <Badge variant="outline">{t('dashboard.myTeam.timesheetStatus.daysAgo', { days: daysDiff })}</Badge>;
    } else {
      return <Badge variant="destructive">{t('dashboard.myTeam.timesheetStatus.daysAgo', { days: daysDiff })}</Badge>;
    }
  };

  const formatEmployeeName = (firstName: string, lastName: string) => {
    if (!lastName) return firstName;
    
    // Handle case where lastName might contain the full name
    let fullName = lastName;
    if (firstName && !lastName.includes(firstName)) {
      fullName = `${firstName} ${lastName}`;
    }
    
    // Split the full name into parts and filter out empty parts
    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
    
    if (nameParts.length <= 2) {
      // If 2 or fewer parts, show the full name
      return fullName;
    } else {
      // If more than 2 parts, show only first 2 parts
      const shortenedName = nameParts.slice(0, 2).join(' ');
      return shortenedName;
    }
  };



  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('dashboard.myTeam.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.myTeam.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">{t('dashboard.myTeam.loadingTeamMembers')}</span>
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
            {t('dashboard.myTeam.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.myTeam.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTeamMembers} variant="outline">
              {t('dashboard.myTeam.actions.tryAgain')}
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
              {t('dashboard.myTeam.title')}
            </CardTitle>
            <CardDescription>
              {currentEmployee ? (
                <>
                  {teamMembers.length === 0 
                    ? t('dashboard.myTeam.noEmployees', { id: currentEmployee.id }) 
                    : t('dashboard.myTeam.employeesCount', { 
                        count: teamMembers.length, 
                        plural: teamMembers.length !== 1 ? 's' : '',
                        id: currentEmployee.id 
                      })
                  }
                </>
              ) : (
                t('dashboard.myTeam.loadingEmployeeInfo')
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchTeamMembers}>
              {t('dashboard.myTeam.actions.refresh')}
            </Button>

            <Button variant="outline" size="sm" onClick={onHideSection}>
              {t('dashboard.myTeam.actions.hide')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">{t('dashboard.myTeam.noTeamMembers')}</p>
            <p className="text-sm">{t('dashboard.myTeam.noTeamMembersDescription')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {t('dashboard.myTeam.tableHeaders.fileNumber')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {t('dashboard.myTeam.tableHeaders.employee')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {t('dashboard.myTeam.tableHeaders.designation')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {t('dashboard.myTeam.tableHeaders.status')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {t('dashboard.myTeam.tableHeaders.currentAssignment')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {t('dashboard.myTeam.tableHeaders.timesheetStatus')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {t('dashboard.myTeam.tableHeaders.actions')}
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
                          <div className="font-medium text-gray-900" title={`${member.first_name} ${member.last_name}`}>
                            {formatEmployeeName(member.first_name, member.last_name)}

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
                      {member.current_assignment ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="text-xs">
                            <div className="font-medium">
                              {member.current_assignment.type === 'rental' ? t('dashboard.myTeam.assignment.rentalSite') : 
                               member.current_assignment.type === 'project' ? t('dashboard.myTeam.assignment.project') : 
                               member.current_assignment.type}
                            </div>
                            <div className="text-gray-600">
                              {member.current_assignment.type === 'rental' ? 
                                (member.current_assignment.rental?.rental_number || t('dashboard.myTeam.assignment.rentalAssignment')) :
                                member.current_assignment.type === 'project' ? 
                                (member.current_assignment.project?.name || member.current_assignment.name || t('dashboard.myTeam.assignment.projectAssignment')) :
                                (member.current_assignment.name || t('dashboard.myTeam.assignment.unnamedAssignment'))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-gray-500">{t('dashboard.myTeam.assignment.notAssigned')}</span>
                        </div>
                      )}
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
                          {t('dashboard.myTeam.actions.view')}
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
