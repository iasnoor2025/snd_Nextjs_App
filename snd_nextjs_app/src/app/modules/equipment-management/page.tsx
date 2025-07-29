"use client";

import { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Download,
  Upload,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Equipment {
  id: string;
  name: string;
  category: string;
  status: string;
  location: string;
  purchase_date: string;
  serial_number: string;
  condition: string;
}

interface PaginatedResponse {
  data: Equipment[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export default function EquipmentManagementPage() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [equipment, setEquipment] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Get allowed actions for equipment management
  const allowedActions = getAllowedActions('Equipment');

  const mockEquipment = useMemo(() => [
    {
      id: "1",
      name: "Excavator CAT 320",
      category: "Heavy Equipment",
      status: "available",
      location: "Site A",
      purchase_date: "2023-01-15",
      serial_number: "CAT320-001",
      condition: "excellent"
    },
    {
      id: "2",
      name: "Bulldozer Komatsu D65",
      category: "Heavy Equipment",
      status: "in_use",
      location: "Site B",
      purchase_date: "2023-02-01",
      serial_number: "KOMD65-002",
      condition: "good"
    },
    {
      id: "3",
      name: "Crane Mobile 50T",
      category: "Lifting Equipment",
      status: "maintenance",
      location: "Site C",
      purchase_date: "2023-03-01",
      serial_number: "CRN50T-003",
      condition: "fair"
    }
  ], []);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          ...(search && { search }),
          ...(status && status !== 'all' && { status }),
          ...(category && category !== 'all' && { category }),
        });

        const response = await fetch(`/api/equipment?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch equipment');
        }

        const data = await response.json();
        setEquipment(data);
      } catch (error) {
        console.error('Error fetching equipment:', error);
        toast.error('Failed to fetch equipment');
        // Fallback to mock data for demo
        setEquipment({
          data: mockEquipment,
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: mockEquipment.length,
          next_page_url: null,
          prev_page_url: null
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [currentPage, search, status, category, mockEquipment]);

  const handleDelete = async () => {
    try {
      toast.loading("Deleting equipment...");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Equipment deleted successfully");
    } catch (error) {
      toast.error("Failed to delete equipment");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case "in_use":
        return <Badge className="bg-blue-100 text-blue-800">In Use</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case "out_of_service":
        return <Badge className="bg-red-100 text-red-800">Out of Service</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "excellent":
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case "good":
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
      case "fair":
        return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
      case "poor":
        return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{condition}</Badge>;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Equipment' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading equipment...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Equipment' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Equipment Management</h1>
            <p className="text-muted-foreground">Track and manage rental equipment inventory</p>
          </div>
          <div className="flex items-center gap-2">
            <Can action="export" subject="Equipment">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </Can>

            <Can action="import" subject="Equipment">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </Can>

            <Can action="create" subject="Equipment">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Equipment
              </Button>
            </Can>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Equipment Inventory</CardTitle>
            <CardDescription>Manage your equipment database and track availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search equipment..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_service">Out of Service</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Heavy Equipment">Heavy Equipment</SelectItem>
                  <SelectItem value="Lifting Equipment">Lifting Equipment</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment?.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="font-mono">{item.serial_number}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{getConditionBadge(item.condition)}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(item.purchase_date).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Can action="read" subject="Equipment">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Can>

                        <Can action="update" subject="Equipment">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Can>

                        <Can action="delete" subject="Equipment">
                          <Button size="sm" variant="outline" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Role-based content example */}
        <RoleBased roles={['ADMIN', 'MANAGER']}>
          <Card>
            <CardHeader>
              <CardTitle>Equipment Administration</CardTitle>
              <CardDescription>
                Advanced equipment management features for administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Can action="manage" subject="Equipment">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Equipment Settings
                  </Button>
                </Can>

                <Can action="export" subject="Equipment">
                  <Button variant="outline">
                    Generate Reports
                  </Button>
                </Can>

                <Can action="import" subject="Equipment">
                  <Button variant="outline">
                    Bulk Import
                  </Button>
                </Can>
              </div>
            </CardContent>
          </Card>
        </RoleBased>
      </div>
    </ProtectedRoute>
  );
}
