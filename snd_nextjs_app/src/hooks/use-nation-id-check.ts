import { useState, useEffect, useRef } from 'react'
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
  isFirstLogin?: boolean
}

// Cache for first login check - only check once per session
const firstLoginCache = new Map<string, boolean>()

export function useNationIdCheck() {
  const { data: session, status } = useSession()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [nationIdData, setNationIdData] = useState<NationIdCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const isMountedRef = useRef(true)
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const checkFirstLogin = async () => {
    if (!session?.user?.id || isChecking || !isMountedRef.current) return

    // Check if we've already verified this user's first login
    const cacheKey = `first-login-${session.user.id}`
    if (firstLoginCache.has(cacheKey)) {
      setHasChecked(true)
      return
    }

    setIsChecking(true)
    
    try {
      const response = await fetch('/api/user/first-login-check', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (response.ok) {
        const responseText = await response.text()
        if (!responseText) {
          setHasChecked(true)
          firstLoginCache.set(cacheKey, true)
          return
        }
        
        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          setHasChecked(true)
          firstLoginCache.set(cacheKey, true)
          return
        }
        
        setNationIdData(data)
        
        // Only show modal if this is first login and user doesn't have Nation ID
        if (data.isFirstLogin && !data.hasNationId && !hasChecked) {
          setIsModalOpen(true)
          setHasChecked(true)
        } else {
          // Mark as checked and cache the result
          setHasChecked(true)
          firstLoginCache.set(cacheKey, true)
        }
      } else if (response.status === 401) {
        // User is not authenticated, don't show modal
        setHasChecked(true)
        firstLoginCache.set(cacheKey, true)
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
        firstLoginCache.set(cacheKey, true)
      }
    } catch (error) {
      // Don't show modal on error, just log it
      setHasChecked(true)
      firstLoginCache.set(cacheKey, true)
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false)
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    
    // Only check on first login, not on every page refresh
    if (status === 'authenticated' && session?.user?.id && !hasChecked) {
      // Add a small delay to prioritize page load over first login check
      checkTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          checkFirstLogin()
        }
      }, 200) // 200ms delay
    }

    return () => {
      isMountedRef.current = false
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
    }
  }, [session, status, hasChecked])

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const refreshCheck = () => {
    // Clear cache for this user
    if (session?.user?.id) {
      const cacheKey = `first-login-${session.user.id}`
      firstLoginCache.delete(cacheKey)
    }
    
    setHasChecked(false)
    setNationIdData(null)
    checkFirstLogin()
  }

  // Clear cache when component unmounts
  useEffect(() => {
    return () => {
      if (session?.user?.id) {
        const cacheKey = `first-login-${session.user.id}`
        firstLoginCache.delete(cacheKey)
      }
    }
  }, [session?.user?.id])

  return {
    isModalOpen,
    closeModal,
    nationIdData,
    isChecking,
    hasChecked,
    refreshCheck,
  }
} 
