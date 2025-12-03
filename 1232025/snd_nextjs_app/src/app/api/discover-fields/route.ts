import { ERPNextClient } from '@/lib/erpnext-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const erpnextClient = new ERPNextClient();
    
    console.log('🔍 Discovering ERPNext Employee fields...');
    
    // 1. Get field definitions (meta)
    let fieldDefinitions = null;
    try {
      fieldDefinitions = await erpnextClient.getEmployeeFields();
      console.log('✅ Field definitions fetched');
    } catch (error) {
      console.error('❌ Failed to fetch field definitions:', error);
    }
    
    // 2. Get a sample employee to see all available fields
    const existingEmployees = await erpnextClient.makeRequest('/api/resource/Employee?limit_page_length=1');
    
    if (!existingEmployees.data || existingEmployees.data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No existing employees found to analyze'
      });
    }

    const sampleEmployee = existingEmployees.data[0];
    console.log('📋 Sample employee ID:', sampleEmployee.name);
    
    // 3. Get detailed employee data
    const detailedEmployee = await erpnextClient.getCurrentEmployee(sampleEmployee.name);
    
    // 4. Analyze all fields
    const allFields = detailedEmployee.data;
    const fieldNames = Object.keys(allFields);
    
    console.log('🔍 Total fields found:', fieldNames.length);
    console.log('📋 All field names:', fieldNames);
    
    // 5. Look for potential custom employee number fields
    const potentialFields = fieldNames.filter(field => 
      field.toLowerCase().includes('employee') ||
      field.toLowerCase().includes('number') ||
      field.toLowerCase().includes('id') ||
      field.toLowerCase().includes('file') ||
      field.toLowerCase().includes('custom')
    );
    
    console.log('🎯 Potential employee number fields:', potentialFields);
    
    // 6. Check field values for potential matches
    const fieldAnalysis = {};
    potentialFields.forEach(field => {
      fieldAnalysis[field] = {
        value: allFields[field],
        type: typeof allFields[field],
        isCustom: field.startsWith('custom_'),
        description: field
      };
    });
    
    // 7. Try to identify the actual custom field
    let identifiedField = null;
    for (const [fieldName, fieldInfo] of Object.entries(fieldAnalysis)) {
      if (fieldInfo.isCustom && fieldInfo.value && fieldInfo.value !== sampleEmployee.employee_number) {
        identifiedField = fieldName;
        break;
      }
    }
    
    const result = {
      success: true,
      message: 'Field discovery completed',
      sampleEmployeeId: sampleEmployee.name,
      totalFields: fieldNames.length,
      allFieldNames: fieldNames,
      potentialEmployeeNumberFields: potentialFields,
      fieldAnalysis: fieldAnalysis,
      identifiedCustomField: identifiedField,
      fieldDefinitions: fieldDefinitions,
      sampleData: {
        employee_number: allFields.employee_number,
        employee: allFields.employee,
        naming_series: allFields.naming_series
      }
    };
    
    console.log('🔍 Discovery result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Error during field discovery:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error discovering fields: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
