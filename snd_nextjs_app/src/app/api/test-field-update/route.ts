import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextClient = new ERPNextClient();
    
    // Get a list of existing employees
    const existingEmployees = await erpnextClient.makeRequest('/api/resource/Employee?limit_page_length=1');
    
    if (!existingEmployees.data || existingEmployees.data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No existing employees found to test with'
      });
    }

    const testEmployee = existingEmployees.data[0];
    const originalData = {
      employee_number: testEmployee.employee_number,
      employee: testEmployee.employee,
      first_name: testEmployee.first_name
    };

    console.log('🧪 Testing field updates for employee:', testEmployee.name);
    console.log('📋 Original data:', originalData);

    const testResults = {};

    // Test 1: Update employee_number field
    try {
      const newEmployeeNumber = 'TEST_EMP_' + Date.now();
      const result1 = await erpnextClient.makeRequest(
        `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            employee_number: newEmployeeNumber
          })
        }
      );
      
      testResults.employee_number_test = {
        success: !!result1,
        original: originalData.employee_number,
        new: newEmployeeNumber,
        result: result1
      };
    } catch (error) {
      testResults.employee_number_test = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 2: Update employee field
    try {
      const newEmployee = 'TEST_EMP_' + Date.now();
      const result2 = await erpnextClient.makeRequest(
        `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            employee: newEmployee
          })
        }
      );
      
      testResults.employee_test = {
        success: !!result2,
        original: originalData.employee,
        new: newEmployee,
        result: result2
      };
    } catch (error) {
      testResults.employee_test = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 3: Update first_name field (should work)
    try {
      const newFirstName = 'TEST_FIRST_' + Date.now();
      const result3 = await erpnextClient.makeRequest(
        `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            first_name: newFirstName
          })
        }
      );
      
      testResults.first_name_test = {
        success: !!result3,
        original: originalData.first_name,
        new: newFirstName,
        result: result3
      };
    } catch (error) {
      testResults.first_name_test = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check current state after all tests
    try {
      const currentEmployee = await erpnextClient.getCurrentEmployee(testEmployee.name);
      testResults.currentState = currentEmployee.data;
    } catch (error) {
      testResults.currentState = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Restore original data
    try {
      await erpnextClient.makeRequest(
        `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            first_name: originalData.first_name
          })
        }
      );
      console.log('🔄 Restored original first name');
    } catch (error) {
      console.warn('⚠️ Could not restore original first name:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Field update tests completed',
      employeeId: testEmployee.name,
      originalData: originalData,
      testResults: testResults
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing field updates: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
