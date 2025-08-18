"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Users, Calendar, TrendingUp, AlertTriangle, Building2, Wrench, Truck, FileText } from "lucide-react"
import { RoleBased } from "@/components/RoleBased"

interface DashboardHeaderProps {
  stats: any
  equipmentCount: number
  refreshing: boolean
  onRefresh: () => void
  session: any
}

export function DashboardHeader({ stats, equipmentCount, refreshing, onRefresh, session }: DashboardHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-blue-100 text-lg">
              Welcome back, {session?.user?.name || 'User'}! Here's what's happening in your system.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-blue-100">
                Auto-refresh: <span className="font-medium">Enabled</span>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            
            <Button 
              onClick={onRefresh} 
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

        {/* Quick Stats Overview */}
        {stats && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4">
            <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <Users className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{stats.totalEmployees || 0}</div>
              <div className="text-xs text-blue-100">Employees</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <Calendar className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{stats.activeProjects || 0}</div>
              <div className="text-xs text-blue-100">Projects</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{stats.monthlyMoneyReceived || 0}</div>
              <div className="text-xs text-blue-100">Money Received</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 opacity-80" style={{ transform: 'rotate(180deg)' }} />
              <div className="text-2xl font-bold">{stats.monthlyMoneyLost || 0}</div>
              <div className="text-xs text-blue-100">Money Lost</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{stats.pendingApprovals || 0}</div>
              <div className="text-xs text-blue-100">Pending</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <Building2 className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{stats.totalCompanies || 0}</div>
              <div className="text-xs text-blue-100">Companies</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <Wrench className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{equipmentCount}</div>
              <div className="text-xs text-blue-100">Equipment</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <Truck className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{stats.activeRentals || 0}</div>
              <div className="text-xs text-blue-100">Rentals</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <FileText className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{stats.totalDocuments || 0}</div>
              <div className="text-xs text-blue-100">Documents</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
