import { ERPNextFinancialService } from '@/lib/services/erpnext-financial-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    console.log('🧪 Testing ERPNext connection and data availability...');

    // Test basic connection
    const testEndpoint = '/api/resource/Account?limit_page_length=1&fields=["name"]';
    let connectionTest;
    try {
      connectionTest = await ERPNextFinancialService.makeERPNextRequest(testEndpoint);
    } catch (error) {
      connectionTest = { error: error instanceof Error ? error.message : 'Connection failed' };
    }

    // Test data availability
    const dataTest = await ERPNextFinancialService.testERPNextData();

    // Test financial overview for current month
    let financialOverview;
    try {
      financialOverview = await ERPNextFinancialService.getFinancialOverview();
    } catch (error) {
      financialOverview = {
        error: error instanceof Error ? error.message : 'Financial overview failed',
      };
    }

    return NextResponse.json({
      success: true,
      message: 'ERPNext comprehensive test completed',
      timestamp: new Date().toISOString(),
      tests: {
        connection: connectionTest,
        dataAvailability: dataTest,
        financialOverview: financialOverview,
      },
    });
  } catch (error) {
    console.error('❌ ERPNext comprehensive test failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'ERPNext comprehensive test failed',
      },
      { status: 500 }
    );
  }
}
