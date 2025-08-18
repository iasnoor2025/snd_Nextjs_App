import { NextRequest, NextResponse } from 'next/server';
import { ERPNextFinancialService } from '@/lib/services/erpnext-financial-service';

export async function GET(_request: NextRequest) {
  try {
    console.log('🧪 Testing ERPNext Financial Service...');
    
    // Test financial metrics
    const metrics = await ERPNextFinancialService.getFinancialMetrics();
    console.log('✅ Financial metrics:', metrics);
    
    // Test invoice summary
    const summary = await ERPNextFinancialService.getInvoiceSummary();
    console.log('✅ Invoice summary:', summary);
    
    // Test monthly trends
    const trends = await ERPNextFinancialService.getMonthlyTrends(3);
    console.log('✅ Monthly trends:', trends);
    
    return NextResponse.json({
      success: true,
      message: 'Financial service test completed successfully',
      data: {
        metrics,
        summary,
        trends
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Financial service test failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.stack : 'No stack trace',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
