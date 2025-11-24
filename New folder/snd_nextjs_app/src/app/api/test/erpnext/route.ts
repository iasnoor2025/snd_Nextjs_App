import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    console.log('Testing ERPNext connection...');
    
    // Test ERPNext connection
    const isConnected = await ERPNextInvoiceService.testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'ERPNext connection successful',
        data: {
          connected: true,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'ERPNext connection failed',
        data: {
          connected: false,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('ERPNext connection test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ERPNext connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: {
          connected: false,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}
