import { db } from '@/lib/db';
import {
  employees,
  payrolls,
  finalSettlements,
  employeeSalaries,
  timesheets,
  designations,
  departments
} from '@/lib/drizzle/schema';
import { eq, desc, and, like, gte, lte } from 'drizzle-orm';

export interface UnpaidSalaryInfo {
  employeeId: number;
  unpaidMonths: number;
  unpaidAmount: number;
  lastPaidMonth?: number | undefined;
  lastPaidYear?: number | undefined;
  lastPaidDate?: string | undefined;
  totalUnpaidMonths: number;
}

export interface EndOfServiceCalculation {
  totalServiceYears: number;
  totalServiceMonths: number;
  totalServiceDays: number;
  endOfServiceBenefit: number;
  benefitCalculationMethod: 'resigned' | 'terminated' | 'vacation';
  calculationDetails: {
    yearsForCalculation: number;
    monthsForCalculation: number;
    fullBenefitYears: number;
    halfBenefitYears: number;
    reductionPercentage: number;
  };
}

export interface AbsentCalculation {
  absentDays: number;
  absentDeduction: number;
  calculationPeriod: 'last_month' | 'unpaid_period' | 'custom';
  startDate?: string;
  endDate?: string;
  dailyRate: number;
  calculationDetails: {
    totalDaysInPeriod: number;
    workingDaysInPeriod: number;
    absentDates: string[];
  };
}

export interface FinalSettlementData {
  settlementType: 'vacation' | 'exit';
  employee: {
    id: number;
    name: string;
    fileNumber?: string;
    iqamaNumber?: string;
    nationality?: string;
    designation?: string;
    department?: string;
    hireDate: string;
    basicSalary?: number;
  };
  serviceDetails: {
    totalServiceYears: number;
    totalServiceMonths: number;
    totalServiceDays: number;
    lastWorkingDate: string;
  };
  vacationDetails?: {
    vacationStartDate: string;
    vacationEndDate: string;
    expectedReturnDate: string;
    vacationDays: number;
    vacationAllowance: number;
  };
  salaryInfo: UnpaidSalaryInfo;
  endOfServiceBenefit: EndOfServiceCalculation;
  absentCalculation: AbsentCalculation;
  finalCalculation: {
    grossAmount: number;
    totalDeductions: number;
    netAmount: number;
    breakdown: {
      unpaidSalaries: number;
      endOfServiceBenefit: number;
      accruedVacation: number;
      vacationAllowance: number;
      overtimeAmount: number;
      otherBenefits: number;
      pendingAdvances: number;
      equipmentDeductions: number;
      otherDeductions: number;
      absentDeduction: number;
    };
  };
}

export class FinalSettlementService {
  /**
   * Check how many months an employee hasn't received salary until today
   */
  static async getUnpaidSalaryInfo(employeeId: number): Promise<UnpaidSalaryInfo> {
    try {
      // New rule: unpaid salary always starts from October 2025 (paid up to September 2025)
      // We intentionally ignore any manual adjustments or payroll history for this calculation.

      // Get employee basic salary and hire date
      const employee = await db
        .select({
          id: employees.id,
          hireDate: employees.hireDate,
          basicSalary: employees.basicSalary,
        })
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);

      if (!employee.length) {
        throw new Error(`Employee not found with ID: ${employeeId}`);
      }

      const emp = employee[0]!;
      const hireDate = new Date(emp.hireDate!);
      const today = new Date();

      // Get the latest salary information from employee_salaries table
      const latestSalary = await db
        .select({
          basicSalary: employeeSalaries.basicSalary,
          allowances: employeeSalaries.allowances,
          effectiveDate: employeeSalaries.effectiveDate,
        })
        .from(employeeSalaries)
        .where(eq(employeeSalaries.employeeId, employeeId))
        .orderBy(desc(employeeSalaries.effectiveDate))
        .limit(1);

      const currentBasicSalary = latestSalary.length > 0
        ? parseFloat(latestSalary[0]!.basicSalary)
        : parseFloat(emp.basicSalary || '0');

      const currentAllowances = latestSalary.length > 0
        ? parseFloat(latestSalary[0]!.allowances || '0')
        : 0;

      // Force: unpaid starts from September 2025 (meaning paid up to August 2025)
      const lastPaidMonth: number = 8; // August
      const lastPaidYear: number = 2025;
      const startDate = new Date(2025, 8, 1); // Sep 1, 2025
      // Include the start month (September) in the count
      const monthsFromStart = this.calculateMonthsBetween(startDate, today);
      const totalUnpaidMonths = Math.max(0, monthsFromStart + 1);

      const unpaidAmount = Math.max(0, totalUnpaidMonths) * (currentBasicSalary + currentAllowances);

      return {
        employeeId,
        unpaidMonths: Math.max(0, totalUnpaidMonths),
        unpaidAmount,
        lastPaidMonth,
        lastPaidYear,
        lastPaidDate: new Date(lastPaidYear, lastPaidMonth - 1, 1).toISOString().split('T')[0],
        totalUnpaidMonths: Math.max(0, totalUnpaidMonths),
      };
    } catch (error) {
      console.error('Error calculating unpaid salary info:', error);
      throw error;
    }
  }

  static calculateEndOfServiceBenefit(
    hireDate: Date,
    lastWorkingDate: Date,
    basicSalary: number,
    isResignation = false
  ): EndOfServiceCalculation {
    const serviceDetails = this.calculateServicePeriod(hireDate, lastWorkingDate);
    const totalYearsDecimal = serviceDetails.totalServiceYears + (serviceDetails.totalServiceMonths / 12);

    let endOfServiceBenefit = 0;
    let reductionPercentage = 0;
    let fullBenefitYears = 0;
    let halfBenefitYears = 0;

    // Saudi Labor Law calculation
    if (totalYearsDecimal >= 10) {
      // 10+ years: Full benefit
      if (totalYearsDecimal <= 5) {
        halfBenefitYears = totalYearsDecimal;
        endOfServiceBenefit = (basicSalary / 2) * totalYearsDecimal;
      } else {
        halfBenefitYears = 5;
        fullBenefitYears = totalYearsDecimal - 5;
        endOfServiceBenefit = (basicSalary / 2) * 5 + basicSalary * fullBenefitYears;
      }
      reductionPercentage = isResignation ? 0 : 0; // Full benefit
    } else if (totalYearsDecimal >= 5) {
      // 5-10 years
      halfBenefitYears = 5;
      fullBenefitYears = totalYearsDecimal - 5;
      endOfServiceBenefit = (basicSalary / 2) * 5 + basicSalary * fullBenefitYears;
      reductionPercentage = isResignation ? 33.33 : 0; // 2/3 for resignation
      endOfServiceBenefit = endOfServiceBenefit * (isResignation ? 2 / 3 : 1);
    } else if (totalYearsDecimal >= 2) {
      // 2-5 years
      halfBenefitYears = totalYearsDecimal;
      endOfServiceBenefit = (basicSalary / 2) * totalYearsDecimal;
      reductionPercentage = isResignation ? 66.67 : 0; // 1/3 for resignation
      endOfServiceBenefit = endOfServiceBenefit * (isResignation ? 1 / 3 : 1);
    } else {
      // Less than 2 years: No benefit for resignation, full for termination
      halfBenefitYears = isResignation ? 0 : totalYearsDecimal;
      endOfServiceBenefit = isResignation ? 0 : (basicSalary / 2) * totalYearsDecimal;
      reductionPercentage = isResignation ? 100 : 0;
    }

    return {
      totalServiceYears: serviceDetails.totalServiceYears,
      totalServiceMonths: serviceDetails.totalServiceMonths,
      totalServiceDays: serviceDetails.totalServiceDays,
      endOfServiceBenefit: Math.round(endOfServiceBenefit * 100) / 100,
      benefitCalculationMethod: isResignation ? 'resigned' : 'terminated',
      calculationDetails: {
        yearsForCalculation: totalYearsDecimal,
        monthsForCalculation: serviceDetails.totalServiceMonths,
        fullBenefitYears,
        halfBenefitYears,
        reductionPercentage,
      },
    };
  }

  /**
   * Calculate service period between two dates
   */
  static calculateServicePeriod(startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return {
      totalServiceYears: years,
      totalServiceMonths: months,
      totalServiceDays: days,
    };
  }

  /**
   * Calculate months between two dates
   */
  static calculateMonthsBetween(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();

    return yearDiff * 12 + monthDiff;
  }

  /**
   * Get the actual number of days in a month for a given date
   */
  static getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * Calculate vacation allowance based on actual days in each month
   * If a month has 31 days, it counts 31 days; if 30, then 30, etc.
   */
  static calculateVacationAllowanceByMonthlyDays(
    vacationStartDate: string,
    vacationEndDate: string,
    basicSalary: number
  ): number {
    const start = new Date(vacationStartDate);
    const end = new Date(vacationEndDate);
    let totalAllowance = 0;

    // Iterate through each month that the vacation spans
    let currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (currentMonth <= endMonth) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      // Get the first and last day of the current month
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      // Calculate the actual number of days in this month
      const daysInMonth = lastDayOfMonth.getDate();

      // Determine the start and end dates for vacation days in this month
      const monthStart = start > firstDayOfMonth ? start : firstDayOfMonth;
      const monthEnd = end < lastDayOfMonth ? end : lastDayOfMonth;

      // Calculate the number of vacation days in this month (inclusive)
      const daysInThisMonth = Math.floor((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Only calculate if there are days in this month
      if (daysInThisMonth > 0) {
        // Calculate daily rate based on actual days in this month
        const dailyRate = basicSalary / daysInMonth;

        // Add allowance for this month
        totalAllowance += dailyRate * daysInThisMonth;
      }

      // Move to the first day of the next month
      currentMonth = new Date(year, month + 1, 1);
    }

    return Math.round(totalAllowance * 100) / 100;
  }

  /**
   * Calculate vacation settlement for annual leave
   */
  static async generateVacationSettlementData(
    employeeId: number,
    vacationStartDate: string,
    vacationEndDate: string,
    expectedReturnDate: string,
    additionalData?: {
      vacationDurationMonths?: number; // Vacation duration in months
      manualUnpaidSalary?: number; // Manual unpaid salary override
      overtimeHours?: number; // Overtime hours
      overtimeAmount?: number; // Manual overtime amount override
      manualVacationAllowance?: number;
      otherBenefits?: number;
      otherBenefitsDescription?: string;
      pendingAdvances?: number;
      equipmentDeductions?: number;
      otherDeductions?: number;
      otherDeductionsDescription?: string;
      absentCalculationPeriod?: 'last_month' | 'unpaid_period' | 'custom';
      absentCalculationStartDate?: string;
      absentCalculationEndDate?: string;
      manualAbsentDays?: number;
    }
  ): Promise<FinalSettlementData> {
    try {
      // Get employee details with department and designation names
      const employeeData = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          middleName: employees.middleName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          iqamaNumber: employees.iqamaNumber,
          nationality: employees.nationality,
          hireDate: employees.hireDate,
          basicSalary: employees.basicSalary,
          departmentName: departments.name,
          designationName: designations.name,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(designations, eq(employees.designationId, designations.id))
        .where(eq(employees.id, employeeId))
        .limit(1);

      if (!employeeData.length) {
        throw new Error('Employee not found');
      }

      const emp = employeeData[0]!;
      const hireDate = new Date(emp.hireDate!);
      const vacationStart = new Date(vacationStartDate);
      const vacationEnd = new Date(vacationEndDate);

      // Calculate vacation days
      const vacationDays = additionalData?.vacationDurationMonths
        ? Math.round(additionalData.vacationDurationMonths * 30) // Convert months to days (30 days per month)
        : Math.ceil((vacationEnd.getTime() - vacationStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Get unpaid salary information
      const salaryInfo = await this.getUnpaidSalaryInfo(employeeId);

      // Override unpaid salary amount if manual value is provided
      if (additionalData?.manualUnpaidSalary && additionalData.manualUnpaidSalary > 0) {
        salaryInfo.unpaidAmount = additionalData.manualUnpaidSalary;
        // Calculate months based on manual amount and current salary
        const currentSalary = parseFloat(emp.basicSalary || '0');
        if (currentSalary > 0) {
          salaryInfo.unpaidMonths = Math.round((additionalData.manualUnpaidSalary / currentSalary) * 10) / 10; // Round to 1 decimal
          salaryInfo.totalUnpaidMonths = salaryInfo.unpaidMonths;
        }
      }

      // Get latest salary for vacation allowance calculation and basic salary display
      const latestSalary = await db
        .select({
          basicSalary: employeeSalaries.basicSalary,
        })
        .from(employeeSalaries)
        .where(eq(employeeSalaries.employeeId, employeeId))
        .orderBy(desc(employeeSalaries.effectiveDate))
        .limit(1);

      const currentBasicSalary = latestSalary.length > 0
        ? parseFloat(latestSalary[0]!.basicSalary)
        : parseFloat(emp.basicSalary || '0');

      // Calculate vacation allowance based on actual days in each month
      // Use manual vacation allowance if provided, otherwise calculate based on monthly days
      const vacationAllowance = additionalData?.manualVacationAllowance && additionalData.manualVacationAllowance > 0
        ? additionalData.manualVacationAllowance
        : this.calculateVacationAllowanceByMonthlyDays(vacationStartDate, vacationEndDate, currentBasicSalary);

      // Calculate service details (for record keeping, but no end-of-service benefit for vacation)
      const serviceDetails = this.calculateServicePeriod(hireDate, vacationStart);

      // No end-of-service benefits for vacation settlements
      const endOfServiceBenefit = {
        totalServiceYears: serviceDetails.totalServiceYears,
        totalServiceMonths: serviceDetails.totalServiceMonths,
        totalServiceDays: serviceDetails.totalServiceDays,
        endOfServiceBenefit: 0,
        benefitCalculationMethod: 'vacation' as const,
        calculationDetails: {
          yearsForCalculation: 0,
          monthsForCalculation: 0,
          fullBenefitYears: 0,
          halfBenefitYears: 0,
          reductionPercentage: 0,
        },
      };

      // Calculate absent days and deduction
      const absentCalculation = await this.calculateAbsentDays(
        employeeId,
        additionalData?.absentCalculationPeriod || 'last_month',
        additionalData?.absentCalculationStartDate,
        additionalData?.absentCalculationEndDate,
        currentBasicSalary
      );

      // Override absent days if manual value is provided
      if (additionalData?.manualAbsentDays && additionalData.manualAbsentDays > 0) {
        absentCalculation.absentDays = additionalData.manualAbsentDays;
        absentCalculation.absentDeduction = additionalData.manualAbsentDays * absentCalculation.dailyRate;
      }

      // Calculate overtime amount
      let overtimeAmount = 0;
      if (additionalData?.overtimeAmount && additionalData.overtimeAmount > 0) {
        // Use manual overtime amount override
        overtimeAmount = additionalData.overtimeAmount;
      } else if (additionalData?.overtimeHours && additionalData.overtimeHours > 0) {
        // Calculate overtime based on hours and employee's overtime rate
        // Use actual days in the month of vacation start date
        const vacationStart = new Date(vacationStartDate);
        const daysInMonth = this.getDaysInMonth(vacationStart);
        const hourlyRate = currentBasicSalary / daysInMonth / 8; // Daily rate / 8 hours

        // Get employee's overtime rate multiplier
        const employeeOvertime = await db
          .select({
            overtimeRateMultiplier: employees.overtimeRateMultiplier,
          })
          .from(employees)
          .where(eq(employees.id, employeeId))
          .limit(1);

        const overtimeRate = employeeOvertime.length > 0 && employeeOvertime[0]?.overtimeRateMultiplier
          ? parseFloat(employeeOvertime[0].overtimeRateMultiplier)
          : 1.5;

        overtimeAmount = additionalData.overtimeHours * hourlyRate * overtimeRate;
      }

      // Calculate final amounts
      const unpaidSalaries = salaryInfo.unpaidAmount;
      const otherBenefits = additionalData?.otherBenefits || 0;

      const grossAmount = unpaidSalaries + vacationAllowance + overtimeAmount + otherBenefits;

      const pendingAdvances = additionalData?.pendingAdvances || 0;
      const equipmentDeductions = additionalData?.equipmentDeductions || 0;
      const otherDeductions = additionalData?.otherDeductions || 0;
      const absentDeduction = absentCalculation.absentDeduction;
      const totalDeductions = pendingAdvances + equipmentDeductions + otherDeductions + absentDeduction;

      const netAmount = grossAmount - totalDeductions;

      return {
        settlementType: 'vacation',
        employee: {
          id: emp.id,
          name: [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' '),
          fileNumber: emp.fileNumber || undefined,
          iqamaNumber: emp.iqamaNumber || undefined,
          nationality: emp.nationality || undefined,
          designation: emp.designationName || undefined,
          department: emp.departmentName || undefined,
          hireDate: emp.hireDate!,
          basicSalary: currentBasicSalary,
        },
        serviceDetails: {
          totalServiceYears: serviceDetails.totalServiceYears,
          totalServiceMonths: serviceDetails.totalServiceMonths,
          totalServiceDays: serviceDetails.totalServiceDays,
          lastWorkingDate: vacationStartDate,
        },
        vacationDetails: {
          vacationStartDate,
          vacationEndDate,
          expectedReturnDate,
          vacationDays,
          vacationAllowance,
        },
        salaryInfo,
        endOfServiceBenefit,
        absentCalculation,
        finalCalculation: {
          grossAmount: Math.round(grossAmount * 100) / 100,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          netAmount: Math.round(netAmount * 100) / 100,
          breakdown: {
            unpaidSalaries: Math.round(unpaidSalaries * 100) / 100,
            endOfServiceBenefit: 0,
            accruedVacation: 0,
            vacationAllowance: Math.round(vacationAllowance * 100) / 100,
            overtimeAmount: Math.round(overtimeAmount * 100) / 100,
            otherBenefits: Math.round(otherBenefits * 100) / 100,
            pendingAdvances: Math.round(pendingAdvances * 100) / 100,
            equipmentDeductions: Math.round(equipmentDeductions * 100) / 100,
            otherDeductions: Math.round(otherDeductions * 100) / 100,
            absentDeduction: Math.round(absentDeduction * 100) / 100,
          },
        },
      };
    } catch (error) {
      console.error('Error generating vacation settlement data:', error);
      throw error;
    }
  }

  /**
   * Generate complete final settlement data for an employee (EXIT)
   */
  static async generateFinalSettlementData(
    employeeId: number,
    lastWorkingDate: string,
    isResignation = false,
    additionalData?: {
      manualUnpaidSalary?: number; // Manual unpaid salary override
      overtimeHours?: number; // Overtime hours
      overtimeAmount?: number; // Manual overtime amount override
      accruedVacationDays?: number;
      otherBenefits?: number;
      otherBenefitsDescription?: string;
      pendingAdvances?: number;
      equipmentDeductions?: number;
      otherDeductions?: number;
      otherDeductionsDescription?: string;
      absentCalculationPeriod?: 'last_month' | 'unpaid_period' | 'custom';
      absentCalculationStartDate?: string;
      absentCalculationEndDate?: string;
      manualAbsentDays?: number;
    }
  ): Promise<FinalSettlementData> {
    try {
      // Get employee details with department and designation names
      const employeeData = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          middleName: employees.middleName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          iqamaNumber: employees.iqamaNumber,
          nationality: employees.nationality,
          hireDate: employees.hireDate,
          basicSalary: employees.basicSalary,
          departmentName: departments.name,
          designationName: designations.name,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(designations, eq(employees.designationId, designations.id))
        .where(eq(employees.id, employeeId))
        .limit(1);

      if (!employeeData.length) {
        throw new Error('Employee not found');
      }

      const emp = employeeData[0]!;
      const hireDate = new Date(emp.hireDate!);
      const lastWorking = new Date(lastWorkingDate);

      // Get latest salary information first (needed for calculations)
      const latestSalary = await db
        .select({
          basicSalary: employeeSalaries.basicSalary,
          allowances: employeeSalaries.allowances,
        })
        .from(employeeSalaries)
        .where(eq(employeeSalaries.employeeId, employeeId))
        .orderBy(desc(employeeSalaries.effectiveDate))
        .limit(1);

      const currentBasicSalary = latestSalary.length > 0
        ? parseFloat(latestSalary[0]!.basicSalary)
        : parseFloat(emp.basicSalary || '0');

      const currentAllowances = latestSalary.length > 0
        ? parseFloat(latestSalary[0]!.allowances || '0')
        : 0;

      // Get unpaid salary information
      const salaryInfo = await this.getUnpaidSalaryInfo(employeeId);

      // Override unpaid salary amount if manual value is provided
      if (additionalData?.manualUnpaidSalary && additionalData.manualUnpaidSalary > 0) {
        salaryInfo.unpaidAmount = additionalData.manualUnpaidSalary;
        // Calculate months based on manual amount and current salary
        const currentSalary = currentBasicSalary + currentAllowances;
        if (currentSalary > 0) {
          salaryInfo.unpaidMonths = Math.round((additionalData.manualUnpaidSalary / currentSalary) * 10) / 10; // Round to 1 decimal
          salaryInfo.totalUnpaidMonths = salaryInfo.unpaidMonths;
        }
      }

      // Calculate end of service benefits using current basic salary
      const endOfServiceBenefit = this.calculateEndOfServiceBenefit(
        hireDate,
        lastWorking,
        currentBasicSalary,
        isResignation
      );

      // Calculate service details
      const serviceDetails = this.calculateServicePeriod(hireDate, lastWorking);

      // Calculate vacation amount (assuming 21 days annual leave)
      // Use actual days in the month of last working date
      const daysInMonth = this.getDaysInMonth(lastWorking);
      const accruedVacationDays = additionalData?.accruedVacationDays || 0;
      const dailyRate = currentBasicSalary / daysInMonth;
      const accruedVacationAmount = accruedVacationDays * dailyRate;

      // Calculate absent days and deduction
      const absentCalculation = await this.calculateAbsentDays(
        employeeId,
        additionalData?.absentCalculationPeriod || 'unpaid_period',
        additionalData?.absentCalculationStartDate,
        additionalData?.absentCalculationEndDate,
        currentBasicSalary
      );

      // Override absent days if manual value is provided
      if (additionalData?.manualAbsentDays && additionalData.manualAbsentDays > 0) {
        absentCalculation.absentDays = additionalData.manualAbsentDays;
        absentCalculation.absentDeduction = additionalData.manualAbsentDays * absentCalculation.dailyRate;
      }

      // Calculate overtime amount
      let overtimeAmount = 0;
      if (additionalData?.overtimeAmount && additionalData.overtimeAmount > 0) {
        // Use manual overtime amount override
        overtimeAmount = additionalData.overtimeAmount;
      } else if (additionalData?.overtimeHours && additionalData.overtimeHours > 0) {
        // Calculate overtime based on hours and employee's overtime rate
        // Use actual days in the month of last working date
        const overtimeDaysInMonth = this.getDaysInMonth(lastWorking);
        const hourlyRate = currentBasicSalary / overtimeDaysInMonth / 8; // Daily rate / 8 hours

        // Get employee's overtime rate multiplier
        const employeeOvertime = await db
          .select({
            overtimeRateMultiplier: employees.overtimeRateMultiplier,
          })
          .from(employees)
          .where(eq(employees.id, employeeId))
          .limit(1);

        const overtimeRate = employeeOvertime.length > 0 && employeeOvertime[0]?.overtimeRateMultiplier
          ? parseFloat(employeeOvertime[0].overtimeRateMultiplier)
          : 1.5;

        overtimeAmount = additionalData.overtimeHours * hourlyRate * overtimeRate;
      }

      // Calculate final amounts
      const unpaidSalaries = salaryInfo.unpaidAmount;
      const endOfServiceAmount = endOfServiceBenefit.endOfServiceBenefit;
      const otherBenefits = additionalData?.otherBenefits || 0;

      const grossAmount = unpaidSalaries + endOfServiceAmount + accruedVacationAmount + overtimeAmount + otherBenefits;

      const pendingAdvances = additionalData?.pendingAdvances || 0;
      const equipmentDeductions = additionalData?.equipmentDeductions || 0;
      const otherDeductions = additionalData?.otherDeductions || 0;
      const absentDeduction = absentCalculation.absentDeduction;
      const totalDeductions = pendingAdvances + equipmentDeductions + otherDeductions + absentDeduction;

      const netAmount = grossAmount - totalDeductions;

      return {
        settlementType: 'exit',
        employee: {
          id: emp.id,
          name: [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' '),
          fileNumber: emp.fileNumber || undefined,
          iqamaNumber: emp.iqamaNumber || undefined,
          nationality: emp.nationality || undefined,
          designation: emp.designationName || undefined,
          department: emp.departmentName || undefined,
          hireDate: emp.hireDate!,
          basicSalary: currentBasicSalary,
        },
        serviceDetails: {
          totalServiceYears: serviceDetails.totalServiceYears,
          totalServiceMonths: serviceDetails.totalServiceMonths,
          totalServiceDays: serviceDetails.totalServiceDays,
          lastWorkingDate,
        },
        salaryInfo,
        endOfServiceBenefit,
        absentCalculation,
        finalCalculation: {
          grossAmount: Math.round(grossAmount * 100) / 100,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          netAmount: Math.round(netAmount * 100) / 100,
          breakdown: {
            unpaidSalaries: Math.round(unpaidSalaries * 100) / 100,
            endOfServiceBenefit: Math.round(endOfServiceAmount * 100) / 100,
            accruedVacation: Math.round(accruedVacationAmount * 100) / 100,
            vacationAllowance: 0,
            overtimeAmount: Math.round(overtimeAmount * 100) / 100,
            otherBenefits: Math.round(otherBenefits * 100) / 100,
            pendingAdvances: Math.round(pendingAdvances * 100) / 100,
            equipmentDeductions: Math.round(equipmentDeductions * 100) / 100,
            otherDeductions: Math.round(otherDeductions * 100) / 100,
            absentDeduction: Math.round(absentDeduction * 100) / 100,
          },
        },
      };
    } catch (error) {
      console.error('Error generating final settlement data:', error);
      throw error;
    }
  }

  /**
   * Generate a unique settlement number
   */
  static async generateSettlementNumber(settlementType: 'vacation' | 'exit' = 'exit'): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = settlementType === 'vacation' ? 'VS' : 'FS'; // VS = Vacation Settlement, FS = Final Settlement

    // Get the latest settlement number for this year and type
    const latestSettlement = await db
      .select({
        settlementNumber: finalSettlements.settlementNumber,
      })
      .from(finalSettlements)
      .where(like(finalSettlements.settlementNumber, `${prefix}-${year}%`))
      .orderBy(desc(finalSettlements.settlementNumber))
      .limit(1);

    let nextSequence = 1;
    if (latestSettlement.length > 0) {
      const lastNumber = latestSettlement[0]!.settlementNumber;
      const sequenceMatch = lastNumber.match(new RegExp(`${prefix}-\\d{4}-(\\d+)`));
      if (sequenceMatch && sequenceMatch[1]) {
        nextSequence = parseInt(sequenceMatch[1]) + 1;
      }
    }

    return `${prefix}-${year}-${String(nextSequence).padStart(4, '0')}`;
  }

  /**
   * Create a new final settlement record
   */
  static async createFinalSettlement(
    settlementData: FinalSettlementData,
    preparedBy: number,
    resignationId?: number,
    additionalData?: {
      vacationDurationMonths?: number;
      overtimeHours?: number;
      overtimeAmount?: number;
      otherBenefitsDescription?: string;
      otherDeductionsDescription?: string;
      notes?: string;
    }
  ) {
    try {
      const settlementNumber = await this.generateSettlementNumber(settlementData.settlementType);

      const newSettlement = await db
        .insert(finalSettlements)
        .values({
          employeeId: settlementData.employee.id,
          resignationId: resignationId || null,
          settlementNumber,
          settlementType: settlementData.settlementType,
          employeeName: settlementData.employee.name,
          fileNumber: settlementData.employee.fileNumber || null,
          iqamaNumber: settlementData.employee.iqamaNumber || null,
          nationality: settlementData.employee.nationality || null,
          designation: settlementData.employee.designation || null,
          department: settlementData.employee.department || null,
          hireDate: settlementData.employee.hireDate,
          lastWorkingDate: settlementData.serviceDetails.lastWorkingDate,

          // Vacation specific fields
          vacationStartDate: settlementData.vacationDetails?.vacationStartDate || null,
          vacationEndDate: settlementData.vacationDetails?.vacationEndDate || null,
          expectedReturnDate: settlementData.vacationDetails?.expectedReturnDate || null,
          vacationDurationMonths: additionalData?.vacationDurationMonths?.toString() || null,
          vacationDays: settlementData.vacationDetails?.vacationDays || null,

          totalServiceYears: settlementData.serviceDetails.totalServiceYears,
          totalServiceMonths: settlementData.serviceDetails.totalServiceMonths,
          totalServiceDays: settlementData.serviceDetails.totalServiceDays,
          lastBasicSalary: settlementData.employee.basicSalary?.toString() || '0',
          lastAllowances: '0', // Will be populated from salary data
          unpaidSalaryMonths: settlementData.salaryInfo.totalUnpaidMonths.toString(),
          unpaidSalaryAmount: settlementData.salaryInfo.unpaidAmount.toString(),
          endOfServiceBenefit: settlementData.settlementType === 'vacation'
            ? (settlementData.vacationDetails?.vacationAllowance || 0).toString()
            : settlementData.endOfServiceBenefit.endOfServiceBenefit.toString(),
          benefitCalculationMethod: settlementData.endOfServiceBenefit.benefitCalculationMethod,
          accruedVacationDays: (() => {
            // Calculate based on actual days in the month
            const lastWorkingDate = settlementData.serviceDetails.lastWorkingDate;
            const lastWorking = new Date(lastWorkingDate);
            const daysInMonth = this.getDaysInMonth(lastWorking);
            const dailyRate = parseFloat(settlementData.employee.basicSalary?.toString() || '0') / daysInMonth;
            return dailyRate > 0 ? Math.round(settlementData.finalCalculation.breakdown.accruedVacation / dailyRate) : 0;
          })(),
          accruedVacationAmount: settlementData.finalCalculation.breakdown.accruedVacation.toString(),
          otherBenefits: settlementData.finalCalculation.breakdown.otherBenefits.toString(),
          otherBenefitsDescription: additionalData?.otherBenefitsDescription || null,
          overtimeHours: additionalData?.overtimeHours?.toString() || '0',
          overtimeAmount: settlementData.finalCalculation.breakdown.overtimeAmount.toString(),
          pendingAdvances: settlementData.finalCalculation.breakdown.pendingAdvances.toString(),
          equipmentDeductions: settlementData.finalCalculation.breakdown.equipmentDeductions.toString(),
          otherDeductions: settlementData.finalCalculation.breakdown.otherDeductions.toString(),
          otherDeductionsDescription: additionalData?.otherDeductionsDescription || null,

          // Absent Calculation
          absentDays: settlementData.absentCalculation.absentDays,
          absentDeduction: settlementData.absentCalculation.absentDeduction.toString(),
          absentCalculationPeriod: settlementData.absentCalculation.calculationPeriod,
          absentCalculationStartDate: settlementData.absentCalculation.startDate || null,
          absentCalculationEndDate: settlementData.absentCalculation.endDate || null,

          grossAmount: settlementData.finalCalculation.grossAmount.toString(),
          totalDeductions: settlementData.finalCalculation.totalDeductions.toString(),
          netAmount: settlementData.finalCalculation.netAmount.toString(),
          status: 'draft',
          notes: additionalData?.notes || null,
          preparedBy,
          preparedAt: new Date().toISOString().split('T')[0],
          currency: 'SAR',
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .returning();

      return newSettlement[0];
    } catch (error) {
      console.error('Error creating final settlement:', error);
      throw error;
    }
  }

  /**
   * Calculate absent days and deduction for an employee
   */
  static async calculateAbsentDays(
    employeeId: number,
    calculationPeriod: 'last_month' | 'unpaid_period' | 'custom',
    startDate?: string,
    endDate?: string,
    basicSalary?: number
  ): Promise<AbsentCalculation> {
    try {
      let periodStart: Date;
      let periodEnd: Date;

      // Determine calculation period
      if (calculationPeriod === 'last_month') {
        // Use UTC-based construction to avoid timezone shifting dates backward
        const now = new Date();
        const y = now.getUTCFullYear();
        const m = now.getUTCMonth() - 1; // last month in UTC
        const targetYear = m < 0 ? y - 1 : y;
        const targetMonth = (m + 12) % 12;
        periodStart = new Date(Date.UTC(targetYear, targetMonth, 1));
        // Day 0 of next month gives last day of target month
        periodEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 0));
      } else if (calculationPeriod === 'unpaid_period') {
        const unpaidInfo = await this.getUnpaidSalaryInfo(employeeId);
        const lastPaidDate = unpaidInfo.lastPaidDate ? new Date(unpaidInfo.lastPaidDate) : new Date();
        // Start from first day of the month after last paid date, using UTC to avoid shifts
        const startYear = lastPaidDate.getUTCFullYear();
        const startMonth = lastPaidDate.getUTCMonth() + 1;
        periodStart = new Date(Date.UTC(startYear + Math.floor(startMonth / 12), (startMonth % 12), 1));
        // End today in UTC (strip time)
        const today = new Date();
        periodEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      } else if (calculationPeriod === 'custom' && startDate && endDate) {
        // Interpret provided dates as UTC calendar dates to keep consistency
        const [sY, sM, sD] = startDate.split('-').map(Number);
        const [eY, eM, eD] = endDate.split('-').map(Number);
        periodStart = new Date(Date.UTC(sY, (sM - 1), sD));
        periodEnd = new Date(Date.UTC(eY, (eM - 1), eD));
      } else {
        // Default to last month if custom dates are not provided
        const now = new Date();
        const y = now.getUTCFullYear();
        const m = now.getUTCMonth() - 1;
        const targetYear = m < 0 ? y - 1 : y;
        const targetMonth = (m + 12) % 12;
        periodStart = new Date(Date.UTC(targetYear, targetMonth, 1));
        periodEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 0));
      }

      // Get employee's basic salary if not provided
      let currentBasicSalary = basicSalary;
      if (!currentBasicSalary) {
        const latestSalary = await db
          .select({
            basicSalary: employeeSalaries.basicSalary,
          })
          .from(employeeSalaries)
          .where(eq(employeeSalaries.employeeId, employeeId))
          .orderBy(desc(employeeSalaries.effectiveDate))
          .limit(1);

        currentBasicSalary = latestSalary.length > 0
          ? parseFloat(latestSalary[0]!.basicSalary)
          : 0;
      }

      // Get timesheets for the period
      // Format dates directly from UTC values to avoid timezone shifts
      const formatUTCDateForQuery = (date: Date): string => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const timesheetData = await db
        .select({
          date: timesheets.date,
          hoursWorked: timesheets.hoursWorked,
          overtimeHours: timesheets.overtimeHours,
          status: timesheets.status,
        })
        .from(timesheets)
        .where(
          and(
            eq(timesheets.employeeId, employeeId),
            gte(timesheets.date, formatUTCDateForQuery(periodStart)),
            lte(timesheets.date, formatUTCDateForQuery(periodEnd))
          )
        )
        .orderBy(timesheets.date);

      // Create a map of timesheet data by date
      const timesheetMap = new Map();
      timesheetData.forEach(ts => {
        timesheetMap.set(ts.date, {
          hours: parseFloat(ts.hoursWorked),
          overtime: parseFloat(ts.overtimeHours),
          status: ts.status,
        });
      });

      // Calculate absent days using the same logic as payroll
      let absentDays = 0;
      const absentDates: string[] = [];
      const totalDaysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Iterate through dates using UTC to avoid timezone shifts
      for (let day = 0; day < totalDaysInPeriod; day++) {
        const currentDate = new Date(Date.UTC(
          periodStart.getUTCFullYear(),
          periodStart.getUTCMonth(),
          periodStart.getUTCDate() + day
        ));

        // Skip if date is beyond period end
        if (currentDate > periodEnd) break;

        // Format date string directly from UTC values
        const year = currentDate.getUTCFullYear();
        const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
        const dayStr = String(currentDate.getUTCDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${dayStr}`;
        const dayOfWeek = currentDate.getUTCDay();
        const isFriday = dayOfWeek === 5; // Friday is day 5

        const dayData = timesheetMap.get(dateString);
        const hasHoursWorked = dayData && (dayData.hours > 0 || dayData.overtime > 0);

        if (isFriday) {
          // Special logic for Fridays
          if (hasHoursWorked) {
            // Friday has hours worked - count as present
            continue;
          } else {
            // Friday has no hours - check if Thursday and Saturday are also absent
            // Calculate Thursday and Saturday dates using UTC
            const thursdayDate = new Date(Date.UTC(
              currentDate.getUTCFullYear(),
              currentDate.getUTCMonth(),
              currentDate.getUTCDate() - 1
            ));
            const saturdayDate = new Date(Date.UTC(
              currentDate.getUTCFullYear(),
              currentDate.getUTCMonth(),
              currentDate.getUTCDate() + 1
            ));

            // Format date strings directly from UTC values
            const thursdayString = `${thursdayDate.getUTCFullYear()}-${String(thursdayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(thursdayDate.getUTCDate()).padStart(2, '0')}`;
            const saturdayString = `${saturdayDate.getUTCFullYear()}-${String(saturdayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(saturdayDate.getUTCDate()).padStart(2, '0')}`;

            const thursdayData = timesheetMap.get(thursdayString);
            const saturdayData = timesheetMap.get(saturdayString);

            const thursdayAbsent = !thursdayData || (thursdayData.hours === 0 && thursdayData.overtime === 0);
            const saturdayAbsent = !saturdayData || (saturdayData.hours === 0 && saturdayData.overtime === 0);

            // Count Friday as absent only if Thursday and Saturday are also absent
            if (thursdayAbsent && saturdayAbsent) {
              absentDays++;
              absentDates.push(dateString);
            }
          }
        } else {
          // Non-Friday days - count as absent if no hours worked
          if (!hasHoursWorked) {
            absentDays++;
            absentDates.push(dateString);
          }
        }
      }

      // Calculate daily rate and deduction based on actual days in each month
      // Group absent days by month and calculate deduction for each month separately
      const absentDaysByMonth = new Map<string, number>();

      // Count absent days per month
      for (const absentDate of absentDates) {
        const date = new Date(absentDate);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        absentDaysByMonth.set(monthKey, (absentDaysByMonth.get(monthKey) || 0) + 1);
      }

      // Calculate deduction for each month based on actual days in that month
      let totalAbsentDeduction = 0;
      let totalDailyRate = 0;
      let monthCount = 0;

      for (const [monthKey, absentDaysInMonth] of absentDaysByMonth.entries()) {
        const [year, month] = monthKey.split('-').map(Number);
        const actualDaysInMonth = this.getDaysInMonth(new Date(year, month, 1));
        const dailyRate = currentBasicSalary / actualDaysInMonth;
        const monthDeduction = absentDaysInMonth * dailyRate;
        totalAbsentDeduction += monthDeduction;
        totalDailyRate += dailyRate;
        monthCount++;
      }

      // Calculate average daily rate for display purposes
      const averageDailyRate = monthCount > 0 ? totalDailyRate / monthCount : (currentBasicSalary / 30);
      const absentDeduction = Math.round(totalAbsentDeduction * 100) / 100;

      // Format dates directly from UTC values to avoid timezone shifts
      const formatUTCDate = (date: Date): string => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      return {
        absentDays,
        absentDeduction,
        calculationPeriod,
        startDate: formatUTCDate(periodStart),
        endDate: formatUTCDate(periodEnd),
        dailyRate: averageDailyRate,
        calculationDetails: {
          totalDaysInPeriod,
          workingDaysInPeriod: totalDaysInPeriod - absentDays,
          absentDates,
        },
      };
    } catch (error) {
      console.error('Error calculating absent days:', error);
      throw error;
    }
  }
}
