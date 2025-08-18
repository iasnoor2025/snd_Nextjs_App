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
import { Edit, Plus, Search, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface EquipmentData {
  id: number;
  equipmentName: string;
  equipmentNumber?: string;
  manufacturer?: string;
  modelNumber?: string;
  department?: string;
  status: 'available' | 'expired' | 'expiring' | 'missing';
  istimaraExpiry?: string;
  daysRemaining: number | null;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debug: Log the onHideSection prop to ensure it's received
  console.log('EquipmentSection - onHideSection received:', typeof onHideSection);
  console.log('EquipmentSection - onHideSection value:', onHideSection);

  // Filter and search logic
  const filteredData = equipmentData.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch =
      !search ||
      item.equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
      item.equipmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
      item.modelNumber?.toLowerCase().includes(search.toLowerCase());

    return item.status !== 'available' && matchesStatus && matchesSearch;
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
            </CardTitle>
            <CardDescription>{t('equipment.istimara.description')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
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
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('equipment.istimara.searchPlaceholder')}
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
                {t('equipment.istimara.clear')}
              </Button>
            )}
          </div>
        </div>

        {/* Equipment Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-red-600">
              {equipmentData.filter(item => item.status === 'expired').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('equipment.istimara.expired')}</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-yellow-600">
              {equipmentData.filter(item => item.status === 'expiring').length}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('equipment.istimara.expiringSoon')}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-blue-600">
              {equipmentData.filter(item => item.status === 'available').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('equipment.istimara.available')}</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-gray-600">
              {equipmentData.filter(item => item.status === 'missing').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('equipment.istimara.missing')}</div>
          </div>
        </div>

        {/* Equipment Table */}
        <div className="space-y-4">
          {/* Equipment with Issues (Expired, Expiring, Missing) */}
          {equipmentData.filter(item => item.status !== 'available').length > 0 && (
            <div className="rounded-lg border">
              <div className="p-4 border-b bg-muted/50">
                <h4 className="font-medium text-sm">
                  {t('equipment.istimara.requiringAttention')}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {t('equipment.istimara.attentionDescription')}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('equipment.fields.name')}</TableHead>
                    <TableHead>{t('equipment.fields.department')}</TableHead>
                    <TableHead>{t('equipment.fields.status')}</TableHead>
                    <TableHead>{t('equipment.istimara.expiry')}</TableHead>
                    <TableHead>{t('equipment.actions.actions')}</TableHead>
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
                        {item.department || t('equipment.istimara.notApplicable')}
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
                                  ? t('equipment.istimara.daysOverdue', {
                                      days: Math.abs(item.daysRemaining),
                                    })
                                  : t('equipment.istimara.daysRemaining', {
                                      days: item.daysRemaining,
                                    })}
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
                              ? t('equipment.istimara.addExpiryDate')
                              : t('equipment.istimara.updateExpiryDate')
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
          )}

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
                  {t('equipment.pagination.perPage')}
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
                ? t('equipment.istimara.tryAdjustingSearch')
                : t('equipment.istimara.allRecordsValid')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
