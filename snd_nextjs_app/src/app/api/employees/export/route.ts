import { db } from '@/lib/db';
import {
  departments,
  designations,
  employees as employeesTable,
  organizationalUnits,
} from '@/lib/drizzle/schema';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch employees from database using Drizzle
    const employees = await db
      .select({
        id: employeesTable.id,
        fileNumber: employeesTable.fileNumber,
        firstName: employeesTable.firstName,
        middleName: employeesTable.middleName,
        lastName: employeesTable.lastName,
        email: employeesTable.email,
        phone: employeesTable.phone,
        address: employeesTable.address,
        city: employeesTable.city,
        state: employeesTable.state,
        country: employeesTable.country,
        nationality: employeesTable.nationality,
        dateOfBirth: employeesTable.dateOfBirth,
        hireDate: employeesTable.hireDate,
        departmentName: departments.name,
        designationName: designations.name,
        unitName: organizationalUnits.name,
        supervisor: employeesTable.supervisor,
        status: employeesTable.status,
        currentLocation: employeesTable.currentLocation,
        basicSalary: employeesTable.basicSalary,
        foodAllowance: employeesTable.foodAllowance,
        housingAllowance: employeesTable.housingAllowance,
        transportAllowance: employeesTable.transportAllowance,
        hourlyRate: employeesTable.hourlyRate,
        bankName: employeesTable.bankName,
        bankAccountNumber: employeesTable.bankAccountNumber,
        bankIban: employeesTable.bankIban,
        contractHoursPerDay: employeesTable.contractHoursPerDay,
        contractDaysPerMonth: employeesTable.contractDaysPerMonth,
        emergencyContactName: employeesTable.emergencyContactName,
        emergencyContactPhone: employeesTable.emergencyContactPhone,
        emergencyContactRelationship: employeesTable.emergencyContactRelationship,
        iqamaNumber: employeesTable.iqamaNumber,
        iqamaExpiry: employeesTable.iqamaExpiry,
        iqamaCost: employeesTable.iqamaCost,
        passportNumber: employeesTable.passportNumber,
        passportExpiry: employeesTable.passportExpiry,
        drivingLicenseNumber: employeesTable.drivingLicenseNumber,
        drivingLicenseExpiry: employeesTable.drivingLicenseExpiry,
        drivingLicenseCost: employeesTable.drivingLicenseCost,
        operatorLicenseNumber: employeesTable.operatorLicenseNumber,
        operatorLicenseExpiry: employeesTable.operatorLicenseExpiry,
        operatorLicenseCost: employeesTable.operatorLicenseCost,
        tuvCertificationNumber: employeesTable.tuvCertificationNumber,
        tuvCertificationExpiry: employeesTable.tuvCertificationExpiry,
        tuvCertificationCost: employeesTable.tuvCertificationCost,
        spspLicenseNumber: employeesTable.spspLicenseNumber,
        spspLicenseExpiry: employeesTable.spspLicenseExpiry,
        spspLicenseCost: employeesTable.spspLicenseCost,
        isOperator: employeesTable.isOperator,
        notes: employeesTable.notes,
      })
      .from(employeesTable)
      .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
      .leftJoin(designations, eq(designations.id, employeesTable.designationId))
      .leftJoin(organizationalUnits, eq(organizationalUnits.id, employeesTable.unitId))
      .orderBy(asc(employeesTable.firstName), asc(employeesTable.lastName));

    // Format employees for CSV
    const csvHeaders = [
      'File Number',
      'First Name',
      'Middle Name',
      'Last Name',
      'Full Name',
      'Email',
      'Phone',
      'Address',
      'City',
      'State',
      'Country',
      'Nationality',
      'Date of Birth',
      'Hire Date',
      'Department',
      'Designation',
      'Unit',
      'Supervisor',
      'Status',
      'Current Location',
      'Basic Salary',
      'Food Allowance',
      'Housing Allowance',
      'Transport Allowance',
      'Hourly Rate',
      'Bank Name',
      'Bank Account Number',
      'Bank IBAN',
      'Contract Hours/Day',
      'Contract Days/Month',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Emergency Contact Relationship',
      'Iqama Number',
      'Iqama Expiry',
      'Iqama Cost',
      'Passport Number',
      'Passport Expiry',
      'Driving License Number',
      'Driving License Expiry',
      'Driving License Cost',
      'Operator License Number',
      'Operator License Expiry',
      'Operator License Cost',
      'TUV Certification Number',
      'TUV Certification Expiry',
      'TUV Certification Cost',
      'SPSP License Number',
      'SPSP License Expiry',
      'SPSP License Cost',
      'Is Operator',
      'Notes',
    ];

    const csvRows = employees.map(employee => [
      employee.fileNumber || '',
      employee.firstName || '',
      employee.middleName || '',
      employee.lastName || '',
      `${employee.firstName || ''} ${employee.middleName ? employee.middleName + ' ' : ''}${employee.lastName || ''}`.trim(),
      employee.email || '',
      employee.phone || '',
      employee.address || '',
      employee.city || '',
      employee.state || '',
      employee.country || '',
      employee.nationality || '',
      employee.dateOfBirth
        ? new Date(employee.dateOfBirth as unknown as string).toISOString().split('T')[0] || null
        : '',
      employee.hireDate
        ? new Date(employee.hireDate as unknown as string).toISOString().split('T')[0] || null
        : '',
      employee.departmentName || '',
      employee.designationName || '',
      employee.unitName || '',
      employee.supervisor || '',
      employee.status || '',
      employee.currentLocation || '',
      employee.basicSalary?.toString() || '0',
      employee.foodAllowance?.toString() || '0',
      employee.housingAllowance?.toString() || '0',
      employee.transportAllowance?.toString() || '0',
      employee.hourlyRate?.toString() || '0',
      employee.bankName || '',
      employee.bankAccountNumber || '',
      employee.bankIban || '',
      employee.contractHoursPerDay?.toString() || '8',
              employee.contractDaysPerMonth?.toString() || '30',
      employee.emergencyContactName || '',
      employee.emergencyContactPhone || '',
      employee.emergencyContactRelationship || '',
      employee.iqamaNumber || '',
      employee.iqamaExpiry
        ? new Date(employee.iqamaExpiry as unknown as string).toISOString().split('T')[0] || null
        : '',
      employee.iqamaCost?.toString() || '0',
      employee.passportNumber || '',
      employee.passportExpiry
        ? new Date(employee.passportExpiry as unknown as string).toISOString().split('T')[0] || null
        : '',
      employee.drivingLicenseNumber || '',
      employee.drivingLicenseExpiry
        ? new Date(employee.drivingLicenseExpiry as unknown as string).toISOString().split('T')[0] || null
        : '',
      employee.drivingLicenseCost?.toString() || '0',
      employee.operatorLicenseNumber || '',
      employee.operatorLicenseExpiry
        ? new Date(employee.operatorLicenseExpiry as unknown as string).toISOString().split('T')[0] || null
        : '',
      employee.operatorLicenseCost?.toString() || '0',
      employee.tuvCertificationNumber || '',
      employee.tuvCertificationExpiry
        ? new Date(employee.tuvCertificationExpiry as unknown as string).toISOString().split('T')[0] || null
        : '',
      employee.tuvCertificationCost?.toString() || '0',
      employee.spspLicenseNumber || '',
      employee.spspLicenseExpiry
        ? new Date(employee.spspLicenseExpiry as unknown as string).toISOString().split('T')[0] || null
        : '',
      employee.spspLicenseCost?.toString() || '0',
      employee.isOperator ? 'Yes' : 'No',
      employee.notes || '',
    ]);

    // Create CSV content
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Set response headers for CSV download
    const response = new NextResponse(csvContent);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', 'attachment; filename="employees.csv"');

    return response;
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to export employees' }, { status: 500 });
  }
}
