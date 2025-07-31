"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Database,
  Package,
  FileText,
  Loader2,
  AlertTriangle,
  Info,
  Wifi,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/lib/api-service";

interface Equipment {
  id: number;
  name: string;
  model_number?: string;
  status: string;
  category_id?: number;
  manufacturer?: string;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  erpnext_id?: string;
  serial_number?: string;
  description?: string;
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

export default function EquipmentManagementPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [erpnextEquipment, setERPNextEquipment] = useState<ERPNextEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("local");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getEquipment();
      if (response.success && Array.isArray(response.data)) {
        setEquipment(response.data);
      } else {
        setEquipment([]);
        toast.error('Failed to load equipment');
      }
    } catch (error) {
      setEquipment([]);
      toast.error('Failed to load equipment');
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
      } else {
        setERPNextEquipment([]);
        toast.error('Failed to load ERPNext equipment');
      }
    } catch (error) {
      setERPNextEquipment([]);
      toast.error('Failed to load ERPNext equipment');
    } finally {
      setLoading(false);
    }
  };

  const syncEquipmentFromERPNext = async () => {
    setSyncing(true);
    try {
      const response = await ApiService.syncEquipmentFromERPNext();
      if (response.success) {
        toast.success(`Equipment synced successfully! ${response.data?.created || 0} created, ${response.data?.updated || 0} updated`);
        await fetchEquipment(); // Refresh the local equipment list
      } else {
        toast.error('Failed to sync equipment from ERPNext');
      }
    } catch (error) {
      toast.error('Failed to sync equipment from ERPNext');
    } finally {
      setSyncing(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'erpnext') {
      fetchERPNextEquipment();
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.model_number && item.model_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredERPNextEquipment = erpnextEquipment.filter(item => {
    return item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { variant: 'default' as const, label: 'Available' },
      rented: { variant: 'secondary' as const, label: 'Rented' },
      maintenance: { variant: 'destructive' as const, label: 'Maintenance' },
      out_of_service: { variant: 'destructive' as const, label: 'Out of Service' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipment Management</h1>
          <p className="text-muted-foreground">
            Manage equipment inventory and ERPNext integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={syncEquipmentFromERPNext} disabled={syncing}>
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Sync from ERPNext
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of Service</option>
              </select>
              <Button variant="outline" onClick={fetchEquipment} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="local">Local Equipment</TabsTrigger>
          <TabsTrigger value="erpnext">ERPNext Equipment</TabsTrigger>
        </TabsList>

        {/* Local Equipment Tab */}
        <TabsContent value="local" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Local Equipment Inventory</span>
              </CardTitle>
              <CardDescription>
                Equipment stored in the local database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Daily Rate</TableHead>
                      <TableHead>ERPNext ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No equipment found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEquipment.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.model_number || '-'}</TableCell>
                          <TableCell>{item.manufacturer || '-'}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            {item.daily_rate ? `$${item.daily_rate}` : '-'}
                          </TableCell>
                          <TableCell>
                            {item.erpnext_id ? (
                              <Badge variant="outline">{item.erpnext_id}</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ERPNext Equipment Tab */}
        <TabsContent value="erpnext" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>ERPNext Equipment</span>
              </CardTitle>
              <CardDescription>
                Equipment available in ERPNext system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
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
                    {filteredERPNextEquipment.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No ERPNext equipment found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredERPNextEquipment.map((item) => (
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
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Equipment Management Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">ERPNext Integration</p>
                <p className="text-sm text-muted-foreground">
                  Equipment can be synchronized from ERPNext to your local system. Changes made in ERPNext will be reflected here after synchronization.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Data Management</p>
                <p className="text-sm text-muted-foreground">
                  Local equipment data is stored in your database and can be managed independently. ERPNext data is read-only and used for synchronization.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
