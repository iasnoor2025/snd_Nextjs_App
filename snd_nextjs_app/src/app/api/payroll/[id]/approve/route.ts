import { NextRequest, NextResponse } from 'next/server';

// Mock data (same as in the main route)
const mockPayrolls = [
  {
    id: 1,
    employee_id: 1,
    employee: {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      file_number: 'EMP001',
      basic_salary: 5000,
      department: 'Engineering',
      designation: 'Software Engineer'
    },
    month: 1,
    year: 2024,
    base_salary: 5000,
    overtime_amount: 250,
    bonus_amount: 500,
    deduction_amount: 1200,
    advance_deduction: 0,
    final_amount: 4550,
    total_worked_hours: 160,
    overtime_hours: 10,
    status: 'approved',
    notes: 'Regular monthly payroll',
    approved_by: 1,
    approved_at: '2024-01-30T10:00:00Z',
    paid_by: null,
    paid_at: null,
    payment_method: null,
    payment_reference: null,
    payment_status: null,
    payment_processed_at: null,
    currency: 'USD',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-30T10:00:00Z',
    items: [
      {
        id: 1,
        payroll_id: 1,
        type: 'earnings',
        description: 'Basic Salary',
        amount: 5000,
        is_taxable: true,
        tax_rate: 15,
        order: 1
      },
      {
        id: 2,
        payroll_id: 1,
        type: 'overtime',
        description: 'Overtime (10 hours)',
        amount: 250,
        is_taxable: true,
        tax_rate: 15,
        order: 2
      },
      {
        id: 3,
        payroll_id: 1,
        type: 'bonus',
        description: 'Performance Bonus',
        amount: 500,
        is_taxable: true,
        tax_rate: 15,
        order: 3
      },
      {
        id: 4,
        payroll_id: 1,
        type: 'deduction',
        description: 'Tax Deduction',
        amount: 862.5,
        is_taxable: false,
        tax_rate: 0,
        order: 4
      },
      {
        id: 5,
        payroll_id: 1,
        type: 'deduction',
        description: 'Health Insurance',
        amount: 150,
        is_taxable: false,
        tax_rate: 0,
        order: 5
      },
      {
        id: 6,
        payroll_id: 1,
        type: 'deduction',
        description: 'Retirement Contribution',
        amount: 187.5,
        is_taxable: false,
        tax_rate: 0,
        order: 6
      }
    ]
  },
  {
    id: 2,
    employee_id: 2,
    employee: {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      full_name: 'Jane Smith',
      file_number: 'EMP002',
      basic_salary: 4500,
      department: 'Marketing',
      designation: 'Marketing Manager'
    },
    month: 1,
    year: 2024,
    base_salary: 4500,
    overtime_amount: 0,
    bonus_amount: 300,
    deduction_amount: 900,
    advance_deduction: 0,
    final_amount: 3900,
    total_worked_hours: 160,
    overtime_hours: 0,
    status: 'pending',
    notes: 'Regular monthly payroll',
    approved_by: null,
    approved_at: null,
    paid_by: null,
    paid_at: null,
    payment_method: null,
    payment_reference: null,
    payment_status: null,
    payment_processed_at: null,
    currency: 'USD',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    items: [
      {
        id: 7,
        payroll_id: 2,
        type: 'earnings',
        description: 'Basic Salary',
        amount: 4500,
        is_taxable: true,
        tax_rate: 15,
        order: 1
      },
      {
        id: 8,
        payroll_id: 2,
        type: 'bonus',
        description: 'Performance Bonus',
        amount: 300,
        is_taxable: true,
        tax_rate: 15,
        order: 2
      },
      {
        id: 9,
        payroll_id: 2,
        type: 'deduction',
        description: 'Tax Deduction',
        amount: 720,
        is_taxable: false,
        tax_rate: 0,
        order: 3
      },
      {
        id: 10,
        payroll_id: 2,
        type: 'deduction',
        description: 'Health Insurance',
        amount: 135,
        is_taxable: false,
        tax_rate: 0,
        order: 4
      },
      {
        id: 11,
        payroll_id: 2,
        type: 'deduction',
        description: 'Retirement Contribution',
        amount: 45,
        is_taxable: false,
        tax_rate: 0,
        order: 5
      }
    ]
  }
];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const payrollIndex = mockPayrolls.findIndex(p => p.id === id);

    if (payrollIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll not found'
        },
        { status: 404 }
      );
    }

    const payroll = mockPayrolls[payrollIndex];

    // Check if payroll can be approved
    if (payroll.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          message: `Payroll is already ${payroll.status} and cannot be approved`
        },
        { status: 400 }
      );
    }

    // Approve the payroll
    payroll.status = 'approved';
    payroll.approved_by = 1; // Mock user ID
    payroll.approved_at = new Date().toISOString();
    payroll.updated_at = new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: payroll,
      message: 'Payroll approved successfully'
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error approving payroll: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
