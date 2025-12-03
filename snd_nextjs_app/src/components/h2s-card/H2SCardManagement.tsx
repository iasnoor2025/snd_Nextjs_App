'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GenerateH2SCardButton } from './GenerateH2SCardButton';
import { CreditCard, Search, Loader2, Download, Plus, Eye, Edit, Trash2, MoreVertical, Printer } from 'lucide-react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { H2SCardPrintDialog } from './H2SCardPrintDialog';

interface H2STrainingRecord {
  id: number;
  employeeId: number;
  trainingId: number;
  employeeName: string;
  fileNumber: string | null;
  trainingName: string;
  endDate: string | null;
  expiryDate: string | null;
  status: string;
  cardNumber: string | null;
  hasCard: boolean;
}

export function H2SCardManagement() {
  const params = useParams() as any;
  const currentLocale = params?.locale || 'en';
  const [trainings, setTrainings] = useState<H2STrainingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'hasCard' | 'noCard'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creatingTraining, setCreatingTraining] = useState(false);
  const [employees, setEmployees] = useState<Array<{ id: number; name: string; fileNumber: string | null }>>([]);
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [h2sTrainings, setH2sTrainings] = useState<Array<{ id: number; name: string }>>([]);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [trainingSearch, setTrainingSearch] = useState('');
  const [trainingForm, setTrainingForm] = useState({
    employeeId: '',
    trainingId: '',
    startDate: '',
    endDate: '',
    status: 'completed',
    trainerName: 'Mohsin Mushtaque',
    expiryDate: '',
  });
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<H2STrainingRecord | null>(null);
  const [editingTraining, setEditingTraining] = useState(false);
  const [deletingTraining, setDeletingTraining] = useState(false);
  const [trainingDetails, setTrainingDetails] = useState<any>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [cardDataForPrint, setCardDataForPrint] = useState<any>(null);

  useEffect(() => {
    fetchH2STrainings();
    fetchEmployees();
    fetchH2STrainingPrograms();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees/public?all=true&limit=1000', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(
          (data.data || []).map((emp: any) => ({
            id: parseInt(emp.id),
            name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.file_number || 'Unknown',
            fileNumber: emp.file_number,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const searchEmployees = async (q: string) => {
    try {
      const url = q ? `/api/employees/public?limit=20&search=${encodeURIComponent(q)}` : '/api/employees/public?limit=50';
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setEmployees(
          (data.data || []).map((emp: any) => ({
            id: parseInt(emp.id),
            name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.file_number || 'Unknown',
            fileNumber: emp.file_number,
          }))
        );
      }
    } catch (error) {
      console.error('Error searching employees:', error);
    }
  };

  const fetchH2STrainingPrograms = async () => {
    try {
      const response = await fetch('/api/trainings?h2sOnly=true&limit=200', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setH2sTrainings((data.data || []).map((t: any) => ({ id: t.id, name: t.name })));
      }
    } catch (error) {
      console.error('Error fetching training programs:', error);
    }
  };

  const searchH2STrainings = async (q: string) => {
    try {
      const url = `/api/trainings?h2sOnly=true&limit=50${q ? `&search=${encodeURIComponent(q)}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setH2sTrainings((data.data || []).map((t: any) => ({ id: t.id, name: t.name })));
      }
    } catch (error) {
      console.error('Error searching trainings:', error);
    }
  };

  const handleCreateTraining = async () => {
    if (!trainingForm.employeeId || !trainingForm.trainingId || !trainingForm.endDate) {
      toast.error('Please fill in all required fields (Employee, Training, and Completion Date)');
      return;
    }

    setCreatingTraining(true);
    try {
      const response = await fetch(`/api/employee/${trainingForm.employeeId}/training`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          trainingId: parseInt(trainingForm.trainingId),
          startDate: trainingForm.startDate || null,
          endDate: trainingForm.endDate,
          status: trainingForm.status,
          trainerName: trainingForm.trainerName,
          expiryDate: trainingForm.expiryDate || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Training record created successfully');
        setShowCreateDialog(false);
        setTrainingForm({
          employeeId: '',
          trainingId: '',
          startDate: '',
          endDate: '',
          status: 'completed',
          trainerName: 'Mohsin Mushtaque',
          expiryDate: '',
        });
        fetchH2STrainings();
      } else {
        toast.error(data.error || 'Failed to create training record');
      }
    } catch (error) {
      console.error('Error creating training:', error);
      toast.error('Failed to create training record');
    } finally {
      setCreatingTraining(false);
    }
  };

  const fetchH2STrainings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/h2s-training-records', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch H2S training records');
      }

      const data = await response.json();
      
      if (data.success) {
        const records = data.data || [];
        setTrainings(records);
        if (records.length === 0) {
          toast.info('No H2S training records found. Employees need to complete H2S training first.');
        } else {

        }
      } else {
        toast.error(data.error || 'Failed to load H2S training records');
        setTrainings([]);
      }
    } catch (error) {
      console.error('Error fetching H2S trainings:', error);
      toast.error('Failed to load H2S training records');
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = 
      training.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.fileNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.cardNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'completed' && training.status === 'completed') ||
      (filterStatus === 'hasCard' && training.hasCard) ||
      (filterStatus === 'noCard' && !training.hasCard);
    
    return matchesSearch && matchesFilter;
  });

  const handleCardGenerated = () => {
    // Refresh the list after card generation
    fetchH2STrainings();
  };

  const handleView = async (training: H2STrainingRecord) => {
    try {
      const response = await fetch(`/api/employee-training/${training.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTrainingDetails(data.data);
        setSelectedTraining(training);
        setShowViewDialog(true);
      } else {
        toast.error('Failed to load training details');
      }
    } catch (error) {
      console.error('Error fetching training details:', error);
      toast.error('Failed to load training details');
    }
  };

  const handleEdit = async (training: H2STrainingRecord) => {
    try {
      const response = await fetch(`/api/employee-training/${training.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const record = data.data;
        setTrainingForm({
          employeeId: String(training.employeeId),
          trainingId: String(training.trainingId),
          startDate: record.startDate || '',
          endDate: record.endDate || '',
          status: record.status || 'completed',
          trainerName: record.trainerName || 'Mohsin Mushtaque',
          expiryDate: record.expiryDate || '',
        });
        setSelectedTraining(training);
        setShowEditDialog(true);
      } else {
        toast.error('Failed to load training for editing');
      }
    } catch (error) {
      console.error('Error fetching training for edit:', error);
      toast.error('Failed to load training for editing');
    }
  };

  const handleUpdateTraining = async () => {
    if (!selectedTraining) return;

    setEditingTraining(true);
    try {
      const response = await fetch(`/api/employee-training/${selectedTraining.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          startDate: trainingForm.startDate || null,
          endDate: trainingForm.endDate,
          expiryDate: trainingForm.expiryDate || null,
          status: trainingForm.status,
          trainerName: trainingForm.trainerName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Training record updated successfully');
        setShowEditDialog(false);
        setSelectedTraining(null);
        fetchH2STrainings();
      } else {
        toast.error(data.error || 'Failed to update training record');
      }
    } catch (error) {
      console.error('Error updating training:', error);
      toast.error('Failed to update training record');
    } finally {
      setEditingTraining(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTraining) return;

    setDeletingTraining(true);
    try {
      const response = await fetch(`/api/employee-training/${selectedTraining.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Training record deleted successfully');
        setShowDeleteDialog(false);
        setSelectedTraining(null);
        fetchH2STrainings();
      } else {
        toast.error(data.error || 'Failed to delete training record');
      }
    } catch (error) {
      console.error('Error deleting training:', error);
      toast.error('Failed to delete training record');
    } finally {
      setDeletingTraining(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              H2S Certification Cards
            </CardTitle>
            <CardDescription>
              Generate and manage H2S Awareness & SCBA certification cards for employees
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Training
            </Button>
            <Button
              onClick={fetchH2STrainings}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
            {trainings.filter(t => !t.hasCard).length > 0 && (
              <Button
                onClick={async () => {
                  const pending = trainings.filter(t => !t.hasCard);
                  for (const training of pending) {
                    try {
                      await fetch(
                        `/api/employee/${training.employeeId}/training/${training.id}/h2s-card-pdf`,
                        { method: 'POST', credentials: 'include' }
                      );
                    } catch (e) {
                      console.error(`Failed to generate card for ${training.employeeName}:`, e);
                    }
                  }
                  toast.success(`Generating ${pending.length} H2S cards...`);
                  setTimeout(() => fetchH2STrainings(), 2000);
                }}
                variant="default"
                size="sm"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Generate All Pending ({trainings.filter(t => !t.hasCard).length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee name, file number, or card number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Records</option>
            <option value="completed">Completed Only</option>
            <option value="hasCard">Has Card</option>
            <option value="noCard">No Card</option>
          </select>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-2xl font-bold">{trainings.length}</div>
            <div className="text-sm text-muted-foreground">Total Records</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">
              {trainings.filter(t => t.hasCard).length}
            </div>
            <div className="text-sm text-muted-foreground">Cards Generated</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">
              {trainings.filter(t => !t.hasCard).length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
        </div>

        {/* Table */}
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading H2S training records...</p>
              </div>
            ) : filteredTrainings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <p>
                  {trainings.length === 0 
                    ? 'No H2S training records found. Make sure employees have completed H2S training with an end date set.'
                    : 'No records match your search criteria.'
                  }
                </p>
                {trainings.length === 0 && (
                  <p className="text-sm">
                    Training programs must contain "H2S" or "SCBA" in the name, and employees must have completed training with an end date.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>File #</TableHead>
                      <TableHead>Training</TableHead>
                      <TableHead>Completion Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Card Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right w-[200px]">Generate Card</TableHead>
                      <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrainings.map((training) => (
                      <TableRow key={training.id}>
                        <TableCell className="font-medium">{training.employeeName}</TableCell>
                        <TableCell className="font-mono">{training.fileNumber || 'N/A'}</TableCell>
                        <TableCell>{training.trainingName}</TableCell>
                        <TableCell>
                          {training.endDate 
                            ? format(new Date(training.endDate), 'MMM d, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {training.expiryDate 
                            ? format(new Date(training.expiryDate), 'MMM d, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono">
                          {training.cardNumber || '-'}
                        </TableCell>
                        <TableCell>
                          {training.hasCard ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Card Generated
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No Card</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            {training.hasCard ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                ✓ Card Generated
                              </Badge>
                            ) : (
                              <GenerateH2SCardButton
                                employeeId={training.employeeId}
                                trainingId={training.id}
                                trainingName={training.trainingName}
                                disabled={loading}
                                onSuccess={handleCardGenerated}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleView(training)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/h2s-card/${training.id}`, {
                                      credentials: 'include',
                                    });
                                    if (response.ok) {
                                      const result = await response.json();
                                      if (result.success && result.data) {
                                        setCardDataForPrint(result.data);
                                        setShowPrintDialog(true);
                                      } else {
                                        toast.error('Failed to load card data');
                                      }
                                    } else {
                                      toast.error('Failed to load card data');
                                    }
                                  } catch (error) {
                                    console.error('Error loading card data:', error);
                                    toast.error('Failed to load card data');
                                  }
                                }}>
                                  <Printer className="h-4 w-4 mr-2" />
                                  View / Print Card
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(training)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTraining(training);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
      </CardContent>

      {/* Create Training Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New H2S Training Record</DialogTitle>
            <DialogDescription>
              Add a new H2S training completion record for an employee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee *</Label>
              <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={employeeOpen} className="w-full justify-between">
                    {trainingForm.employeeId
                      ? (() => {
                          const emp = employees.find(e => e.id.toString() === trainingForm.employeeId);
                          return emp ? (emp.fileNumber ? `${emp.fileNumber} - ${emp.name}` : emp.name) : 'Select employee';
                        })()
                      : 'Select employee'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search employee..."
                      value={employeeSearch}
                      onValueChange={(v) => {
                        setEmployeeSearch(v);
                        searchEmployees(v);
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup>
                        {employees.map(emp => (
                          <CommandItem
                            key={emp.id}
                            value={emp.id.toString()}
                            onSelect={(value) => {
                              setTrainingForm({ ...trainingForm, employeeId: value });
                              setEmployeeOpen(false);
                            }}
                          >
                            {emp.fileNumber ? `${emp.fileNumber} - ${emp.name}` : emp.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainingId">Training Program *</Label>
              <Popover open={trainingOpen} onOpenChange={setTrainingOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={trainingOpen} className="w-full justify-between">
                    {trainingForm.trainingId
                      ? (() => {
                          const t = h2sTrainings.find(x => x.id.toString() === trainingForm.trainingId);
                          return t ? t.name : 'Select H2S training program';
                        })()
                      : 'Select H2S training program'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search training..."
                      value={trainingSearch}
                      onValueChange={(v) => {
                        setTrainingSearch(v);
                        searchH2STrainings(v);
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No H2S training found.</CommandEmpty>
                      <CommandGroup>
                        {h2sTrainings.map(t => (
                          <CommandItem
                            key={t.id}
                            value={t.id.toString()}
                            onSelect={(value) => {
                              setTrainingForm({ ...trainingForm, trainingId: value });
                              setTrainingOpen(false);
                            }}
                          >
                            {t.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/trainings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          name: 'H2S Awareness & SCBA',
                          category: 'Safety',
                          status: 'active',
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        toast.error(data.error || 'Failed to add H2S training');
                        return;
                      }
                      await fetchH2STrainingPrograms();
                      setTrainingForm({ ...trainingForm, trainingId: String(data.data.id) });
                      toast.success('H2S Awareness & SCBA added');
                    } catch (e) {
                      console.error(e);
                      toast.error('Failed to add H2S training');
                    }
                  }}
                >
                  + Add “H2S Awareness & SCBA”
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={trainingForm.startDate}
                  onChange={(e) => setTrainingForm({ ...trainingForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Completion Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={trainingForm.endDate}
                  onChange={(e) => {
                    const endDate = e.target.value;
                    const expiryDate = endDate 
                      ? new Date(new Date(endDate).getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      : '';
                    setTrainingForm({ ...trainingForm, endDate, expiryDate });
                  }}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={trainingForm.expiryDate}
                  onChange={(e) => setTrainingForm({ ...trainingForm, expiryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={trainingForm.status}
                  onValueChange={(value) => setTrainingForm({ ...trainingForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainerName">Trainer Name</Label>
              <Input
                id="trainerName"
                value={trainingForm.trainerName}
                onChange={(e) => setTrainingForm({ ...trainingForm, trainerName: e.target.value })}
                placeholder="Trainer name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creatingTraining}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTraining}
              disabled={creatingTraining}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creatingTraining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Training
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Training Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Training Record Details</DialogTitle>
            <DialogDescription>
              View complete information about this H2S training record
            </DialogDescription>
          </DialogHeader>
          {trainingDetails && selectedTraining && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee</Label>
                  <p className="text-sm font-medium">{selectedTraining.employeeName}</p>
                </div>
                <div>
                  <Label>File Number</Label>
                  <p className="text-sm font-medium font-mono">{selectedTraining.fileNumber || 'N/A'}</p>
                </div>
                <div>
                  <Label>Training Program</Label>
                  <p className="text-sm font-medium">{selectedTraining.trainingName}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="text-sm font-medium">{trainingDetails.status}</p>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <p className="text-sm font-medium">
                    {trainingDetails.startDate ? format(new Date(trainingDetails.startDate), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Completion Date</Label>
                  <p className="text-sm font-medium">
                    {trainingDetails.endDate ? format(new Date(trainingDetails.endDate), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <p className="text-sm font-medium">
                    {trainingDetails.expiryDate ? format(new Date(trainingDetails.expiryDate), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Card Number</Label>
                  <p className="text-sm font-medium font-mono">{trainingDetails.cardNumber || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <Label>Trainer Name</Label>
                  <p className="text-sm font-medium">{trainingDetails.trainerName || 'N/A'}</p>
                </div>
                {trainingDetails.notes && (
                  <div className="col-span-2">
                    <Label>Notes</Label>
                    <p className="text-sm">{trainingDetails.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Training Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit H2S Training Record</DialogTitle>
            <DialogDescription>
              Update training record information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTraining && (
              <>
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Input value={selectedTraining.employeeName} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Training Program</Label>
                  <Input value={selectedTraining.trainingName} disabled />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartDate">Start Date</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={trainingForm.startDate}
                  onChange={(e) => setTrainingForm({ ...trainingForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEndDate">Completion Date *</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={trainingForm.endDate}
                  onChange={(e) => {
                    const endDate = e.target.value;
                    const expiryDate = endDate 
                      ? new Date(new Date(endDate).getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      : '';
                    setTrainingForm({ ...trainingForm, endDate, expiryDate });
                  }}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editExpiryDate">Expiry Date</Label>
                <Input
                  id="editExpiryDate"
                  type="date"
                  value={trainingForm.expiryDate}
                  onChange={(e) => setTrainingForm({ ...trainingForm, expiryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={trainingForm.status}
                  onValueChange={(value) => setTrainingForm({ ...trainingForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTrainerName">Trainer Name</Label>
              <Input
                id="editTrainerName"
                value={trainingForm.trainerName}
                onChange={(e) => setTrainingForm({ ...trainingForm, trainerName: e.target.value })}
                placeholder="Trainer name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={editingTraining}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTraining}
              disabled={editingTraining}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingTraining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Training
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the H2S training record for{' '}
              <strong>{selectedTraining?.employeeName}</strong>. This action cannot be undone.
              {selectedTraining?.hasCard && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Note: The generated H2S card PDF will remain in employee documents.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingTraining}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingTraining}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingTraining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Card Dialog */}
      <H2SCardPrintDialog
        cardData={cardDataForPrint}
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
      />
    </Card>
  );
}

