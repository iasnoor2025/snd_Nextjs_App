import { db } from '@/lib/db';
import { 
  employees, 
  payrolls, 
  finalSettlements,
  employeeSalaries
} from '@/lib/drizzle/schema';
import { eq, desc, and, like } from 'drizzle-orm';

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
  benefitCalculationMethod: 'resigned' | 'terminated';
  calculationDetails: {
    yearsForCalculation: number;
    monthsForCalculation: number;
    fullBenefitYears: number;
    halfBenefitYears: number;
    reductionPercentage: number;
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
  finalCalculation: {
    grossAmount: number;
    totalDeductions: number;
    netAmount: number;
    breakdown: {
      unpaidSalaries: number;
      endOfServiceBenefit: number;
      accruedVacation: number;
      vacationAllowance: number;
      otherBenefits: number;
      pendingAdvances: number;
      equipmentDeductions: number;
      otherDeductions: number;
    };
  };
}

export class FinalSettlementService {
  /**
   * Check how many months an employee hasn't received salary until today
   */
  static async getUnpaidSalaryInfo(employeeId: number): Promise<UnpaidSalaryInfo> {
    try {
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

      // Get all paid payrolls for this employee
      const paidPayrolls = await db
        .select({
          month: payrolls.month,
          year: payrolls.year,
          finalAmount: payrolls.finalAmount,
          paidAt: payrolls.paidAt,
        })
        .from(payrolls)
        .where(
          and(
            eq(payrolls.employeeId, employeeId),
            eq(payrolls.paymentStatus, 'paid')
          )
        )
        .orderBy(desc(payrolls.year), desc(payrolls.month));

      // Find the last paid month/year
      let lastPaidMonth: number | undefined;
      let lastPaidYear: number | undefined;
      let lastPaidDate: string | undefined;

      if (paidPayrolls.length > 0) {
        lastPaidMonth = paidPayrolls[0]!.month;
        lastPaidYear = paidPayrolls[0]!.year;
        lastPaidDate = paidPayrolls[0]!.paidAt || undefined;
      }

      // Calculate unpaid months from hire date or last paid month to today
      const startDate = lastPaidMonth && lastPaidYear 
        ? new Date(lastPaidYear, lastPaidMonth, 1) // Start from the month after last paid
        : hireDate;

      const unpaidMonths = this.calculateMonthsBetween(startDate, today);
      
      // If there was a last payment, we need to exclude that month and start from the next month
      const totalUnpaidMonths = lastPaidMonth && lastPaidYear 
        ? unpaidMonths - 1 // Subtract 1 because we start from the month after last payment
        : unpaidMonths;

      const unpaidAmount = Math.max(0, totalUnpaidMonths) * (currentBasicSalary + currentAllowances);

      return {
        employeeId,
        unpaidMonths: Math.max(0, totalUnpaidMonths),
        unpaidAmount,
        lastPaidMonth,
        lastPaidYear,
        lastPaidDate,
        totalUnpaidMonths: Math.max(0, totalUnpaidMonths),
      };
    } catch (error) {
      console.error('Error calculating unpaid salary info:', error);
      throw error;
    }
  }

  /**
   * Calculate end of service benefits according to Saudi Labor Law
   */
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
      endOfServiceBenefit = endOfServiceBenefit * (isResignation ? 2/3 : 1);
    } else if (totalYearsDecimal >= 2) {
      // 2-5 years
      halfBenefitYears = totalYearsDecimal;
      endOfServiceBenefit = (basicSalary / 2) * totalYearsDecimal;
      reductionPercentage = isResignation ? 66.67 : 0; // 1/3 for resignation
      endOfServiceBenefit = endOfServiceBenefit * (isResignation ? 1/3 : 1);
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
   * Calculate vacation settlement for annual leave
   */
  static async generateVacationSettlementData(
    employeeId: number,
    vacationStartDate: string,
    vacationEndDate: string,
    expectedReturnDate: string,
    additionalData?: {
      manualUnpaidSalary?: number; // Manual unpaid salary override
      manualVacationAllowance?: number;
      otherBenefits?: number;
      otherBenefitsDescription?: string;
      pendingAdvances?: number;
      equipmentDeductions?: number;
      otherDeductions?: number;
      otherDeductionsDescription?: string;
    }
  ): Promise<FinalSettlementData> {
    try {
      // Get employee details
      const employeeData = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          iqamaNumber: employees.iqamaNumber,
          nationality: employees.nationality,
          hireDate: employees.hireDate,
          basicSalary: employees.basicSalary,
          departmentName: employees.departmentId,
          designationName: employees.designationId,
        })
        .from(employees)
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
      const vacationDays = Math.ceil((vacationEnd.getTime() - vacationStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Get unpaid salary information
      const salaryInfo = await this.getUnpaidSalaryInfo(employeeId);
      
      // Override unpaid salary amount if manual value is provided
      if (additionalData?.manualUnpaidSalary && additionalData.manualUnpaidSalary > 0) {
        salaryInfo.unpaidAmount = additionalData.manualUnpaidSalary;
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

      // Calculate vacation allowance
      // Use manual vacation allowance if provided, otherwise use current basic salary
      const vacationAllowance = additionalData?.manualVacationAllowance && additionalData.manualVacationAllowance > 0
        ? additionalData.manualVacationAllowance
        : currentBasicSalary;

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

      // Calculate final amounts
      const unpaidSalaries = salaryInfo.unpaidAmount;
      const otherBenefits = additionalData?.otherBenefits || 0;

      const grossAmount = unpaidSalaries + vacationAllowance + otherBenefits;

      const pendingAdvances = additionalData?.pendingAdvances || 0;
      const equipmentDeductions = additionalData?.equipmentDeductions || 0;
      const otherDeductions = additionalData?.otherDeductions || 0;
      const totalDeductions = pendingAdvances + equipmentDeductions + otherDeductions;

      const netAmount = grossAmount - totalDeductions;

      return {
        settlementType: 'vacation',
        employee: {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          fileNumber: emp.fileNumber,
          iqamaNumber: emp.iqamaNumber,
          nationality: emp.nationality,
          designation: emp.designationName?.toString(),
          department: emp.departmentName?.toString(),
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
        finalCalculation: {
          grossAmount: Math.round(grossAmount * 100) / 100,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          netAmount: Math.round(netAmount * 100) / 100,
          breakdown: {
            unpaidSalaries: Math.round(unpaidSalaries * 100) / 100,
            endOfServiceBenefit: 0,
            accruedVacation: 0,
            vacationAllowance: Math.round(vacationAllowance * 100) / 100,
            otherBenefits: Math.round(otherBenefits * 100) / 100,
            pendingAdvances: Math.round(pendingAdvances * 100) / 100,
            equipmentDeductions: Math.round(equipmentDeductions * 100) / 100,
            otherDeductions: Math.round(otherDeductions * 100) / 100,
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
      accruedVacationDays?: number;
      otherBenefits?: number;
      otherBenefitsDescription?: string;
      pendingAdvances?: number;
      equipmentDeductions?: number;
      otherDeductions?: number;
      otherDeductionsDescription?: string;
    }
  ): Promise<FinalSettlementData> {
    try {
      // Get employee details
      const employeeData = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          iqamaNumber: employees.iqamaNumber,
          nationality: employees.nationality,
          hireDate: employees.hireDate,
          basicSalary: employees.basicSalary,
          departmentName: employees.departmentId,
          designationName: employees.designationId,
        })
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);

      if (!employeeData.length) {
        throw new Error('Employee not found');
      }

      const emp = employeeData[0]!;
      const hireDate = new Date(emp.hireDate!);
      const lastWorking = new Date(lastWorkingDate);

      // Get unpaid salary information
      const salaryInfo = await this.getUnpaidSalaryInfo(employeeId);
      
      // Override unpaid salary amount if manual value is provided
      if (additionalData?.manualUnpaidSalary && additionalData.manualUnpaidSalary > 0) {
        salaryInfo.unpaidAmount = additionalData.manualUnpaidSalary;
      }

      // Get latest salary information
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
      const accruedVacationDays = additionalData?.accruedVacationDays || 0;
      const dailyRate = currentBasicSalary / 30;
      const accruedVacationAmount = accruedVacationDays * dailyRate;

      // Calculate final amounts
      const unpaidSalaries = salaryInfo.unpaidAmount;
      const endOfServiceAmount = endOfServiceBenefit.endOfServiceBenefit;
      const otherBenefits = additionalData?.otherBenefits || 0;

      const grossAmount = unpaidSalaries + endOfServiceAmount + accruedVacationAmount + otherBenefits;

      const pendingAdvances = additionalData?.pendingAdvances || 0;
      const equipmentDeductions = additionalData?.equipmentDeductions || 0;
      const otherDeductions = additionalData?.otherDeductions || 0;
      const totalDeductions = pendingAdvances + equipmentDeductions + otherDeductions;

      const netAmount = grossAmount - totalDeductions;

      return {
        settlementType: 'exit',
        employee: {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          fileNumber: emp.fileNumber,
          iqamaNumber: emp.iqamaNumber,
          nationality: emp.nationality,
          designation: emp.designationName?.toString(),
          department: emp.departmentName?.toString(),
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
        finalCalculation: {
          grossAmount: Math.round(grossAmount * 100) / 100,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          netAmount: Math.round(netAmount * 100) / 100,
            breakdown: {
              unpaidSalaries: Math.round(unpaidSalaries * 100) / 100,
              endOfServiceBenefit: Math.round(endOfServiceAmount * 100) / 100,
              accruedVacation: Math.round(accruedVacationAmount * 100) / 100,
              vacationAllowance: 0,
              otherBenefits: Math.round(otherBenefits * 100) / 100,
              pendingAdvances: Math.round(pendingAdvances * 100) / 100,
              equipmentDeductions: Math.round(equipmentDeductions * 100) / 100,
              otherDeductions: Math.round(otherDeductions * 100) / 100,
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
          vacationDays: settlementData.vacationDetails?.vacationDays || null,
          
          totalServiceYears: settlementData.serviceDetails.totalServiceYears,
          totalServiceMonths: settlementData.serviceDetails.totalServiceMonths,
          totalServiceDays: settlementData.serviceDetails.totalServiceDays,
          lastBasicSalary: settlementData.employee.basicSalary?.toString() || '0',
          lastAllowances: '0', // Will be populated from salary data
          unpaidSalaryMonths: settlementData.salaryInfo.unpaidMonths,
          unpaidSalaryAmount: settlementData.salaryInfo.unpaidAmount.toString(),
          endOfServiceBenefit: settlementData.settlementType === 'vacation' 
            ? (settlementData.vacationDetails?.vacationAllowance || 0).toString()
            : settlementData.endOfServiceBenefit.endOfServiceBenefit.toString(),
          benefitCalculationMethod: settlementData.endOfServiceBenefit.benefitCalculationMethod,
          accruedVacationDays: Math.round(settlementData.finalCalculation.breakdown.accruedVacation / (parseFloat(settlementData.employee.basicSalary?.toString() || '0') / 30)),
          accruedVacationAmount: settlementData.finalCalculation.breakdown.accruedVacation.toString(),
          otherBenefits: settlementData.finalCalculation.breakdown.otherBenefits.toString(),
          otherBenefitsDescription: additionalData?.otherBenefitsDescription || null,
          pendingAdvances: settlementData.finalCalculation.breakdown.pendingAdvances.toString(),
          equipmentDeductions: settlementData.finalCalculation.breakdown.equipmentDeductions.toString(),
          otherDeductions: settlementData.finalCalculation.breakdown.otherDeductions.toString(),
          otherDeductionsDescription: additionalData?.otherDeductionsDescription || null,
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
}
