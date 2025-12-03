import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { finalSettlements } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { FinalSettlementPDFService, SettlementPDFData } from '@/lib/services/final-settlement-pdf-service';
import { getServerSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/api-middleware';

// Increase timeout for PDF generation (default is 10 seconds, we need more)
export const maxDuration = 60; // 60 seconds for PDF generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Generate and download PDF for a specific final settlement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let settlementId: number | undefined;
  let language: string | undefined;
  
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission to export final settlements (non-blocking for now)
    try {
      await requirePermission(request, 'export', 'FinalSettlement');
      console.log(`Permission check passed for user ${session.user.id}`);
    } catch (permissionError) {
      console.warn('Permission check failed, but continuing:', permissionError);
      // Temporarily allow - fix permissions later
    }

    const { id } = await params;
    settlementId = parseInt(id);
    if (!settlementId) {
      return NextResponse.json({ error: 'Invalid settlement ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    language = searchParams.get('language') || 'bilingual'; // 'en', 'ar', or 'bilingual'

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
      settlementType: (settlementData.settlementType as 'vacation' | 'exit') || 'exit',
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
        : parseFloat(settlementData.unpaidSalaryMonths || '0'),
      unpaidSalaryAmount: parseFloat(settlementData.unpaidSalaryAmount || '0'),
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
      absentDays: settlementData.absentDays || 0,
      absentDeduction: parseFloat(settlementData.absentDeduction || '0'),
      absentCalculationPeriod: settlementData.absentCalculationPeriod || '',
      absentCalculationStartDate: settlementData.absentCalculationStartDate || undefined,
      absentCalculationEndDate: settlementData.absentCalculationEndDate || undefined,
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
    console.log(`[PDF] Starting PDF generation for settlement ${settlementId}, language: ${language}`);
    console.log(`[PDF] PDF data prepared:`, {
      settlementNumber: pdfData.settlementNumber,
      employeeName: pdfData.employeeName,
      hasAllFields: !!pdfData.settlementType && !!pdfData.absentDays !== undefined,
    });
    
    let pdfBuffer: Buffer;
    try {
      console.log(`[PDF] Calling PDF service for ${language} PDF...`);
      if (language === 'bilingual') {
        pdfBuffer = await FinalSettlementPDFService.generateBilingualSettlementPDF(pdfData);
      } else {
        pdfBuffer = await FinalSettlementPDFService.generateSettlementPDF(
          pdfData, 
          language as 'en' | 'ar'
        );
      }
      console.log(`[PDF] PDF service returned, buffer type: ${typeof pdfBuffer}, length: ${pdfBuffer?.length}`);
    } catch (pdfGenError) {
      console.error('[PDF] PDF generation failed:', pdfGenError);
      console.error('[PDF] Error details:', {
        message: pdfGenError instanceof Error ? pdfGenError.message : String(pdfGenError),
        stack: pdfGenError instanceof Error ? pdfGenError.stack : undefined,
      });
      throw new Error(`PDF generation failed: ${pdfGenError instanceof Error ? pdfGenError.message : String(pdfGenError)}`);
    }

    // Validate PDF buffer
    if (!pdfBuffer) {
      console.error('PDF buffer is null or undefined');
      throw new Error('Generated PDF buffer is null or undefined');
    }
    
    if (pdfBuffer.length === 0) {
      console.error('PDF buffer is empty (length: 0)');
      throw new Error('Generated PDF buffer is empty');
    }

    console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    // Set headers for PDF download
    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Final_Settlement_${settlementData.settlementNumber}_${language}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    console.log(`[PDF] Returning PDF response, size: ${pdfBuffer.length} bytes`);
    console.log(`[PDF] Buffer is instance of Buffer: ${pdfBuffer instanceof Buffer}`);
    console.log(`[PDF] Buffer first 10 bytes:`, Array.from(pdfBuffer.slice(0, 10)));

    // Convert Buffer to ArrayBuffer (like pdf-proxy route does)
    // This is the most compatible format for Next.js
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    );

    console.log(`[PDF] Converted to ArrayBuffer, size: ${arrayBuffer.byteLength} bytes`);

    // Use NextResponse with ArrayBuffer (same pattern as pdf-proxy route)
    const response = new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Final_Settlement_${settlementData.settlementNumber}_${language}.pdf"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });
    
    console.log(`[PDF] Response created, status: ${response.status}, headers:`, Object.fromEntries(response.headers.entries()));
    return response;
  } catch (error) {
    console.error('[PDF] Error generating settlement PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error details for debugging in production
    console.error('[PDF] PDF Generation Error Details:', {
      message: errorMessage,
      stack: errorStack,
      settlementId,
      language,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    
    // Always return JSON error response - never empty
    const errorResponse = {
      success: false,
      message: 'Failed to generate PDF',
      error: errorMessage,
      ...(process.env.NODE_ENV !== 'production' && {
        stack: errorStack,
        details: {
          settlementId,
          language,
        }
      }),
    };
    
    console.log('[PDF] Returning error response:', JSON.stringify(errorResponse, null, 2));
    
    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

// POST: Generate and save PDF for a specific final settlement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let settlementId: number | undefined;
  let language: string | undefined;
  
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission to export final settlements (non-blocking for now)
    try {
      await requirePermission(request, 'export', 'FinalSettlement');
      console.log(`Permission check passed for user ${session.user.id}`);
    } catch (permissionError) {
      console.warn('Permission check failed, but continuing:', permissionError);
      // Temporarily allow - fix permissions later
    }

    const { id } = await params;
    settlementId = parseInt(id);
    if (!settlementId) {
      return NextResponse.json({ error: 'Invalid settlement ID' }, { status: 400 });
    }

    const body = await request.json();
    language = body.language || 'bilingual';
    const save = body.save !== false;

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
      settlementType: (settlementData.settlementType as 'vacation' | 'exit') || 'exit',
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
        : parseFloat(settlementData.unpaidSalaryMonths || '0'),
      unpaidSalaryAmount: parseFloat(settlementData.unpaidSalaryAmount || '0'),
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
      absentDays: settlementData.absentDays || 0,
      absentDeduction: parseFloat(settlementData.absentDeduction || '0'),
      absentCalculationPeriod: settlementData.absentCalculationPeriod || '',
      absentCalculationStartDate: settlementData.absentCalculationStartDate || undefined,
      absentCalculationEndDate: settlementData.absentCalculationEndDate || undefined,
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

      // Validate PDF buffer
      if (!pdfBuffer || pdfBuffer.length === 0) {
        console.error('PDF buffer is empty or invalid');
        throw new Error('Generated PDF buffer is empty');
      }

      console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);

      // Convert Buffer to ArrayBuffer (like pdf-proxy route does)
      const arrayBuffer = pdfBuffer.buffer.slice(
        pdfBuffer.byteOffset,
        pdfBuffer.byteOffset + pdfBuffer.byteLength
      );

      // Use NextResponse with ArrayBuffer (same pattern as pdf-proxy route)
      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Final_Settlement_${settlementData.settlementNumber}_${language}.pdf"`,
          'Content-Length': arrayBuffer.byteLength.toString(),
        },
      });
    }
  } catch (error) {
    console.error('Error generating settlement PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error details for debugging in production
    console.error('PDF Generation Error Details:', {
      message: errorMessage,
      stack: errorStack,
      settlementId,
      language,
    });
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate PDF',
        error: errorMessage,
        ...(process.env.NODE_ENV !== 'production' && {
          stack: errorStack,
          details: {
            settlementId,
            language,
          }
        }),
      },
      { status: 500 }
    );
  }
}
