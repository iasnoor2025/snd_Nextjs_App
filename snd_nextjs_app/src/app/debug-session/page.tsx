"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugSessionPage() {
  const { data: session, status } = useSession()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Session Debug</h1>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Current authentication status</CardDescription>
          </CardHeader>
          <CardContent>
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Authenticated:</strong> {status === 'authenticated' ? 'Yes' : 'No'}</p>
          </CardContent>
        </Card>

        {session && (
          <Card>
            <CardHeader>
              <CardTitle>Session Data</CardTitle>
              <CardDescription>Current session information</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {session?.user && (
          <Card>
            <CardHeader>
              <CardTitle>User Data</CardTitle>
              <CardDescription>Current user information</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(session.user, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 