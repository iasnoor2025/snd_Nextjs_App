'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Users, UserCheck, UserX, Clock, Calendar } from 'lucide-react';
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
      
      // Fetch employees where current user is the supervisor
      const response = await fetch(`/api/employees?supervisor=${session?.user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      
      const data = await response.json();
      
      if (data.success) {
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
              <Users className="h-5 w-5" />
              My Team
            </CardTitle>
            <CardDescription>
              {teamMembers.length === 0 
                ? 'No employees under your supervision' 
                : `${teamMembers.length} employee${teamMembers.length !== 1 ? 's' : ''} under your supervision`
              }
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchTeamMembers}>
              Refresh
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
          <div className="grid gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {member.first_name?.[0] || ''}
                      {member.last_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {member.first_name} {member.last_name}
                      </h3>
                      {getStatusBadge(member.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        File: {member.file_number}
                      </span>
                      
                      {member.department && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {member.department.name}
                        </span>
                      )}
                      
                      {member.designation && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {member.designation.name}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Hired: {member.hire_date ? new Date(member.hire_date).toLocaleDateString() : 'N/A'}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Service: {member.hire_date ? calculateServicePeriod(member.hire_date) : 'N/A'}
                      </span>
                      
                      {member.current_location && (
                        <span className="flex items-center gap-1">
                          <UserX className="h-3 w-3" />
                          {member.current_location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="mb-2">
                      {getTimesheetStatusBadge(member.timesheet_status, member.last_timesheet_date)}
                    </div>
                    {member.email && (
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    )}
                  </div>
                  
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
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
