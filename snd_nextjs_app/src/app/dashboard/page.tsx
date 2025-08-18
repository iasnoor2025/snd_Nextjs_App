"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { IqamaSection } from "@/components/dashboard/IqamaSection"
import { EquipmentSection } from "@/components/dashboard/EquipmentSection"
import { TimesheetsSection } from "@/components/dashboard/TimesheetsSection"
import { FinancialMetricsSection } from "@/components/dashboard/FinancialMetricsSection"
import { FinancialOverviewSection } from "@/components/dashboard/FinancialOverviewSection"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { DashboardModals } from "@/components/dashboard/DashboardModals"
import { useI18n } from "@/hooks/use-i18n"

interface IqamaData {
  id: number
  employeeName: string
  fileNumber: string
  nationality: string
  position: string
  companyName: string
  location: string
  expiryDate: string
  status: 'active' | 'expired' | 'expiring' | 'missing'
  daysRemaining: number | null
}

interface EquipmentData {
  id: number
  equipmentName: string
  equipmentNumber: string | null
  istimara: string | null
  istimaraExpiry: string | null
  daysRemaining: number | null
  department: string | null
  status: 'available' | 'expired' | 'expiring' | 'missing'
  manufacturer: string | null
  modelNumber: string | null
  serialNumber: string | null
}

interface TimesheetData {
  id: number
  employeeName: string
  status: 'present' | 'late' | 'absent' | 'half-day'
  approvalStatus: 'draft' | 'submitted' | 'foreman_approved' | 'incharge_approved' | 'checking_approved' | 'manager_approved' | 'rejected'
  totalHours: number
  overtimeHours: number
}

interface ActivityItem {
  id: number
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: string
  user?: string
  action?: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useI18n()

  // State for dashboard data
  const [stats, setStats] = useState<any>(null)
  const [iqamaData, setIqamaData] = useState<IqamaData[]>([])
  const [equipmentData, setEquipmentData] = useState<EquipmentData[]>([])
  const [timesheetData, setTimesheetData] = useState<TimesheetData[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])

  // State for loading and refreshing
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // State for modals
  const [isIqamaModalOpen, setIsIqamaModalOpen] = useState(false)
  const [isEquipmentUpdateModalOpen, setIsEquipmentUpdateModalOpen] = useState(false)
  const [isEditHoursModalOpen, setIsEditHoursModalOpen] = useState(false)

  // State for selected items
  const [selectedIqama, setSelectedIqama] = useState<IqamaData | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentData | null>(null)
  const [selectedTimesheetForEdit, setSelectedTimesheetForEdit] = useState<any | null>(null)

  // State for form inputs
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [newEquipmentExpiryDate, setNewEquipmentExpiryDate] = useState('')
  const [newEquipmentIstimara, setNewEquipmentIstimara] = useState('')
  const [editHours, setEditHours] = useState('')
  const [editOvertimeHours, setEditOvertimeHours] = useState('')

  // State for loading states
  const [updatingIqama, setUpdatingIqama] = useState(false)
  const [updatingEquipment, setUpdatingEquipment] = useState(false)
  const [updatingHours, setUpdatingHours] = useState(false)
  const [approvingTimesheet, setApprovingTimesheet] = useState<number | null>(null)
  const [rejectingTimesheet, setRejectingTimesheet] = useState<number | null>(null)
  const [markingAbsent, setMarkingAbsent] = useState<number | null>(null)

  // State for success messages
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null)

  // Current time for display
  const [currentTime, setCurrentTime] = useState(new Date())

  // Check authentication
  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
  }, [session, status, router])

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const data = await response.json()
      
      setStats(data.stats || {})
      setIqamaData(data.iqamaData || [])
      
      console.log('🔧 Setting equipment data state:', data.equipmentData?.length || 0)
      setEquipmentData(data.equipmentData || [])
      
      setTimesheetData(data.timesheetData || [])
      setActivities(data.activities || [])
      
      // Debug logging
      console.log('📊 Dashboard data received:', {
        stats: data.stats,
        iqamaData: data.iqamaData?.length || 0,
        equipmentData: data.equipmentData?.length || 0,
        timesheetData: data.timesheetData?.length || 0,
        activities: data.activities?.length || 0
      })
      
      console.log('🔧 Raw equipment data:', data.equipmentData)
      
      if (data.equipmentData) {
        console.log('🔧 Equipment data details:', {
          total: data.equipmentData.length,
          statusBreakdown: {
            available: data.equipmentData.filter((item: any) => item.status === 'available').length,
            expired: data.equipmentData.filter((item: any) => item.status === 'expired').length,
            expiring: data.equipmentData.filter((item: any) => item.status === 'expiring').length,
            missing: data.equipmentData.filter((item: any) => item.status === 'missing').length
          },
          sample: data.equipmentData.slice(0, 2)
        })
      } else {
        console.log('❌ No equipment data received from API')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Initial data fetch
  useEffect(() => {
    if (session) {
      fetchDashboardData()
    }
  }, [session])

  // Monitor equipment data state changes
  useEffect(() => {
    console.log('🔧 Equipment data state changed:', equipmentData.length)
    if (equipmentData.length > 0) {
      console.log('🔧 Equipment data state sample:', equipmentData.slice(0, 2))
    }
  }, [equipmentData])

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  // Handle Iqama update
  const handleUpdateIqama = async () => {
    if (!selectedIqama || !newExpiryDate) return

    try {
      setUpdatingIqama(true)
      const response = await fetch(`/api/employees/${selectedIqama.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iqamaExpiryDate: newExpiryDate })
      })

      if (response.ok) {
        setIsIqamaModalOpen(false)
        setNewExpiryDate('')
        setSelectedIqama(null)
        await fetchDashboardData()
      } else {
        throw new Error('Failed to update Iqama')
      }
    } catch (error) {
      console.error('Error updating Iqama:', error)
    } finally {
      setUpdatingIqama(false)
    }
  }

  // Handle equipment update
  const handleUpdateEquipment = async () => {
    if (!selectedEquipment || !newEquipmentExpiryDate) return

    try {
      setUpdatingEquipment(true)
      
      // Prepare update data
      const updateData: any = { istimara_expiry_date: newEquipmentExpiryDate }
      
      // Only include istimara if it doesn't exist and user provided one
      if (!selectedEquipment.istimara && newEquipmentIstimara.trim()) {
        updateData.istimara = newEquipmentIstimara.trim()
      }
      
      const response = await fetch(`/api/equipment/${selectedEquipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setIsEquipmentUpdateModalOpen(false)
        setNewEquipmentExpiryDate('')
        setNewEquipmentIstimara('')
        setSelectedEquipment(null)
        await fetchDashboardData()
      } else {
        throw new Error('Failed to update equipment')
      }
    } catch (error) {
      console.error('Error updating equipment:', error)
    } finally {
      setUpdatingEquipment(false)
    }
  }

  // Handle timesheet approval
  const handleApproveTimesheet = async (id: number) => {
    try {
      setApprovingTimesheet(id)
      const response = await fetch(`/api/timesheets/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        setApprovalSuccess(data.message || 'Timesheet approved successfully')
        await fetchDashboardData()
        setTimeout(() => setApprovalSuccess(null), 5000)
      } else {
        throw new Error('Failed to approve timesheet')
      }
    } catch (error) {
      console.error('Error approving timesheet:', error)
    } finally {
      setApprovingTimesheet(null)
    }
  }

  // Handle timesheet rejection
  const handleRejectTimesheet = async (id: number) => {
    try {
      setRejectingTimesheet(id)
      const response = await fetch(`/api/timesheets/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: 'Rejected by supervisor' })
      })

      if (response.ok) {
        setApprovalSuccess('Timesheet rejected successfully')
        await fetchDashboardData()
        setTimeout(() => setApprovalSuccess(null), 5000)
      } else {
        throw new Error('Failed to reject timesheet')
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error)
    } finally {
      setRejectingTimesheet(null)
    }
  }

  // Handle mark absent
  const handleMarkAbsent = async (id: number) => {
    try {
      setMarkingAbsent(id)
      const response = await fetch(`/api/timesheets/${id}/mark-absent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Marked absent by supervisor' })
      })

      if (response.ok) {
        setApprovalSuccess('Employee marked as absent')
        await fetchDashboardData()
        setTimeout(() => setApprovalSuccess(null), 5000)
      } else {
        throw new Error('Failed to mark absent')
      }
    } catch (error) {
      console.error('Error marking absent:', error)
    } finally {
      setMarkingAbsent(null)
    }
  }

  // Handle edit hours
  const handleEditHours = (id: number) => {
    const timesheet = timesheetData.find(t => t.id === id)
    if (timesheet) {
      setSelectedTimesheetForEdit(timesheet)
      setEditHours(timesheet.totalHours?.toString() || '')
      setEditOvertimeHours(timesheet.overtimeHours?.toString() || '')
      setIsEditHoursModalOpen(true)
    }
  }

  // Handle update hours
  const handleUpdateHours = async () => {
    if (!selectedTimesheetForEdit || !editHours) return

    try {
      setUpdatingHours(true)
      const response = await fetch(`/api/timesheets/${selectedTimesheetForEdit.id}/update-hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoursWorked: parseFloat(editHours),
          overtimeHours: parseFloat(editOvertimeHours) || 0
        })
      })

      if (response.ok) {
        setIsEditHoursModalOpen(false)
        setEditHours('')
        setEditOvertimeHours('')
        setSelectedTimesheetForEdit(null)
        setApprovalSuccess('Hours updated successfully')
        await fetchDashboardData()
        setTimeout(() => setApprovalSuccess(null), 5000)
      } else {
        throw new Error('Failed to update hours')
      }
    } catch (error) {
      console.error('Error updating hours:', error)
      } finally {
      setUpdatingHours(false)
    }
  }

  // Handle open Iqama modal
  const handleOpenIqamaModal = (iqama: IqamaData) => {
    setSelectedIqama(iqama)
    setNewExpiryDate(iqama.expiryDate || '')
    setIsIqamaModalOpen(true)
  }

  // Handle open equipment modal
  const handleOpenEquipmentUpdateModal = (equipment: EquipmentData) => {
    setSelectedEquipment(equipment)
    setNewEquipmentExpiryDate(equipment.istimaraExpiry || '')
    setNewEquipmentIstimara('') // Reset Istimara input
    setIsEquipmentUpdateModalOpen(true)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{t('dashboard.loading')}</p>
        </div>
      </div>
    )
  }

  // Show access denied if no session
  if (!session) {
    return null
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
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Iqama Section */}
        <IqamaSection
          iqamaData={iqamaData}
          onUpdateIqama={handleOpenIqamaModal}
        />

        {/* Equipment Section */}
        <EquipmentSection
          equipmentData={equipmentData}
          onUpdateEquipment={handleOpenEquipmentUpdateModal}
        />

        {/* Financial Metrics Section */}
        <FinancialMetricsSection />

        {/* Financial Overview Section */}
        <FinancialOverviewSection />

        {/* Timesheets Section */}
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
        />

            {/* Quick Actions */}
        <QuickActions />

            {/* Recent Activity */}
        <RecentActivity activities={activities} />
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
  )
}
