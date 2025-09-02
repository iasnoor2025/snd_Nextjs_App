'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  PieChart,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Metric {
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

interface RentalStats {
  totalRentals: number;
  activeRentals: number;
  completedRentals: number;
  pendingRentals: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRentalDuration: number;
  customerSatisfaction: number;
  equipmentUtilization: number;
  overdueInvoices: number;
  totalCustomers: number;
  totalEquipment: number;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RentalStats | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockStats: RentalStats = {
          totalRentals: 156,
          activeRentals: 23,
          completedRentals: 128,
          pendingRentals: 5,
          totalRevenue: 2450000,
          monthlyRevenue: 185000,
          averageRentalDuration: 12.5,
          customerSatisfaction: 4.8,
          equipmentUtilization: 78.5,
          overdueInvoices: 3,
          totalCustomers: 45,
          totalEquipment: 67,
        };

        setStats(mockStats);
      } catch (error) {
        
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getMetrics = (): Metric[] => {
    if (!stats) return [];

    return [
      {
        label: 'Total Revenue',
        value: formatCurrency(stats.totalRevenue),
        change: 12.5,
        changeType: 'increase',
        icon: DollarSign,
      },
      {
        label: 'Active Rentals',
        value: stats.activeRentals,
        change: 8.2,
        changeType: 'increase',
        icon: Calendar,
      },
      {
        label: 'Equipment Utilization',
        value: `${stats.equipmentUtilization}%`,
        change: -2.1,
        changeType: 'decrease',
        icon: Package,
      },
      {
        label: 'Customer Satisfaction',
        value: `${stats.customerSatisfaction}/5`,
        change: 0.3,
        changeType: 'increase',
        icon: Users,
      },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading analytics data</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Rental management performance metrics and insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {getMetrics().map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                    <div className="flex items-center space-x-1">
                      {metric.changeType === 'increase' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : metric.changeType === 'decrease' ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-600" />
                      )}
                      <span
                        className={`text-sm ${
                          metric.changeType === 'increase'
                            ? 'text-green-600'
                            : metric.changeType === 'decrease'
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {metric.change > 0 ? '+' : ''}
                        {metric.change}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Rental Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Rental Overview</span>
            </CardTitle>
            <CardDescription>Current rental status and performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalRentals}</div>
                <div className="text-sm text-blue-600">Total Rentals</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.activeRentals}</div>
                <div className="text-sm text-green-600">Active Rentals</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingRentals}</div>
                <div className="text-sm text-yellow-600">Pending Rentals</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.completedRentals}</div>
                <div className="text-sm text-purple-600">Completed</div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Rental Duration</span>
                <span className="font-medium">{stats.averageRentalDuration} days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Financial Overview</span>
            </CardTitle>
            <CardDescription>Revenue and payment tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(stats.totalRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                <span className="font-medium">{formatCurrency(stats.monthlyRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overdue Invoices</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{stats.overdueInvoices}</span>
                  <Badge variant="destructive" className="text-xs">
                    Requires Attention
                  </Badge>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Equipment Utilization</span>
                <span className="font-medium">{stats.equipmentUtilization}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${stats.equipmentUtilization}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer and Equipment Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Customer Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Customers</span>
                <span className="font-bold">{formatNumber(stats.totalCustomers)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Customer Satisfaction</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{stats.customerSatisfaction}/5</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <CheckCircle
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.floor(stats.customerSatisfaction)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Equipment Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Equipment</span>
                <span className="font-bold">{formatNumber(stats.totalEquipment)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Utilization Rate</span>
                <span className="font-medium">{stats.equipmentUtilization}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${stats.equipmentUtilization}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="font-medium">Create Rental</div>
                    <div className="text-sm text-muted-foreground">Start a new rental</div>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  <div>
                    <div className="font-medium">Generate Invoice</div>
                    <div className="text-sm text-muted-foreground">Create invoice for rental</div>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <div className="font-medium">Overdue Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      {stats.overdueInvoices} items need attention
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
