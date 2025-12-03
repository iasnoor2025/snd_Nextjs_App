import { db } from '@/lib/db';
import { companyDocumentTypes } from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { eq, asc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withPermission(PermissionConfigs.company.read)(async (request: NextRequest) => {
  try {
    console.log('Fetching company document types...');
    
    const documentTypes = await db
      .select()
      .from(companyDocumentTypes)
      .where(eq(companyDocumentTypes.isActive, true))
      .orderBy(asc(companyDocumentTypes.sortOrder), asc(companyDocumentTypes.label));

    console.log('Found document types:', documentTypes.length);

    // Convert dates to ISO strings for JSON serialization
    const formattedTypes = documentTypes.map(type => ({
      ...type,
      createdAt: type.createdAt ? new Date(type.createdAt).toISOString() : null,
      updatedAt: type.updatedAt ? new Date(type.updatedAt).toISOString() : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedTypes,
      message: 'Document types retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching document types:', error);
    console.error('Error details:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch document types: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
});

export const POST = withPermission(PermissionConfigs.company.manage)(async (request: NextRequest) => {
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
    const nowDate = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format for date field
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
        createdAt: nowDate,
        updatedAt: nowDate,
      })
      .returning();

    // Format the returned data
    const formattedType = {
      ...newDocumentType[0],
      createdAt: newDocumentType[0].createdAt ? new Date(newDocumentType[0].createdAt).toISOString() : null,
      updatedAt: newDocumentType[0].updatedAt ? new Date(newDocumentType[0].updatedAt).toISOString() : null,
    };

    return NextResponse.json({
      success: true,
      data: formattedType,
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
});
