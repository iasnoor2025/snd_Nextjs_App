'use client';

import React, { useState } from 'react';
import { useCacheManagement } from '@/hooks/use-cache-management';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  RefreshCw, 
  Database, 
  Memory, 
  Wifi, 
  WifiOff,
  Users,
  UserCheck,
  Settings,
  Shield,
  BookOpen,
  GraduationCap,
  MapPin,
  BarChart3,
  FileText,
  Calculator,
  FileSpreadsheet,
  Receipt,
  Cog
} from 'lucide-react';

export function CacheManagement() {
  const {
    cacheStats,
    isLoading,
    error,
    refetchStats,
    clearAllCache,
    clearDashboardCache,
    clearEmployeesCache,
    clearEquipmentCache,
    clearCustomersCache,
    clearRentalsCache,
    clearUsersCache,
    clearRolesCache,
    clearPermissionsCache,
    clearSkillsCache,
    clearTrainingsCache,
    clearLocationsCache,
    clearSettingsCache,
    clearAnalyticsCache,
    clearReportsCache,
    clearPayrollCache,
    clearQuotationsCache,
    clearInvoicesCache,
    clearSystemCache,
  } = useCacheManagement();

  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);

  const handleClearAll = async () => {
    try {
      await clearAllCache.mutateAsync();
      setShowConfirmClearAll(false);
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <Wifi className="h-4 w-4 text-green-500" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusText = (connected: boolean) => {
    return connected ? 'Connected' : 'Disconnected';
  };

  const getStatusColor = (connected: boolean) => {
    return connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load cache statistics: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cache Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage Redis cache performance and data
          </p>
        </div>
        <Button
          onClick={() => refetchStats()}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Cache Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Status
          </CardTitle>
          <CardDescription>
            Current Redis cache connection and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(cacheStats?.connected || false)}
              <div>
                <p className="text-sm font-medium">Connection</p>
                <Badge variant="secondary" className={getStatusColor(cacheStats?.connected || false)}>
                  {getStatusText(cacheStats?.connected || false)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Cache Keys</p>
                <p className="text-2xl font-bold">{cacheStats?.keys || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Memory className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Memory Usage</p>
                <p className="text-2xl font-bold">{cacheStats?.memory || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Clearing Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Clear specific cache types or all cache data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Core Entities */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                Core Entities
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  onClick={() => clearUsersCache.mutate()}
                  disabled={clearUsersCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </Button>
                
                <Button
                  onClick={() => clearEmployeesCache.mutate()}
                  disabled={clearEmployeesCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Employees
                </Button>
                
                <Button
                  onClick={() => clearCustomersCache.mutate()}
                  disabled={clearCustomersCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Customers
                </Button>
                
                <Button
                  onClick={() => clearEquipmentCache.mutate()}
                  disabled={clearEquipmentCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Equipment
                </Button>
                
                <Button
                  onClick={() => clearRentalsCache.mutate()}
                  disabled={clearRentalsCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Rentals
                </Button>
                
                <Button
                  onClick={() => clearPayrollCache.mutate()}
                  disabled={clearPayrollCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Payroll
                </Button>
              </div>
            </div>

            <Separator />

            {/* Supporting Entities */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                Supporting Entities
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  onClick={() => clearSkillsCache.mutate()}
                  disabled={clearSkillsCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Skills
                </Button>
                
                <Button
                  onClick={() => clearTrainingsCache.mutate()}
                  disabled={clearTrainingsCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Trainings
                </Button>
                
                <Button
                  onClick={() => clearLocationsCache.mutate()}
                  disabled={clearLocationsCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Locations
                </Button>
                
                <Button
                  onClick={() => clearSettingsCache.mutate()}
                  disabled={clearSettingsCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                
                <Button
                  onClick={() => clearRolesCache.mutate()}
                  disabled={clearRolesCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Roles
                </Button>
                
                <Button
                  onClick={() => clearPermissionsCache.mutate()}
                  disabled={clearPermissionsCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Permissions
                </Button>
              </div>
            </div>

            <Separator />

            {/* Business Entities */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                Business Entities
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  onClick={() => clearQuotationsCache.mutate()}
                  disabled={clearQuotationsCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Quotations
                </Button>
                
                <Button
                  onClick={() => clearInvoicesCache.mutate()}
                  disabled={clearInvoicesCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Invoices
                </Button>
                
                <Button
                  onClick={() => clearAnalyticsCache.mutate()}
                  disabled={clearAnalyticsCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                
                <Button
                  onClick={() => clearReportsCache.mutate()}
                  disabled={clearReportsCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Reports
                </Button>
              </div>
            </div>

            <Separator />

            {/* System & Dashboard */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                System & Dashboard
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  onClick={() => clearDashboardCache.mutate()}
                  disabled={clearDashboardCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                
                <Button
                  onClick={() => clearSystemCache.mutate()}
                  disabled={clearSystemCache.isPending}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Cog className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
            </div>

            <Separator />

            {/* Clear All Cache */}
            <div className="flex justify-center">
              {!showConfirmClearAll ? (
                <Button
                  onClick={() => setShowConfirmClearAll(true)}
                  variant="destructive"
                  size="lg"
                  disabled={clearAllCache.isPending}
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Clear All Cache
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Are you sure? This will clear ALL cached data.
                  </span>
                  <Button
                    onClick={handleClearAll}
                    variant="destructive"
                    size="sm"
                    disabled={clearAllCache.isPending}
                  >
                    Yes, Clear All
                  </Button>
                  <Button
                    onClick={() => setShowConfirmClearAll(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How Caching Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Caching Works</CardTitle>
          <CardDescription>
            Understanding the Redis caching system in your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Cache-Aside Pattern</h4>
            <p className="text-sm text-muted-foreground">
              Data is fetched from cache first. If not found, it's retrieved from the database and stored in cache for future requests.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Cache Tags</h4>
            <p className="text-sm text-muted-foreground">
              Related data is tagged together (e.g., users, roles, permissions). Clearing a tag removes all related cached data.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">When to Clear Cache</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• After data updates to ensure consistency</li>
              <li>• When experiencing performance issues</li>
              <li>• During maintenance or troubleshooting</li>
              <li>• After major system changes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
