"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Eye, Edit, Trash2, Plus, Settings, Bell, Shield, Globe, Database, Palette } from "lucide-react";
import { toast } from "sonner";

interface Setting {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string;
  type: "string" | "boolean" | "number" | "json";
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
    id: "1",
    category: "general",
    key: "company_name",
    value: "SND Rental Management",
    description: "Company name displayed throughout the application",
    type: "string",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    category: "general",
    key: "company_email",
    value: "info@sndrental.com",
    description: "Primary company email address",
    type: "string",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "3",
    category: "notifications",
    key: "email_notifications",
    value: "true",
    description: "Enable email notifications",
    type: "boolean",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "4",
    category: "notifications",
    key: "sms_notifications",
    value: "false",
    description: "Enable SMS notifications",
    type: "boolean",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "5",
    category: "security",
    key: "session_timeout",
    value: "3600",
    description: "Session timeout in seconds",
    type: "number",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "6",
    category: "localization",
    key: "default_language",
    value: "en",
    description: "Default application language",
    type: "string",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "7",
    category: "localization",
    key: "timezone",
    value: "UTC",
    description: "Default timezone",
    type: "string",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "8",
    category: "appearance",
    key: "theme",
    value: "light",
    description: "Application theme",
    type: "string",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "9",
    category: "database",
    key: "backup_frequency",
    value: "daily",
    description: "Database backup frequency",
    type: "string",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "10",
    category: "database",
    key: "backup_retention",
    value: "30",
    description: "Number of days to retain backups",
    type: "number",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  }
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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
    if (confirm("Are you sure you want to delete this setting?")) {
      // Simulate API call
      setTimeout(() => {
        toast.success("Setting deleted successfully");
        // Refresh data
        setLoading(true);
        setTimeout(() => {
          const updatedData = mockSettings.filter(setting => setting.id !== id);
          const filteredData = updatedData.filter(setting => {
            const matchesSearch = setting.key.toLowerCase().includes(search.toLowerCase()) ||
                                 setting.description.toLowerCase().includes(search.toLowerCase()) ||
                                 setting.value.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = category === "all" || setting.category === category;
            const matchesStatus = status === "all" ||
                                 (status === "active" && setting.is_active) ||
                                 (status === "inactive" && !setting.is_active);
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
            prev_page_url: currentPage > 1 ? `/settings?page=${currentPage - 1}` : null
          });
          setLoading(false);
        }, 300);
      }, 500);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      general: "bg-blue-100 text-blue-800",
      notifications: "bg-yellow-100 text-yellow-800",
      security: "bg-red-100 text-red-800",
      localization: "bg-green-100 text-green-800",
      appearance: "bg-purple-100 text-purple-800",
      database: "bg-orange-100 text-orange-800"
    };
    return <Badge className={categoryColors[category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"}>{category}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      string: "bg-blue-100 text-blue-800",
      boolean: "bg-green-100 text-green-800",
      number: "bg-purple-100 text-purple-800",
      json: "bg-orange-100 text-orange-800"
    };
    return <Badge className={typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}>{type}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      general: Settings,
      notifications: Bell,
      security: Shield,
      localization: Globe,
      appearance: Palette,
      database: Database
    };
    const Icon = icons[category as keyof typeof icons] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Settings Management</h1>
        </div>
        <Link href="/modules/settings/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Setting
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search settings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="localization">Localization</SelectItem>
                  <SelectItem value="appearance">Appearance</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings?.data.map((setting) => (
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
                        <Link href={`/modules/settings/${setting.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/modules/settings/${setting.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(setting.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                Showing {((settings.current_page - 1) * settings.per_page) + 1} to{" "}
                {Math.min(settings.current_page * settings.per_page, settings.total)} of{" "}
                {settings.total} results
              </div>
              <Pagination>
                <PaginationContent>
                  {settings.prev_page_url && (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(settings.current_page - 1);
                        }}
                      />
                    </PaginationItem>
                  )}
                  {Array.from({ length: settings.last_page }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={page === settings.current_page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {settings.next_page_url && (
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(settings.current_page + 1);
                        }}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
