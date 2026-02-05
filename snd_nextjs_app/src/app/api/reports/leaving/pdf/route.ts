
import { NextRequest, NextResponse } from 'next/server';
import { LeavingReportPDFService } from '@/lib/services/leaving-report-pdf-service';
import { db } from '@/lib/drizzle';
import { finalSettlements } from '@/lib/drizzle/schema';
import { eq, and, gte, lte, desc, sql, count, sum } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const language = (searchParams.get('lang') || 'en') as 'en' | 'ar';

        const whereConditions = [eq(finalSettlements.settlementType, 'exit')];

        if (startDate) {
            whereConditions.push(gte(finalSettlements.lastWorkingDate, startDate));
        }
        if (endDate) {
            whereConditions.push(lte(finalSettlements.lastWorkingDate, endDate));
        }

        const whereExpr = and(...whereConditions);

        const [
            summaryStats,
            leavingDetails
        ] = await Promise.all([
            // Summary Statistics for exiting employees
            db.select({
                total_exits: count(),
                resigned_count: count(sql`CASE WHEN ${finalSettlements.benefitCalculationMethod} = 'resigned' THEN 1 END`),
                terminated_count: count(sql`CASE WHEN ${finalSettlements.benefitCalculationMethod} = 'terminated' THEN 1 END`),
                total_settlement_amount: sum(sql`COALESCE(${finalSettlements.netAmount}, 0)`)
            })
                .from(finalSettlements)
                .where(whereExpr),

            // Detailed list of exiting employees
            db.select({
                id: finalSettlements.id,
                employee_id: finalSettlements.employeeId,
                employee_name: finalSettlements.employeeName,
                file_number: finalSettlements.fileNumber,
                designation: finalSettlements.designation,
                department: finalSettlements.department,
                hire_date: finalSettlements.hireDate,
                last_working_date: finalSettlements.lastWorkingDate,
                reason: finalSettlements.benefitCalculationMethod,
                net_amount: finalSettlements.netAmount,
                status: finalSettlements.status,
                settlement_number: finalSettlements.settlementNumber
            })
                .from(finalSettlements)
                .where(whereExpr)
                .orderBy(desc(finalSettlements.lastWorkingDate))
        ]);

        const reportData = {
            summary_stats: summaryStats[0] || {
                total_exits: 0,
                resigned_count: 0,
                terminated_count: 0,
                total_settlement_amount: 0
            },
            leaving_details: leavingDetails || [],
            generated_at: new Date().toISOString()
        };

        // Generate PDF
        const pdfBuffer = await LeavingReportPDFService.generateLeavingReportPDF(reportData, language);

        // Generate filename
        const filename = `Leaving_Report_${new Date().toISOString().split('T')[0]}.pdf`;

        // Return PDF
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error generating leaving report PDF:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate PDF',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
