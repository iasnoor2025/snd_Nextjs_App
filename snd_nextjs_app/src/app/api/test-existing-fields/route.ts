import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextClient = new ERPNextClient();
    
    console.log('🧪 Testing existing field updates...');
    
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
    
    // Test updating various existing fields
    const testFields = [
      'passport_number',      // Already has a value
      'cell_number',          // Empty field
      'personal_email',       // Empty field
      'bio',                  // Empty field
      'notes'                 // Might exist
    ];
    
    const testResults = {};
    
    for (const fieldName of testFields) {
      try {
        const originalValue = testEmployee[fieldName] || 'EMPTY';
        const newValue = `TEST_${fieldName.toUpperCase()}_${Date.now()}`;
        
        console.log(`🔍 Testing field: ${fieldName}`);
        console.log(`   Original: ${originalValue}`);
        console.log(`   New: ${newValue}`);
        
        // Try to update the field
        const updateResult = await erpnextClient.makeRequest(
          `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              [fieldName]: newValue
            })
          }
        );
        
        // Check if the update worked
        const updatedEmployee = await erpnextClient.getCurrentEmployee(testEmployee.name);
        const currentValue = updatedEmployee.data[fieldName];
        
        testResults[fieldName] = {
          success: !!updateResult,
          originalValue: originalValue,
          newValue: newValue,
          currentValue: currentValue,
          wasUpdated: currentValue === newValue,
          updateResult: updateResult
        };
        
        console.log(`   Result: ${testResults[fieldName].wasUpdated ? '✅ SUCCESS' : '❌ FAILED'}`);
        
      } catch (error) {
        testResults[fieldName] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        console.log(`   Result: ❌ ERROR - ${testResults[fieldName].error}`);
      }
    }
    
    // Restore original values
    console.log('🔄 Restoring original values...');
    try {
      await erpnextClient.makeRequest(
        `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            passport_number: testEmployee.passport_number || '',
            cell_number: testEmployee.cell_number || '',
            personal_email: testEmployee.personal_email || '',
            bio: testEmployee.bio || '',
            notes: testEmployee.notes || ''
          })
        }
      );
      console.log('✅ Original values restored');
    } catch (error) {
      console.warn('⚠️ Could not restore original values:', error);
    }
    
    const result = {
      success: true,
      message: 'Existing field update tests completed',
      employeeId: testEmployee.name,
      testResults: testResults,
      summary: {
        totalFields: testFields.length,
        successfulUpdates: Object.values(testResults).filter(r => r.success && r.wasUpdated).length,
        failedUpdates: Object.values(testResults).filter(r => !r.success || !r.wasUpdated).length
      }
    };
    
    console.log('🔍 Test summary:', result.summary);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Error during existing field tests:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing existing fields: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
