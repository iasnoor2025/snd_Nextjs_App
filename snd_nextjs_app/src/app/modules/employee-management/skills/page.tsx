'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Filter, Award, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import ApiService from '@/lib/api-service';

interface Skill {
  id: number;
  name: string;
  description?: string;
  category?: string;
  requiredLevel?: string;
  certificationRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SkillsManagementPage() {
  const { data: session } = useSession();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'none',
    requiredLevel: 'none',
    certificationRequired: false,
  });

  const categories = [
    'Technical',
    'Soft Skills',
    'Management',
    'Safety',
    'Equipment',
    'Administrative',
    'Other'
  ];

  const proficiencyLevels = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert'
  ];

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/skills');
      if (response.success) {
        setSkills(response.data);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error('Failed to fetch skills');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare data for API - convert 'none' to empty strings
      const apiData = {
        ...formData,
        category: formData.category === 'none' ? '' : formData.category,
        requiredLevel: formData.requiredLevel === 'none' ? '' : formData.requiredLevel,
      };

      if (editingSkill) {
        await ApiService.put(`/skills/${editingSkill.id}`, apiData);
        toast.success('Skill updated successfully');
      } else {
        await ApiService.post('/skills', apiData);
        toast.success('Skill created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchSkills();
    } catch (error) {
      console.error('Error saving skill:', error);
      toast.error('Failed to save skill');
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      description: skill.description || '',
      category: skill.category || 'none',
      requiredLevel: skill.requiredLevel || 'none',
      certificationRequired: skill.certificationRequired,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (skillId: number) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    
    try {
      await ApiService.delete(`/skills/${skillId}`);
      toast.success('Skill deleted successfully');
      fetchSkills();
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error('Failed to delete skill');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'none',
      requiredLevel: 'none',
      certificationRequired: false,
    });
    setEditingSkill(null);
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (skill.description && skill.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || !selectedCategory || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!session) {
    return <div>Please sign in to access this page.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Skills Management</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Skill
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Skills Grid */}
      {loading ? (
        <div className="text-center py-8">Loading skills...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => (
            <Card key={skill.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <CardTitle className="text-lg">{skill.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(skill)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(skill.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {skill.category && skill.category !== 'none' && (
                  <Badge variant="secondary">{skill.category}</Badge>
                )}
              </CardHeader>
              <CardContent>
                {skill.description && (
                  <p className="text-gray-600 mb-3">{skill.description}</p>
                )}
                <div className="space-y-2">
                  {skill.requiredLevel && skill.requiredLevel !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Required Level:</span>
                      <span className="text-sm font-medium">{skill.requiredLevel}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Certification:</span>
                    <Badge variant={skill.certificationRequired ? "default" : "secondary"}>
                      {skill.certificationRequired ? "Required" : "Optional"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredSkills.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No skills found matching your criteria.
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSkill ? 'Edit Skill' : 'Add New Skill'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Skill Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select category</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="requiredLevel">Required Level</Label>
              <Select value={formData.requiredLevel} onValueChange={(value) => setFormData({ ...formData, requiredLevel: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select level</SelectItem>
                  {proficiencyLevels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="certificationRequired"
                checked={formData.certificationRequired}
                onChange={(e) => setFormData({ ...formData, certificationRequired: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="certificationRequired">Certification Required</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingSkill ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
