"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Eye, Edit, Trash2, Plus, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  employee_name: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: string;
  submitted_date: string;
  approved_by: string | null;
  approved_date: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

interface LeaveRequestResponse {
  data: LeaveRequest[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

// Mock data
const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "1",
    employee_name: "John Smith",
    employee_id: "EMP001",
    leave_type: "Annual Leave",
    start_date: "2024-02-15",
    end_date: "2024-02-20",
    days_requested: 5,
    reason: "Family vacation",
    status: "Pending",
    submitted_date: "2024-01-15T10:00:00Z",
    approved_by: null,
    approved_date: null,
    comments: null,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    employee_name: "Sarah Wilson",
    employee_id: "EMP002",
    leave_type: "Sick Leave",
    start_date: "2024-01-20",
    end_date: "2024-01-22",
    days_requested: 3,
    reason: "Medical appointment",
    status: "Approved",
    submitted_date: "2024-01-14T14:30:00Z",
    approved_by: "Mike Johnson",
    approved_date: "2024-01-14T16:45:00Z",
    comments: "Approved with medical certificate",
    created_at: "2024-01-14T14:30:00Z",
    updated_at: "2024-01-14T16:45:00Z"
  },
  {
    id: "3",
    employee_name: "David Lee",
    employee_id: "EMP003",
    leave_type: "Personal Leave",
    start_date: "2024-01-25",
    end_date: "2024-01-25",
    days_requested: 1,
    reason: "Personal emergency",
    status: "Rejected",
    submitted_date: "2024-01-13T09:15:00Z",
    approved_by: "Lisa Brown",
    approved_date: "2024-01-13T11:20:00Z",
    comments: "Rejected due to insufficient notice",
    created_at: "2024-01-13T09:15:00Z",
    updated_at: "2024-01-13T11:20:00Z"
  },
  {
    id: "4",
    employee_name: "Emily Chen",
    employee_id: "EMP004",
    leave_type: "Maternity Leave",
    start_date: "2024-03-01",
    end_date: "2024-08-31",
    days_requested: 120,
    reason: "Maternity leave",
    status: "Approved",
    submitted_date: "2024-01-12T11:20:00Z",
    approved_by: "Tom Davis",
    approved_date: "2024-01-12T15:30:00Z",
    comments: "Approved with all required documentation",
    created_at: "2024-01-12T11:20:00Z",
    updated_at: "2024-01-12T15:30:00Z"
  },
  {
    id: "5",
    employee_name: "Alex Rodriguez",
    employee_id: "EMP005",
    leave_type: "Study Leave",
    start_date: "2024-02-10",
    end_date: "2024-02-12",
    days_requested: 3,
    reason: "Professional development course",
    status: "Pending",
    submitted_date: "2024-01-11T15:45:00Z",
    approved_by: null,
    approved_date: null,
    comments: null,
    created_at: "2024-01-11T15:45:00Z",
    updated_at: "2024-01-11T15:45:00Z"
  }
];

export default function LeaveManagementPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [leaveType, setLeaveType] = useState("all");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const filteredData = mockLeaveRequests.filter(request => {
        const matchesSearch = request.employee_name.toLowerCase().includes(search.toLowerCase()) ||
                             request.employee_id.toLowerCase().includes(search.toLowerCase()) ||
                             request.reason.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = status === "all" || request.status === status;
        const matchesType = leaveType === "all" || request.leave_type === leaveType;
        return matchesSearch && matchesStatus && matchesType;
      });

      const total = filteredData.length;
      const lastPage = Math.ceil(total / perPage);
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      setLeaveRequests({
        data: paginatedData,
        current_page: currentPage,
        last_page: lastPage,
        per_page: perPage,
        total,
        next_page_url: currentPage < lastPage ? `/leave-requests?page=${currentPage + 1}` : null,
        prev_page_url: currentPage > 1 ? `/leave-requests?page=${currentPage - 1}` : null
      });
      setLoading(false);
    }, 500);
  }, [search, status, leaveType, perPage, currentPage]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this leave request?")) {
      // Simulate API call
      setTimeout(() => {
        toast.success("Leave request deleted successfully");
        // Refresh data
        setLoading(true);
        setTimeout(() => {
          const updatedData = mockLeaveRequests.filter(request => request.id !== id);
          const filteredData = updatedData.filter(request => {
            const matchesSearch = request.employee_name.toLowerCase().includes(search.toLowerCase()) ||
                                 request.employee_id.toLowerCase().includes(search.toLowerCase()) ||
                                 request.reason.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = status === "all" || request.status === status;
            const matchesType = leaveType === "all" || request.leave_type === leaveType;
            return matchesSearch && matchesStatus && matchesType;
          });

          const total = filteredData.length;
          const lastPage = Math.ceil(total / perPage);
          const startIndex = (currentPage - 1) * perPage;
          const endIndex = startIndex + perPage;
          const paginatedData = filteredData.slice(startIndex, endIndex);

          setLeaveRequests({
            data: paginatedData,
            current_page: currentPage,
            last_page: lastPage,
            per_page: perPage,
            total,
            next_page_url: currentPage < lastPage ? `/leave-requests?page=${currentPage + 1}` : null,
            prev_page_url: currentPage > 1 ? `/leave-requests?page=${currentPage - 1}` : null
          });
          setLoading(false);
        }, 300);
      }, 500);
    }
  };

  const handleApprove = (id: string) => {
    // Simulate API call
    setTimeout(() => {
      toast.success("Leave request approved successfully");
      // Update the status in mock data
      const updatedData = mockLeaveRequests.map(request =>
        request.id === id
          ? { ...request, status: "Approved", approved_by: "Current User", approved_date: new Date().toISOString() }
          : request
      );

      // Refresh data
      setLoading(true);
      setTimeout(() => {
        const filteredData = updatedData.filter(request => {
          const matchesSearch = request.employee_name.toLowerCase().includes(search.toLowerCase()) ||
                               request.employee_id.toLowerCase().includes(search.toLowerCase()) ||
                               request.reason.toLowerCase().includes(search.toLowerCase());
          const matchesStatus = status === "all" || request.status === status;
          const matchesType = leaveType === "all" || request.leave_type === leaveType;
          return matchesSearch && matchesStatus && matchesType;
        });

        const total = filteredData.length;
        const lastPage = Math.ceil(total / perPage);
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        setLeaveRequests({
          data: paginatedData,
          current_page: currentPage,
          last_page: lastPage,
          per_page: perPage,
          total,
          next_page_url: currentPage < lastPage ? `/leave-requests?page=${currentPage + 1}` : null,
          prev_page_url: currentPage > 1 ? `/leave-requests?page=${currentPage - 1}` : null
        });
        setLoading(false);
      }, 300);
    }, 500);
  };

  const handleReject = (id: string) => {
    // Simulate API call
    setTimeout(() => {
      toast.success("Leave request rejected");
      // Update the status in mock data
      const updatedData = mockLeaveRequests.map(request =>
        request.id === id
          ? { ...request, status: "Rejected", approved_by: "Current User", approved_date: new Date().toISOString() }
          : request
      );

      // Refresh data
      setLoading(true);
      setTimeout(() => {
        const filteredData = updatedData.filter(request => {
          const matchesSearch = request.employee_name.toLowerCase().includes(search.toLowerCase()) ||
                               request.employee_id.toLowerCase().includes(search.toLowerCase()) ||
                               request.reason.toLowerCase().includes(search.toLowerCase());
          const matchesStatus = status === "all" || request.status === status;
          const matchesType = leaveType === "all" || request.leave_type === leaveType;
          return matchesSearch && matchesStatus && matchesType;
        });

        const total = filteredData.length;
        const lastPage = Math.ceil(total / perPage);
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        setLeaveRequests({
          data: paginatedData,
          current_page: currentPage,
          last_page: lastPage,
          per_page: perPage,
          total,
          next_page_url: currentPage < lastPage ? `/leave-requests?page=${currentPage + 1}` : null,
          prev_page_url: currentPage > 1 ? `/leave-requests?page=${currentPage - 1}` : null
        });
        setLoading(false);
      }, 300);
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      Cancelled: "bg-gray-100 text-gray-800"
    };
    return <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const getLeaveTypeBadge = (type: string) => {
    const typeColors = {
      "Annual Leave": "bg-blue-100 text-blue-800",
      "Sick Leave": "bg-red-100 text-red-800",
      "Personal Leave": "bg-purple-100 text-purple-800",
      "Maternity Leave": "bg-pink-100 text-pink-800",
      "Study Leave": "bg-green-100 text-green-800"
    };
    return <Badge className={typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}>{type}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading leave requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Leave Management</h1>
        </div>
        <Link href="/modules/leave-management/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search leave requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                  <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                  <SelectItem value="Study Leave">Study Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests?.data.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.employee_name}</div>
                        <div className="text-sm text-gray-500">{request.employee_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getLeaveTypeBadge(request.leave_type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(request.start_date)} - {formatDate(request.end_date)}</div>
                      </div>
                    </TableCell>
                    <TableCell>{request.days_requested} days</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{formatDate(request.submitted_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/modules/leave-management/${request.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {request.status === "Pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(request.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Link href={`/modules/leave-management/${request.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(request.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {leaveRequests && leaveRequests.last_page > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {((leaveRequests.current_page - 1) * leaveRequests.per_page) + 1} to{" "}
                {Math.min(leaveRequests.current_page * leaveRequests.per_page, leaveRequests.total)} of{" "}
                {leaveRequests.total} results
              </div>
              <Pagination>
                <PaginationContent>
                  {leaveRequests.prev_page_url && (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(leaveRequests.current_page - 1);
                        }}
                      />
                    </PaginationItem>
                  )}
                  {Array.from({ length: leaveRequests.last_page }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={page === leaveRequests.current_page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {leaveRequests.next_page_url && (
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(leaveRequests.current_page + 1);
                        }}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
