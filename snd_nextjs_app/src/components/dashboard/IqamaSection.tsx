'use client';

import { PermissionBased } from '@/components/PermissionBased';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
}

interface IqamaSectionProps {
  iqamaData: IqamaData[];
  onUpdateIqama: (iqama: IqamaData) => void;
  onHideSection: () => void;
}

export function IqamaSection({ iqamaData, onUpdateIqama, onHideSection }: IqamaSectionProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Ensure iqamaData is always an array
  const safeIqamaData = iqamaData || [];

  // Get expired Iqama data for PDF generation
  const expiredIqamaData = safeIqamaData.filter(item => item.status === 'expired');

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

  // Filter and search logic
  const filteredData = safeIqamaData.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch =
      !search ||
      item.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      item.fileNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.nationality?.toLowerCase().includes(search.toLowerCase()) ||
      item.position?.toLowerCase().includes(search.toLowerCase());

    return item.status !== 'active' && matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('dashboard.iqama.management')}
            </CardTitle>
            <CardDescription>{t('dashboard.iqama.description')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <PermissionBased action="manage" subject="Employee">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExpiredPDF}
                disabled={expiredIqamaData.length === 0}
                className="flex items-center gap-2"
                title={expiredIqamaData.length === 0 ? t('dashboard.iqama.noExpiredRecords') : t('dashboard.iqama.downloadPdfTitle', { count: expiredIqamaData.length })}
              >
                <Download className="h-4 w-4" />
                {t('dashboard.iqama.downloadPdf', { count: expiredIqamaData.length })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/modules/employee-management')}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                {t('dashboard.iqama.manage')}
              </Button>
            </PermissionBased>
            <Button
              variant="outline"
              size="sm"
              onClick={onHideSection}
              className="flex items-center gap-2"
            >
              {t('dashboard.hideSection')}
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

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-red-600">
              {iqamaData.filter(item => item.status === 'expired').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('dashboard.iqama.expired')}</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-yellow-600">
              {iqamaData.filter(item => item.status === 'expiring').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('dashboard.iqama.expiringSoon')}</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-blue-600">
              {iqamaData.filter(item => item.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('dashboard.iqama.active')}</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-gray-600">
              {iqamaData.filter(item => item.status === 'missing').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('dashboard.iqama.missing')}</div>
          </div>
        </div>

        {/* Iqama Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
                          <TableRow>
              <TableHead>{t('dashboard.iqama.tableHeaders.name')}</TableHead>
              <TableHead>{t('dashboard.iqama.tableHeaders.fileNumber')}</TableHead>
              <TableHead>{t('dashboard.iqama.tableHeaders.iqamaNumber')}</TableHead>
              <TableHead>{t('dashboard.iqama.tableHeaders.status')}</TableHead>
              <TableHead>{t('dashboard.iqama.tableHeaders.expiryDate')}</TableHead>
              <TableHead>{t('dashboard.iqama.tableHeaders.days')}</TableHead>
              <TableHead>{t('dashboard.iqama.tableHeaders.actions')}</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map(item => (
                <TableRow key={item.id}>
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
                  <TableCell className="text-sm">{item.fileNumber}</TableCell>
                  <TableCell className="text-sm font-mono">{item.iqamaNumber || item.id}</TableCell>
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
                          ? t('dashboard.iqama.daysOverdue', { days: Math.abs(item.daysRemaining) })
                          : t('dashboard.iqama.daysRemaining', { days: item.daysRemaining })}
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
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
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
              {t('dashboard.iqama.pagination.page', { current: currentPage, total: totalPages })}
            </div>
          </div>
        )}

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t('dashboard.iqama.noRecordsFound')}</p>
            <p className="text-sm opacity-80">
              {search || statusFilter !== 'all'
                ? t('dashboard.iqama.tryAdjustingSearch')
                : t('dashboard.iqama.allRecordsActive')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
