"use client"

import { ChartAreaSimple } from "@/components/chart-area-simple"
import { DataTable } from "@/components/data-table-simple"
import { SectionCards } from "@/components/section-cards"
import { useSidebar } from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"

import data from "./data.json"

export default function Page() {
  const { state, open } = useSidebar()

  // Ensure user is authenticated
  const { data: session, status } = useSession()

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-background">
      <div className="w-full p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name || "User"}! Monitor your business performance and manage operations.
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Sidebar State: <span className="text-primary">{state}</span></p>
            <p className="text-sm text-muted-foreground">Open: {open ? 'Yes' : 'No'}</p>
            <p className="text-sm text-muted-foreground">Content should flush to the right when sidebar is collapsed.</p>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCards />

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
            <ChartAreaSimple />
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
            <DataTable data={data} />
          </div>
        </div>
      </div>
    </div>
  )
}
