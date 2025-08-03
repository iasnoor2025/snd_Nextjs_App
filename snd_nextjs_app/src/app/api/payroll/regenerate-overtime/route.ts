import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting overtime recalculation for existing payrolls...');
    
    // Test basic connection first
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
    } catch (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed: ' + (connectionError as Error).message
        },
        { status: 500 }
      );
    }
    
    // Get all payrolls that have overtime hours but 0 overtime amount
    const payrollsToUpdate = await prisma.payroll.findMany({
      where: {
        overtime_hours: {
          gt: 0
        },
        overtime_amount: 0
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            basic_salary: true,
            contract_days_per_month: true,
            contract_hours_per_day: true,
            overtime_rate_multiplier: true,
            overtime_fixed_rate: true
          }
        }
      }
    });

    console.log(`Found ${payrollsToUpdate.length} payrolls to update`);

    const updatedPayrolls: string[] = [];
    const errors: string[] = [];

    for (const payroll of payrollsToUpdate) {
      try {
        console.log(`Updating payroll for ${payroll.employee.first_name} ${payroll.employee.last_name} - ${payroll.month}/${payroll.year}`);
        
                 // Calculate overtime amount based on employee's overtime settings
         let overtimeAmount = 0;
         if (payroll.overtime_hours > 0) {
           // Use the formula: basic/30/8*overtime rate
           const basicSalary = Number(payroll.employee.basic_salary);
           const hourlyRate = basicSalary / 30 / 8; // basic/30/8

           console.log(`Overtime calculation for ${payroll.employee.first_name} ${payroll.employee.last_name}:`);
           console.log(`- Total overtime hours: ${payroll.overtime_hours}`);
           console.log(`- Basic salary: ${basicSalary}`);
           console.log(`- Hourly rate (basic/30/8): ${hourlyRate}`);
           console.log(`- Overtime fixed rate: ${payroll.employee.overtime_fixed_rate}`);
           console.log(`- Overtime rate multiplier: ${payroll.employee.overtime_rate_multiplier}`);

           // Use employee's overtime settings
           if (payroll.employee.overtime_fixed_rate && payroll.employee.overtime_fixed_rate > 0) {
             // Use fixed overtime rate
             overtimeAmount = payroll.overtime_hours * Number(payroll.employee.overtime_fixed_rate);
             console.log(`- Using fixed rate: ${payroll.employee.overtime_fixed_rate} SAR/hr`);
           } else {
             // Use overtime multiplier with basic/30/8 formula
             const overtimeMultiplier = payroll.employee.overtime_rate_multiplier || 1.5;
             overtimeAmount = payroll.overtime_hours * (hourlyRate * overtimeMultiplier);
             console.log(`- Using multiplier: ${overtimeMultiplier}x (basic/30/8 formula)`);
           }
           
           console.log(`- Final overtime amount: ${overtimeAmount}`);
         }

        // Update the payroll
        const updatedPayroll = await prisma.payroll.update({
          where: { id: payroll.id },
          data: {
            overtime_amount: overtimeAmount,
            final_amount: payroll.base_salary + overtimeAmount + payroll.bonus_amount - payroll.deduction_amount
          }
        });

        // Update or create overtime payroll item
        const existingOvertimeItem = await prisma.payrollItem.findFirst({
          where: {
            payroll_id: payroll.id,
            type: 'overtime'
          }
        });

        if (existingOvertimeItem) {
          // Update existing overtime item
          await prisma.payrollItem.update({
            where: { id: existingOvertimeItem.id },
            data: {
              amount: overtimeAmount,
              description: payroll.employee.overtime_fixed_rate && payroll.employee.overtime_fixed_rate > 0 
                ? `Overtime Pay (Fixed Rate: ${payroll.employee.overtime_fixed_rate} SAR/hr)`
                : `Overtime Pay (${payroll.employee.overtime_rate_multiplier || 1.5}x Rate)`
            }
          });
        } else if (overtimeAmount > 0) {
          // Create new overtime item
          await prisma.payrollItem.create({
            data: {
              payroll_id: payroll.id,
              type: 'overtime',
              description: payroll.employee.overtime_fixed_rate && payroll.employee.overtime_fixed_rate > 0 
                ? `Overtime Pay (Fixed Rate: ${payroll.employee.overtime_fixed_rate} SAR/hr)`
                : `Overtime Pay (${payroll.employee.overtime_rate_multiplier || 1.5}x Rate)`,
              amount: overtimeAmount,
              is_taxable: true,
              tax_rate: 15,
              order: 2
            }
          });
        }

        updatedPayrolls.push(payroll.id.toString());
        console.log(`✅ Updated payroll ${payroll.id} with overtime amount: ${overtimeAmount}`);

      } catch (error) {
        const errorMsg = `Error updating payroll ${payroll.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    let message = `Overtime recalculation completed successfully.\n` +
      `Updated: ${updatedPayrolls.length} payrolls\n` +
      `Errors: ${errors.length}`;

    if (errors.length > 0) {
      message += `\n\nErrors: ${errors.slice(0, 5).join(', ')}`;
      if (errors.length > 5) {
        message += ` and ${errors.length - 5} more...`;
      }
    }

    return NextResponse.json({
      success: true,
      message: message,
      data: {
        total_updated: updatedPayrolls.length,
        total_errors: errors.length,
        updated_payrolls: updatedPayrolls,
        errors: errors
      }
    });
    
  } catch (error) {
    console.error('Overtime recalculation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to recalculate overtime: ' + (error as Error).message,
        error: error
      },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
} 