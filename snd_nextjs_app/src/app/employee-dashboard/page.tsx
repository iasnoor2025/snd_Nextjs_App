"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslation } from 'react-i18next'
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  User,
  Building,
  CalendarDays,
  Award,
  Upload,
  Trash2
} from "lucide-react"
import TimesheetCalendar from "@/components/timesheet/TimesheetCalendar"
import ActionDialogs from "@/components/employee/ActionDialogs"

interface EmployeeDashboardData {
  employee: {
    id: string
    erpnext_id?: string
    file_number?: string
    employee_id: string
    name: string
    email: string
    phone: string
    address?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    nationality?: string
    date_of_birth?: string
    hire_date?: string
    supervisor?: string
    designation: string
    department: string
    location: string
    // Salary and compensation
    hourly_rate?: number
    basic_salary?: number
    food_allowance?: number
    housing_allowance?: number
    transport_allowance?: number
    absent_deduction_rate?: number
    overtime_rate_multiplier?: number
    overtime_fixed_rate?: number
    // Bank information
    bank_name?: string
    bank_account_number?: string
    bank_iban?: string
    // Contract details
    contract_hours_per_day?: number
    contract_days_per_month?: number
    // Emergency contact
    emergency_contact_name?: string
    emergency_contact_phone?: string
  }
  statistics: {
    totalTimesheets: number
    pendingLeaves: number
    approvedLeaves: number
    activeProjects: number
    totalAssignments: number
    totalDocuments: number
    totalAdvances: number
    totalSkills: number
    totalTrainingRecords: number
  }
  recentTimesheets: Array<{
    id: string
    date: string
    hours_worked: string
    overtime_hours: string
    status: string
    created_at: string
    start_time: string
    end_time: string
  }>
  recentLeaves: Array<{
    id: string
    start_date: string
    end_date: string
    leave_type: string
    status: string
    created_at: string
    reason: string
    days: number
  }>
  currentProjects: Array<{
    id: string
    name: string
    description: string
    status: string
    assignmentStatus: string
  }>
  documents: Array<{
    id: string
    document_type: string
    file_name: string
    file_path: string
    description: string
    created_at: string
    updated_at: string
  }>
  assignments: Array<{
    id: string
    title?: string
    description?: string
    status?: string
    created_at: string
  }>
  advances: Array<{
    id: string
    amount: number
    reason?: string
    status: string
    created_at: string
  }>
  skills: Array<{
    id: string
    proficiency_level?: string
    certified: boolean
    certification_date?: string
    skill?: {
      name: string
      description?: string
      category?: string
    }
  }>
  trainingRecords: Array<{
    id: string
    status: string
    start_date?: string
    training?: {
      name: string
      description?: string
      duration?: number
      provider?: string
    }
  }>
}

export default function EmployeeDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation('dashboard')
  const [dashboardData, setDashboardData] = useState<EmployeeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchEmployeeDashboardData()
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, session, router])

  const fetchEmployeeDashboardData = async () => {
    try {
      const response = await fetch('/api/employee-dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching employee dashboard data:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('401') && !errorMessage.includes('Unauthorized')) {
        // toast.error("Failed to load employee data")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/employee/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Document deleted successfully')
        // Refresh dashboard data
        fetchEmployeeDashboardData()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete document')
      }
    } catch (error) {
      toast.error('An error occurred while deleting document')
    }
  }

  // Show loading while checking authentication
  if (status === "loading" || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!session) {
    return null
  }

  return (
    <div className="h-full w-full bg-background">
      <div className="w-full p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Employee Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {session?.user?.name || 'Employee'}! Here's your personalized dashboard.
              </p>
            </div>
            <Badge variant="default">
              Active
            </Badge>
          </div>
        </div>

        {/* Quick Actions - First Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dashboardData?.employee?.id && (
                  <ActionDialogs 
                  employeeId={dashboardData.employee.id} 
                  documentDialogOpen={documentDialogOpen}
                  setDocumentDialogOpen={setDocumentDialogOpen}
                  onDocumentUploaded={fetchEmployeeDashboardData}
                />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards - Second Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Timesheets</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.statistics?.totalTimesheets || 0}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.statistics?.pendingLeaves || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.statistics?.activeProjects || 0}</div>
                <p className="text-xs text-muted-foreground">Current assignments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Advances</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.statistics?.totalAdvances || 0}</div>
                <p className="text-xs text-muted-foreground">Advance payments</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Timesheet Calendar - Third Section */}
        {dashboardData?.employee?.id && (
          <div className="mb-8">
            <TimesheetCalendar employeeId={dashboardData.employee.id} />
          </div>
        )}

        {/* Recent Activities & Projects - Fourth Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Recent Timesheets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Timesheets
              </CardTitle>
              <CardDescription>Your latest timesheet entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentTimesheets?.length ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {new Date(dashboardData.recentTimesheets[0].date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.recentTimesheets[0].hours_worked} hours + {dashboardData.recentTimesheets[0].overtime_hours} overtime
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.recentTimesheets[0].start_time?.slice(0, 5)} - {dashboardData.recentTimesheets[0].end_time?.slice(0, 5)}
                      </p>
                    </div>
                    <Badge variant={dashboardData.recentTimesheets[0].status === 'manager_approved' ? 'default' : 'secondary'}>
                      {dashboardData.recentTimesheets[0].status === 'manager_approved' ? 'approved' : dashboardData.recentTimesheets[0].status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent timesheets</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Leave Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Leave Requests
              </CardTitle>
              <CardDescription>Your latest leave applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentLeaves?.length ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{dashboardData.recentLeaves[0].leave_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(dashboardData.recentLeaves[0].start_date).toLocaleDateString()} - {new Date(dashboardData.recentLeaves[0].end_date).toLocaleDateString()} ({dashboardData.recentLeaves[0].days} days)
                      </p>
                      {dashboardData.recentLeaves[0].reason && (
                        <p className="text-xs text-muted-foreground">
                          Reason: {dashboardData.recentLeaves[0].reason}
                        </p>
                      )}
                    </div>
                    <Badge variant={dashboardData.recentLeaves[0].status === 'approved' ? 'default' : dashboardData.recentLeaves[0].status === 'pending' ? 'secondary' : 'destructive'}>
                      {dashboardData.recentLeaves[0].status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent leave requests</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Current Projects
              </CardTitle>
              <CardDescription>Projects you're currently assigned to</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.currentProjects?.length ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{dashboardData.currentProjects[0].name}</p>
                      <p className="text-xs text-muted-foreground">{dashboardData.currentProjects[0].description}</p>
                    </div>
                    <Badge variant={dashboardData.currentProjects[0].status === 'active' ? 'default' : 'secondary'}>
                      {dashboardData.currentProjects[0].status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No current projects</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Advances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Recent Advances
              </CardTitle>
              <CardDescription>Your latest advance requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.advances?.length ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">${dashboardData.advances[0].amount.toLocaleString()}</p>
                      {dashboardData.advances[0].reason && (
                        <p className="text-xs text-muted-foreground">{dashboardData.advances[0].reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(dashboardData.advances[0].created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={dashboardData.advances[0].status === 'approved' ? 'default' : dashboardData.advances[0].status === 'pending' ? 'secondary' : 'destructive'}>
                      {dashboardData.advances[0].status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent advances</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Profile - Compact Professional Design */}
        <div className="mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {dashboardData?.employee?.name?.charAt(0) || 'E'}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{dashboardData?.employee?.name || 'Employee Name'}</div>
                  <div className="text-sm text-gray-600">{dashboardData?.employee?.designation || 'Designation'} • {dashboardData?.employee?.department || 'Department'}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Personal & Contact Info */}
                <div className="p-6 border-r border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Employee ID</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData?.employee?.employee_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData?.employee?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Phone</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData?.employee?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Nationality</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData?.employee?.nationality || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Hire Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.hire_date ? new Date(dashboardData.employee.hire_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Supervisor</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData?.employee?.supervisor || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Employment & Address */}
                <div className="p-6 border-r border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Employment & Location
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Location</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData?.employee?.location || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Contract Hours</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.contract_hours_per_day || 'N/A'} hrs/day
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Contract Days</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.contract_days_per_month || 'N/A'} days/month
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Address</span>
                      <span className="text-sm font-medium text-gray-900 max-w-[150px] truncate" title={dashboardData?.employee?.address || 'N/A'}>
                        {dashboardData?.employee?.address || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">City</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData?.employee?.city || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Country</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData?.employee?.country || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Basic Salary</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.basic_salary ? `$${dashboardData.employee.basic_salary.toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Hourly Rate</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.hourly_rate ? `$${dashboardData.employee.hourly_rate}/hr` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Food Allowance</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.food_allowance ? `$${dashboardData.employee.food_allowance}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Housing Allowance</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.housing_allowance ? `$${dashboardData.employee.housing_allowance}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">Transport Allowance</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.transport_allowance ? `$${dashboardData.employee.transport_allowance}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Bank</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData?.employee?.bank_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information - Collapsible Sections */}
              <div className="border-t border-gray-100">
                {/* Emergency Contact */}
                <div className="p-6 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Contact Name</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData?.employee?.emergency_contact_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Contact Phone</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData?.employee?.emergency_contact_phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                                 {/* Conditional Sections */}
                 {/* Documents Section - Always Show */}
                 <div className="p-6 border-b border-gray-50">
                   <div className="flex items-center justify-between mb-3">
                     <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                       <FileText className="h-4 w-4" />
                       Documents ({dashboardData?.documents?.length || 0})
                     </h3>
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => setDocumentDialogOpen(true)}
                       className="text-xs"
                     >
                       <Upload className="h-3 w-3 mr-1" />
                       Upload New
                     </Button>
                   </div>
                   
                   {dashboardData?.documents?.length ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {dashboardData.documents.slice(0, 3).map((doc) => (
                         <div key={doc.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-105">
                           {/* Document Preview - Larger Size */}
                           <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
                             {/* Thumbnail Image or File Icon */}
                             {doc.file_name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/) ? (
                               // Show image thumbnail
                               <div className="w-full h-full flex items-center justify-center">
                                 <img 
                                   src={doc.file_path} 
                                   alt={doc.file_name}
                                   className="max-w-full max-h-full object-cover rounded-lg shadow-md"
                                   onError={(e) => {
                                     // Fallback to icon if image fails to load
                                     const target = e.target as HTMLImageElement;
                                     target.style.display = 'none';
                                     target.nextElementSibling?.classList.remove('hidden');
                                   }}
                                 />
                                 {/* Fallback icon (hidden by default) */}
                                 <div className="hidden text-center">
                                   <div className="w-20 h-24 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                     <FileText className="h-10 w-10 text-white" />
                                   </div>
                                   <p className="text-sm text-gray-700 font-semibold">{doc.document_type}</p>
                                   <p className="text-xs text-gray-500 mt-1">{doc.file_name.split('.').pop()?.toUpperCase()}</p>
                                 </div>
                               </div>
                             ) : (
                               // Show file icon for non-image files
                               <div className="text-center">
                                 <div className="w-20 h-24 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                   <FileText className="h-10 w-10 text-white" />
                                 </div>
                                 <p className="text-sm text-gray-700 font-semibold">{doc.document_type}</p>
                                 <p className="text-xs text-gray-500 mt-1">{doc.file_name.split('.').pop()?.toUpperCase()}</p>
                               </div>
                             )}
                             
                             {/* Overlay with actions */}
                             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                               <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-y-2 group-hover:translate-y-0 flex gap-2">
                                 <Button 
                                   variant="secondary" 
                                   size="sm" 
                                   onClick={() => window.open(doc.file_path, '_blank')}
                                   className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
                                 >
                                   <FileText className="h-3 w-3 mr-1" />
                                   View
                                 </Button>
                                 <Button 
                                   variant="destructive" 
                                   size="sm" 
                                   onClick={() => handleDeleteDocument(doc.id)}
                                   className="shadow-lg"
                                 >
                                   <Trash2 className="h-3 w-3 mr-1" />
                                   Delete
                                 </Button>
                               </div>
                             </div>
                           </div>
                           
                           {/* Document Info */}
                           <div className="p-4">
                             <div className="flex items-start justify-between">
                               <div className="flex-1 min-w-0">
                                 <p className="text-sm font-semibold text-gray-900 truncate" title={doc.file_name}>
                                   {doc.file_name}
                                 </p>
                                 {doc.description && (
                                   <p className="text-xs text-gray-600 mt-2 line-clamp-2" title={doc.description}>
                                     {doc.description}
                                   </p>
                                 )}
                                 <p className="text-xs text-gray-500 mt-2 flex items-center">
                                   <Calendar className="h-3 w-3 mr-1" />
                                   {new Date(doc.created_at).toLocaleDateString()}
                                 </p>
                               </div>
                             </div>
                           </div>
                         </div>
                       ))}
                       {dashboardData.documents.length > 3 && (
                         <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                           <div className="text-center">
                             <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                             <p className="text-sm text-gray-600 font-medium">+{dashboardData.documents.length - 3} more documents</p>
                             <p className="text-xs text-gray-500">Click to view all</p>
                           </div>
                         </div>
                       )}
                     </div>
                   ) : (
                     /* Empty State - Show when no documents */
                     <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                       <div className="text-center">
                         <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                         <p className="text-sm text-gray-600 font-medium mb-2">No documents uploaded yet</p>
                         <p className="text-xs text-gray-500 mb-4">Upload your first document to get started</p>
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => setDocumentDialogOpen(true)}
                           className="text-xs"
                         >
                           <Upload className="h-3 w-3 mr-1" />
                           Upload Document
                         </Button>
                       </div>
                     </div>
                   )}
                 </div>

                {dashboardData?.skills?.length ? (
                  <div className="p-6 border-b border-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Skills ({dashboardData.skills.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {dashboardData.skills.slice(0, 5).map((skill) => (
                        <Badge key={skill.id} variant={skill.certified ? 'default' : 'secondary'} className="text-xs">
                          {skill.skill?.name || 'N/A'}
                          {skill.certified && <span className="ml-1">✓</span>}
                        </Badge>
                      ))}
                      {dashboardData.skills.length > 5 && (
                        <span className="text-sm text-gray-500">+{dashboardData.skills.length - 5} more</span>
                      )}
                    </div>
                  </div>
                ) : null}

                {dashboardData?.advances?.length ? (
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Recent Advances
                    </h3>
                    <div className="space-y-2">
                      {dashboardData.advances.slice(0, 2).map((advance) => (
                        <div key={advance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium">${advance.amount.toLocaleString()}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(advance.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={advance.status === 'approved' ? 'default' : advance.status === 'pending' ? 'secondary' : 'destructive'}>
                            {advance.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
