"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Calendar,
  User,
  MapPin,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Package
} from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/lib/api-service";

interface Equipment {
  id: number;
  name: string;
  model_number?: string;
  status: string;
  current_assignment?: {
    id: number;
    type: string;
    name: string;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    notes: string | null;
    project?: {
      id: number;
      name: string;
      location: string | null;
    } | null;
    rental?: {
      id: number;
      rental_number: string;
      project?: {
        id: number;
        name: string;
      } | null;
    } | null;
    employee?: {
      id: number;
      name: string;
      file_number: string;
    } | null;
  } | null;
}

interface Assignment {
  id: number;
  assignment_type: string;
  start_date: string;
  end_date?: string;
  status: string;
  notes?: string;
  daily_rate?: number;
  total_amount?: number;
  project?: {
    id: number;
    name: string;
    location: string | null;
  } | null;
  rental?: {
    id: number;
    rental_number: string;
    project?: {
      id: number;
      name: string;
    } | null;
  } | null;
  employee?: {
    id: number;
    name: string;
    file_number: string;
  } | null;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: number;
  file_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface Project {
  id: number;
  name: string;
  location: string | null;
}

export default function EquipmentAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    assignment_type: 'project',
    project_id: '',
    employee_id: '',
    start_date: '',
    end_date: '',
    daily_rate: '',
    total_amount: '',
    notes: ''
  });

  const equipmentId = params.id as string;

  useEffect(() => {
    if (equipmentId) {
      fetchData();
    }
  }, [equipmentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch equipment details
      const equipmentResponse = await ApiService.getEquipmentItem(parseInt(equipmentId));
      if (equipmentResponse.success) {
        setEquipment(equipmentResponse.data);
      }

      // Fetch assignment history
      const historyResponse = await ApiService.getEquipmentRentalHistory(parseInt(equipmentId));
      if (historyResponse.success) {
        setAssignments(historyResponse.data);
      }

      // Fetch employees for assignment
      const employeesResponse = await ApiService.getEmployees();
      if (employeesResponse.success) {
        setEmployees(employeesResponse.data);
      }

      // Fetch projects for assignment
      const projectsResponse = await ApiService.getProjects();
      if (projectsResponse.success) {
        setProjects(projectsResponse.data);
      }
    } catch (error) {
      toast.error('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      completed: { variant: 'secondary' as const, label: 'Completed' },
      pending: { variant: 'outline' as const, label: 'Pending' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAssignmentTypeBadge = (type: string) => {
    const typeConfig = {
      project: { variant: 'default' as const, label: 'Project' },
      rental: { variant: 'secondary' as const, label: 'Rental' },
      manual: { variant: 'outline' as const, label: 'Manual' },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || { variant: 'outline' as const, label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading assignment data...</span>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <span className="ml-2">Equipment not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/modules/equipment-management/${equipmentId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Equipment
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Equipment Assignments</h1>
            <p className="text-muted-foreground">
              Manage assignments for {equipment.name}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Current Assignment */}
      {equipment.current_assignment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Current Assignment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Assignment Type</Label>
                <div className="mt-1">{getAssignmentTypeBadge(equipment.current_assignment.type)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(equipment.current_assignment.status)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="text-sm">{equipment.current_assignment.name}</p>
              </div>
              {equipment.current_assignment.employee && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Assigned Employee</Label>
                  <p className="text-sm">👤 {equipment.current_assignment.employee.name} ({equipment.current_assignment.employee.file_number})</p>
                </div>
              )}
              {equipment.current_assignment.location && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <p className="text-sm">📍 {equipment.current_assignment.location}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                <p className="text-sm">{equipment.current_assignment.start_date ? new Date(equipment.current_assignment.start_date).toLocaleDateString() : 'Not set'}</p>
              </div>
              {equipment.current_assignment.notes && (
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm">{equipment.current_assignment.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Assignment History</span>
          </CardTitle>
          <CardDescription>
            All assignments for this equipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No assignment history found
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{getAssignmentTypeBadge(assignment.assignment_type)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                                                         {assignment.assignment_type === 'project' && assignment.project 
                               ? assignment.project.name 
                               : assignment.assignment_type === 'rental' && assignment.rental
                               ? `${assignment.rental.project?.name || 'Unknown Project'} - ${assignment.rental.rental_number}`
                               : assignment.assignment_type}
                          </div>
                          {assignment.location && (
                            <div className="text-xs text-muted-foreground">
                              📍 {assignment.location}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignment.employee ? (
                          <div>
                            <div className="font-medium">{assignment.employee.name}</div>
                            <div className="text-xs text-muted-foreground">{assignment.employee.file_number}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No employee</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                      <TableCell>{new Date(assignment.start_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {/* TODO: Implement edit */}}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {assignment.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {/* TODO: Implement complete */}}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {/* TODO: Implement delete */}}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}