import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextClient = new ERPNextClient();
    
    console.log('🧪 Testing ALL employee fields for writability...');
    
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
    
    // Get detailed employee data to see all fields
    const detailedEmployee = await erpnextClient.getCurrentEmployee(testEmployee.name);
    const allFields = detailedEmployee.data;
    const fieldNames = Object.keys(allFields);
    
    console.log('🔍 Total fields found:', fieldNames.length);
    
    // Test fields that might be suitable for storing file numbers
    const testableFields = [
      'bio',                    // Already confirmed writable
      'passport_number',        // Already confirmed writable
      'notes',                  // Might be writable
      'custom_iqama',           // Custom field, might be writable
      'cell_number',            // Contact field
      'personal_email',         // Contact field
      'address',                // Address field
      'city',                   // Address field
      'state',                  // Address field
      'country',                // Address field
      'postal_code',            // Address field
      'nationality',            // Personal info
      'blood_group',            // Personal info
      'emergency_contact_name', // Emergency contact
      'emergency_contact_phone' // Emergency contact
    ];
    
    const testResults = {};
    
    for (const fieldName of testableFields) {
      // Only test fields that exist
      if (fieldName in allFields) {
        try {
          const originalValue = allFields[fieldName] || 'EMPTY';
          const newValue = `FILE_NUMBER_${Date.now()}_${fieldName.toUpperCase()}`;
          
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
      } else {
        testResults[fieldName] = {
          success: false,
          error: 'Field does not exist',
          exists: false
        };
        console.log(`   Result: ❌ FIELD NOT FOUND`);
      }
    }
    
    // Restore original values for fields that were successfully updated
    console.log('🔄 Restoring original values...');
    const restoreData = {};
    for (const [fieldName, result] of Object.entries(testResults)) {
      if (result.wasUpdated && allFields[fieldName] !== undefined) {
        restoreData[fieldName] = allFields[fieldName];
      }
    }
    
    if (Object.keys(restoreData).length > 0) {
      try {
        await erpnextClient.makeRequest(
          `/api/resource/Employee/${encodeURIComponent(testEmployee.name)}`,
          {
            method: 'PUT',
            body: JSON.stringify(restoreData)
          }
        );
        console.log('✅ Original values restored');
      } catch (error) {
        console.warn('⚠️ Could not restore original values:', error);
      }
    }
    
    const result = {
      success: true,
      message: 'All employee fields test completed',
      employeeId: testEmployee.name,
      totalFields: fieldNames.length,
      testResults: testResults,
      summary: {
        totalTested: testableFields.length,
        successfulUpdates: Object.values(testResults).filter(r => r.success && r.wasUpdated).length,
        failedUpdates: Object.values(testResults).filter(r => !r.success || !r.wasUpdated).length,
        writableFields: Object.entries(testResults)
          .filter(([_, r]) => r.success && r.wasUpdated)
          .map(([field, _]) => field)
      }
    };
    
    console.log('🔍 Test summary:', result.summary);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Error during all fields test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing all fields: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
