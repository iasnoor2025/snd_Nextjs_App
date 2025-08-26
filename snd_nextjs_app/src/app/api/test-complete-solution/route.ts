import { ERPNextSyncService } from '@/lib/services/erpnext-sync-service';
import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextSyncService = ERPNextSyncService.getInstance();
    
    console.log('🧪 Testing complete file number sync solution...');
    
    if (!erpnextSyncService.isAvailable()) {
      return NextResponse.json({
        success: false,
        message: 'ERPNext sync service not available'
      });
    }

    const erpnextClient = new ERPNextClient();
    
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
    
    // Test the complete solution
    const newFileNumber = 'SOLUTION_TEST_' + Date.now();
    
    try {
      console.log('🔍 Testing complete solution with file number:', newFileNumber);
      
      // Create test employee data
      const testEmployeeData = {
        erpnextId: testEmployee.name,
        id: testEmployee.name,
        firstName: testEmployee.first_name,
        lastName: testEmployee.last_name,
        fileNumber: newFileNumber,
        status: testEmployee.status,
        // Add other required fields
        basicSalary: testEmployee.ctc || 0,
        phone: testEmployee.cell_number || '',
        email: testEmployee.personal_email || '',
        companyEmail: testEmployee.company_email || '',
        company: testEmployee.company || '',
        branch: testEmployee.branch || '',
        hireDate: testEmployee.date_of_joining || '',
        dateOfBirth: testEmployee.date_of_birth || '',
        gender: testEmployee.gender || '',
        maritalStatus: testEmployee.marital_status || '',
        iqamaNumber: testEmployee.custom_iqama || '',
        iqamaExpiry: testEmployee.iqama_expiry_date_en || '',
        employeeArabicName: testEmployee.custom_الاسم_الكامل || '',
        bio: testEmployee.bio || ''
      };
      
      console.log('🔍 Test employee data prepared:', {
        erpnextId: testEmployeeData.erpnextId,
        fileNumber: testEmployeeData.fileNumber,
        firstName: testEmployeeData.firstName,
        lastName: testEmployeeData.lastName
      });
      
      // Test the sync service
      const syncResult = await erpnextSyncService.syncUpdatedEmployee(testEmployeeData);
      
      console.log('✅ Sync result:', syncResult);
      
      if (syncResult) {
        // Check if the update worked
        const updatedEmployee = await erpnextClient.getCurrentEmployee(testEmployee.name);
        
        // Extract file number from bio field
        let extractedFileNumber = null;
        if (updatedEmployee.data.bio && updatedEmployee.data.bio.includes('File Number:')) {
          const bioMatch = updatedEmployee.data.bio.match(/File Number:\s*([^\s]+)/);
          if (bioMatch) {
            extractedFileNumber = bioMatch[1];
          }
        }
        
        const testResult = {
          success: true,
          original: {
            name: testEmployee.name,
            employee_number: testEmployee.employee_number,
            bio: testEmployee.bio
          },
          new: {
            fileNumber: newFileNumber,
            expectedBio: `File Number: ${newFileNumber}`
          },
          result: {
            employee_number: updatedEmployee.data.employee_number,
            bio: updatedEmployee.data.bio,
            extractedFileNumber: extractedFileNumber,
            wasUpdated: extractedFileNumber === newFileNumber
          },
          syncResult: syncResult,
          currentState: updatedEmployee.data
        };
        
        console.log('🔍 Complete solution test result:', testResult);
        
        return NextResponse.json({
          success: true,
          message: 'Complete file number sync solution test completed successfully',
          employeeId: testEmployee.name,
          testResult: testResult
        });
        
      } else {
        return NextResponse.json({
          success: false,
          message: 'Complete solution test failed - sync returned false'
        });
      }
      
    } catch (error) {
      console.error('❌ Complete solution test failed:', error);
      
      return NextResponse.json({
        success: false,
        message: 'Complete solution test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        error: error
      });
    }

  } catch (error) {
    console.error('💥 Error during complete solution test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing complete solution: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
