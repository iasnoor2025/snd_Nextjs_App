"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"

interface AccountSummary {
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  parentAccount?: string;
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

export function FinancialOverviewSection() {
  const { t } = useI18n()
  const [financialOverview, setFinancialOverview] = useState<FinancialOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  // Generate last 12 months for dropdown
  const generateMonthOptions = () => {
    const months = []
    const today = new Date()
    
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthName = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      const monthValue = monthDate.toISOString().slice(0, 7) // YYYY-MM format
      months.push({ label: monthName, value: monthValue })
    }
    
    return months
  }

  const monthOptions = generateMonthOptions()

  const fetchFinancialOverview = async (month?: string) => {
    try {
      setLoading(true)
      setError(null)

      const monthParam = month || selectedMonth || monthOptions[0]?.value
      console.log('🔍 Fetching financial overview for month:', monthParam)
      
      const response = await fetch(`/api/erpnext/financial?type=overview&month=${monthParam}`)
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Financial overview data received:', data)
        setFinancialOverview(data.data)
        if (month) {
          setSelectedMonth(month)
        }
      } else {
        const errorText = await response.text()
        console.error('❌ API error response:', errorText)
        throw new Error(`Failed to fetch financial overview: ${response.status}`)
      }
    } catch (err) {
      console.error('❌ Error fetching financial overview:', err)
      setError(t('financial.failedToFetch') || 'Failed to fetch financial data')
    } finally {
      setLoading(false)
    }
  }

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    fetchFinancialOverview(month)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchFinancialOverview()
    setRefreshing(false)
  }

  useEffect(() => {
    if (monthOptions.length > 0) {
      setSelectedMonth(monthOptions[0].value)
      fetchFinancialOverview(monthOptions[0].value)
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return `SAR ${amount.toLocaleString()}`
  }

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

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
    )
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
    )
  }

  if (!financialOverview) {
    return null
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
            {t('financial.comprehensiveDescription') || 'Complete financial data from ERPNext including income, expenses, and profit/loss'}
          </p>
        </div>
        <div className="flex items-center gap-4">
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
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? (t('financial.refreshing') || 'Refreshing...') : (t('financial.refresh') || 'Refresh')}
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
        <Card className={`border-2 ${
          financialOverview.netProfitLoss >= 0 
            ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800' 
            : 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${
              financialOverview.netProfitLoss >= 0 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
            }`}>
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
                <div className={`text-2xl font-bold ${
                  financialOverview.netProfitLoss >= 0 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {formatCurrency(Math.abs(financialOverview.netProfitLoss))}
                </div>
                <p className={`text-xs ${
                  financialOverview.netProfitLoss >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {financialOverview.netProfitLoss >= 0 ? (t('financial.profit') || 'Profit') : (t('financial.loss') || 'Loss')}
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
            {t('financial.detailedDescription') || 'Comprehensive breakdown of income, expenses, and account details for'} {monthOptions.find(m => m.value === selectedMonth)?.label || 'Selected Month'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">{t('financial.overview') || 'Overview'}</TabsTrigger>
              <TabsTrigger value="income">{t('financial.income') || 'Income'}</TabsTrigger>
              <TabsTrigger value="expenses">{t('financial.expenses') || 'Expenses'}</TabsTrigger>
              <TabsTrigger value="accounts">{t('financial.accounts') || 'Accounts'}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Month vs Previous Month */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{monthOptions.find(m => m.value === selectedMonth)?.label || 'Selected Month'}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span className="text-green-700 dark:text-green-300">{t('financial.income') || 'Income'}</span>
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        {formatCurrency(financialOverview.monthlyComparison.currentMonth.income)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <span className="text-red-700 dark:text-red-300">{t('financial.expenses') || 'Expenses'}</span>
                      <span className="font-semibold text-red-700 dark:text-red-300">
                        {formatCurrency(financialOverview.monthlyComparison.currentMonth.expenses)}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      financialOverview.monthlyComparison.currentMonth.profitLoss >= 0
                        ? 'bg-green-50 dark:bg-green-950'
                        : 'bg-red-50 dark:bg-red-950'
                    }`}>
                      <span className={financialOverview.monthlyComparison.currentMonth.profitLoss >= 0
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                      }>{t('financial.netResult') || 'Net Result'}</span>
                      <span className={`font-semibold ${
                        financialOverview.monthlyComparison.currentMonth.profitLoss >= 0
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {formatCurrency(Math.abs(financialOverview.monthlyComparison.currentMonth.profitLoss))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('financial.previousMonth') || 'Previous Month'}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span className="text-green-700 dark:text-green-300">{t('financial.income') || 'Income'}</span>
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        {formatCurrency(financialOverview.monthlyComparison.previousMonth.income)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <span className="text-red-700 dark:text-red-300">{t('financial.expenses') || 'Expenses'}</span>
                      <span className="font-semibold text-red-700 dark:text-red-300">
                        {formatCurrency(financialOverview.monthlyComparison.previousMonth.expenses)}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      financialOverview.monthlyComparison.previousMonth.profitLoss >= 0
                        ? 'bg-green-50 dark:bg-green-950'
                        : 'bg-red-50 dark:bg-red-950'
                    }`}>
                      <span className={financialOverview.monthlyComparison.previousMonth.profitLoss >= 0
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                      }>{t('financial.netResult') || 'Net Result'}</span>
                      <span className={`font-semibold ${
                        financialOverview.monthlyComparison.previousMonth.profitLoss >= 0
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {formatCurrency(Math.abs(financialOverview.monthlyComparison.previousMonth.profitLoss))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Month-over-Month Changes */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">{t('financial.monthOverMonth') || 'Month-over-Month Changes'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('financial.income') || 'Income'}</span>
                      {getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.income,
                        financialOverview.monthlyComparison.previousMonth.income
                      ) >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className={`text-lg font-bold ${
                      getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.income,
                        financialOverview.monthlyComparison.previousMonth.income
                      ) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.income,
                        financialOverview.monthlyComparison.previousMonth.income
                      ).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('financial.expenses') || 'Expenses'}</span>
                      {getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.expenses,
                        financialOverview.monthlyComparison.previousMonth.expenses
                      ) >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className={`text-lg font-bold ${
                      getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.expenses,
                        financialOverview.monthlyComparison.previousMonth.expenses
                      ) >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.expenses,
                        financialOverview.monthlyComparison.previousMonth.expenses
                      ).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('financial.profitLoss') || 'Profit/Loss'}</span>
                      {getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.profitLoss,
                        financialOverview.monthlyComparison.previousMonth.profitLoss
                      ) >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className={`text-lg font-bold ${
                      getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.profitLoss,
                        financialOverview.monthlyComparison.previousMonth.profitLoss
                      ) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {getPercentageChange(
                        financialOverview.monthlyComparison.currentMonth.profitLoss,
                        financialOverview.monthlyComparison.previousMonth.profitLoss
                      ).toFixed(1)}%
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
                      <th className="text-left p-2">{t('financial.accountName') || 'Account Name'}</th>
                      <th className="text-left p-2">{t('financial.accountType') || 'Account Type'}</th>
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
                      <th className="text-left p-2">{t('financial.accountName') || 'Account Name'}</th>
                      <th className="text-left p-2">{t('financial.accountType') || 'Account Type'}</th>
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
                      <th className="text-left p-2">{t('financial.accountName') || 'Account Name'}</th>
                      <th className="text-left p-2">{t('financial.accountType') || 'Account Type'}</th>
                      <th className="text-left p-2">{t('financial.parentAccount') || 'Parent Account'}</th>
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
                        <td className={`p-2 text-right font-semibold ${
                          account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(Math.abs(account.balance))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {t('financial.lastUpdated') || 'Last Updated'}: {new Date(financialOverview.lastUpdated).toLocaleString()}
      </div>
    </div>
  )
}
