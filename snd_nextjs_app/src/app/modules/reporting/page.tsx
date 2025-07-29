"use client";

import { useState, useEffect, useMemo } from "react";
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
  Download,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Report {
  id: string;
  name: string;
  type: string;
  status: string;
  created_by: string;
  created_at: string;
  last_generated: string;
  schedule: string;
}

interface PaginatedResponse {
  data: Report[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export default function ReportingPage() {
  const [reports, setReports] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const mockReports = useMemo(() => [
    {
      id: "1",
      name: "Monthly Revenue Report",
      type: "financial",
      status: "active",
      created_by: "John Doe",
      created_at: "2024-01-01",
      last_generated: "2024-01-31",
      schedule: "monthly"
    },
    {
      id: "2",
      name: "Equipment Utilization Report",
      type: "operational",
      status: "active",
      created_by: "Jane Smith",
      created_at: "2024-01-15",
      last_generated: "2024-01-30",
      schedule: "weekly"
    },
    {
      id: "3",
      name: "Project Progress Report",
      type: "project",
      status: "draft",
      created_by: "Bob Johnson",
      created_at: "2024-01-20",
      last_generated: "2024-01-29",
      schedule: "daily"
    }
  ], []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          ...(search && { search }),
          ...(status && status !== 'all' && { status }),
          ...(type && type !== 'all' && { type }),
        });

        const response = await fetch(`/api/reports?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }

        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error('Failed to fetch reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [search, status, type, currentPage]);

  const handleDelete = async () => {
    try {
      toast.loading("Deleting report...");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Report deleted successfully");
    } catch {
      toast.error("Failed to delete report");
    }
  };

  const handleGenerate = async () => {
    try {
      toast.loading("Generating report...");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Report generated successfully");
    } catch {
      toast.error("Failed to generate report");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case "archived":
        return <Badge className="bg-red-100 text-red-800">Archived</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "financial":
        return <Badge className="bg-blue-100 text-blue-800">Financial</Badge>;
      case "operational":
        return <Badge className="bg-green-100 text-green-800">Operational</Badge>;
      case "project":
        return <Badge className="bg-purple-100 text-purple-800">Project</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{type}</Badge>;
    }
  };

  const types = Array.from(new Set(mockReports.map(r => r.type).filter(Boolean)));

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reporting</h1>
        <div className="flex space-x-2">
          <Button onClick={handleGenerate} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Reports
          </Button>
          <Link href="/modules/reporting/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search reports..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Manage automated reports and analytics
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {reports?.total || 0} reports
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports?.data.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{report.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(report.type)}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>{report.created_by}</TableCell>
                  <TableCell>{report.schedule}</TableCell>
                  <TableCell>{new Date(report.last_generated).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link href={`/modules/reporting/${report.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/modules/reporting/${report.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
