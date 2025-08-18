'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Mail,
  Shield,
  User,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = params.id as string;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error('Failed to fetch user details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleEdit = () => {
    router.push(`/modules/user-management/edit/${userId}`);
  };

  const handleBack = () => {
    router.push('/modules/user-management');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading user details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">User not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Details</h1>
            <p className="text-muted-foreground">View user information and activity</p>
          </div>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit User
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>Basic user details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-lg font-semibold">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4" />
                  <Badge
                    variant={
                      user.role === 'ADMIN'
                        ? 'destructive'
                        : user.role === 'MANAGER'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {user.role}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  {user.isActive ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="default">Active</Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <Badge variant="outline">Inactive</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activity Information
            </CardTitle>
            <CardDescription>User activity and timestamps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {user.lastLoginAt ? (
                    <>
                      {new Date(user.lastLoginAt).toLocaleDateString()}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {new Date(user.lastLoginAt).toLocaleTimeString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="text-sm font-mono bg-muted p-2 rounded mt-1">{user.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
          <CardDescription>Permissions granted to this user based on their role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h4 className="font-semibold mb-2">Role: {user.role}</h4>
              <p className="text-muted-foreground">
                {user.role === 'ADMIN' && 'Full system administrator with all permissions'}
                {user.role === 'MANAGER' &&
                  'Department manager with limited administrative permissions'}
                {user.role === 'USER' && 'Standard user with basic read permissions'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Available Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {user.role === 'ADMIN' && (
                  <>
                    <Badge variant="outline">users.read</Badge>
                    <Badge variant="outline">users.create</Badge>
                    <Badge variant="outline">users.update</Badge>
                    <Badge variant="outline">users.delete</Badge>
                    <Badge variant="outline">roles.read</Badge>
                    <Badge variant="outline">roles.create</Badge>
                    <Badge variant="outline">roles.update</Badge>
                    <Badge variant="outline">roles.delete</Badge>
                    <Badge variant="outline">equipment.*</Badge>
                    <Badge variant="outline">rentals.*</Badge>
                    <Badge variant="outline">employees.*</Badge>
                    <Badge variant="outline">projects.*</Badge>
                    <Badge variant="outline">reports.*</Badge>
                    <Badge variant="outline">settings.*</Badge>
                    <Badge variant="outline">analytics.read</Badge>
                  </>
                )}
                {user.role === 'MANAGER' && (
                  <>
                    <Badge variant="outline">users.read</Badge>
                    <Badge variant="outline">equipment.read</Badge>
                    <Badge variant="outline">equipment.create</Badge>
                    <Badge variant="outline">equipment.update</Badge>
                    <Badge variant="outline">rentals.read</Badge>
                    <Badge variant="outline">rentals.create</Badge>
                    <Badge variant="outline">rentals.update</Badge>
                    <Badge variant="outline">employees.read</Badge>
                    <Badge variant="outline">employees.create</Badge>
                    <Badge variant="outline">employees.update</Badge>
                    <Badge variant="outline">projects.read</Badge>
                    <Badge variant="outline">projects.create</Badge>
                    <Badge variant="outline">projects.update</Badge>
                    <Badge variant="outline">reports.read</Badge>
                    <Badge variant="outline">reports.create</Badge>
                    <Badge variant="outline">settings.read</Badge>
                    <Badge variant="outline">analytics.read</Badge>
                  </>
                )}
                {user.role === 'USER' && (
                  <>
                    <Badge variant="outline">equipment.read</Badge>
                    <Badge variant="outline">rentals.read</Badge>
                    <Badge variant="outline">employees.read</Badge>
                    <Badge variant="outline">projects.read</Badge>
                    <Badge variant="outline">reports.read</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
