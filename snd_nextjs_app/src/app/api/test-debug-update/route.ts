import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextClient = new ERPNextClient();
    
    console.log('🔍 Debug: Testing ERPNext update step by step...');
    
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
    
    // Test direct API call first
    console.log('🔍 Debug Step 1: Testing direct API call...');
    try {
      const directUpdate = await erpnextClient.makeRequest(
        `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
        { 
          method: 'PUT', 
          body: JSON.stringify({ 
            first_name: testEmployee.first_name,
            last_name: testEmployee.last_name
          }) 
        }
      );
      console.log('✅ Debug Step 1 result:', directUpdate);
    } catch (error) {
      console.error('❌ Debug Step 1 failed:', error);
    }
    
    // Test the updateEmployee method
    console.log('🔍 Debug Step 2: Testing updateEmployee method...');
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
    
    console.log('🔍 Debug: Test employee data:', testEmployeeData);
    
    const updateResult = await erpnextClient.updateEmployee(testEmployeeData);
    
    console.log('✅ Debug Step 2 result:', updateResult);
    
    return NextResponse.json({
      success: true,
      message: 'Debug update test completed',
      employeeId: testEmployee.name,
      updateResult: updateResult,
      testData: testEmployeeData,
      directUpdate: 'Check console for details'
    });
    
  } catch (error) {
    console.error('💥 Error during debug update test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing debug update: ' + (error as Error).message,
        error: error
      },
      { status: 500 }
    );
  }
}
