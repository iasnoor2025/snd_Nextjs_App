import { db } from '@/lib/db';
import { companyDocumentTypes } from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { eq, asc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withPermission(async (request: NextRequest) => {
  try {
    console.log('Fetching company document types...');
    
    const documentTypes = await db
      .select()
      .from(companyDocumentTypes)
      .where(eq(companyDocumentTypes.isActive, true))
      .orderBy(asc(companyDocumentTypes.sortOrder), asc(companyDocumentTypes.label));

    console.log('Found document types:', documentTypes.length);

    return NextResponse.json({
      success: true,
      data: documentTypes,
      message: 'Document types retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching document types:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch document types: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.company.read);

export const POST = withPermission(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.key || !body.label) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document type key and label are required',
        },
        { status: 400 }
      );
    }

    // Check if document type with same key already exists
    const existingType = await db
      .select({ id: companyDocumentTypes.id })
      .from(companyDocumentTypes)
      .where(eq(companyDocumentTypes.key, body.key))
      .limit(1);

    if (existingType[0]) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document type with this key already exists',
        },
        { status: 400 }
      );
    }

    // Create new document type
    const nowIso = new Date().toISOString();
    const newDocumentType = await db
      .insert(companyDocumentTypes)
      .values({
        key: body.key,
        label: body.label,
        description: body.description || '',
        required: body.required || false,
        category: body.category || 'general',
        sortOrder: body.sortOrder || 0,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newDocumentType[0],
      message: 'Document type created successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create document type: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.company.manage);
