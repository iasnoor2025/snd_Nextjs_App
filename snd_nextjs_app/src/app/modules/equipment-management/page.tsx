'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ApiService from '@/lib/api-service';
import {
  Database,
  Edit,
  Eye,
  Loader2,
  Package,
  Plus,
  RotateCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
// i18n refactor: All user-facing strings now use useTranslation('equipment')
import AddEquipmentModal from '@/components/equipment/AddEquipmentModal';
import ExpiryDateDisplay from '@/components/shared/ExpiryDateDisplay';
import { useI18n } from '@/hooks/use-i18n';
import {
  batchTranslateNames,
  convertToArabicNumerals,
  getTranslatedName,
} from '@/lib/translation-utils';
import { useTranslation } from 'react-i18next';

interface Equipment {
  id: number;
  name: string;
  model_number?: string;
  status: string;
  category_id?: number;
  manufacturer?: string;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  erpnext_id?: string;
  istimara?: string;
  istimara_expiry_date?: string;
  serial_number?: string;
  description?: string;
  current_assignment?: {
    id: number;
    type: string;
    name: string;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    notes: string | null;
    project?: {
      id: number;
      name: string;
      location: string | null;
    } | null;
    rental?: {
      id: number;
      rental_number: string;
      project?: {
        id: number;
        name: string;
      } | null;
    } | null;
    employee?: {
      id: number;
      name: string;
      file_number: string;
      full_name?: string; // Added for translated name
    } | null;
  } | null;
}

export default function EquipmentManagementPage() {
  const { t } = useTranslation('equipment');
  const { isRTL } = useI18n();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignment, setFilterAssignment] = useState('all');
  const [filterIstimara, setFilterIstimara] = useState('all');
  const [translatedNames, setTranslatedNames] = useState<{ [key: string]: string }>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal state
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchEquipment();
  }, []);

  // Trigger batch translation when equipment data changes
  useEffect(() => {
    if (equipment.length > 0 && isRTL) {
      const names = equipment.map(eq => eq.name).filter(Boolean) as string[];
      batchTranslateNames(names, isRTL, setTranslatedNames);
    }
  }, [equipment, isRTL]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      console.log('Fetching equipment...');
      const response = await ApiService.getEquipment();
      console.log('Equipment response:', response);
      if (response.success && Array.isArray(response.data)) {
        setEquipment(response.data);
      } else {
        setEquipment([]);
        console.error('Equipment response error:', response);
        toast.error('Failed to load equipment');
      }
    } catch (error) {
      setEquipment([]);
      console.error('Equipment fetch error:', error);
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const syncEquipmentFromERPNext = async () => {
    setSyncing(true);
    try {
      const response = await ApiService.syncEquipmentFromERPNext();
      if (response.success) {
        toast.success(
          `Equipment synced successfully! ${response.data?.newCount || 0} new, ${response.data?.updatedCount || 0} updated`
        );
        await fetchEquipment(); // Refresh the equipment list
      } else {
        toast.error('Failed to sync equipment from ERPNext');
      }
    } catch (error) {
      toast.error('Failed to sync equipment from ERPNext');
    } finally {
      setSyncing(false);
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.model_number && item.model_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesAssignment =
      filterAssignment === 'all' ||
      (filterAssignment === 'assigned' && item.current_assignment) ||
      (filterAssignment === 'unassigned' && !item.current_assignment);

    // Istimara status filtering
    let matchesIstimara = true;
    if (filterIstimara !== 'all' && item.istimara_expiry_date) {
      const isExpired = new Date(item.istimara_expiry_date) < new Date();
      const isExpiringSoon = (() => {
        const date = new Date(item.istimara_expiry_date);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        thirtyDaysFromNow.setHours(0, 0, 0, 0);
        return date >= today && date <= thirtyDaysFromNow;
      })();

      if (filterIstimara === 'expired') {
        matchesIstimara = isExpired;
      } else if (filterIstimara === 'expiring_soon') {
        matchesIstimara = isExpiringSoon;
      } else if (filterIstimara === 'valid') {
        matchesIstimara = !isExpired && !isExpiringSoon;
      }
    }

    return matchesSearch && matchesStatus && matchesAssignment && matchesIstimara;
  });

  // Pagination calculations
  const totalItems = filteredEquipment.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEquipment = filteredEquipment.slice(startIndex, endIndex);

  const getStatusBadge = (equipment: Equipment) => {
    // Determine status based on current assignment
    if (equipment.current_assignment) {
      const assignment = equipment.current_assignment;
      if (assignment.status === 'active') {
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">
            {t('status.assigned')}
          </Badge>
        );
      } else if (assignment.status === 'completed') {
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
            {t('status.available')}
          </Badge>
        );
      } else if (assignment.status === 'pending') {
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">
            {t('status.pending')}
          </Badge>
        );
      }
    }

    // Fall back to equipment status if no assignment
    const statusConfig = {
      available: {
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        label: t('status.available'),
      },
      assigned: {
        className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        label: t('status.assigned'),
      },
      rented: {
        className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
        label: t('status.rented'),
      },
      maintenance: {
        className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
        label: t('status.maintenance'),
      },
      out_of_service: {
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        label: t('status.out_of_service'),
      },
    };

    const config = statusConfig[equipment.status as keyof typeof statusConfig] || {
      className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      label: equipment.status,
    };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = () => {
    // Since we're not changing items per page dynamically, just reset to first page
    setCurrentPage(1);
  };

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('equipment_management.title')}</h1>
          <p className="text-muted-foreground">{t('equipment_management.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={syncEquipmentFromERPNext} disabled={syncing}>
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCw className="h-4 w-4 mr-2" />
            )}
            {t('equipment_management.sync_erpnext')}
          </Button>
          <Button onClick={() => setShowAddEquipmentModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('equipment_management.add_equipment')}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('equipment_management.search_placeholder')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter" className="text-sm font-medium">
                {t('equipment_management.status_filter_label')}:
              </Label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">{t('equipment_management.all_status')}</option>
                <option value="available">{t('status.available')}</option>
                <option value="rented">{t('status.rented')}</option>
                <option value="maintenance">{t('status.maintenance')}</option>
                <option value="out_of_service">{t('status.out_of_service')}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="assignment-filter" className="text-sm font-medium">
                {t('equipment_management.assignment_filter_label')}:
              </Label>
              <select
                id="assignment-filter"
                value={filterAssignment}
                onChange={e => setFilterAssignment(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">{t('equipment_management.all_assignments')}</option>
                <option value="assigned">{t('equipment_management.currently_assigned')}</option>
                <option value="unassigned">{t('equipment_management.not_assigned')}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="istimara-filter" className="text-sm font-medium">
                {t('equipment_management.istimara_status')}:
              </Label>
              <select
                id="istimara-filter"
                value={filterIstimara}
                onChange={e => setFilterIstimara(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">{t('equipment_management.all_istimara')}</option>
                <option value="valid">{t('equipment_management.valid')}</option>
                <option value="expired">{t('equipment_management.expired')}</option>
                <option value="expiring_soon">{t('equipment_management.expiring_soon')}</option>
              </select>
            </div>
            {(filterStatus !== 'all' ||
              filterAssignment !== 'all' ||
              filterIstimara !== 'all' ||
              searchTerm) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus('all');
                  setFilterAssignment('all');
                  setFilterIstimara('all');
                  setSearchTerm('');
                }}
                className="text-xs"
              >
                {t('equipment_management.clear_filters')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>{t('equipment_management.equipment_inventory')}</span>
          </CardTitle>
          <CardDescription className="flex items-center gap-4 text-sm">
            <span>
              {t('equipment_management.total_equipment')}: {equipment.length}
            </span>
            {(() => {
              const expiredCount = equipment.filter(
                item =>
                  item.istimara_expiry_date && new Date(item.istimara_expiry_date) < new Date()
              ).length;
              const expiringSoonCount = equipment.filter(item => {
                if (!item.istimara_expiry_date) return false;
                const date = new Date(item.istimara_expiry_date);
                const today = new Date();
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(today.getDate() + 30);
                today.setHours(0, 0, 0, 0);
                date.setHours(0, 0, 0, 0);
                thirtyDaysFromNow.setHours(0, 0, 0, 0);
                return date >= today && date <= thirtyDaysFromNow;
              }).length;

              return (
                <>
                  {expiredCount > 0 && (
                    <span className="text-red-600 font-medium">
                      ⚠️ {expiredCount} {t('equipment_management.expired_istimara')}
                    </span>
                  )}
                  {expiringSoonCount > 0 && (
                    <span className="text-orange-600 font-medium">
                      ⏰ {expiringSoonCount} {t('equipment_management.expiring_soon_istimara')}
                    </span>
                  )}
                </>
              );
            })()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">{t('equipment_management.loading_equipment')}</span>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('equipment_management.name')}</TableHead>
                      <TableHead>{t('equipment_management.model')}</TableHead>
                      <TableHead>{t('equipment_management.manufacturer')}</TableHead>
                      <TableHead>{t('equipment_management.status')}</TableHead>
                      <TableHead>{t('equipment_management.current_assignment')}</TableHead>
                      <TableHead>{t('equipment_management.daily_rate')}</TableHead>
                      <TableHead>{t('equipment_management.erpnext_id')}</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <span>{t('equipment_management.istimara')}</span>
                          {(() => {
                            const expiredCount = equipment.filter(
                              item =>
                                item.istimara_expiry_date &&
                                new Date(item.istimara_expiry_date) < new Date()
                            ).length;
                            return expiredCount > 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                {expiredCount} {t('equipment_management.expired')}
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                      </TableHead>
                      <TableHead>{t('equipment_management.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentEquipment.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          {equipment.length === 0 ? (
                            <div className="flex flex-col items-center space-y-2">
                              <Package className="h-8 w-8 text-muted-foreground" />
                              <p>{t('equipment_management.no_equipment_found')}</p>
                              <p className="text-sm">
                                {t('equipment_management.sync_erpnext_to_get_started')}
                              </p>
                            </div>
                          ) : (
                            t('equipment_management.no_equipment_matches_search_criteria')
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentEquipment.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {getTranslatedName(
                              item.name,
                              isRTL,
                              translatedNames,
                              setTranslatedNames
                            )}
                          </TableCell>
                          <TableCell>
                            {item.model_number ? (
                              convertToArabicNumerals(item.model_number, isRTL)
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {t('equipment_management.not_specified')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.manufacturer ? (
                              getTranslatedName(
                                item.manufacturer,
                                isRTL,
                                translatedNames,
                                setTranslatedNames
                              )
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {t('equipment_management.not_specified')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(item)}</TableCell>
                          <TableCell>
                            {item.current_assignment ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  {item.current_assignment.employee?.full_name ||
                                    item.current_assignment.project?.name ||
                                    item.current_assignment.rental?.rental_number ||
                                    item.current_assignment.name ||
                                    t('equipment_management.assigned')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.current_assignment.type === 'project' &&
                                    item.current_assignment.project?.name &&
                                    `Project: ${item.current_assignment.project.name}`}
                                  {item.current_assignment.type === 'rental' &&
                                    item.current_assignment.rental?.rental_number &&
                                    `Rental: ${item.current_assignment.rental.rental_number}`}
                                  {item.current_assignment.type === 'manual' &&
                                    item.current_assignment.employee?.full_name &&
                                    `Employee: ${item.current_assignment.employee.full_name}`}
                                  {!item.current_assignment.project?.name &&
                                    !item.current_assignment.rental?.rental_number &&
                                    !item.current_assignment.employee?.full_name &&
                                    `${item.current_assignment.type} Assignment`}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                {t('equipment_management.no_assignment')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.daily_rate ? (
                              <span className="font-medium">
                                {convertToArabicNumerals(item.daily_rate.toString(), isRTL)}{' '}
                                {t('equipment_management.per_day')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {t('equipment_management.not_specified')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {convertToArabicNumerals(item.erpnext_id?.toString(), isRTL) || '-'}
                          </TableCell>
                          <TableCell>
                            {item.istimara ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium">{item.istimara}</div>
                                {item.istimara_expiry_date && (
                                  <ExpiryDateDisplay
                                    date={item.istimara_expiry_date}
                                    showIcon={false}
                                    className="text-xs"
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {t('equipment_management.not_specified')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/modules/equipment-management/${item.id}`)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/modules/equipment-management/${item.id}/edit`)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/modules/equipment-management/${item.id}/assign`)
                                }
                                title={t('equipment_management.manage_assignments')}
                              >
                                <div className="h-4 w-4 flex items-center justify-center">
                                  <span className="text-xs">📋</span>
                                </div>
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="flex-1 text-sm text-muted-foreground">
                    {t('equipment_management.showing_results', {
                      start: startIndex + 1,
                      end: Math.min(endIndex, totalItems),
                      total: totalItems,
                    })}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="items-per-page" className="text-sm font-medium">
                        {t('equipment_management.show')}:
                      </Label>
                      <select
                        id="items-per-page"
                        value={itemsPerPage}
                        onChange={() => handleItemsPerPageChange()}
                        className="border rounded-md px-3 py-2 text-sm"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={e => {
                              e.preventDefault();
                              if (currentPage > 1) handlePageChange(currentPage - 1);
                            }}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>

                        {/* First page */}
                        {currentPage > 3 && (
                          <>
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                onClick={e => {
                                  e.preventDefault();
                                  handlePageChange(1);
                                }}
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          </>
                        )}

                        {/* Page numbers around current page */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (page > totalPages) return null;

                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={e => {
                                  e.preventDefault();
                                  handlePageChange(page);
                                }}
                                isActive={currentPage === page}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        {/* Last page */}
                        {currentPage < totalPages - 2 && (
                          <>
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                onClick={e => {
                                  e.preventDefault();
                                  handlePageChange(totalPages);
                                }}
                              >
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        )}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={e => {
                              e.preventDefault();
                              if (currentPage < totalPages) handlePageChange(currentPage + 1);
                            }}
                            className={
                              currentPage === totalPages ? 'pointer-events-none opacity-50' : ''
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Equipment Modal */}
      <AddEquipmentModal
        open={showAddEquipmentModal}
        onOpenChange={setShowAddEquipmentModal}
        onSuccess={fetchEquipment}
      />
    </div>
  );
}
