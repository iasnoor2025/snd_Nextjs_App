import { ERPNextFinancialService } from '@/lib/services/erpnext-financial-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testType = searchParams.get('type') || 'basic';

    console.log('🧪 Testing financial data with type:', testType);

    let result: any = {};

    switch (testType) {
      case 'basic':
        // Test basic connection and simple data
        try {
          const accountsEndpoint =
            '/api/resource/Account?limit_page_length=5&fields=["name","account_name","account_type","root_type"]';
          const accountsData = await ERPNextFinancialService.makeERPNextRequest(accountsEndpoint);
          result.accounts = {
            count: accountsData?.data?.length || 0,
            sample: accountsData?.data?.slice(0, 3) || [],
          };
        } catch (error) {
          result.accounts = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
        break;

      case 'invoices':
        // Test invoice data
        try {
          const salesEndpoint =
            '/api/resource/Sales Invoice?limit_page_length=5&fields=["name","grand_total","posting_date","status"]';
          const salesData = await ERPNextFinancialService.makeERPNextRequest(salesEndpoint);
          result.salesInvoices = {
            count: salesData?.data?.length || 0,
            sample: salesData?.data?.slice(0, 3) || [],
          };

          const purchaseEndpoint =
            '/api/resource/Purchase Invoice?limit_page_length=5&fields=["name","grand_total","posting_date","status"]';
          const purchaseData = await ERPNextFinancialService.makeERPNextRequest(purchaseEndpoint);
          result.purchaseInvoices = {
            count: purchaseData?.data?.length || 0,
            sample: purchaseData?.data?.slice(0, 3) || [],
          };
        } catch (error) {
          result.invoices = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
        break;

      case 'gl':
        // Test GL entries
        try {
          const today = new Date();
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

          const glEndpoint = `/api/resource/GL Entry?filters=[["posting_date","between",["${lastMonth.toISOString().split('T')[0]}","${lastMonthEnd.toISOString().split('T')[0]}"]]]&fields=["account","debit","credit","posting_date"]&limit_page_length=10`;
          const glData = await ERPNextFinancialService.makeERPNextRequest(glEndpoint);

          result.glEntries = {
            count: glData?.data?.length || 0,
            sample: glData?.data?.slice(0, 3) || [],
            dateRange: {
              start: lastMonth.toISOString().split('T')[0],
              end: lastMonthEnd.toISOString().split('T')[0],
            },
          };
        } catch (error) {
          result.glEntries = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
        break;

      case 'overview':
        // Test the actual financial overview
        try {
          const overview = await ERPNextFinancialService.getFinancialOverview();
          result.overview = overview;
        } catch (error) {
          result.overview = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
        break;

      default:
        result.error = 'Invalid test type';
    }

    return NextResponse.json({
      success: true,
      testType,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error('❌ Financial test failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Financial test failed',
      },
      { status: 500 }
    );
  }
}
