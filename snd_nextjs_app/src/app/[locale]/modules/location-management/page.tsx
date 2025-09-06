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
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  const { getAllowedActions } = useRBAC();
  const [locations, setLocations] = useState<Location[]>([]);
  const [, setFilteredLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Reduced for testing pagination
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
  getAllowedActions('Location');

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
            setTotalPages(result.pagination.totalPages);
            setTotalCount(result.pagination.total);
          }
        } else {
          setLocations([]);
          setFilteredLocations([]);
          toast.error(t('location.messages.fetchError'));
        }
      } else {
        setLocations([]);
        setFilteredLocations([]);
        toast.error(t('location.messages.fetchError'));
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
      setFilteredLocations([]);
      toast.error(t('location.messages.fetchError'));
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
          toast.success(t('location.messages.locationCreated'));
          setIsAddModalOpen(false);
          resetForm();
          fetchLocations();
        } else {
          toast.error(result.error || t('location.messages.createError'));
        }
      } else {
        toast.error(t('location.messages.createError'));
      }
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error(t('location.messages.createError'));
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
          toast.success(t('location.messages.locationUpdated'));
          setIsEditModalOpen(false);
          resetForm();
          fetchLocations();
        } else {
          toast.error(result.error || t('location.messages.updateError'));
        }
      } else {
        toast.error(t('location.messages.updateError'));
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error(t('location.messages.updateError'));
    }
  };

  const handleDeleteLocation = async (location: Location) => {
    if (!confirm(t('location.messages.confirmDelete'))) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/locations/${location.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(t('location.messages.locationDeleted'));
          fetchLocations();
        } else {
          toast.error(result.error || t('location.messages.deleteError'));
        }
      } else {
        toast.error(t('location.messages.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error(t('location.messages.deleteError'));
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
            <h1 className="text-3xl font-bold text-gray-900">{t('location.title')}</h1>
            <p className="text-gray-600 mt-2">{t('location.description')}</p>
          </div>
          <PermissionContent action="create" subject="Location">
            <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('location.addLocation')}
            </Button>
          </PermissionContent>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('location.searchLocations')}
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('location.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('location.allStatus')}</SelectItem>
                  <SelectItem value="active">{t('location.active')}</SelectItem>
                  <SelectItem value="inactive">{t('location.inactive')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={handleCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('location.city')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('location.allCities')}</SelectItem>
                  {uniqueCities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Locations Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('location.locations')} ({totalCount})
            </CardTitle>
            <CardDescription>{t('location.manageAllLocations')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {locations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-lg mb-2">{t('location.noLocationsFound')}</div>
                  <div className="text-gray-400">{t('location.noLocationsDescription')}</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-2">{t('location.name')} {getSortIcon('name')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('city')}>
                        <div className="flex items-center gap-2">{t('location.city')} {getSortIcon('city')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('state')}>
                        <div className="flex items-center gap-2">{t('location.state')} {getSortIcon('state')}</div>
                      </TableHead>
                      <TableHead>{t('location.address')}</TableHead>
                      <TableHead>{t('location.coordinates')}</TableHead>
                      <TableHead>{t('location.status')}</TableHead>
                      <TableHead>{t('location.actions')}</TableHead>
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
                          {location.is_active ? t('location.active') : t('location.inactive')}
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
              )}
            </div>

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-700">
                    {t('common.pagination.showing')} {(currentPage - 1) * itemsPerPage + 1}{' '}
                    {t('common.pagination.to')} {Math.min(currentPage * itemsPerPage, totalCount)}{' '}
                    {t('common.pagination.of')} {totalCount} {t('common.pagination.results')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{t('location.perPage')}:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={value => setItemsPerPage(parseInt(value))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('common.pagination.previous')}
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
                    {t('common.pagination.next')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Location Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('location.addLocation')}</DialogTitle>
              <DialogDescription>{t('location.createNewLocation')}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('location.locationName')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('location.placeholders.enterLocationName')}
                />
              </div>
              <div>
                <Label htmlFor="city">{t('location.city')}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder={t('location.placeholders.enterCity')}
                />
              </div>
              <div>
                <Label htmlFor="state">{t('location.state')}</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder={t('location.placeholders.enterState')}
                />
              </div>
              <div>
                <Label htmlFor="zip_code">{t('location.zipCode')}</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={e => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                  placeholder={t('location.placeholders.enterZipCode')}
                />
              </div>
              <div>
                <Label htmlFor="country">{t('location.country')}</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder={t('location.placeholders.enterCountry')}
                />
              </div>
              <div>
                <Label htmlFor="latitude">{t('location.latitude')}</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={e => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder={t('location.placeholders.enterLatitude')}
                />
              </div>
              <div>
                <Label htmlFor="longitude">{t('location.longitude')}</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={e => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder={t('location.placeholders.enterLongitude')}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">{t('location.fullAddress')}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={t('location.placeholders.enterFullAddress')}
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">{t('location.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('location.placeholders.enterLocationDescription')}
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
                <Label htmlFor="is_active">{t('location.activeLocation')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                {t('location.cancel')}
              </Button>
              <Button onClick={handleAddLocation}>{t('location.addLocation')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Location Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('location.editLocation')}</DialogTitle>
              <DialogDescription>{t('location.updateLocationDetails')}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">{t('locationName')} *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('location.placeholders.enterLocationName')}
                />
              </div>
              <div>
                <Label htmlFor="edit-city">{t('city')}</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder={t('location.placeholders.enterCity')}
                />
              </div>
              <div>
                <Label htmlFor="edit-state">{t('state')}</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder={t('location.placeholders.enterState')}
                />
              </div>
              <div>
                <Label htmlFor="edit-zip_code">{t('zipCode')}</Label>
                <Input
                  id="edit-zip_code"
                  value={formData.zip_code}
                  onChange={e => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                  placeholder={t('location.placeholders.enterZipCode')}
                />
              </div>
              <div>
                <Label htmlFor="edit-country">{t('country')}</Label>
                <Input
                  id="edit-country"
                  value={formData.country}
                  onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder={t('location.placeholders.enterCountry')}
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
                  placeholder={t('location.placeholders.enterLatitude')}
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
                  placeholder={t('location.placeholders.enterLongitude')}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="edit-address">{t('fullAddress')}</Label>
                <Textarea
                  id="edit-address"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={t('location.placeholders.enterFullAddress')}
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="edit-description">{t('description')}</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('location.placeholders.enterLocationDescription')}
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
                {t('location.cancel')}
              </Button>
              <Button onClick={handleUpdateLocation}>{t('location.editLocation')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Location Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('location.locationDetails')}</DialogTitle>
              <DialogDescription>{t('location.completeLocationInfo')}</DialogDescription>
            </DialogHeader>
            {selectedLocation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">{t('location.name')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location.status')}</Label>
                    <Badge variant={selectedLocation.is_active ? 'default' : 'secondary'}>
                      {selectedLocation.is_active ? t('location.active') : t('location.inactive')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location.city')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.city || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location.state')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.state || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location.country')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.country || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location.zipCode')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.zip_code || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">{t('location.address')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.address || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location.latitude')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.latitude || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location.longitude')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.longitude || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">{t('location.description')}</Label>
                    <p className="text-sm text-gray-600">{selectedLocation.description || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location.created')}</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedLocation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location.lastUpdated')}</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedLocation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                {t('location.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
