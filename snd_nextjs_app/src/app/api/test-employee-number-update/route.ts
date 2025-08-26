import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextClient = new ERPNextClient();
    
    console.log('🧪 Testing direct employee_number field update...');
    
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
    
    // Test 1: Try to update employee_number directly
    const newEmployeeNumber = 'TEST_' + Date.now();
    
    try {
      console.log('🔍 Attempting to update employee_number to:', newEmployeeNumber);
      
      const updateResult = await erpnextClient.makeRequest(
        `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            employee_number: newEmployeeNumber
          })
        }
      );
      
      console.log('✅ Update result:', updateResult);
      
      // Check if the update worked
      const updatedEmployee = await erpnextClient.getCurrentEmployee(testEmployee.name);
      
      const testResult = {
        success: !!updateResult,
        original: {
          employee_number: testEmployee.employee_number
        },
        new: {
          employee_number: newEmployeeNumber
        },
        result: {
          employee_number: updatedEmployee.data.employee_number,
          wasUpdated: updatedEmployee.data.employee_number === newEmployeeNumber
        },
        updateResult: updateResult,
        currentState: updatedEmployee.data
      };
      
      console.log('🔍 Test result:', testResult);
      
      return NextResponse.json({
        success: true,
        message: 'Employee number update test completed',
        employeeId: testEmployee.name,
        testResult: testResult
      });
      
    } catch (error) {
      console.error('❌ Employee number update failed:', error);
      
      // Try to get more details about the error
      let errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'unknown'
      };
      
      if (error instanceof Error && error.message.includes('417')) {
        errorDetails.type = 'validation_error';
        errorDetails.message = 'Field validation failed - field may be read-only via API';
      } else if (error instanceof Error && error.message.includes('403')) {
        errorDetails.type = 'permission_error';
        errorDetails.message = 'Permission denied - field may require special permissions';
      } else if (error instanceof Error && error.message.includes('400')) {
        errorDetails.type = 'bad_request';
        errorDetails.message = 'Bad request - field may not exist or be invalid';
      }
      
      return NextResponse.json({
        success: false,
        message: 'Employee number update failed',
        error: errorDetails,
        suggestion: 'The employee_number field may be read-only via API even though it\'s editable in the UI'
      });
    }

  } catch (error) {
    console.error('💥 Error during employee number test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing employee number update: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
