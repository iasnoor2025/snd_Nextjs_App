// ERPNext client - no database dependency needed

export class ERPNextClient {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_ERPNEXT_URL || '';
    this.apiKey = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY || '';
    this.apiSecret = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET || '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `token ${this.apiKey}:${this.apiSecret}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`ERPNext API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async fetchAllEmployees(): Promise<any[]> {
    const data = await this.makeRequest('/api/resource/Employee?limit_page_length=1000');
    const employees: any[] = [];

    if (data.data) {
      for (const item of data.data) {
        if (item.name) {
          const detailData = await this.makeRequest(
            `/api/resource/Employee/${encodeURIComponent(item.name)}`
          );
          if (detailData.data) {
            employees.push(detailData.data);
          }
        }
      }
    }

    return employees;
  }

  async fetchEmployeeByName(name: string): Promise<any | null> {
    const filters = encodeURIComponent(JSON.stringify([['name', '=', name]]));
    const data = await this.makeRequest(`/api/resource/Employee?filters=${filters}`);
    return data.data?.[0] || null;
  }

  /**
   * Get ERPNext employee field definitions to understand field mapping
   */
  async getEmployeeFields(): Promise<any> {
    try {
      const result = await this.makeRequest('/api/method/frappe.client.get_meta?doctype=Employee');
      return result;
    } catch (error) {
      console.error('💥 Error fetching ERPNext employee fields:', error);
      return null;
    }
  }

  /**
   * Get current employee data from ERPNext to check field values
   */
  async getCurrentEmployee(erpnextId: string): Promise<any> {
    try {
      const result = await this.makeRequest(`/api/resource/Employee/${erpnextId}`);
      return result;
    } catch (error) {
      console.error('💥 Error fetching current employee data:', error);
      return null;
    }
  }

  /**
   * Rename an employee using ERPNext's built-in rename functionality
   * This should work since it's the same method used by the UI
   */
  async renameEmployee(erpnextId: string, newEmployeeNumber: string): Promise<boolean> {
    try {
      console.log('🔍 ERPNext Client - Renaming employee:', {
        erpnextId,
        newEmployeeNumber
      });

      // Use ERPNext's rename method
      const result = await this.makeRequest('/api/method/frappe.client.rename_doc', {
        method: 'POST',
        body: JSON.stringify({
          doctype: 'Employee',
          name: erpnextId,
          new: newEmployeeNumber
        })
      });

      console.log('✅ Rename result:', result);
      return !!result;
    } catch (error) {
      console.error('💥 ERPNext Client Rename Error:', error);
      return false;
    }
  }

  /**
   * Update employee with special handling for employee number
   */
  async updateEmployeeWithRename(employee: any): Promise<boolean> {
    try {
      // If we need to update the employee number, use rename method
      if (employee.fileNumber && employee.erpnextId) {
        // First try to rename the employee
        const renameSuccess = await this.renameEmployee(employee.erpnextId, employee.fileNumber);
        
        if (renameSuccess) {
          console.log('✅ Employee renamed successfully to:', employee.fileNumber);
          // Update the erpnextId to the new name
          employee.erpnextId = employee.fileNumber;
        } else {
          console.log('⚠️ Employee rename failed, falling back to regular update');
        }
      }

      // Continue with regular update for other fields
      return await this.updateEmployee(employee);
    } catch (error) {
      console.error('💥 ERPNext Client Update with Rename Error:', error);
      return false;
    }
  }

  mapToLocal(erpEmployee: any): any {
    const erpnextId = erpEmployee.name || null;
    const employeeId = erpEmployee.employee_number || erpnextId;

    // Name fields
    const firstName = erpEmployee.first_name || '';
    const middleName = erpEmployee.middle_name || '';
    const lastName = erpEmployee.last_name || '';
    const employeeArabicName = erpEmployee.custom_الاسم_الكامل || null;
    const employeeName = erpEmployee.employee_name || null;

    // Salary and contact info
    const basicSalary = erpEmployee.ctc || erpEmployee.basic_salary || 0;
    const cellNumber = erpEmployee.cell_number || null;
    const companyEmail = erpEmployee.company_email || null;
    const personalEmail = erpEmployee.personal_email || null;
    const email = companyEmail || personalEmail;
    
    // Use file_number field from ERPNext if it exists, fallback to employee_number, then erpnextId
    // TODO: Once file_number field is created in ERPNext UI, this will work properly
    const fileNumber = erpEmployee.file_number || erpEmployee.employee_number || employeeId || erpnextId;

    // Department and designation
    const departmentName = erpEmployee.department || null;
    const designationName = erpEmployee.designation || null;

    // Personal information
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

    return {
      erpnextId,
      employeeId,
      fileNumber,
      firstName,
      middleName,
      lastName,
      employeeName,
      basicSalary,
      phone: cellNumber,
      email,
      companyEmail,
      departmentName,
      designationName,
      dateOfBirth,
      gender,
      maritalStatus,
      iqama,
      iqamaExpiry,
      status: status.toLowerCase(),
      dateOfJoining,
      contractEndDate,
      company,
      branch,
      userId,
      employeeArabicName,
      // Additional fields from ERPNext
      address: erpEmployee.address || null,
      city: erpEmployee.city || null,
      state: erpEmployee.state || null,
      country: erpEmployee.country || null,
      postalCode: erpEmployee.postal_code || null,
      nationality: erpEmployee.nationality || null,
      // Salary and benefits
      foodAllowance: erpEmployee.food_allowance || 0,
      housingAllowance: erpEmployee.housing_allowance || 0,
      transportAllowance: erpEmployee.transport_allowance || 0,
      absentDeductionRate: erpEmployee.absent_deduction_rate || 0,
      overtimeRateMultiplier: erpEmployee.overtime_rate_multiplier || 1.5,
              overtimeFixedRate: erpEmployee.overtime_fixed_rate || 6,
      // Banking information
      bankName: erpEmployee.bank_name || null,
      bankAccountNumber: erpEmployee.bank_account_number || null,
      bankIban: erpEmployee.bank_iban || null,
      // Contract details
      contractHoursPerDay: erpEmployee.contract_hours_per_day || 8,
              contractDaysPerMonth: erpEmployee.contract_days_per_month || 30,
      // Emergency contacts
      emergencyContactName: erpEmployee.emergency_contact_name || null,
      emergencyContactPhone: erpEmployee.emergency_contact_phone || null,
      emergencyContactRelationship: erpEmployee.emergency_contact_relationship || null,
      // Notes
      notes: erpEmployee.notes || null,
      // Legal documents
      passportNumber: erpEmployee.passport_number || null,
      passportExpiry: erpEmployee.passport_expiry || null,
      // Licenses and certifications
      drivingLicenseNumber: erpEmployee.driving_license_number || null,
      drivingLicenseExpiry: erpEmployee.driving_license_expiry || null,
      drivingLicenseCost: erpEmployee.driving_license_cost || 0,
      operatorLicenseNumber: erpEmployee.operator_license_number || null,
      operatorLicenseExpiry: erpEmployee.operator_license_expiry || null,
      operatorLicenseCost: erpEmployee.operator_license_cost || 0,
      tuvCertificationNumber: erpEmployee.tuv_certification_number || null,
      tuvCertificationExpiry: erpEmployee.tuv_certification_expiry || null,
      tuvCertificationCost: erpEmployee.tuv_certification_cost || 0,
      spspLicenseNumber: erpEmployee.spsp_license_number || null,
      spspLicenseExpiry: erpEmployee.spsp_license_expiry || null,
      spspLicenseCost: erpEmployee.spsp_license_cost || 0,
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
      accessRestrictedUntil: erpEmployee.access_restricted_until || null,
      accessStartDate: erpEmployee.access_start_date || null,
      accessEndDate: erpEmployee.access_end_date || null,
      accessRestrictionReason: erpEmployee.access_restriction_reason || null,
      // Current location
      currentLocation: erpEmployee.current_location || null,
      // Advance salary fields
      advanceSalaryEligible: erpEmployee.advance_salary_eligible !== false,
      advanceSalaryApprovedThisMonth: erpEmployee.advance_salary_approved_this_month || false,
    };
  }

  async updateEmployee(employee: any): Promise<boolean> {
    try {
      // If erpnext_id is missing, create the employee in ERPNext first
      if (!employee.erpnextId) {
        const data = {
          first_name: employee.firstName,
          middle_name: employee.middleName,
          last_name: employee.lastName,
          employee_name:
            `${employee.firstName} ${employee.middleName || ''} ${employee.lastName}`.trim(),
          // TODO: Add file_number field after user creates it in ERPNext UI
          // file_number: employee.fileNumber,
          ctc: employee.basicSalary,
          cell_number: employee.phone,
          company_email: employee.companyEmail,
          personal_email: employee.email,
          department: employee.department?.name,
          designation: employee.designation?.name,
          date_of_birth: employee.dateOfBirth,
          gender: employee.gender,
          marital_status: employee.maritalStatus,
          custom_iqama: employee.iqamaNumber,
          iqama_expiry_date_en: employee.iqamaExpiry,
          status: employee.status,
          date_of_joining: employee.hireDate,
          contract_end_date: employee.contractEndDate,
          company: employee.company,
          branch: employee.branch,
          custom_الاسم_الكامل: employee.employeeArabicName,
        };

        // Debug logging for file number
        console.log('🔍 ERPNext Client Debug - Creating Employee:', {
          fileNumber: employee.fileNumber,
          firstName: employee.firstName,
          lastName: employee.lastName
        });

        const result = await this.makeRequest('/api/resource/Employee', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        if (result.data?.name) {
          employee.erpnextId = result.data.name;
          // Note: Field update handled separately to avoid field mapping issues
        } else {
          throw new Error('Failed to create ERPNext employee: no name returned');
        }
      }

      // Map local status to ERPNext expected values
      const statusMap: { [key: string]: string } = {
        active: 'Active',
        inactive: 'Inactive',
        on_leave: 'Suspended',
        terminated: 'Left',
        exit: 'Left',
      };
      const localStatus = employee.status?.toLowerCase() || 'active';
      const erpStatus = statusMap[localStatus] || 'Active';

      const data: any = {
        first_name: employee.firstName,
        middle_name: employee.middleName,
        last_name: employee.lastName,
        employee_name:
          `${employee.firstName} ${employee.middleName || ''} ${employee.lastName}`.trim(),
        // TODO: Add file_number field after user creates it in ERPNext UI
        // file_number: employee.fileNumber,
        ctc: employee.basicSalary,
        cell_number: employee.phone,
        company_email: employee.companyEmail,
        personal_email: employee.email,
        department: employee.department?.name,
        designation: employee.designation?.name,
        date_of_birth: employee.dateOfBirth,
        gender: employee.gender,
        marital_status: employee.maritalStatus,
        custom_iqama: employee.iqamaNumber,
        iqama_expiry_date_en: employee.iqamaExpiry,
        status: erpStatus,
        date_of_joining: employee.hireDate,
        contract_end_date: employee.contractEndDate,
        company: employee.company,
        branch: employee.branch,
        custom_الاسم_الكامل: employee.employeeArabicName,
      };

      // Only add additional fields if they exist and have values
      if (employee.address) data.address = employee.address;
      if (employee.city) data.city = employee.city;
      if (employee.foodAllowance) data.food_allowance = employee.foodAllowance;
      if (employee.housingAllowance) data.housing_allowance = employee.housingAllowance;
      if (employee.transportAllowance) data.transport_allowance = employee.transportAllowance;
      if (employee.absentDeductionRate) data.absent_deduction_rate = employee.absentDeductionRate;
      if (employee.overtimeRateMultiplier) data.overtime_rate_multiplier = employee.overtimeRateMultiplier;
      if (employee.overtimeFixedRate) data.overtime_fixed_rate = employee.overtimeFixedRate;
      if (employee.bankName) data.bank_name = employee.bankName;
      if (employee.bankAccountNumber) data.bank_account_number = employee.bankAccountNumber;
      if (employee.bankIban) data.bank_iban = employee.bankIban;
      if (employee.contractHoursPerDay) data.contract_hours_per_day = employee.contractHoursPerDay;
      if (employee.contractDaysPerMonth) data.contract_days_per_month = employee.contractDaysPerMonth;
      if (employee.emergencyContactName) data.emergency_contact_name = employee.emergencyContactName;
      if (employee.emergencyContactPhone) data.emergency_contact_phone = employee.emergencyContactPhone;
      if (employee.notes) data.notes = employee.notes;
      if (employee.passportNumber) data.passport_number = employee.passportNumber;
      if (employee.passportExpiry) data.passport_expiry = employee.passportExpiry;
      if (employee.iqamaNumber) data.iqama_number = employee.iqamaNumber;
      if (employee.drivingLicenseNumber) data.driving_license_number = employee.drivingLicenseNumber;
      if (employee.drivingLicenseExpiry) data.driving_license_expiry = employee.drivingLicenseExpiry;
      if (employee.drivingLicenseCost) data.driving_license_cost = employee.drivingLicenseCost;
      if (employee.operatorLicenseNumber) data.operator_license_number = employee.operatorLicenseNumber;
      if (employee.operatorLicenseExpiry) data.operator_license_expiry = employee.operatorLicenseExpiry;
      if (employee.operatorLicenseCost) data.operator_license_cost = employee.operatorLicenseCost;
      if (employee.tuvCertificationNumber) data.tuv_certification_number = employee.tuvCertificationNumber;
      if (employee.tuvCertificationExpiry) data.tuv_certification_expiry = employee.tuvCertificationExpiry;
      if (employee.tuvCertificationCost) data.tuv_certification_cost = employee.tuvCertificationCost;
      if (employee.spspLicenseNumber) data.spsp_license_number = employee.spspLicenseNumber;
      if (employee.spspLicenseExpiry) data.spsp_license_expiry = employee.spspLicenseExpiry;
      if (employee.spspLicenseCost) data.spsp_license_cost = employee.spspLicenseCost;

      // Debug logging for file number update
      console.log('🔍 ERPNext Client Debug - Updating Employee:', {
        erpnextId: employee.erpnextId,
        fileNumber: employee.fileNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        allFields: Object.keys(data)
      });

      console.log('🔍 ERPNext Client Debug - About to make request to:', `/api/resource/Employee/${employee.erpnextId}`);
      console.log('🔍 ERPNext Client Debug - Request data:', data);

      const updateResponse = await this.makeRequest(`/api/resource/Employee/${employee.erpnextId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      console.log('🔍 ERPNext Client Debug - Update response received:', updateResponse);

      return true;
    } catch (error) {
      console.error('💥 ERPNext Client Error:', error);
      return false;
    }
  }

  async createEmployee(employee: any): Promise<string | null> {
    try {
      const data = {
        first_name: employee.firstName,
        middle_name: employee.middleName,
        last_name: employee.lastName,
        employee_name:
          `${employee.firstName} ${employee.middleName || ''} ${employee.lastName}`.trim(),
        // TODO: Add file_number field after user creates it in ERPNext UI
        // file_number: employee.fileNumber,
        ctc: employee.basicSalary,
        cell_number: employee.phone,
        company_email: employee.companyEmail,
        personal_email: employee.email,
        department: employee.department?.name,
        designation: employee.designation?.name,
        date_of_birth: employee.dateOfBirth,
        gender: employee.gender,
        marital_status: employee.maritalStatus,
        custom_iqama: employee.iqamaNumber,
        iqama_expiry_date_en: employee.iqamaExpiry,
        status: employee.status,
        date_of_joining: employee.hireDate,
        contract_end_date: employee.contractEndDate,
        company: employee.company,
        branch: employee.branch,
        custom_الاسم_الكامل: employee.employeeArabicName,
      };

      // Debug logging for file number creation
      console.log('🔍 ERPNext Client Debug - Creating New Employee:', {
        fileNumber: employee.fileNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullData: data
      });

      const result = await this.makeRequest('/api/resource/Employee', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return result.data?.name || null;
    } catch (error) {
      console.error('💥 ERPNext Client Create Error:', error);
      return null;
    }
  }
}
