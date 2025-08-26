import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextClient = new ERPNextClient();
    
    console.log('🧪 Testing ERPNext rename functionality...');
    
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
    console.log('📋 Current employee_number:', testEmployee.employee_number);
    
    // Test the rename functionality
    const newEmployeeNumber = 'RENAME_TEST_' + Date.now();
    
    try {
      console.log('🔍 Attempting to rename employee to:', newEmployeeNumber);
      
      const renameResult = await erpnextClient.renameEmployee(testEmployee.name, newEmployeeNumber);
      
      console.log('✅ Rename result:', renameResult);
      
      if (renameResult) {
        // Check if the rename worked
        const renamedEmployee = await erpnextClient.getCurrentEmployee(newEmployeeNumber);
        
        const testResult = {
          success: true,
          original: {
            name: testEmployee.name,
            employee_number: testEmployee.employee_number
          },
          new: {
            name: newEmployeeNumber,
            employee_number: newEmployeeNumber
          },
          result: {
            name: renamedEmployee.data.name,
            employee_number: renamedEmployee.data.employee_number,
            wasRenamed: renamedEmployee.data.name === newEmployeeNumber
          },
          renameResult: renameResult,
          currentState: renamedEmployee.data
        };
        
        console.log('🔍 Test result:', testResult);
        
        // Rename back to original
        console.log('🔄 Renaming back to original...');
        const renameBackResult = await erpnextClient.renameEmployee(newEmployeeNumber, testEmployee.name);
        console.log('🔄 Rename back result:', renameBackResult);
        
        return NextResponse.json({
          success: true,
          message: 'Rename functionality test completed successfully',
          employeeId: testEmployee.name,
          testResult: testResult,
          restored: renameBackResult
        });
        
      } else {
        return NextResponse.json({
          success: false,
          message: 'Rename functionality test failed',
          error: 'Rename operation returned false'
        });
      }
      
    } catch (error) {
      console.error('❌ Rename functionality test failed:', error);
      
      return NextResponse.json({
        success: false,
        message: 'Rename functionality test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        error: error
      });
    }

  } catch (error) {
    console.error('💥 Error during rename functionality test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing rename functionality: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
