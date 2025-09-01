'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';


import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/hooks/use-i18n';
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { ArrowLeft, Building, Calendar, Edit, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export default function LocationDetailPage() {
  const { t } = useTranslation(['common', 'location']);
  const { isRTL } = useI18n();
  const { user, hasPermission } = useRBAC();
  const params = useParams();
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchLocation();
    }
  }, [params.id]);

  const fetchLocation = async () => {
    try {
      const response = await fetch(`/api/locations/${params.id}`);
      if (response.ok) {
        const result = (await response.json()) as { success: boolean; data?: Location };
        if (result.success && result.data) {
          setLocation(result.data);
        } else {
          toast.error(t('location:messages.fetchError'));
          router.push('/modules/location-management');
        }
      } else {
        toast.error(t('location:messages.fetchError'));
        router.push('/modules/location-management');
      }
    } catch (error) {
      toast.error(t('location:messages.fetchError'));
      router.push('/modules/location-management');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!location) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Location Not Found</h1>
            <p className="text-gray-600 mb-6">The requested location could not be found.</p>
            <Link href="/modules/location-management">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Locations
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link href="/modules/location-management">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{location.name}</h1>
              <p className="text-gray-600 mt-2">{t('location:description')}</p>
            </div>
          </div>
          <PermissionContent action="update" subject="Location">
            <Link href={`/modules/location-management/${location.id}/edit`}>
              <Button className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                {t('location:editLocation')}
              </Button>
            </Link>
          </PermissionContent>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Location Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t('location:locationDetails')}
                </CardTitle>
                <CardDescription>{t('location:completeLocationInfo')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium">{t('location:name')}</Label>
                    <p className="text-sm text-gray-600 mt-1">{location.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location:status')}</Label>
                    <div className="mt-1">
                      <Badge variant={location.is_active ? 'default' : 'secondary'}>
                        {location.is_active ? t('location:active') : t('location:inactive')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location:city')}</Label>
                    <p className="text-sm text-gray-600 mt-1">{location.city || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location:state')}</Label>
                    <p className="text-sm text-gray-600 mt-1">{location.state || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location:country')}</Label>
                    <p className="text-sm text-gray-600 mt-1">{location.country || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location:zipCode')}</Label>
                    <p className="text-sm text-gray-600 mt-1">{location.zip_code || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">{t('location:address')}</Label>
                    <p className="text-sm text-gray-600 mt-1">{location.address || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location:latitude')}</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {location.latitude
                        ? typeof location.latitude === 'number'
                          ? location.latitude.toFixed(6)
                          : parseFloat(location.latitude as string).toFixed(6)
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location:longitude')}</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {location.longitude
                        ? typeof location.longitude === 'number'
                          ? location.longitude.toFixed(6)
                          : parseFloat(location.longitude as string).toFixed(6)
                        : 'N/A'}
                    </p>
                  </div>
                  {location.latitude && location.longitude && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">{t('location:mapLink')}</Label>
                      <p className="text-sm mt-1">
                        <a
                          href={`https://www.google.com/maps?q=${typeof location.latitude === 'number' ? location.latitude.toFixed(6) : parseFloat(location.latitude as string).toFixed(6)},${typeof location.longitude === 'number' ? location.longitude.toFixed(6) : parseFloat(location.longitude as string).toFixed(6)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {t('location:openInGoogleMaps')}
                        </a>
                      </p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">{t('location:description')}</Label>
                    <p className="text-sm text-gray-600 mt-1">{location.description || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Information */}
          <div className="space-y-6">
            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('common:common.createdAt')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">{t('location:created')}</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(location.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('location:lastUpdated')}</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(location.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <PermissionContent action="update" subject="Location">
                    <Link href={`/modules/location-management/${location.id}/edit`}>
                      <Button variant="outline" className="w-full justify-start">
                        <Edit className="h-4 w-4 mr-2" />
                        {t('location:editLocation')}
                      </Button>
                    </Link>
                  </PermissionContent>
                  <Link href="/modules/location-management">
                    <Button variant="outline" className="w-full justify-start">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Locations
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
