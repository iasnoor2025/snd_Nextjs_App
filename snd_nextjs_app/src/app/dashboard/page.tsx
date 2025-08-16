"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslation } from 'react-i18next'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Building2, 
  Wrench, 
  Truck, 
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Plus,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  UserX,
  Activity,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Shield,
  Settings,
  Database,
  Globe,
  Briefcase,
  Home,
  Car,
  Plane,
  Ship,
  Timer,
  AlertCircle,
  FileWarning,
  UserCheck,
  CalendarDays,
  Clock3,
  TrendingDown,
  Award,
  Star,
  Zap as Lightning
} from "lucide-react"
import { RoleBased } from "@/lib/rbac/rbac-components"

// Import types from the dashboard service
import type {
  DashboardStats,
  IqamaData,
  TimesheetData,
  DocumentData,
  LeaveRequest,
  ActiveRental,
  ActiveProject,
  RecentActivity
} from '@/lib/services/dashboard-service';

export default function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const router = useRouter()
  const { data: session, status } = useSession()

  // Enhanced state for comprehensive dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [iqamaData, setIqamaData] = useState<IqamaData[]>([])
  const [timesheetData, setTimesheetData] = useState<TimesheetData[]>([])
  const [documentData, setDocumentData] = useState<DocumentData[]>([])
  const [leaveData, setLeaveData] = useState<LeaveRequest[]>([])
  const [employeesOnLeaveData, setEmployeesOnLeaveData] = useState<any[]>([])
  const [rentalData, setRentalData] = useState<ActiveRental[]>([])
  const [projectData, setProjectData] = useState<ActiveProject[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // State for update modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedIqama, setSelectedIqama] = useState<IqamaData | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // State for timesheet approval
  const [approvingTimesheet, setApprovingTimesheet] = useState<number | null>(null);
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);
  
  // State for timesheet rejection
  const [rejectingTimesheet, setRejectingTimesheet] = useState<number | null>(null);
  
  // State for marking absent
  const [markingAbsent, setMarkingAbsent] = useState<number | null>(null);
  
  // State for edit hours modal
  const [isEditHoursModalOpen, setIsEditHoursModalOpen] = useState(false);
  const [selectedTimesheetForEdit, setSelectedTimesheetForEdit] = useState<any>(null);
  const [editHours, setEditHours] = useState('');
  const [editOvertimeHours, setEditOvertimeHours] = useState('');
  const [updatingHours, setUpdatingHours] = useState(false);
  
  // State for current time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [previousActivityCount, setPreviousActivityCount] = useState(0);
  
  // Activity filtering state
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [activitySearch, setActivitySearch] = useState<string>('');
  
  // Iqama search and filtering state
  const [iqamaSearch, setIqamaSearch] = useState<string>('');
  const [iqamaStatusFilter, setIqamaStatusFilter] = useState<string>('all');
  const [isSearching, setIsSearching] = useState(false);
  
  // Pagination logic with search and filtering
  const filteredIqamaData = iqamaData.filter(item => {
    // Status filter
    const matchesStatus = iqamaStatusFilter === 'all' || item.status === iqamaStatusFilter;
    
    // Search filter
    const matchesSearch = !iqamaSearch || 
      item.employeeName?.toLowerCase().includes(iqamaSearch.toLowerCase()) ||
      item.fileNumber?.toLowerCase().includes(iqamaSearch.toLowerCase()) ||
      item.iqamaNumber?.toLowerCase().includes(iqamaSearch.toLowerCase()) ||
      item.department?.toLowerCase().includes(iqamaSearch.toLowerCase()) ||
      item.nationality?.toLowerCase().includes(iqamaSearch.toLowerCase()) ||
      item.position?.toLowerCase().includes(iqamaSearch.toLowerCase());
    
    // Exclude active status and apply filters
    return item.status !== 'active' && matchesStatus && matchesSearch;
  });
  const totalPages = Math.ceil(filteredIqamaData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedIqamaData = filteredIqamaData.slice(startIndex, endIndex);
  
  // Activity filtering logic
  const filteredActivities = recentActivity.filter(activity => {
    const matchesFilter = activityFilter === 'all' || 
                         (activityFilter === 'timesheet' && activity.type.includes('Timesheet')) ||
                         (activityFilter === 'leave' && activity.type.includes('Leave')) ||
                         (activityFilter === 'assignment' && activity.type.includes('Assignment')) ||
                         (activityFilter === 'document' && activity.type.includes('Document')) ||
                         (activityFilter === 'rental' && activity.type.includes('Rental'));
    
    const matchesSearch = !activitySearch || 
                         activity.description?.toLowerCase().includes(activitySearch.toLowerCase()) ||
                         activity.user?.toLowerCase().includes(activitySearch.toLowerCase()) ||
                         activity.type.toLowerCase().includes(activitySearch.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });
  
  // Generate page numbers to display (max 5 pages)
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show 5 pages with smart positioning
      if (currentPage <= 3) {
        // Near the beginning: show pages 1-5
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Near the end: show last 5 pages
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle: show current page ± 2
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  // Reset search and filters when refreshing data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
      // Reset search and filters after refresh
      setIqamaSearch('');
      setIqamaStatusFilter('all');
      setCurrentPage(1);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Ensure user is authenticated and not an employee
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (session.user?.role === 'EMPLOYEE') {
      router.push('/employee-dashboard');
      return;
    }
  }, [session, status, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !session?.user) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, session]);
  
  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);
  
  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [iqamaSearch]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Fetch all data from the API route
      const response = await fetch('/api/dashboard', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const {
        stats,
        iqamaData,
        timesheetData,
        documentData,
        leaveData,
        employeesOnLeaveData,
        rentalData,
        projectData,
        recentActivity: activityData
      } = data;


      
      // Set all the data
      setStats(stats);
      setIqamaData(iqamaData);
      setTimesheetData(timesheetData);
      setDocumentData(documentData);
      setLeaveData(leaveData);
      setEmployeesOnLeaveData(employeesOnLeaveData);
      setRentalData(rentalData);
      setProjectData(projectData);
      
      // Track new activities
      if (previousActivityCount > 0 && activityData.length > previousActivityCount) {
        setNewActivityCount(activityData.length - previousActivityCount);
        // Clear new activity count after 5 seconds
        setTimeout(() => setNewActivityCount(0), 5000);
      }
      setPreviousActivityCount(activityData.length);
      setRecentActivity(activityData);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Try to extract error details from the response
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      
      // Set error state for user feedback
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };



  // Handle opening update modal
  const handleOpenUpdateModal = (iqama: IqamaData) => {
    setSelectedIqama(iqama);
    setNewExpiryDate(iqama.expiryDate ? new Date(iqama.expiryDate).toISOString().split('T')[0] : '');
    setIsUpdateModalOpen(true);
  }

  // Handle updating Iqama expiry date
  const handleUpdateIqama = async () => {
    if (!selectedIqama || !newExpiryDate) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/employees/${selectedIqama.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          iqama_expiry: newExpiryDate
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update Iqama expiry date');
      }

      // Refresh dashboard data to show updated information
      await fetchDashboardData();
      
      // Close modal and reset state
      setIsUpdateModalOpen(false);
      setSelectedIqama(null);
      setNewExpiryDate('');
    } catch (error) {
      console.error('Error updating Iqama expiry date:', error);
      alert('Failed to update Iqama expiry date. Please try again.');
      } finally {
      setUpdating(false);
    }
  }

  // Helper function to get the next approval stage
  const getNextApprovalStage = (currentStatus: string): string => {
    switch (currentStatus) {
      case 'draft':
        return 'foreman';
      case 'submitted':
        return 'foreman';
      case 'foreman_approved':
        return 'incharge';
      case 'incharge_approved':
        return 'checking';
      case 'checking_approved':
        return 'manager';
      case 'manager_approved':
        return 'final';
      default:
        return 'next';
    }
  };

  // Handle approving timesheet
  const handleApproveTimesheet = async (timesheetId: number) => {
    setApprovingTimesheet(timesheetId);
    try {
      const response = await fetch(`/api/timesheets/${timesheetId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to approve timesheet');
      }

      const result = await response.json();
      
      // Show success message
      setApprovalSuccess(result.message);
      console.log('Timesheet approved successfully:', result.message);
      
      // Clear success message after 5 seconds
      setTimeout(() => setApprovalSuccess(null), 5000);
      
      // Refresh dashboard data to show updated approval status
      await fetchDashboardData();
    } catch (error) {
      console.error('Error approving timesheet:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve timesheet. Please try again.');
    } finally {
      setApprovingTimesheet(null);
    }
  }

  // Handle rejecting timesheet
  const handleRejectTimesheet = async (timesheetId: number) => {
    setRejectingTimesheet(timesheetId);
    try {
      const response = await fetch(`/api/timesheets/${timesheetId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: 'Rejected by foreman/supervisor'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reject timesheet');
      }

      const result = await response.json();
      
      // Show success message
      setApprovalSuccess(`Timesheet rejected: ${result.message}`);
      console.log('Timesheet rejected successfully:', result.message);
      
      // Clear success message after 5 seconds
      setTimeout(() => setApprovalSuccess(null), 5000);
      
      // Refresh dashboard data to show updated status
      await fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject timesheet. Please try again.');
    } finally {
      setRejectingTimesheet(null);
    }
  }

  // Handle marking employee as absent
  const handleMarkAbsent = async (timesheetId: number) => {
    setMarkingAbsent(timesheetId);
    try {
      const response = await fetch(`/api/timesheets/${timesheetId}/mark-absent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'absent',
          reason: 'Marked absent by foreman/supervisor'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to mark employee as absent');
      }

      const result = await response.json();
      
      // Show success message
      setApprovalSuccess(`Employee marked as absent: ${result.message}`);
      console.log('Employee marked as absent successfully:', result.message);
      
      // Clear success message after 5 seconds
      setTimeout(() => setApprovalSuccess(null), 5000);
      
      // Refresh dashboard data to show updated status
      await fetchDashboardData();
    } catch (error) {
      console.error('Error marking employee as absent:', error);
      alert(error instanceof Error ? error.message : 'Failed to mark employee as absent. Please try again.');
    } finally {
      setMarkingAbsent(null);
    }
  }

  // Handle opening edit hours modal
  const handleEditHours = (timesheetId: number) => {
    const timesheet = timesheetData.find(t => t.id === timesheetId);
    if (timesheet) {
      setSelectedTimesheetForEdit(timesheet);
      const hours = Number(timesheet.totalHours) || 0;
      const otHours = Number(timesheet.overtimeHours) || 0;
      setEditHours(isNaN(hours) ? '0.0' : hours.toFixed(1));
      setEditOvertimeHours(isNaN(otHours) ? '0.0' : otHours.toFixed(1));
      setIsEditHoursModalOpen(true);
    }
  }

  // Handle updating hours and overtime
  const handleUpdateHours = async () => {
    if (!selectedTimesheetForEdit || !editHours) return;
    
    setUpdatingHours(true);
    try {
      const response = await fetch(`/api/timesheets/${selectedTimesheetForEdit.id}/update-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          hoursWorked: parseFloat(editHours),
          overtimeHours: parseFloat(editOvertimeHours) || 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update hours');
      }

      const result = await response.json();
      
      // Show success message
      setApprovalSuccess(`Hours updated successfully: ${result.message}`);
      console.log('Hours updated successfully:', result.message);
      
      // Clear success message after 5 seconds
      setTimeout(() => setApprovalSuccess(null), 5000);
      
      // Close modal and reset state
      setIsEditHoursModalOpen(false);
      setSelectedTimesheetForEdit(null);
      setEditHours('');
      setEditOvertimeHours('');
      
      // Refresh dashboard data to show updated hours
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating hours:', error);
      alert(error instanceof Error ? error.message : 'Failed to update hours. Please try again.');
    } finally {
      setUpdatingHours(false);
    }
  }

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header Section */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Executive Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Welcome back, {session.user?.name || 'Administrator'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                {session.user?.role?.replace('_', ' ')}
              </Badge>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                Current: {currentTime.toLocaleTimeString()}
              </div>
              {lastUpdated && (
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
              <Button 
                onClick={handleRefresh} 
                disabled={refreshing}
                variant="outline" 
                size="sm"
                className="bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
          </div>
          </div>
        </div>
          </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading dashboard data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Error Loading Dashboard</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
              <Button onClick={() => { setError(null); fetchDashboardData(); }} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Employees</p>
                      <p className="text-3xl font-bold">{stats?.totalEmployees?.toLocaleString() || '0'}</p>
                      <p className="text-blue-100 text-sm mt-1">Active workforce</p>
                    </div>
                    <div className="bg-blue-500/30 p-3 rounded-full backdrop-blur-sm">
                      <Users className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Today's Attendance</p>
                      <p className="text-3xl font-bold">{stats?.todayTimesheets || '0'}</p>
                      <p className="text-emerald-100 text-sm mt-1">Present today</p>
                    </div>
                    <div className="bg-emerald-500/30 p-3 rounded-full backdrop-blur-sm">
                      <UserCheck className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Active Projects</p>
                      <p className="text-3xl font-bold">{stats?.activeProjects || '0'}</p>
                      <p className="text-orange-100 text-sm mt-1">Ongoing work</p>
                    </div>
                    <div className="bg-orange-500/30 p-3 rounded-full backdrop-blur-sm">
                      <Building2 className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Critical Alerts</p>
                      <p className="text-3xl font-bold">
                        {(stats?.expiredDocuments || 0) + (stats?.expiringDocuments || 0)}
                      </p>
                      <p className="text-purple-100 text-sm mt-1">Documents & Iqama</p>
                    </div>
                    <div className="bg-purple-500/30 p-3 rounded-full backdrop-blur-sm">
                      <AlertCircle className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-600 via-rose-700 to-rose-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-rose-100 text-sm font-medium">Employees on Leave</p>
                      <p className="text-3xl font-bold">{stats?.employeesOnLeave || '0'}</p>
                      <p className="text-rose-100 text-sm mt-1">Currently away</p>
                    </div>
                    <div className="bg-rose-500/30 p-3 rounded-full backdrop-blur-sm">
                      <Calendar className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Critical Alerts Section */}
            <div className="space-y-6">
              {/* Iqama Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Iqama Status Overview
                  </CardTitle>
                  <CardDescription>
                    Complete Iqama status including expired, expiring, and missing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      {/* Search Input */}
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name, file #, iqama #, department, nationality..."
                            value={iqamaSearch}
                            onChange={(e) => {
                              setIqamaSearch(e.target.value);
                              setIsSearching(true);
                              setCurrentPage(1); // Reset to first page when searching
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setIqamaSearch('');
                                setCurrentPage(1);
                              }
                            }}
                            className="pl-10"
                          />
                          {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Filter */}
                      <div className="flex-shrink-0">
                        <select
                          value={iqamaStatusFilter}
                          onChange={(e) => {
                            setIqamaStatusFilter(e.target.value);
                            setCurrentPage(1); // Reset to first page when filtering
                          }}
                          className="h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                        >
                          <option value="all">All Status</option>
                          <option value="expired">Expired</option>
                          <option value="expiring">Expiring</option>
                          <option value="missing">Missing</option>
                        </select>
                      </div>
                      
                      {/* Clear Filters Button */}
                      {(iqamaSearch || iqamaStatusFilter !== 'all') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIqamaSearch('');
                            setIqamaStatusFilter('all');
                            setCurrentPage(1);
                          }}
                          className="flex-shrink-0"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    {/* Status Summary */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center p-2 bg-muted rounded-lg">
                        <div className="text-lg font-bold">
                          {filteredIqamaData.filter(item => item.status === 'expired').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Expired</div>
                      </div>
                      <div className="text-center p-2 bg-muted rounded-lg">
                        <div className="text-lg font-bold">
                          {filteredIqamaData.filter(item => item.status === 'expiring').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Expiring</div>
                      </div>
                      <div className="text-center p-2 bg-muted rounded-lg">
                        <div className="text-lg font-bold">
                          {filteredIqamaData.filter(item => item.status === 'missing').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Missing</div>
                      </div>
                      <div className="text-center p-2 bg-muted rounded-lg">
                        <div className="text-lg font-bold">
                          {filteredIqamaData.length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {iqamaSearch || iqamaStatusFilter !== 'all' ? 'Filtered' : 'Total'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Search Results Summary */}
                    {(iqamaSearch || iqamaStatusFilter !== 'all') && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-3">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">
                            {filteredIqamaData.length} result{filteredIqamaData.length !== 1 ? 's' : ''} found
                          </span>
                          {iqamaSearch && (
                            <span> for "{iqamaSearch}"</span>
                          )}
                          {iqamaStatusFilter !== 'all' && (
                            <span> with status "{iqamaStatusFilter}"</span>
                          )}
                          {iqamaData.filter(item => item.status !== 'active').length > 0 && (
                            <span className="text-xs opacity-60 ml-2">
                              (from {iqamaData.filter(item => item.status !== 'active').length} total records)
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIqamaSearch('');
                            setIqamaStatusFilter('all');
                            setCurrentPage(1);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Clear All
                        </Button>
                      </div>
                    )}
                    
                    {/* All Iqama Records Table */}
                    <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>File #</TableHead>
                            <TableHead>Iqama #</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Nationality</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Days</TableHead>
                            <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                          {paginatedIqamaData
                            .map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  <div>
                                    <div className="font-semibold">{item.employeeName}</div>
                                    {item.position && (
                                      <div className="text-sm text-muted-foreground">{item.position}</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{item.fileNumber || 'N/A'}</TableCell>
                                <TableCell>{item.iqamaNumber || 'N/A'}</TableCell>
                                <TableCell>{item.department || 'N/A'}</TableCell>
                                <TableCell>{item.nationality || 'N/A'}</TableCell>
                                <TableCell>
                                  {item.expiryDate ? (
                                    <span className="font-medium">
                                      {new Date(item.expiryDate).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={item.status === 'expired' ? 'destructive' : 
                                           item.status === 'expiring' ? 'secondary' : 
                                           item.status === 'missing' ? 'outline' : 'default'}
                                  >
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {item.daysRemaining !== null ? (
                                    <span className="font-medium">
                                      {item.daysRemaining} days
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenUpdateModal(item)}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Update
                                  </Button>
                        </TableCell>
                      </TableRow>
                            ))}
                </TableBody>
              </Table>
            </div>
                    
                    {filteredIqamaData.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-60" />
                        {iqamaSearch || iqamaStatusFilter !== 'all' ? (
                          <>
                            <p className="font-medium">No Iqama records found</p>
                            <p className="text-sm opacity-80">
                              Try adjusting your search terms or filters
                            </p>
                            {iqamaData.filter(item => item.status !== 'active').length > 0 && (
                              <p className="text-xs opacity-60 mt-2">
                                Showing {iqamaData.filter(item => item.status !== 'active').length} total records
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="font-medium">No critical Iqama issues found</p>
                            <p className="text-sm opacity-80">All Iqama documents are up to date</p>
                          </>
                        )}
                      </div>
                    )}
                    
                    {filteredIqamaData.length > 0 && (
                      <div className="pt-4 border-t">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Total Critical Records:</span> {filteredIqamaData.length}
                          </div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-destructive rounded-full"></div>
                              Expired: {filteredIqamaData.filter(item => item.status === 'expired').length}
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-secondary rounded-full"></div>
                              Expiring: {filteredIqamaData.filter(item => item.status === 'expiring').length}
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-muted rounded-full"></div>
                              Missing: {filteredIqamaData.filter(item => item.status === 'missing').length}
                            </span>
                          </div>
                        </div>
                        
                        {/* Pagination Controls */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Show</span>
                            <select
                              value={pageSize}
                              onChange={(e) => handlePageSizeChange(e.target.value)}
                              className="h-8 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm"
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={20}>20</option>
                              <option value={50}>50</option>
                            </select>
                            <span className="text-sm text-muted-foreground">per page</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              Previous
                      </Button>
                            
                            <div className="flex items-center gap-1">
                              {getPageNumbers().map((page, index) => (
                                <div key={page} className="flex items-center gap-1">
                                  {/* Show ellipsis before first page if needed */}
                                  {index === 0 && page > 1 && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(1)}
                                        className="h-8 w-8 p-0"
                                      >
                                        1
                                      </Button>
                                      {page > 2 && (
                                        <span className="px-2 text-muted-foreground">...</span>
                                      )}
                                    </>
                                  )}
                                  
                                  <Button
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                    className="h-8 w-8 p-0"
                                  >
                                    {page}
                                  </Button>
                                  
                                  {/* Show ellipsis after last page if needed */}
                                  {index === getPageNumbers().length - 1 && page < totalPages && (
                                    <>
                                      {page < totalPages - 1 && (
                                        <span className="px-2 text-muted-foreground">...</span>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(totalPages)}
                                        className="h-8 w-8 p-0"
                                      >
                                        {totalPages}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </div>
                        </div>
                      </div>
                    )}
            </div>
                </CardContent>
              </Card>

                            {/* Today's Timesheets */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Timer className="h-5 w-5" />
                        Today's Attendance
                      </CardTitle>
                      <CardDescription>
                        Employee attendance and timesheet status for today
                        <span className="ml-2 text-muted-foreground">
                          ({currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
                        </span>
                      </CardDescription>
                    </div>
                    <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Can Approve
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          Role: {session?.user?.role?.replace('_', ' ')}
                        </div>
                      </div>
                    </RoleBased>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Attendance Summary */}
                  <div className="grid grid-cols-5 gap-4">
                    <div className="text-center p-3 rounded-lg border bg-card">
                      <div className="text-2xl font-bold text-green-600">
                        {timesheetData.filter(item => item.status === 'present').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Present</div>
                    </div>
                    <div className="text-center p-3 rounded-lg border bg-card">
                      <div className="text-2xl font-bold text-yellow-600">
                        {timesheetData.filter(item => item.status === 'late').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Late</div>
                    </div>
                    <div className="text-center p-3 rounded-lg border bg-card">
                      <div className="text-2xl font-bold text-red-600">
                        {timesheetData.filter(item => item.status === 'absent').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Absent</div>
                    </div>
                    <div className="text-center p-3 rounded-lg border bg-card">
                      <div className="text-2xl font-bold text-blue-600">
                        {timesheetData.filter(item => item.approvalStatus === 'manager_approved').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Approved</div>
                    </div>
                    <div className="text-center p-3 rounded-lg border bg-card">
                      <div className="text-2xl font-bold text-orange-600">
                        {timesheetData.filter(item => item.approvalStatus !== 'manager_approved').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                  </div>
                  
                  {/* Approval Workflow Indicator */}
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium">Approval Workflow</div>
                      <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                        <div className="text-xs text-muted-foreground">
                          Your Role: {session?.user?.role?.replace('_', ' ')}
                        </div>
                      </RoleBased>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Draft/Submitted</span>
                      </div>
                      <div className="text-muted-foreground">→</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Foreman</span>
                      </div>
                      <div className="text-muted-foreground">→</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Incharge</span>
                      </div>
                      <div className="text-muted-foreground">→</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Checking</span>
                      </div>
                      <div className="text-muted-foreground">→</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-600">Manager (Final)</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Success Message */}
                  {approvalSuccess && (
                    <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">{approvalSuccess}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Timesheet Table */}
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Approval</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>OT</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timesheetData.slice(0, 10).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.employeeName}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.status === 'present' ? 'default' : 
                                       item.status === 'late' ? 'secondary' : 
                                       item.status === 'half-day' ? 'outline' : 'destructive'}
                                className={`${
                                  item.status === 'present' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
                                  item.status === 'late' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' :
                                  item.status === 'half-day' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' :
                                  'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                                }`}
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  item.approvalStatus === 'manager_approved' ? 'default' :
                                  item.approvalStatus === 'foreman_approved' ? 'secondary' :
                                  item.approvalStatus === 'incharge_approved' ? 'outline' :
                                  item.approvalStatus === 'checking_approved' ? 'secondary' :
                                  item.approvalStatus === 'submitted' ? 'secondary' :
                                  item.approvalStatus === 'pending' ? 'outline' :
                                  item.approvalStatus === 'draft' ? 'outline' :
                                  'destructive'
                                }
                                className={`capitalize ${
                                  item.approvalStatus === 'manager_approved' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
                                  item.approvalStatus === 'foreman_approved' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                                  item.approvalStatus === 'incharge_approved' ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' :
                                  item.approvalStatus === 'checking_approved' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' :
                                  item.approvalStatus === 'submitted' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' :
                                  item.approvalStatus === 'pending' ? 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800' :
                                  item.approvalStatus === 'draft' ? 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800' :
                                  'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                                }`}
                              >
                                {item.approvalStatus === 'manager_approved' ? 'Final Approved' :
                                 item.approvalStatus === 'foreman_approved' ? 'Foreman Approved' :
                                 item.approvalStatus === 'incharge_approved' ? 'Incharge Approved' :
                                 item.approvalStatus === 'checking_approved' ? 'Checking Approved' :
                                 item.approvalStatus === 'submitted' ? 'Submitted' :
                                 item.approvalStatus === 'pending' ? 'Pending' :
                                 item.approvalStatus === 'draft' ? 'Draft' :
                                 item.approvalStatus}
                              </Badge>
                              {item.approvalStatus !== 'manager_approved' && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Next: {getNextApprovalStage(item.approvalStatus)}
                                </div>
                              )}
                            </TableCell>
                                                          <TableCell className="text-sm">
                                <div className="text-center">
                                  <div className="font-medium">
                                    {(() => {
                                      try {
                                        const hours = Number(item.totalHours) || 0;
                                        return isNaN(hours) ? '0.0' : hours.toFixed(1);
                                      } catch (error) {
                                        console.error('Error formatting totalHours:', error, item.totalHours);
                                        return '0.0';
                                      }
                                    })()}h
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="text-center">
                                  <div className="font-medium text-orange-600 dark:text-orange-400">
                                    {(() => {
                                      try {
                                        const otHours = Number(item.overtimeHours) || 0;
                                        return isNaN(otHours) ? '0.0' : otHours.toFixed(1);
                                      } catch (error) {
                                        console.error('Error formatting overtimeHours:', error, item.overtimeHours);
                                        return '0.0';
                                      }
                                    })()}h
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="text-center">
                                  <div className="font-medium text-blue-600 dark:text-blue-400">
                                    {(() => {
                                      try {
                                        const hours = Number(item.totalHours) || 0;
                                        const otHours = Number(item.overtimeHours) || 0;
                                        const total = (isNaN(hours) ? 0 : hours) + (isNaN(otHours) ? 0 : otHours);
                                        return total.toFixed(1);
                                      } catch (error) {
                                        console.error('Error calculating total:', error, { totalHours: item.totalHours, overtimeHours: item.overtimeHours });
                                        return '0.0';
                                      }
                                    })()}h
                                  </div>
                                </div>
                              </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {/* Approve Button */}
                                {item.approvalStatus !== 'manager_approved' && (
                                  <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleApproveTimesheet(item.id)}
                                      disabled={approvingTimesheet === item.id}
                                      title={`Approve to next stage: ${getNextApprovalStage(item.approvalStatus)}`}
                                      className="h-8 w-8 p-0"
                                    >
                                      {approvingTimesheet === item.id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </RoleBased>
                                )}
                                
                                {/* Reject Button - Only for foreman and above */}
                                {item.approvalStatus !== 'manager_approved' && item.approvalStatus !== 'rejected' && (
                                  <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRejectTimesheet(item.id)}
                                      disabled={rejectingTimesheet === item.id}
                                      title="Reject timesheet"
                                      className="h-8 w-8 p-0 border-red-200 text-red-700 hover:bg-red-50"
                                    >
                                      {rejectingTimesheet === item.id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <XCircle className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </RoleBased>
                                )}
                                
                                {/* Mark Absent Button - Only for foreman and above */}
                                <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAbsent(item.id)}
                                    disabled={markingAbsent === item.id}
                                    title="Mark employee as absent"
                                    className="h-8 w-8 p-0 border-orange-200 text-orange-700 hover:bg-orange-50"
                                  >
                                    {markingAbsent === item.id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <UserX className="h-4 w-4" />
                                    )}
                                  </Button>
                                </RoleBased>
                                
                                {/* Edit Hours Button - Only for foreman and above */}
                                <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditHours(item.id)}
                                    title="Edit hours and overtime"
                                    className="h-8 w-8 p-0 border-blue-200 text-blue-700 hover:bg-blue-50"
                                  >
                                    <Clock className="h-4 w-4" />
                                  </Button>
                                </RoleBased>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* No timesheets message */}
                  {timesheetData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Timer className="h-8 w-8 mx-auto mb-2 opacity-60" />
                      <p className="font-medium">No timesheets found for today</p>
                      <p className="text-sm opacity-80">Employees may not have submitted timesheets yet</p>
                    </div>
                  )}
                  
                  {timesheetData.length > 0 && (
                    <>
                      {/* Approval Progress Summary */}
                      <div className="p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="font-medium">Approval Progress:</span>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Final Approved: {timesheetData.filter(item => item.approvalStatus === 'manager_approved').length}
                              </span>
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                In Progress: {timesheetData.filter(item => item.approvalStatus !== 'manager_approved').length}
                              </span>
                              <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                                <span className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  Can Approve: {timesheetData.filter(item => item.approvalStatus !== 'manager_approved').length}
                                </span>
                              </RoleBased>
                            </div>
                          </div>
                          <div className="text-muted-foreground">
                            {Math.round((timesheetData.filter(item => item.approvalStatus === 'manager_approved').length / timesheetData.length) * 100)}% Complete
                          </div>
                        </div>
                        
                        {/* Approval Stage Breakdown */}
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs text-muted-foreground mb-2">Stage Breakdown:</div>
                          <div className="grid grid-cols-5 gap-2 text-xs">
                            <div className="text-center">
                              <div className="font-medium">{timesheetData.filter(item => item.approvalStatus === 'submitted' || item.approvalStatus === 'draft').length}</div>
                              <div className="text-muted-foreground">Submitted</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{timesheetData.filter(item => item.approvalStatus === 'foreman_approved').length}</div>
                              <div className="text-muted-foreground">Foreman</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{timesheetData.filter(item => item.approvalStatus === 'incharge_approved').length}</div>
                              <div className="text-muted-foreground">Incharge</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{timesheetData.filter(item => item.approvalStatus === 'checking_approved').length}</div>
                              <div className="text-muted-foreground">Checking</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{timesheetData.filter(item => item.approvalStatus === 'manager_approved').length}</div>
                              <div className="text-muted-foreground">Manager</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="w-full" 
                              onClick={() => router.push('/modules/timesheet-management')}>
                        View All Timesheets ({timesheetData.length} records)
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
          </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <RoleBased roles={['SUPER_ADMIN', 'ADMIN']}>
                <Card className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => router.push('/modules/user-management')}>
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-80" />
                    <h3 className="text-lg font-semibold mb-2">User Management</h3>
                    <p className="text-indigo-100 text-sm">Manage users, roles & permissions</p>
                  </CardContent>
                </Card>
              </RoleBased>

              <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <Card className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => router.push('/modules/analytics')}>
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-80" />
                    <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                    <p className="text-emerald-100 text-sm">Business intelligence & reports</p>
                  </CardContent>
                </Card>
              </RoleBased>

              <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                <Card className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => router.push('/modules/payroll-management')}>
                  <CardContent className="p-6 text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-80" />
                    <h3 className="text-lg font-semibold mb-2">Payroll</h3>
                    <p className="text-amber-100 text-sm">Salary & compensation management</p>
                  </CardContent>
                </Card>
              </RoleBased>

              <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <Card className="bg-gradient-to-br from-rose-600 via-rose-700 to-rose-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => router.push('/modules/settings')}>
                  <CardContent className="p-6 text-center">
                    <Settings className="h-12 w-12 mx-auto mb-3 opacity-80" />
                    <h3 className="text-lg font-semibold mb-2">Settings</h3>
                    <p className="text-rose-100 text-sm">System configuration</p>
                  </CardContent>
                </Card>
              </RoleBased>
            </div>

            {/* Recent Activity */}
            <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 shadow-lg border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Activity className="h-5 w-5" />
                      Recent System Activity
                      {newActivityCount > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                          {newActivityCount} new
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Latest system events, user actions, and important notifications
                      {autoRefresh && (
                        <span className="ml-2 text-green-600 dark:text-green-400 flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Auto-refresh toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoRefresh"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="autoRefresh" className="text-sm text-slate-600 dark:text-slate-400">
                        Auto-refresh
                      </label>
                    </div>
                    
                    {/* Refresh interval selector */}
                    <select
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      disabled={!autoRefresh}
                      className="h-8 px-2 text-sm border border-slate-300 rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 disabled:opacity-50"
                    >
                      <option value={15000}>15s</option>
                      <option value={30000}>30s</option>
                      <option value={60000}>1m</option>
                      <option value={300000}>5m</option>
                    </select>
                    
                    {/* Manual refresh button */}
                    <Button 
                      onClick={handleRefresh} 
                      disabled={refreshing}
                      variant="outline" 
                      size="sm"
                      className="bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">No recent activity</p>
                  ) : (
                    <>
                      {/* Activity Summary */}
                      <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {recentActivity.filter(a => a.type.includes('Timesheet')).length}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Timesheets</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {recentActivity.filter(a => a.type.includes('Leave')).length}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Leave Requests</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {recentActivity.filter(a => a.type.includes('Assignment')).length}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Assignments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {recentActivity.filter(a => a.type.includes('Document')).length}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Documents</div>
                        </div>
                      </div>

                      {/* Search and Filter Controls */}
                      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              placeholder="Search activities..."
                              value={activitySearch}
                              onChange={(e) => setActivitySearch(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={activityFilter}
                            onChange={(e) => setActivityFilter(e.target.value)}
                            className="h-10 px-3 text-sm border border-slate-300 rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
                          >
                            <option value="all">All Activities</option>
                            <option value="timesheet">Timesheets</option>
                            <option value="leave">Leave Requests</option>
                            <option value="assignment">Assignments</option>
                            <option value="document">Documents</option>
                            <option value="rental">Rentals</option>
                          </select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActivitySearch('');
                              setActivityFilter('all');
                            }}
                            className="h-10"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>

                      {/* Activity List */}
                      {filteredActivities.slice(0, 15).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                          <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                            activity.severity === 'high' ? 'bg-red-500' : 
                            activity.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {activity.user}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock3 className="h-3 w-3" />
                                {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'N/A'}
                              </span>
                              <span>•</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  activity.type.includes('Timesheet') ? 'border-blue-300 text-blue-700 bg-blue-50' :
                                  activity.type.includes('Leave') ? 'border-green-300 text-green-700 bg-green-50' :
                                  activity.type.includes('Assignment') ? 'border-purple-300 text-purple-700 bg-purple-50' :
                                  activity.type.includes('Document') ? 'border-orange-300 text-orange-700 bg-orange-50' :
                                  'border-slate-300 text-slate-700 bg-slate-50'
                                }`}
                              >
                                {activity.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {filteredActivities.length > 15 && (
                        <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50" 
                                onClick={() => router.push('/modules/activity-log')}>
                          View All Activity ({filteredActivities.length} records)
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Update Iqama Modal */}
            <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Update Iqama Expiry Date</DialogTitle>
                  <DialogDescription>
                    Update the expiry date for {selectedIqama?.employeeName}'s Iqama.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expiryDate" className="text-right">
                      Expiry Date
                    </Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={newExpiryDate}
                      onChange={(e) => setNewExpiryDate(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUpdateModalOpen(false)}
                    disabled={updating}
                  >
                    Cancel
                      </Button>
                  <Button
                    type="button"
                    onClick={handleUpdateIqama}
                    disabled={!newExpiryDate || updating}
                  >
                    {updating ? 'Updating...' : 'Update'}
                      </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Hours Modal */}
            <Dialog open={isEditHoursModalOpen} onOpenChange={setIsEditHoursModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Timesheet Hours</DialogTitle>
                  <DialogDescription>
                    Update hours and overtime for {selectedTimesheetForEdit?.employeeName}'s timesheet.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="hoursWorked" className="text-right">
                      Hours Worked
                    </Label>
                    <Input
                      id="hoursWorked"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={editHours}
                      onChange={(e) => setEditHours(e.target.value)}
                      className="col-span-3"
                      placeholder="8.0"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="overtimeHours" className="text-right">
                      Overtime Hours
                    </Label>
                    <Input
                      id="overtimeHours"
                      type="number"
                      step="0.5"
                      min="0"
                      max="12"
                      value={editOvertimeHours}
                      onChange={(e) => setEditOvertimeHours(e.target.value)}
                      className="col-span-3"
                      placeholder="2.0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditHoursModalOpen(false)}
                    disabled={updatingHours}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUpdateHours}
                    disabled={!editHours || updatingHours}
                  >
                    {updatingHours ? 'Updating...' : 'Update Hours'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
              </div>
            )}
      </div>
    </div>
  )
}
