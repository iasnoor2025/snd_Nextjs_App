import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
// Batch size for parallel processing
const BATCH_SIZE = 10;
const MAX_CONCURRENT_REQUESTS = 5;

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
    const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
    const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

    console.log('ERPNext Configuration Check:', {
      hasUrl: !!ERPNEXT_URL,
      hasKey: !!ERPNEXT_API_KEY,
      hasSecret: !!ERPNEXT_API_SECRET,
      url: ERPNEXT_URL,
      keyLength: ERPNEXT_API_KEY?.length || 0,
      secretLength: ERPNEXT_API_SECRET?.length || 0
    });

    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      console.log('ERPNext configuration missing:', {
        hasUrl: !!ERPNEXT_URL,
        hasKey: !!ERPNEXT_API_KEY,
        hasSecret: !!ERPNEXT_API_SECRET
      });

      return NextResponse.json(
        {
          success: false,
          message: 'ERPNext configuration is missing. Please check your environment variables.',
        },
        { status: 500 }
      );
    }

    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }

    // Check if database has existing employees
    const existingEmployeeCount = await prisma.employee.count();
    console.log(`Database has ${existingEmployeeCount} existing employees`);

    // Fetch employees list from ERPnext
    console.log('Fetching employee list from ERPNext...');
    console.log('ERPNext URL:', `${ERPNEXT_URL}/api/resource/Employee?limit_page_length=1000`);
    
    const erpnextResponse = await fetch(`${ERPNEXT_URL}/api/resource/Employee?limit_page_length=1000`, {
      headers: {
        'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('ERPNext Response Status:', erpnextResponse.status);
    console.log('ERPNext Response Headers:', Object.fromEntries(erpnextResponse.headers.entries()));

    if (!erpnextResponse.ok) {
      const errorText = await erpnextResponse.text();
      console.error('ERPNext API Error Response:', errorText);
      throw new Error(`ERPNext API error: ${erpnextResponse.status} ${erpnextResponse.statusText} - ${errorText}`);
    }

    const erpnextData = await erpnextResponse.json();
    console.log('ERPNext Raw Response:', JSON.stringify(erpnextData, null, 2));
    console.log(`Found ${erpnextData.data?.length || 0} employees in ERPNext`);

    if (!erpnextData.data || erpnextData.data.length === 0) {
      console.log('No employees found in ERPNext response');
      console.log('ERPNext response structure:', {
        keys: Object.keys(erpnextData),
        dataType: typeof erpnextData.data,
        dataLength: erpnextData.data?.length || 0,
        hasData: !!erpnextData.data,
        responseKeys: Object.keys(erpnextData)
      });
      
      // Check if there are any other keys that might contain employee data
      const possibleDataKeys = ['results', 'employees', 'data', 'items'];
      let alternativeData = null;
      
      for (const key of possibleDataKeys) {
        if (erpnextData[key] && Array.isArray(erpnextData[key]) && erpnextData[key].length > 0) {
          console.log(`Found alternative data in key: ${key}`, erpnextData[key].length);
          alternativeData = erpnextData[key];
          break;
        }
      }
      
      return NextResponse.json({
        success: true,
        message: alternativeData ? 
          `Found ${alternativeData.length} employees in alternative data structure` : 
          'No employees found in ERPNext',
        syncedCount: 0,
        newCount: 0,
        updatedCount: 0,
        totalErpnextCount: alternativeData?.length || 0,
        existingCount: existingEmployeeCount,
        debug: {
          erpnextUrl: ERPNEXT_URL,
          responseKeys: Object.keys(erpnextData),
          dataLength: erpnextData.data?.length || 0,
          hasData: !!erpnextData.data,
          alternativeDataFound: !!alternativeData,
          alternativeDataLength: alternativeData?.length || 0,
          sampleResponse: Object.keys(erpnextData).reduce((acc, key) => {
            if (typeof erpnextData[key] === 'object' && erpnextData[key] !== null) {
              acc[key] = Array.isArray(erpnextData[key]) ? 
                `${erpnextData[key].length} items` : 
                typeof erpnextData[key];
            }
            return acc;
          }, {} as Record<string, string>)
        }
      });
    }

    // Process employees in batches for better performance
    const erpEmployees: any[] = [];
    const errors: Array<{employee: string, error: string}> = [];

    // Process employees in batches
    for (let i = 0; i < erpnextData.data.length; i += BATCH_SIZE) {
      const batch = erpnextData.data.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(erpnextData.data.length / BATCH_SIZE)}`);

             // Process batch in parallel with limited concurrency
       const batchPromises = batch.map(async (item: any, index: number) => {
        if (!item.name) return null;

        try {
          const detailResponse = await fetch(`${ERPNEXT_URL}/api/resource/Employee/${encodeURIComponent(item.name)}`, {
            headers: {
              'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });

          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            if (detailData.data) {
              return detailData.data;
            }
          } else {
            console.error(`Failed to fetch employee ${item.name}: ${detailResponse.status}`);
            errors.push({
              employee: item.name,
              error: `HTTP ${detailResponse.status}: ${detailResponse.statusText}`
            });
          }
        } catch (error) {
          console.error(`Error fetching employee ${item.name}:`, error);
          errors.push({
            employee: item.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        return null;
      });

      // Wait for batch to complete with limited concurrency
      const batchResults = await Promise.allSettled(batchPromises);
      const successfulResults = batchResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(Boolean);

      erpEmployees.push(...successfulResults);

      // Add small delay between batches to avoid overwhelming the API
      if (i + BATCH_SIZE < erpnextData.data.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Successfully fetched ${erpEmployees.length} employee details`);

    // Batch database operations for better performance
    const syncedEmployees: any[] = [];
    const updatedEmployees: any[] = [];
    const newEmployees: any[] = [];
    const dbErrors: Array<{employee: string, error: string}> = [];

    // Process database operations in batches
    for (let i = 0; i < erpEmployees.length; i += BATCH_SIZE) {
      const batch = erpEmployees.slice(i, i + BATCH_SIZE);
      console.log(`Processing database batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(erpEmployees.length / BATCH_SIZE)}`);

      const batchPromises = batch.map(async (erpEmployee) => {
        try {
          // Check if employee already exists
          const existingEmployee = await prisma.employee.findFirst({
            where: {
              OR: [
                { file_number: erpEmployee.employee_id },
                { file_number: erpEmployee.name }
              ]
            }
          });

          // Parse employee name using ERPNext fields
          let firstName = (erpEmployee.first_name || '').trim();
          let middleName = (erpEmployee.middle_name || '').trim();
          let lastName = (erpEmployee.last_name || '').trim();
          const employeeName = erpEmployee.employee_name || '';
          const employeeArabicName = erpEmployee.custom_الاسم_الكامل || null;

          // If first_name contains full name and last_name is empty, try to split it
          if (firstName && !lastName && firstName.includes(' ')) {
            const nameParts = firstName.split(' ').filter((part: string) => part.trim());
            if (nameParts.length >= 2) {
              firstName = nameParts[0];
              lastName = nameParts[nameParts.length - 1];
              middleName = nameParts.slice(1, -1).join(' ');
            }
          }

          // Get salary information
          const basicSalary = erpEmployee.ctc || erpEmployee.basic_salary || 0;
          const cellNumber = erpEmployee.cell_number || null;
          const companyEmail = erpEmployee.company_email || null;
          const personalEmail = erpEmployee.personal_email || null;
          const email = companyEmail || personalEmail;

          // Get employee identification
          const employeeId = erpEmployee.employee_number || erpEmployee.name;
          const fileNumber = erpEmployee.employee_number || employeeId;

          // Get additional information
          const departmentName = erpEmployee.department || null;
          const designationName = erpEmployee.designation || null;
          const dateOfBirth = erpEmployee.date_of_birth || null;
          const gender = erpEmployee.gender || null;
          const maritalStatus = erpEmployee.marital_status || null;
          const iqama = erpEmployee.custom_iqama || null;
          const iqamaExpiry = erpEmployee.iqama_expiry_date_en || null;
          const status = erpEmployee.status || 'Active';
          const dateOfJoining = erpEmployee.date_of_joining || null;
          const contractEndDate = erpEmployee.contract_end_date || null;
          const company = erpEmployee.company || null;
          const branch = erpEmployee.branch || null;
          const userId = isNaN(erpEmployee.user_id) ? null : erpEmployee.user_id;
          const bio = erpEmployee.bio || null;

          // Map department and designation to IDs
          let departmentId = null;
          let designationId = null;

          if (designationName) {
            let designation = await prisma.designation.findFirst({
              where: { name: designationName }
            });

            if (!designation) {
              designation = await prisma.designation.create({
                data: {
                  name: designationName,
                  description: designationName,
                  is_active: true
                }
              });
            } else {
              designation = await prisma.designation.update({
                where: { id: designation.id },
                data: { description: designationName, is_active: true }
              });
            }
            designationId = designation.id;
          }

          if (departmentName) {
            const department = await prisma.department.findFirst({
              where: { name: departmentName }
            });
            if (department) {
              departmentId = department.id;
            }
          }

                      const employeeData = {
              first_name: firstName,
              middle_name: middleName,
              last_name: lastName,
              employee_id: employeeId,
              file_number: fileNumber,
              basic_salary: parseFloat(basicSalary.toString()) || 0,
              status: status.toLowerCase(),
              email: email,
              phone: cellNumber,
              hire_date: dateOfJoining ? new Date(dateOfJoining) : null,
              date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
              erpnext_id: erpEmployee.name,
              department_id: departmentId,
              designation_id: designationId,
              // Additional fields from ERPNext
              iqama_number: iqama,
              iqama_expiry: iqamaExpiry ? new Date(iqamaExpiry) : null,
              // Address information
              address: erpEmployee.address || null,
              city: erpEmployee.city || null,
              state: erpEmployee.state || null,
              country: erpEmployee.country || null,
              postal_code: erpEmployee.postal_code || null,
              nationality: erpEmployee.nationality || null,
              // Salary and benefits
              food_allowance: parseFloat(erpEmployee.food_allowance?.toString() || '0'),
              housing_allowance: parseFloat(erpEmployee.housing_allowance?.toString() || '0'),
              transport_allowance: parseFloat(erpEmployee.transport_allowance?.toString() || '0'),
              absent_deduction_rate: parseFloat(erpEmployee.absent_deduction_rate?.toString() || '0'),
              overtime_rate_multiplier: parseFloat(erpEmployee.overtime_rate_multiplier?.toString() || '1.5'),
              overtime_fixed_rate: parseFloat(erpEmployee.overtime_fixed_rate?.toString() || '0'),
              // Banking information
              bank_name: erpEmployee.bank_name || null,
              bank_account_number: erpEmployee.bank_account_number || null,
              bank_iban: erpEmployee.bank_iban || null,
              // Contract details
              contract_hours_per_day: parseInt(erpEmployee.contract_hours_per_day?.toString() || '8'),
              contract_days_per_month: parseInt(erpEmployee.contract_days_per_month?.toString() || '26'),
              // Emergency contacts
              emergency_contact_name: erpEmployee.emergency_contact_name || null,
              emergency_contact_phone: erpEmployee.emergency_contact_phone || null,
              emergency_contact_relationship: erpEmployee.emergency_contact_relationship || null,
              // Notes
              notes: erpEmployee.notes || bio || null,
              // Legal documents
              passport_number: erpEmployee.passport_number || null,
              passport_expiry: erpEmployee.passport_expiry ? new Date(erpEmployee.passport_expiry) : null,
              // Licenses and certifications
              driving_license_number: erpEmployee.driving_license_number || null,
              driving_license_expiry: erpEmployee.driving_license_expiry ? new Date(erpEmployee.driving_license_expiry) : null,
              driving_license_cost: parseFloat(erpEmployee.driving_license_cost?.toString() || '0'),
              operator_license_number: erpEmployee.operator_license_number || null,
              operator_license_expiry: erpEmployee.operator_license_expiry ? new Date(erpEmployee.operator_license_expiry) : null,
              operator_license_cost: parseFloat(erpEmployee.operator_license_cost?.toString() || '0'),
              tuv_certification_number: erpEmployee.tuv_certification_number || null,
              tuv_certification_expiry: erpEmployee.tuv_certification_expiry ? new Date(erpEmployee.tuv_certification_expiry) : null,
              tuv_certification_cost: parseFloat(erpEmployee.tuv_certification_cost?.toString() || '0'),
              spsp_license_number: erpEmployee.spsp_license_number || null,
              spsp_license_expiry: erpEmployee.spsp_license_expiry ? new Date(erpEmployee.spsp_license_expiry) : null,
              spsp_license_cost: parseFloat(erpEmployee.spsp_license_cost?.toString() || '0'),
              // File paths
              driving_license_file: erpEmployee.driving_license_file || null,
              operator_license_file: erpEmployee.operator_license_file || null,
              tuv_certification_file: erpEmployee.tuv_certification_file || null,
              spsp_license_file: erpEmployee.spsp_license_file || null,
              passport_file: erpEmployee.passport_file || null,
              iqama_file: erpEmployee.iqama_file || null,
              // Custom certifications
              custom_certifications: erpEmployee.custom_certifications || null,
              // Operator status
              is_operator: erpEmployee.is_operator || false,
              // Access control
              access_restricted_until: erpEmployee.access_restricted_until ? new Date(erpEmployee.access_restricted_until) : null,
              access_start_date: erpEmployee.access_start_date ? new Date(erpEmployee.access_start_date) : null,
              access_end_date: erpEmployee.access_end_date ? new Date(erpEmployee.access_end_date) : null,
              access_restriction_reason: erpEmployee.access_restriction_reason || null,
              // Current location
              current_location: erpEmployee.current_location || null,
              // Advance salary fields
              advance_salary_eligible: erpEmployee.advance_salary_eligible !== false,
              advance_salary_approved_this_month: erpEmployee.advance_salary_approved_this_month || false,
            };

          if (existingEmployee) {
            // Check if data has changed - comprehensive comparison
            const hasChanges =
              existingEmployee.first_name !== firstName ||
              existingEmployee.middle_name !== middleName ||
              existingEmployee.last_name !== lastName ||
              existingEmployee.employee_id !== employeeId ||
              existingEmployee.file_number !== fileNumber ||
              existingEmployee.basic_salary.toString() !== parseFloat(basicSalary.toString()).toString() ||
              existingEmployee.status !== status.toLowerCase() ||
              existingEmployee.email !== email ||
              existingEmployee.phone !== cellNumber ||
              existingEmployee.date_of_birth?.toISOString() !== (dateOfBirth ? new Date(dateOfBirth).toISOString() : null) ||
              existingEmployee.hire_date?.toISOString() !== (dateOfJoining ? new Date(dateOfJoining).toISOString() : null) ||
              existingEmployee.department_id !== departmentId ||
              existingEmployee.designation_id !== designationId ||
              existingEmployee.iqama_number !== iqama ||
              existingEmployee.iqama_expiry?.toISOString() !== (iqamaExpiry ? new Date(iqamaExpiry).toISOString() : null) ||
              existingEmployee.food_allowance.toString() !== parseFloat(erpEmployee.food_allowance?.toString() || '0').toString() ||
              existingEmployee.housing_allowance.toString() !== parseFloat(erpEmployee.housing_allowance?.toString() || '0').toString() ||
              existingEmployee.transport_allowance.toString() !== parseFloat(erpEmployee.transport_allowance?.toString() || '0').toString() ||
              existingEmployee.bank_name !== erpEmployee.bank_name ||
              existingEmployee.bank_account_number !== erpEmployee.bank_account_number ||
              existingEmployee.bank_iban !== erpEmployee.bank_iban ||
              existingEmployee.contract_hours_per_day !== parseInt(erpEmployee.contract_hours_per_day?.toString() || '8') ||
              existingEmployee.contract_days_per_month !== parseInt(erpEmployee.contract_days_per_month?.toString() || '26') ||
              existingEmployee.emergency_contact_name !== erpEmployee.emergency_contact_name ||
              existingEmployee.emergency_contact_phone !== erpEmployee.emergency_contact_phone ||
              existingEmployee.emergency_contact_relationship !== erpEmployee.emergency_contact_relationship ||
              existingEmployee.notes !== (erpEmployee.notes || bio) ||
              existingEmployee.passport_number !== erpEmployee.passport_number ||
              existingEmployee.passport_expiry?.toISOString() !== (erpEmployee.passport_expiry ? new Date(erpEmployee.passport_expiry).toISOString() : null) ||
              existingEmployee.driving_license_number !== erpEmployee.driving_license_number ||
              existingEmployee.driving_license_expiry?.toISOString() !== (erpEmployee.driving_license_expiry ? new Date(erpEmployee.driving_license_expiry).toISOString() : null) ||
              (existingEmployee.driving_license_cost?.toString() || '0') !== parseFloat(erpEmployee.driving_license_cost?.toString() || '0').toString() ||
              existingEmployee.operator_license_number !== erpEmployee.operator_license_number ||
              existingEmployee.operator_license_expiry?.toISOString() !== (erpEmployee.operator_license_expiry ? new Date(erpEmployee.operator_license_expiry).toISOString() : null) ||
              (existingEmployee.operator_license_cost?.toString() || '0') !== parseFloat(erpEmployee.operator_license_cost?.toString() || '0').toString() ||
              existingEmployee.tuv_certification_number !== erpEmployee.tuv_certification_number ||
              existingEmployee.tuv_certification_expiry?.toISOString() !== (erpEmployee.tuv_certification_expiry ? new Date(erpEmployee.tuv_certification_expiry).toISOString() : null) ||
              (existingEmployee.tuv_certification_cost?.toString() || '0') !== parseFloat(erpEmployee.tuv_certification_cost?.toString() || '0').toString() ||
              existingEmployee.spsp_license_number !== erpEmployee.spsp_license_number ||
              existingEmployee.spsp_license_expiry?.toISOString() !== (erpEmployee.spsp_license_expiry ? new Date(erpEmployee.spsp_license_expiry).toISOString() : null) ||
              (existingEmployee.spsp_license_cost?.toString() || '0') !== parseFloat(erpEmployee.spsp_license_cost?.toString() || '0').toString() ||
              existingEmployee.is_operator !== (erpEmployee.is_operator || false) ||
              existingEmployee.current_location !== erpEmployee.current_location ||
              existingEmployee.advance_salary_eligible !== (erpEmployee.advance_salary_eligible !== false) ||
              existingEmployee.advance_salary_approved_this_month !== (erpEmployee.advance_salary_approved_this_month || false);

            if (hasChanges) {
              console.log('Updating existing employee:', existingEmployee.id);
              const updatedEmployee = await prisma.employee.update({
                where: { id: existingEmployee.id },
                data: employeeData,
              });
              return { type: 'updated', employee: updatedEmployee };
            } else {
              console.log('Employee unchanged, skipping:', existingEmployee.id);
              return { type: 'unchanged', employee: existingEmployee };
            }
          } else {
            console.log('Creating new employee:', employeeData.employee_id);
            const newEmployee = await prisma.employee.create({
              data: employeeData,
            });
            return { type: 'created', employee: newEmployee };
          }
        } catch (error) {
          console.error(`Error processing employee ${erpEmployee.name}:`, error);
          dbErrors.push({
            employee: erpEmployee.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return null;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      const successfulResults = batchResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(Boolean);

      // Categorize results
      successfulResults.forEach(result => {
        if (result) {
          syncedEmployees.push(result.employee);
          if (result.type === 'created') {
            newEmployees.push(result.employee);
          } else if (result.type === 'updated') {
            updatedEmployees.push(result.employee);
          }
        }
      });
    }

    // Prepare response message based on sync results
    let message = '';
    if (existingEmployeeCount === 0) {
      message = `Initial sync completed: ${syncedEmployees.length} employees imported from ERPNext`;
    } else if (newEmployees.length > 0 && updatedEmployees.length > 0) {
      message = `Sync completed: ${newEmployees.length} new employees added, ${updatedEmployees.length} employees updated`;
    } else if (newEmployees.length > 0) {
      message = `Sync completed: ${newEmployees.length} new employees added`;
    } else if (updatedEmployees.length > 0) {
      message = `Sync completed: ${updatedEmployees.length} employees updated`;
    } else {
      message = 'Sync completed: No new data to sync (all employees are up to date)';
    }

    const allErrors = [...errors, ...dbErrors];

    return NextResponse.json({
      success: true,
      message,
      syncedCount: syncedEmployees.length,
      newCount: newEmployees.length,
      updatedCount: updatedEmployees.length,
      totalErpnextCount: erpEmployees.length,
      existingCount: existingEmployeeCount,
      errors: allErrors.length > 0 ? allErrors : undefined,
      performance: {
        totalEmployees: erpnextData.data.length,
        successfulFetches: erpEmployees.length,
        successfulSyncs: syncedEmployees.length,
        fetchErrors: errors.length,
        syncErrors: dbErrors.length,
      }
    });

  } catch (error) {
    console.error('Error syncing employees:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync employees',
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
