import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Fetch employees from database
    const employees = await prisma.employee.findMany({
      include: {
        department: true,
        designation: true,
        unit: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Format employees for CSV
    const csvHeaders = [
      'Employee ID',
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
      'Notes'
    ];

    const csvRows = employees.map(employee => [
      employee.employeeId || '',
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
      employee.dateOfBirth?.toISOString().split('T')[0] || '',
      employee.hireDate?.toISOString().split('T')[0] || '',
      employee.department?.name || '',
      employee.designation?.name || '',
      employee.unit?.name || '',
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
      employee.contractDaysPerMonth?.toString() || '26',
      employee.emergencyContactName || '',
      employee.emergencyContactPhone || '',
      employee.emergencyContactRelationship || '',
      employee.iqamaNumber || '',
      employee.iqamaExpiry?.toISOString().split('T')[0] || '',
      employee.iqamaCost?.toString() || '0',
      employee.passportNumber || '',
      employee.passportExpiry?.toISOString().split('T')[0] || '',
      employee.drivingLicenseNumber || '',
      employee.drivingLicenseExpiry?.toISOString().split('T')[0] || '',
      employee.drivingLicenseCost?.toString() || '0',
      employee.operatorLicenseNumber || '',
      employee.operatorLicenseExpiry?.toISOString().split('T')[0] || '',
      employee.operatorLicenseCost?.toString() || '0',
      employee.tuvCertificationNumber || '',
      employee.tuvCertificationExpiry?.toISOString().split('T')[0] || '',
      employee.tuvCertificationCost?.toString() || '0',
      employee.spspLicenseNumber || '',
      employee.spspLicenseExpiry?.toISOString().split('T')[0] || '',
      employee.spspLicenseCost?.toString() || '0',
      employee.isOperator ? 'Yes' : 'No',
      employee.notes || ''
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="employees.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to export employees: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
