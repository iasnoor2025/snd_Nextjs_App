import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { H2SCardService } from '@/lib/services/h2s-card-service';
import { H2SCardPDFService } from '@/lib/services/h2s-card-pdf-service';
import { db } from '@/lib/drizzle';
import { employeeDocuments, employees } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { uploadToMinIO } from '@/lib/utils/file-upload';

// POST /api/employee/[id]/training/[trainingId]/h2s-card-pdf
// Generate H2S card PDF and save to employee documents
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trainingId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId, trainingId } = await params;

    // Get card data
    const cardData = await H2SCardService.getCardData(parseInt(trainingId));
    if (!cardData) {
      return NextResponse.json(
        { error: 'Training record not found' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBytes = await H2SCardPDFService.generateH2SCardPDF(cardData);

    // Get employee for file number
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, parseInt(employeeId)))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const fileNumber = employee.fileNumber || String(employeeId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `h2s-card-${fileNumber}-${timestamp}.pdf`;
    const fullPath = `employee-${fileNumber}/${fileName}`;

    const bucket = process.env.S3_BUCKET_DOCUMENTS || 'employee-documents';
    const upload = await uploadToMinIO(Buffer.from(pdfBytes), fullPath, 'application/pdf', bucket);
    if (!upload.success || !upload.url) {
      return NextResponse.json(
        { error: 'Failed to upload H2S card PDF', details: upload.error || 'Upload error' },
        { status: 500 }
      );
    }
    const filePath = upload.url;

    // Check if H2S card already exists and delete it
    const existingCards = await db
      .select()
      .from(employeeDocuments)
      .where(
        and(
          eq(employeeDocuments.employeeId, parseInt(employeeId)),
          eq(employeeDocuments.documentType, 'h2s_card')
        )
      );

    if (existingCards.length > 0) {
      await db
        .delete(employeeDocuments)
        .where(
          and(
            eq(employeeDocuments.employeeId, parseInt(employeeId)),
            eq(employeeDocuments.documentType, 'h2s_card')
          )
        );
    }

    // Save document record
    const [newDocument] = await db
      .insert(employeeDocuments)
      .values({
        employeeId: parseInt(employeeId),
        documentType: 'h2s_card',
        filePath,
        fileName,
        fileSize: pdfBytes.length,
        mimeType: 'application/pdf',
        description: `H2S Awareness & SCBA Certification Card - ${cardData.cardNumber}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'H2S card PDF generated and saved successfully',
      document: newDocument,
    });
  } catch (error) {
    console.error('Error generating H2S card PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate H2S card PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

