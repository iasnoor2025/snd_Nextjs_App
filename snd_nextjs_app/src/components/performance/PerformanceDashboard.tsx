"use client";

import { usePerformance } from '@/hooks/use-performance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Memory,
  Gauge
} from 'lucide-react';

export function PerformanceDashboard() {
  const { metrics, performanceScore, meetsCoreWebVitals } = usePerformance();

  const formatTime = (ms: number | null) => {
    if (ms === null) return 'N/A';
    return `${ms.toFixed(0)}ms`;
  };

  const formatMemory = (bytes: number | null) => {
    if (bytes === null) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  const getMetricStatus = (value: number | null, threshold: number, type: 'lower' | 'higher' = 'lower') => {
    if (value === null) return 'neutral';
    if (type === 'lower') {
      return value <= threshold ? 'good' : value <= threshold * 1.5 ? 'warning' : 'poor';
    } else {
      return value >= threshold ? 'good' : value >= threshold * 0.7 ? 'warning' : 'poor';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'poor':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Overall Performance Score
          </CardTitle>
          <CardDescription>
            Based on Core Web Vitals and memory usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{performanceScore.toFixed(0)}/100</span>
              <Badge 
                variant={meetsCoreWebVitals ? 'default' : 'destructive'}
                className={meetsCoreWebVitals ? 'bg-green-100 text-green-800' : ''}
              >
                {meetsCoreWebVitals ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
            <Progress value={performanceScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Core Web Vitals
          </CardTitle>
          <CardDescription>
            Google's key metrics for web performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FCP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">First Contentful Paint</span>
                {getStatusIcon(getMetricStatus(metrics.fcp, 1800))}
              </div>
              <div className="text-2xl font-bold">{formatTime(metrics.fcp)}</div>
              <Badge className={getStatusColor(getMetricStatus(metrics.fcp, 1800))}>
                {getMetricStatus(metrics.fcp, 1800) === 'good' ? 'Good' : 
                 getMetricStatus(metrics.fcp, 1800) === 'warning' ? 'Needs Improvement' : 'Poor'}
              </Badge>
            </div>

            {/* LCP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Largest Contentful Paint</span>
                {getStatusIcon(getMetricStatus(metrics.lcp, 2500))}
              </div>
              <div className="text-2xl font-bold">{formatTime(metrics.lcp)}</div>
              <Badge className={getStatusColor(getMetricStatus(metrics.lcp, 2500))}>
                {getMetricStatus(metrics.lcp, 2500) === 'good' ? 'Good' : 
                 getMetricStatus(metrics.lcp, 2500) === 'warning' ? 'Needs Improvement' : 'Poor'}
              </Badge>
            </div>

            {/* FID */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">First Input Delay</span>
                {getStatusIcon(getMetricStatus(metrics.fid, 100))}
              </div>
              <div className="text-2xl font-bold">{formatTime(metrics.fid)}</div>
              <Badge className={getStatusColor(getMetricStatus(metrics.fid, 100))}>
                {getMetricStatus(metrics.fid, 100) === 'good' ? 'Good' : 
                 getMetricStatus(metrics.fid, 100) === 'warning' ? 'Needs Improvement' : 'Poor'}
              </Badge>
            </div>

            {/* CLS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cumulative Layout Shift</span>
                {getStatusIcon(getMetricStatus(metrics.cls, 0.1, 'higher'))}
              </div>
              <div className="text-2xl font-bold">{metrics.cls?.toFixed(3) || 'N/A'}</div>
              <Badge className={getStatusColor(getMetricStatus(metrics.cls, 0.1, 'higher'))}>
                {getMetricStatus(metrics.cls, 0.1, 'higher') === 'good' ? 'Good' : 
                 getMetricStatus(metrics.cls, 0.1, 'higher') === 'warning' ? 'Needs Improvement' : 'Poor'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Additional Metrics
          </CardTitle>
          <CardDescription>
            Network and memory performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TTFB */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Time to First Byte</span>
              </div>
              <div className="text-2xl font-bold">{formatTime(metrics.ttfb)}</div>
              <div className="text-xs text-muted-foreground">
                Server response time
              </div>
            </div>

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Memory className="h-4 w-4" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <div className="text-2xl font-bold">
                {metrics.memory?.usage ? `${(metrics.memory.usage * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatMemory(metrics.memory?.used)} / {formatMemory(metrics.memory?.limit)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
