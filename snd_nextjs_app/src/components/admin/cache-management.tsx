'use client';

import { useState } from 'react';
import { useCacheManagement } from '@/hooks/use-cache-management';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trash2, 
  RefreshCw, 
  Database, 
  Users, 
  Building2, 
  Wrench, 
  Truck, 
  BarChart3,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export function CacheManagement() {
  const {
    cacheStats,
    isLoading,
    error,
    clearError,
    clearAllCache,
    clearDashboardCache,
    clearEmployeesCache,
    clearEquipmentCache,
    clearCustomersCache,
    clearRentalsCache,
    refetchStats,
  } = useCacheManagement();

  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);

  const handleClearAllCache = () => {
    if (showConfirmClearAll) {
      clearAllCache();
      setShowConfirmClearAll(false);
    } else {
      setShowConfirmClearAll(true);
      // Auto-hide confirmation after 5 seconds
      setTimeout(() => setShowConfirmClearAll(false), 5000);
    }
  };

  const getStatusColor = (connected: boolean) => {
    return connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />;
  };

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button variant="ghost" size="sm" onClick={clearError} className="ml-2">
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cache Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Redis Cache Status
          </CardTitle>
          <CardDescription>
            Monitor and manage Redis cache performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cacheStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Connection</span>
                <Badge className={getStatusColor(cacheStats.connected)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(cacheStats.connected)}
                    {cacheStats.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Cache Keys</span>
                <Badge variant="secondary">{cacheStats.keys}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Memory Usage</span>
                <Badge variant="secondary">{cacheStats.memory}</Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Loading cache statistics...
            </div>
          )}
          
          <div className="mt-4">
            <Button 
              onClick={refetchStats} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>
            Clear specific cache types or all cache data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dashboard Cache */}
            <Button
              onClick={clearDashboardCache}
              disabled={isLoading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Clear Dashboard</span>
              <span className="text-xs text-gray-500">Stats & Analytics</span>
            </Button>

            {/* Employees Cache */}
            <Button
              onClick={clearEmployeesCache}
              disabled={isLoading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Users className="w-5 h-5" />
              <span>Clear Employees</span>
              <span className="text-xs text-gray-500">Employee Data</span>
            </Button>

            {/* Equipment Cache */}
            <Button
              onClick={clearEquipmentCache}
              disabled={isLoading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Wrench className="w-5 h-5" />
              <span>Clear Equipment</span>
              <span className="text-xs text-gray-500">Equipment Data</span>
            </Button>

            {/* Customers Cache */}
            <Button
              onClick={clearCustomersCache}
              disabled={isLoading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Building2 className="w-5 h-5" />
              <span>Clear Customers</span>
              <span className="text-xs text-gray-500">Customer Data</span>
            </Button>

            {/* Rentals Cache */}
            <Button
              onClick={clearRentalsCache}
              disabled={isLoading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Truck className="w-5 h-5" />
              <span>Clear Rentals</span>
              <span className="text-xs text-gray-500">Rental Data</span>
            </Button>
          </div>

          {/* Clear All Cache */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-destructive">Danger Zone</h4>
                <p className="text-sm text-gray-500">
                  Clear all cache data. This will force all data to be fetched fresh from the database.
                </p>
              </div>
              
              {showConfirmClearAll ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive font-medium">
                    Click again to confirm
                  </span>
                  <Button
                    onClick={handleClearAllCache}
                    disabled={isLoading}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Confirm Clear All
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleClearAllCache}
                  disabled={isLoading}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Cache
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Information */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Information</CardTitle>
          <CardDescription>
            Understanding how caching works in this application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How It Works</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Database queries are cached in Redis for 5 minutes by default</li>
                <li>Cache is automatically invalidated when data changes</li>
                <li>Different data types have separate cache tags for targeted invalidation</li>
                <li>Cache failures don't break the application - queries fall back to database</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Cache Tags</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">dashboard</Badge>
                <Badge variant="outline">employees</Badge>
                <Badge variant="outline">equipment</Badge>
                <Badge variant="outline">customers</Badge>
                <Badge variant="outline">rentals</Badge>
                <Badge variant="outline">reports</Badge>
                <Badge variant="outline">analytics</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">When to Clear Cache</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>After bulk data imports or updates</li>
                <li>When you notice stale data in the UI</li>
                <li>Before running reports that need fresh data</li>
                <li>After system maintenance or updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
