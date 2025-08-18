'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
import { PermissionContent, RoleContent } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Database,
  Edit,
  Eye,
  Globe,
  Palette,
  Plus,
  Settings,
  Shield,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
// i18n refactor: All user-facing strings now use useTranslation('settings')
import { useTranslation } from 'react-i18next';

interface Setting {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'boolean' | 'number' | 'json';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SettingResponse {
  data: Setting[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

// Mock data
const mockSettings: Setting[] = [
  {
    id: '1',
    category: 'general',
    key: 'company_name',
    value: 'SND Rental Management',
    description: 'Company name displayed throughout the application',
    type: 'string',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    category: 'general',
    key: 'company_email',
    value: 'info@sndrental.com',
    description: 'Primary company email address',
    type: 'string',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    category: 'notifications',
    key: 'email_notifications',
    value: 'true',
    description: 'Enable email notifications',
    type: 'boolean',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '4',
    category: 'notifications',
    key: 'sms_notifications',
    value: 'false',
    description: 'Enable SMS notifications',
    type: 'boolean',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '5',
    category: 'security',
    key: 'session_timeout',
    value: '3600',
    description: 'Session timeout in seconds',
    type: 'number',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '6',
    category: 'localization',
    key: 'default_language',
    value: 'en',
    description: 'Default application language',
    type: 'string',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '7',
    category: 'localization',
    key: 'timezone',
    value: 'UTC',
    description: 'Default timezone',
    type: 'string',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '8',
    category: 'appearance',
    key: 'theme',
    value: 'light',
    description: 'Application theme',
    type: 'string',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '9',
    category: 'database',
    key: 'backup_frequency',
    value: 'daily',
    description: 'Database backup frequency',
    type: 'string',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '10',
    category: 'database',
    key: 'backup_retention',
    value: '30',
    description: 'Number of days to retain backups',
    type: 'number',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

export default function SettingsPage() {
  const { t } = useTranslation('settings');
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [settings, setSettings] = useState<SettingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Get allowed actions for settings management
  const allowedActions = getAllowedActions('Settings');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: perPage.toString(),
          ...(search && { search }),
          ...(category && category !== 'all' && { category }),
          ...(status && status !== 'all' && { status }),
        });

        const response = await fetch(`/api/settings?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to fetch settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [search, category, status, perPage, currentPage]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this setting?')) {
      // Simulate API call
      setTimeout(() => {
        toast.success('Setting deleted successfully');
        // Refresh data
        setLoading(true);
        setTimeout(() => {
          const updatedData = mockSettings.filter(setting => setting.id !== id);
          const filteredData = updatedData.filter(setting => {
            const matchesSearch =
              setting.key.toLowerCase().includes(search.toLowerCase()) ||
              setting.description.toLowerCase().includes(search.toLowerCase()) ||
              setting.value.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = category === 'all' || setting.category === category;
            const matchesStatus =
              status === 'all' ||
              (status === 'active' && setting.is_active) ||
              (status === 'inactive' && !setting.is_active);
            return matchesSearch && matchesCategory && matchesStatus;
          });

          const total = filteredData.length;
          const lastPage = Math.ceil(total / perPage);
          const startIndex = (currentPage - 1) * perPage;
          const endIndex = startIndex + perPage;
          const paginatedData = filteredData.slice(startIndex, endIndex);

          setSettings({
            data: paginatedData,
            current_page: currentPage,
            last_page: lastPage,
            per_page: perPage,
            total,
            next_page_url: currentPage < lastPage ? `/settings?page=${currentPage + 1}` : null,
            prev_page_url: currentPage > 1 ? `/settings?page=${currentPage - 1}` : null,
          });
          setLoading(false);
        }, 300);
      }, 500);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">{t('settings.active')}</Badge>
    ) : (
      <Badge variant="secondary">{t('settings.inactive')}</Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      general: 'bg-blue-100 text-blue-800',
      notifications: 'bg-yellow-100 text-yellow-800',
      security: 'bg-red-100 text-red-800',
      localization: 'bg-green-100 text-green-800',
      appearance: 'bg-purple-100 text-purple-800',
      database: 'bg-orange-100 text-orange-800',
    };
    return (
      <Badge
        className={
          categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'
        }
      >
        {category}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      string: 'bg-blue-100 text-blue-800',
      boolean: 'bg-green-100 text-green-800',
      number: 'bg-purple-100 text-purple-800',
      json: 'bg-orange-100 text-orange-800',
    };
    return (
      <Badge className={typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      general: Settings,
      notifications: Bell,
      security: Shield,
      localization: Globe,
      appearance: Palette,
      database: Database,
    };
    const Icon = icons[category as keyof typeof icons] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('settings.loading')}</div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'Settings' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
          </div>
          <PermissionContent action="create" subject="Settings">
            <Link href="/modules/settings/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('settings.addSetting')}
              </Button>
            </Link>
          </PermissionContent>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.applicationSettings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder={t('settings.searchPlaceholder')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('settings.allCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('settings.allCategories')}</SelectItem>
                    <SelectItem value="general">{t('settings.general')}</SelectItem>
                    <SelectItem value="notifications">{t('settings.notifications')}</SelectItem>
                    <SelectItem value="security">{t('settings.security')}</SelectItem>
                    <SelectItem value="localization">{t('settings.localization')}</SelectItem>
                    <SelectItem value="appearance">{t('settings.appearance')}</SelectItem>
                    <SelectItem value="database">{t('settings.database')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={t('settings.allStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('settings.allStatus')}</SelectItem>
                    <SelectItem value="active">{t('settings.active')}</SelectItem>
                    <SelectItem value="inactive">{t('settings.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('settings.setting')}</TableHead>
                    <TableHead>{t('settings.category')}</TableHead>
                    <TableHead>{t('settings.value')}</TableHead>
                    <TableHead>{t('settings.type')}</TableHead>
                    <TableHead>{t('settings.status')}</TableHead>
                    <TableHead className="text-right">{t('settings.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings?.data.map(setting => (
                    <TableRow key={setting.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{setting.key}</div>
                          <div className="text-sm text-gray-500">{setting.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(setting.category)}
                          {getCategoryBadge(setting.category)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={setting.value}>
                          {setting.value}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(setting.type)}</TableCell>
                      <TableCell>{getStatusBadge(setting.is_active)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <PermissionContent action="read" subject="Settings">
                            <Link href={`/modules/settings/${setting.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </PermissionContent>
                          <PermissionContent action="update" subject="Settings">
                            <Link href={`/modules/settings/${setting.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </PermissionContent>
                          <PermissionContent action="delete" subject="Settings">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(setting.id)}
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

            {settings && settings.last_page > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  {t('settings.showingResults', {
                    start: (settings.current_page - 1) * settings.per_page + 1,
                    end: Math.min(settings.current_page * settings.per_page, settings.total),
                    total: settings.total,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, settings.current_page - 1))}
                    disabled={settings.current_page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('settings.previous')}
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* First page */}
                    {settings.current_page > 2 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          className="w-8 h-8 p-0"
                        >
                          1
                        </Button>
                        {settings.current_page > 3 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                      </>
                    )}

                    {/* Current page and surrounding pages */}
                    {(() => {
                      const pages: number[] = [];
                      const startPage = Math.max(1, settings.current_page - 1);
                      const endPage = Math.min(settings.last_page, settings.current_page + 1);

                      for (let page = startPage; page <= endPage; page++) {
                        pages.push(page);
                      }

                      return pages.map(page => (
                        <Button
                          key={page}
                          variant={settings.current_page === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ));
                    })()}

                    {/* Last page */}
                    {settings.current_page < settings.last_page - 1 && (
                      <>
                        {settings.current_page < settings.last_page - 2 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(settings.last_page)}
                          className="w-8 h-8 p-0"
                        >
                          {settings.last_page}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(settings.last_page, settings.current_page + 1))
                    }
                    disabled={settings.current_page === settings.last_page}
                  >
                    {t('settings.next')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role-based content for administrators */}
        <RoleContent role="ADMIN">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.administration')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <PermissionContent action="manage" subject="Settings">
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    {t('settings.systemConfiguration')}
                  </Button>
                </PermissionContent>
                <PermissionContent action="manage" subject="Settings">
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    {t('settings.databaseSettings')}
                  </Button>
                </PermissionContent>
                <PermissionContent action="manage" subject="Settings">
                  <Button variant="outline">
                    <Globe className="h-4 w-4 mr-2" />
                    {t('settings.localizationSettings')}
                  </Button>
                </PermissionContent>
              </div>
            </CardContent>
          </Card>
        </RoleContent>
      </div>
    </ProtectedRoute>
  );
}
