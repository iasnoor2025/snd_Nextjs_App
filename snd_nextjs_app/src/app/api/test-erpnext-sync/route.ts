import { ERPNextSyncService } from '@/lib/services/erpnext-sync-service';
import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextSyncService = ERPNextSyncService.getInstance();
    
    // Test basic service availability
    const basicTest = {
      success: true,
      erpnextAvailable: erpnextSyncService.isAvailable(),
      message: erpnextSyncService.isAvailable() 
        ? 'ERPNext sync service is available and configured' 
        : 'ERPNext sync service is not configured (check environment variables)',
      environment: {
        hasUrl: !!process.env.NEXT_PUBLIC_ERPNEXT_URL,
        hasApiKey: !!process.env.NEXT_PUBLIC_ERPNEXT_API_KEY,
        hasApiSecret: !!process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET,
      }
    };

    // If ERPNext is available, test field mapping
    if (erpnextSyncService.isAvailable()) {
      try {
        const erpnextClient = new ERPNextClient();
        
        // Test data to verify field mapping
        const testEmployee = {
          firstName: 'Test',
          lastName: 'Employee',
          fileNumber: 'TEST001',
          basicSalary: '5000',
          status: 'active'
        };

        console.log('🧪 Testing ERPNext field mapping with:', testEmployee);

        // Try to create a test employee to verify field mapping
        const testResult = await erpnextClient.createEmployee(testEmployee);
        
        basicTest.testResult = {
          success: !!testResult,
          erpnextId: testResult,
          message: testResult ? 'Test employee created successfully' : 'Failed to create test employee',
          testData: testEmployee
        };

        // If test was successful, clean up by deleting the test employee
        if (testResult) {
          try {
            // Check what fields were actually saved in ERPNext
            const currentEmployee = await erpnextClient.getCurrentEmployee(testResult);
            console.log('🔍 Current employee data in ERPNext:', currentEmployee);
            
            // Mark as inactive instead of deleting
            await erpnextClient.updateEmployee({
              ...testEmployee,
              erpnextId: testResult,
              status: 'inactive'
            });
            console.log('🧹 Test employee cleaned up successfully');
          } catch (cleanupError) {
            console.warn('⚠️ Could not clean up test employee:', cleanupError);
          }
        }

        // Also try to get ERPNext field definitions
        try {
          const fields = await erpnextClient.getEmployeeFields();
          basicTest.erpnextFields = {
            success: !!fields,
            data: fields
          };
        } catch (fieldsError) {
          basicTest.erpnextFields = {
            success: false,
            error: fieldsError instanceof Error ? fieldsError.message : 'Unknown error'
          };
        }

        // Test updating an existing employee's file number
        try {
          // First, get a list of existing employees
          const existingEmployees = await erpnextClient.makeRequest('/api/resource/Employee?limit_page_length=5');
          
          if (existingEmployees.data && existingEmployees.data.length > 0) {
            const testEmployee = existingEmployees.data[0];
            const originalFileNumber = testEmployee.employee_number;
            
            console.log('🧪 Testing file number update for existing employee:', {
              id: testEmployee.name,
              originalFileNumber: originalFileNumber,
              firstName: testEmployee.first_name,
              lastName: testEmployee.last_name
            });

            // Try to update the file number with multiple field names
            const newFileNumber = 'UPDATED_' + (originalFileNumber || 'TEST');
            
            // Test with different field names for employee number
            const updateData = {
              erpnextId: testEmployee.name,
              firstName: testEmployee.first_name,
              lastName: testEmployee.last_name,
              fileNumber: newFileNumber,
              status: testEmployee.status
            };

            console.log('🔍 Testing update with data:', updateData);

            const updateResult = await erpnextClient.updateEmployee(updateData);
            
            basicTest.updateTest = {
              success: updateResult,
              originalFileNumber: originalFileNumber,
              newFileNumber: newFileNumber,
              message: updateResult ? 'File number update test successful' : 'File number update test failed',
              updateData: updateData
            };

            // Check if the update actually worked
            if (updateResult) {
              const updatedEmployee = await erpnextClient.getCurrentEmployee(testEmployee.name);
              basicTest.updateTest.actualData = updatedEmployee;
              
              // Check if any of the employee number fields were updated
              const data = updatedEmployee.data;
              basicTest.updateTest.fieldCheck = {
                employee_number: data.employee_number,
                employee: data.employee,
                naming_series: data.naming_series,
                wasUpdated: data.employee_number !== originalFileNumber
              };
              
              console.log('🔍 Field update check:', basicTest.updateTest.fieldCheck);
            }
          } else {
            basicTest.updateTest = {
              success: false,
              message: 'No existing employees found to test update'
            };
          }
        } catch (updateTestError) {
          basicTest.updateTest = {
            success: false,
            message: 'Update test failed: ' + (updateTestError instanceof Error ? updateTestError.message : 'Unknown error'),
            error: updateTestError
          };
        }

        // Test direct field update to see what's writable
        try {
          const existingEmployees = await erpnextClient.makeRequest('/api/resource/Employee?limit_page_length=1');
          
          if (existingEmployees.data && existingEmployees.data.length > 0) {
            const testEmployee = existingEmployees.data[0];
            
            // Try to update just the employee_number field directly
            const directUpdateResult = await erpnextClient.makeRequest(
              `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
              {
                method: 'PUT',
                body: JSON.stringify({
                  employee_number: 'DIRECT_TEST_' + Date.now()
                })
              }
            );
            
            basicTest.directUpdateTest = {
              success: !!directUpdateResult,
              message: directUpdateResult ? 'Direct field update successful' : 'Direct field update failed',
              result: directUpdateResult
            };
            
            // Check if the direct update worked
            if (directUpdateResult) {
              const updatedEmployee = await erpnextClient.getCurrentEmployee(testEmployee.name);
              basicTest.directUpdateTest.actualData = updatedEmployee;
            }
          }
        } catch (directUpdateError) {
          basicTest.directUpdateTest = {
            success: false,
            message: 'Direct update test failed: ' + (directUpdateError instanceof Error ? directUpdateError.message : 'Unknown error'),
            error: directUpdateError
          };
        }

      } catch (testError) {
        basicTest.testResult = {
          success: false,
          message: 'Test failed: ' + (testError instanceof Error ? testError.message : 'Unknown error'),
          error: testError
        };
      }
    }

    return NextResponse.json(basicTest);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing ERPNext sync service: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
