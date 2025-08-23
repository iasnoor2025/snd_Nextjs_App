'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Database,
  Download,
  FileText,
  Info,
  Loader2,
  Package,
  RefreshCw,
  Settings,
  Upload,
  Users,
  Wifi,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { WebhookManager } from '@/components/customer/WebhookManager';

interface ERPNextConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
}

interface SyncStatus {
  customers: { count: number; lastSync: string | null };
  employees: { count: number; lastSync: string | null };
  items: { count: number; lastSync: string | null };
}

export default function ERPNextIntegrationPage() {
  const [config, setConfig] = useState<ERPNextConfig>({
    url: process.env.NEXT_PUBLIC_ERPNEXT_URL || 'https://erp.snd-ksa.online',
    apiKey: process.env.NEXT_PUBLIC_ERPNEXT_API_KEY || '4f15149f23e29b8',
    apiSecret: process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET || '0da352a0df97747',
  });

  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    loading: boolean;
  }>({
    connected: false,
    message: 'Not tested',
    loading: false,
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    customers: { count: 0, lastSync: null },
    employees: { count: 0, lastSync: null },
    items: { count: 0, lastSync: null },
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    testConnection();
    loadSyncStatus();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/erpnext/test-connection');
      const result = await response.json();

      if (result.success) {
        toast.success(`Connection successful! Found ${result.data.employeeCount} employees`);
      } else {
        toast.error(`Connection failed: ${result.message}`);
        
      }
    } catch (error) {
      toast.error('Error testing connection');
      
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      // Fetch real sync status from backend
      const response = await fetch('/api/erpnext/sync-status');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSyncStatus(result.data);
        } else {
          // Set empty status if API fails
          setSyncStatus({
            customers: { count: 0, lastSync: null },
            employees: { count: 0, lastSync: null },
            items: { count: 0, lastSync: null },
          });
        }
      } else {
        // Set empty status if API fails
        setSyncStatus({
          customers: { count: 0, lastSync: null },
          employees: { count: 0, lastSync: null },
          items: { count: 0, lastSync: null },
        });
      }
    } catch (error) {
      
      // Set empty status on error
      setSyncStatus({
        customers: { count: 0, lastSync: null },
        employees: { count: 0, lastSync: null },
        items: { count: 0, lastSync: null },
      });
    }
  };

  const syncCustomers = async () => {
    setLoading(true);
    try {
      // First fetch customers from ERPNext
      const response = await fetch('/api/erpnext/customers');
      const result = await response.json();

      if (result.success && result.data) {
        // Now call the sync endpoint to save the data
        const syncResponse = await fetch('/api/customers/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matchedData: {
              toCreate: result.data.map((customer: any) => ({
                data: {
                  name: customer.customer_name || customer.name || '',
                  company_name: customer.customer_name || customer.name || '',
                  contact_person: customer.contact_person || customer.customer_name || '',
                  email: customer.email_id || customer.email || '',
                  phone: customer.mobile_no || customer.phone || '',
                  address: customer.customer_address || customer.address || '',
                  city: customer.city || '',
                  state: customer.state || '',
                  postal_code: customer.pincode || customer.postal_code || '',
                  country: customer.country || '',
                  tax_number: customer.tax_id || customer.tax_number || '',
                  credit_limit: customer.credit_limit || 0,
                  payment_terms: customer.payment_terms || '',
                  notes: customer.notes || '',
                  is_active: !customer.disabled,
                  erpnext_id: customer.name || '',
                },
              })),
              toUpdate: [],
              toSkip: [],
            },
          }),
        });

        const syncResult = await syncResponse.json();

        if (syncResult.success) {
          toast.success(`Synced ${syncResult.data.processed} customers from ERPNext`);
          setSyncStatus(prev => ({
            ...prev,
            customers: { count: syncResult.data.processed, lastSync: new Date().toISOString() },
          }));
        } else {
          toast.error(`Failed to sync customers: ${syncResult.message}`);
        }
      } else {
        toast.error('Failed to fetch customers from ERPNext');
      }
    } catch (error) {
      
      toast.error('Error syncing customers');
    } finally {
      setLoading(false);
    }
  };

  const syncEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/erpnext/employees');
      const result = await response.json();

      if (result.success) {
        toast.success(`Synced ${result.count} employees from ERPNext`);
        setSyncStatus(prev => ({
          ...prev,
          employees: { count: result.count, lastSync: new Date().toISOString() },
        }));
      } else {
        toast.error('Failed to sync employees');
      }
    } catch (error) {
      toast.error('Error syncing employees');
    } finally {
      setLoading(false);
    }
  };

  const syncItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/erpnext/equipment?action=sync');
      const result = await response.json();

      if (result.success) {
        toast.success(
          `Synced ${result.data?.created || 0} created, ${result.data?.updated || 0} updated equipment from ERPNext`
        );
        setSyncStatus(prev => ({
          ...prev,
          items: { count: result.data?.total_processed || 0, lastSync: new Date().toISOString() },
        }));
      } else {
        toast.error('Failed to sync equipment');
      }
    } catch (error) {
      toast.error('Error syncing equipment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ERPNext Integration</h1>
          <p className="text-muted-foreground">
            Manage ERPNext integration settings and data synchronization
          </p>
        </div>
        <Button onClick={testConnection} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Test Connection
        </Button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Connection Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {connectionStatus.connected ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-500" />
            )}
            <div>
              <p className="font-medium">
                {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-sm text-muted-foreground">{connectionStatus.message}</p>
            </div>
            <Badge variant={connectionStatus.connected ? 'default' : 'destructive'}>
              {connectionStatus.connected ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuration</span>
          </CardTitle>
          <CardDescription>ERPNext API configuration settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">ERPNext URL</Label>
              <Input
                id="url"
                value={config.url}
                onChange={e => setConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://erp.snd-ksa.online"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={config.apiKey}
                onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter API key"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input
              id="apiSecret"
              type="password"
              value={config.apiSecret}
              onChange={e => setConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
              placeholder="Enter API secret"
            />
          </div>
          <div className="flex justify-end">
            <Button>Save Configuration</Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ERPNext Integration Status</CardTitle>
              <CardDescription>Monitor the status of your ERPNext integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Connection Status</p>
                    <p className="text-sm text-muted-foreground">Test your ERPNext connection</p>
                  </div>
                  <Button onClick={testConnection} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wifi className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Configuration</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>URL: {config.url}</p>
                    <p>API Key: {config.apiKey ? '***' + config.apiKey.slice(-4) : 'Not set'}</p>
                    <p>
                      API Secret:{' '}
                      {config.apiSecret ? '***' + config.apiSecret.slice(-4) : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Synchronize data from ERPNext</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={syncCustomers} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Sync Customers
                </Button>
                <Button onClick={syncEmployees} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Sync Employees
                </Button>
                <Button onClick={syncItems} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Sync Items
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Synchronization</CardTitle>
              <CardDescription>Manage customer data synchronization with ERPNext</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Total Customers</p>
                    <p className="text-sm text-muted-foreground">
                      {syncStatus.customers.count} customers synchronized
                    </p>
                  </div>
                  <Button onClick={syncCustomers} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Sync Now
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Last Synchronization</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(syncStatus.customers.lastSync)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Webhook Management */}
          <WebhookManager />
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Synchronization</CardTitle>
              <CardDescription>Manage employee data synchronization with ERPNext</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Total Employees</p>
                    <p className="text-sm text-muted-foreground">
                      {syncStatus.employees.count} employees synchronized
                    </p>
                  </div>
                  <Button onClick={syncEmployees} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Sync Now
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Last Synchronization</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(syncStatus.employees.lastSync)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Synchronization</CardTitle>
              <CardDescription>Manage equipment data synchronization with ERPNext</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Total Equipment</p>
                    <p className="text-sm text-muted-foreground">
                      {syncStatus.items.count} equipment synchronized
                    </p>
                  </div>
                  <Button onClick={syncItems} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Sync Now
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Last Synchronization</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(syncStatus.items.lastSync)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Integration Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">Data Synchronization</p>
                <p className="text-sm text-muted-foreground">
                  Data is synchronized from ERPNext to your local system. Changes made in ERPNext
                  will be reflected here after synchronization.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">API Configuration</p>
                <p className="text-sm text-muted-foreground">
                  Ensure your ERPNext API credentials are correctly configured. The system uses
                  token-based authentication.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
