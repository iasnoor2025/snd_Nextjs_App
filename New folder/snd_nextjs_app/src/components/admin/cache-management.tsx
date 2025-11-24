'use client';

import React, { useState } from 'react';
import { useCacheManagement } from '@/hooks/use-cache-management';
import { documentCacheService } from '@/lib/redis/document-cache-service';
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
  Cog,
  Truck,
  DollarSign,
  Award,
  Key,
  Server
} from 'lucide-react';
import { toast } from 'react-toastify';

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

  const handleClearAllCache = async () => {
    try {
      await clearAllCache.mutateAsync();
      toast.success('All cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear all cache:', error);
      toast.error('Failed to clear all cache');
    }
  };

  const handleClearDocumentCache = async () => {
    try {
      await documentCacheService.invalidateAllDocumentCaches();
      toast.success('Document cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear document cache:', error);
      toast.error('Failed to clear document cache');
    }
  };

  const handleClearEmployeeDocumentCache = async () => {
    try {
      await documentCacheService.invalidateCachesByType('employee');
      toast.success('Employee document cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear employee document cache:', error);
      toast.error('Failed to clear employee document cache');
    }
  };

  const handleClearEquipmentDocumentCache = async () => {
    try {
      await documentCacheService.invalidateCachesByType('equipment');
      toast.success('Equipment document cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear equipment document cache:', error);
      toast.error('Failed to clear equipment document cache');
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

      {/* Document Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle>Document Cache Management</CardTitle>
          <CardDescription>
            Clear document-specific caches for employees and equipment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleClearDocumentCache}
              variant="outline"
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Clear All Document Cache
            </Button>
            <Button
              onClick={handleClearEmployeeDocumentCache}
              variant="outline"
              className="w-full"
            >
              <User className="h-4 w-4 mr-2" />
              Clear Employee Document Cache
            </Button>
            <Button
              onClick={handleClearEquipmentDocumentCache}
              variant="outline"
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Clear Equipment Document Cache
            </Button>
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => clearUsersCache.mutate()}
              disabled={clearUsersCache.isPending}
              variant="outline"
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              {clearUsersCache.isPending ? 'Clearing...' : 'Clear Users Cache'}
            </Button>
            <Button
              onClick={() => clearEmployeesCache.mutate()}
              disabled={clearEmployeesCache.isPending}
              variant="outline"
              className="w-full"
            >
              <User className="h-4 w-4 mr-2" />
              {clearEmployeesCache.isPending ? 'Clearing...' : 'Clear Employees Cache'}
            </Button>
            <Button
              onClick={() => clearCustomersCache.mutate()}
              disabled={clearCustomersCache.isPending}
              variant="outline"
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              {clearCustomersCache.isPending ? 'Clearing...' : 'Clear Customers Cache'}
            </Button>
            <Button
              onClick={() => clearEquipmentCache.mutate()}
              disabled={clearEquipmentCache.isPending}
              variant="outline"
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              {clearEquipmentCache.isPending ? 'Clearing...' : 'Clear Equipment Cache'}
            </Button>
            <Button
              onClick={() => clearRentalsCache.mutate()}
              disabled={clearRentalsCache.isPending}
              variant="outline"
              className="w-full"
            >
              <Truck className="h-4 w-4 mr-2" />
              {clearRentalsCache.isPending ? 'Clearing...' : 'Clear Rentals Cache'}
            </Button>
            <Button
              onClick={() => clearPayrollCache.mutate()}
              disabled={clearPayrollCache.isPending}
              variant="outline"
              className="w-full"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {clearPayrollCache.isPending ? 'Clearing...' : 'Clear Payroll Cache'}
            </Button>
            <Button
              onClick={() => clearSkillsCache.mutate()}
              disabled={clearSkillsCache.isPending}
              variant="outline"
              className="w-full"
            >
              <Award className="h-4 w-4 mr-2" />
              {clearSkillsCache.isPending ? 'Clearing...' : 'Clear Skills Cache'}
            </Button>
            <Button
              onClick={() => clearTrainingsCache.mutate()}
              disabled={clearTrainingsCache.isPending}
              variant="outline"
              className="w-full"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              {clearTrainingsCache.isPending ? 'Clearing...' : 'Clear Trainings Cache'}
            </Button>
            <Button
              onClick={() => clearLocationsCache.mutate()}
              disabled={clearLocationsCache.isPending}
              variant="outline"
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {clearLocationsCache.isPending ? 'Clearing...' : 'Clear Locations Cache'}
            </Button>
            <Button
              onClick={() => clearSettingsCache.mutate()}
              disabled={clearSettingsCache.isPending}
              variant="outline"
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              {clearSettingsCache.isPending ? 'Clearing...' : 'Clear Settings Cache'}
            </Button>
            <Button
              onClick={() => clearRolesCache.mutate()}
              disabled={clearRolesCache.isPending}
              variant="outline"
              className="w-full"
            >
              <Shield className="h-4 w-4 mr-2" />
              {clearRolesCache.isPending ? 'Clearing...' : 'Clear Roles Cache'}
            </Button>
            <Button
              onClick={() => clearPermissionsCache.mutate()}
              disabled={clearPermissionsCache.isPending}
              variant="outline"
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              {clearPermissionsCache.isPending ? 'Clearing...' : 'Clear Permissions Cache'}
            </Button>
            <Button
              onClick={() => clearAnalyticsCache.mutate()}
              disabled={clearAnalyticsCache.isPending}
              variant="outline"
              className="w-full"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {clearAnalyticsCache.isPending ? 'Clearing...' : 'Clear Analytics Cache'}
            </Button>
            <Button
              onClick={() => clearReportsCache.mutate()}
              disabled={clearReportsCache.isPending}
              variant="outline"
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              {clearReportsCache.isPending ? 'Clearing...' : 'Clear Reports Cache'}
            </Button>
            <Button
              onClick={() => clearQuotationsCache.mutate()}
              disabled={clearQuotationsCache.isPending}
              variant="outline"
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              {clearQuotationsCache.isPending ? 'Clearing...' : 'Clear Quotations Cache'}
            </Button>
            <Button
              onClick={() => clearInvoicesCache.mutate()}
              disabled={clearInvoicesCache.isPending}
              variant="outline"
              className="w-full"
            >
              <Receipt className="h-4 w-4 mr-2" />
              {clearInvoicesCache.isPending ? 'Clearing...' : 'Clear Invoices Cache'}
            </Button>
            <Button
              onClick={() => clearSystemCache.mutate()}
              disabled={clearSystemCache.isPending}
              variant="outline"
              className="w-full"
            >
              <Server className="h-4 w-4 mr-2" />
              {clearSystemCache.isPending ? 'Clearing...' : 'Clear System Cache'}
            </Button>
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
