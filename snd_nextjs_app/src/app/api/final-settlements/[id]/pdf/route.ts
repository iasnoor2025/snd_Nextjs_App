import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { finalSettlements } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { FinalSettlementPDFService, SettlementPDFData } from '@/lib/services/final-settlement-pdf-service';
import { getServerSession } from 'next-auth/next';


// GET: Generate and download PDF for a specific final settlement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const settlementId = parseInt(id);
    if (!settlementId) {
      return NextResponse.json({ error: 'Invalid settlement ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'bilingual'; // 'en', 'ar', or 'bilingual'

    // Fetch settlement data
    const settlement = await db
      .select()
      .from(finalSettlements)
      .where(eq(finalSettlements.id, settlementId))
      .limit(1);

    if (!settlement.length) {
      return NextResponse.json({ error: 'Final settlement not found' }, { status: 404 });
    }

    const settlementData = settlement[0];

    // Prepare PDF data
    const pdfData: SettlementPDFData = {
      settlementNumber: settlementData.settlementNumber,
      employeeName: settlementData.employeeName,
      fileNumber: settlementData.fileNumber || undefined,
      iqamaNumber: settlementData.iqamaNumber || undefined,
      nationality: settlementData.nationality || undefined,
      designation: settlementData.designation || undefined,
      department: settlementData.department || undefined,
      hireDate: settlementData.hireDate,
      lastWorkingDate: settlementData.lastWorkingDate,
      totalServiceYears: settlementData.totalServiceYears,
      totalServiceMonths: settlementData.totalServiceMonths,
      totalServiceDays: settlementData.totalServiceDays,
      lastBasicSalary: parseFloat(settlementData.lastBasicSalary),
      unpaidSalaryMonths: settlementData.unpaidSalaryAmount > 0 && parseFloat(settlementData.lastBasicSalary) > 0 
        ? Math.round((parseFloat(settlementData.unpaidSalaryAmount) / parseFloat(settlementData.lastBasicSalary)) * 10) / 10
        : settlementData.unpaidSalaryMonths,
      unpaidSalaryAmount: parseFloat(settlementData.unpaidSalaryAmount),
      endOfServiceBenefit: parseFloat(settlementData.endOfServiceBenefit),
      benefitCalculationMethod: settlementData.benefitCalculationMethod,
      accruedVacationDays: settlementData.accruedVacationDays || 0,
      accruedVacationAmount: parseFloat(settlementData.accruedVacationAmount || '0'),
      otherBenefits: parseFloat(settlementData.otherBenefits || '0'),
      otherBenefitsDescription: settlementData.otherBenefitsDescription || undefined,
      overtimeHours: parseFloat(settlementData.overtimeHours || '0'),
      overtimeAmount: parseFloat(settlementData.overtimeAmount || '0'),
      pendingAdvances: parseFloat(settlementData.pendingAdvances || '0'),
      equipmentDeductions: parseFloat(settlementData.equipmentDeductions || '0'),
      otherDeductions: parseFloat(settlementData.otherDeductions || '0'),
      otherDeductionsDescription: settlementData.otherDeductionsDescription || undefined,
      grossAmount: parseFloat(settlementData.grossAmount),
      totalDeductions: parseFloat(settlementData.totalDeductions),
      netAmount: parseFloat(settlementData.netAmount),
      currency: settlementData.currency,
      notes: settlementData.notes || undefined,
      preparedAt: settlementData.preparedAt,
      companyName: 'SND Equipment Rental Company',
      companyAddress: 'Kingdom of Saudi Arabia',
      companyPhone: process.env.COMPANY_PHONE || 'N/A',
      companyEmail: process.env.COMPANY_EMAIL || 'N/A',
    };

    // Generate PDF
    let pdfBuffer: Buffer;
    if (language === 'bilingual') {
      pdfBuffer = await FinalSettlementPDFService.generateBilingualSettlementPDF(pdfData);
    } else {
      pdfBuffer = await FinalSettlementPDFService.generateSettlementPDF(
        pdfData, 
        language as 'en' | 'ar'
      );
    }

    // Set headers for PDF download
    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Final_Settlement_${settlementData.settlementNumber}_${language}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    return new NextResponse(pdfBuffer as any, { headers });
  } catch (error) {
    console.error('Error generating settlement PDF:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate PDF',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Generate and save PDF for a specific final settlement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const settlementId = parseInt(id);
    if (!settlementId) {
      return NextResponse.json({ error: 'Invalid settlement ID' }, { status: 400 });
    }

    const body = await request.json();
    const { language = 'bilingual', save = true } = body;

    // Fetch settlement data
    const settlement = await db
      .select()
      .from(finalSettlements)
      .where(eq(finalSettlements.id, settlementId))
      .limit(1);

    if (!settlement.length) {
      return NextResponse.json({ error: 'Final settlement not found' }, { status: 404 });
    }

    const settlementData = settlement[0];

    // Prepare PDF data
    const pdfData: SettlementPDFData = {
      settlementNumber: settlementData.settlementNumber,
      employeeName: settlementData.employeeName,
      fileNumber: settlementData.fileNumber || undefined,
      iqamaNumber: settlementData.iqamaNumber || undefined,
      nationality: settlementData.nationality || undefined,
      designation: settlementData.designation || undefined,
      department: settlementData.department || undefined,
      hireDate: settlementData.hireDate,
      lastWorkingDate: settlementData.lastWorkingDate,
      totalServiceYears: settlementData.totalServiceYears,
      totalServiceMonths: settlementData.totalServiceMonths,
      totalServiceDays: settlementData.totalServiceDays,
      lastBasicSalary: parseFloat(settlementData.lastBasicSalary),
      unpaidSalaryMonths: settlementData.unpaidSalaryAmount > 0 && parseFloat(settlementData.lastBasicSalary) > 0 
        ? Math.round((parseFloat(settlementData.unpaidSalaryAmount) / parseFloat(settlementData.lastBasicSalary)) * 10) / 10
        : settlementData.unpaidSalaryMonths,
      unpaidSalaryAmount: parseFloat(settlementData.unpaidSalaryAmount),
      endOfServiceBenefit: parseFloat(settlementData.endOfServiceBenefit),
      benefitCalculationMethod: settlementData.benefitCalculationMethod,
      accruedVacationDays: settlementData.accruedVacationDays || 0,
      accruedVacationAmount: parseFloat(settlementData.accruedVacationAmount || '0'),
      otherBenefits: parseFloat(settlementData.otherBenefits || '0'),
      otherBenefitsDescription: settlementData.otherBenefitsDescription || undefined,
      overtimeHours: parseFloat(settlementData.overtimeHours || '0'),
      overtimeAmount: parseFloat(settlementData.overtimeAmount || '0'),
      pendingAdvances: parseFloat(settlementData.pendingAdvances || '0'),
      equipmentDeductions: parseFloat(settlementData.equipmentDeductions || '0'),
      otherDeductions: parseFloat(settlementData.otherDeductions || '0'),
      otherDeductionsDescription: settlementData.otherDeductionsDescription || undefined,
      grossAmount: parseFloat(settlementData.grossAmount),
      totalDeductions: parseFloat(settlementData.totalDeductions),
      netAmount: parseFloat(settlementData.netAmount),
      currency: settlementData.currency,
      notes: settlementData.notes || undefined,
      preparedAt: settlementData.preparedAt,
      companyName: 'SND Equipment Rental Company',
      companyAddress: 'Kingdom of Saudi Arabia',
      companyPhone: process.env.COMPANY_PHONE || 'N/A',
      companyEmail: process.env.COMPANY_EMAIL || 'N/A',
    };

    if (save) {
      // Save PDF to file system and update database
      const pdfPath = await FinalSettlementPDFService.saveSettlementPDF(pdfData, language);

      // Update settlement record with PDF path
      await db
        .update(finalSettlements)
        .set({
          pdfPath,
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .where(eq(finalSettlements.id, settlementId));

      return NextResponse.json({
        success: true,
        message: 'PDF generated and saved successfully',
        data: {
          pdfPath,
          downloadUrl: `/api/final-settlements/${settlementId}/pdf?language=${language}`,
        },
      });
    } else {
      // Just generate and return the PDF
      let pdfBuffer: Buffer;
      if (language === 'bilingual') {
        pdfBuffer = await FinalSettlementPDFService.generateBilingualSettlementPDF(pdfData);
      } else {
        pdfBuffer = await FinalSettlementPDFService.generateSettlementPDF(
          pdfData, 
          language as 'en' | 'ar'
        );
      }

      const headers = new Headers({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Final_Settlement_${settlementData.settlementNumber}_${language}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      return new NextResponse(pdfBuffer as any, { headers });
    }
  } catch (error) {
    console.error('Error generating settlement PDF:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate PDF',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
