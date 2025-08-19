'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/hooks/use-i18n';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  PieChart,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface AccountSummary {
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  parentAccount?: string;
}

interface InvoiceSummary {
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  count: number;
}

interface FinancialOverview {
  totalIncome: number;
  totalExpenses: number;
  netProfitLoss: number;
  currency: string;
  lastUpdated: string;
  accountBreakdown: AccountSummary[];
  incomeBreakdown: AccountSummary[];
  expenseBreakdown: AccountSummary[];
  monthlyComparison: {
    currentMonth: {
      income: number;
      expenses: number;
      profitLoss: number;
    };
    previousMonth: {
      income: number;
      expenses: number;
      profitLoss: number;
    };
  };
}

interface FinancialOverviewSectionProps {
  onHideSection: () => void;
}

export function FinancialOverviewSection({ onHideSection }: FinancialOverviewSectionProps) {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const [financialOverview, setFinancialOverview] = useState<FinancialOverview | null>(null);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Debug session info

  // Wait for session to be loaded
  if (status === 'loading') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('financial.comprehensiveOverview') || 'Comprehensive Financial Overview'}
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

  // Check if user is authenticated
  if (status === 'unauthenticated' || !session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('financial.comprehensiveOverview') || 'Comprehensive Financial Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">
              {t('financial.notAuthenticated') || 'Please sign in to view financial data'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate last 12 months for dropdown
  const generateMonthOptions = () => {
    const months = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const monthValue = monthDate.toISOString().slice(0, 7); // YYYY-MM format
      months.push({ label: monthName, value: monthValue });
    }

    return months;
  };

  const monthOptions = generateMonthOptions();

  const fetchFinancialOverview = async (month?: string) => {
    try {
      setLoading(true);
      setError(null);

      const monthParam = month || selectedMonth || monthOptions[0]?.value;

      const response = await fetch(`/api/erpnext/financial?type=overview&month=${monthParam}`);

      if (response.ok) {
        const data = await response.json();
        
        setFinancialOverview(data.data);
        if (month) {
          setSelectedMonth(month);
        }
      } else {
        const errorText = await response.text();
        
        throw new Error(`Failed to fetch financial overview: ${response.status}`);
      }
    } catch (err) {
      
      setError(t('financial.failedToFetch') || 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceSummary = async () => {
    try {
      
      // Fetch all invoices without monthly filtering
      const response = await fetch('/api/erpnext/financial?type=invoice-summary');

      if (response.ok) {
        const data = await response.json();
        
        setInvoiceSummary(data.data);
      } else {
        const errorText = await response.text();
        
        // Try to get more details about the error
        if (response.status === 401) {
          
        } else if (response.status === 403) {
          
        }
      }
    } catch (err) {
      
    }
  };

  const handleMonthChange = (month: string) => {
    if (!session) return;

    setSelectedMonth(month);
    fetchFinancialOverview(month);
  };

  const handleRefresh = async () => {
    if (!session) return;

    setRefreshing(true);
    await Promise.all([fetchFinancialOverview(), fetchInvoiceSummary()]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (monthOptions.length > 0 && session) {
      setSelectedMonth(monthOptions[0].value);
      fetchFinancialOverview(monthOptions[0].value);
      fetchInvoiceSummary();
    }
  }, [session]);

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'SAR 0';
    }
    return `SAR ${amount.toLocaleString()}`;
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('financial.comprehensiveOverview') || 'Comprehensive Financial Overview'}
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
            <BarChart3 className="h-5 w-5" />
            {t('financial.comprehensiveOverview') || 'Comprehensive Financial Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchFinancialOverview()} variant="outline">
              {t('financial.tryAgain') || 'Try Again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!financialOverview) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with month selector and refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('financial.comprehensiveOverview') || 'Comprehensive Financial Overview'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('financial.comprehensiveDescription') ||
              'Complete financial data from ERPNext including income, expenses, and profit/loss'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onHideSection}
            className="flex items-center gap-2"
          >
            {t('dashboard.hideSection')}
          </Button>
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('financial.selectMonth') || 'Select Month'}:
            </label>
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing
              ? t('financial.refreshing') || 'Refreshing...'
              : t('financial.refresh') || 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Main Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              {t('financial.totalIncome') || 'Total Income'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(financialOverview.totalIncome)}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {monthOptions.find(m => m.value === selectedMonth)?.label || 'Selected Month'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
              {t('financial.totalExpenses') || 'Total Expenses'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(financialOverview.totalExpenses)}
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {monthOptions.find(m => m.value === selectedMonth)?.label || 'Selected Month'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit/Loss */}
        <Card
          className={`border-2 ${
            financialOverview.netProfitLoss >= 0
              ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'
              : 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800'
          }`}
        >
          <CardHeader className="pb-3">
            <CardTitle
              className={`text-sm font-medium ${
                financialOverview.netProfitLoss >= 0
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}
            >
              {t('financial.netProfitLoss') || 'Net Profit/Loss'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {financialOverview.netProfitLoss >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
              <div>
                <div
                  className={`text-2xl font-bold ${
                    financialOverview.netProfitLoss >= 0
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {formatCurrency(Math.abs(financialOverview.netProfitLoss))}
                </div>
                <p
                  className={`text-xs ${
                    financialOverview.netProfitLoss >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {financialOverview.netProfitLoss >= 0
                    ? t('financial.profit') || 'Profit'
                    : t('financial.loss') || 'Loss'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Comparison */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {t('financial.monthlyComparison') || 'Monthly Comparison'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(financialOverview.monthlyComparison.currentMonth.profitLoss)}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  vs {formatCurrency(financialOverview.monthlyComparison.previousMonth.profitLoss)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Financial Data Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            {t('financial.detailedBreakdown') || 'Detailed Financial Breakdown'}
          </CardTitle>
          <CardDescription>
            {t('financial.detailedDescription') ||
              'Comprehensive breakdown of income, expenses, and account details for'}{' '}
            {monthOptions.find(m => m.value === selectedMonth)?.label || 'Selected Month'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">{t('financial.overview') || 'Overview'}</TabsTrigger>
              <TabsTrigger value="income">{t('financial.income') || 'Income'}</TabsTrigger>
              <TabsTrigger value="expenses">{t('financial.expenses') || 'Expenses'}</TabsTrigger>
              <TabsTrigger value="accounts">{t('financial.accounts') || 'Accounts'}</TabsTrigger>
              <TabsTrigger value="invoices">{t('financial.invoices') || 'Invoices'}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Month vs Previous Month */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {monthOptions.find(m => m.value === selectedMonth)?.label || 'Selected Month'}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span className="text-green-700 dark:text-green-300">
                        {t('financial.income') || 'Income'}
                      </span>
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        {formatCurrency(financialOverview.monthlyComparison.currentMonth.income)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <span className="text-red-700 dark:text-red-300">
                        {t('financial.expenses') || 'Expenses'}
                      </span>
                      <span className="font-semibold text-red-700 dark:text-red-300">
                        {formatCurrency(financialOverview.monthlyComparison.currentMonth.expenses)}
                      </span>
                    </div>
                    <div
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        financialOverview.monthlyComparison.currentMonth.profitLoss >= 0
                          ? 'bg-green-50 dark:bg-green-950'
                          : 'bg-red-50 dark:bg-red-950'
                      }`}
                    >
                      <span
                        className={
                          financialOverview.monthlyComparison.currentMonth.profitLoss >= 0
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        }
                      >
                        {t('financial.netResult') || 'Net Result'}
                      </span>
                      <span
                        className={`font-semibold ${
                          financialOverview.monthlyComparison.currentMonth.profitLoss >= 0
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        }`}
                      >
                        {formatCurrency(
                          Math.abs(financialOverview.monthlyComparison.currentMonth.profitLoss)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {t('financial.previousMonth') || 'Previous Month'}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span className="text-green-700 dark:text-green-300">
                        {t('financial.income') || 'Income'}
                      </span>
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        {formatCurrency(financialOverview.monthlyComparison.previousMonth.income)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <span className="text-red-700 dark:text-red-300">
                        {t('financial.expenses') || 'Expenses'}
                      </span>
                      <span className="font-semibold text-red-700 dark:text-red-300">
                        {formatCurrency(financialOverview.monthlyComparison.previousMonth.expenses)}
                      </span>
                    </div>
                    <div
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        financialOverview.monthlyComparison.previousMonth.profitLoss >= 0
                          ? 'bg-green-50 dark:bg-green-950'
                          : 'bg-red-50 dark:bg-red-950'
                      }`}
                    >
                      <span
                        className={
                          financialOverview.monthlyComparison.previousMonth.profitLoss >= 0
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        }
                      >
                        {t('financial.netResult') || 'Net Result'}
                      </span>
                      <span
                        className={`font-semibold ${
                          financialOverview.monthlyComparison.previousMonth.profitLoss >= 0
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        }`}
                      >
                        {formatCurrency(
                          Math.abs(financialOverview.monthlyComparison.previousMonth.profitLoss)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Month-over-Month Changes */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('financial.monthOverMonth') || 'Month-over-Month Changes'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('financial.income') || 'Income'}
                      </span>
                      {getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.income,
                        financialOverview.monthlyComparison.previousMonth.income
                      ) >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        getPercentageChange(
                          financialOverview.monthlyComparison.currentMonth.income,
                          financialOverview.monthlyComparison.previousMonth.income
                        ) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.income,
                        financialOverview.monthlyComparison.previousMonth.income
                      ).toFixed(1)}
                      %
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('financial.expenses') || 'Expenses'}
                      </span>
                      {getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.expenses,
                        financialOverview.monthlyComparison.previousMonth.expenses
                      ) >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        getPercentageChange(
                          financialOverview.monthlyComparison.currentMonth.expenses,
                          financialOverview.monthlyComparison.previousMonth.expenses
                        ) >= 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.expenses,
                        financialOverview.monthlyComparison.previousMonth.expenses
                      ).toFixed(1)}
                      %
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('financial.profitLoss') || 'Profit/Loss'}
                      </span>
                      {getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.profitLoss,
                        financialOverview.monthlyComparison.previousMonth.profitLoss
                      ) >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        getPercentageChange(
                          financialOverview.monthlyComparison.currentMonth.profitLoss,
                          financialOverview.monthlyComparison.previousMonth.profitLoss
                        ) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.profitLoss,
                        financialOverview.monthlyComparison.previousMonth.profitLoss
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Income Tab */}
            <TabsContent value="income" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">
                        {t('financial.accountName') || 'Account Name'}
                      </th>
                      <th className="text-left p-2">
                        {t('financial.accountType') || 'Account Type'}
                      </th>
                      <th className="text-right p-2">{t('financial.balance') || 'Balance'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialOverview.incomeBreakdown.map((account, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2">{account.accountName}</td>
                        <td className="p-2">
                          <Badge variant="secondary">{account.accountType}</Badge>
                        </td>
                        <td className="p-2 text-right font-semibold text-green-600">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">
                        {t('financial.accountName') || 'Account Name'}
                      </th>
                      <th className="text-left p-2">
                        {t('financial.accountType') || 'Account Type'}
                      </th>
                      <th className="text-right p-2">{t('financial.balance') || 'Balance'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialOverview.expenseBreakdown.map((account, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2">{account.accountName}</td>
                        <td className="p-2">
                          <Badge variant="secondary">{account.accountType}</Badge>
                        </td>
                        <td className="p-2 text-right font-semibold text-red-600">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">
                        {t('financial.accountName') || 'Account Name'}
                      </th>
                      <th className="text-left p-2">
                        {t('financial.accountType') || 'Account Type'}
                      </th>
                      <th className="text-left p-2">
                        {t('financial.parentAccount') || 'Parent Account'}
                      </th>
                      <th className="text-right p-2">{t('financial.balance') || 'Balance'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialOverview.accountBreakdown.map((account, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2">{account.accountName}</td>
                        <td className="p-2">
                          <Badge variant="secondary">{account.accountType}</Badge>
                        </td>
                        <td className="p-2 text-sm text-gray-600 dark:text-gray-400">
                          {account.parentAccount || '-'}
                        </td>
                        <td
                          className={`p-2 text-right font-semibold ${
                            account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(Math.abs(account.balance))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('financial.invoiceSummary') || 'Invoice Summary'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('financial.allTimeInvoiceData') || 'All-time invoice data from ERPNext'}
                </p>
              </div>

              {invoiceSummary ? (
                <div className="space-y-6">
                  {/* Invoice Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {t('financial.totalInvoices') || 'Total Invoices'}
                          </p>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {invoiceSummary.count}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-6 w-6 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('financial.totalAmount') || 'Total Amount'}
                          </p>
                          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                            {formatCurrency(invoiceSummary.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            {t('financial.paidAmount') || 'Paid Amount'}
                          </p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {formatCurrency(invoiceSummary.paidAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-red-700 dark:text-red-300">
                            {t('financial.overdueAmount') || 'Overdue Amount'}
                          </p>
                          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                            {formatCurrency(invoiceSummary.overdueAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">{t('financial.metric') || 'Metric'}</th>
                          <th className="text-left p-2">{t('financial.amount') || 'Amount'}</th>
                          <th className="text-left p-2">
                            {t('financial.percentage') || 'Percentage'}
                          </th>
                          <th className="text-left p-2">{t('financial.status') || 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2 font-medium">
                            {t('financial.totalAmount') || 'Total Amount'}
                          </td>
                          <td className="p-2 font-semibold">
                            {formatCurrency(invoiceSummary.totalAmount)}
                          </td>
                          <td className="p-2">100%</td>
                          <td className="p-2">
                            <Badge variant="secondary">
                              {t('financial.allInvoices') || 'All Invoices'}
                            </Badge>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2 font-medium">
                            {t('financial.paidAmount') || 'Paid Amount'}
                          </td>
                          <td className="p-2 font-semibold text-green-600">
                            {formatCurrency(invoiceSummary.paidAmount)}
                          </td>
                          <td className="p-2">
                            {invoiceSummary.totalAmount && invoiceSummary.totalAmount > 0
                              ? (
                                  ((invoiceSummary.paidAmount || 0) / invoiceSummary.totalAmount) *
                                  100
                                ).toFixed(1)
                              : '0.0'}
                            %
                          </td>
                          <td className="p-2">
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            >
                              {t('financial.paid') || 'Paid'}
                            </Badge>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2 font-medium">
                            {t('financial.outstandingAmount') || 'Outstanding Amount'}
                          </td>
                          <td className="p-2 font-semibold text-orange-600">
                            {formatCurrency(invoiceSummary.outstandingAmount)}
                          </td>
                          <td className="p-2">
                            {invoiceSummary.totalAmount && invoiceSummary.totalAmount > 0
                              ? (
                                  ((invoiceSummary.outstandingAmount || 0) /
                                    invoiceSummary.totalAmount) *
                                  100
                                ).toFixed(1)
                              : '0.0'}
                            %
                          </td>
                          <td className="p-2">
                            <Badge
                              variant="outline"
                              className="border-orange-200 text-orange-700 dark:border-orange-700 dark:text-orange-300"
                            >
                              {t('financial.outstanding') || 'Outstanding'}
                            </Badge>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2 font-medium">
                            {t('financial.overdueAmount') || 'Overdue Amount'}
                          </td>
                          <td className="p-2 font-semibold text-red-600">
                            {formatCurrency(invoiceSummary.overdueAmount)}
                          </td>
                          <td className="p-2">
                            {invoiceSummary.totalAmount && invoiceSummary.totalAmount > 0
                              ? (
                                  ((invoiceSummary.overdueAmount || 0) /
                                    invoiceSummary.totalAmount) *
                                  100
                                ).toFixed(1)
                              : '0.0'}
                            %
                          </td>
                          <td className="p-2">
                            <Badge variant="destructive">
                              {t('financial.overdue') || 'Overdue'}
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('financial.noInvoiceData') || 'No invoice data available'}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {t('financial.lastUpdated') || 'Last Updated'}:{' '}
        {new Date(financialOverview.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
