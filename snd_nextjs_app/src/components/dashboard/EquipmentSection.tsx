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
  equipmentData,
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
                 Last Updated: {lastUpdated.toLocaleTimeString()}
                 {isRefreshing && (
                   <span className="ml-2 text-blue-500">
                     • Refreshing...
                   </span>
                 )}
               </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
                         {isRefreshing && (
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                 Refreshing...
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
                Download PDF ({expiredEquipmentData.length})
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
              onClick={onHideSection}
              className="flex items-center gap-2"
            >
              {t('dashboard.hideSection')}
            </Button>
          </div>
        </div>
      </CardHeader>
             <CardContent className="space-y-4">
         {/* Equipment Summary */}
         <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
           <div className="grid grid-cols-2 gap-4 text-center">
             <div>
               <div className="text-lg font-semibold text-muted-foreground">
                 Total Equipment: {safeEquipmentData.length}
               </div>
               <div className="text-sm text-muted-foreground">
                 {t('equipment.istimara.itemsRequiringAttention')}: {safeEquipmentData.filter(item => item.status !== 'available').length}
               </div>
             </div>
             <div>
               <div className="text-lg font-semibold text-muted-foreground">
                 With Driver: {safeEquipmentData.filter(item => item.driverName).length}
               </div>
               <div className="text-sm text-muted-foreground">
                 Unassigned: {safeEquipmentData.filter(item => !item.driverName).length}
               </div>
             </div>
           </div>
         </div>
         
         <div className="grid grid-cols-5 gap-4">
           <div className="text-center p-3 rounded-lg border bg-card">
             <div className="text-2xl font-bold text-red-600">
               {safeEquipmentData.filter(item => item.status === 'expired').length}
             </div>
             <div className="text-sm text-muted-foreground">Expired</div>
           </div>
           <div className="text-center p-3 rounded-lg border bg-card">
             <div className="text-2xl font-bold text-yellow-600">
               {safeEquipmentData.filter(item => item.status === 'expiring').length}
             </div>
             <div className="text-sm text-muted-foreground">Expiring Soon</div>
           </div>
           <div className="text-center p-3 rounded-lg border bg-card">
             <div className="text-2xl font-bold text-blue-600">
               {safeEquipmentData.filter(item => item.status === 'available').length}
             </div>
             <div className="text-sm text-muted-foreground">Available</div>
           </div>
           <div className="text-center p-3 rounded-lg border bg-card">
             <div className="text-2xl font-bold text-gray-600">
               {safeEquipmentData.filter(item => item.status === 'missing').length}
             </div>
             <div className="text-sm text-muted-foreground">Missing</div>
           </div>
           <div className="text-center p-3 rounded-lg border bg-card">
             <div className="text-2xl font-bold text-green-600">
               {safeEquipmentData.filter(item => item.driverName).length}
             </div>
             <div className="text-sm text-muted-foreground">With Driver</div>
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
                   placeholder="Search equipment, istimara, driver..."
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
                 <option value="all">All Statuses</option>
                 <option value="expired">Expired</option>
                 <option value="expiring">Expiring Soon</option>
                 <option value="missing">Missing</option>
               </select>
               <select
                 value={driverFilter}
                 onChange={e => setDriverFilter(e.target.value)}
                 className="h-10 px-3 text-sm border border-input rounded-md bg-background"
               >
                 <option value="all">All Drivers</option>
                 <option value="assigned">With Driver</option>
                 <option value="unassigned">No Driver</option>
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
                   Clear
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
                          <TableHead>Equipment Name</TableHead>
                          <TableHead>Istimara #</TableHead>
                          <TableHead>Driver/Operator</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{item.equipmentName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.equipmentNumber && `#${item.equipmentNumber}`}
                                  {item.manufacturer && ` • ${item.manufacturer}`}
                                  {item.modelNumber && ` • ${item.modelNumber}`}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.istimara ? (
                                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                  {item.istimara}
                                </span>
                              ) : (
                                <span className="text-red-600 text-xs">No Istimara</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.driverName ? (
                                <div>
                                  <div className="font-medium">{item.driverName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    File: {item.driverFileNumber || 'N/A'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">Unassigned</span>
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
                                        ? `${Math.abs(item.daysRemaining)} days overdue`
                                        : `${item.daysRemaining} days remaining`}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-red-600 font-medium">
                                  No expiry date
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
                          per page
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
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
                          Next
                        </Button>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </div>
                    </div>
                  )}
                </div>

                {filteredData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No equipment records found</p>
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
