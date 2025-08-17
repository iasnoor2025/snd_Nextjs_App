"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

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

interface DashboardModalsProps {
  // Iqama Modal
  isIqamaModalOpen: boolean
  setIsIqamaModalOpen: (open: boolean) => void
  selectedIqama: IqamaData | null
  newExpiryDate: string
  setNewExpiryDate: (date: string) => void
  updatingIqama: boolean
  onUpdateIqama: () => void

  // Equipment Modal
  isEquipmentUpdateModalOpen: boolean
  setIsEquipmentUpdateModalOpen: (open: boolean) => void
  selectedEquipment: EquipmentData | null
  newEquipmentExpiryDate: string
  setNewEquipmentExpiryDate: (date: string) => void
  newEquipmentIstimara: string
  setNewEquipmentIstimara: (istimara: string) => void
  updatingEquipment: boolean
  onUpdateEquipment: () => void

  // Edit Hours Modal
  isEditHoursModalOpen: boolean
  setIsEditHoursModalOpen: (open: boolean) => void
  selectedTimesheetForEdit: any | null
  editHours: string
  setEditHours: (hours: string) => void
  editOvertimeHours: string
  setEditOvertimeHours: (hours: string) => void
  updatingHours: boolean
  onUpdateHours: () => void
}

export function DashboardModals({
  // Iqama Modal
  isIqamaModalOpen,
  setIsIqamaModalOpen,
  selectedIqama,
  newExpiryDate,
  setNewExpiryDate,
  updatingIqama,
  onUpdateIqama,

  // Equipment Modal
  isEquipmentUpdateModalOpen,
  setIsEquipmentUpdateModalOpen,
  selectedEquipment,
  newEquipmentExpiryDate,
  setNewEquipmentExpiryDate,
  newEquipmentIstimara,
  setNewEquipmentIstimara,
  updatingEquipment,
  onUpdateEquipment,

  // Edit Hours Modal
  isEditHoursModalOpen,
  setIsEditHoursModalOpen,
  selectedTimesheetForEdit,
  editHours,
  setEditHours,
  editOvertimeHours,
  setEditOvertimeHours,
  updatingHours,
  onUpdateHours
}: DashboardModalsProps) {
  return (
    <>
      {/* Iqama Update Modal */}
      <Dialog open={isIqamaModalOpen} onOpenChange={setIsIqamaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Iqama Expiry Date</DialogTitle>
            <DialogDescription>
              Update the Iqama expiry date for {selectedIqama?.employeeName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="iqamaExpiryDate" className="text-right">
                Expiry Date
              </Label>
              <Input
                id="iqamaExpiryDate"
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsIqamaModalOpen(false)}
              disabled={updatingIqama}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onUpdateIqama}
              disabled={!newExpiryDate || updatingIqama}
            >
              {updatingIqama ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipment Update Modal */}
      <Dialog open={isEquipmentUpdateModalOpen} onOpenChange={setIsEquipmentUpdateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEquipment?.status === 'missing' ? 'Add Istimara Expiry Date' : 'Update Istimara Expiry Date'}
            </DialogTitle>
            <DialogDescription>
              {selectedEquipment?.status === 'missing' 
                ? `Add Istimara expiry date for ${selectedEquipment?.equipmentName}`
                : `Update the Istimara expiry date for ${selectedEquipment?.equipmentName}`
              }
            </DialogDescription>
            {selectedEquipment?.istimara ? (
              <div className="mt-2 text-sm text-muted-foreground">
                ℹ️ Istimara number already exists and cannot be modified
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">
                ℹ️ You can add an Istimara number if available
              </div>
            )}
          </DialogHeader>
          {/* Equipment Summary */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="text-sm space-y-1">
              <div><span className="font-medium">Equipment:</span> {selectedEquipment?.equipmentName}</div>
              {selectedEquipment?.equipmentNumber && (
                <div><span className="font-medium">Number:</span> #{selectedEquipment.equipmentNumber}</div>
              )}
              {selectedEquipment?.manufacturer && (
                <div><span className="font-medium">Manufacturer:</span> {selectedEquipment.manufacturer}</div>
              )}
              {selectedEquipment?.modelNumber && (
                <div><span className="font-medium">Model:</span> {selectedEquipment.modelNumber}</div>
              )}
            </div>
          </div>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="equipmentIstimara" className="text-right">
                Istimara #
              </Label>
              <Input
                id="equipmentIstimara"
                type="text"
                value={selectedEquipment?.istimara || newEquipmentIstimara}
                disabled={!!selectedEquipment?.istimara}
                className={`col-span-3 ${selectedEquipment?.istimara ? 'bg-muted' : ''}`}
                placeholder={selectedEquipment?.istimara ? "Istimara number (read-only)" : "Enter Istimara number"}
                onChange={(e) => {
                  // Only allow changes if no existing istimara
                  if (!selectedEquipment?.istimara) {
                    setNewEquipmentIstimara(e.target.value);
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="equipmentExpiryDate" className="text-right">
                Expiry Date
              </Label>
              <Input
                id="equipmentExpiryDate"
                type="date"
                value={newEquipmentExpiryDate}
                onChange={(e) => setNewEquipmentExpiryDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEquipmentUpdateModalOpen(false)}
              disabled={updatingEquipment}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onUpdateEquipment}
              disabled={!newEquipmentExpiryDate || updatingEquipment}
            >
              {updatingEquipment ? 'Updating...' :
                selectedEquipment?.status === 'missing' ? 'Add Istimara & Expiry' : 'Update Expiry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Hours Modal */}
      <Dialog open={isEditHoursModalOpen} onOpenChange={setIsEditHoursModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Timesheet Hours</DialogTitle>
            <DialogDescription>
              Update hours and overtime for {selectedTimesheetForEdit?.employeeName}'s timesheet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hoursWorked" className="text-right">
                Hours Worked
              </Label>
              <Input
                id="hoursWorked"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
                className="col-span-3"
                placeholder="8.0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="overtimeHours" className="text-right">
                Overtime Hours
              </Label>
              <Input
                id="overtimeHours"
                type="number"
                step="0.5"
                min="0"
                max="12"
                value={editOvertimeHours}
                onChange={(e) => setEditOvertimeHours(e.target.value)}
                className="col-span-3"
                placeholder="2.0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditHoursModalOpen(false)}
              disabled={updatingHours}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onUpdateHours}
              disabled={!editHours || updatingHours}
            >
              {updatingHours ? 'Updating...' : 'Update Hours'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
