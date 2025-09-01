'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { AlertTriangle, Plus, Search, Filter, FileText, Shield, AlertCircle } from 'lucide-react';
import ApiService from '@/lib/api-service';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface SafetyIncident {
  id: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: number;
  assignedToId?: number;
  location: string;
  incidentDate: string;
  resolvedDate?: string;
  resolution?: string;
  cost?: number;
  createdAt: string;
  updatedAt: string;
  reportedByName?: string;
  reportedByLastName?: string;
  assignedToName?: string;
  assignedToLastName?: string;
}

export default function SafetyManagementPage() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium' as const,
    reportedBy: '',
    assignedToId: '',
    location: '',
    incidentDate: '',
    resolution: '',
    cost: '',
  });

  // Get allowed actions for safety management
  const allowedActions = getAllowedActions('Safety');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/safety-incidents');
      if (response.success) {
        setIncidents(response.data || []);
      } else {
        toast.error('Failed to load safety incidents');
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast.error('Failed to load safety incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.reportedBy || !formData.incidentDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.post('/safety-incidents', formData);
      
      if (response.success) {
        toast.success('Safety incident created successfully');
        setIsCreateDialogOpen(false);
        setFormData({
          title: '',
          description: '',
          severity: 'medium',
          reportedBy: '',
          assignedToId: '',
          location: '',
          incidentDate: '',
          resolution: '',
          cost: '',
        });
        fetchIncidents();
      } else {
        toast.error(response.message || 'Failed to create incident');
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      toast.error('Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'investigating': return 'default';
      case 'resolved': return 'secondary';
      case 'closed': return 'secondary';
      default: return 'default';
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const stats = {
    total: incidents.length,
    open: incidents.filter(i => i.status === 'open').length,
    investigating: incidents.filter(i => i.status === 'investigating').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
    critical: incidents.filter(i => i.severity === 'critical').length,
    high: incidents.filter(i => i.severity === 'high').length,
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              {t('safety:title')}
            </h1>
            <p className="text-muted-foreground">{t('safety:subtitle')}</p>
          </div>
          <div className="flex gap-2">
            {hasPermission('create', 'Safety') && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('safety:actions.reportIncident')}
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('safety:stats.totalIncidents')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('safety:stats.openCases')}</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.open}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('safety:stats.underInvestigation')}</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.investigating}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('safety:stats.criticalIssues')}</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.critical + stats.high}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{t('safety:incidents.title')}</CardTitle>
            <CardDescription>{t('safety:incidents.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('safety:search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('safety:filters.severityPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('safety:filters.allSeverities')}</SelectItem>
                  <SelectItem value="low">{t('safety:severity.low')}</SelectItem>
                  <SelectItem value="medium">{t('safety:severity.medium')}</SelectItem>
                  <SelectItem value="high">{t('safety:severity.high')}</SelectItem>
                  <SelectItem value="critical">{t('safety:severity.critical')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('safety:filters.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('safety:filters.allStatuses')}</SelectItem>
                  <SelectItem value="open">{t('safety:status.open')}</SelectItem>
                  <SelectItem value="investigating">{t('safety:status.investigating')}</SelectItem>
                  <SelectItem value="resolved">{t('safety:status.resolved')}</SelectItem>
                  <SelectItem value="closed">{t('safety:status.closed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">{t('safety:messages.loading')}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('safety:table.headers.title')}</TableHead>
                    <TableHead>{t('safety:table.headers.severity')}</TableHead>
                    <TableHead>{t('safety:table.headers.status')}</TableHead>
                    <TableHead>{t('safety:table.headers.location')}</TableHead>
                    <TableHead>{t('safety:table.headers.reportedBy')}</TableHead>
                    <TableHead>{t('safety:table.headers.date')}</TableHead>
                    <TableHead>{t('safety:table.headers.cost')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-medium">{incident.title}</TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{incident.location}</TableCell>
                      <TableCell>
                        {incident.reportedByName} {incident.reportedByLastName}
                      </TableCell>
                      <TableCell>{new Date(incident.incidentDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {incident.cost ? `SAR ${incident.cost.toLocaleString()}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {filteredIncidents.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No incidents found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
