'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EquipmentDropdown } from '@/components/ui/equipment-dropdown';
import { SearchableSelect } from '@/components/ui/searchable-select';
import ApiService from '@/lib/api-service';
import { Wrench } from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface Equipment {
  id: string;
  name: string;
  model_number?: string;
  daily_rate?: number;
  status: string;
  door_number?: string;
}

interface EquipmentResource {
  id?: string;
  equipment_id?: string;
  equipment_name?: string;
  name?: string; // Add name field
  operator_id?: string; // Add operator ID field
  operator_name?: string;
  start_date?: string;
  end_date?: string;
  hourly_rate?: number;
  usage_hours?: number;
  maintenance_cost?: number;
  total_cost?: number;
  notes?: string;
  status?: string;
}

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialData?: EquipmentResource | null;
  onSuccess: () => void;
}

export default function EquipmentDialog({
  open,
  onOpenChange,
  projectId,
  initialData,
  onSuccess,
}: EquipmentDialogProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [manpowerResources, setManpowerResources] = useState<any[]>([]);
  const [assignedOperatorIds, setAssignedOperatorIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingManpower, setLoadingManpower] = useState(false);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const equipmentRef = useRef<Equipment[]>([]);
  const hasInitialHourlyRate = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    equipmentRef.current = equipment;
  }, [equipment]);
  const [formData, setFormData] = useState<EquipmentResource>({
    equipment_id: '',
    equipment_name: '',
    name: '', // Add name field
    operator_id: '',
    operator_name: '',
    start_date: '',
    end_date: '',
    hourly_rate: 0,
    usage_hours: 0,
    maintenance_cost: 0,
    total_cost: 0,
    notes: '',
    status: 'pending',
  });

  // Load assigned operators from existing equipment
  const loadAssignedOperators = async () => {
    try {
      const response = await ApiService.getProjectEquipment(Number(projectId));
      if (response.success && response.data) {
        // Get all operator IDs that are already assigned to equipment
        // Exclude the current equipment being edited (if editing)
        const assignedIds = new Set<string>();
        response.data.forEach((item: any) => {
          // Skip the current equipment if editing
          if (initialData?.id && item.id?.toString() === initialData.id.toString()) {
            return;
          }
          // operatorId references projectManpower.id
          if (item.operatorId) {
            assignedIds.add(item.operatorId.toString());
          }
        });
        setAssignedOperatorIds(assignedIds);
        console.log('Assigned operator IDs:', Array.from(assignedIds));
      }
    } catch (error) {
      console.error('Error loading assigned operators:', error);
      setAssignedOperatorIds(new Set());
    }
  };

  // Load equipment when dialog opens (for displaying selected equipment details)
  useEffect(() => {
    if (open) {
      console.log('Dialog opened, projectId:', projectId);
      loadEquipmentForDetails();
      loadManpowerResources();
      loadAssignedOperators();
      setIsInitialized(false); // Reset when dialog opens
      hasInitialHourlyRate.current = false; // Reset when dialog opens
    }
  }, [open, projectId, initialData?.id]);

  // Reset form function
  const resetForm = useCallback(() => {
    setFormData({
      equipment_id: '',
      equipment_name: '',
      name: '',
      operator_id: '',
      operator_name: '',
      start_date: '',
      end_date: '',
      hourly_rate: 0,
      usage_hours: 0,
      maintenance_cost: 0,
      total_cost: 0,
      notes: '',
      status: 'pending',
    });
    setIsInitialized(false);
    hasInitialHourlyRate.current = false;
  }, []);

  // Reset form when dialog closes (if not editing)
  useEffect(() => {
    if (!open && !initialData) {
      resetForm();
    }
  }, [open, initialData, resetForm]);

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      console.log('Initializing form data with:', initialData);
      
      // Helper function to format date for input field (avoids timezone issues)
      const formatDateForInput = (dateValue: string | undefined | null): string => {
        if (!dateValue) return '';
        try {
          // Take just the date part (before T if present) to avoid timezone conversion
          return dateValue.split('T')[0];
        } catch (e) {
          console.error('Error formatting date:', dateValue, e);
          return '';
        }
      };

      // Helper function to safely convert to number
      const toNumber = (value: any): number => {
        if (value === undefined || value === null || value === '') return 0;
        // Handle 0 as a valid value
        if (value === 0) return 0;
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) ? 0 : num;
      };

      setFormData({
        equipment_id: initialData.equipment_id || '',
        equipment_name: initialData.equipment_name || initialData.name || '',
        name: initialData.name || initialData.equipment_name || '',
        operator_id: initialData.operator_id || '',
        operator_name: initialData.operator_name || '',
        start_date: formatDateForInput(initialData.start_date || (initialData as any).startDate),
        end_date: formatDateForInput(initialData.end_date || (initialData as any).endDate),
        hourly_rate: initialData.hourly_rate ?? (initialData as any).hourlyRate ?? 0,
        usage_hours: initialData.usage_hours ?? (initialData as any).usageHours ?? (initialData as any).estimatedHours ?? 0,
        maintenance_cost: initialData.maintenance_cost ?? (initialData as any).maintenanceCost ?? 0,
        total_cost: initialData.total_cost ?? (initialData as any).totalCost ?? 0,
        notes: initialData.notes || '',
        status: initialData.status || 'pending',
      });
      // Mark that we have an initial hourly_rate from the database
      hasInitialHourlyRate.current = !!(initialData.hourly_rate || (initialData as any).hourlyRate);
      setIsInitialized(true);
    } else {
      resetForm();
    }
  }, [initialData, resetForm]);

  // Load equipment for displaying details (EquipmentDropdown handles its own loading)
  const loadEquipmentForDetails = async () => {
    try {
      setLoadingEquipment(true);
      // Use the correct API endpoint for equipment
      const response = await ApiService.get<Equipment[]>('/equipment');
      setEquipment(response.data || []);
    } catch (error) {
      console.error('Error loading equipment for details:', error);
      setEquipment([]);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const loadManpowerResources = async () => {
    try {
      setLoadingManpower(true);
      // Load manpower resources from the current project
      const response = await ApiService.getProjectManpower(Number(projectId));
      console.log('API Response:', response);
      if (response.success && response.data) {
        console.log('Raw manpower data:', response.data);
        // Map API response to expected frontend format
        const mappedManpower = response.data.map((item: any) => {
          // Construct full employee name from firstName and lastName
          const employeeFullName = (item.employeeFirstName && item.employeeLastName)
            ? `${item.employeeFirstName} ${item.employeeLastName}`.trim()
            : item.employeeFirstName || item.employeeLastName || '';
          
          // Use employee name if available, otherwise use worker name
          const displayName = employeeFullName || item.workerName || 'Unnamed Worker';
          
          // Create display label with file number if available
          const fileNumber = item.employeeFileNumber || '';
          const displayLabel = fileNumber 
            ? `${displayName} (File: ${fileNumber})`
            : displayName;
          
          return {
            id: item.id.toString(),
            employee_name: employeeFullName,
            worker_name: item.workerName || '',
            job_title: item.jobTitle || '',
            file_number: fileNumber,
            // Create a display name that prioritizes employee name, then worker name
            name: displayName,
            // Label for SearchableSelect
            label: displayLabel,
          };
        });
        setManpowerResources(mappedManpower);
        console.log('Loaded manpower resources:', mappedManpower);
        console.log('Manpower resources count:', mappedManpower.length);
      } else {
        console.warn('Failed to load manpower resources:', response.message);
        // Fall back to mock data
        loadMockManpowerData();
      }
    } catch (error) {
      console.error('Error loading manpower resources:', error);
      // Use mock data if API fails
      loadMockManpowerData();
    } finally {
      setLoadingManpower(false);
    }
  };

  const loadMockManpowerData = () => {
    const mockManpower = [
      {
        id: '1',
        employee_name: 'John Doe',
        worker_name: '',
        job_title: 'Operator',
        name: 'John Doe',
      },
      {
        id: '2',
        employee_name: '',
        worker_name: 'Mike Smith',
        job_title: 'Driver',
        name: 'Mike Smith',
      },
      {
        id: '3',
        employee_name: 'Sarah Johnson',
        worker_name: '',
        job_title: 'Technician',
        name: 'Sarah Johnson',
      },
    ];
    setManpowerResources(mockManpower);
  };

  // Helper function to parse date string as local date (avoids timezone issues)
  const parseLocalDateString = (dateString: string): Date | null => {
    if (!dateString) return null;
    const dateStr = dateString.split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month - 1, day);
  };

  // Calculate usage hours when start/end dates change
  useEffect(() => {
    if (formData.start_date) {
      const start = parseLocalDateString(formData.start_date);
      if (!start) return;
      
      const end = formData.end_date ? parseLocalDateString(formData.end_date) : new Date();
      if (!end) return;
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const usageHours = diffDays * 10; // 10 hours per day

      setFormData(prev => ({
        ...prev,
        usage_hours: usageHours,
        total_cost: (prev.hourly_rate || 0) * usageHours + (prev.maintenance_cost || 0),
      }));
    }
  }, [formData.start_date, formData.end_date, formData.hourly_rate, formData.maintenance_cost]);

  // Track if we've initialized from initialData to prevent overwriting
  const [isInitialized, setIsInitialized] = useState(false);

  // Load equipment details when equipment_id changes and update form data
  // BUT don't overwrite hourly_rate if we're editing (it should come from initialData)
  useEffect(() => {
    const loadEquipmentDetails = async () => {
      if (formData.equipment_id && !isInitialized) {
        // Check if we already have this equipment in our list using ref
        const existingEquipment = equipmentRef.current.find(
          eq => eq.id === formData.equipment_id || eq.id.toString() === formData.equipment_id
        );
        
        if (!existingEquipment) {
          try {
            const response = await ApiService.get(`/equipment/${formData.equipment_id}`);
            if (response.data) {
              const fetchedEquipment = response.data;
              setEquipment(prev => [...prev, fetchedEquipment]);
              
              // Update form data with equipment details
              // Only set hourly_rate if it's not already set (preserve existing value when editing)
              setFormData(prev => {
                // If we have an initial hourly_rate from the database, don't overwrite it
                if (hasInitialHourlyRate.current) {
                  const newData = { ...prev };
                  newData.equipment_name = fetchedEquipment.name;
                  newData.name = fetchedEquipment.name;
                  // Don't change hourly_rate - keep the value from database
                  return newData;
                }
                
                const newData = { ...prev };
                newData.equipment_name = fetchedEquipment.name;
                newData.name = fetchedEquipment.name;
                // Only calculate hourly rate from daily rate if hourly_rate is not already set
                if (!prev.hourly_rate || prev.hourly_rate === 0) {
                  const dailyRate = fetchedEquipment.daily_rate || fetchedEquipment.dailyRate || 0;
                  const hourlyRate = dailyRate ? dailyRate / 8 : 0;
                  newData.hourly_rate = hourlyRate;
                }
                return newData;
              });
            }
          } catch (error) {
            console.error('Error fetching equipment details:', error);
          }
        } else {
          // Equipment already in list, update form data
          // Only set hourly_rate if it's not already set (preserve existing value when editing)
          setFormData(prev => {
            // If we have an initial hourly_rate from the database, don't overwrite it
            if (hasInitialHourlyRate.current) {
              const newData = { ...prev };
              newData.equipment_name = existingEquipment.name;
              newData.name = existingEquipment.name;
              // Don't change hourly_rate - keep the value from database
              return newData;
            }
            
            const newData = { ...prev };
            newData.equipment_name = existingEquipment.name;
            newData.name = existingEquipment.name;
            // Only calculate hourly rate from daily rate if hourly_rate is not already set
            if (!prev.hourly_rate || prev.hourly_rate === 0) {
              const dailyRate = existingEquipment.daily_rate || (existingEquipment as any).dailyRate || 0;
              const hourlyRate = dailyRate ? dailyRate / 8 : 0;
              newData.hourly_rate = hourlyRate;
            }
            return newData;
          });
        }
      }
    };

    loadEquipmentDetails();
  }, [formData.equipment_id, isInitialized, initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Handle equipment selection
      if (field === 'equipment_id') {
        if (value) {
          // Try to find in local equipment list
          const selectedEquipment = equipment.find(eq => eq.id === value || eq.id.toString() === value);
          
          if (selectedEquipment) {
            newData.equipment_id = value;
            newData.equipment_name = selectedEquipment.name;
            newData.name = selectedEquipment.name; // Set name from equipment
            // Calculate hourly rate from daily rate (assuming 8-hour workday)
            const dailyRate = selectedEquipment.daily_rate || (selectedEquipment as any).dailyRate || 0;
            const hourlyRate = dailyRate ? dailyRate / 8 : 0;
            newData.hourly_rate = hourlyRate;
          } else {
            // Equipment not in local list yet, will be loaded by useEffect
            newData.equipment_id = value;
            newData.equipment_name = '';
            newData.name = '';
            newData.hourly_rate = 0;
          }
        } else {
          newData.equipment_id = '';
          newData.equipment_name = '';
          newData.name = ''; // Clear name
          newData.hourly_rate = 0;
        }
      }

      // Handle operator selection
      if (field === 'operator_id') {
        if (value) {
          const selectedOperator = manpowerResources.find(op => op.id === value);
          if (selectedOperator) {
            newData.operator_id = value;
            // Use the display name from manpower resource
            newData.operator_name = selectedOperator.name;
          }
        } else {
          newData.operator_id = '';
          newData.operator_name = '';
        }
      }

      // Calculate total cost when hourly rate or usage hours change
      if (field === 'hourly_rate' || field === 'usage_hours' || field === 'maintenance_cost') {
        const hourlyRate = field === 'hourly_rate' ? value : newData.hourly_rate;
        const usageHours = field === 'usage_hours' ? value : newData.usage_hours;
        const maintenanceCost = field === 'maintenance_cost' ? value : newData.maintenance_cost;
        newData.total_cost = hourlyRate * usageHours + (maintenanceCost || 0);
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.equipment_id) {
        toast.error('Please select equipment');
        return;
      }
      if (!formData.start_date) {
        toast.error('Start date is required');
        return;
      }
      if (!formData.hourly_rate || formData.hourly_rate <= 0) {
        toast.error('Hourly rate must be positive');
        return;
      }
      if (!formData.usage_hours || formData.usage_hours <= 0) {
        toast.error('Usage hours must be positive');
        return;
      }

      // Transform frontend field names to match API expectations
      const submitData = {
        equipmentId: formData.equipment_id,
        operatorId: formData.operator_id,
        startDate: formData.start_date,
        endDate: formData.end_date,
        hourlyRate: formData.hourly_rate,
        estimatedHours: formData.usage_hours,
        maintenanceCost: formData.maintenance_cost,
        notes: formData.notes,
        type: 'equipment',
        name:
          formData.name ||
          formData.equipment_name ||
          (formData.equipment_id
            ? equipment.find(eq => eq.id === formData.equipment_id)?.name
            : ''),
        description: formData.notes,
        total_cost: (formData.hourly_rate || 0) * (formData.usage_hours || 0),
        status: formData.status || 'pending',
      };

      // Make the actual API call
      if (initialData?.id) {
        await ApiService.put(`/projects/${projectId}/equipment/${initialData.id}`, submitData);
        toast.success('Equipment resource updated successfully');
      } else {
        await ApiService.createProjectEquipment(Number(projectId), submitData);
        toast.success('Equipment resource added successfully');
        // Reset form after successful creation
        resetForm();
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {

      // Show more specific error messages
      if (error.response?.data?.error) {
        toast.error(`API Error: ${error.response.data.error}`);
      } else if (error.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('Failed to save equipment resource');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-green-600" />
            <span>{initialData ? 'Edit Equipment Resource' : 'Add Equipment Resource'}</span>
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Update the details for this equipment resource.'
              : 'Add a new equipment resource to this project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Equipment Selection - First priority */}
          <div className="space-y-2">
            <EquipmentDropdown
              value={formData.equipment_id || ''}
              onValueChange={value => handleInputChange('equipment_id', value)}
              placeholder="Select equipment"
              label="Select Equipment"
              required
              loading={loadingEquipment}
              onLoadingChange={setLoadingEquipment}
            />

            {/* Show selected equipment details */}
            {formData.equipment_id && (
              <div className="rounded bg-gray-100 p-3 mt-2">
                <div className="text-sm font-medium text-gray-700">Selected Equipment</div>
                <div className="text-sm text-gray-600 mt-1">
                  {formData.equipment_name}
                  {equipment.find(eq => eq.id === formData.equipment_id || eq.id.toString() === formData.equipment_id)?.door_number && 
                    ` [${equipment.find(eq => eq.id === formData.equipment_id || eq.id.toString() === formData.equipment_id)?.door_number}]`}
                  {formData.equipment_name &&
                    equipment.find(eq => eq.id === formData.equipment_id || eq.id.toString() === formData.equipment_id)?.model_number &&
                    ` (${equipment.find(eq => eq.id === formData.equipment_id || eq.id.toString() === formData.equipment_id)?.model_number})`}
                </div>
                {(equipment.find(eq => eq.id === formData.equipment_id || eq.id.toString() === formData.equipment_id)?.daily_rate ||
                  (equipment.find(eq => eq.id === formData.equipment_id || eq.id.toString() === formData.equipment_id) as any)?.dailyRate) && (
                  <div className="text-sm text-gray-600 mt-1">
                    Daily Rate: SAR{' '}
                    {equipment.find(eq => eq.id === formData.equipment_id || eq.id.toString() === formData.equipment_id)?.daily_rate ||
                      (equipment.find(eq => eq.id === formData.equipment_id || eq.id.toString() === formData.equipment_id) as any)?.dailyRate}
                  </div>
                )}
              </div>
            )}
          </div>

                               {/* Operator Selection - Second priority */}
          <div className="space-y-2">
            <Label htmlFor="operator_id">Select Operator</Label>
             {loadingManpower ? (
               <div className="flex items-center justify-center p-3 border border-gray-300 rounded-md bg-gray-50">
                 <span className="text-sm text-gray-500">Loading operators...</span>
               </div>
             ) : manpowerResources.length === 0 ? (
               <div className="flex items-center justify-between p-3 border border-dashed border-gray-300 rounded-md bg-gray-50">
                 <span className="text-sm text-gray-500">No operators available</span>
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={loadManpowerResources}
                 >
                   Refresh
                 </Button>
               </div>
             ) : (
               <SearchableSelect
                 value={formData.operator_id || undefined}
                 onValueChange={value => handleInputChange('operator_id', value)}
                 options={manpowerResources
                   .filter(resource => {
                     // Filter out operators that are already assigned to other equipment
                     // Allow the current operator if editing
                     if (initialData?.operator_id && resource.id === initialData.operator_id) {
                       return true; // Allow current operator when editing
                     }
                     return !assignedOperatorIds.has(resource.id);
                   })
                   .map(resource => ({
                     value: resource.id,
                     label: `${resource.label || resource.name}${resource.job_title ? ` - ${resource.job_title}` : ''}${assignedOperatorIds.has(resource.id) ? ' (Already Assigned)' : ''}`,
                     name: resource.name,
                     file_number: resource.file_number || '',
                     job_title: resource.job_title || '',
                   }))}
                 placeholder="Select operator from manpower resources"
                 searchPlaceholder="Search by name or file number..."
                 emptyMessage={assignedOperatorIds.size > 0 ? "No available operators (all are assigned)" : "No operators found"}
                 searchFields={['label', 'name', 'file_number', 'job_title']}
                 loading={loadingManpower}
               />
             )}

            {/* Show selected operator details */}
            {formData.operator_id && (
              <div className="rounded bg-blue-100 p-3 mt-2">
                <div className="text-sm font-medium text-blue-700">Selected Operator</div>
                <div className="text-sm text-blue-600 mt-1">{formData.operator_name}</div>
                {manpowerResources.find(op => op.id === formData.operator_id)?.job_title && (
                  <div className="text-sm text-blue-600 mt-1">
                    Job: {manpowerResources.find(op => op.id === formData.operator_id)?.job_title}
                  </div>
                )}
              </div>
            )}

            
          </div>

          {/* Date Range - Third priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ''}
                onChange={e => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ''}
                onChange={e => handleInputChange('end_date', e.target.value)}
                min={formData.start_date}
              />
            </div>
          </div>

          {/* Rates and Hours - Fourth priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate (SAR)</Label>
              <Input
                id="hourly_rate"
                type="number"
                value={formData.hourly_rate !== undefined && formData.hourly_rate !== null ? formData.hourly_rate : ''}
                onChange={e => handleInputChange('hourly_rate', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usage_hours">Usage Hours</Label>
              <Input
                id="usage_hours"
                type="number"
                value={formData.usage_hours !== undefined && formData.usage_hours !== null ? formData.usage_hours : ''}
                onChange={e => handleInputChange('usage_hours', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance_cost">Maintenance Cost (SAR)</Label>
              <Input
                id="maintenance_cost"
                type="number"
                value={formData.maintenance_cost !== undefined && formData.maintenance_cost !== null ? formData.maintenance_cost : ''}
                onChange={e => handleInputChange('maintenance_cost', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Total Cost */}
          <div className="space-y-2">
            <Label htmlFor="total_cost">Total Cost (SAR)</Label>
            <Input
              id="total_cost"
              type="number"
              value={formData.total_cost !== undefined && formData.total_cost !== null ? formData.total_cost : ''}
              readOnly
              className="bg-muted font-semibold"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={e => handleInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initialData ? 'Update Resource' : 'Add Resource'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
