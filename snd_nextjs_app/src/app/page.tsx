'use client';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardModals } from '@/components/dashboard/DashboardModals';
import { EquipmentSection } from '@/components/dashboard/EquipmentSection';
import { FinancialOverviewSection } from '@/components/dashboard/FinancialOverviewSection';
import { IqamaSection } from '@/components/dashboard/IqamaSection';
import ProjectOverviewSection from '@/components/dashboard/ProjectOverviewSection';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { TimesheetsSection } from '@/components/dashboard/TimesheetsSection';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { PDFGenerator } from '@/lib/utils/pdf-generator';
import { ActiveProject, IqamaData, RecentActivity as RecentActivityType, EquipmentData, TimesheetData } from '@/lib/services/dashboard-service';
import { Download } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';



// Using imported types from dashboard-service



interface ActivityItem {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  user?: string;
  action?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

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
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [selectedTimesheetForEdit, setSelectedTimesheetForEdit] = useState<any | null>(null);

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

  // Current time for display
  const [currentTime, setCurrentTime] = useState(new Date());

  // State for section visibility
  const [sectionVisibility, setSectionVisibility] = useState({
    iqama: true,
    equipment: true,
    financial: true,
    timesheets: true,
    projectOverview: true,
    quickActions: true,
    recentActivity: true,
  });
  const [sectionsLoaded, setSectionsLoaded] = useState(false);

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error(t('dashboard.failedToFetchDashboardData'));
      }
      const data = await response.json();

      console.log('Dashboard data fetched:', {
        stats: data.stats,
        iqamaCount: data.iqamaData?.length || 0,
        equipmentCount: data.equipmentData?.length || 0,
        timesheetCount: data.timesheetData?.length || 0,
        projectCount: data.projectData?.length || 0,
        activityCount: data.recentActivity?.length || 0,
      });

      setStats(data.stats || {});
      setIqamaData(data.iqamaData || []);
      setEquipmentData(data.equipmentData || []);
      setTimesheetData(data.timesheetData || []);
      setProjectData(data.projectData || []);
      setActivities(data.recentActivity || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Handle error silently for production
    } finally {
      setLoading(false);
    }
  };

  // Fetch only timesheet data for quick updates
  const fetchTimesheetData = async () => {
    try {
      setRefreshingTimesheets(true);
      const response = await fetch('/api/timesheets/today');
      if (!response.ok) {
        throw new Error(t('dashboard.failedToFetchTimesheetData'));
      }
      const data = await response.json();
      setTimesheetData(data.timesheetData || []);
    } catch (error) {
      // Handle error silently for production
    } finally {
      setRefreshingTimesheets(false);
    }
  };

  // Fetch only Iqama data for quick updates
  const fetchIqamaData = async () => {
    try {
      setUpdatingIqama(true);
      const response = await fetch('/api/employees/iqama');
      if (!response.ok) {
        throw new Error(t('dashboard.failedToFetchIqamaData'));
      }
      const data = await response.json();
      setIqamaData(data.iqamaData || []);
    } catch (error) {
      // Handle error silently for production
    } finally {
      setUpdatingIqama(false);
    }
  };

  // Fetch only Equipment data for quick updates
  const fetchEquipmentData = async () => {
    try {
      setUpdatingEquipment(true);
      const response = await fetch('/api/equipment/dashboard');
      if (!response.ok) {
        throw new Error(t('dashboard.failedToFetchEquipmentData'));
      }
      const data = await response.json();
      setEquipmentData(data.equipmentData || []);
    } catch (error) {
      // Handle error silently for production
    } finally {
      setUpdatingEquipment(false);
    }
  };

  // Fetch only Recent Activity data for quick updates
  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error(t('dashboard.failedToFetchDashboardData'));
      }
      const data = await response.json();
      setActivities(data.recentActivity || []);
    } catch (error) {
      // Handle error silently for production
    }
  };

  // Fetch only Project data for quick updates
  // const fetchProjectData = async () => {
  //   try {
  //     const response = await fetch('/api/projects/dashboard')
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch project data')
  //     }
  //     const data = await response.json()
  //     setProjectData(data.projectData || [])
  //   } catch (error) {
  //     
  //   }
  // }

  // Initial data fetch
  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  // Project data is now fetched from the API via fetchDashboardData()

  // Load section visibility from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-section-visibility');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSectionVisibility(parsed);
        } catch (e) {
          // Handle error silently for production
        }
      }
      setSectionsLoaded(true);
    }
  }, []);

  // Auto-refresh critical data every 30 seconds
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      fetchEquipmentData();
      fetchIqamaData();
      fetchTimesheetData();
      fetchRecentActivity(); // Also refresh recent activity
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [session]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    // Also refresh recent activity separately to ensure we get the latest data
    await fetchRecentActivity();
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
        body: JSON.stringify({ iqamaExpiryDate: newExpiryDate }),
      });

      if (response.ok) {
        setIsIqamaModalOpen(false);
        setNewExpiryDate('');
        setSelectedIqama(null);
        // Only refresh Iqama data instead of full dashboard
        await fetchIqamaData();
      } else {
        throw new Error(t('dashboard.failedToUpdateIqama'));
      }
    } catch (error) {
      // Handle error silently for production
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
      if (!selectedEquipment.istimara && newEquipmentIstimara.trim()) {
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
        await fetchEquipmentData();
        setTimeout(() => setApprovalSuccess(null), 5000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || t('dashboard.failedToUpdateEquipment'));
      }
    } catch (error) {
      console.error('Equipment update error:', error);
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
        istimara: item.istimara || 'N/A',
        istimaraExpiry: item.istimaraExpiry || 'N/A',
      }));
      
      await PDFGenerator.generateCombinedExpiredReport(pdfIqamaData, pdfEquipmentData);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert(t('dashboard.pdfGenerationFailed'));
    }
  };

  // Show loading state
  if (loading) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <DashboardHeader
        stats={stats}
        equipmentCount={equipmentData.length}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        session={session}
      />

      {/* Main Content */}
      <div className="px-6 py-8 space-y-8">
        {/* Section Controls */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div>
            <h3 className="text-lg font-semibold">{t('dashboard.dashboardSections')}</h3>
            <p className="text-sm text-muted-foreground">
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
            </p>
          </div>
          <div className="flex gap-2">
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
                  quickActions: true,
                  recentActivity: true,
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
                  quickActions: false,
                  recentActivity: false,
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
                  quickActions: true,
                  recentActivity: true,
                };
                setSectionVisibility(defaultVisibility);
                saveSectionVisibility(defaultVisibility);
              }}
            >
              {t('dashboard.resetToDefault')}
            </Button>
          </div>
        </div>
        {/* Iqama Section */}
        {sectionVisibility.iqama && (
          <IqamaSection
            iqamaData={iqamaData}
            onUpdateIqama={handleOpenIqamaModal}
            onHideSection={() => toggleSection('iqama')}
          />
        )}

        {/* Equipment Section */}
        {sectionVisibility.equipment && (
          <EquipmentSection
            equipmentData={equipmentData}
            onUpdateEquipment={handleOpenEquipmentUpdateModal}
            onHideSection={() => toggleSection('equipment')}
            isRefreshing={updatingEquipment}
          />
        )}

        {/* Financial Overview Section */}
        {sectionVisibility.financial && (
          <FinancialOverviewSection onHideSection={() => toggleSection('financial')} />
        )}

        {/* Timesheets Section */}
        {sectionVisibility.timesheets && (
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
        )}

        {/* Project Overview Section */}
        {sectionVisibility.projectOverview && (
          <ProjectOverviewSection
            projectData={projectData}
            onUpdateProject={handleOpenProjectModal}
            onHideSection={() => toggleSection('projectOverview')}
          />
        )}

        {/* Quick Actions */}
        {sectionVisibility.quickActions && (
          <QuickActions onHideSection={() => toggleSection('quickActions')} />
        )}

        {/* Recent Activity */}
        {sectionVisibility.recentActivity && (
          <RecentActivity
            activities={activities}
            onHideSection={() => toggleSection('recentActivity')}
            currentUser={session?.user?.name || t('dashboard.unknownUser')}
            onRefresh={fetchRecentActivity}
          />
        )}

        {/* Hidden Sections Summary */}
        {Object.values(sectionVisibility).some(visible => !visible) && (
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
                    quickActions: true,
                    recentActivity: true,
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
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DashboardModals
        // Iqama Modal
        isIqamaModalOpen={isIqamaModalOpen}
        setIsIqamaModalOpen={setIsIqamaModalOpen}
        selectedIqama={selectedIqama}
        newExpiryDate={newExpiryDate}
        setNewExpiryDate={setNewExpiryDate}
        updatingIqama={updatingIqama}
        onUpdateIqama={handleUpdateIqama}
        // Equipment Modal
        isEquipmentUpdateModalOpen={isEquipmentUpdateModalOpen}
        setIsEquipmentUpdateModalOpen={setIsEquipmentUpdateModalOpen}
        selectedEquipment={selectedEquipment}
        newEquipmentExpiryDate={newEquipmentExpiryDate}
        setNewEquipmentExpiryDate={setNewEquipmentExpiryDate}
        newEquipmentIstimara={newEquipmentIstimara}
        setNewEquipmentIstimara={setNewEquipmentIstimara}
        updatingEquipment={updatingEquipment}
        onUpdateEquipment={handleUpdateEquipment}
        // Edit Hours Modal
        isEditHoursModalOpen={isEditHoursModalOpen}
        setIsEditHoursModalOpen={setIsEditHoursModalOpen}
        selectedTimesheetForEdit={selectedTimesheetForEdit}
        editHours={editHours}
        setEditHours={setEditHours}
        editOvertimeHours={editOvertimeHours}
        setEditOvertimeHours={setEditOvertimeHours}
        updatingHours={updatingHours}
        onUpdateHours={handleUpdateHours}
      />
    </div>
  );
}
