import { NextRequest, NextResponse } from 'next/server';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing ERPNext connection for invoice generation...');
    
    // Test basic connection
    const connectionTest = await ERPNextInvoiceService.testConnection();
    
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        message: 'ERPNext connection test failed',
        details: 'Could not establish connection to ERPNext'
      }, { status: 500 });
    }

    // Get available accounts and items for debugging
    const availableAccounts = await ERPNextInvoiceService.getAvailableAccounts();
    const availableItems = await ERPNextInvoiceService.getAvailableItems();
    const taxTemplates = await ERPNextInvoiceService.discoverTaxTemplates();

    // Test with sample data using the discovered tax template
    const sampleRental = {
      id: 999,
      customerName: 'Test Customer',
      customerId: 999,
      totalAmount: 1000,
      taxAmount: 150,
      discount: 0,
      paymentTermsDays: 30,
      rentalNumber: 'TEST-001',
      status: 'active'
    };

    console.log('📋 Testing with sample rental data...');
    
    try {
      const invoiceResponse = await ERPNextInvoiceService.createRentalInvoice(sampleRental, 'TEST-INV-001');
      console.log('✅ Test invoice creation successful:', invoiceResponse);
      
      return NextResponse.json({
        success: true,
        message: 'ERPNext connection and invoice creation test successful',
        data: {
          connection: 'OK',
          invoiceCreation: 'SUCCESS',
          invoiceId: invoiceResponse.data?.name || 'TEST-INV-001',
          availableAccounts: availableAccounts.slice(0, 10),
          totalAccounts: availableAccounts.length,
          availableItems: availableItems.slice(0, 10),
          totalItems: availableItems.length,
          taxTemplates: taxTemplates
        },
        troubleshooting: {
          message: 'Invoice creation successful! The system is working correctly.',
          suggestion: 'You can now use this in your rental invoice generation.',
          nextSteps: [
            'Test with actual rental data',
            'Verify invoice appears in ERPNext',
            'Check PDF generation if needed'
          ]
        }
      });
    } catch (invoiceError) {
      console.error('❌ Test invoice creation failed:', invoiceError);
      
      return NextResponse.json({
        success: false,
        message: 'ERPNext connection OK but invoice creation failed',
        details: invoiceError instanceof Error ? invoiceError.message : 'Unknown error',
        connection: 'OK',
        invoiceCreation: 'FAILED',
        availableItems: availableItems.slice(0, 10),
        totalItems: availableItems.length,
        availableAccounts: availableAccounts.slice(0, 10),
        totalAccounts: availableAccounts.length,
        taxTemplates: taxTemplates,
        troubleshooting: {
          message: 'The invoice creation failed, but we can see available items and accounts above.',
          suggestion: 'Check if the item codes and income accounts used in the invoice exist in ERPNext.',
          nextSteps: [
            'Review the availableItems array above',
            'Review the availableAccounts array above',
            'Ensure item codes match existing ERPNext items',
            'Ensure income accounts match existing ERPNext accounts',
            'Create missing items or accounts in ERPNext if needed'
          ]
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ ERPNext connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'ERPNext connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      connection: 'FAILED'
    }, { status: 500 });
  }
}
