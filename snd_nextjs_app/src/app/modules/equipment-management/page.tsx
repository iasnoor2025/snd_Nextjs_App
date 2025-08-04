"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Database,
  Package,
  FileText,
  Loader2,
  AlertTriangle,
  Info,
  Wifi,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/lib/api-service";
import { useRouter } from "next/navigation";
// i18n refactor: All user-facing strings now use useTranslation('equipment')
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
    } | null;
  } | null;
}

export default function EquipmentManagementPage() {
  const { t } = useTranslation('equipment');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignment, setFilterAssignment] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  useEffect(() => {
    fetchEquipment();
  }, []);

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
        toast.success(`Equipment synced successfully! ${response.data?.newCount || 0} new, ${response.data?.updatedCount || 0} updated`);
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
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.model_number && item.model_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesAssignment = filterAssignment === 'all' || 
                             (filterAssignment === 'assigned' && item.current_assignment) ||
                             (filterAssignment === 'unassigned' && !item.current_assignment);
    return matchesSearch && matchesStatus && matchesAssignment;
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
        return <Badge variant="secondary">{t('status.assigned')}</Badge>;
      } else if (assignment.status === 'completed') {
        return <Badge variant="default">{t('status.available')}</Badge>;
      } else if (assignment.status === 'pending') {
        return <Badge variant="outline">{t('status.pending')}</Badge>;
      }
    }
    
    // Fall back to equipment status if no assignment
    const statusConfig = {
      available: { variant: 'default' as const, label: t('status.available') },
      rented: { variant: 'secondary' as const, label: t('status.rented') },
      maintenance: { variant: 'destructive' as const, label: t('status.maintenance') },
      out_of_service: { variant: 'destructive' as const, label: t('status.out_of_service') },
    };
    
    const config = statusConfig[equipment.status as keyof typeof statusConfig] || { variant: 'outline' as const, label: equipment.status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('equipment_management.title')}</h1>
          <p className="text-muted-foreground">
            {t('equipment_management.description')}
          </p>
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
          <Button>
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
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                onChange={(e) => setFilterStatus(e.target.value)}
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
                onChange={(e) => setFilterAssignment(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">{t('equipment_management.all_assignments')}</option>
                <option value="assigned">{t('equipment_management.currently_assigned')}</option>
                <option value="unassigned">{t('equipment_management.not_assigned')}</option>
              </select>
            </div>
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
                      <TableHead>{t('equipment_management.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentEquipment.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {equipment.length === 0 ? (
                            <div className="flex flex-col items-center space-y-2">
                              <Package className="h-8 w-8 text-muted-foreground" />
                              <p>{t('equipment_management.no_equipment_found')}</p>
                              <p className="text-sm">{t('equipment_management.sync_erpnext_to_get_started')}</p>
                            </div>
                          ) : (
                            t('equipment_management.no_equipment_matches_search_criteria')
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentEquipment.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.model_number || '-'}</TableCell>
                          <TableCell>{item.manufacturer || '-'}</TableCell>
                          <TableCell>{getStatusBadge(item)}</TableCell>
                          <TableCell>
                            {item.current_assignment ? (
                              <div className="space-y-1">
                                <div className="font-medium text-sm">
                                  {item.current_assignment.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                                                   {item.current_assignment.type === 'project' && item.current_assignment.project ? (
                                   <span>{t('equipment_management.project')}: {item.current_assignment.project.name}</span>
                                 ) : item.current_assignment.type === 'rental' && item.current_assignment.rental ? (
                                   <span>{t('equipment_management.rental')}: {item.current_assignment.rental.project?.name || t('equipment_management.unknown_project')} - {item.current_assignment.rental.rental_number}</span>
                                 ) : (
                                   <span>{item.current_assignment.type}</span>
                                 )}
                                </div>
                                {item.current_assignment.employee && (
                                  <div className="text-xs text-muted-foreground">
                                    👤 {item.current_assignment.employee.name} ({item.current_assignment.employee.file_number})
                                  </div>
                                )}
                                {item.current_assignment.location && (
                                  <div className="text-xs text-muted-foreground">
                                    📍 {item.current_assignment.location}
                                  </div>
                                )}
                                {item.current_assignment.start_date && (
                                  <div className="text-xs text-muted-foreground">
                                    {t('equipment_management.since')}: {new Date(item.current_assignment.start_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">{t('equipment_management.no_assignment')}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.daily_rate ? `$${item.daily_rate.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.erpnext_id || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.push(`/modules/equipment-management/${item.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.push(`/modules/equipment-management/${item.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.push(`/modules/equipment-management/${item.id}/assign`)}
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
                    {t('equipment_management.showing_results', { start: startIndex + 1, end: Math.min(endIndex, totalItems), total: totalItems })}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="items-per-page" className="text-sm font-medium">
                        {t('equipment_management.show')}:
                      </Label>
                      <select
                        id="items-per-page"
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
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
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) handlePageChange(currentPage - 1);
                            }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        
                        {/* First page */}
                        {currentPage > 3 && (
                          <>
                            <PaginationItem>
                              <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }}>
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
                                onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
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
                              <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}>
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        )}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) handlePageChange(currentPage + 1);
                            }}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
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


    </div>
  );
}
