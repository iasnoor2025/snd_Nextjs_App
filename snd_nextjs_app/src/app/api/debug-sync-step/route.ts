import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextClient = new ERPNextClient();
    
    console.log('🔍 Debug: Testing sync steps individually...');
    
    // Get a sample employee
    const existingEmployees = await erpnextClient.makeRequest('/api/resource/Employee?limit_page_length=1');
    
    if (!existingEmployees.data || existingEmployees.data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No existing employees found to test with'
      });
    }

    const testEmployee = existingEmployees.data[0];
    console.log('📋 Debug: Testing with employee:', testEmployee.name);
    
    // Test step 1: Direct bio field update
    const newFileNumber = 'DEBUG_TEST_' + Date.now();
    const testBio = `File Number: ${newFileNumber}`;
    
    try {
      console.log('🔍 Debug Step 1: Testing direct bio field update...');
      
      const updateResult = await erpnextClient.makeRequest(
        `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            bio: testBio
          })
        }
      );
      
      console.log('✅ Debug Step 1 result:', updateResult);
      
      // Check if the update worked
      const updatedEmployee = await erpnextClient.getCurrentEmployee(testEmployee.name);
      
      const step1Result = {
        success: !!updateResult,
        original: {
          bio: testEmployee.bio
        },
        new: {
          bio: testBio
        },
        result: {
          bio: updatedEmployee.data.bio,
          wasUpdated: updatedEmployee.data.bio === testBio
        }
      };
      
      console.log('🔍 Debug Step 1 result:', step1Result);
      
      // Test step 2: Extract file number from bio
      let extractedFileNumber = null;
      if (updatedEmployee.data.bio && updatedEmployee.data.bio.includes('File Number:')) {
        const bioMatch = updatedEmployee.data.bio.match(/File Number:\s*([^\s]+)/);
        if (bioMatch) {
          extractedFileNumber = bioMatch[1];
        }
      }
      
      const step2Result = {
        bio: updatedEmployee.data.bio,
        extractedFileNumber: extractedFileNumber,
        wasExtracted: extractedFileNumber === newFileNumber
      };
      
      console.log('🔍 Debug Step 2 result:', step2Result);
      
      // Test step 3: Try the updateEmployee method
      console.log('🔍 Debug Step 3: Testing updateEmployee method...');
      
      const testEmployeeData = {
        erpnextId: testEmployee.name,
        firstName: testEmployee.first_name,
        lastName: testEmployee.last_name,
        fileNumber: 'UPDATE_TEST_' + Date.now(),
        status: testEmployee.status,
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
        employeeArabicName: testEmployee.custom_الاسم_الكامل || ''
      };
      
      const updateMethodResult = await erpnextClient.updateEmployee(testEmployeeData);
      
      const step3Result = {
        success: updateMethodResult,
        testData: {
          fileNumber: testEmployeeData.fileNumber,
          firstName: testEmployeeData.firstName,
          lastName: testEmployeeData.lastName
        }
      };
      
      console.log('🔍 Debug Step 3 result:', step3Result);
      
      // Restore original bio
      console.log('🔄 Debug: Restoring original bio...');
      await erpnextClient.makeRequest(
        `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            bio: testEmployee.bio || ''
          })
        }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Debug sync steps completed',
        employeeId: testEmployee.name,
        step1: step1Result,
        step2: step2Result,
        step3: step3Result
      });
      
    } catch (error) {
      console.error('❌ Debug test failed:', error);
      
      return NextResponse.json({
        success: false,
        message: 'Debug test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        error: error
      });
    }

  } catch (error) {
    console.error('💥 Error during debug test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error during debug test: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
