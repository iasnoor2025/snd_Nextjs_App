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
    const fileNumber = erpEmployee.employee_number || employeeId || erpnextId;

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
    const bio = erpEmployee.bio || null;

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
      bio,
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
      overtimeFixedRate: erpEmployee.overtime_fixed_rate || 0,
      // Banking information
      bankName: erpEmployee.bank_name || null,
      bankAccountNumber: erpEmployee.bank_account_number || null,
      bankIban: erpEmployee.bank_iban || null,
      // Contract details
      contractHoursPerDay: erpEmployee.contract_hours_per_day || 8,
      contractDaysPerMonth: erpEmployee.contract_days_per_month || 26,
      // Emergency contacts
      emergencyContactName: erpEmployee.emergency_contact_name || null,
      emergencyContactPhone: erpEmployee.emergency_contact_phone || null,
      emergencyContactRelationship: erpEmployee.emergency_contact_relationship || null,
      // Notes
      notes: erpEmployee.notes || bio || null,
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
          employee_number: employee.fileNumber,
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
          bio: employee.bio,
        };

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

      const data = {
        first_name: employee.firstName,
        middle_name: employee.middleName,
        last_name: employee.lastName,
        employee_name:
          `${employee.firstName} ${employee.middleName || ''} ${employee.lastName}`.trim(),
        employee_number: employee.fileNumber,
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
        bio: employee.bio,
        // Additional fields
        address: employee.address,
        city: employee.city,
        food_allowance: employee.foodAllowance,
        housing_allowance: employee.housingAllowance,
        transport_allowance: employee.transportAllowance,
        absent_deduction_rate: employee.absentDeductionRate,
        overtime_rate_multiplier: employee.overtimeRateMultiplier,
        overtime_fixed_rate: employee.overtimeFixedRate,
        bank_name: employee.bankName,
        bank_account_number: employee.bankAccountNumber,
        bank_iban: employee.bankIban,
        contract_hours_per_day: employee.contractHoursPerDay,
        contract_days_per_month: employee.contractDaysPerMonth,
        emergency_contact_name: employee.emergencyContactName,
        emergency_contact_phone: employee.emergencyContactPhone,
        notes: employee.notes,
        // Legal Documents
        passport_number: employee.passportNumber,
        passport_expiry: employee.passportExpiry,
        iqama_number: employee.iqamaNumber,
        // Licenses and certifications
        driving_license_number: employee.drivingLicenseNumber,
        driving_license_expiry: employee.drivingLicenseExpiry,
        driving_license_cost: employee.drivingLicenseCost,
        operator_license_number: employee.operatorLicenseNumber,
        operator_license_expiry: employee.operatorLicenseExpiry,
        operator_license_cost: employee.operatorLicenseCost,
        tuv_certification_number: employee.tuvCertificationNumber,
        tuv_certification_expiry: employee.tuvCertificationExpiry,
        tuv_certification_cost: employee.tuvCertificationCost,
        spsp_license_number: employee.spspLicenseNumber,
        spsp_license_expiry: employee.spspLicenseExpiry,
        spsp_license_cost: employee.spspLicenseCost,
      };

      await this.makeRequest(`/api/resource/Employee/${employee.erpnextId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      return true;
    } catch (error) {
      console.error('Failed to update ERPNext employee:', error);
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
        employee_number: employee.fileNumber,
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
        bio: employee.bio,
      };

      const result = await this.makeRequest('/api/resource/Employee', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return result.data?.name || null;
    } catch (error) {
      console.error('Failed to create ERPNext employee:', error);
      return null;
    }
  }
}
