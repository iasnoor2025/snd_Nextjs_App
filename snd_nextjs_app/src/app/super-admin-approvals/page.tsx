'use client';

import { SuperAdminApprovals } from '@/components/super-admin-approvals';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function SuperAdminApprovalsPage() {
  return (
    <ProtectedRoute requiredRole="SUPER_ADMIN">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Super Admin Approval Center
            </h1>
            <p className="text-muted-foreground">
              Manage all system approvals with full administrative privileges
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              SUPER_ADMIN
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Approvals</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">
                Across all modules
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Successfully processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Declined requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Module Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Modules</CardTitle>
            <CardDescription>
              Overview of approval types across different system modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Rental Management</p>
                  <p className="text-sm text-muted-foreground">Equipment requests</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Timesheet</p>
                  <p className="text-sm text-muted-foreground">Time tracking</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Payroll</p>
                  <p className="text-sm text-muted-foreground">Salary processing</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Leave Management</p>
                  <p className="text-sm text-muted-foreground">Vacation requests</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Approval Center */}
        <SuperAdminApprovals />
      </div>
    </ProtectedRoute>
  );
} 