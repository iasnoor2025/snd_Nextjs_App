'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Target,
  Calendar,
  PieChart,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import apiService from '@/lib/api';

interface Project {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  budget: number;
  status: string;
  progress: number;
}

interface ReportData {
  progress: {
    overall: number;
    byPhase: Array<{
      phase: string;
      progress: number;
      tasks: number;
      completed: number;
    }>;
  };
  cost: {
    planned: number;
    actual: number;
    variance: number;
    byCategory: Array<{
      category: string;
      planned: number;
      actual: number;
      variance: number;
    }>;
  };
  resources: {
    total: number;
    allocated: number;
    utilization: number;
    byType: Array<{
      type: string;
      count: number;
      utilization: number;
      cost: number;
    }>;
  };
  risks: Array<{
    id: string;
    title: string;
    description: string;
    probability: number;
    impact: number;
    severity: string;
    status: string;
    mitigation: string;
  }>;
  timeline: {
    onSchedule: number;
    delayed: number;
    completed: number;
    milestones: Array<{
      id: string;
      name: string;
      due_date: string;
      status: string;
      completion: number;
    }>;
  };
}

export default function ProjectReportsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchReportData();
  }, [projectId, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectRes = await apiService.get<{ data: Project }>(`/projects/${projectId}`);
      setProject(projectRes.data);
      
      // TODO: Project reports endpoint doesn't exist yet, so we'll set empty data
      // Implement this when the endpoint becomes available
      setReportData({
        progress: { overall: 0, byPhase: [] },
        cost: { planned: 0, actual: 0, variance: 0, byCategory: [] },
        resources: { total: 0, allocated: 0, utilization: 0, byType: [] },
        risks: [],
        timeline: { onSchedule: 0, delayed: 0, completed: 0, milestones: [] }
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (type: string) => {
    try {
      toast.loading('Generating report...');
      // TODO: Project report export endpoint doesn't exist yet
      // Implement this when the endpoint becomes available
      toast.success('Report export feature not implemented yet');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!project || !reportData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Report data not available</h3>
            <p className="text-muted-foreground">Unable to load project report data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Reports</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleExportReport('comprehensive')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.progress.overall}%</div>
            <Progress value={reportData.progress.overall} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Variance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.abs(reportData.cost.variance).toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {reportData.cost.variance >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              )}
              {reportData.cost.variance >= 0 ? 'Over' : 'Under'} budget
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.resources.utilization}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData.resources.allocated} of {reportData.resources.total} resources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.timeline.onSchedule}/{reportData.timeline.onSchedule + reportData.timeline.delayed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData.timeline.delayed} delayed tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress by Phase */}
            <Card>
              <CardHeader>
                <CardTitle>Progress by Phase</CardTitle>
                <CardDescription>Project progress breakdown by phases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.progress.byPhase.map((phase) => (
                    <div key={phase.phase} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{phase.phase}</span>
                        <span className="text-sm text-muted-foreground">
                          {phase.completed}/{phase.tasks} tasks
                        </span>
                      </div>
                      <Progress value={phase.progress} className="h-2" />
                      <div className="text-sm text-muted-foreground">
                        {phase.progress}% complete
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Budget vs actual costs by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.cost.byCategory.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.category}</span>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Planned: </span>
                          <span>${category.planned.toLocaleString()}</span>
                          <span className="text-muted-foreground ml-2">Actual: </span>
                          <span>${category.actual.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(category.actual / category.planned) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {category.variance >= 0 ? '+' : ''}${category.variance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Progress Report</CardTitle>
              <CardDescription>Comprehensive project progress analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Progress Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.progress.byPhase.filter(p => p.progress === 100).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed Phases</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.progress.byPhase.filter(p => p.progress > 0 && p.progress < 100).length}
                    </div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-gray-600">
                      {reportData.progress.byPhase.filter(p => p.progress === 0).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Not Started</div>
                  </div>
                </div>

                {/* Phase Details */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phase</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.progress.byPhase.map((phase) => (
                      <TableRow key={phase.phase}>
                        <TableCell className="font-medium">{phase.phase}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={phase.progress} className="w-20" />
                            <span className="text-sm">{phase.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{phase.tasks}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(phase.progress === 100 ? 'completed' : phase.progress > 0 ? 'in_progress' : 'pending')}>
                            {phase.progress === 100 ? 'Completed' : phase.progress > 0 ? 'In Progress' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis Report</CardTitle>
              <CardDescription>Detailed cost tracking and variance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Cost Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      ${reportData.cost.planned.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Planned Budget</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-green-600">
                      ${reportData.cost.actual.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Actual Cost</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className={`text-2xl font-bold ${reportData.cost.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {reportData.cost.variance >= 0 ? '+' : ''}${reportData.cost.variance.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Variance</div>
                  </div>
                </div>

                {/* Cost Breakdown Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Planned</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Variance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.cost.byCategory.map((category) => (
                      <TableRow key={category.category}>
                        <TableCell className="font-medium">{category.category}</TableCell>
                        <TableCell>${category.planned.toLocaleString()}</TableCell>
                        <TableCell>${category.actual.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className={`flex items-center ${category.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {category.variance >= 0 ? '+' : ''}${category.variance.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center ${category.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {category.planned > 0 ? `${((category.variance / category.planned) * 100).toFixed(1)}%` : 'N/A'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization Report</CardTitle>
              <CardDescription>Resource allocation and utilization analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Resource Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.resources.total}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Resources</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.resources.allocated}
                    </div>
                    <div className="text-sm text-muted-foreground">Allocated</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-orange-600">
                      {reportData.resources.utilization}%
                    </div>
                    <div className="text-sm text-muted-foreground">Utilization Rate</div>
                  </div>
                </div>

                {/* Resource by Type */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource Type</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.resources.byType.map((resource) => (
                      <TableRow key={resource.type}>
                        <TableCell className="font-medium">{resource.type}</TableCell>
                        <TableCell>{resource.count}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={resource.utilization} className="w-20" />
                            <span className="text-sm">{resource.utilization}%</span>
                          </div>
                        </TableCell>
                        <TableCell>${resource.cost.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment Report</CardTitle>
              <CardDescription>Project risks and mitigation strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Risk Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-red-600">
                      {reportData.risks.filter(r => r.severity === 'high').length}
                    </div>
                    <div className="text-sm text-muted-foreground">High Risk</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-yellow-600">
                      {reportData.risks.filter(r => r.severity === 'medium').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Medium Risk</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.risks.filter(r => r.severity === 'low').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Low Risk</div>
                  </div>
                </div>

                {/* Risk Details */}
                <div className="space-y-4">
                  {reportData.risks.map((risk) => (
                    <div key={risk.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{risk.title}</h3>
                            <Badge className={getSeverityColor(risk.severity)}>
                              {risk.severity}
                            </Badge>
                            <Badge variant="outline">
                              {risk.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{risk.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Probability: </span>
                              <span>{risk.probability}%</span>
                            </div>
                            <div>
                              <span className="font-medium">Impact: </span>
                              <span>{risk.impact}/10</span>
                            </div>
                          </div>
                          {risk.mitigation && (
                            <div className="mt-3">
                              <span className="font-medium text-sm">Mitigation: </span>
                              <span className="text-sm text-muted-foreground">{risk.mitigation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
