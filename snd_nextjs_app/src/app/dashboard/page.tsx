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
  const [rentalData, setRentalData] = useState<ActiveRental[]>([])
  const [projectData, setProjectData] = useState<ActiveProject[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  // State for update modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedIqama, setSelectedIqama] = useState<IqamaData | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Pagination logic
  const filteredIqamaData = iqamaData.filter(item => item.status !== 'active');
  const totalPages = Math.ceil(filteredIqamaData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedIqamaData = filteredIqamaData.slice(startIndex, endIndex);
  
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data from the API route
      const response = await fetch('/api/dashboard');
      
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
      setRentalData(rentalData);
      setProjectData(projectData);
      setRecentActivity(activityData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  }

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
        ) : (
          <div className="space-y-8">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                    </div>
                    
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
                        <p className="font-medium">No critical Iqama issues found</p>
                        <p className="text-sm opacity-80">All Iqama documents are up to date</p>
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
              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <Timer className="h-5 w-5" />
                    Today's Attendance
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    Employee attendance and timesheet status for today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Attendance Summary */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-green-200 dark:bg-green-800/30 rounded-lg">
                        <div className="text-lg font-bold text-green-800 dark:text-green-200">
                          {timesheetData.filter(item => item.status === 'present').length}
            </div>
                        <div className="text-xs text-green-600 dark:text-green-400">Present</div>
                      </div>
                      <div className="text-center p-2 bg-yellow-200 dark:bg-yellow-800/30 rounded-lg">
                        <div className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                          {timesheetData.filter(item => item.status === 'late').length}
                        </div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">Late</div>
                      </div>
                      <div className="text-center p-2 bg-red-200 dark:bg-red-800/30 rounded-lg">
                        <div className="text-lg font-bold text-red-800 dark:text-red-200">
                          {timesheetData.filter(item => item.status === 'absent').length}
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400">Absent</div>
                      </div>
                    </div>
                    
                    {/* Timesheet Table */}
                    <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                          <TableRow className="bg-blue-100 dark:bg-blue-900/20">
                            <TableHead className="text-blue-800 dark:text-blue-200">Employee</TableHead>
                            <TableHead className="text-blue-800 dark:text-blue-200">Status</TableHead>
                            <TableHead className="text-blue-800 dark:text-blue-200">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                          {timesheetData.slice(0, 10).map((item) => (
                            <TableRow key={item.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/10">
                              <TableCell className="font-medium">{item.employeeName}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={item.status === 'present' ? 'default' : 
                                         item.status === 'late' ? 'secondary' : 
                                         item.status === 'half-day' ? 'outline' : 'destructive'}
                                >
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{item.totalHours}h</TableCell>
                      </TableRow>
                          ))}
                </TableBody>
              </Table>
            </div>
                    
                    {timesheetData.length > 0 && (
                      <Button variant="outline" size="sm" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50" 
                              onClick={() => router.push('/modules/timesheet-management')}>
                        View All Timesheets ({timesheetData.length} records)
                      </Button>
                    )}
            </div>
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
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Activity className="h-5 w-5" />
                  Recent System Activity
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Latest system events, user actions, and important notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">No recent activity</p>
                  ) : (
                    <>
                      {recentActivity.slice(0, 15).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                          <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                            activity.severity === 'high' ? 'bg-red-500' : 
                            activity.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span>{activity.user}</span>
                              <span>•</span>
                              <span>{activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'N/A'}</span>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                {activity.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {recentActivity.length > 15 && (
                        <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50" 
                                onClick={() => router.push('/modules/activity-log')}>
                          View All Activity ({recentActivity.length} records)
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
              </div>
            )}
      </div>
    </div>
  )
}
