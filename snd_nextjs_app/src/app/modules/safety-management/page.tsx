"use client";

import { useState, useEffect } from "react";
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
  Eye
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";



export default function SafetyManagementPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [currentPage] = useState(1);
  const [perPage] = useState(10);

  const mockSafetyReports = [
    {
      id: "1",
      title: "Equipment malfunction",
      description: "Excavator showing unusual vibrations during operation",
      severity: "high",
      status: "open",
      reported_by: "John Smith",
      reported_date: "2024-01-15",
      assigned_to: "Mike Johnson",
      location: "Site A"
    },
    {
      id: "2",
      title: "Safety equipment missing",
      description: "Hard hats not available for new workers",
      severity: "medium",
      status: "in_progress",
      reported_by: "Jane Doe",
      reported_date: "2024-01-14",
      assigned_to: "Sarah Wilson",
      location: "Site B"
    },
    {
      id: "3",
      title: "Unsafe working conditions",
      description: "Wet surfaces causing slip hazards",
      severity: "high",
      status: "resolved",
      reported_by: "Bob Johnson",
      reported_date: "2024-01-13",
      assigned_to: "Mike Johnson",
      location: "Site A"
    }
  ];

  const filteredReports = mockSafetyReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(search.toLowerCase()) ||
                        report.description.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severity === "all" || report.severity === severity;
    const matchesStatus = status === "all" || report.status === status;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const total = filteredReports.length;
  const lastPage = Math.ceil(total / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedData = filteredReports.slice(startIndex, endIndex);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [search, severity, status, currentPage, filteredReports, total, lastPage, paginatedData]);

  const handleDelete = async () => {
    try {
      toast.loading("Deleting safety report...");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Safety report deleted successfully");
    } catch {
      toast.error("Failed to delete safety report");
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-red-100 text-red-800">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

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
        <h1 className="text-2xl font-bold">Safety Management</h1>
        <Link href="/modules/safety-management/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Report Safety Issue
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search safety reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Safety Reports</CardTitle>
              <CardDescription>
                Manage safety incidents and compliance reports
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {total} reports
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reported Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{report.title}</div>
                      <div className="text-sm text-gray-500">{report.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>{report.reported_by}</TableCell>
                  <TableCell>{report.assigned_to}</TableCell>
                  <TableCell>{report.location}</TableCell>
                  <TableCell>{new Date(report.reported_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link href={`/modules/safety-management/${report.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/modules/safety-management/${report.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
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
