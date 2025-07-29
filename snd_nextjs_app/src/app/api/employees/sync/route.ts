import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Batch size for parallel processing
const BATCH_SIZE = 10;
const MAX_CONCURRENT_REQUESTS = 5;

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
    const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
    const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

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
    const erpnextResponse = await fetch(`${ERPNEXT_URL}/api/resource/Employee?limit_page_length=1000`, {
      headers: {
        'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!erpnextResponse.ok) {
      throw new Error(`ERPNext API error: ${erpnextResponse.status} ${erpnextResponse.statusText}`);
    }

    const erpnextData = await erpnextResponse.json();
    console.log(`Found ${erpnextData.data?.length || 0} employees in ERPNext`);

    if (!erpnextData.data || erpnextData.data.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No employees found in ERPNext',
        syncedCount: 0,
        newCount: 0,
        updatedCount: 0,
        totalErpnextCount: 0,
        existingCount: existingEmployeeCount,
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
                { fileNumber: erpEmployee.employee_id },
                { fileNumber: erpEmployee.name }
              ]
            }
          });

          // Parse employee name using ERPNext fields
          const firstName = erpEmployee.first_name || '';
          const middleName = erpEmployee.middle_name || '';
          const lastName = erpEmployee.last_name || '';
          const employeeName = erpEmployee.employee_name || '';
          const employeeArabicName = erpEmployee.custom_الاسم_الكامل || null;

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
                  isActive: true
                }
              });
            } else {
              designation = await prisma.designation.update({
                where: { id: designation.id },
                data: { description: designationName, isActive: true }
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
              firstName: firstName,
              middleName: middleName,
              lastName: lastName,
              employeeId: employeeId,
              fileNumber: fileNumber,
              basicSalary: parseFloat(basicSalary.toString()) || 0,
              status: status.toLowerCase(),
              email: email,
              phone: cellNumber,
              hireDate: dateOfJoining ? new Date(dateOfJoining) : null,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              erpnextId: erpEmployee.name,
              departmentId: departmentId,
              designationId: designationId,
              // Additional fields from ERPNext
              iqamaNumber: iqama,
              iqamaExpiry: iqamaExpiry ? new Date(iqamaExpiry) : null,
              // Address information
              address: erpEmployee.address || null,
              city: erpEmployee.city || null,
              state: erpEmployee.state || null,
              country: erpEmployee.country || null,
              postalCode: erpEmployee.postal_code || null,
              nationality: erpEmployee.nationality || null,
              // Salary and benefits
              foodAllowance: parseFloat(erpEmployee.food_allowance?.toString() || '0'),
              housingAllowance: parseFloat(erpEmployee.housing_allowance?.toString() || '0'),
              transportAllowance: parseFloat(erpEmployee.transport_allowance?.toString() || '0'),
              absentDeductionRate: parseFloat(erpEmployee.absent_deduction_rate?.toString() || '0'),
              overtimeRateMultiplier: parseFloat(erpEmployee.overtime_rate_multiplier?.toString() || '1.5'),
              overtimeFixedRate: parseFloat(erpEmployee.overtime_fixed_rate?.toString() || '0'),
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
              passportExpiry: erpEmployee.passport_expiry ? new Date(erpEmployee.passport_expiry) : null,
              // Licenses and certifications
              drivingLicenseNumber: erpEmployee.driving_license_number || null,
              drivingLicenseExpiry: erpEmployee.driving_license_expiry ? new Date(erpEmployee.driving_license_expiry) : null,
              drivingLicenseCost: parseFloat(erpEmployee.driving_license_cost?.toString() || '0'),
              operatorLicenseNumber: erpEmployee.operator_license_number || null,
              operatorLicenseExpiry: erpEmployee.operator_license_expiry ? new Date(erpEmployee.operator_license_expiry) : null,
              operatorLicenseCost: parseFloat(erpEmployee.operator_license_cost?.toString() || '0'),
              tuvCertificationNumber: erpEmployee.tuv_certification_number || null,
              tuvCertificationExpiry: erpEmployee.tuv_certification_expiry ? new Date(erpEmployee.tuv_certification_expiry) : null,
              tuvCertificationCost: parseFloat(erpEmployee.tuv_certification_cost?.toString() || '0'),
              spspLicenseNumber: erpEmployee.spsp_license_number || null,
              spspLicenseExpiry: erpEmployee.spsp_license_expiry ? new Date(erpEmployee.spsp_license_expiry) : null,
              spspLicenseCost: parseFloat(erpEmployee.spsp_license_cost?.toString() || '0'),
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
              accessRestrictedUntil: erpEmployee.access_restricted_until ? new Date(erpEmployee.access_restricted_until) : null,
              accessStartDate: erpEmployee.access_start_date ? new Date(erpEmployee.access_start_date) : null,
              accessEndDate: erpEmployee.access_end_date ? new Date(erpEmployee.access_end_date) : null,
              accessRestrictionReason: erpEmployee.access_restriction_reason || null,
              // Current location
              currentLocation: erpEmployee.current_location || null,
              // Advance salary fields
              advanceSalaryEligible: erpEmployee.advance_salary_eligible !== false,
              advanceSalaryApprovedThisMonth: erpEmployee.advance_salary_approved_this_month || false,
            };

          if (existingEmployee) {
            // Check if data has changed - comprehensive comparison
            const hasChanges =
              existingEmployee.firstName !== firstName ||
              existingEmployee.middleName !== middleName ||
              existingEmployee.lastName !== lastName ||
              existingEmployee.employeeId !== employeeId ||
              existingEmployee.fileNumber !== fileNumber ||
              existingEmployee.basicSalary.toString() !== parseFloat(basicSalary.toString()).toString() ||
              existingEmployee.status !== status.toLowerCase() ||
              existingEmployee.email !== email ||
              existingEmployee.phone !== cellNumber ||
              existingEmployee.dateOfBirth?.toISOString() !== (dateOfBirth ? new Date(dateOfBirth).toISOString() : null) ||
              existingEmployee.hireDate?.toISOString() !== (dateOfJoining ? new Date(dateOfJoining).toISOString() : null) ||
              existingEmployee.departmentId !== departmentId ||
              existingEmployee.designationId !== designationId ||
              existingEmployee.iqamaNumber !== iqama ||
              existingEmployee.iqamaExpiry?.toISOString() !== (iqamaExpiry ? new Date(iqamaExpiry).toISOString() : null) ||
              existingEmployee.foodAllowance.toString() !== parseFloat(erpEmployee.food_allowance?.toString() || '0').toString() ||
              existingEmployee.housingAllowance.toString() !== parseFloat(erpEmployee.housing_allowance?.toString() || '0').toString() ||
              existingEmployee.transportAllowance.toString() !== parseFloat(erpEmployee.transport_allowance?.toString() || '0').toString() ||
              existingEmployee.bankName !== erpEmployee.bank_name ||
              existingEmployee.bankAccountNumber !== erpEmployee.bank_account_number ||
              existingEmployee.bankIban !== erpEmployee.bank_iban ||
              existingEmployee.contractHoursPerDay !== parseInt(erpEmployee.contract_hours_per_day?.toString() || '8') ||
              existingEmployee.contractDaysPerMonth !== parseInt(erpEmployee.contract_days_per_month?.toString() || '26') ||
              existingEmployee.emergencyContactName !== erpEmployee.emergency_contact_name ||
              existingEmployee.emergencyContactPhone !== erpEmployee.emergency_contact_phone ||
              existingEmployee.emergencyContactRelationship !== erpEmployee.emergency_contact_relationship ||
              existingEmployee.notes !== (erpEmployee.notes || bio) ||
              existingEmployee.passportNumber !== erpEmployee.passport_number ||
              existingEmployee.passportExpiry?.toISOString() !== (erpEmployee.passport_expiry ? new Date(erpEmployee.passport_expiry).toISOString() : null) ||
              existingEmployee.drivingLicenseNumber !== erpEmployee.driving_license_number ||
              existingEmployee.drivingLicenseExpiry?.toISOString() !== (erpEmployee.driving_license_expiry ? new Date(erpEmployee.driving_license_expiry).toISOString() : null) ||
              (existingEmployee.drivingLicenseCost?.toString() || '0') !== parseFloat(erpEmployee.driving_license_cost?.toString() || '0').toString() ||
              existingEmployee.operatorLicenseNumber !== erpEmployee.operator_license_number ||
              existingEmployee.operatorLicenseExpiry?.toISOString() !== (erpEmployee.operator_license_expiry ? new Date(erpEmployee.operator_license_expiry).toISOString() : null) ||
              (existingEmployee.operatorLicenseCost?.toString() || '0') !== parseFloat(erpEmployee.operator_license_cost?.toString() || '0').toString() ||
              existingEmployee.tuvCertificationNumber !== erpEmployee.tuv_certification_number ||
              existingEmployee.tuvCertificationExpiry?.toISOString() !== (erpEmployee.tuv_certification_expiry ? new Date(erpEmployee.tuv_certification_expiry).toISOString() : null) ||
              (existingEmployee.tuvCertificationCost?.toString() || '0') !== parseFloat(erpEmployee.tuv_certification_cost?.toString() || '0').toString() ||
              existingEmployee.spspLicenseNumber !== erpEmployee.spsp_license_number ||
              existingEmployee.spspLicenseExpiry?.toISOString() !== (erpEmployee.spsp_license_expiry ? new Date(erpEmployee.spsp_license_expiry).toISOString() : null) ||
              (existingEmployee.spspLicenseCost?.toString() || '0') !== parseFloat(erpEmployee.spsp_license_cost?.toString() || '0').toString() ||
              existingEmployee.isOperator !== (erpEmployee.is_operator || false) ||
              existingEmployee.currentLocation !== erpEmployee.current_location ||
              existingEmployee.advanceSalaryEligible !== (erpEmployee.advance_salary_eligible !== false) ||
              existingEmployee.advanceSalaryApprovedThisMonth !== (erpEmployee.advance_salary_approved_this_month || false);

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
            console.log('Creating new employee:', employeeData.employeeId);
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
