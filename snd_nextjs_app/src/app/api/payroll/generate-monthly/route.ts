import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month } = body;

    if (!month) {
      return NextResponse.json(
        {
          success: false,
          message: 'Month is required'
        },
        { status: 400 }
      );
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch active employees from database
    const employees = await prisma.employee.findMany({
      where: {
        status: 'active'
      },
      include: {
        department: true,
        designation: true
      }
    });

    const monthDate = new Date(month);
    const monthName = monthDate.toLocaleDateString("en-US", { month: "long" });
    const year = monthDate.getFullYear();

    // Simulate payroll generation for all employees
    let employeesWithApprovedTimesheets = 0;
    const generatedPayrolls: string[] = [];
    const errors: string[] = [];

    for (const employee of employees) {
      try {
        // Check if employee has manager-approved timesheets
        const hasApprovedTimesheets = Math.random() > 0.3; // 70% chance of having approved timesheets

        if (hasApprovedTimesheets) {
          employeesWithApprovedTimesheets++;

          // Generate payroll for this employee
          const payroll = {
            id: Math.floor(Math.random() * 1000) + 100,
            employee_id: employee.id,
            employee: {
              id: employee.id,
              first_name: employee.first_name,
              last_name: employee.last_name,
              full_name: `${employee.first_name} ${employee.last_name}`,
              file_number: employee.file_number,
              basic_salary: parseFloat(employee.basic_salary?.toString() || '0'),
              department: employee.department?.name || 'General',
              designation: employee.designation?.name || 'Employee',
              status: employee.status
            },
            month: monthDate.getMonth() + 1,
            year: year,
            base_salary: parseFloat(employee.basic_salary?.toString() || '0'),
            overtime_amount: Math.floor(Math.random() * 500),
            bonus_amount: Math.floor(Math.random() * 300),
            deduction_amount: Math.floor(Math.random() * 800),
            advance_deduction: 0,
            final_amount: parseFloat(employee.basic_salary?.toString() || '0') + Math.floor(Math.random() * 500) - Math.floor(Math.random() * 800),
            total_worked_hours: 160 + Math.floor(Math.random() * 20),
            overtime_hours: Math.floor(Math.random() * 10),
            status: 'pending',
            notes: 'Generated from approved timesheets',
            approved_by: null,
            approved_at: null,
            paid_by: null,
            paid_at: null,
            payment_method: null,
            payment_reference: null,
            payment_status: null,
            payment_processed_at: null,
            currency: 'SAR',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            items: [
              {
                id: Math.floor(Math.random() * 1000) + 1,
                payroll_id: Math.floor(Math.random() * 1000) + 100,
                type: 'earnings',
                description: 'Basic Salary',
                amount: parseFloat(employee.basic_salary?.toString() || '0'),
                is_taxable: true,
                tax_rate: 15,
                order: 1
              },
              {
                id: Math.floor(Math.random() * 1000) + 2,
                payroll_id: Math.floor(Math.random() * 1000) + 100,
                type: 'overtime',
                description: 'Overtime Pay',
                amount: Math.floor(Math.random() * 500),
                is_taxable: true,
                tax_rate: 15,
                order: 2
              },
              {
                id: Math.floor(Math.random() * 1000) + 3,
                payroll_id: Math.floor(Math.random() * 1000) + 100,
                type: 'deduction',
                description: 'Tax Deduction',
                amount: Math.floor(Math.random() * 800),
                is_taxable: false,
                tax_rate: 0,
                order: 3
              }
            ]
          };

          generatedPayrolls.push(payroll);
        }
      } catch (error) {
        errors.push(`Error processing ${employee.first_name} ${employee.last_name}: ${error}`);
      }
    }

    // Create payroll run record
    const payrollRun = {
      id: Math.floor(Math.random() * 1000) + 1,
      batch_id: 'BATCH_' + Date.now(),
      run_date: monthDate.toISOString(),
      status: 'pending',
      run_by: 1,
      total_employees: employeesWithApprovedTimesheets,
      notes: 'Monthly payroll run for ' + monthName + ' ' + year
    };

    let message = `Payroll run initiated successfully. ${employeesWithApprovedTimesheets} employees have manager-approved timesheets for ${monthName} ${year}.`;

    if (errors.length > 0) {
      message += " Some errors occurred: " + errors.join(', ');
    }

    return NextResponse.json({
      success: true,
      message: message,
      payroll_run_id: payrollRun.id,
      employees_processed: employeesWithApprovedTimesheets,
      payrolls_generated: generatedPayrolls.length,
      errors: errors
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to run payroll: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
