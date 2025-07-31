import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import puppeteer from 'puppeteer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // Connect to database
    await prisma.$connect();

    // Get payroll with employee and items
    const payroll = await prisma.payroll.findUnique({
      where: { id: id },
      include: {
        employee: true,
        items: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!payroll) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll not found'
        },
        { status: 404 }
      );
    }

    // Get the payslip page HTML from the frontend
    const payslipPageUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/modules/payroll-management/${id}/payslip`;
    
    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set viewport for better rendering
    await page.setViewport({ width: 1200, height: 800 });
    
    // Navigate to the payslip page
    await page.goto(payslipPageUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for the content to load
    await page.waitForSelector('.payslip-container', { timeout: 10000 });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    await browser.close();

    // Return the PDF as a response
    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="payslip_${payroll.employee?.id || 'unknown'}_${payroll.month}_${payroll.year}.pdf"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error generating payslip PDF:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error generating payslip PDF: ' + (error as Error).message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


