'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { PermissionContent, RoleContent } from '@/lib/rbac/rbac-components';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Building2, ChevronLeft, ChevronRight, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
// i18n refactor: All user-facing strings now use useTranslation('company')
import { useTranslation } from 'react-i18next';

interface Company {
  id: number;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  logo: string | null;
  // Saudi Law Required Documents
  commercial_registration: string | null;
  commercial_registration_expiry: string | null;
  tax_registration: string | null;
  tax_registration_expiry: string | null;
  municipality_license: string | null;
  municipality_license_expiry: string | null;
  chamber_of_commerce: string | null;
  chamber_of_commerce_expiry: string | null;
  labor_office_license: string | null;
  labor_office_license_expiry: string | null;
  gosi_registration: string | null;
  gosi_registration_expiry: string | null;
  saudi_standards_license: string | null;
  saudi_standards_license_expiry: string | null;
  environmental_license: string | null;
  environmental_license_expiry: string | null;
  // Additional Company Information
  website: string | null;
  contact_person: string | null;
  contact_person_phone: string | null;
  contact_person_email: string | null;
  company_type: string | null;
  industry: string | null;
  employee_count: number | null;
  // Legacy field for backward compatibility
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
  const { t } = useTranslation('company');
  const [companies, setCompanies] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [perPage] = useState(10);
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
        
        toast.error('Failed to fetch companies');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [search, perPage, currentPage]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this company?')) {
      try {
        const response = await fetch(`/api/companies/${id}`, {
          method: 'DELETE',
        });
        const result = await response.json();

        if (result.success) {
          toast.success('Company deleted successfully');
          // Refresh data
          setCurrentPage(1);
        } else {
          toast.error(result.message || 'Failed to delete company');
        }
      } catch (error) {
        
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
    <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'Company' }}>
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{t('companyManagementTitle')}</h1>
          </div>
          <PermissionContent action="create" subject="Company">
            <Link href="/modules/company-management/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('addCompanyButton')}
              </Button>
            </Link>
          </PermissionContent>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('companiesTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder={t('searchCompaniesPlaceholder')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">{t('companyName')}</TableHead>
                    <TableHead className="min-w-[150px]">{t('contact')}</TableHead>
                    <TableHead className="min-w-[120px]">{t('address')}</TableHead>
                    <TableHead className="min-w-[100px]">{t('createdAt')}</TableHead>
                    <TableHead className="text-right min-w-[120px]">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies?.data.map(company => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{company.name}</div>
                          {company.logo && (
                            <div className="text-xs text-gray-500">{t('hasLogo')}</div>
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
                          <div className="text-sm text-gray-400">{t('noAddress')}</div>
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
                          <PermissionContent action="read" subject="Company">
                            <Link href={`/modules/company-management/${company.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </PermissionContent>
                          <PermissionContent action="update" subject="Company">
                            <Link href={`/modules/company-management/${company.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </PermissionContent>
                          <PermissionContent action="delete" subject="Company">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(company.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionContent>
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
                  {t('showingResults', {
                    start: (companies.pagination.page - 1) * companies.pagination.limit + 1,
                    end: Math.min(
                      companies.pagination.page * companies.pagination.limit,
                      companies.pagination.total
                    ),
                    total: companies.pagination.total,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, companies.pagination.page - 1))}
                    disabled={companies.pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('previous')}
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* First page */}
                    {companies.pagination.page > 2 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          className="w-8 h-8 p-0"
                        >
                          1
                        </Button>
                        {companies.pagination.page > 3 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                      </>
                    )}

                    {/* Current page and surrounding pages */}
                    {(() => {
                      const pages: number[] = [];
                      const startPage = Math.max(1, companies.pagination.page - 1);
                      const endPage = Math.min(
                        companies.pagination.totalPages,
                        companies.pagination.page + 1
                      );

                      for (let page = startPage; page <= endPage; page++) {
                        pages.push(page);
                      }

                      return pages.map(page => (
                        <Button
                          key={page}
                          variant={companies.pagination.page === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ));
                    })()}

                    {/* Last page */}
                    {companies.pagination.page < companies.pagination.totalPages - 1 && (
                      <>
                        {companies.pagination.page < companies.pagination.totalPages - 2 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(companies.pagination.totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {companies.pagination.totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(
                        Math.min(companies.pagination.totalPages, companies.pagination.page + 1)
                      )
                    }
                    disabled={companies.pagination.page === companies.pagination.totalPages}
                  >
                    {t('next')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role-based content for administrators */}
        <RoleContent role="ADMIN">
          <Card>
            <CardHeader>
              <CardTitle>{t('companyAdministration')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <PermissionContent action="manage" subject="Company">
                  <Button variant="outline">
                    <Building2 className="h-4 w-4 mr-2" />
                    {t('companySettings')}
                  </Button>
                </PermissionContent>
                <PermissionContent action="manage" subject="Company">
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    {t('systemConfiguration')}
                  </Button>
                </PermissionContent>
              </div>
            </CardContent>
          </Card>
        </RoleContent>
      </div>
    </ProtectedRoute>
  );
}
