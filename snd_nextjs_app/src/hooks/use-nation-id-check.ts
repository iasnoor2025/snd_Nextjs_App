import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface MatchedEmployee {
  id: number
  first_name: string
  middle_name?: string
  last_name: string
  employee_id: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  nationality?: string
  date_of_birth?: string
  hire_date?: string
  iqama_number?: string
  iqama_expiry?: string
  passport_number?: string
  passport_expiry?: string
  driving_license_number?: string
  driving_license_expiry?: string
  operator_license_number?: string
  operator_license_expiry?: string
  designation?: { name: string }
  department?: { name: string }
}

interface NationIdCheckResult {
  hasNationId: boolean
  nationId: string | null
  userId: number | null
  userName: string | null
  userEmail: string | null
  matchedEmployee?: MatchedEmployee
}

export function useNationIdCheck() {
  const { data: session, status } = useSession()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [nationIdData, setNationIdData] = useState<NationIdCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  const checkNationId = async () => {
    if (!session?.user?.id || isChecking) return

    setIsChecking(true)
    try {
      const response = await fetch('/api/user/nation-id')
      
      if (response.ok) {
        const responseText = await response.text()
        if (!responseText) {
          setHasChecked(true)
          return
        }
        
        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          setHasChecked(true)
          return
        }
        
        setNationIdData(data)
        
        // Show modal if user doesn't have a nation ID
        if (!data.hasNationId && !hasChecked) {
          setIsModalOpen(true)
          setHasChecked(true)
        } else if (data.hasNationId && !hasChecked) {
          // User has Nation ID, mark as checked but don't show modal
          setHasChecked(true)
        }
      } else if (response.status === 401) {
        // User is not authenticated, don't show modal
        setHasChecked(true)
      } else {
        const responseText = await response.text()
        let errorData = { error: 'Unknown error' }
        if (responseText) {
          try {
            errorData = JSON.parse(responseText)
          } catch (parseError) {
            // Ignore parse errors
          }
        }
        // Don't show modal on error, just log it
        setHasChecked(true)
      }
    } catch (error) {
      // Don't show modal on error, just log it
      setHasChecked(true)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !hasChecked) {
      checkNationId()
    }
  }, [session, status, hasChecked])

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const refreshCheck = () => {
    setHasChecked(false)
    checkNationId()
  }

  return {
    isModalOpen,
    closeModal,
    nationIdData,
    isChecking,
    hasChecked,
    refreshCheck,
  }
} 