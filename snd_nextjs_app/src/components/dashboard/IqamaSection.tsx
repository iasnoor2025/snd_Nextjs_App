"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { Search, Filter, Calendar, AlertTriangle, User, FileText, Building2, MapPin, Globe, Briefcase, Edit } from "lucide-react"
import { RoleBased } from "@/components/RoleBased"

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

interface IqamaSectionProps {
  iqamaData: IqamaData[]
  onUpdateIqama: (iqama: IqamaData) => void
}

export function IqamaSection({ iqamaData, onUpdateIqama }: IqamaSectionProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filter and search logic
  const filteredData = iqamaData.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesSearch = !search || 
      item.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      item.fileNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.nationality?.toLowerCase().includes(search.toLowerCase()) ||
      item.position?.toLowerCase().includes(search.toLowerCase())
    
    return item.status !== 'active' && matchesStatus && matchesSearch
  })

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Iqama Management
            </CardTitle>
            <CardDescription>
              Track and manage employee Iqama expiry dates
            </CardDescription>
          </div>
          <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/modules/employee-management')}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Manage Iqama
            </Button>
          </RoleBased>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, file number, nationality, or position..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-sm border border-input rounded-md bg-background"
            >
              <option value="all">All Statuses</option>
              <option value="expired">Expired</option>
              <option value="expiring">Expiring Soon</option>
              <option value="missing">Missing</option>
            </select>
            {(search || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                }}
                className="h-10"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-red-600">
              {iqamaData.filter(item => item.status === 'expired').length}
            </div>
            <div className="text-sm text-muted-foreground">Expired</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-yellow-600">
              {iqamaData.filter(item => item.status === 'expiring').length}
            </div>
            <div className="text-sm text-muted-foreground">Expiring Soon</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-blue-600">
              {iqamaData.filter(item => item.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-gray-600">
              {iqamaData.filter(item => item.status === 'missing').length}
            </div>
            <div className="text-sm text-muted-foreground">Missing</div>
          </div>
        </div>

        {/* Iqama Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>File Number</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{item.employeeName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        {item.nationality}
                        <Briefcase className="h-3 w-3" />
                        {item.position}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{item.fileNumber}</TableCell>
                  <TableCell className="text-sm">{item.companyName}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.status === 'expired' ? 'destructive' : 
                               item.status === 'expiring' ? 'secondary' : 
                               item.status === 'missing' ? 'outline' : 'default'}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.expiryDate ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-red-600 font-medium">No expiry date</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.daysRemaining !== null ? (
                      <div className={`flex items-center gap-1 ${
                        item.daysRemaining < 0 ? 'text-red-600' :
                        item.daysRemaining <= 30 ? 'text-yellow-600' :
                        'text-muted-foreground'
                      }`}>
                        <AlertTriangle className="h-3 w-3" />
                        {item.daysRemaining < 0 
                          ? `${Math.abs(item.daysRemaining)} days overdue`
                          : `${item.daysRemaining} days remaining`
                        }
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateIqama(item)}
                        className="h-8 w-8 p-0"
                        title="Update Iqama expiry date"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </RoleBased>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-8 px-2 text-sm border border-input rounded-md bg-background"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No Iqama records found</p>
            <p className="text-sm opacity-80">
              {search || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'All Iqama records are currently active'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
