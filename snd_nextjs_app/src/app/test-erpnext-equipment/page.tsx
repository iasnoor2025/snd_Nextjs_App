"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2,
  Download,
  Database,
  Package,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/lib/api-service";

interface Equipment {
  id: number;
  name: string;
  model_number?: string;
  status: string;
  manufacturer?: string;
  daily_rate?: number;
  erpnext_id?: string;
  serial_number?: string;
}

interface ERPNextEquipment {
  name: string;
  item_code: string;
  item_name: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  serial_no?: string;
  standard_rate?: string;
  disabled?: boolean;
}

export default function TestERPNextEquipmentPage() {
  const [localEquipment, setLocalEquipment] = useState<Equipment[]>([]);
  const [erpnextEquipment, setERPNextEquipment] = useState<ERPNextEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResults, setTestResults] = useState<{
    connection: boolean;
    localCount: number;
    erpnextCount: number;
    syncResult?: any;
  }>({
    connection: false,
    localCount: 0,
    erpnextCount: 0,
  });

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/erpnext/test-connection');
      const result = await response.json();

      if (result.success) {
        toast.success('ERPNext connection successful!');
        setTestResults(prev => ({ ...prev, connection: true }));
      } else {
        toast.error(`ERPNext connection failed: ${result.message}`);
        setTestResults(prev => ({ ...prev, connection: false }));
      }
    } catch (error) {
      toast.error('Failed to test ERPNext connection');
      setTestResults(prev => ({ ...prev, connection: false }));
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalEquipment = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getEquipment();
      if (response.success && Array.isArray(response.data)) {
        setLocalEquipment(response.data);
        setTestResults(prev => ({ ...prev, localCount: response.data.length }));
        toast.success(`Loaded ${response.data.length} local equipment items`);
      } else {
        setLocalEquipment([]);
        setTestResults(prev => ({ ...prev, localCount: 0 }));
        toast.error('Failed to load local equipment');
      }
    } catch (error) {
      setLocalEquipment([]);
      setTestResults(prev => ({ ...prev, localCount: 0 }));
      toast.error('Failed to load local equipment');
    } finally {
      setLoading(false);
    }
  };

  const fetchERPNextEquipment = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getERPNextEquipmentDirect();
      if (response.success && Array.isArray(response.data)) {
        setERPNextEquipment(response.data);
        setTestResults(prev => ({ ...prev, erpnextCount: response.data.length }));
        toast.success(`Loaded ${response.data.length} ERPNext equipment items`);
      } else {
        setERPNextEquipment([]);
        setTestResults(prev => ({ ...prev, erpnextCount: 0 }));
        toast.error('Failed to load ERPNext equipment');
      }
    } catch (error) {
      setERPNextEquipment([]);
      setTestResults(prev => ({ ...prev, erpnextCount: 0 }));
      toast.error('Failed to load ERPNext equipment');
    } finally {
      setLoading(false);
    }
  };

  const syncEquipment = async () => {
    setSyncing(true);
    try {
      const response = await ApiService.syncEquipmentFromERPNext();
      if (response.success) {
        toast.success(`Equipment sync completed! ${response.data?.created || 0} created, ${response.data?.updated || 0} updated`);
        setTestResults(prev => ({ 
          ...prev, 
          syncResult: response.data 
        }));
        // Refresh local equipment after sync
        await fetchLocalEquipment();
      } else {
        toast.error('Failed to sync equipment from ERPNext');
      }
    } catch (error) {
      toast.error('Failed to sync equipment from ERPNext');
    } finally {
      setSyncing(false);
    }
  };

  const runFullTest = async () => {
    await testConnection();
    await fetchLocalEquipment();
    await fetchERPNextEquipment();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ERPNext Equipment Integration Test</h1>
          <p className="text-muted-foreground">
            Test and verify ERPNext equipment integration functionality
          </p>
        </div>
        <Button onClick={runFullTest} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Run Full Test
        </Button>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Test Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              {testResults.connection ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm">
                Connection: {testResults.connection ? 'Success' : 'Failed'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <span className="text-sm">
                Local Equipment: {testResults.localCount}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-orange-500" />
              <span className="text-sm">
                ERPNext Equipment: {testResults.erpnextCount}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-purple-500" />
              <span className="text-sm">
                Sync: {testResults.syncResult ? 'Completed' : 'Not Run'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button onClick={testConnection} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
          Test Connection
        </Button>
        <Button onClick={fetchLocalEquipment} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
          Load Local Equipment
        </Button>
        <Button onClick={fetchERPNextEquipment} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Package className="h-4 w-4 mr-2" />}
          Load ERPNext Equipment
        </Button>
        <Button onClick={syncEquipment} disabled={syncing}>
          {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Sync Equipment
        </Button>
      </div>

      {/* Local Equipment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Local Equipment ({localEquipment.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {localEquipment.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No local equipment found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ERPNext ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localEquipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.model_number || '-'}</TableCell>
                    <TableCell>{item.manufacturer || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'available' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.erpnext_id ? (
                        <Badge variant="outline">{item.erpnext_id}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ERPNext Equipment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>ERPNext Equipment ({erpnextEquipment.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {erpnextEquipment.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No ERPNext equipment found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Standard Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {erpnextEquipment.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.item_code}</Badge>
                    </TableCell>
                    <TableCell>{item.model || '-'}</TableCell>
                    <TableCell>{item.manufacturer || '-'}</TableCell>
                    <TableCell>
                      {item.standard_rate ? `$${item.standard_rate}` : '-'}
                    </TableCell>
                    <TableCell>
                      {item.disabled ? (
                        <Badge variant="destructive">Disabled</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sync Results */}
      {testResults.syncResult && (
        <Card>
          <CardHeader>
            <CardTitle>Last Sync Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Total Processed</p>
                <p className="text-2xl font-bold">{testResults.syncResult.total_processed}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-2xl font-bold text-green-600">{testResults.syncResult.created}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Updated</p>
                <p className="text-2xl font-bold text-blue-600">{testResults.syncResult.updated}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Errors</p>
                <p className="text-2xl font-bold text-red-600">{testResults.syncResult.errors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 