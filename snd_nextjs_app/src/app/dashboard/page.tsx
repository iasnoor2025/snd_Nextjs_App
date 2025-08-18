'use client';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardModals } from '@/components/dashboard/DashboardModals';
import { EquipmentSection } from '@/components/dashboard/EquipmentSection';
import { FinancialOverviewSection } from '@/components/dashboard/FinancialOverviewSection';
import { IqamaSection } from '@/components/dashboard/IqamaSection';
import { ProjectOverviewSection } from '@/components/dashboard/ProjectOverviewSection';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { TimesheetsSection } from '@/components/dashboard/TimesheetsSection';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface IqamaData {
  id: number;
  employeeName: string;
  fileNumber: string;
  nationality: string;
  position: string;
  companyName: string;
  location: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'expiring' | 'missing';
  daysRemaining: number | null;
}

interface EquipmentData {
  id: number;
  equipmentName: string;
  equipmentNumber?: string;
  istimara?: string;
  istimaraExpiry?: string;
  daysRemaining: number | null;
  department?: string;
  status: 'available' | 'expired' | 'expiring' | 'missing';
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
}

interface TimesheetData {
  id: number;
  employeeName: string;
  status: 'present' | 'late' | 'absent' | 'half-day';
  approvalStatus:
    | 'draft'
    | 'submitted'
    | 'foreman_approved'
    | 'incharge_approved'
    | 'checking_approved'
    | 'manager_approved'
    | 'rejected';
  totalHours: number;
  overtimeHours: number;
}

interface ProjectData {
  id: number;
  name: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  teamSize: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  manager: {
    name: string;
    avatar?: string;
    initials: string;
  };
  department: string;
}

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
  const [projectData, setProjectData] = useState<ProjectData[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

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
      router.push('/auth/signin');
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
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();

      setStats(data.stats || {});
      setIqamaData(data.iqamaData || []);

      console.log('🔧 Setting equipment data state:', data.equipmentData?.length || 0);
      setEquipmentData(data.equipmentData || []);

      setTimesheetData(data.timesheetData || []);
      setProjectData(data.projectData || []);
      setActivities(data.activities || []);

      // Debug logging
      console.log('📊 Dashboard data received:', {
        stats: data.stats,
        iqamaData: data.iqamaData?.length || 0,
        equipmentData: data.equipmentData?.length || 0,
        timesheetData: data.timesheetData?.length || 0,
        projectData: data.projectData?.length || 0,
        activities: data.activities?.length || 0,
      });

      console.log('🔧 Raw equipment data:', data.equipmentData);

      if (data.equipmentData) {
        console.log('🔧 Equipment data details:', {
          total: data.equipmentData.length,
          statusBreakdown: {
            available: data.equipmentData.filter((item: any) => item.status === 'available').length,
            expired: data.equipmentData.filter((item: any) => item.status === 'expired').length,
            expiring: data.equipmentData.filter((item: any) => item.status === 'expiring').length,
            missing: data.equipmentData.filter((item: any) => item.status === 'missing').length,
          },
          sample: data.equipmentData.slice(0, 2),
        });
      } else {
        console.log('❌ No equipment data received from API');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
        throw new Error('Failed to fetch timesheet data');
      }
      const data = await response.json();
      setTimesheetData(data.timesheetData || []);
    } catch (error) {
      console.error('Error fetching timesheet data:', error);
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
        throw new Error('Failed to fetch Iqama data');
      }
      const data = await response.json();
      setIqamaData(data.iqamaData || []);
    } catch (error) {
      console.error('Error fetching Iqama data:', error);
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
        throw new Error('Failed to fetch Equipment data');
      }
      const data = await response.json();
      setEquipmentData(data.equipmentData || []);
    } catch (error) {
      console.error('Error fetching Equipment data:', error);
    } finally {
      setUpdatingEquipment(false);
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
  //     console.error('Error fetching project data:', error)
  //   }
  // }

  // Initial data fetch
  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  // Add sample project data for testing
  useEffect(() => {
    if (projectData.length === 0) {
      const sampleProjects: ProjectData[] = [
        {
          id: 1,
          name: 'Office Building Construction',
          status: 'active',
          progress: 75,
          startDate: '2024-01-15',
          endDate: '2024-12-31',
          budget: 2500000,
          spent: 1875000,
          teamSize: 45,
          priority: 'high',
          manager: {
            name: 'Ahmed Al-Rashid',
            initials: 'AR',
          },
          department: 'Construction',
        },
        {
          id: 2,
          name: 'Road Infrastructure Project',
          status: 'planning',
          progress: 25,
          startDate: '2024-03-01',
          endDate: '2025-06-30',
          budget: 1800000,
          spent: 450000,
          teamSize: 32,
          priority: 'critical',
          manager: {
            name: 'Sarah Johnson',
            initials: 'SJ',
          },
          department: 'Infrastructure',
        },
        {
          id: 3,
          name: 'Shopping Mall Renovation',
          status: 'on-hold',
          progress: 60,
          startDate: '2023-11-01',
          endDate: '2024-08-31',
          budget: 800000,
          spent: 480000,
          teamSize: 28,
          priority: 'medium',
          manager: {
            name: 'Mohammed Al-Zahrani',
            initials: 'MZ',
          },
          department: 'Renovation',
        },
        {
          id: 4,
          name: 'Residential Complex Phase 1',
          status: 'completed',
          progress: 100,
          startDate: '2023-06-01',
          endDate: '2024-02-28',
          budget: 3200000,
          spent: 3200000,
          teamSize: 55,
          priority: 'high',
          manager: {
            name: 'Fatima Al-Qahtani',
            initials: 'FQ',
          },
          department: 'Residential',
        },
      ];
      setProjectData(sampleProjects);
    }
  }, [projectData.length]);

  // Load section visibility from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-section-visibility');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSectionVisibility(parsed);
        } catch (e) {
          console.warn('Failed to parse saved section visibility:', e);
        }
      }
      setSectionsLoaded(true);
    }
  }, []);

  // Monitor equipment data state changes
  useEffect(() => {
    console.log('🔧 Equipment data state changed:', equipmentData.length);
    if (equipmentData.length > 0) {
      console.log('🔧 Equipment data state sample:', equipmentData.slice(0, 2));
    }
  }, [equipmentData]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
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
        throw new Error('Failed to update Iqama');
      }
    } catch (error) {
      console.error('Error updating Iqama:', error);
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
        setIsEquipmentUpdateModalOpen(false);
        setNewEquipmentExpiryDate('');
        setNewEquipmentIstimara('');
        setSelectedEquipment(null);
        // Only refresh Equipment data instead of full dashboard
        await fetchEquipmentData();
      } else {
        throw new Error('Failed to update equipment');
      }
    } catch (error) {
      console.error('Error updating equipment:', error);
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
        setApprovalSuccess(data.message || 'Timesheet approved successfully');
        // Only refresh timesheet data instead of full dashboard
        await fetchTimesheetData();
        setTimeout(() => setApprovalSuccess(null), 5000);
      } else {
        throw new Error('Failed to approve timesheet');
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
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
        body: JSON.stringify({ rejectionReason: 'Rejected by supervisor' }),
      });

      if (response.ok) {
        setApprovalSuccess('Timesheet rejected successfully');
        // Only refresh timesheet data instead of full dashboard
        await fetchTimesheetData();
        setTimeout(() => setApprovalSuccess(null), 5000);
      } else {
        throw new Error('Failed to reject timesheet');
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
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
        body: JSON.stringify({ notes: 'Marked absent by supervisor' }),
      });

      if (response.ok) {
        setApprovalSuccess('Employee marked as absent');
        // Only refresh timesheet data instead of full dashboard
        await fetchTimesheetData();
        setTimeout(() => setApprovalSuccess(null), 5000);
      } else {
        throw new Error('Failed to mark absent');
      }
    } catch (error) {
      console.error('Error marking absent:', error);
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
        setApprovalSuccess('Hours updated successfully');
        // Only refresh timesheet data instead of full dashboard
        await fetchTimesheetData();
        setTimeout(() => setApprovalSuccess(null), 5000);
      } else {
        throw new Error('Failed to update hours');
      }
    } catch (error) {
      console.error('Error updating hours:', error);
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
