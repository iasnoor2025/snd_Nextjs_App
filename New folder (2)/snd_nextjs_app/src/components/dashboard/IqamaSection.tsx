'use client';

import { PermissionBased } from '@/components/PermissionBased';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useI18n } from '@/hooks/use-i18n';
import { PDFGenerator } from '@/lib/utils/pdf-generator';
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Download,
  Edit,
  Globe,
  Search,
  FileText,
  Car,
  Award,
} from 'lucide-react';
import { useRouter , useParams } from 'next/navigation';
import { useState } from 'react';

interface IqamaData {
  id: number;
  employeeName: string;
  fileNumber: string;
  iqamaNumber: string | null;
  nationality: string;
  position: string;
  companyName: string;
  location: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'expiring' | 'missing';
  daysRemaining: number | null;
  // Additional document fields
  iqamaExpiry?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  drivingLicenseNumber?: string | null;
  drivingLicenseExpiry?: string | null;
  spspLicenseNumber?: string | null;
  spspLicenseExpiry?: string | null;
  operatorLicenseNumber?: string | null;
  operatorLicenseExpiry?: string | null;
  tuvCertificationNumber?: string | null;
  tuvCertificationExpiry?: string | null;
  // Dynamic fields added during processing
  documentNumber?: string | null;
  documentExpiry?: string | null;
}

interface IqamaSectionProps {
  iqamaData: IqamaData[];
  onUpdateIqama: (iqama: IqamaData) => void;
  onHideSection: () => void;
  selectedDocumentType?: 'iqama' | 'passport' | 'drivingLicense' | 'spsp' | 'operatorLicense' | 'tuvCertification';
  onDocumentTypeChange?: (type: 'iqama' | 'passport' | 'drivingLicense' | 'spsp' | 'operatorLicense' | 'tuvCertification') => void;
}

export function IqamaSection({ 
  iqamaData, 
  onUpdateIqama, 
  onHideSection, 
  selectedDocumentType = 'iqama',
  onDocumentTypeChange
}: IqamaSectionProps) {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  // Use selectedDocumentType from props

  // Document type configuration
  const documentTypes = {
    iqama: {
      label: 'Iqama Management',
      subtitle: 'Monitor and manage employee Iqama status and expiry dates',
      icon: FileText,
      numberField: 'iqamaNumber',
      expiryField: 'iqamaExpiry',
      numberLabel: 'Iqama #',
      buttonText: 'Manage Iqama',
      managementRoute: `/${locale}/employee-management`
    },
    passport: {
      label: 'Passport Management',
      subtitle: 'Monitor and manage employee Passport status and expiry dates',
      icon: Globe,
      numberField: 'passportNumber',
      expiryField: 'passportExpiry',
      numberLabel: 'Passport #',
      buttonText: 'Manage Passport',
      managementRoute: `/${locale}/employee-management`
    },
    drivingLicense: {
      label: 'Driving License Management',
      subtitle: 'Monitor and manage employee Driving License status and expiry dates',
      icon: Car,
      numberField: 'drivingLicenseNumber',
      expiryField: 'drivingLicenseExpiry',
      numberLabel: 'License #',
      buttonText: 'Manage License',
      managementRoute: `/${locale}/employee-management`
    },
    spsp: {
      label: 'SPSP Management',
      subtitle: 'Monitor and manage employee SPSP License status and expiry dates',
      icon: Award,
      numberField: 'spspLicenseNumber',
      expiryField: 'spspLicenseExpiry',
      numberLabel: 'SPSP #',
      buttonText: 'Manage SPSP',
      managementRoute: `/${locale}/employee-management`
    },
    operatorLicense: {
      label: 'Operator License Management',
      subtitle: 'Monitor and manage employee Operator License status and expiry dates',
      icon: Award,
      numberField: 'operatorLicenseNumber',
      expiryField: 'operatorLicenseExpiry',
      numberLabel: 'Operator #',
      buttonText: 'Manage Operator License',
      managementRoute: `/${locale}/employee-management`
    },
    tuvCertification: {
      label: 'TUV Certification Management',
      subtitle: 'Monitor and manage employee TUV Certification status and expiry dates',
      icon: Award,
      numberField: 'tuvCertificationNumber',
      expiryField: 'tuvCertificationExpiry',
      numberLabel: 'TUV #',
      buttonText: 'Manage TUV Certification',
      managementRoute: `/${locale}/employee-management`
    }
  };

  // Ensure iqamaData is always an array
  const safeIqamaData = iqamaData || [];
  
  // Validate selectedDocumentType
  const validDocumentTypes = ['iqama', 'passport', 'drivingLicense', 'spsp', 'operatorLicense', 'tuvCertification'];
  const safeSelectedDocumentType = validDocumentTypes.includes(selectedDocumentType) ? selectedDocumentType : 'iqama';

  // Handle PDF download for expired Iqama
  const handleDownloadExpiredPDF = async () => {
    if (expiredIqamaData.length === 0) {
      alert(t('dashboard.iqama.noExpiredRecords'));
      return;
    }
    try {
      await PDFGenerator.generateExpiredIqamaReport(expiredIqamaData);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert(t('dashboard.iqama.pdfGenerationFailed'));
    }
  };

  // Filter and search logic based on selected document type
  const getCurrentDocumentData = () => {
    const docType = documentTypes[safeSelectedDocumentType];
    if (!docType) return safeIqamaData;
    
    const numberField = docType.numberField;
    const expiryField = docType.expiryField;
    
    
    return safeIqamaData.map(item => {
      // Get document-specific data
      const documentNumber = item[numberField as keyof IqamaData] as string | null;
      const documentExpiry = item[expiryField as keyof IqamaData] as string | null;
      
      // Calculate status based on expiry
      const today = new Date();
      let status: 'active' | 'expired' | 'expiring' | 'missing' = 'active';
      let daysRemaining: number | null = null;

      if (!documentExpiry) {
        status = 'missing';
      } else {
        const expiryDate = new Date(documentExpiry);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          status = 'expired';
          daysRemaining = diffDays;
        } else if (diffDays <= 30) {
          status = 'expiring';
          daysRemaining = diffDays;
        } else {
          daysRemaining = diffDays;
        }
      }

      return {
        ...item,
        documentNumber,
        documentExpiry,
        status,
        daysRemaining,
        // Override the original fields for display
        iqamaNumber: documentNumber,
        expiryDate: documentExpiry || '',
        // Ensure position field is preserved correctly
        position: item.position || 'Position Not Set',
      };
    });
  };


  const currentDocumentData = getCurrentDocumentData();
  
  const filteredData = currentDocumentData.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch =
      !search ||
      item.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      item.fileNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.nationality?.toLowerCase().includes(search.toLowerCase()) ||
      item.position?.toLowerCase().includes(search.toLowerCase()) ||
      item.documentNumber?.toLowerCase().includes(search.toLowerCase());

    // Smart filtering based on document type
    if (search) {
      // When searching, show all matches regardless of document status
      return matchesSearch;
    }
    
    if (statusFilter === 'missing') {
      // Show only employees without this document type
      // Employee has document if they have either document number OR expiry date
      const hasDocumentNumber = item.documentNumber && item.documentNumber !== 'N/A' && item.documentNumber.trim() !== '';
      const hasExpiryDate = item.expiryDate && item.expiryDate.trim() !== '';
      return !hasDocumentNumber && !hasExpiryDate && item.status === 'missing';
    }
    
    if (statusFilter === 'all') {
      // Show only employees who have this document type (excluding missing status)
      // Employee has document if they have either document number OR expiry date
      const hasDocumentNumber = item.documentNumber && item.documentNumber !== 'N/A' && item.documentNumber.trim() !== '';
      const hasExpiryDate = item.expiryDate && item.expiryDate.trim() !== '';
      return (hasDocumentNumber || hasExpiryDate);
    }
    
    // For specific status filters (expired, expiring, active)
    return matchesStatus && matchesSearch;
  });

  // Sort by file number (numeric sorting)
  const sortedData = filteredData.sort((a, b) => {
    const fileNumA = parseInt(a.fileNumber) || 0;
    const fileNumB = parseInt(b.fileNumber) || 0;
    return fileNumA - fileNumB;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  // Get expired data for PDF generation based on current document type
  const expiredIqamaData = sortedData.filter(item => item.status === 'expired');

  const currentDocType = documentTypes[safeSelectedDocumentType];
  const IconComponent = currentDocType?.icon || FileText;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              {currentDocType?.label || 'Document Management'}
            </CardTitle>
            <CardDescription>{currentDocType?.subtitle || 'Monitor and manage employee document status and expiry dates'}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Document Type:</label>
              <Select value={safeSelectedDocumentType} onValueChange={(value: any) => onDocumentTypeChange?.(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iqama">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Iqama
                    </div>
                  </SelectItem>
                  <SelectItem value="passport">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Passport
                    </div>
                  </SelectItem>
                  <SelectItem value="drivingLicense">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Driving License
                    </div>
                  </SelectItem>
                  <SelectItem value="spsp">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      SPSP License
                    </div>
                  </SelectItem>
                  <SelectItem value="operatorLicense">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Operator License
                    </div>
                  </SelectItem>
                  <SelectItem value="tuvCertification">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      TUV Certification
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <PermissionBased action="manage" subject="Iqama">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExpiredPDF}
                disabled={expiredIqamaData.length === 0}
                className="flex items-center gap-2"
                title={expiredIqamaData.length === 0 ? t('dashboard.iqama.noExpiredRecords') : t('dashboard.iqama.downloadPdfTitle', { count: expiredIqamaData.length.toString() })}
              >
                <Download className="h-4 w-4" />
                Download PDF ({expiredIqamaData.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(currentDocType?.managementRoute || `/${locale}/employee-management`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                {currentDocType?.buttonText || 'Manage Documents'}
              </Button>
            </PermissionBased>
            <Button
              variant="outline"
              size="sm"
              onClick={onHideSection}
              className="flex items-center gap-2"
            >
              Hide Section
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('dashboard.iqama.searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-sm border border-input rounded-md bg-background"
            >
              <option value="all">{t('dashboard.iqama.allStatuses')}</option>
              <option value="expired">{t('dashboard.iqama.expired')}</option>
              <option value="expiring">{t('dashboard.iqama.expiringSoon')}</option>
              <option value="missing">{t('dashboard.iqama.missing')}</option>
            </select>
            {(search || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="h-10"
              >
                {t('dashboard.iqama.clear')}
              </Button>
            )}
          </div>
        </div>

        {/* Document Type Information */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>💡 Smart Filtering:</strong> 
            {safeSelectedDocumentType === 'iqama' ? (
              <>Showing all employees with their Iqama status.</>
            ) : safeSelectedDocumentType === 'drivingLicense' ? (
              <>Showing only employees who have Driving License documents (Active/Expired/Expiring). Select "Missing" status to see employees without licenses.</>
            ) : safeSelectedDocumentType === 'spsp' ? (
              <>Showing only employees who have SPSP License documents. To see all employees, search for a specific name.</>
            ) : safeSelectedDocumentType === 'passport' ? (
              <>Showing only employees who have Passport documents. To see all employees, search for a specific name.</>
            ) : (
              <>Showing only employees who have {currentDocType?.label.toLowerCase().replace(' management', '')} documents. To see all employees, search for a specific name.</>
            )}
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-red-600">
              {sortedData.filter(item => item.status === 'expired').length}
            </div>
            <div className="text-sm text-muted-foreground">Expired</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-yellow-600">
              {sortedData.filter(item => item.status === 'expiring').length}
            </div>
            <div className="text-sm text-muted-foreground">Expiring Soon</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-blue-600">
              {sortedData.filter(item => item.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-gray-600">
              {sortedData.filter(item => item.status === 'missing').length}
            </div>
            <div className="text-sm text-muted-foreground">Missing</div>
          </div>
        </div>

        {/* Document Management Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Number</TableHead>
                <TableHead>Employee Name</TableHead>
                <TableHead>{currentDocType?.numberLabel || 'Document #'}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm font-medium">{item.fileNumber}</TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div>{item.employeeName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        {item.nationality}
                        <Briefcase className="h-3 w-3" />
                        {item.position}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{item.documentNumber || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === 'expired'
                          ? 'destructive'
                          : item.status === 'expiring'
                            ? 'secondary'
                            : item.status === 'missing'
                              ? 'outline'
                              : 'default'
                      }
                    >
                      {item.status === 'expired'
                        ? t('dashboard.iqama.expired')
                        : item.status === 'expiring'
                          ? t('dashboard.iqama.expiringSoon')
                          : item.status === 'missing'
                            ? t('dashboard.iqama.missing')
                            : t('dashboard.iqama.active')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.expiryDate ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-red-600 font-medium">
                        {t('dashboard.iqama.noExpiryDate')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.daysRemaining !== null ? (
                      <div
                        className={`flex items-center gap-1 ${
                          item.daysRemaining < 0
                            ? 'text-red-600'
                            : item.daysRemaining <= 30
                              ? 'text-yellow-600'
                              : 'text-muted-foreground'
                        }`}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {item.daysRemaining < 0
                          ? t('dashboard.iqama.daysOverdue', { days: Math.abs(item.daysRemaining!).toString() })
                          : t('dashboard.iqama.daysRemaining', { days: item.daysRemaining!.toString() })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        {t('dashboard.iqama.notApplicable')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <PermissionBased action="update" subject="Employee">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateIqama(item)}
                        className="h-8 w-8 p-0"
                        title={t('dashboard.iqama.updateExpiryDate')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </PermissionBased>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('dashboard.iqama.pagination.show')}</span>
                              <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 px-2 text-sm border border-input rounded-md bg-background"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              <span className="text-sm text-muted-foreground">
                {t('dashboard.iqama.pagination.perPage')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {t('dashboard.iqama.pagination.previous')}
              </Button>

              <div className="flex items-center gap-1">
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 7;
                  
                  if (totalPages <= maxVisiblePages) {
                    // Show all pages if total is small
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={currentPage === i ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(i)}
                          className="h-8 w-8 p-0"
                        >
                          {i}
                        </Button>
                      );
                    }
                  } else {
                    // Show smart pagination for large numbers
                    const startPage = Math.max(1, currentPage - 2);
                    const endPage = Math.min(totalPages, currentPage + 2);
                    
                    // Always show first page
                    if (startPage > 1) {
                      pages.push(
                        <Button
                          key={1}
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          className="h-8 w-8 p-0"
                        >
                          1
                        </Button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="dots1" className="px-2 text-muted-foreground">...</span>
                        );
                      }
                    }
                    
                    // Show pages around current page
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={currentPage === i ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(i)}
                          className="h-8 w-8 p-0"
                        >
                          {i}
                        </Button>
                      );
                    }
                    
                    // Always show last page
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="dots2" className="px-2 text-muted-foreground">...</span>
                        );
                      }
                      pages.push(
                        <Button
                          key={totalPages}
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="h-8 w-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      );
                    }
                  }
                  
                  return pages;
                })()}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                {t('dashboard.iqama.pagination.next')}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {t('dashboard.iqama.pagination.page', { current: currentPage.toString(), total: totalPages.toString() })}
            </div>
          </div>
        )}

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">
              {safeSelectedDocumentType === 'iqama' 
                ? t('dashboard.iqama.noRecordsFound')
                : `No ${safeSelectedDocumentType === 'spsp' ? 'SPSP' : safeSelectedDocumentType === 'drivingLicense' ? 'Driving License' : safeSelectedDocumentType === 'passport' ? 'Passport' : currentDocType?.label.toLowerCase().replace(' management', '')} records found`
              }
            </p>
            <p className="text-sm opacity-80">
              {search || statusFilter !== 'all'
                ? (safeSelectedDocumentType === 'iqama' 
                    ? t('dashboard.iqama.tryAdjustingSearch')
                    : 'Try adjusting your search criteria or filters.'
                  )
                : safeSelectedDocumentType === 'iqama'
                  ? t('dashboard.iqama.allRecordsActive')
                  : safeSelectedDocumentType === 'spsp' 
                    ? 'No employees currently have SPSP licenses in the system.'
                    : safeSelectedDocumentType === 'drivingLicense'
                      ? 'No employees currently have Driving Licenses in the system.'
                      : safeSelectedDocumentType === 'passport'
                        ? 'No employees currently have Passports in the system.'
                        : 'No employees currently have ' + currentDocType?.label.toLowerCase().replace(' management', '') + 's in the system.'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
