import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextClient = new ERPNextClient();
    
    console.log('🧪 Testing makeRequest method directly...');
    
    // Get a sample employee
    const existingEmployees = await erpnextClient.makeRequest('/api/resource/Employee?limit_page_length=1');
    
    if (!existingEmployees.data || existingEmployees.data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No existing employees found to test with'
      });
    }

    const testEmployee = existingEmployees.data[0];
    console.log('📋 Testing with employee:', testEmployee.name);
    
    // Test simple update with makeRequest directly
    console.log('🔍 Testing makeRequest directly...');
    try {
      const updateResult = await erpnextClient.makeRequest(
        `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
        { 
          method: 'PUT', 
          body: JSON.stringify({ 
            first_name: testEmployee.first_name,
            last_name: testEmployee.last_name
          }) 
        }
      );
      console.log('✅ makeRequest result:', updateResult);
      
      return NextResponse.json({
        success: true,
        message: 'makeRequest test completed',
        employeeId: testEmployee.name,
        updateResult: updateResult
      });
      
    } catch (error) {
      console.error('❌ makeRequest failed:', error);
      return NextResponse.json({
        success: false,
        message: 'makeRequest failed: ' + (error as Error).message,
        error: error
      });
    }
    
  } catch (error) {
    console.error('💥 Error during makeRequest test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing makeRequest: ' + (error as Error).message,
        error: error
      },
      { status: 500 }
    );
  }
}
