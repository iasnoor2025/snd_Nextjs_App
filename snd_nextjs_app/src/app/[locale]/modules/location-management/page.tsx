'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
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
import { PermissionContent, RoleContent } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Edit,
  Eye,
  MapPin,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { toast } from 'sonner';

interface Location {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function LocationManagementPage() {
  const { t } = useI18n();
  const { isRTL } = useI18n();
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Reduced for testing pagination
  const [totalPages, setTotalPages] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    latitude: '',
    longitude: '',
    is_active: true,
  });

  // Get allowed actions for location management
  const allowedActions = getAllowedActions('Location');

  useEffect(() => {
    fetchLocations();
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, cityFilter]);

  const fetchLocations = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (cityFilter !== 'all') params.append('city', cityFilter);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await fetch(`/api/locations?${params.toString()}`);
      if (response.ok) {
        const result = (await response.json()) as {
          success: boolean;
          data?: Location[];
          pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
          };
        };
        if (result.success && Array.isArray(result.data)) {
          setLocations(result.data);
          setFilteredLocations(result.data);
          // Update pagination info if available
          if (result.pagination) {
            setCurrentPage(result.pagination.page);
            setItemsPerPage(result.pagination.limit);
            setTotalPages(result.pagination.totalPages);
          }
        } else {
          setLocations([]);
          setFilteredLocations([]);
          toast.error(t('messages.fetchError'));
        }
      } else {
        setLocations([]);
        setFilteredLocations([]);
        toast.error(t('messages.fetchError'));
      }
    } catch (error) {
      setLocations([]);
      setFilteredLocations([]);
      toast.error(t('messages.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleCityFilter = (value: string) => {
    setCityFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  // For now, we'll use the locations directly since server-side sorting is not implemented
  const displayLocations = locations;

  const handleAddLocation = async () => {
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(t('messages.locationCreated'));
          setIsAddModalOpen(false);
          resetForm();
          fetchLocations();
        } else {
          toast.error(result.error || t('messages.createError'));
        }
      } else {
        toast.error(t('messages.createError'));
      }
    } catch (error) {
      toast.error(t('messages.createError'));
    }
  };

  const handleUpdateLocation = async () => {
    if (!selectedLocation) return;

    try {
      const response = await fetch(`/api/locations/${selectedLocation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(t('messages.locationUpdated'));
          setIsEditModalOpen(false);
          resetForm();
          fetchLocations();
        } else {
          toast.error(result.error || t('messages.updateError'));
        }
      } else {
        toast.error(t('messages.updateError'));
      }
    } catch (error) {
      toast.error(t('messages.updateError'));
    }
  };

  const handleDeleteLocation = async (location: Location) => {
    if (!confirm(t('messages.confirmDelete'))) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/locations/${location.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(t('messages.locationDeleted'));
          fetchLocations();
        } else {
          toast.error(result.error || t('messages.deleteError'));
        }
      } else {
        toast.error(t('messages.deleteError'));
      }
    } catch (error) {
      toast.error(t('messages.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      latitude: '',
      longitude: '',
      is_active: true,
    });
  };

  const openEditModal = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      description: location.description || '',
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      zip_code: location.zip_code || '',
      country: location.country || '',
      latitude: location.latitude?.toString() || '',
      longitude: location.longitude?.toString() || '',
      is_active: location.is_active,
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (location: Location) => {
    setSelectedLocation(location);
    setIsViewModalOpen(true);
  };

  const uniqueCities = useMemo(() => {
    const cities = locations.map(location => location.city).filter(Boolean) as string[];
    return [...new Set(cities)].sort();
  }, [locations]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-2">{t('description')}</p>
          </div>
          <PermissionContent action="create" subject="Location">
            <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('addLocation')}
            </Button>
          </PermissionContent>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('searchLocations')}
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatus')}</SelectItem>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="inactive">{t('inactive')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={handleCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allCities')}</SelectItem>
                  {uniqueCities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={value => setItemsPerPage(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 {t('perPage')}</SelectItem>
                  <SelectItem value="10">10 {t('perPage')}</SelectItem>
                  <SelectItem value="25">25 {t('perPage')}</SelectItem>
                  <SelectItem value="50">50 {t('perPage')}</SelectItem>
                  <SelectItem value="100">100 {t('perPage')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Locations Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('locations')} ({locations.length})
            </CardTitle>
            <CardDescription>{t('manageAllLocations')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">Name {getSortIcon('name')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('city')}>
                      <div className="flex items-center gap-2">City {getSortIcon('city')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('state')}>
                      <div className="flex items-center gap-2">State {getSortIcon('state')}</div>
                    </TableHead>
                    <TableHead>{t('address')}</TableHead>
                    <TableHead>{t('coordinates')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayLocations.map(location => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/modules/location-management/${location.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {location.name}
                        </Link>
                      </TableCell>
                      <TableCell>{location.city || '-'}</TableCell>
                      <TableCell>{location.state || '-'}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{location.address || '-'}</div>
                      </TableCell>
                      <TableCell>
                        {location.latitude && location.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${typeof location.latitude === 'number' ? location.latitude.toFixed(6) : parseFloat(location.latitude as string).toFixed(6)},${typeof location.longitude === 'number' ? location.longitude.toFixed(6) : parseFloat(location.longitude as string).toFixed(6)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {typeof location.latitude === 'number'
                              ? location.latitude.toFixed(6)
                              : parseFloat(location.latitude as string).toFixed(6)}
                            ,{' '}
                            {typeof location.longitude === 'number'
                              ? location.longitude.toFixed(6)
                              : parseFloat(location.longitude as string).toFixed(6)}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.is_active ? 'default' : 'secondary'}>
                          {location.is_active ? t('active') : t('inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PermissionContent action="read" subject="Location">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewModal(location)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </PermissionContent>
                          <PermissionContent action="update" subject="Location">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(location)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionContent>
                          <PermissionContent action="delete" subject="Location">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLocation(location)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionContent>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  {t('pagination.showing')} {(currentPage - 1) * itemsPerPage + 1}{' '}
                  {t('pagination.to')} {Math.min(currentPage * itemsPerPage, locations.length)}{' '}
                  {t('pagination.of')} {locations.length} {t('pagination.results')}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('previous')}
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          className="w-8 h-8 p-0"
                        >
                          1
                        </Button>
                        {currentPage > 4 && <span className="px-2 text-muted-foreground">...</span>}
                      </>
                    )}

                    {/* Current page and surrounding pages */}
                    {(() => {
                      const pages: number[] = [];
                      const startPage = Math.max(1, currentPage - 1);
                      const endPage = Math.min(totalPages, currentPage + 1);

                      for (let page = startPage; page <= endPage; page++) {
                        pages.push(page);
                      }

                      return pages.map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ));
                    })()}

                    {/* Last page */}
                    {currentPage < totalPages - 1 && (
                      <>
                        {currentPage < totalPages - 2 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {t('next')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Location Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('addLocation')}</DialogTitle>
              <DialogDescription>{t('createNewLocation')}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('locationName')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('placeholders.enterLocationName')}
                />
              </div>
              <div>
                <Label htmlFor="city">{t('city')}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder={t('placeholders.enterCity')}
                />
              </div>
              <div>
                <Label htmlFor="state">{t('state')}</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder={t('placeholders.enterState')}
                />
              </div>
              <div>
                <Label htmlFor="zip_code">{t('zipCode')}</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={e => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                  placeholder={t('placeholders.enterZipCode')}
                />
              </div>
              <div>
                <Label htmlFor="country">{t('country')}</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder={t('placeholders.enterCountry')}
                />
              </div>
              <div>
                <Label htmlFor="latitude">{t('latitude')}</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={e => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder={t('placeholders.enterLatitude')}
                />
              </div>
              <div>
                <Label htmlFor="longitude">{t('longitude')}</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={e => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder={t('placeholders.enterLongitude')}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">{t('fullAddress')}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={t('placeholders.enterFullAddress')}
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('placeholders.enterLocationDescription')}
                  rows={3}
                />
              </div>
              <div className="md:col-span-2 flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">{t('activeLocation')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleAddLocation}>{t('addLocation')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Location Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('editLocation')}</DialogTitle>
              <DialogDescription>{t('updateLocationDetails')}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">{t('locationName')} *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('placeholders.enterLocationName')}
                />
              </div>
              <div>
                <Label htmlFor="edit-city">{t('city')}</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder={t('placeholders.enterCity')}
                />
              </div>
              <div>
                <Label htmlFor="edit-state">{t('state')}</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder={t('placeholders.enterState')}
                />
              </div>
              <div>
                <Label htmlFor="edit-zip_code">{t('zipCode')}</Label>
                <Input
                  id="edit-zip_code"
                  value={formData.zip_code}
                  onChange={e => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                  placeholder={t('placeholders.enterZipCode')}
                />
              </div>
              <div>
                <Label htmlFor="edit-country">{t('country')}</Label>
                <Input
                  id="edit-country"
                  value={formData.country}
                  onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder={t('placeholders.enterCountry')}
                />
              </div>
              <div>
                <Label htmlFor="edit-latitude">{t('latitude')}</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={e => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder={t('placeholders.enterLatitude')}
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude">{t('longitude')}</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={e => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder={t('placeholders.enterLongitude')}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="edit-address">{t('fullAddress')}</Label>
                <Textarea
                  id="edit-address"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={t('placeholders.enterFullAddress')}
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="edit-description">{t('description')}</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('placeholders.enterLocationDescription')}
                  rows={3}
                />
              </div>
              <div className="md:col-span-2 flex items-center space-x-2">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="edit-is_active">{t('activeLocation')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleUpdateLocation}>{t('editLocation')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Location Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('locationDetails')}</DialogTitle>
              <DialogDescription>{t('completeLocationInfo')}</DialogDescription>
            </DialogHeader>
            {selectedLocation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">{t('name')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('status')}</Label>
                    <Badge variant={selectedLocation.is_active ? 'default' : 'secondary'}>
                      {selectedLocation.is_active ? t('active') : t('inactive')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('city')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.city || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('state')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.state || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('country')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.country || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('zipCode')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.zip_code || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">{t('address')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.address || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('latitude')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.latitude || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('longitude')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.longitude || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">{t('description')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.description || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('created')}</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedLocation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('lastUpdated')}</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedLocation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                {t('close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
