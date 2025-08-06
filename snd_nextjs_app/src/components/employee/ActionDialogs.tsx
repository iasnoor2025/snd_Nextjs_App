"use client"

import { useState } from "react"
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, DollarSign, Clock, Upload, User, Award, BookOpen, Building } from "lucide-react"
import { toast } from "sonner"

interface ActionDialogsProps {
  employeeId: string
  documentDialogOpen?: boolean
  setDocumentDialogOpen?: (open: boolean) => void
  onDocumentUploaded?: () => void
}

export default function ActionDialogs({ employeeId, documentDialogOpen, setDocumentDialogOpen, onDocumentUploaded }: ActionDialogsProps) {
  const { t } = useTranslation('dashboard')
  const [loading, setLoading] = useState<string | null>(null)

  // Leave Request Dialog
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  })

  // Advance Request Dialog
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false)
  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    reason: ''
  })

  // Timesheet Dialog
  const [timesheetDialogOpen, setTimesheetDialogOpen] = useState(false)
  const [timesheetForm, setTimesheetForm] = useState({
    date: '',
    hours_worked: '',
    overtime_hours: '',
    start_time: '',
    end_time: '',
    description: ''
  })

  // Document Upload Dialog
  const [documentForm, setDocumentForm] = useState({
    document_type: '',
    description: '',
    file: null as File | null
  })

  const handleLeaveSubmit = async () => {
    try {
      setLoading('leave')
      const response = await fetch('/api/employee/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          ...leaveForm
        }),
      })

      if (response.ok) {
        toast.success('Leave request submitted successfully')
        setLeaveDialogOpen(false)
        setLeaveForm({ leave_type: '', start_date: '', end_date: '', reason: '' })
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit leave request')
      }
    } catch (error) {
      toast.error('An error occurred while submitting leave request')
    } finally {
      setLoading(null)
    }
  }

  const handleAdvanceSubmit = async () => {
    try {
      setLoading('advance')
      const response = await fetch('/api/employee/advances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          ...advanceForm
        }),
      })

      if (response.ok) {
        toast.success('Advance request submitted successfully')
        setAdvanceDialogOpen(false)
        setAdvanceForm({ amount: '', reason: '' })
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit advance request')
      }
    } catch (error) {
      toast.error('An error occurred while submitting advance request')
    } finally {
      setLoading(null)
    }
  }

  const handleTimesheetSubmit = async () => {
    try {
      setLoading('timesheet')
      const response = await fetch('/api/employee/timesheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          ...timesheetForm
        }),
      })

      if (response.ok) {
        toast.success('Timesheet submitted successfully')
        setTimesheetDialogOpen(false)
        setTimesheetForm({
          date: '',
          hours_worked: '',
          overtime_hours: '',
          start_time: '',
          end_time: '',
          description: ''
        })
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit timesheet')
      }
    } catch (error) {
      toast.error('An error occurred while submitting timesheet')
    } finally {
      setLoading(null)
    }
  }

  const handleDocumentUpload = async () => {
    try {
      setLoading('document')
      if (!documentForm.file) {
        toast.error('Please select a file')
        return
      }

      const formData = new FormData()
      formData.append('employee_id', employeeId)
      formData.append('document_type', documentForm.document_type)
      formData.append('description', documentForm.description)
      formData.append('file', documentForm.file)

      const response = await fetch('/api/employee/documents', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast.success('Document uploaded successfully')
        setDocumentDialogOpen?.(false)
        setDocumentForm({ document_type: '', description: '', file: null })
        onDocumentUploaded?.()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to upload document')
      }
    } catch (error) {
      toast.error('An error occurred while uploading document')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {/* Leave Request Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <CalendarDays className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium">{t('leave_request')}</span>
            <span className="text-xs text-muted-foreground">{t('leave_request_desc')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('leave_request')}</DialogTitle>
            <DialogDescription>
              Submit a new leave request
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="leave_type">Leave Type</Label>
              <Select value={leaveForm.leave_type} onValueChange={(value) => setLeaveForm({...leaveForm, leave_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Leave</SelectItem>
                  <SelectItem value="emergency">Emergency Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={leaveForm.start_date}
                onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={leaveForm.end_date}
                onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                placeholder="Please provide a reason for your leave request"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLeaveSubmit} disabled={loading === 'leave'}>
              {loading === 'leave' ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advance Request Dialog */}
      <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <DollarSign className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium">{t('advance_request')}</span>
            <span className="text-xs text-muted-foreground">{t('advance_request_desc')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('advance_request')}</DialogTitle>
            <DialogDescription>
              Request an advance payment
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={advanceForm.amount}
                onChange={(e) => setAdvanceForm({...advanceForm, amount: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="advance_reason">Reason</Label>
              <Textarea
                id="advance_reason"
                value={advanceForm.reason}
                onChange={(e) => setAdvanceForm({...advanceForm, reason: e.target.value})}
                placeholder="Please provide a reason for the advance request"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdvanceSubmit} disabled={loading === 'advance'}>
              {loading === 'advance' ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timesheet Dialog */}
      <Dialog open={timesheetDialogOpen} onOpenChange={setTimesheetDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <Clock className="h-6 w-6 text-orange-600" />
            <span className="text-sm font-medium">{t('submit_timesheet')}</span>
            <span className="text-xs text-muted-foreground">{t('submit_timesheet_desc')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('submit_timesheet')}</DialogTitle>
            <DialogDescription>
              Submit your timesheet entry
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="timesheet_date">Date</Label>
              <Input
                id="timesheet_date"
                type="date"
                value={timesheetForm.date}
                onChange={(e) => setTimesheetForm({...timesheetForm, date: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={timesheetForm.start_time}
                  onChange={(e) => setTimesheetForm({...timesheetForm, start_time: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={timesheetForm.end_time}
                  onChange={(e) => setTimesheetForm({...timesheetForm, end_time: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hours_worked">Regular Hours</Label>
                <Input
                  id="hours_worked"
                  type="number"
                  step="0.5"
                  placeholder="8.0"
                  value={timesheetForm.hours_worked}
                  onChange={(e) => setTimesheetForm({...timesheetForm, hours_worked: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="overtime_hours">Overtime Hours</Label>
                <Input
                  id="overtime_hours"
                  type="number"
                  step="0.5"
                  placeholder="0.0"
                  value={timesheetForm.overtime_hours}
                  onChange={(e) => setTimesheetForm({...timesheetForm, overtime_hours: e.target.value})}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timesheet_description">Description</Label>
              <Textarea
                id="timesheet_description"
                value={timesheetForm.description}
                onChange={(e) => setTimesheetForm({...timesheetForm, description: e.target.value})}
                placeholder="Describe your work activities"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimesheetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTimesheetSubmit} disabled={loading === 'timesheet'}>
              {loading === 'timesheet' ? 'Submitting...' : 'Submit Timesheet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <Upload className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-medium">{t('upload_document')}</span>
            <span className="text-xs text-muted-foreground">{t('upload_document_desc')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('upload_document')}</DialogTitle>
            <DialogDescription>
              Upload a new document
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="document_type">Document Type</Label>
              <Select value={documentForm.document_type} onValueChange={(value) => setDocumentForm({...documentForm, document_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id_card">ID Card</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="contract">Employment Contract</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="document_description">Description</Label>
              <Textarea
                id="document_description"
                value={documentForm.description}
                onChange={(e) => setDocumentForm({...documentForm, description: e.target.value})}
                placeholder="Describe the document"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="document_file">File</Label>
              <Input
                id="document_file"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setDocumentForm({...documentForm, file: e.target.files?.[0] || null})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentDialogOpen?.(false)}>
              Cancel
            </Button>
            <Button onClick={handleDocumentUpload} disabled={loading === 'document'}>
              {loading === 'document' ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Other action buttons that redirect to pages */}
      <Button 
        variant="outline" 
        className="h-auto p-4 flex flex-col items-center gap-2"
        onClick={() => window.open('/modules/employee-management/employee/profile/edit', '_blank')}
      >
        <User className="h-6 w-6 text-indigo-600" />
        <span className="text-sm font-medium">{t('update_profile')}</span>
        <span className="text-xs text-muted-foreground">{t('update_profile_desc')}</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="h-auto p-4 flex flex-col items-center gap-2"
        onClick={() => window.open('/modules/employee-management/employee/skills', '_blank')}
      >
        <Award className="h-6 w-6 text-yellow-600" />
        <span className="text-sm font-medium">{t('manage_skills')}</span>
        <span className="text-xs text-muted-foreground">{t('manage_skills_desc')}</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="h-auto p-4 flex flex-col items-center gap-2"
        onClick={() => window.open('/modules/employee-management/employee/training', '_blank')}
      >
        <BookOpen className="h-6 w-6 text-teal-600" />
        <span className="text-sm font-medium">{t('training_records')}</span>
        <span className="text-xs text-muted-foreground">{t('training_records_desc')}</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="h-auto p-4 flex flex-col items-center gap-2"
        onClick={() => window.open('/modules/project-management/employee/assignments', '_blank')}
      >
        <Building className="h-6 w-6 text-red-600" />
        <span className="text-sm font-medium">{t('project_assignments')}</span>
        <span className="text-xs text-muted-foreground">{t('project_assignments_desc')}</span>
      </Button>
    </>
  )
}
