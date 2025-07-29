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
import { Eye, Edit, Trash2, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  registration_number: string;
  tax_number: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  size: string;
  founded_year: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CompanyResponse {
  data: Company[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

// Mock data
const mockCompanies: Company[] = [
  {
    id: "1",
    name: "Tech Solutions Inc.",
    registration_number: "REG001",
    tax_number: "TAX001",
    address: "123 Tech Street",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    phone: "+1-555-0123",
    email: "contact@techsolutions.com",
    website: "www.techsolutions.com",
    industry: "Technology",
    size: "Medium",
    founded_year: 2015,
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    name: "Global Manufacturing Ltd.",
    registration_number: "REG002",
    tax_number: "TAX002",
    address: "456 Industrial Ave",
    city: "Chicago",
    state: "IL",
    country: "USA",
    phone: "+1-555-0456",
    email: "info@globalmanufacturing.com",
    website: "www.globalmanufacturing.com",
    industry: "Manufacturing",
    size: "Large",
    founded_year: 1990,
    is_active: true,
    created_at: "2024-01-14T09:30:00Z",
    updated_at: "2024-01-14T09:30:00Z"
  },
  {
    id: "3",
    name: "Green Energy Corp.",
    registration_number: "REG003",
    tax_number: "TAX003",
    address: "789 Renewable Blvd",
    city: "Denver",
    state: "CO",
    country: "USA",
    phone: "+1-555-0789",
    email: "hello@greenenergy.com",
    website: "www.greenenergy.com",
    industry: "Energy",
    size: "Small",
    founded_year: 2020,
    is_active: false,
    created_at: "2024-01-13T14:20:00Z",
    updated_at: "2024-01-13T14:20:00Z"
  },
  {
    id: "4",
    name: "HealthCare Plus",
    registration_number: "REG004",
    tax_number: "TAX004",
    address: "321 Medical Center Dr",
    city: "Boston",
    state: "MA",
    country: "USA",
    phone: "+1-555-0321",
    email: "info@healthcareplus.com",
    website: "www.healthcareplus.com",
    industry: "Healthcare",
    size: "Large",
    founded_year: 2005,
    is_active: true,
    created_at: "2024-01-12T11:45:00Z",
    updated_at: "2024-01-12T11:45:00Z"
  },
  {
    id: "5",
    name: "Digital Marketing Pro",
    registration_number: "REG005",
    tax_number: "TAX005",
    address: "654 Creative Lane",
    city: "Austin",
    state: "TX",
    country: "USA",
    phone: "+1-555-0654",
    email: "hello@digitalmarketingpro.com",
    website: "www.digitalmarketingpro.com",
    industry: "Marketing",
    size: "Medium",
    founded_year: 2018,
    is_active: true,
    created_at: "2024-01-11T16:15:00Z",
    updated_at: "2024-01-11T16:15:00Z"
  }
];

export default function CompanyManagementPage() {
  const [companies, setCompanies] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const filteredData = mockCompanies.filter(company => {
        const matchesSearch = company.name.toLowerCase().includes(search.toLowerCase()) ||
                             company.email.toLowerCase().includes(search.toLowerCase()) ||
                             company.registration_number.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = status === "all" ||
                             (status === "active" && company.is_active) ||
                             (status === "inactive" && !company.is_active);
        const matchesIndustry = industry === "all" || company.industry === industry;
        return matchesSearch && matchesStatus && matchesIndustry;
      });

      const total = filteredData.length;
      const lastPage = Math.ceil(total / perPage);
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      setCompanies({
        data: paginatedData,
        current_page: currentPage,
        last_page: lastPage,
        per_page: perPage,
        total,
        next_page_url: currentPage < lastPage ? `/companies?page=${currentPage + 1}` : null,
        prev_page_url: currentPage > 1 ? `/companies?page=${currentPage - 1}` : null
      });
      setLoading(false);
    }, 500);
  }, [search, status, industry, perPage, currentPage]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this company?")) {
      // Simulate API call
      setTimeout(() => {
        toast.success("Company deleted successfully");
        // Refresh data
        setLoading(true);
        setTimeout(() => {
          const updatedData = mockCompanies.filter(company => company.id !== id);
          const filteredData = updatedData.filter(company => {
            const matchesSearch = company.name.toLowerCase().includes(search.toLowerCase()) ||
                                 company.email.toLowerCase().includes(search.toLowerCase()) ||
                                 company.registration_number.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = status === "all" ||
                                 (status === "active" && company.is_active) ||
                                 (status === "inactive" && !company.is_active);
            const matchesIndustry = industry === "all" || company.industry === industry;
            return matchesSearch && matchesStatus && matchesIndustry;
          });

          const total = filteredData.length;
          const lastPage = Math.ceil(total / perPage);
          const startIndex = (currentPage - 1) * perPage;
          const endIndex = startIndex + perPage;
          const paginatedData = filteredData.slice(startIndex, endIndex);

          setCompanies({
            data: paginatedData,
            current_page: currentPage,
            last_page: lastPage,
            per_page: perPage,
            total,
            next_page_url: currentPage < lastPage ? `/companies?page=${currentPage + 1}` : null,
            prev_page_url: currentPage > 1 ? `/companies?page=${currentPage - 1}` : null
          });
          setLoading(false);
        }, 300);
      }, 500);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getSizeBadge = (size: string) => {
    const sizeColors = {
      Small: "bg-blue-100 text-blue-800",
      Medium: "bg-yellow-100 text-yellow-800",
      Large: "bg-purple-100 text-purple-800"
    };
    return <Badge className={sizeColors[size as keyof typeof sizeColors] || "bg-gray-100 text-gray-800"}>{size}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Company Management</h1>
        </div>
        <Link href="/modules/company-management/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search companies..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Company</TableHead>
                  <TableHead className="min-w-[150px]">Registration</TableHead>
                  <TableHead className="min-w-[120px]">Industry</TableHead>
                  <TableHead className="min-w-[100px]">Size</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[100px]">Founded</TableHead>
                  <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies?.data.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-gray-500">{company.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Reg: {company.registration_number}</div>
                        <div>Tax: {company.tax_number}</div>
                      </div>
                    </TableCell>
                    <TableCell>{company.industry}</TableCell>
                    <TableCell>{getSizeBadge(company.size)}</TableCell>
                    <TableCell>{getStatusBadge(company.is_active)}</TableCell>
                    <TableCell>{company.founded_year}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(company.id)}
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

          {companies && companies.total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {((companies.current_page - 1) * companies.per_page) + 1} to{" "}
                {Math.min(companies.current_page * companies.per_page, companies.total)} of{" "}
                {companies.total} results
              </div>
              <Pagination>
                <PaginationContent>
                  {companies.prev_page_url && (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(companies.current_page - 1);
                        }}
                      />
                    </PaginationItem>
                  )}
                  {Array.from({ length: companies.last_page }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={page === companies.current_page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {companies.next_page_url && (
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(companies.current_page + 1);
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
