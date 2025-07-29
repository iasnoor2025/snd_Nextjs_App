"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SubmitTimesheetProps {
  timesheet: {
    id: string;
    status: string;
    hoursWorked: number;
    overtimeHours: number;
    date: string;
    employee: {
      firstName: string;
      lastName: string;
    };
  };
  onStatusChange: () => void;
}

export default function SubmitTimesheet({ timesheet, onStatusChange }: SubmitTimesheetProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = timesheet.status === 'draft' || timesheet.status === 'rejected';
  const totalHours = Number(timesheet.hoursWorked) + Number(timesheet.overtimeHours);

  const handleSubmit = async () => {
    if (totalHours <= 0) {
      toast.error('Cannot submit timesheet with no hours worked');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/timesheets/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timesheetId: timesheet.id,
          notes
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit timesheet');
      }

      toast.success(data.message);
      setIsDialogOpen(false);
      setNotes('');
      onStatusChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit timesheet');
    } finally {
      setLoading(false);
    }
  };

  if (!canSubmit) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Submit for Approval
        </CardTitle>
        <CardDescription>
          Submit this timesheet for approval workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Submission Requirements</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Total hours must be greater than 0</li>
              <li>• Timesheet will go through 4-stage approval process</li>
              <li>• You can add optional notes during submission</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Hours:</span>
              <span className="ml-2">{totalHours.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-medium">Date:</span>
              <span className="ml-2">{new Date(timesheet.date).toLocaleDateString()}</span>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full"
                disabled={totalHours <= 0}
                onClick={() => setIsDialogOpen(true)}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Timesheet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Timesheet for Approval</DialogTitle>
                <DialogDescription>
                  Submit timesheet for {timesheet.employee.firstName} {timesheet.employee.lastName} on {new Date(timesheet.date).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this timesheet..."
                    className="mt-1"
                  />
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium mb-2">Submission Summary</div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Employee: {timesheet.employee.firstName} {timesheet.employee.lastName}</div>
                    <div>Date: {new Date(timesheet.date).toLocaleDateString()}</div>
                    <div>Regular Hours: {timesheet.hoursWorked}</div>
                    <div>Overtime Hours: {timesheet.overtimeHours}</div>
                    <div>Total Hours: {totalHours.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
