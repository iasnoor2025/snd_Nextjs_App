'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis } from 'recharts';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const description = 'An interactive area chart for rental data';

const chartData = [
  { date: 'Jan', revenue: 12500, rentals: 45 },
  { date: 'Feb', revenue: 13800, rentals: 52 },
  { date: 'Mar', revenue: 14200, rentals: 58 },
  { date: 'Apr', revenue: 15600, rentals: 64 },
  { date: 'May', revenue: 16800, rentals: 71 },
  { date: 'Jun', revenue: 18200, rentals: 78 },
  { date: 'Jul', revenue: 19500, rentals: 85 },
  { date: 'Aug', revenue: 20800, rentals: 92 },
  { date: 'Sep', revenue: 22100, rentals: 98 },
  { date: 'Oct', revenue: 23400, rentals: 105 },
  { date: 'Nov', revenue: 24700, rentals: 112 },
  { date: 'Dec', revenue: 26000, rentals: 120 },
];

export function ChartAreaSimple() {
  const [period, setPeriod] = React.useState('12M');

  return (
    <Card className="bg-card border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rental Data</CardTitle>
            <CardDescription>Track your rental performance and revenue trends</CardDescription>
          </div>
          <CardAction>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7D">Last 7 days</SelectItem>
                <SelectItem value="30D">Last 30 days</SelectItem>
                <SelectItem value="3M">Last 3 months</SelectItem>
                <SelectItem value="12M">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <AreaChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="rentals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Revenue
                          </span>
                          <span className="font-bold text-muted-foreground">
                            ${payload[0]?.value?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Rentals
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[1]?.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#revenue)"
            />
            <Area
              type="monotone"
              dataKey="rentals"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#rentals)"
            />
          </AreaChart>
        </div>
      </CardContent>
    </Card>
  );
}
