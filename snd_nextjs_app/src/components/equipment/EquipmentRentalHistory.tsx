"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  History, 
  Calendar, 
  User, 
  DollarSign, 
  Package, 
  MapPin, 
  FileText, 
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ApiService } from "@/lib/api-service";
import Link from "next/link";
import { Label } from "@/components/ui/label";

interface RentalHistoryItem {
  id: number;
  rental_id: number;
  rental_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  equipment_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  rate_type: string;
  days?: number;
  status: string;
  notes?: string;
  rental_start_date: string;
  rental_expected_end_date?: string;
  rental_actual_end_date?: string;
  rental_status: string;
  created_at: string;
  updated_at: string;
}

interface EquipmentRentalHistoryProps {
  equipmentId: number;
}

export default function EquipmentRentalHistory({ equipmentId }: EquipmentRentalHistoryProps) {
  const [rentalHistory, setRentalHistory] = useState<RentalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRental, setSelectedRental] = useState<RentalHistoryItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchRentalHistory();
  }, [equipmentId]);

  const fetchRentalHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getEquipmentRentalHistory(equipmentId);
      if (response.success) {
        setRentalHistory(response.data || []);
      } else {
        setError(response.error || 'Failed to load rental history');
      }
    } catch (error) {
      console.error('Error fetching rental history:', error);
      setError('Failed to load rental history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      completed: { variant: 'secondary' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
      pending: { variant: 'outline' as const, label: 'Pending' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRentalStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      completed: { variant: 'secondary' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
      pending: { variant: 'outline' as const, label: 'Pending' },
      approved: { variant: 'default' as const, label: 'Approved' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRateTypeBadge = (rateType: string) => {
    const typeConfig = {
      daily: { variant: 'secondary' as const, label: 'Daily' },
      weekly: { variant: 'secondary' as const, label: 'Weekly' },
      monthly: { variant: 'secondary' as const, label: 'Monthly' },
    };
    
    const config = typeConfig[rateType as keyof typeof typeConfig] || { variant: 'outline' as const, label: rateType };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const openDetailsDialog = (rental: RentalHistoryItem) => {
    setSelectedRental(rental);
    setShowDetailsDialog(true);
  };

  const getCurrentRental = () => {
    return rentalHistory.find(rental => 
      rental.status === 'active' && 
      (rental.rental_status === 'active' || rental.rental_status === 'approved')
    );
  };

  const getCompletedRentals = () => {
    return rentalHistory.filter(rental => 
      rental.rental_status === 'completed' || rental.status === 'completed'
    );
  };

  const getTotalRevenue = () => {
    return rentalHistory.reduce((total, rental) => total + Number(rental.total_price), 0);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Rental History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading rental history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Rental History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <span className="ml-2">{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRentalHistory}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentRental = getCurrentRental();
  const completedRentals = getCompletedRentals();
  const totalRevenue = getTotalRevenue();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Rental History</span>
          </CardTitle>
          <CardDescription>
            Track all rental assignments and revenue for this equipment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total Rentals</span>
              </div>
              <div className="text-2xl font-bold">{rentalHistory.length}</div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
              </div>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Completed</span>
              </div>
              <div className="text-2xl font-bold">{completedRentals.length}</div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Current Status</span>
              </div>
              <div className="text-2xl font-bold">
                {currentRental ? 'Rented' : 'Available'}
              </div>
            </div>
          </div>

          <Separator />

          {/* Current Rental */}
          {currentRental && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Rental</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Rental #{currentRental.rental_number}</span>
                        {getRentalStatusBadge(currentRental.rental_status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Customer: {currentRental.customer_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Start Date: {format(new Date(currentRental.rental_start_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${currentRental.total_price.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {currentRental.quantity} × ${currentRental.unit_price.toFixed(2)} {currentRental.rate_type}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Separator />

          {/* Rental History Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Rental History</h3>
              <Button variant="outline" size="sm" onClick={fetchRentalHistory}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {rentalHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2" />
                <p>No rental history found</p>
                <p className="text-sm">This equipment hasn't been rented yet</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rental #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentalHistory.map((rental) => (
                      <TableRow key={rental.id}>
                        <TableCell className="font-medium">
                          <Link 
                            href={`/modules/rental-management/${rental.rental_id}`}
                            className="hover:underline text-blue-600"
                          >
                            {rental.rental_number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rental.customer_name}</div>
                            {rental.customer_email && (
                              <div className="text-sm text-muted-foreground">{rental.customer_email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(rental.rental_start_date), 'MMM dd, yyyy')}</div>
                            {rental.rental_expected_end_date && (
                              <div className="text-muted-foreground">
                                to {format(new Date(rental.rental_expected_end_date), 'MMM dd, yyyy')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">${rental.total_price.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">
                              {rental.quantity} × ${rental.unit_price.toFixed(2)} {getRateTypeBadge(rental.rate_type)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(rental.status)}
                            {getRentalStatusBadge(rental.rental_status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailsDialog(rental)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rental Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rental Details</DialogTitle>
            <DialogDescription>
              Detailed information about this rental assignment
            </DialogDescription>
          </DialogHeader>
          
          {selectedRental && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Rental Number</Label>
                  <p className="font-medium">{selectedRental.rental_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="flex space-x-2">
                    {getStatusBadge(selectedRental.status)}
                    {getRentalStatusBadge(selectedRental.rental_status)}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Customer Information</Label>
                <div className="mt-2 space-y-1">
                  <p className="font-medium">{selectedRental.customer_name}</p>
                  {selectedRental.customer_email && (
                    <p className="text-sm text-muted-foreground">{selectedRental.customer_email}</p>
                  )}
                  {selectedRental.customer_phone && (
                    <p className="text-sm text-muted-foreground">{selectedRental.customer_phone}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                  <p>{format(new Date(selectedRental.rental_start_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Expected End Date</Label>
                  <p>
                    {selectedRental.rental_expected_end_date 
                      ? format(new Date(selectedRental.rental_expected_end_date), 'MMM dd, yyyy')
                      : 'Not specified'
                    }
                  </p>
                </div>
                {selectedRental.rental_actual_end_date && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Actual End Date</Label>
                    <p>{format(new Date(selectedRental.rental_actual_end_date), 'MMM dd, yyyy')}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Days</Label>
                  <p>{selectedRental.days || 'Not specified'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                  <p>{selectedRental.quantity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Rate Type</Label>
                  <div>{getRateTypeBadge(selectedRental.rate_type)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Unit Price</Label>
                  <p>${selectedRental.unit_price.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Price</Label>
                  <p className="font-bold">${selectedRental.total_price.toFixed(2)}</p>
                </div>
              </div>

              {selectedRental.notes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="mt-1">{selectedRental.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p>{format(new Date(selectedRental.created_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <p>{format(new Date(selectedRental.updated_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 