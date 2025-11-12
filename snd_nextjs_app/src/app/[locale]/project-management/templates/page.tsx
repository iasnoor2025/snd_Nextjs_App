'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import ApiService from '@/lib/api-service';
import {
  Building2,
  Calendar,
  Copy,
  DollarSign,
  Edit,
  FileText,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useParams } from 'next/navigation';
interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimated_duration: number;
  estimated_budget: number;
  complexity: string;
  team_size: number;
  phases: TemplatePhase[];
  tasks: TemplateTask[];
  resources: TemplateResource[];
  created_at: string;
  updated_at: string;
  usage_count: number;
}

interface TemplatePhase {
  id: string;
  name: string;
  description: string;
  duration: number;
  order: number;
}

interface TemplateTask {
  id: string;
  name: string;
  description: string;
  phase_id: string;
  estimated_hours: number;
  priority: string;
  dependencies: string[];
}

interface TemplateResource {
  id: string;
  type: string;
  name: string;
  quantity: number;
  daily_rate?: number;
  unit_cost?: number;
}

export default function ProjectTemplatesPage() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [complexity, setComplexity] = useState('all');
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    estimatedDuration: '',
    estimatedBudget: '',
    complexity: 'medium',
    teamSize: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/project-templates');
      if (response.success) {
        setTemplates(response.data || []);
      } else {
        toast.error('Failed to load templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.post('/project-templates', {
        ...formData,
        estimatedDuration: parseInt(formData.estimatedDuration) || 0,
        estimatedBudget: parseFloat(formData.estimatedBudget) || 0,
        teamSize: parseInt(formData.teamSize) || 0,
      });

      if (response.success) {
        toast.success('Template created successfully');
        setDialogOpen(false);
        setFormData({
          name: '',
          description: '',
          category: '',
          estimatedDuration: '',
          estimatedBudget: '',
          complexity: 'medium',
          teamSize: '',
        });
        fetchTemplates();
      } else {
        toast.error(response.message || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template: ProjectTemplate) => {
    try {
      const response = await ApiService.post(`/project-templates/${template.id}/create-project`, {
        name: `${template.name} - New Project`,
        description: template.description,
        budget: template.estimatedBudget,
      });

      if (response.success) {
        toast.success('Project created successfully from template');
        window.location.href = `/${locale}/project-management/${response.data.id}`;
      } else {
        toast.error(response.message || 'Failed to create project from template');
      }
    } catch (error) {
      console.error('Error creating project from template:', error);
      toast.error('Failed to create project from template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      // TODO: Project template delete endpoint doesn't exist yet
      // await apiService.delete(`/project-templates/${templateId}`);
      toast.success('Template delete feature not implemented yet');
      // fetchTemplates();
    } catch (error) {
      
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (template: ProjectTemplate) => {
    try {
      const duplicateData = {
        ...template,
        name: `${template.name} (Copy)`,
        id: undefined,
      };
      delete duplicateData.id;

      // TODO: Project template create endpoint doesn't exist yet
      // await apiService.post('/project-templates', duplicateData);
      toast.success('Template duplicate feature not implemented yet');
      // fetchTemplates();
    } catch (error) {
      
      toast.error('Failed to duplicate template');
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'complex':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'residential':
        return 'bg-blue-100 text-blue-800';
      case 'commercial':
        return 'bg-purple-100 text-purple-800';
      case 'industrial':
        return 'bg-orange-100 text-orange-800';
      case 'infrastructure':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      !search ||
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || template.category === category;
    const matchesComplexity = complexity === 'all' || template.complexity === complexity;
    return matchesSearch && matchesCategory && matchesComplexity;
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));
  const complexities = Array.from(new Set(templates.map(t => t.complexity)));

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Project Templates</h1>
          <p className="text-muted-foreground">
            Create and manage project templates for quick setup
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Create a new project template with predefined phases, tasks, and resources.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the template"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimated_duration">Estimated Duration (days)</Label>
                    <Input
                      id="estimated_duration"
                      type="number"
                      value={formData.estimatedDuration}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))
                      }
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_budget">Estimated Budget</Label>
                    <Input
                      id="estimated_budget"
                      type="number"
                      value={formData.estimatedBudget}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, estimatedBudget: e.target.value }))
                      }
                      placeholder="100000"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complexity">Complexity</Label>
                    <Select
                      value={formData.complexity}
                      onValueChange={value => setFormData(prev => ({ ...prev, complexity: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="complex">Complex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team_size">Team Size</Label>
                    <Input
                      id="team_size"
                      type="number"
                      value={formData.teamSize}
                      onChange={e => setFormData(prev => ({ ...prev, teamSize: e.target.value }))}
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Template'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={complexity} onValueChange={setComplexity}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by complexity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Complexities</SelectItem>
              {complexities.map(comp => (
                <SelectItem key={comp} value={comp}>
                  {comp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-2">{template.description}</CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateTemplate(template)}
                    title="Duplicate template"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={getCategoryColor(template.category)}>{template.category}</Badge>
                <Badge className={getComplexityColor(template.complexity)}>
                  {template.complexity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Duration
                  </span>
                  <span>{template.estimated_duration} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Budget
                  </span>
                  <span>SAR {template.estimated_budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Team Size
                  </span>
                  <span>{template.team_size} people</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    Phases
                  </span>
                  <span>{template.phases?.length || 0} phases</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Building2 className="h-4 w-4 mr-1" />
                    Tasks
                  </span>
                  <span>{template.tasks?.length || 0} tasks</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Used
                  </span>
                  <span>{template.usage_count || 0} times</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button className="w-full" onClick={() => handleUseTemplate(template)}>
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {search || category !== 'all' || complexity !== 'all'
                ? 'No templates match your current filters.'
                : 'Get started by creating your first project template.'}
            </p>
            {!search && category === 'all' && complexity === 'all' && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
