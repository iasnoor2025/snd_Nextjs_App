import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextClient = new ERPNextClient();
    
    console.log('🧪 Testing complete ERPNext update...');
    
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
    
    // Test update with more complete data
    const testEmployeeData = {
      erpnextId: testEmployee.name,
      firstName: testEmployee.first_name || 'Test',
      lastName: testEmployee.last_name || 'Employee',
      fileNumber: testEmployee.employee_number,
      status: 'active',
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
      // Add department and designation if they exist
      department: testEmployee.department ? { name: testEmployee.department } : undefined,
      designation: testEmployee.designation ? { name: testEmployee.designation } : undefined
    };
    
    console.log('🔍 Complete test employee data:', testEmployeeData);
    
    // Test the update
    const updateResult = await erpnextClient.updateEmployee(testEmployeeData);
    
    console.log('✅ Complete update result:', updateResult);
    
    return NextResponse.json({
      success: true,
      message: 'Complete update test completed',
      employeeId: testEmployee.name,
      updateResult: updateResult,
      testData: testEmployeeData
    });
    
  } catch (error) {
    console.error('💥 Error during complete update test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing complete update: ' + (error as Error).message,
        error: error
      },
      { status: 500 }
    );
  }
}
