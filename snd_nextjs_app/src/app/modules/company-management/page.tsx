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
  id: number;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  logo: string | null;
  legal_document: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface CompanyResponse {
  success: boolean;
  data: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

export default function CompanyManagementPage() {
  const [companies, setCompanies] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('page', currentPage.toString());
        params.append('limit', perPage.toString());

        const response = await fetch(`/api/companies?${params.toString()}`);
        const result: CompanyResponse = await response.json();

        if (result.success) {
          setCompanies(result);
        } else {
          toast.error(result.message || 'Failed to fetch companies');
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast.error('Failed to fetch companies');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [search, perPage, currentPage]);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this company?")) {
      try {
        const response = await fetch(`/api/companies/${id}`, {
          method: 'DELETE',
        });
        const result = await response.json();

        if (result.success) {
          toast.success("Company deleted successfully");
          // Refresh data
          setCurrentPage(1);
        } else {
          toast.error(result.message || 'Failed to delete company');
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        toast.error('Failed to delete company');
      }
    }
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
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Company</TableHead>
                  <TableHead className="min-w-[150px]">Contact</TableHead>
                  <TableHead className="min-w-[120px]">Address</TableHead>
                  <TableHead className="min-w-[100px]">Created</TableHead>
                  <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies?.data.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        {company.logo && (
                          <div className="text-xs text-gray-500">Has Logo</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {company.email && <div>{company.email}</div>}
                        {company.phone && <div>{company.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.address ? (
                        <div className="text-sm text-gray-600">{company.address}</div>
                      ) : (
                        <div className="text-sm text-gray-400">No address</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.created_at ? (
                        <div className="text-sm text-gray-600">
                          {new Date(company.created_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/modules/company-management/${company.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/modules/company-management/${company.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
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

          {companies && companies.pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {((companies.pagination.page - 1) * companies.pagination.limit) + 1} to{" "}
                {Math.min(companies.pagination.page * companies.pagination.limit, companies.pagination.total)} of{" "}
                {companies.pagination.total} results
              </div>
              <Pagination
                currentPage={companies.pagination.page}
                totalPages={companies.pagination.totalPages}
                totalItems={companies.pagination.total}
                itemsPerPage={companies.pagination.limit}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

