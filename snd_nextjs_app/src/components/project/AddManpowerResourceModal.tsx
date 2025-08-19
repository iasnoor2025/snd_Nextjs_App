import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import React, { useState } from 'react';

interface AddManpowerResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function AddManpowerResourceModal({
  isOpen,
  onClose,
  projectId,
}: AddManpowerResourceModalProps) {
  const [linkToEmployee, setLinkToEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dailyRate, setDailyRate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add a new manpower resource to this project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Link to Employee Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Link to Employee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="link-employee" className="text-sm text-gray-600">
                  Do you want to connect this resource to an employee?
                </Label>
                <Switch
                  id="link-employee"
                  checked={linkToEmployee}
                  onCheckedChange={setLinkToEmployee}
                />
              </div>

              {linkToEmployee && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="employee-select">Select Employee</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee1">John Doe</SelectItem>
                        <SelectItem value="employee2">Jane Smith</SelectItem>
                        <SelectItem value="employee3">Mike Johnson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="daily-rate">Daily Rate ($)</Label>
                    <input
                      id="daily-rate"
                      type="number"
                      value={dailyRate}
                      onChange={e => setDailyRate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter daily rate"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="px-4 py-2">
              Cancel
            </Button>
            <Button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white">
              Add Resource
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
