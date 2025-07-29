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
      employee.employee_id || '',
      employee.file_number || '',
      employee.first_name || '',
      employee.middle_name || '',
      employee.last_name || '',
      `${employee.first_name || ''} ${employee.middle_name ? employee.middle_name + ' ' : ''}${employee.last_name || ''}`.trim(),
      employee.email || '',
      employee.phone || '',
      employee.address || '',
      employee.city || '',
      employee.state || '',
      employee.country || '',
      employee.nationality || '',
      employee.date_of_birth?.toISOString().split('T')[0] || '',
      employee.hire_date?.toISOString().split('T')[0] || '',
      employee.department?.name || '',
      employee.designation?.name || '',
      employee.unit?.name || '',
      employee.supervisor || '',
      employee.status || '',
      employee.current_location || '',
      employee.basic_salary?.toString() || '0',
      employee.food_allowance?.toString() || '0',
      employee.housing_allowance?.toString() || '0',
      employee.transport_allowance?.toString() || '0',
      employee.hourly_rate?.toString() || '0',
      employee.bank_name || '',
      employee.bank_account_number || '',
      employee.bank_iban || '',
      employee.contract_hours_per_day?.toString() || '8',
      employee.contract_days_per_month?.toString() || '26',
      employee.emergency_contact_name || '',
      employee.emergency_contact_phone || '',
      employee.emergency_contact_relationship || '',
      employee.iqama_number || '',
      employee.iqama_expiry?.toISOString().split('T')[0] || '',
      employee.iqama_cost?.toString() || '0',
      employee.passport_number || '',
      employee.passport_expiry?.toISOString().split('T')[0] || '',
      employee.driving_license_number || '',
      employee.driving_license_expiry?.toISOString().split('T')[0] || '',
      employee.driving_license_cost?.toString() || '0',
      employee.operator_license_number || '',
      employee.operator_license_expiry?.toISOString().split('T')[0] || '',
      employee.operator_license_cost?.toString() || '0',
      employee.tuv_certification_number || '',
      employee.tuv_certification_expiry?.toISOString().split('T')[0] || '',
      employee.tuv_certification_cost?.toString() || '0',
      employee.spsp_license_number || '',
      employee.spsp_license_expiry?.toISOString().split('T')[0] || '',
      employee.spsp_license_cost?.toString() || '0',
      employee.is_operator ? 'Yes' : 'No',
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
