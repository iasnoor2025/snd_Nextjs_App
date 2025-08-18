import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees as employeesTable, designations as designationsTable, departments as departmentsTable } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';

// Batch size for parallel processing
const BATCH_SIZE = 10;

export async function POST() {
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
      // Test with a simple query
      await db.select({ count: sql<number>`count(*)` }).from(employeesTable);
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
    const existingEmployeeCountResult = await db.select({ count: sql<number>`count(*)` }).from(employeesTable);
    const existingEmployeeCount = Number(existingEmployeeCountResult[0]?.count ?? 0);
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
      let alternativeData: any[] | null = null;
      
      for (const key of possibleDataKeys) {
        if (erpnextData[key] && Array.isArray(erpnextData[key]) && erpnextData[key].length > 0) {
          console.log(`Found alternative data in key: ${key}`, erpnextData[key].length);
          alternativeData = erpnextData[key];
          break;
        }
      }
      
      if (!alternativeData) {
        return NextResponse.json(
          {
            success: false,
            message: 'No employee data found in ERPNext response. Please check the API endpoint and response format.',
            responseStructure: Object.keys(erpnextData),
            responseData: erpnextData
          },
          { status: 400 }
        );
      }
      
      erpnextData.data = alternativeData;
    }

    // Process employees in batches for better performance
    const erpEmployees: any[] = [];
    const errors: Array<{employee: string, error: string}> = [];

    // Process employees in batches
    for (let i = 0; i < erpnextData.data.length; i += BATCH_SIZE) {
      const batch = erpnextData.data.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(erpnextData.data.length / BATCH_SIZE)}`);

      // Process batch in parallel with limited concurrency
      const batchPromises = batch.map(async (item: any) => {
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
          // Check if employee already exists - FIXED: using correct column names
          const existingEmployee = await db.select().from(employeesTable).where(
            sql`file_number = ${erpEmployee.employee_number || erpEmployee.name} OR erpnext_id = ${erpEmployee.employee_number || erpEmployee.name}`
          );

          // Parse employee name using ERPNext fields
          let firstName = (erpEmployee.first_name || '').trim();
          let middleName = (erpEmployee.middle_name || '').trim();
          let lastName = (erpEmployee.last_name || '').trim();

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

          // Get employee identification - handle HR-EMP-00003=003 format
          const employeeId = erpEmployee.employee_number || erpEmployee.name;
          // Extract the numeric part from HR-EMP-00003=003 format
          let fileNumber = erpEmployee.employee_number || employeeId;
          if (fileNumber && typeof fileNumber === 'string') {
            // Handle HR-EMP-00003=003 format - extract the numeric part
            const match = fileNumber.match(/HR-EMP-(\d+)/);
            if (match) {
              fileNumber = match[1]; // Extract just the numeric part (e.g., "00003")
            }
          }

          // Get additional information
          const departmentName = erpEmployee.department || null;
          const designationName = erpEmployee.designation || null;
          const dateOfBirth = erpEmployee.date_of_birth || null;
          const iqama = erpEmployee.custom_iqama || null;
          const iqamaExpiry = erpEmployee.iqama_expiry_date_en || null;
          const status = erpEmployee.status || 'Active';
          const dateOfJoining = erpEmployee.date_of_joining || null;
          const bio = erpEmployee.bio || null;

          // Map department and designation to IDs
          let departmentId = null;
          let designationId = null;

          if (designationName && designationName.trim()) {
            let designation: any = await db.select().from(designationsTable).where(
              sql`name = ${designationName.trim()}`
            );

            if (designation.length === 0) {
              const newDesignation = await db.insert(designationsTable).values({
                name: designationName.trim(),
                description: designationName.trim(),
                isActive: true,
                updatedAt: new Date().toISOString().split('T')[0]
              }).returning();
              designation = newDesignation;
            } else {
              const updatedDesignation = await db.update(designationsTable).set({
                description: designationName.trim(),
                isActive: true,
                updatedAt: new Date().toISOString().split('T')[0]
              }).where(sql`id = ${designation[0].id}`).returning();
              designation = updatedDesignation;
            }
            designationId = designation[0].id;
          }

          if (departmentName && departmentName.trim()) {
            let department: any[] = await db.select().from(departmentsTable).where(
              sql`name = ${departmentName.trim()}`
            );
            if (department.length === 0) {
              const newDepartment = await db.insert(departmentsTable).values({
                name: departmentName.trim(),
                description: departmentName.trim(),
                active: true,
                updatedAt: new Date().toISOString().split('T')[0]
              }).returning();
              department = newDepartment;
            } else {
              const updatedDepartment = await db.update(departmentsTable).set({
                description: departmentName.trim(),
                active: true,
                updatedAt: new Date().toISOString().split('T')[0]
              }).where(sql`id = ${department[0].id}`).returning();
              department = updatedDepartment;
            }
            departmentId = department[0].id;
          }

          // FIXED: Using camelCase field names to match database schema
          const employeeData = {
            firstName: firstName,
            middleName: middleName,
            lastName: lastName,
            erpnextId: erpEmployee.name,
            fileNumber: fileNumber,
            basicSalary: String(parseFloat(basicSalary.toString()) || 0),
            status: status.toLowerCase(),
            email: email,
            phone: cellNumber,
            hireDate: dateOfJoining ? (typeof dateOfJoining === 'string' ? new Date(dateOfJoining).toISOString().split('T')[0] : dateOfJoining) : null,
            dateOfBirth: dateOfBirth ? (typeof dateOfBirth === 'string' ? new Date(dateOfBirth).toISOString().split('T')[0] : dateOfBirth) : null,
            departmentId: departmentId,
            designationId: designationId,
            // Additional fields from ERPNext
            iqamaNumber: iqama,
            iqamaExpiry: iqamaExpiry ? new Date(iqamaExpiry).toISOString().split('T')[0] : null,
            // Address information
            address: erpEmployee.address || null,
            city: erpEmployee.city || null,
            state: erpEmployee.state || null,
            country: erpEmployee.country || null,
            postalCode: erpEmployee.postal_code || null,
            nationality: erpEmployee.nationality || null,
            // Salary and benefits
            foodAllowance: String(parseFloat(erpEmployee.food_allowance?.toString() || '0')),
            housingAllowance: String(parseFloat(erpEmployee.housing_allowance?.toString() || '0')),
            transportAllowance: String(parseFloat(erpEmployee.transport_allowance?.toString() || '0')),
            absentDeductionRate: String(parseFloat(erpEmployee.absent_deduction_rate?.toString() || '0')),
            overtimeRateMultiplier: String(parseFloat(erpEmployee.overtime_rate_multiplier?.toString() || '1.5')),
            overtimeFixedRate: String(parseFloat(erpEmployee.overtime_fixed_rate?.toString() || '0')),
            // Banking information
            bankName: erpEmployee.bank_name || null,
            bankAccountNumber: erpEmployee.bank_account_number || null,
            bankIban: erpEmployee.bank_iban || null,
            // Contract details
            contractHoursPerDay: parseInt(erpEmployee.contract_hours_per_day?.toString() || '8'),
            contractDaysPerMonth: parseInt(erpEmployee.contract_days_per_month?.toString() || '26'),
            // Emergency contacts
            emergencyContactName: erpEmployee.emergency_contact_name || null,
            emergencyContactPhone: erpEmployee.emergency_contact_phone || null,
            emergencyContactRelationship: erpEmployee.emergency_contact_relationship || null,
            // Notes
            notes: erpEmployee.notes || bio || null,
            // Legal documents
            passportNumber: erpEmployee.passport_number || null,
            passportExpiry: erpEmployee.passport_expiry ? new Date(erpEmployee.passport_expiry).toISOString().split('T')[0] : null,
            // Licenses and certifications
            drivingLicenseNumber: erpEmployee.driving_license_number || null,
            drivingLicenseExpiry: erpEmployee.driving_license_expiry ? new Date(erpEmployee.driving_license_expiry).toISOString().split('T')[0] : null,
            drivingLicenseCost: String(parseFloat(erpEmployee.driving_license_cost?.toString() || '0')),
            operatorLicenseNumber: erpEmployee.operator_license_number || null,
            operatorLicenseExpiry: erpEmployee.operator_license_expiry ? new Date(erpEmployee.operator_license_expiry).toISOString().split('T')[0] : null,
            operatorLicenseCost: String(parseFloat(erpEmployee.operator_license_cost?.toString() || '0')),
            tuvCertificationNumber: erpEmployee.tuv_certification_number || null,
            tuvCertificationExpiry: erpEmployee.tuv_certification_expiry ? new Date(erpEmployee.tuv_certification_expiry).toISOString().split('T')[0] : null,
            tuvCertificationCost: String(parseFloat(erpEmployee.tuv_certification_cost?.toString() || '0')),
            spspLicenseNumber: erpEmployee.spsp_license_number || null,
            spspLicenseExpiry: erpEmployee.spsp_license_expiry ? new Date(erpEmployee.spsp_license_expiry).toISOString().split('T')[0] : null,
            spspLicenseCost: String(parseFloat(erpEmployee.spsp_license_cost?.toString() || '0')),
            // File paths
            drivingLicenseFile: erpEmployee.driving_license_file || null,
            operatorLicenseFile: erpEmployee.operator_license_file || null,
            tuvCertificationFile: erpEmployee.tuv_certification_file || null,
            spspLicenseFile: erpEmployee.spsp_license_file || null,
            passportFile: erpEmployee.passport_file || null,
            iqamaFile: erpEmployee.iqama_file || null,
            // Custom certifications
            customCertifications: erpEmployee.custom_certifications || null,
            // Operator status
            isOperator: erpEmployee.is_operator || false,
            // Access control
            accessRestrictedUntil: erpEmployee.access_restricted_until ? new Date(erpEmployee.access_restricted_until).toISOString().split('T')[0] : null,
            accessStartDate: erpEmployee.access_start_date ? new Date(erpEmployee.access_start_date).toISOString().split('T')[0] : null,
            accessEndDate: erpEmployee.access_end_date ? new Date(erpEmployee.access_end_date).toISOString().split('T')[0] : null,
            accessRestrictionReason: erpEmployee.access_restriction_reason || null,
            // Current location
            currentLocation: erpEmployee.current_location || null,
            // Advance salary fields
            advanceSalaryEligible: erpEmployee.advance_salary_eligible !== false,
            advanceSalaryApprovedThisMonth: erpEmployee.advance_salary_approved_this_month || false,
            updatedAt: new Date().toISOString().split('T')[0]
          };

          if (existingEmployee.length > 0) {
            const existingEmployeeData = existingEmployee[0];
            if (!existingEmployeeData) {
              console.log('Creating new employee (no existing data):', employeeData.erpnextId);
              
              // Use the already transformed data directly
              const newEmployee = await db.insert(employeesTable).values(employeeData).returning();
              return { type: 'created', employee: (newEmployee as any[])[0] };
            }
            
            // Check if data has changed - comprehensive comparison
            const hasChanges =
              existingEmployeeData.firstName !== firstName ||
              existingEmployeeData.middleName !== middleName ||
              existingEmployeeData.lastName !== lastName ||
              existingEmployeeData.erpnextId !== employeeId ||
              existingEmployeeData.fileNumber !== fileNumber ||
              existingEmployeeData.basicSalary?.toString() !== parseFloat(basicSalary.toString()).toString() ||
              existingEmployeeData.status !== status.toLowerCase() ||
              existingEmployeeData.email !== email ||
              existingEmployeeData.phone !== cellNumber ||
              existingEmployeeData.dateOfBirth?.toISOString() !== (dateOfBirth ? new Date(dateOfBirth).toISOString() : null) ||
              existingEmployeeData.hireDate?.toISOString() !== (dateOfJoining ? new Date(dateOfJoining).toISOString() : null) ||
              existingEmployeeData.departmentId !== departmentId ||
              existingEmployeeData.designationId !== designationId ||
              existingEmployeeData.iqamaNumber !== iqama ||
              existingEmployeeData.iqamaExpiry?.toISOString() !== (iqamaExpiry ? new Date(iqamaExpiry).toISOString() : null);

            if (hasChanges) {
              console.log('Updating existing employee:', existingEmployeeData.id);
              const updatedEmployee = await db.update(employeesTable).set(employeeData).where(sql`id = ${existingEmployeeData.id}`).returning();
              return { type: 'updated', employee: updatedEmployee[0] };
            } else {
              console.log('Employee unchanged, skipping:', existingEmployeeData.id);
              return { type: 'unchanged', employee: existingEmployeeData };
            }
          } else {
            console.log('Creating new employee:', employeeData.erpnextId);
            const newEmployeeResult = await db.insert(employeesTable).values(employeeData).returning();
            return { type: 'created', employee: (newEmployeeResult as any[])[0] };
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

    // Sort synced employees by file number for better organization
    const sortedSyncedEmployees = [...syncedEmployees].sort((a, b) => {
      const fileNumA = parseInt(a.fileNumber || '0') || 0;
      const fileNumB = parseInt(b.fileNumber || '0') || 0;
      return fileNumA - fileNumB;
    });

    // Prepare response message based on sync results
    let message = '';
    if (existingEmployeeCount === 0) {
      message = `Initial sync completed: ${sortedSyncedEmployees.length} employees imported from ERPNext`;
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
      syncedCount: sortedSyncedEmployees.length,
      newCount: newEmployees.length,
      updatedCount: updatedEmployees.length,
      totalErpnextCount: erpEmployees.length,
      existingCount: existingEmployeeCount,
      // Return sorted employees for better organization
      syncedEmployees: sortedSyncedEmployees,
      errors: allErrors.length > 0 ? allErrors : undefined,
      performance: {
        totalEmployees: erpnextData.data.length,
        successfulFetches: erpEmployees.length,
        successfulSyncs: sortedSyncedEmployees.length,
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
    // No explicit disconnect needed for drizzle-orm, it manages its own pool
  }
}
