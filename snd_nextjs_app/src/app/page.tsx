'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardModals } from '@/components/dashboard/DashboardModals';
import { EquipmentSection } from '@/components/dashboard/EquipmentSection';
import { FinancialOverviewSection } from '@/components/dashboard/FinancialOverviewSection';
import { IqamaSection } from '@/components/dashboard/IqamaSection';
import ManualAssignmentSection from '@/components/dashboard/ManualAssignmentSection';
import ProjectOverviewSection from '@/components/dashboard/ProjectOverviewSection';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { TimesheetsSection } from '@/components/dashboard/TimesheetsSection';
import EmployeeAdvanceSection from '@/components/dashboard/EmployeeAdvanceSection';
import MyTeamSection from '@/components/dashboard/MyTeamSection';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { PDFGenerator } from '@/lib/utils/pdf-generator';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { ActiveProject, IqamaData, RecentActivity as RecentActivityType, EquipmentData, TimesheetData } from '@/lib/services/dashboard-service';
import { 
  SectionControlsPermission, 
  ExportReportsPermission,
  ManualAssignmentsPermission,
  IqamaPermission,
  EquipmentPermission,
  FinancialPermission,
  TimesheetsPermission,
  ProjectOverviewPermission,
  QuickActionsPermission,
  RecentActivityPermission,
  EmployeeAdvancePermission
} from '@/components/dashboard/DashboardSectionPermission';
import { Download } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUserAccessibleSectionsClient } from '@/lib/rbac/client-permission-service';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const { hasPermission } = useRBAC();

  // State for dashboard data
  const [stats, setStats] = useState<any>(null);
  const [iqamaData, setIqamaData] = useState<IqamaData[]>([]);
  const [equipmentData, setEquipmentData] = useState<EquipmentData[]>([]);
  const [timesheetData, setTimesheetData] = useState<TimesheetData[]>([]);
  const [projectData, setProjectData] = useState<ActiveProject[]>([]);
  const [activities, setActivities] = useState<RecentActivityType[]>([]);

  // State for loading and refreshing
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State for modals
  const [isIqamaModalOpen, setIsIqamaModalOpen] = useState(false);
  const [isEquipmentUpdateModalOpen, setIsEquipmentUpdateModalOpen] = useState(false);
  const [isEditHoursModalOpen, setIsEditHoursModalOpen] = useState(false);

  // State for selected items
  const [selectedIqama, setSelectedIqama] = useState<IqamaData | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentData | null>(null);
  const [selectedTimesheetForEdit, setSelectedTimesheetForEdit] = useState<TimesheetData | null>(null);

  // State for form inputs
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newEquipmentExpiryDate, setNewEquipmentExpiryDate] = useState('');
  const [newEquipmentIstimara, setNewEquipmentIstimara] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editOvertimeHours, setEditOvertimeHours] = useState('');

  // State for loading states
  const [updatingIqama, setUpdatingIqama] = useState(false);
  const [updatingEquipment, setUpdatingEquipment] = useState(false);
  const [updatingHours, setUpdatingHours] = useState(false);
  const [approvingTimesheet, setApprovingTimesheet] = useState<number | null>(null);
  const [rejectingTimesheet, setRejectingTimesheet] = useState<number | null>(null);
  const [markingAbsent, setMarkingAbsent] = useState<number | null>(null);
  const [refreshingTimesheets, setRefreshingTimesheets] = useState(false);

  // State for success messages
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);

  // Current time for display - initialize as null to prevent hydration mismatch
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // State for section visibility
  const [sectionVisibility, setSectionVisibility] = useState({
    iqama: false,
    equipment: false,
    financial: false,
    timesheets: false,
    projectOverview: false,
    manualAssignments: false,
    quickActions: false,
    recentActivity: false,
    employeeAdvance: false,
    myTeam: false,
  });
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [accessibleSections, setAccessibleSections] = useState<string[]>([]);

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Set section visibility based on user permissions and saved preferences
  useEffect(() => {
    if (session?.user?.id && !sectionsLoaded) {
      const loadUserSections = async () => {
        try {
          const accessibleSections = await getUserAccessibleSectionsClient(session.user.id);
          
          // Get saved preferences from localStorage - default to true for first-time users
          let savedVisibility = {
            iqama: true,
            equipment: true,
            financial: true,
            timesheets: true,
            projectOverview: true,
            manualAssignments: true,
            quickActions: true,
            recentActivity: true,
            employeeAdvance: true,
            myTeam: true,
          };
          
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('dashboard-section-visibility');
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                savedVisibility = { ...savedVisibility, ...parsed };
              } catch (e) {
                // Handle error silently for production
              }
            }
          }
          
          // Combine permissions with saved preferences
          // If user has permission, show section by default unless explicitly hidden
          const newVisibility = {
            iqama: accessibleSections.includes('iqama') && (savedVisibility.iqama !== false),
            equipment: accessibleSections.includes('equipment') && (savedVisibility.equipment !== false),
            financial: accessibleSections.includes('financial') && (savedVisibility.financial !== false),
            timesheets: accessibleSections.includes('timesheets') && (savedVisibility.timesheets !== false),
            projectOverview: accessibleSections.includes('projectOverview') && (savedVisibility.projectOverview !== false),
            manualAssignments: accessibleSections.includes('manualAssignments') && (savedVisibility.manualAssignments !== false),
            quickActions: accessibleSections.includes('quickActions') && (savedVisibility.quickActions !== false),
            recentActivity: accessibleSections.includes('recentActivity') && (savedVisibility.recentActivity !== false),
            employeeAdvance: accessibleSections.includes('employeeAdvance') && (savedVisibility.employeeAdvance !== false),
            myTeam: accessibleSections.includes('myTeam') && (savedVisibility.myTeam !== false),
          };
          

          setAccessibleSections(accessibleSections);
          setSectionVisibility(newVisibility);
          setSectionsLoaded(true);
        } catch (error) {
          // Handle error silently for production
          // No fallback - if database fails, show minimal access
          setSectionVisibility({
            iqama: false,
            equipment: false,
            financial: false,
            timesheets: false,
            projectOverview: false,
            manualAssignments: false,
            quickActions: false,
            recentActivity: false,
            employeeAdvance: false,
            myTeam: false,
          });
          setSectionsLoaded(true);
        }
      };
      
      loadUserSections();
    }
  }, [session?.user?.id, sectionsLoaded]);

  // Update current time every minute
  useEffect(() => {
    // Initialize current time on mount to prevent hydration mismatch
    setCurrentTime(new Date());
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dashboard stats only
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {});
      }
    } catch (error) {
      // Handle error silently for production
    }
  };

  // Fetch Iqama data
  const fetchIqamaData = async () => {
    try {
      const response = await fetch('/api/dashboard/iqama?limit=10000');
      if (response.ok) {
        const data = await response.json();
        setIqamaData(data.iqamaData || []);
      }
    } catch (error) {
      // Handle error silently for production
    }
  };

  // Fetch Equipment data
  const fetchEquipmentData = async () => {
    try {
      const response = await fetch('/api/dashboard/equipment?limit=250');
      if (response.ok) {
        const data = await response.json();
        setEquipmentData(data.equipment || []);
      }
    } catch (error) {
      // Handle error silently for production
    }
  };

  // Fetch Timesheet data
  const fetchTimesheetData = async () => {
    try {
      const response = await fetch('/api/dashboard/timesheets?limit=10');
      if (response.ok) {
        const data = await response.json();
        setTimesheetData(data.timesheetData || []);
      }
    } catch (error) {
      // Handle error silently for production
    }
  };

  // Fetch Recent Activity data
  const fetchActivityData = async () => {
    try {
      const response = await fetch('/api/dashboard/activity?limit=10');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.recentActivity || []);
      }
    } catch (error) {
      // Handle error silently for production
    }
  };

  // Fetch all dashboard data in parallel
  const fetchDashboardData = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Fetch all data in parallel for better performance
      await Promise.all([
        fetchDashboardStats(),
        fetchIqamaData(),
        fetchEquipmentData(),
        fetchTimesheetData(),
        fetchActivityData()
      ]);

    } catch (_error) {
      // Handle error silently for production
      // Show user-friendly message for any error
      setApprovalSuccess('Dashboard loaded with basic data. Some sections may be limited.');
      setTimeout(() => setApprovalSuccess(null), 5000);
      
      // Set default stats to prevent null errors
      setStats({
        totalEmployees: 0,
        activeProjects: 0,
        totalProjects: 0,
        availableEquipment: 0,
        totalEquipment: 0,
        monthlyRevenue: 0,
        pendingApprovals: 0,
        activeRentals: 0,
        totalRentals: 0,
        totalCompanies: 0,
        totalDocuments: 0,
        equipmentUtilization: 0,
        todayTimesheets: 0,
        expiredDocuments: 0,
        expiringDocuments: 0,
        employeesOnLeave: 0,
        totalMoneyReceived: 0,
        totalMoneyLost: 0,
        monthlyMoneyReceived: 0,
        monthlyMoneyLost: 0,
        netProfit: 0,
        currency: 'SAR',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch only timesheet data for quick updates (legacy)
  const fetchTimesheetDataLegacy = async () => {
    try {
      setRefreshingTimesheets(true);
      const response = await fetch('/api/timesheets/today');
      if (!response.ok) {
        throw new Error(t('dashboard.failedToFetchTimesheetData'));
      }
      const data = await response.json();
      setTimesheetData(data.timesheetData || []);
    } catch (_error) {
      // Handle error silently for production
    } finally {
      setRefreshingTimesheets(false);
    }
  };

  // Fetch only Iqama data for quick updates (legacy)
  const fetchIqamaDataLegacy = async () => {
    try {
      setUpdatingIqama(true);
      const response = await fetch('/api/employees/iqama?limit=10000');
      if (!response.ok) {
        throw new Error(t('dashboard.failedToFetchIqamaData'));
      }
      const data = await response.json();
      setIqamaData(data.iqamaData || []);
    } catch (_error) {
      // Handle error silently for production
    } finally {
      setUpdatingIqama(false);
    }
  };





  // Initial data fetch - show dashboard immediately, fetch data in background
  useEffect(() => {
    if (session) {
      // Show dashboard immediately with loading states
      // Fetch data in background without blocking UI
      fetchDashboardData();
    }
  }, [session]);



  // Auto-refresh critical data every 30 seconds
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      // Only fetch data for sections user has permission to access
      if (sectionVisibility.iqama) {
        fetchIqamaData();
      }
      if (sectionVisibility.timesheets) {
        fetchTimesheetData();
      }
      if (sectionVisibility.recentActivity) {
        fetchActivityData();
      }
      if (sectionVisibility.equipment) {
        fetchEquipmentData();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [session, sectionVisibility]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData(true); // Show loading for manual refresh
    setRefreshing(false);
  };

  // Handle Iqama update
  const handleUpdateIqama = async () => {
    if (!selectedIqama || !newExpiryDate) return;

    try {
      setUpdatingIqama(true);
      const response = await fetch(`/api/employees/${selectedIqama.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iqama_expiry: newExpiryDate }),
      });

      if (response.ok) {
        setIsIqamaModalOpen(false);
        setNewExpiryDate('');
        setSelectedIqama(null);
        // Only refresh Iqama data instead of full dashboard
        await fetchIqamaData();
        // Show success message
        setApprovalSuccess(t('dashboard.iqamaUpdatedSuccessfully'));
        setTimeout(() => setApprovalSuccess(null), 5000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || t('dashboard.failedToUpdateIqama'));
      }
    } catch (error) {
      // Handle error silently for production
      setApprovalSuccess(`Error: ${error instanceof Error ? error.message : t('dashboard.failedToUpdateIqama')}`);
      setTimeout(() => setApprovalSuccess(null), 5000);
    } finally {
      setUpdatingIqama(false);
    }
  };

  // Handle equipment update
  const handleUpdateEquipment = async () => {
    if (!selectedEquipment || !newEquipmentExpiryDate) return;

    try {
      setUpdatingEquipment(true);

      // Prepare update data
      const updateData: any = { istimara_expiry_date: newEquipmentExpiryDate };

      // Only include istimara if it doesn't exist and user provided one
      // Note: EquipmentData from dashboard-service doesn't have istimara property
      if (newEquipmentIstimara.trim()) {
        updateData.istimara = newEquipmentIstimara.trim();
      }

      const response = await fetch(`/api/equipment/${selectedEquipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        setApprovalSuccess(data.message || t('dashboard.equipmentUpdatedSuccessfully'));
        setIsEquipmentUpdateModalOpen(false);
        setNewEquipmentExpiryDate('');
        setNewEquipmentIstimara('');
        setSelectedEquipment(null);
        // Only refresh Equipment data instead of full dashboard
        await fetchDashboardData();
        setTimeout(() => setApprovalSuccess(null), 5000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || t('dashboard.failedToUpdateEquipment'));
      }
    } catch (error) {
      // Handle error silently for production
              setApprovalSuccess(`Error: ${error instanceof Error ? error.message : t('dashboard.failedToUpdateEquipment')}`);
      setTimeout(() => setApprovalSuccess(null), 5000);
    } finally {
      setUpdatingEquipment(false);
    }
  };

  // Handle timesheet approval
  const handleApproveTimesheet = async (id: number) => {
    try {
      setApprovingTimesheet(id);
      const response = await fetch(`/api/timesheets/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setApprovalSuccess(data.message || t('dashboard.timesheetApprovedSuccessfully'));
        // Only refresh timesheet data instead of full dashboard
        await fetchTimesheetData();
        setTimeout(() => setApprovalSuccess(null), 5000);
      } else {
        throw new Error('Failed to approve timesheet');
      }
    } catch (error) {
      // Handle error silently for production
    } finally {
      setApprovingTimesheet(null);
    }
  };

  // Handle timesheet rejection
  const handleRejectTimesheet = async (id: number) => {
    try {
      setRejectingTimesheet(id);
      const response = await fetch(`/api/timesheets/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: t('dashboard.rejectedBySupervisor') }),
      });

      if (response.ok) {
        setApprovalSuccess(t('dashboard.timesheetRejectedSuccessfully'));
        // Only refresh timesheet data instead of full dashboard
        await fetchTimesheetData();
        setTimeout(() => setApprovalSuccess(null), 5000);
      } else {
        throw new Error('Failed to reject timesheet');
      }
    } catch (error) {
      // Handle error silently for production
    } finally {
      setRejectingTimesheet(null);
    }
  };

  // Handle mark absent
  const handleMarkAbsent = async (id: number) => {
    try {
      setMarkingAbsent(id);
      const response = await fetch(`/api/timesheets/${id}/mark-absent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: t('dashboard.markedAbsentBySupervisor') }),
      });

      if (response.ok) {
        setApprovalSuccess(t('dashboard.employeeMarkedAsAbsent'));
        // Only refresh timesheet data instead of full dashboard
        await fetchTimesheetData();
        setTimeout(() => setApprovalSuccess(null), 5000);
      } else {
        throw new Error('Failed to mark absent');
      }
    } catch (error) {
      // Handle error silently for production
    } finally {
      setMarkingAbsent(null);
    }
  };

  // Handle edit hours
  const handleEditHours = (id: number) => {
    const timesheet = timesheetData.find(t => t.id === id);
    if (timesheet) {
      setSelectedTimesheetForEdit(timesheet);
      setEditHours(timesheet.totalHours?.toString() || '');
      setEditOvertimeHours(timesheet.overtimeHours?.toString() || '');
      setIsEditHoursModalOpen(true);
    }
  };

  // Handle update hours
  const handleUpdateHours = async () => {
    if (!selectedTimesheetForEdit || !editHours) return;

    try {
      setUpdatingHours(true);
      const response = await fetch(`/api/timesheets/${selectedTimesheetForEdit.id}/update-hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoursWorked: parseFloat(editHours),
          overtimeHours: parseFloat(editOvertimeHours) || 0,
        }),
      });

      if (response.ok) {
        setIsEditHoursModalOpen(false);
        setEditHours('');
        setEditOvertimeHours('');
        setSelectedTimesheetForEdit(null);
        setApprovalSuccess(t('dashboard.hoursUpdatedSuccessfully'));
        // Only refresh timesheet data instead of full dashboard
        await fetchTimesheetData();
        setTimeout(() => setApprovalSuccess(null), 5000);
      } else {
        throw new Error('Failed to update hours');
      }
    } catch (error) {
      // Handle error silently for production
    } finally {
      setUpdatingHours(false);
    }
  };

  // Handle open Iqama modal
  const handleOpenIqamaModal = (iqama: IqamaData) => {
    setSelectedIqama(iqama);
    setNewExpiryDate(iqama.expiryDate || '');
    setIsIqamaModalOpen(true);
  };

  // Handle open equipment modal
  const handleOpenEquipmentUpdateModal = (equipment: EquipmentData) => {
    setSelectedEquipment(equipment);
    setNewEquipmentExpiryDate(equipment.istimaraExpiry || '');
    setNewEquipmentIstimara(''); // Reset Istimara input
    setIsEquipmentUpdateModalOpen(true);
  };

  // Handle open project modal
  const handleOpenProjectModal = () => {
    // TODO: Implement project modal
  };

  // Save section visibility to localStorage
  const saveSectionVisibility = (newVisibility: typeof sectionVisibility) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-section-visibility', JSON.stringify(newVisibility));
    }
  };

  // Handle section visibility toggle
  const toggleSection = (section: keyof typeof sectionVisibility) => {
    setSectionVisibility(prev => {
      const newVisibility = {
        ...prev,
        [section]: !prev[section],
      };
      saveSectionVisibility(newVisibility);
      return newVisibility;
    });
  };

  // Handle combined PDF download for all expired documents
  const handleDownloadCombinedExpiredPDF = async () => {
    const expiredIqamaData = iqamaData.filter(item => item.status === 'expired');
    const expiredEquipmentData = equipmentData.filter(item => item.status === 'expired');
    
    if (expiredIqamaData.length === 0 && expiredEquipmentData.length === 0) {
      alert(t('dashboard.noExpiredDocumentsFound'));
      return;
    }
    
    try {
      // Convert API data to PDFGenerator format (handle nullable fields)
      const pdfIqamaData = expiredIqamaData.map(item => ({
        ...item,
        fileNumber: item.fileNumber || 'N/A',
        nationality: item.nationality || 'N/A',
        position: item.position || 'N/A',
        companyName: item.companyName || 'N/A',
        location: item.location || 'N/A',
        expiryDate: item.expiryDate || 'N/A',
      }));
      
      const pdfEquipmentData = expiredEquipmentData.map(item => ({
        ...item,
        equipmentNumber: item.equipmentNumber || 'N/A',
        istimara: 'N/A', // EquipmentData doesn't have istimara property
        istimaraExpiry: item.istimaraExpiry || 'N/A',
      }));
      
      await PDFGenerator.generateCombinedExpiredReport(pdfIqamaData, pdfEquipmentData);
    } catch (error) {
      // Handle error silently for production
      alert(t('dashboard.pdfGenerationFailed'));
    }
  };

  // Show loading state only for initial load, not for data fetching
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  // Show access denied if no session
  if (!session) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Section */}
        <DashboardHeader
          stats={stats}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          session={session}
          accessibleSections={accessibleSections}
          loading={loading}
        />

        {/* Main Content */}
        <div className="px-6 py-8 space-y-8">
          {/* Section Controls */}
          <SectionControlsPermission>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div>
                <h3 className="text-lg font-semibold">{t('dashboard.dashboardSections')}</h3>
                <div className="text-sm text-muted-foreground">
                  {!sectionsLoaded ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      {t('dashboard.loadingSections')}
                    </span>
                  ) : (
                    t('dashboard.sectionsVisible', {
                      visible: Object.values(sectionVisibility).filter(visible => visible).length,
                      total: Object.keys(sectionVisibility).length,
                    })
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <ExportReportsPermission>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCombinedExpiredPDF}
                    disabled={
                      iqamaData.filter(item => item.status === 'expired').length === 0 &&
                      equipmentData.filter(item => item.status === 'expired').length === 0
                    }
                    className="flex items-center gap-2"
                    title={t('dashboard.downloadAllExpiredPdfTitle', { count: iqamaData.filter(item => item.status === 'expired').length + equipmentData.filter(item => item.status === 'expired').length })}
                  >
                    <Download className="h-4 w-4" />
                    {t('dashboard.downloadAllExpiredPdf', { count: iqamaData.filter(item => item.status === 'expired').length + equipmentData.filter(item => item.status === 'expired').length })}
                  </Button>
                </ExportReportsPermission>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newVisibility = {
                      iqama: true,
                      equipment: true,
                      financial: true,
                      timesheets: true,
                      projectOverview: true,
                      manualAssignments: true,
                      quickActions: true,
                      recentActivity: true,
                      employeeAdvance: true,
                      myTeam: true,
                    };
                    setSectionVisibility(newVisibility);
                    saveSectionVisibility(newVisibility);
                  }}
                >
                  {t('dashboard.showAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newVisibility = {
                      iqama: false,
                      equipment: false,
                      financial: false,
                      timesheets: false,
                      projectOverview: false,
                      manualAssignments: false,
                      quickActions: false,
                      recentActivity: false,
                      employeeAdvance: false,
                      myTeam: false,
                    };
                    setSectionVisibility(newVisibility);
                    saveSectionVisibility(newVisibility);
                  }}
                >
                  {t('dashboard.hideAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const defaultVisibility = {
                      iqama: true,
                      equipment: true,
                      financial: true,
                      timesheets: true,
                      projectOverview: true,
                      manualAssignments: true,
                      quickActions: true,
                      recentActivity: true,
                      employeeAdvance: true,
                      myTeam: true,
                    };
                    setSectionVisibility(defaultVisibility);
                    saveSectionVisibility(defaultVisibility);
                  }}
                >
                  {t('dashboard.resetToDefault')}
                </Button>
              </div>
            </div>
          </SectionControlsPermission>

          {/* My Team Section */}
          {sectionVisibility.myTeam && (
            <MyTeamSection onHideSection={() => toggleSection('myTeam')} />
          )}

          {/* Manual Assignments Section */}
          {sectionVisibility.manualAssignments && (
            <ManualAssignmentsPermission>
              <ManualAssignmentSection 
                employeeId={session?.user?.id ? parseInt(session.user.id) : 0}
                onHideSection={() => toggleSection('manualAssignments')}
                allowAllEmployees={true}
              />
            </ManualAssignmentsPermission>
          )}

          {/* Today's Attendance (Timesheets) Section */}
          {sectionVisibility.timesheets && (
            <TimesheetsPermission>
              <TimesheetsSection
                timesheetData={timesheetData}
                currentTime={currentTime}
                session={session}
                onApproveTimesheet={handleApproveTimesheet}
                onRejectTimesheet={handleRejectTimesheet}
                onMarkAbsent={handleMarkAbsent}
                onEditHours={handleEditHours}
                approvalSuccess={approvalSuccess}
                approvingTimesheet={approvingTimesheet}
                rejectingTimesheet={rejectingTimesheet}
                markingAbsent={markingAbsent}
                isRefreshing={refreshingTimesheets}
                onHideSection={() => toggleSection('timesheets')}
              />
            </TimesheetsPermission>
          )}

          {/* Unified Iqama Section */}
          {sectionVisibility.iqama && (
            <IqamaPermission>
              <IqamaSection
                iqamaData={iqamaData}
                onUpdateIqama={handleOpenIqamaModal}
                onHideSection={() => {
                  toggleSection('iqama');
                }}
              />
            </IqamaPermission>
          )}
          


          {/* Employee Advances & Repayments Section */}
          {sectionVisibility.employeeAdvance && (
            <EmployeeAdvancePermission>
              <EmployeeAdvanceSection onHideSection={() => toggleSection('employeeAdvance')} />
            </EmployeeAdvancePermission>
          )}

          {/* Equipment Section */}
          {sectionVisibility.equipment && (
            <EquipmentPermission>
              <EquipmentSection
                equipmentData={equipmentData as any}
                onUpdateEquipment={handleOpenEquipmentUpdateModal as any}
                onHideSection={() => toggleSection('equipment')}
              />
            </EquipmentPermission>
          )}

          {/* Financial Overview Section */}
          {sectionVisibility.financial && (
            <FinancialPermission>
              <FinancialOverviewSection onHideSection={() => toggleSection('financial')} />
            </FinancialPermission>
          )}

          {/* Project Overview Section */}
          {sectionVisibility.projectOverview && (
            <ProjectOverviewPermission>
              <ProjectOverviewSection
                projectData={projectData}
                onUpdateProject={handleOpenProjectModal}
                onHideSection={() => toggleSection('projectOverview')}
              />
            </ProjectOverviewPermission>
          )}

          {/* Quick Actions */}
          {sectionVisibility.quickActions && (
            <QuickActionsPermission>
              <QuickActions onHideSection={() => toggleSection('quickActions')} />
            </QuickActionsPermission>
          )}

          {/* Recent Activity - Last Section */}
          {sectionVisibility.recentActivity && (
            <RecentActivityPermission>
              <RecentActivity
                activities={activities}
                onHideSection={() => toggleSection('recentActivity')}
                currentUser={session?.user?.name || t('dashboard.unknownUser')}
                onRefresh={fetchActivityData}
              />
            </RecentActivityPermission>
          )}

          {/* Hidden Sections Summary */}
          {Object.values(sectionVisibility).some(visible => !visible) && (
            <SectionControlsPermission>
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{t('dashboard.hiddenSections')}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                                         onClick={() => {
                       const newVisibility = {
                         iqama: true,
                         equipment: true,
                         financial: true,
                         timesheets: true,
                         projectOverview: true,
                         manualAssignments: true,
                         quickActions: true,
                         recentActivity: true,
                         employeeAdvance: true,
                         myTeam: true,
                       };
                       setSectionVisibility(newVisibility);
                       saveSectionVisibility(newVisibility);
                     }}
                  >
                    {t('dashboard.showAll')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!sectionVisibility.iqama && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('iqama')}
                      className="flex items-center gap-2"
                    >
                      {t('dashboard.showIqamaSection')}
                    </Button>
                  )}
                  {!sectionVisibility.equipment && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('equipment')}
                      className="flex items-center gap-2"
                    >
                      {t('dashboard.showEquipmentSection')}
                    </Button>
                  )}
                  {!sectionVisibility.financial && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('financial')}
                      className="flex items-center gap-2"
                    >
                      {t('dashboard.showFinancialSection')}
                    </Button>
                  )}
                  {!sectionVisibility.timesheets && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('timesheets')}
                      className="flex items-center gap-2"
                    >
                      {t('dashboard.showTimesheetsSection')}
                    </Button>
                  )}
                  {!sectionVisibility.projectOverview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('projectOverview')}
                      className="flex items-center gap-2"
                    >
                      {t('dashboard.showProjectOverviewSection')}
                    </Button>
                  )}
                  {!sectionVisibility.manualAssignments && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('manualAssignments')}
                      className="flex items-center gap-2"
                    >
                      {t('dashboard.showManualAssignments')}
                    </Button>
                  )}
                  {!sectionVisibility.quickActions && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('quickActions')}
                      className="flex items-center gap-2"
                    >
                      {t('dashboard.showQuickActions')}
                    </Button>
                  )}
                  {!sectionVisibility.recentActivity && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('recentActivity')}
                      className="flex items-center gap-2"
                    >
                      {t('dashboard.showRecentActivity')}
                    </Button>
                  )}
                  {!sectionVisibility.employeeAdvance && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('employeeAdvance')}
                      className="flex items-center gap-2"
                    >
                      {t('dashboard.showEmployeeAdvanceSection')}
                    </Button>
                  )}
                  {!sectionVisibility.myTeam && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('myTeam')}
                      className="flex items-center gap-2"
                    >
                      {t('dashboard.showMyTeamSection')}
                    </Button>
                  )}
                </div>
              </div>
            </SectionControlsPermission>
          )}
        </div>

        {/* Modals */}
        <DashboardModals
          // Iqama Modal
          isIqamaModalOpen={isIqamaModalOpen}
          setIsIqamaModalOpen={setIsIqamaModalOpen}
          selectedIqama={selectedIqama as any}
          newExpiryDate={newExpiryDate}
          setNewExpiryDate={setNewExpiryDate}
          updatingIqama={updatingIqama}
          onUpdateIqama={handleUpdateIqama}
          // Equipment Modal
          isEquipmentUpdateModalOpen={isEquipmentUpdateModalOpen}
          setIsEquipmentUpdateModalOpen={setIsEquipmentUpdateModalOpen}
          selectedEquipment={selectedEquipment as any}
          newEquipmentExpiryDate={newEquipmentExpiryDate}
          setNewEquipmentExpiryDate={setNewEquipmentExpiryDate}
          newEquipmentIstimara={newEquipmentIstimara}
          setNewEquipmentIstimara={setNewEquipmentIstimara}
          updatingEquipment={updatingEquipment}
          onUpdateEquipment={handleUpdateEquipment}
          // Edit Hours Modal
          isEditHoursModalOpen={isEditHoursModalOpen}
          setIsEditHoursModalOpen={setIsEditHoursModalOpen}
          selectedTimesheetForEdit={selectedTimesheetForEdit as any}
          editHours={editHours}
          setEditHours={setEditHours}
          editOvertimeHours={editOvertimeHours}
          setEditOvertimeHours={setEditOvertimeHours}
          updatingHours={updatingHours}
          onUpdateHours={handleUpdateHours}
        />
      </div>
    </ProtectedRoute>
  );
}
