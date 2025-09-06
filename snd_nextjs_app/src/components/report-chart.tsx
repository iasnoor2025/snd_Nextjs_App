'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ReportChartProps {
  title: string;
  description?: string;
  data: ChartData[];
  type?: 'bar' | 'pie' | 'line';
  className?: string;
}

export function ReportChart({ title, description, data, type = 'bar', className = '' }: ReportChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  const getColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-cyan-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  if (type === 'pie') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {data.map((item, index) => {
              const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${getColor(index)}`}></div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{item.value.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'line') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.label}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getColor(index)}`}
                      style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold w-16 text-right">{item.value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default bar chart
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="font-semibold">{item.value.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${getColor(index)}`}
                  style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
