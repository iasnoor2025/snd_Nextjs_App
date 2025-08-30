'use client';

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
              Safety Management
            </h1>
            <p className="text-muted-foreground">Monitor and manage safety incidents and compliance</p>
          </div>
          <div className="flex gap-2">
            {hasPermission('create', 'Safety') && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Report Incident
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.open}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Investigation</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.investigating}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
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
            <CardTitle>Safety Incidents</CardTitle>
            <CardDescription>Monitor and manage all reported safety incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading incidents...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Cost</TableHead>
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
