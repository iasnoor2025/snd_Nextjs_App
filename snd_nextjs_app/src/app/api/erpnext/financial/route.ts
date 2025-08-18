import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { ERPNextFinancialService } from '@/lib/services/erpnext-financial-service';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to financial data
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(_request.url);
    const type = searchParams.get('type') || 'metrics';

    let data: any = {};

    switch (type) {
      case 'metrics':
        data = await ERPNextFinancialService.getFinancialMetrics();
        break;
      case 'summary':
        data = await ERPNextFinancialService.getInvoiceSummary();
        break;
      case 'invoice-summary':
        data = await ERPNextFinancialService.getInvoiceSummary();
        break;
      case 'overview':
        const month = searchParams.get('month');
        data = await ERPNextFinancialService.getFinancialOverview(month || undefined);
        break;
      case 'trends':
        const months = parseInt(searchParams.get('months') || '6');
        data = await ERPNextFinancialService.getMonthlyTrends(months);
        break;
      default:
        data = await ERPNextFinancialService.getFinancialMetrics();
    }

    return NextResponse.json({
      success: true,
      data,
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching ERPNext financial data:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch financial data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
