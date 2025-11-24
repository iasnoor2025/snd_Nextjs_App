import { db } from '@/lib/db';
import { companyDocumentTypes } from '@/lib/drizzle/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Test: Fetching company document types...');
    
    const documentTypes = await db
      .select()
      .from(companyDocumentTypes);
    
    console.log('Test: Found document types:', documentTypes.length);
    
    return NextResponse.json({
      success: true,
      data: documentTypes,
      message: 'Document types retrieved successfully (TEST)',
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch document types: ' + (error as Error).message,
        error: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
