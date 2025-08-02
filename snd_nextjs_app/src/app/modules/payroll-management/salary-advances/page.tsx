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
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

interface SalaryAdvance {
  id: string;
  employee_name: string;
  employee_id: string;
  amount: number;
  reason: string;
  request_date: string;
  approval_date?: string;
  status: string;
  approved_by?: string;
  repayment_schedule?: string;
}

interface PaginatedResponse {
  data: SalaryAdvance[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export default function SalaryAdvancesPage() {
  const [advances, setAdvances] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const mockAdvances = useMemo(() => [
    {
      id: "1",
      employee_name: "John Doe",
      employee_id: "EMP001",
      amount: 2000,
      reason: "Medical emergency",
      request_date: "2024-01-15",
      approval_date: "2024-01-16",
      status: "approved",
      approved_by: "HR Manager",
      repayment_schedule: "3 months"
    },
    {
      id: "2",
      employee_name: "Jane Smith",
      employee_id: "EMP002",
      amount: 1500,
      reason: "Home repair",
      request_date: "2024-01-20",
      status: "pending",
      repayment_schedule: "2 months"
    },
    {
      id: "3",
      employee_name: "Bob Johnson",
      employee_id: "EMP003",
      amount: 3000,
      reason: "Education expenses",
      request_date: "2024-01-10",
      approval_date: "2024-01-12",
      status: "rejected",
      approved_by: "HR Manager"
    }
  ], []);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const filteredData = mockAdvances.filter(advance => {
        const matchesSearch = advance.employee_name.toLowerCase().includes(search.toLowerCase()) ||
                            advance.reason.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = status === "all" || advance.status === status;
        return matchesSearch && matchesStatus;
      });

      const total = filteredData.length;
      const lastPage = Math.ceil(total / 10);
      const startIndex = (currentPage - 1) * 10;
      const endIndex = startIndex + 10;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      setAdvances({
        data: paginatedData,
        current_page: currentPage,
        last_page: lastPage,
        per_page: 10,
        total,
        next_page_url: currentPage < lastPage ? `/advances?page=${currentPage + 1}` : null,
        prev_page_url: currentPage > 1 ? `/advances?page=${currentPage - 1}` : null
      });
      setLoading(false);
    }, 500);
  }, [search, status, currentPage, mockAdvances]);

  const handleApprove = async (advanceId: string) => {
    try {
      toast.loading("Approving advance...");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Advance approved successfully");
    } catch {
      toast.error("Failed to approve advance");
    }
  };

  const handleReject = async (advanceId: string) => {
    try {
      toast.loading("Rejecting advance...");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Advance rejected successfully");
    } catch {
      toast.error("Failed to reject advance");
    }
  };

  const handleDelete = async (advanceId: string) => {
    try {
      toast.loading("Deleting advance...");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Advance deleted successfully");
    } catch {
      toast.error("Failed to delete advance");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
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
        <h1 className="text-2xl font-bold">Salary Advances</h1>
        <div className="flex space-x-2">
          <Button onClick={() => setLoading(true)} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/modules/payroll-management/salary-advances/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Request Advance
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
                placeholder="Search advances..."
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
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Salary Advances</CardTitle>
              <CardDescription>
                Manage employee salary advance requests
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {advances?.total || 0} advance requests
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Repayment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advances?.data.map((advance) => (
                <TableRow key={advance.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{advance.employee_name}</div>
                      <div className="text-sm text-gray-500">ID: {advance.employee_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>${advance.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={advance.reason}>
                      {advance.reason}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(advance.request_date).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(advance.status)}</TableCell>
                  <TableCell>{advance.repayment_schedule || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link href={`/modules/payroll-management/salary-advances/${advance.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {advance.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(advance.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(advance.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Link href={`/modules/payroll-management/salary-advances/${advance.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(advance.id)}>
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
      {advances && advances.last_page > 1 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((advances.current_page - 1) * advances.per_page) + 1} to{" "}
              {Math.min(advances.current_page * advances.per_page, advances.total)} of{" "}
              {advances.total} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, advances.current_page - 1))}
                disabled={advances.current_page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {/* First page */}
                {advances.current_page > 2 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      className="w-8 h-8 p-0"
                    >
                      1
                    </Button>
                    {advances.current_page > 3 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                  </>
                )}

                {/* Current page and surrounding pages */}
                {(() => {
                  const pages = [];
                  const startPage = Math.max(1, advances.current_page - 1);
                  const endPage = Math.min(advances.last_page, advances.current_page + 1);

                  for (let page = startPage; page <= endPage; page++) {
                    pages.push(page);
                  }

                  return pages.map((page) => (
                    <Button
                      key={page}
                      variant={advances.current_page === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ));
                })()}

                {/* Last page */}
                {advances.current_page < advances.last_page - 1 && (
                  <>
                    {advances.current_page < advances.last_page - 2 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(advances.last_page)}
                      className="w-8 h-8 p-0"
                    >
                      {advances.last_page}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(advances.last_page, advances.current_page + 1))}
                disabled={advances.current_page === advances.last_page}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
