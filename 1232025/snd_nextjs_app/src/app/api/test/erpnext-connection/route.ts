import { NextRequest, NextResponse } from 'next/server';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';

export async function GET(request: NextRequest) {
  try {
    // Test ERPNext connection by trying to fetch a simple resource
    const testResponse = await ERPNextInvoiceService.getInvoice('ACC-SINV-2025-00001');
    
    return NextResponse.json({
      success: true,
      message: 'ERPNext connection is working',
      testData: testResponse ? 'Invoice found' : 'Invoice not found'
    });
  } catch (error: any) {
    console.error('ERPNext connection test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'ERPNext connection failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
