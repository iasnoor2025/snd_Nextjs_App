# Financial Features from ERPNext

This document describes the new financial features that have been added to the dashboard to display money received and lost from ERPNext.

## Overview

The financial features provide real-time insights into:
- Total money received (all time)
- Total money lost (all time)
- Monthly money received
- Monthly money lost
- Net profit/loss
- Invoice summary with outstanding amounts

## Components Added

### 1. ERPNext Financial Service (`src/lib/services/erpnext-financial-service.ts`)

A service class that handles all communication with ERPNext to fetch financial data:

- **`getFinancialMetrics()`**: Fetches overall financial metrics
- **`getInvoiceSummary()`**: Fetches invoice summary and outstanding amounts
- **`getMonthlyTrends(months)`**: Fetches monthly revenue trends

### 2. Financial Metrics Section (`src/components/dashboard/FinancialMetricsSection.tsx`)

A comprehensive dashboard component that displays:
- Financial metrics cards with color-coded indicators
- Invoice summary with breakdown of paid, outstanding, and overdue amounts
- Real-time data with refresh capability
- Error handling for when ERPNext is unavailable

### 3. Dashboard Header Updates (`src/components/dashboard/DashboardHeader.tsx`)

Updated to show:
- Monthly money received
- Monthly money lost
- Grid layout adjusted to accommodate new financial cards

### 4. Dashboard Service Updates (`src/lib/services/dashboard-service.ts`)

Enhanced to include financial metrics in the main dashboard stats:
- `totalMoneyReceived`
- `totalMoneyLost`
- `monthlyMoneyReceived`
- `monthlyMoneyLost`
- `netProfit`
- `currency`

### 5. API Endpoints

#### `/api/erpnext/financial`
- **GET** `/api/erpnext/financial?type=metrics` - Get financial metrics
- **GET** `/api/erpnext/financial?type=summary` - Get invoice summary
- **GET** `/api/erpnext/financial?type=trends&months=6` - Get monthly trends

#### `/api/test-financial`
- **GET** - Test endpoint to verify financial service functionality

## Configuration

### Environment Variables Required

```env
NEXT_PUBLIC_ERPNEXT_URL=https://your-erpnext-instance.com
NEXT_PUBLIC_ERPNEXT_API_KEY=your_api_key
NEXT_PUBLIC_ERPNEXT_API_SECRET=your_api_secret
```

### ERPNext Data Sources

The service fetches data from:
- **Sales Invoices**: For money received calculations
- **Purchase Invoices**: For money lost calculations
- **Invoice Status**: To determine paid vs outstanding amounts
- **Posting Dates**: For monthly calculations

## Features

### 1. Real-time Financial Metrics
- Displays current month's money received and lost
- Shows total historical amounts
- Calculates net profit/loss automatically

### 2. Color-coded Indicators
- **Green**: Money received and positive profit
- **Red**: Money lost and negative profit
- **Blue**: Monthly metrics
- **Yellow**: Outstanding amounts

### 3. Invoice Summary
- Total invoice count
- Paid amount
- Outstanding amount
- Overdue amount

### 4. Error Handling
- Graceful fallback when ERPNext is unavailable
- User-friendly error messages
- Retry functionality

### 5. Responsive Design
- Mobile-friendly grid layout
- Adaptive card sizing
- Dark mode support

## Usage

### For Users
1. Navigate to the main dashboard
2. View financial metrics in the header cards
3. Scroll down to see detailed financial overview
4. Use refresh button to update data
5. View invoice summary for detailed breakdown

### For Developers
1. Import `ERPNextFinancialService` for financial data
2. Use the financial API endpoints for custom implementations
3. Extend the `FinancialMetricsSection` component as needed
4. Add new financial metrics to the dashboard service

## Data Flow

```
ERPNext → ERPNextFinancialService → Dashboard Service → Dashboard Components
    ↓              ↓                      ↓                    ↓
Sales/Purchase → Financial Metrics → Dashboard Stats → Header Cards
Invoices       → Invoice Summary   → Financial Section → Detailed View
```

## Currency

The system uses **SAR (Saudi Riyal)** as the default currency, which can be configured in the ERPNext Financial Service.

## Performance Considerations

- Data is fetched on-demand to avoid unnecessary API calls
- Caching can be implemented for better performance
- Large datasets are limited to prevent timeout issues
- Error handling ensures graceful degradation

## Troubleshooting

### Common Issues

1. **"ERPNext configuration is missing"**
   - Check environment variables are set correctly
   - Verify API credentials are valid

2. **"Failed to fetch financial data"**
   - Check ERPNext instance is accessible
   - Verify API endpoints are working
   - Check network connectivity

3. **No data displayed**
   - Verify ERPNext has invoice data
   - Check API permissions
   - Review console for error messages

### Testing

Use the test endpoint to verify functionality:
```
GET /api/test-financial
```

This will test all financial service methods and return detailed results.

## Future Enhancements

Potential improvements:
- Data caching and refresh intervals
- Export functionality for financial reports
- Historical trend analysis
- Budget vs actual comparisons
- Multi-currency support
- Financial alerts and notifications
