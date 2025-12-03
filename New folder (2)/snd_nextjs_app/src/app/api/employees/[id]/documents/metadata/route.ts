import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

import { db } from '@/lib/drizzle';
import { employeeDocuments } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// POST - Create new employee document record
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = parseInt(params.id);
    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    const body = await request.json();
    const { documentType, filePath, fileName, fileSize, mimeType, description } = body;

    if (!documentType || !filePath || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert document record into database
    const [newDocument] = await db
      .insert(employeeDocuments)
      .values({
        employeeId,
        documentType,
        filePath,
        fileName,
        fileSize: fileSize || 0,
        mimeType: mimeType || 'application/octet-stream',
        description: description || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      document: newDocument,
      message: 'Document record created successfully' 
    });
  } catch (error) {
    console.error('Error creating employee document record:', error);
    return NextResponse.json(
      { error: 'Failed to create document record' },
      { status: 500 }
    );
  }
}
