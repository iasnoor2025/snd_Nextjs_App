'use client';

import { RoleBased } from '@/components/RoleBased';
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
import { useEffect, useState } from 'react';

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
  isRefreshing?: boolean;
}

export function EquipmentSection({
  equipmentData: initialEquipmentData,
  onUpdateEquipment,
  onHideSection,
  isRefreshing = false,
}: EquipmentSectionProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [previousIssueCount, setPreviousIssueCount] = useState(0);
  const [equipmentData, setEquipmentData] = useState(initialEquipmentData || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the data passed from parent component
  useEffect(() => {
    if (initialEquipmentData) {
      setEquipmentData(initialEquipmentData);
      setLoading(false);
      setLastUpdated(new Date());
    } else {
      // Only fetch if no data is passed from parent
      fetchEquipmentData();
    }
  }, [initialEquipmentData]);

  // Fetch equipment data from API (fallback)
  const fetchEquipmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/equipment/dashboard');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.equipment) {
        setEquipmentData(data.equipment);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch equipment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch equipment data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data function
  const handleRefresh = async () => {
    await fetchEquipmentData();
  };

  // Update timestamp when data changes
  useEffect(() => {
    if (equipmentData && equipmentData.length > 0) {
      const currentIssueCount = equipmentData.filter(item => item.status !== 'available').length;
      
      // Check if there are new issues
      if (previousIssueCount > 0 && currentIssueCount > previousIssueCount) {
        // Could add a toast notification here
        console.log(`New equipment issues detected: ${currentIssueCount - previousIssueCount} new items need attention`);
      }
      
      setPreviousIssueCount(currentIssueCount);
      setLastUpdated(new Date());
    }
  }, [equipmentData, previousIssueCount]);

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
    const matchesSearch =
      !search ||
      item.equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
      item.equipmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
      item.modelNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.istimara?.toLowerCase().includes(search.toLowerCase()) ||
      item.driverName?.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesDriver && matchesSearch;
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
                             <span className="block text-xs text-muted-foreground mt-1">
                 {t('equipment.istimara.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
                 {isRefreshing && (
                   <span className="ml-2 text-blue-500">
                     • {t('equipment.istimara.refreshing')}
                   </span>
                 )}
               </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
                         {isRefreshing && (
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
               {t('equipment.istimara.refreshing')}
               </div>
             )}
            <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
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
            </RoleBased>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? t('equipment.istimara.refreshing') : t('dashboard.refresh')}
            </Button>
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
        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('equipment.istimara.refreshing')}</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <p className="font-medium">Error loading equipment data</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Equipment Summary */}
        {!loading && !error && (
          <>
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-muted-foreground">
                    {t('equipment.istimara.totalEquipment')}: {safeEquipmentData.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('equipment.istimara.itemsRequiringAttention')}: {safeEquipmentData.filter(item => item.status !== 'available').length}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-muted-foreground">
                    {t('equipment.istimara.withDriver')}: {safeEquipmentData.filter(item => item.driverName).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('equipment.istimara.unassigned')}: {safeEquipmentData.filter(item => !item.driverName).length}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg border bg-card">
                <div className="text-2xl font-bold text-red-600">
                  {safeEquipmentData.filter(item => item.status === 'expired').length}
                </div>
                <div className="text-sm text-muted-foreground">{t('equipment.istimara.expired')}</div>
              </div>
              <div className="text-center p-3 rounded-lg border bg-card">
                <div className="text-2xl font-bold text-yellow-600">
                  {safeEquipmentData.filter(item => item.status === 'expiring').length}
                </div>
                <div className="text-sm text-muted-foreground">{t('equipment.istimara.expiringSoon')}</div>
              </div>
              <div className="text-center p-3 rounded-lg border bg-card">
                <div className="text-2xl font-bold text-blue-600">
                  {safeEquipmentData.filter(item => item.status === 'available').length}
                </div>
                <div className="text-sm text-muted-foreground">{t('equipment.istimara.available')}</div>
              </div>
              <div className="text-center p-3 rounded-lg border bg-card">
                <div className="text-2xl font-bold text-gray-600">
                  {safeEquipmentData.filter(item => item.status === 'missing').length}
                </div>
                <div className="text-sm text-muted-foreground">{t('equipment.istimara.missing')}</div>
              </div>
              <div className="text-center p-3 rounded-lg border bg-card">
                <div className="text-2xl font-bold text-green-600">
                  {safeEquipmentData.filter(item => item.driverName).length}
                </div>
                <div className="text-sm text-muted-foreground">{t('equipment.istimara.withDriver')}</div>
              </div>
            </div>

            {/* Equipment Table */}
            <div className="space-y-4">
           {/* Search and Filter Controls - Moved above table */}
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
                 <option value="expired">{t('equipment.istimara.expired')}</option>
                 <option value="expiring">{t('equipment.istimara.expiringSoon')}</option>
                 <option value="missing">{t('equipment.istimara.missing')}</option>
               </select>
               <select
                 value={driverFilter}
                 onChange={e => setDriverFilter(e.target.value)}
                 className="h-10 px-3 text-sm border border-input rounded-md bg-background"
               >
                 <option value="all">{t('equipment.istimara.allDrivers')}</option>
                 <option value="assigned">{t('equipment.istimara.withDriver')}</option>
                 <option value="unassigned">{t('equipment.istimara.noDriver')}</option>
               </select>
               {(search || statusFilter !== 'all' || driverFilter !== 'all') && (
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     setSearch('');
                     setStatusFilter('all');
                     setDriverFilter('all');
                   }}
                   className="h-10"
                 >
                   {t('equipment.istimara.clear')}
                 </Button>
               )}
             </div>
           </div>
                  {/* Equipment Table - Show All Equipment */}
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
                              <div>
                                <div>{item.equipmentName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.manufacturer && ` • ${item.manufacturer}`}
                                  {item.modelNumber && ` • ${item.modelNumber}`}
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
                  {filteredData.length > 0 && (
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
                          {t('equipment.pagination.next')}
                        </Button>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {t('equipment.pagination.page', { current: currentPage, total: totalPages })}
                      </div>
                    </div>
                  )}
                </div>

                {filteredData.length === 0 && (
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
            </>
          )}
      </CardContent>
    </Card>
  );
}
