'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';
import { AlertTriangle, DollarSign, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FinancialMetrics {
  totalMoneyReceived: number;
  totalMoneyLost: number;
  monthlyMoneyReceived: number;
  monthlyMoneyLost: number;
  netProfit: number;
  currency: string;
  lastUpdated: string;
}

interface InvoiceSummary {
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  count: number;
}

export function FinancialMetricsSection() {
  const { t } = useI18n();
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch financial metrics
      const metricsResponse = await fetch('/api/erpnext/financial?type=metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setFinancialMetrics(metricsData.data);
      }

      // Fetch invoice summary
      const summaryResponse = await fetch('/api/erpnext/financial?type=summary');
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setInvoiceSummary(summaryData.data);
      }
    } catch (err) {
      setError(t('financial.failedToFetch'));
      console.error('Error fetching financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFinancialData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('financial.metrics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('financial.metrics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchFinancialData} variant="outline">
              {t('financial.tryAgain')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('financial.overview')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{t('financial.description')}</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? t('financial.refreshing') : t('financial.refresh')}
        </Button>
      </div>

      {/* Financial Metrics Cards */}
      {financialMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Money Received */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                {t('financial.totalMoneyReceived')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {financialMetrics.currency}{' '}
                    {financialMetrics.totalMoneyReceived.toLocaleString()}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {t('financial.allTime')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Money Lost */}
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                {t('financial.totalMoneyLost')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {financialMetrics.currency} {financialMetrics.totalMoneyLost.toLocaleString()}
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400">{t('financial.allTime')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Money Received */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {t('financial.thisMonthReceived')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {financialMetrics.currency}{' '}
                    {financialMetrics.monthlyMoneyReceived.toLocaleString()}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {t('financial.currentMonth')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card
            className={`border-2 ${
              financialMetrics.netProfit >= 0
                ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'
                : 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800'
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle
                className={`text-sm font-medium ${
                  financialMetrics.netProfit >= 0
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                {t('financial.netProfit')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {financialMetrics.netProfit >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <div
                    className={`text-2xl font-bold ${
                      financialMetrics.netProfit >= 0
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}
                  >
                    {financialMetrics.currency} {financialMetrics.netProfit.toLocaleString()}
                  </div>
                  <p
                    className={`text-xs ${
                      financialMetrics.netProfit >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {financialMetrics.netProfit >= 0 ? t('financial.profit') : t('financial.loss')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoice Summary */}
      {invoiceSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('financial.invoiceSummary')}
            </CardTitle>
            <CardDescription>{t('financial.invoiceSummaryDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {invoiceSummary.count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('financial.totalInvoices')}
                </div>
              </div>

              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {financialMetrics?.currency} {invoiceSummary.paidAmount.toLocaleString()}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {t('financial.paidAmount')}
                </div>
              </div>

              <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {financialMetrics?.currency} {invoiceSummary.outstandingAmount.toLocaleString()}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  {t('financial.outstanding')}
                </div>
              </div>

              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {financialMetrics?.currency} {invoiceSummary.overdueAmount.toLocaleString()}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  {t('financial.overdue')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      {financialMetrics && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t('financial.lastUpdated')}: {new Date(financialMetrics.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
