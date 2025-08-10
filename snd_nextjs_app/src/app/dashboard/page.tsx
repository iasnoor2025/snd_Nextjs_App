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
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination"
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
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
  Ship
} from "lucide-react"
import { RoleBased } from "@/lib/rbac/rbac-components"

// Types for real data
interface DashboardStats {
  totalEmployees: number
  activeProjects: number
  availableEquipment: number
  monthlyRevenue: number
  pendingApprovals: number
  activeRentals: number
  totalCustomers: number
  equipmentUtilization: number
}

interface IqamaExpiring {
  id: string
  employeeName: string
  fileNumber: string
  iqamaNumber: string
  expiryDate: string
  daysRemaining: number
  department: string
  status: string
}

interface LeaveRequest {
  id: string
  employeeName: string
  fileNumber: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  status: string
  reason: string
}

interface ActiveRental {
  id: string
  customerName: string
  equipmentName: string
  startDate: string
  endDate: string
  duration: number
  dailyRate: number
  totalAmount: number
  status: string
}

interface ActiveProject {
  id: string
  name: string
  customer: string
  startDate: string
  endDate: string
  progress: number
  budget: number
  spent: number
  status: string
}

interface RecentActivity {
  id: string
  type: string
  description: string
  user: string
  timestamp: string
  severity: 'low' | 'medium' | 'high'
}

export default function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // State for dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [iqamaData, setIqamaData] = useState<IqamaExpiring[]>([])
  const [leaveData, setLeaveData] = useState<LeaveRequest[]>([])
  const [rentalData, setRentalData] = useState<ActiveRental[]>([])
  const [projectData, setProjectData] = useState<ActiveProject[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
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
      
      // Determine data limits based on user role
      const isSeniorRole = session?.user?.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
      const dataLimit = isSeniorRole ? 100 : 10; // Super admin/manager gets 100 records, others get 10
      
      const [
        statsRes,
        iqamaRes,
        leaveRes,
        rentalRes,
        projectRes,
        activityRes
      ] = await Promise.all([
        fetch('/api/employees/statistics'),
        fetch(`/api/employees/iqama-expiring?days=30&limit=${dataLimit}`),
        fetch(`/api/employees/leaves/active?limit=${dataLimit}`),
        fetch(`/api/rentals/active?limit=${dataLimit}`),
        fetch(`/api/projects/active?limit=${dataLimit}`),
        fetch(`/api/notifications/recent?limit=${dataLimit}`)
      ]);

      // Process statistics
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          totalEmployees: statsData.data?.totalEmployees || 0,
          activeProjects: statsData.data?.projectAssignments || 0,
          availableEquipment: 0, // Will be fetched separately
          monthlyRevenue: 0, // Will be calculated from rentals
          pendingApprovals: 0, // Will be calculated
          activeRentals: statsData.data?.rentalAssignments || 0,
          totalCustomers: 0, // Will be fetched separately
          equipmentUtilization: 0 // Will be calculated
        });
      }

      // Process Iqama data
      if (iqamaRes.ok) {
        const iqamaJson = await iqamaRes.json();
        setIqamaData(iqamaJson.data || []);
      }

      // Process Leave data
      if (leaveRes.ok) {
        const leaveJson = await leaveRes.json();
        setLeaveData(leaveJson.data || []);
      }

      // Process Rental data
      if (rentalRes.ok) {
        const rentalJson = await rentalRes.json();
        setRentalData(rentalJson.data || []);
      }

      // Process Project data
      if (projectRes.ok) {
        const projectJson = await projectRes.json();
        setProjectData(projectJson.data || []);
      }

      // Process Activity data
      if (activityRes.ok) {
        const activityJson = await activityRes.json();
        setRecentActivity(activityJson.data || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

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
              {session?.user?.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role) && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Fetching comprehensive data for {session.user.role.replace('_', ' ')} role</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Loading up to 100 records per category for complete overview</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Data Summary and Search for Senior Roles */}
            {session?.user?.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role) && (
              <div className="col-span-full">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <Database className="h-5 w-5" />
                      Data Overview - {session.user.role.replace('_', ' ')}
                    </CardTitle>
                    <CardDescription className="text-blue-700 dark:text-blue-300">
                      Comprehensive view of all company data and operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Search Bar */}
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Input
                            placeholder="Search employees, projects, or equipment..."
                            className="border-blue-200 focus:border-blue-400"
                          />
                        </div>
                        <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                          <Search className="h-4 w-4 mr-2" />
                          Search
                        </Button>
                        <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                          <Filter className="h-4 w-4 mr-2" />
                          Filters
                        </Button>
                        <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                          <FileText className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                      
                      {/* Data Summary Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{iqamaData.length}</div>
                          <div className="text-blue-600 dark:text-blue-400">Iqama Records</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{leaveData.length}</div>
                          <div className="text-blue-600 dark:text-blue-400">Leave Requests</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{projectData.length}</div>
                          <div className="text-blue-600 dark:text-blue-400">Active Projects</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{rentalData.length}</div>
                          <div className="text-blue-600 dark:text-blue-400">Active Rentals</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Data Status Indicator for Senior Roles */}
            {session?.user?.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role) && (
              <div className="col-span-full mb-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Data Loaded Successfully
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-green-700 dark:text-green-300">
                      <span>Iqama: {iqamaData.length} records</span>
                      <span>Leave: {leaveData.length} records</span>
                      <span>Projects: {projectData.length} records</span>
                      <span>Rentals: {rentalData.length} records</span>
                      <span>Activity: {recentActivity.length} records</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Employees</p>
                      <p className="text-3xl font-bold">{stats?.totalEmployees?.toLocaleString() || '0'}</p>
                      <p className="text-blue-100 text-sm mt-1">Active workforce</p>
                    </div>
                    <div className="bg-blue-400/20 p-3 rounded-full">
                      <Users className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Active Projects</p>
                      <p className="text-3xl font-bold">{stats?.activeProjects || '0'}</p>
                      <p className="text-green-100 text-sm mt-1">Ongoing work</p>
                    </div>
                    <div className="bg-green-400/20 p-3 rounded-full">
                      <Building2 className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Active Rentals</p>
                      <p className="text-3xl font-bold">{stats?.activeRentals || '0'}</p>
                      <p className="text-orange-100 text-sm mt-1">Equipment in use</p>
                    </div>
                    <div className="bg-orange-400/20 p-3 rounded-full">
                      <Truck className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Pending Approvals</p>
                      <p className="text-3xl font-bold">{stats?.pendingApprovals || '0'}</p>
                      <p className="text-purple-100 text-sm mt-1">Awaiting action</p>
                    </div>
                    <div className="bg-purple-400/20 p-3 rounded-full">
                      <Clock className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comprehensive Data Insights for Senior Roles */}
            {session?.user?.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                      <BarChart3 className="h-5 w-5" />
                      Data Coverage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">Iqama Records</span>
                        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{iqamaData.length} records</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">Leave Requests</span>
                        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{leaveData.length} records</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">Active Projects</span>
                        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{projectData.length} records</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">Active Rentals</span>
                        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{rentalData.length} records</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                      <TrendingUp className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-700 dark:text-amber-300">Total Employees</span>
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{stats?.totalEmployees || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-700 dark:text-amber-300">Project Coverage</span>
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{stats?.activeProjects || 0} active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-700 dark:text-amber-300">Equipment Utilization</span>
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{stats?.activeRentals || 0} in use</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-700 dark:text-amber-300">Pending Actions</span>
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{stats?.pendingApprovals || 0} items</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                      <Zap className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start text-purple-700 border-purple-200 hover:bg-purple-50">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Employee
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start text-purple-700 border-purple-200 hover:bg-purple-50">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start text-purple-700 border-purple-200 hover:bg-purple-50">
                        <Plus className="h-4 w-4 mr-2" />
                        New Rental
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start text-purple-700 border-purple-200 hover:bg-purple-50">
                        <Settings className="h-4 w-4 mr-2" />
                        System Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Critical Alerts */}
              <div className="lg:col-span-1 space-y-6">
                {/* Iqama Expiring Soon */}
                <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertTriangle className="h-5 w-5" />
                      Iqama Expiring Soon
                    </CardTitle>
                    <CardDescription className="text-red-600 dark:text-red-400">
                      Employees with expiring Iqama in the next 30 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {iqamaData.length === 0 ? (
                      <p className="text-green-600 dark:text-green-400 text-sm py-4 text-center">
                        ✅ No Iqama expiring soon
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {iqamaData.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-800">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{item.employeeName}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{item.fileNumber}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={item.daysRemaining <= 7 ? 'destructive' : 'secondary'}>
                                {item.daysRemaining} days
                              </Badge>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {new Date(item.expiryDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {iqamaData.length > 0 && (
                          <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/modules/employee-management')}>
                            View All ({iqamaData.length} Iqama Records)
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Leave Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Leave Requests
                    </CardTitle>
                    <CardDescription>
                      Active leave requests and approvals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {leaveData.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 text-center py-4">No active leave requests</p>
                    ) : (
                      <div className="space-y-3">
                        {leaveData.map((leave) => (
                          <div key={leave.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{leave.employeeName}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{leave.leaveType} • {leave.fileNumber}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={leave.status === 'approved' ? 'default' : leave.status === 'pending' ? 'secondary' : 'destructive'}>
                                {leave.status}
                              </Badge>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {leave.days} days • {new Date(leave.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {leaveData.length > 0 && (
                          <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/modules/employee-management')}>
                            View All ({leaveData.length} Leave Requests)
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                                              {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.severity === 'high' ? 'bg-red-500' : 
                            activity.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.description}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Center Column - Active Projects & Equipment */}
              <div className="lg:col-span-2 space-y-6">
                {/* Active Projects */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Active Projects
                    </CardTitle>
                    <CardDescription>
                      Ongoing construction and development projects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {projectData.map((project) => (
                        <div key={project.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{project.name}</h4>
                            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                              {project.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-600 dark:text-slate-400">Customer</p>
                              <p className="font-medium">{project.customer}</p>
                            </div>
                            <div>
                              <p className="text-slate-600 dark:text-slate-400">Progress</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${project.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{project.progress}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              Budget: ${project.budget?.toLocaleString() || '0'}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/modules/project-management/${project.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                      {projectData.length > 0 && (
                        <Button variant="outline" className="w-full" onClick={() => router.push('/modules/project-management')}>
                          View All Projects ({projectData.length} Active)
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Active Rentals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Active Equipment Rentals
                    </CardTitle>
                    <CardDescription>
                      Currently active equipment rental contracts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {rentalData.map((rental) => (
                        <div key={rental.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                              <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{rental.equipmentName}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{rental.customerName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              ${rental.totalAmount?.toLocaleString() || '0'}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {rental.duration} days
                            </p>
                          </div>
                        </div>
                      ))}
                      {rentalData.length > 0 && (
                        <Button variant="outline" className="w-full" onClick={() => router.push('/modules/rental-management')}>
                          View All Rentals ({rentalData.length} Active)
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bottom Row - Quick Actions & Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <RoleBased roles={['SUPER_ADMIN', 'ADMIN']}>
                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300" onClick={() => router.push('/modules/user-management')}>
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-80" />
                    <h3 className="text-lg font-semibold mb-2">User Management</h3>
                    <p className="text-indigo-100 text-sm">Manage users, roles & permissions</p>
                  </CardContent>
                </Card>
              </RoleBased>

              <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300" onClick={() => router.push('/modules/analytics')}>
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-80" />
                    <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                    <p className="text-emerald-100 text-sm">Business intelligence & reports</p>
                  </CardContent>
                </Card>
              </RoleBased>

              <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300" onClick={() => router.push('/modules/payroll-management')}>
                  <CardContent className="p-6 text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-80" />
                    <h3 className="text-lg font-semibold mb-2">Payroll</h3>
                    <p className="text-amber-100 text-sm">Salary & compensation management</p>
                  </CardContent>
                </Card>
              </RoleBased>

              <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300" onClick={() => router.push('/modules/settings')}>
                  <CardContent className="p-6 text-center">
                    <Settings className="h-12 w-12 mx-auto mb-3 opacity-80" />
                    <h3 className="text-lg font-semibold mb-2">Settings</h3>
                    <p className="text-rose-100 text-sm">System configuration</p>
                  </CardContent>
                </Card>
              </RoleBased>
            </div>

            {/* Comprehensive Reporting Section for Senior Roles */}
            {session?.user?.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role) && (
              <div className="mt-8">
                <Card className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <FileText className="h-5 w-5" />
                      Data Export & Reporting
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Generate comprehensive reports and export data for analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Button variant="outline" className="justify-start text-slate-700 border-slate-300 hover:bg-slate-50">
                        <FileText className="h-4 w-4 mr-2" />
                        Export Employee Data ({iqamaData.length} records)
                      </Button>
                      <Button variant="outline" className="justify-start text-slate-700 border-slate-300 hover:bg-slate-50">
                        <FileText className="h-4 w-4 mr-2" />
                        Export Leave Reports ({leaveData.length} records)
                      </Button>
                      <Button variant="outline" className="justify-start text-slate-700 border-slate-300 hover:bg-slate-50">
                        <FileText className="h-4 w-4 mr-2" />
                        Export Project Status ({projectData.length} records)
                      </Button>
                      <Button variant="outline" className="justify-start text-slate-700 border-slate-300 hover:bg-slate-50">
                        <FileText className="h-4 w-4 mr-2" />
                        Export Rental Data ({rentalData.length} records)
                      </Button>
                      <Button variant="outline" className="justify-start text-slate-700 border-slate-300 hover:bg-slate-50">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Generate Analytics Report
                      </Button>
                      <Button variant="outline" className="justify-start text-slate-700 border-slate-300 hover:bg-slate-50">
                        <Database className="h-4 w-4 mr-2" />
                        Full Data Backup
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
