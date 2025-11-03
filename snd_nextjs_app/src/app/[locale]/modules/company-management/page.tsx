'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import { PermissionContent, RoleContent } from '@/lib/rbac/rbac-components';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Eye, 
  Plus, 
  Trash2, 
  Search,
  Filter,
  Download,
  Upload,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Globe,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';

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
  const { t } = useI18n();
  const [companies, setCompanies] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [perPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (filterStatus !== 'all') params.append('status', filterStatus);
        if (filterIndustry !== 'all') params.append('industry', filterIndustry);
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        params.append('page', currentPage.toString());
        params.append('limit', perPage.toString());

        const response = await fetch(`/api/companies?${params.toString()}`);
        const result: CompanyResponse = await response.json();

        if (result.success) {
          setCompanies(result);
        } else {
          toast.error(result.message || t('company.messages.loadingError'));
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast.error(t('company.messages.loadingError'));
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [search, filterStatus, filterIndustry, sortBy, sortOrder, perPage, currentPage]);

  const handleDelete = async (id: number) => {
    if (confirm(t('company.messages.deleteConfirm'))) {
      try {
        const response = await fetch(`/api/companies/${id}`, {
          method: 'DELETE',
        });
        const result = await response.json();

        if (result.success) {
          toast.success(t('company.messages.deleteSuccess'));
          // Refresh data
          setCurrentPage(1);
        } else {
          toast.error(result.message || t('company.messages.deleteError'));
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        toast.error(t('company.messages.deleteError'));
      }
    }
  };

  const getComplianceStatus = (company: Company) => {
    const requiredDocs = [
      { field: company.commercial_registration, expiry: company.commercial_registration_expiry, name: 'CR' },
      { field: company.tax_registration, expiry: company.tax_registration_expiry, name: 'TR' }
    ];

    const missing = requiredDocs.filter(doc => !doc.field).length;
    const expired = requiredDocs.filter(doc => doc.field && doc.expiry && new Date(doc.expiry) < new Date()).length;
    const expiringSoon = requiredDocs.filter(doc => 
      doc.field && doc.expiry && 
      new Date(doc.expiry) > new Date() && 
      new Date(doc.expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;

    if (missing > 0) return { status: 'non-compliant', label: 'Non-Compliant', color: 'destructive', count: missing };
    if (expired > 0) return { status: 'expired', label: 'Expired', color: 'destructive', count: expired };
    if (expiringSoon > 0) return { status: 'expiring', label: 'Expiring Soon', color: 'secondary', count: expiringSoon };
    return { status: 'compliant', label: 'Compliant', color: 'default', count: 0 };
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expiring':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'expired':
      case 'non-compliant':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getIndustryColor = (industry: string | null) => {
    if (!industry) return 'bg-gray-100 text-gray-800';
    
    const colors = {
      'Construction': 'bg-blue-100 text-blue-800',
      'Manufacturing': 'bg-green-100 text-green-800',
      'Technology': 'bg-purple-100 text-purple-800',
      'Healthcare': 'bg-red-100 text-red-800',
      'Finance': 'bg-yellow-100 text-yellow-800',
      'Retail': 'bg-pink-100 text-pink-800',
      'Transportation': 'bg-indigo-100 text-indigo-800',
      'Energy': 'bg-orange-100 text-orange-800'
    };
    
    return colors[industry as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('company.messages.loading')}</div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'Company' }}>
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{t('company.title')}</h1>
              <p className="text-muted-foreground">{t('company.description')}</p>
            </div>
          </div>
          <PermissionContent action="create" subject="Company">
            <Link href="/modules/company-management/create">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                {t('company.actions.addCompany')}
              </Button>
            </Link>
          </PermissionContent>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.stats.totalCompanies')}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies?.pagination.total || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.stats.compliant')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {companies?.data.filter(c => getComplianceStatus(c).status === 'compliant').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.stats.nonCompliant')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {companies?.data.filter(c => getComplianceStatus(c).status !== 'compliant').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('company.stats.totalEmployees')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companies?.data.reduce((sum, c) => sum + (c.employee_count || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t('company.search.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">{t('company.search.label')}</Label>
                <Input
                  id="search"
                  placeholder={t('company.search.placeholder')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">{t('company.filters.complianceStatus')}</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('company.filters.allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('company.filters.allStatuses')}</SelectItem>
                    <SelectItem value="compliant">{t('company.status.compliant')}</SelectItem>
                    <SelectItem value="non-compliant">{t('company.status.nonCompliant')}</SelectItem>
                    <SelectItem value="expired">{t('company.status.expired')}</SelectItem>
                    <SelectItem value="expiring">{t('company.status.expiringSoon')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">{t('company.fields.industry')}</Label>
                <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('company.filters.allIndustries')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('company.filters.allIndustries')}</SelectItem>
                    <SelectItem value="Construction">Construction</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Energy">Energy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sort">{t('company.filters.sortBy')}</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('company.filters.sortPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">{t('company.fields.name')}</SelectItem>
                    <SelectItem value="created_at">{t('company.fields.createdAt')}</SelectItem>
                    <SelectItem value="employee_count">{t('company.fields.employeeCount')}</SelectItem>
                    <SelectItem value="industry">{t('company.fields.industry')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('company.table.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">{t('company.table.headers.company')}</TableHead>
                    <TableHead className="min-w-[120px]">{t('company.table.headers.contact')}</TableHead>
                    <TableHead className="min-w-[100px]">{t('company.table.headers.industry')}</TableHead>
                    <TableHead className="min-w-[100px]">{t('company.table.headers.employees')}</TableHead>
                    <TableHead className="min-w-[120px]">{t('company.table.headers.compliance')}</TableHead>
                    <TableHead className="min-w-[100px]">{t('company.table.headers.created')}</TableHead>
                    <TableHead className="text-right min-w-[120px]">{t('company.table.headers.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies?.data.map(company => {
                    const compliance = getComplianceStatus(company);
                    return (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {company.logo ? (
                              <img 
                                src={company.logo} 
                                alt={company.name} 
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold">{company.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {company.company_type || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {company.contact_person && (
                              <div className="text-sm font-medium">{company.contact_person}</div>
                            )}
                            {company.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {company.email}
                              </div>
                            )}
                            {company.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {company.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {company.industry && (
                            <Badge className={getIndustryColor(company.industry)}>
                              {company.industry}
                            </Badge>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{company.employee_count || 0}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getComplianceIcon(compliance.status)}
                            <Badge variant={compliance.color as any}>
                              {compliance.label}
                            </Badge>
                          </div>
                          {compliance.count > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {compliance.count} issue{compliance.count > 1 ? 's' : ''}
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {company.created_at ? (
                            <div className="text-sm text-muted-foreground">
                              {new Date(company.created_at).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">-</div>
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {companies && companies.pagination.total > 0 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  {t('company.pagination.showing', {
                    start: String(((companies.pagination.page - 1) * companies.pagination.limit) + 1),
                    end: String(Math.min(companies.pagination.page * companies.pagination.limit, companies.pagination.total)),
                    total: String(companies.pagination.total)
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
                    {t('company.pagination.previous')}
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: companies.pagination.totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={companies.pagination.page === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(companies.pagination.totalPages, companies.pagination.page + 1))}
                    disabled={companies.pagination.page === companies.pagination.totalPages}
                  >
                    {t('company.pagination.next')}
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
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t('company.admin.actions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                
                <PermissionContent action="manage" subject="Company">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {t('company.admin.exportCompanies')}
                  </Button>
                </PermissionContent>
                
                <PermissionContent action="manage" subject="Company">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    {t('company.admin.importCompanies')}
                  </Button>
                </PermissionContent>
                
                <PermissionContent action="manage" subject="Company">
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    {t('company.admin.complianceReport')}
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
