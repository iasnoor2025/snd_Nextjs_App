"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestProfilePage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testProfileAPI = async () => {
    setIsLoading(true)
    try {
      console.log('🧪 Testing profile API...')
      const response = await fetch('/api/profile')
      const data = await response.json()
      console.log('📊 Profile API response:', data)
      setTestResult(data)
    } catch (error) {
      console.error('❌ Error testing profile API:', error)
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }

  const testDatabaseAPI = async () => {
    setIsLoading(true)
    try {
      console.log('🧪 Testing database API...')
      const response = await fetch('/api/test-profile')
      const data = await response.json()
      console.log('📊 Database API response:', data)
      setTestResult(data)
    } catch (error) {
      console.error('❌ Error testing database API:', error)
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile API Test</h1>
      
      <div className="space-y-4 mb-6">
        <Button onClick={testProfileAPI} disabled={isLoading}>
          {isLoading ? "Testing..." : "Test Profile API"}
        </Button>
        
        <Button onClick={testDatabaseAPI} disabled={isLoading} variant="outline">
          {isLoading ? "Testing..." : "Test Database API"}
        </Button>
      </div>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>API response data</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 