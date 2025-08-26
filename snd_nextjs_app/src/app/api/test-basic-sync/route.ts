import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextClient = new ERPNextClient();
    
    console.log('🧪 Testing basic ERPNext sync without bio field...');
    
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
    
    // Test basic employee update (without file number changes)
    const testEmployeeData = {
      erpnextId: testEmployee.name,
      firstName: testEmployee.first_name,
      lastName: testEmployee.last_name,
      fileNumber: testEmployee.employee_number, // Keep same file number
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
    
    console.log('🔍 Test employee data prepared:', {
      erpnextId: testEmployeeData.erpnextId,
      fileNumber: testEmployeeData.fileNumber,
      firstName: testEmployeeData.firstName,
      lastName: testEmployeeData.lastName
    });
    
    // Test the basic update
    const updateResult = await erpnextClient.updateEmployee(testEmployeeData);
    
    console.log('✅ Update result:', updateResult);
    
    if (updateResult) {
      // Check if the update worked
      const updatedEmployee = await erpnextClient.getCurrentEmployee(testEmployee.name);
      
      const testResult = {
        success: true,
        original: {
          name: testEmployee.name,
          employee_number: testEmployee.employee_number,
          first_name: testEmployee.first_name,
          last_name: testEmployee.last_name
        },
        result: {
          name: updatedEmployee.data.name,
          employee_number: updatedEmployee.data.employee_number,
          first_name: updatedEmployee.data.first_name,
          last_name: updatedEmployee.data.last_name
        },
        updateResult: updateResult,
        currentState: updatedEmployee.data
      };
      
      console.log('🔍 Basic sync test result:', testResult);
      
      return NextResponse.json({
        success: true,
        message: 'Basic ERPNext sync test completed successfully',
        employeeId: testEmployee.name,
        testResult: testResult
      });
      
    } else {
      return NextResponse.json({
        success: false,
        message: 'Basic sync test failed - update returned false'
      });
    }
    
  } catch (error) {
    console.error('💥 Error during basic sync test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing basic sync: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
