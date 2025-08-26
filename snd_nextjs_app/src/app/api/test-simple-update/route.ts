import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextClient = new ERPNextClient();
    
    console.log('🧪 Testing simple ERPNext update...');
    
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
    
    // Test simple update with minimal data
    const testEmployeeData = {
      erpnextId: testEmployee.name,
      firstName: testEmployee.first_name,
      lastName: testEmployee.last_name,
      fileNumber: testEmployee.employee_number,
      status: 'active',
      basicSalary: 0,
      phone: '',
      email: '',
      companyEmail: '',
      company: '',
      branch: '',
      hireDate: '',
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      iqamaNumber: '',
      iqamaExpiry: '',
      employeeArabicName: ''
    };
    
    console.log('🔍 Test employee data prepared:', {
      erpnextId: testEmployeeData.erpnextId,
      fileNumber: testEmployeeData.fileNumber,
      firstName: testEmployeeData.firstName,
      lastName: testEmployeeData.lastName
    });
    
    // Test the update
    const updateResult = await erpnextClient.updateEmployee(testEmployeeData);
    
    console.log('✅ Update result:', updateResult);
    
    return NextResponse.json({
      success: true,
      message: 'Simple update test completed',
      employeeId: testEmployee.name,
      updateResult: updateResult,
      testData: testEmployeeData
    });
    
  } catch (error) {
    console.error('💥 Error during simple update test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing simple update: ' + (error as Error).message,
        error: error
      },
      { status: 500 }
    );
  }
}
