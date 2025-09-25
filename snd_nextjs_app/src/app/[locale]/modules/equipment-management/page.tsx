'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';


import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  batchTranslateNames,
  convertToArabicNumerals,
  getTranslatedName,
} from '@/lib/translation-utils';
import {
  getEquipmentCategoryName,
  getEquipmentCategoryIcon,
  getEquipmentCategoryColor,
  groupEquipmentByCategory,
  filterEquipmentByCategory,
} from '@/lib/utils/equipment-type-utils';

interface EquipmentCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}


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
  insurance?: string;
  insurance_expiry_date?: string;
  tuv_card?: string;
  tuv_card_expiry_date?: string;
  serial_number?: string;
  chassis_number?: string;
  description?: string;
  door_number?: string;
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
  const { t, isRTL } = useI18n();
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignment, setFilterAssignment] = useState('all');
  const [filterIstimara, setFilterIstimara] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [translatedNames, setTranslatedNames] = useState<{ [key: string]: string }>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal state
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Category management state
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showCategoryManagementModal, setShowCategoryManagementModal] = useState(false);
  const [selectedCategory] = useState<EquipmentCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '🔧',
    color: '#9E9E9E',
  });
  const [editingCategory, setEditingCategory] = useState<EquipmentCategory | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [updatingCategory, setUpdatingCategory] = useState(false);

  const router = useRouter();

  // Get allowed actions for equipment management
  const allowedActions = getAllowedActions('Equipment');

  useEffect(() => {
    fetchEquipment();
    fetchCategories();
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
      
      const response = await ApiService.getEquipment();
      
      if (response.success && Array.isArray(response.data)) {
        setEquipment(response.data);
      } else {
        setEquipment([]);
        
        toast.error('Failed to load equipment');
      }
    } catch (error) {
      setEquipment([]);
      
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };


  // Category management functions
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/equipment/categories');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCategories(result.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setAddingCategory(true);
      const response = await fetch('/api/equipment/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          description: newCategory.description?.trim() || null,
          icon: newCategory.icon || '🔧',
          color: newCategory.color || '#9E9E9E',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Category added successfully');
        setCategories(prev => [...prev, result.data]);
        setNewCategory({ name: '', description: '', icon: '🔧', color: '#9E9E9E' });
        setShowAddCategoryModal(false);
      } else {
        toast.error(result.message || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category. Please try again.');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setUpdatingCategory(true);
      const response = await fetch(`/api/equipment/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingCategory.name.trim(),
          description: editingCategory.description?.trim() || null,
          icon: editingCategory.icon || '🔧',
          color: editingCategory.color || '#9E9E9E',
          isActive: editingCategory.isActive,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Category updated successfully');
        setCategories(prev => 
          prev.map(cat => cat.id === editingCategory.id ? result.data : cat)
        );
        setEditingCategory(null);
        setShowEditCategoryModal(false);
      } else {
        toast.error(result.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category. Please try again.');
    } finally {
      setUpdatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const response = await fetch(`/api/equipment/categories/${categoryId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Category deleted successfully');
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      } else {
        toast.error(result.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category. Please try again.');
    }
  };

  const handleDeleteClick = (equipment: Equipment) => {
    setEquipmentToDelete(equipment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!equipmentToDelete) return;
    
    setDeleting(true);
    try {
      await ApiService.deleteEquipment(equipmentToDelete.id);
      toast.success(t('equipment.messages.deleteSuccess'));
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
      // Refresh the equipment list
      fetchEquipment();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast.error(t('equipment.messages.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const openEditCategoryModal = (category: EquipmentCategory) => {
    setEditingCategory(category);
    setShowEditCategoryModal(true);
  };

  const filteredEquipment = equipment.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(searchLower) ||
      (item.model_number && item.model_number.toLowerCase().includes(searchLower)) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(searchLower)) ||
      (item.door_number && item.door_number.toLowerCase().includes(searchLower)) ||
      (item.istimara && item.istimara.toLowerCase().includes(searchLower)) ||
      (item.serial_number && item.serial_number.toLowerCase().includes(searchLower)) ||
      (item.chassis_number && item.chassis_number.toLowerCase().includes(searchLower)) ||
      (item.insurance && item.insurance.toLowerCase().includes(searchLower)) ||
      (item.tuv_card && item.tuv_card.toLowerCase().includes(searchLower));
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesAssignment =
      filterAssignment === 'all' ||
      (filterAssignment === 'assigned' && item.current_assignment) ||
      (filterAssignment === 'unassigned' && !item.current_assignment);

    // Category filtering
    const matchesType = filterType === 'all' || 
      getEquipmentCategoryName(item.category_id || null, categories) === filterType;

    // Istimara status filtering
    let matchesIstimara = true;
    if (filterIstimara !== 'all') {
      if (!item.istimara_expiry_date) {
        // If no expiry date is set, only match "not_specified" filter
        matchesIstimara = filterIstimara === 'not_specified';
      } else {
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
        } else if (filterIstimara === 'not_specified') {
          // Equipment with expiry date should not match "not_specified"
          matchesIstimara = false;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesAssignment && matchesType && matchesIstimara;
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
            {t('equipment.status.assigned')}
          </Badge>
        );
      } else if (assignment.status === 'completed') {
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
            {t('equipment.status.available')}
          </Badge>
        );
      } else if (assignment.status === 'pending') {
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">
            {t('equipment.status.pending')}
          </Badge>
        );
      }
    }

    // Fall back to equipment status if no assignment
    const statusConfig = {
      available: {
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        label: t('equipment.status.available'),
      },
      assigned: {
        className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        label: t('equipment.status.assigned'),
      },
      rented: {
        className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
        label: t('equipment.status.rented'),
      },
      maintenance: {
        className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
        label: t('equipment.status.maintenance'),
      },
      out_of_service: {
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        label: t('equipment.status.out_of_service'),
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

  // Calculate equipment statistics by grouping equipment by category
  const calculateEquipmentStats = () => {
    return groupEquipmentByCategory(equipment, categories);
  };

  const equipmentStats = calculateEquipmentStats();

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              {t('equipment.title')}
            </h1>
            <p className="text-muted-foreground">{t('equipment.manage_equipment_inventory')}</p>
          </div>
          <div className="flex gap-2">
            {hasPermission('create', 'Equipment') && (
              <Button onClick={() => setShowAddEquipmentModal(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('equipment.add_equipment')}
              </Button>
            )}
            {hasPermission('read', 'Equipment') && (
              <Button 
                onClick={() => setShowCategoryManagementModal(true)} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                {t('equipment.equipment_management.manage_categories')}
              </Button>
            )}
          </div>
        </div>

        {/* Equipment Statistics Cards */}
        {Object.keys(equipmentStats).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
            {Object.entries(equipmentStats)
              .sort(([,a], [,b]) => b - a) // Sort by count descending
              .map(([equipmentType, count]) => (
                <Card 
                  key={equipmentType} 
                  className={`hover:shadow-md transition-shadow cursor-pointer ${
                    filterType === equipmentType ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setFilterType(filterType === equipmentType ? 'all' : equipmentType)}
                >
                  <CardContent className="p-3">
                    <div className="flex flex-col items-center text-center">
                      <div className="text-2xl mb-1">
                        {(() => {
                          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#14B8A6', '#F43F5E', '#6366F1'];
                          const category = categories.find(cat => cat.name.toUpperCase() === equipmentType);
                          const colorIndex = category ? categories.indexOf(category) % colors.length : 0;
                          return <span style={{ color: colors[colorIndex] }}>●</span>;
                        })()}
                      </div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 truncate w-full">
                        {equipmentType}
                      </p>
                      <p className="text-xl font-bold text-primary">
                        {count}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name, door number, istimara, serial number, chassis number, insurance, or TUV card..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="status-filter" className="text-sm font-medium whitespace-nowrap">
                  {t('equipment.equipment_management.status_filter_label')}:
                </Label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm min-w-[120px]"
                >
                  <option value="all">{t('equipment.equipment_management.all_status')}</option>
                  <option value="available">{t('equipment.status.available')}</option>
                  <option value="rented">{t('equipment.status.rented')}</option>
                  <option value="maintenance">{t('equipment.status.maintenance')}</option>
                  <option value="out_of_service">{t('equipment.status.out_of_service')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="assignment-filter" className="text-sm font-medium whitespace-nowrap">
                  {t('equipment.equipment_management.assignment_filter_label')}:
                </Label>
                <select
                  id="assignment-filter"
                  value={filterAssignment}
                  onChange={e => setFilterAssignment(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm min-w-[140px]"
                >
                  <option value="all">{t('equipment.equipment_management.all_assignments')}</option>
                  <option value="assigned">{t('equipment.equipment_management.currently_assigned')}</option>
                  <option value="unassigned">{t('equipment.equipment_management.not_assigned')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="istimara-filter" className="text-sm font-medium whitespace-nowrap">
                  {t('equipment.equipment_management.istimara_status')}:
                </Label>
                <select
                  id="istimara-filter"
                  value={filterIstimara}
                  onChange={e => setFilterIstimara(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm min-w-[120px]"
                >
                  <option value="all">{t('equipment.equipment_management.all_istimara')}</option>
                  <option value="valid">{t('equipment.equipment_management.valid')}</option>
                  <option value="expired">{t('equipment.equipment_management.expired')}</option>
                  <option value="expiring_soon">{t('equipment.equipment_management.expiring_soon')}</option>
                  <option value="not_specified">{t('equipment.equipment_management.not_specified')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="type-filter" className="text-sm font-medium whitespace-nowrap">
                  {t('equipment.equipment_management.type')}:
                </Label>
                <select
                  id="type-filter"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm min-w-[120px]"
                >
                  <option value="all">{t('equipment.equipment_management.all_types')}</option>
                  {Object.keys(equipmentStats).map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              {(filterStatus !== 'all' ||
                filterAssignment !== 'all' ||
                filterIstimara !== 'all' ||
                filterType !== 'all' ||
                searchTerm) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterAssignment('all');
                    setFilterIstimara('all');
                    setFilterType('all');
                    setSearchTerm('');
                  }}
                  className="text-xs"
                >
                  {t('equipment.equipment_management.clear_filters')}
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
              <span>{t('equipment.equipment_management.equipment_inventory')}</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span>
                {t('equipment.equipment_management.total_equipment')}: {equipment.length}
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
                        ⚠️ {expiredCount} {t('equipment.equipment_management.expired_istimara')}
                      </span>
                    )}
                    {expiringSoonCount > 0 && (
                      <span className="text-orange-600 font-medium">
                        ⏰ {expiringSoonCount} {t('equipment.equipment_management.expiring_soon_istimara')}
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
                <span className="ml-2">{t('equipment.equipment_management.loading_equipment')}</span>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('equipment.equipment_management.name')}</TableHead>
                        <TableHead>{t('equipment.equipment_management.door_number')}</TableHead>
                        <TableHead>{t('equipment.equipment_management.model')}</TableHead>
                        <TableHead>{t('equipment.fields.type')}</TableHead>
                        <TableHead>{t('equipment.equipment_management.status')}</TableHead>
                        <TableHead>{t('equipment.equipment_management.current_assignment')}</TableHead>
                        <TableHead>{t('equipment.equipment_management.daily_rate')}</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <span>{t('equipment.equipment_management.istimara')}</span>
                            {(() => {
                              const expiredCount = equipment.filter(
                                item =>
                                  item.istimara_expiry_date &&
                                  new Date(item.istimara_expiry_date) < new Date()
                              ).length;
                              return expiredCount > 0 ? (
                                <Badge variant="destructive" className="text-xs">
                                  {expiredCount} {t('equipment.equipment_management.expired')}
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                        </TableHead>
                        <TableHead>{t('equipment.equipment_management.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentEquipment.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            {equipment.length === 0 ? (
                              <div className="flex flex-col items-center space-y-2">
                                <Package className="h-8 w-8 text-muted-foreground" />
                                <p>{t('equipment.equipment_management.no_equipment_found')}</p>
                                <p className="text-sm text-muted-foreground">
                                  Add equipment using the "Add Equipment" button above
                                </p>
                              </div>
                            ) : (
                              t('equipment.equipment_management.no_equipment_matches_search_criteria')
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentEquipment.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {(() => {
                                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#14B8A6', '#F43F5E', '#6366F1'];
                                    const category = categories.find(cat => cat.id === item.category_id);
                                    const colorIndex = category ? categories.indexOf(category) % colors.length : 0;
                                    return <span style={{ color: colors[colorIndex] }}>●</span>;
                                  })()}
                                </span>
                                <span>
                                  {getTranslatedName(
                                    item.name,
                                    isRTL,
                                    translatedNames,
                                    setTranslatedNames
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.door_number ? (
                                convertToArabicNumerals(item.door_number, isRTL)
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  {t('equipment.equipment_management.not_specified')}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.model_number ? (
                                convertToArabicNumerals(item.model_number, isRTL)
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  {t('equipment.equipment_management.not_specified')}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.category_id ? (
                                (() => {
                                  const category = categories.find(cat => cat.id === item.category_id);
                                  return category ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{category.icon}</span>
                                      <span className="text-sm font-medium">{category.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">
                                      {t('equipment.equipment_management.not_specified')}
                                    </span>
                                  );
                                })()
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  {t('equipment.fields.noCategory')}
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
                                      t('equipment.equipment_management.assigned')}
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
                                  {t('equipment.equipment_management.no_assignment')}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.daily_rate ? (
                                <span className="font-medium">
                                  {convertToArabicNumerals(item.daily_rate.toString(), isRTL)}{' '}
                                  {t('equipment.equipment_management.per_day')}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  {t('equipment.equipment_management.not_specified')}
                                </span>
                              )}
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
                                  {t('equipment.equipment_management.not_specified')}
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
                                {hasPermission('update', 'Equipment') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(`/modules/equipment-management/${item.id}/edit`)
                                    }
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {hasPermission('update', 'Equipment') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(`/modules/equipment-management/${item.id}/assign`)
                                    }
                                    title={t('equipment.equipment_management.manage_assignments')}
                                  >
                                    <div className="h-4 w-4 flex items-center justify-center">
                                      <span className="text-xs">📋</span>
                                    </div>
                                  </Button>
                                )}
                                {hasPermission('delete', 'Equipment') && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteClick(item)}
                                    title={t('equipment.actions.deleteEquipment')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
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
                      {t('equipment.equipment_management.showing_results', {
                        start: String(startIndex + 1),
                        end: String(Math.min(endIndex, totalItems)),
                        total: String(totalItems),
                      })}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="items-per-page" className="text-sm font-medium">
                          {t('equipment.equipment_management.show')}:
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

        {/* Category Management Modal */}
        {showCategoryManagementModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Equipment Categories</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAddCategoryModal(true)}
                    className="flex items-center gap-2"
                    disabled={!hasPermission('create', 'Equipment')}
                  >
                    <Plus className="h-4 w-4" />
                    Add Category
                  </Button>
                  <Button
                    onClick={() => setShowCategoryManagementModal(false)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <CardTitle className="text-sm">{category.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {category.description || 'No description'}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {hasPermission('update', 'Equipment') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditCategoryModal(category)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          {hasPermission('delete', 'Equipment') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span>Color: {category.color}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        {showAddCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add Equipment Category</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Name</Label>
                  <Input
                    id="category-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <Label htmlFor="category-description">Description</Label>
                  <Input
                    id="category-description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="category-icon">Icon</Label>
                  <Input
                    id="category-icon"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="🔧"
                  />
                </div>
                <div>
                  <Label htmlFor="category-color">Color</Label>
                  <Input
                    id="category-color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#9E9E9E"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleAddCategory}
                    disabled={addingCategory}
                    className="flex-1"
                  >
                    {addingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Category'}
                  </Button>
                  <Button
                    onClick={() => setShowAddCategoryModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {showEditCategoryModal && editingCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Edit Equipment Category</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-category-name">Name</Label>
                  <Input
                    id="edit-category-name"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category-description">Description</Label>
                  <Input
                    id="edit-category-description"
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Enter description (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category-icon">Icon</Label>
                  <Input
                    id="edit-category-icon"
                    value={editingCategory.icon || ''}
                    onChange={(e) => setEditingCategory(prev => prev ? { ...prev, icon: e.target.value } : null)}
                    placeholder="🔧"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category-color">Color</Label>
                  <Input
                    id="edit-category-color"
                    value={editingCategory.color || ''}
                    onChange={(e) => setEditingCategory(prev => prev ? { ...prev, color: e.target.value } : null)}
                    placeholder="#9E9E9E"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-category-active"
                    checked={editingCategory.isActive}
                    onChange={(e) => setEditingCategory(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                  />
                  <Label htmlFor="edit-category-active">Active</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleEditCategory}
                    disabled={updatingCategory}
                    className="flex-1"
                  >
                    {updatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Category'}
                  </Button>
                  <Button
                    onClick={() => setShowEditCategoryModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('equipment.actions.deleteEquipment')}</DialogTitle>
              <DialogDescription>
                {t('equipment.messages.confirmDelete')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                {t('common.actions.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.actions.saving')}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common.actions.delete')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
