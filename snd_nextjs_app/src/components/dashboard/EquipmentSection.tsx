"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { Wrench, Plus, Edit, Eye, AlertTriangle, Calendar, Search } from "lucide-react"
import { RoleBased } from "@/components/RoleBased"

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

interface EquipmentSectionProps {
  equipmentData: EquipmentData[]
  onUpdateEquipment: (equipment: EquipmentData) => void
}

export function EquipmentSection({ equipmentData, onUpdateEquipment }: EquipmentSectionProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filter and search logic
  const filteredData = equipmentData.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesSearch = !search || 
      item.equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
      item.equipmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
      item.modelNumber?.toLowerCase().includes(search.toLowerCase())
    
    return item.status !== 'available' && matchesStatus && matchesSearch
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
              <Wrench className="h-5 w-5" />
              Equipment Istimara Expiry
            </CardTitle>
            <CardDescription>
              Equipment Istimara expiry tracking and management
            </CardDescription>
          </div>
          <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/modules/equipment-management')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Manage Equipment
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
                placeholder="Search by equipment name, number, manufacturer, or model..."
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

        {/* Equipment Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-red-600">
              {equipmentData.filter(item => item.status === 'expired').length}
            </div>
            <div className="text-sm text-muted-foreground">Expired</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-yellow-600">
              {equipmentData.filter(item => item.status === 'expiring').length}
            </div>
            <div className="text-sm text-muted-foreground">Expiring Soon</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-blue-600">
              {equipmentData.filter(item => item.status === 'available').length}
            </div>
            <div className="text-sm text-muted-foreground">Available</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-gray-600">
              {equipmentData.filter(item => item.status === 'missing').length}
            </div>
            <div className="text-sm text-muted-foreground">Missing</div>
          </div>
        </div>



        {/* Equipment Table */}
        <div className="space-y-4">
          {/* Equipment with Issues (Expired, Expiring, Missing) */}
          {(equipmentData.filter(item => item.status !== 'available').length > 0) && (
            <div className="rounded-lg border">
              <div className="p-4 border-b bg-muted/50">
                <h4 className="font-medium text-sm">Equipment Requiring Attention</h4>
                <p className="text-xs text-muted-foreground">Expired, expiring soon, or missing Istimara expiry dates</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{item.equipmentName}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.equipmentNumber && `#${item.equipmentNumber}`}
                            {item.manufacturer && ` • ${item.manufacturer}`}
                            {item.modelNumber && ` • ${item.modelNumber}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{item.department || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'expired' ? 'destructive' :
                            item.status === 'expiring' ? 'secondary' :
                            'outline'
                          }
                          className={`capitalize ${
                            item.status === 'expired' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' :
                            item.status === 'expiring' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' :
                            'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800'
                          }`}
                        >
                          {item.status === 'expired' ? 'Expired' :
                           item.status === 'expiring' ? 'Expiring Soon' :
                           'Missing'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.istimaraExpiry ? (
                          <div>
                            <div>{new Date(item.istimaraExpiry).toLocaleDateString()}</div>
                            {item.daysRemaining !== null && (
                              <div className={`text-xs ${
                                item.daysRemaining < 0 ? 'text-red-600' :
                                item.daysRemaining <= 30 ? 'text-yellow-600' :
                                'text-muted-foreground'
                              }`}>
                                {item.daysRemaining < 0 
                                  ? `${Math.abs(item.daysRemaining)} days overdue`
                                  : `${item.daysRemaining} days remaining`
                                }
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-600 font-medium">No expiry date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateEquipment(item)}
                          className="h-8 w-8 p-0"
                          title={item.status === 'missing' ? 'Add Istimara expiry date' : 'Update Istimara expiry date'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

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

        </div>



        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No equipment records found</p>
            <p className="text-sm opacity-80">
              {search || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'All equipment Istimara records are currently valid'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
