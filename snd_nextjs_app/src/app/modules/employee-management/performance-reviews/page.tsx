'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Filter, Star, Edit, Trash2, Calendar, User, Target } from 'lucide-react';
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

interface PerformanceReview {
  id: number;
  reviewDate: string;
  rating?: number;
  comments?: string;
  goals?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  };
  reviewer?: {
    id: number;
    name?: string;
    email?: string;
  };
}

export default function PerformanceReviewsPage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  
  // Debug logging
  console.log('ApiService imported:', typeof ApiService);
  console.log('ApiService.get method:', typeof ApiService?.get);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    reviewDate: '',
    rating: '',
    comments: '',
    goals: '',
    status: 'pending',
  });

  const statuses = [
    'pending',
    'in_progress',
    'completed',
    'approved',
    'rejected'
  ];

  const ratings = [
    { value: '1', label: '1 - Poor' },
    { value: '2', label: '2 - Below Average' },
    { value: '3', label: '3 - Average' },
    { value: '4', label: '4 - Above Average' },
    { value: '5', label: '5 - Excellent' }
  ];

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      console.log('Testing component without API call...');
      console.log('ApiService type:', typeof ApiService);
      
      // Temporarily skip API call to test component rendering
      setReviews([]);
      toast.success('Component loaded successfully (test mode)');
    } catch (error) {
      console.error('Error in fetchReviews:', error);
      toast.error('Failed to load component');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReview) {
        await ApiService.put(`/performance-reviews/${editingReview.id}`, formData);
        toast.success('Performance review updated successfully');
      } else {
        await ApiService.post('/performance-reviews', formData);
        toast.success('Performance review created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchReviews();
    } catch (error) {
      console.error('Error saving performance review:', error);
      toast.error('Failed to save performance review');
    }
  };

  const handleEdit = (review: PerformanceReview) => {
    setEditingReview(review);
    setFormData({
      employeeId: review.employee.id.toString(),
      reviewDate: review.reviewDate,
      rating: review.rating?.toString() || '',
      comments: review.comments || '',
      goals: review.goals || '',
      status: review.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this performance review?')) return;
    
    try {
      await ApiService.delete(`/performance-reviews/${reviewId}`);
      toast.success('Performance review deleted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting performance review:', error);
      toast.error('Failed to delete performance review');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      reviewDate: '',
      rating: '',
      comments: '',
      goals: '',
      status: 'pending',
    });
    setEditingReview(null);
  };

  const filteredReviews = reviews.filter(review => {
    const employeeName = `${review.employee.firstName} ${review.employee.lastName}`.toLowerCase();
    const matchesSearch = employeeName.includes(searchTerm.toLowerCase()) ||
                         (review.comments && review.comments.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !selectedStatus || selectedStatus === 'all' || review.status === selectedStatus;
    const matchesRating = !selectedRating || selectedRating === 'all' || review.rating?.toString() === selectedRating;
    return matchesSearch && matchesStatus && matchesRating;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingDisplay = (rating?: number) => {
    if (!rating) return 'Not Rated';
    return `${rating}/5`;
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return 'text-gray-500';
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!session) {
    return <div>Please sign in to access this page.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Reviews</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Review
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
                  placeholder="Search by employee name or comments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                {ratings.map(rating => (
                  <SelectItem key={rating.value} value={rating.value}>{rating.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Grid */}
      {loading ? (
        <div className="text-center py-8">Loading performance reviews...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    <CardTitle className="text-lg">
                      {review.employee.firstName} {review.employee.lastName}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(review)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(review.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(review.status)}>
                    {review.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className={getRatingColor(review.rating)}>
                    {getRatingDisplay(review.rating)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Review Date: {new Date(review.reviewDate).toLocaleDateString()}</span>
                  </div>
                  {review.reviewer && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Reviewer: {review.reviewer.name || review.reviewer.email}</span>
                    </div>
                  )}
                  {review.comments && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <span className="font-medium">Comments:</span>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {review.comments}
                      </p>
                    </div>
                  )}
                  {review.goals && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Target className="h-4 w-4" />
                        <span className="font-medium">Goals:</span>
                      </div>
                      <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                        {review.goals}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredReviews.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No performance reviews found matching your criteria.
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingReview ? 'Edit Performance Review' : 'Add New Performance Review'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  type="number"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                  placeholder="Enter employee ID"
                />
              </div>
              <div>
                <Label htmlFor="reviewDate">Review Date *</Label>
                <Input
                  id="reviewDate"
                  type="date"
                  value={formData.reviewDate}
                  onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rating">Rating</Label>
                <Select value={formData.rating} onValueChange={(value) => setFormData({ ...formData, rating: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {ratings.map(rating => (
                      <SelectItem key={rating.value} value={rating.value}>{rating.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows={3}
                placeholder="Performance comments and feedback"
              />
            </div>
            <div>
              <Label htmlFor="goals">Goals & Objectives</Label>
              <Textarea
                id="goals"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                rows={3}
                placeholder="Future goals and development objectives"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingReview ? 'Update' : 'Create'}
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
