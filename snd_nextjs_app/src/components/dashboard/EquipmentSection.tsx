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

import { Download, Edit, Plus, Search, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface EquipmentData {
  id: number;
  equipmentName: string;
  equipmentNumber?: string;
  doorNumber?: string;
  manufacturer?: string;
  modelNumber?: string;
  categoryId?: number;
  status: 'available' | 'expired' | 'expiring' | 'missing';
  istimaraExpiry?: string;
  daysRemaining: number | null;
  istimara?: string;
  assignedTo?: number;
  driverName?: string;
  driverFileNumber?: string;
}

interface EquipmentSectionProps {
  equipmentData: EquipmentData[];
  onUpdateEquipment: (equipment: EquipmentData) => void;
  onHideSection: () => void;
}

export function EquipmentSection({
  equipmentData,
  onUpdateEquipment,
  onHideSection,
}: EquipmentSectionProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Debug logging
  console.log('EquipmentSection - Received equipmentData:', equipmentData);
  console.log('EquipmentSection - equipmentData length:', equipmentData?.length);

  // Ensure equipmentData is always an array with robust type checking
  const safeEquipmentData = Array.isArray(equipmentData) ? equipmentData : [];

  // Get expired equipment data for PDF generation
  const expiredEquipmentData = safeEquipmentData.filter(item => item.status === 'expired');

  // Handle PDF download for expired equipment
  const handleDownloadExpiredPDF = async () => {
    if (expiredEquipmentData.length === 0) {
      alert(t('equipment.istimara.noExpiredRecords'));
      return;
    }
    try {
      await PDFGenerator.generateExpiredEquipmentReport(expiredEquipmentData);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert(t('equipment.istimara.pdfGenerationFailed'));
    }
  };

  // Filter and search logic
  const filteredData = safeEquipmentData.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesDriver = driverFilter === 'all' || 
      (driverFilter === 'assigned' && item.driverName) ||
      (driverFilter === 'unassigned' && !item.driverName);
    const matchesType = typeFilter === 'all' || 
      (item.categoryName || item.category?.name || '').toUpperCase() === typeFilter;
    const matchesSearch =
      !search ||
      item.equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
      item.equipmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
      item.modelNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.istimara?.toLowerCase().includes(search.toLowerCase()) ||
      item.driverName?.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesDriver && matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  console.log('EquipmentSection - safeEquipmentData length:', safeEquipmentData.length);
  console.log('EquipmentSection - filteredData length:', filteredData.length);
  console.log('EquipmentSection - paginatedData length:', paginatedData.length);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {t('equipment.istimara.title')}
              {safeEquipmentData.filter(item => item.status === 'expired').length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {safeEquipmentData.filter(item => item.status === 'expired').length}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {t('equipment.istimara.description')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <PermissionBased action="manage" subject="Equipment">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExpiredPDF}
                disabled={expiredEquipmentData.length === 0}
                className="flex items-center gap-2"
                title={expiredEquipmentData.length === 0 ? t('equipment.istimara.noExpiredRecordsToDownload') : t('equipment.istimara.downloadPdfReport', { count: expiredEquipmentData.length })}
              >
                <Download className="h-4 w-4" />
                {t('equipment.istimara.downloadPdf')} ({expiredEquipmentData.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/modules/equipment-management')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('equipment.actions.manageEquipment')}
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
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg border">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('equipment.istimara.searchPlaceholderDashboard')}
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
              <option value="all">{t('equipment.istimara.allStatuses')}</option>
              <option value="available">{t('equipment.istimara.status.available')}</option>
              <option value="expiring">{t('equipment.istimara.status.expiring')}</option>
              <option value="expired">{t('equipment.istimara.status.expired')}</option>
              <option value="missing">{t('equipment.istimara.status.missing')}</option>
            </select>
            <select
              value={driverFilter}
              onChange={e => setDriverFilter(e.target.value)}
              className="h-10 px-3 text-sm border border-input rounded-md bg-background"
            >
              <option value="all">{t('equipment.istimara.allDrivers')}</option>
              <option value="assigned">{t('equipment.istimara.assigned')}</option>
              <option value="unassigned">{t('equipment.istimara.unassigned')}</option>
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="h-10 px-3 text-sm border border-input rounded-md bg-background"
            >
              <option value="all">{t('equipment.istimara.allTypes')}</option>
              <option value="DOZER">Dozer</option>
              <option value="LOADER">Loader</option>
              <option value="TRUCK">Truck</option>
              <option value="EXCAVATOR">Excavator</option>
              <option value="CRANE">Crane</option>
              <option value="GENERATOR">Generator</option>
            </select>
            {(search || statusFilter !== 'all' || driverFilter !== 'all' || typeFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setDriverFilter('all');
                  setTypeFilter('all');
                }}
                className="h-10"
              >
                {t('equipment.istimara.clear')}
              </Button>
            )}
          </div>
        </div>

        {/* Equipment Table or Empty State */}
        {filteredData.length > 0 ? (
          <>
            <div className="rounded-lg border">
              <div className="p-4 border-b bg-muted/50">
                <h4 className="font-medium text-sm">
                  {t('equipment.istimara.allEquipment') || 'All Equipment'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {t('equipment.istimara.allEquipmentDescription') || 'Complete list of all equipment with istimara status'}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('equipment.istimara.tableHeaders.equipmentName')}</TableHead>
                    <TableHead>{t('equipment.istimara.tableHeaders.doorNumber') || 'Door #'}</TableHead>
                    <TableHead>{t('equipment.istimara.tableHeaders.istimaraNumber')}</TableHead>
                    <TableHead>{t('equipment.istimara.tableHeaders.driverOperator')}</TableHead>
                    <TableHead>{t('equipment.istimara.tableHeaders.status')}</TableHead>
                    <TableHead>{t('equipment.istimara.tableHeaders.expiryDate')}</TableHead>
                    <TableHead>{t('equipment.istimara.tableHeaders.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {(() => {
                              const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#14B8A6', '#F43F5E', '#6366F1'];
                              const colorIndex = (item.categoryId || 0) % colors.length;
                              return <span style={{ color: colors[colorIndex] }}>●</span>;
                            })()}
                          </span>
                          <div>
                            <div>{item.equipmentName}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.manufacturer && ` • ${item.manufacturer}`}
                              {item.modelNumber && ` • ${item.modelNumber}`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.equipmentNumber ? (
                          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {item.equipmentNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.istimara ? (
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {item.istimara}
                          </span>
                        ) : (
                          <span className="text-red-600 text-xs">{t('equipment.istimara.noIstimara')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.driverName ? (
                          <div>
                            <div className="font-medium">{item.driverName}</div>
                            <div className="text-xs text-muted-foreground">
                              {t('equipment.istimara.file')}: {item.driverFileNumber || 'N/A'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">{t('equipment.istimara.unassigned')}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'expired'
                              ? 'destructive'
                              : item.status === 'expiring'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={`capitalize ${
                            item.status === 'expired'
                              ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                              : item.status === 'expiring'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
                                : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800'
                          }`}
                        >
                          {item.status === 'expired'
                            ? t('equipment.istimara.expired')
                            : item.status === 'expiring'
                              ? t('equipment.istimara.expiringSoon')
                              : t('equipment.istimara.missing')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.istimaraExpiry ? (
                          <div>
                            <div>{new Date(item.istimaraExpiry).toLocaleDateString()}</div>
                            {item.daysRemaining !== null && (
                              <div
                                className={`text-xs ${
                                  item.daysRemaining < 0
                                    ? 'text-red-600'
                                    : item.daysRemaining <= 30
                                      ? 'text-yellow-600'
                                      : 'text-muted-foreground'
                                }`}
                              >
                                {item.daysRemaining < 0
                                  ? t('equipment.istimara.daysOverdue', { days: Math.abs(item.daysRemaining) })
                                  : t('equipment.istimara.daysRemaining', { days: item.daysRemaining })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-600 font-medium">
                            {t('equipment.istimara.noExpiryDate')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateEquipment(item)}
                          className="h-8 w-8 p-0"
                          title={
                            item.status === 'missing'
                              ? t('equipment.istimara.addIstimaraExpiryDate')
                              : t('equipment.istimara.updateIstimaraExpiryDate')
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t('equipment.pagination.show')}
                </span>
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
                  {t('equipment.pagination.perPageText')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t('equipment.pagination.previous')}
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
                  {t('equipment.pagination.next')}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {t('equipment.pagination.page', { current: currentPage, total: totalPages })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t('equipment.istimara.noRecordsFound')}</p>
            <p className="text-sm opacity-80">
              {search || statusFilter !== 'all'
                ? t('equipment.istimara.tryAdjustingSearchOrFilters')
                : t('equipment.istimara.allRecordsValid')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
