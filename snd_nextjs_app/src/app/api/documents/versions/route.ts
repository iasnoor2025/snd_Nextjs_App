import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { documentVersions, documentApprovals, users } from '@/lib/drizzle/schema';
import { eq, and, desc, asc, like } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const documentId = searchParams.get('document_id') || '';

    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        like(documentVersions.title, `%${search}%`)
      );
    }
    
    if (status && status !== 'all') {
      whereConditions.push(eq(documentVersions.status, status));
    }
    
    if (documentId) {
      whereConditions.push(eq(documentVersions.documentId, parseInt(documentId)));
    }

    // Get total count
    const totalCount = await db
      .select({ count: documentVersions.id })
      .from(documentVersions)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = totalCount.length;

    // Get document versions with pagination
    const versions = await db
      .select({
        id: documentVersions.id,
        documentId: documentVersions.documentId,
        version: documentVersions.version,
        title: documentVersions.title,
        content: documentVersions.content,
        filePath: documentVersions.filePath,
        fileSize: documentVersions.fileSize,
        mimeType: documentVersions.mimeType,
        status: documentVersions.status,
        createdBy: documentVersions.createdBy,
        createdAt: documentVersions.createdAt,
        updatedAt: documentVersions.updatedAt,
        // Related data
        createdByName: users.name,
      })
      .from(documentVersions)
      .leftJoin(users, eq(documentVersions.createdBy, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(documentVersions.createdAt))
      .limit(limit)
      .offset(offset);

    const lastPage = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: versions,
      current_page: page,
      last_page: lastPage,
      per_page: limit,
      total,
      next_page_url: page < lastPage ? `/api/documents/versions?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/documents/versions?page=${page - 1}` : null,
    });
  } catch (error) {
    console.error('Error fetching document versions:', error);
    return NextResponse.json({ error: 'Failed to fetch document versions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      documentId,
      version,
      title,
      content,
      filePath,
      fileSize,
      mimeType,
      status = 'draft',
    } = body;

    // Validation
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    if (!version) {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create document version
    const [newVersion] = await db
      .insert(documentVersions)
      .values({
        documentId: parseInt(documentId),
        version,
        title,
        content,
        filePath,
        fileSize: fileSize ? parseInt(fileSize) : null,
        mimeType,
        status,
        createdBy: session.user.id,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newVersion,
      message: 'Document version created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating document version:', error);
    return NextResponse.json({ error: 'Failed to create document version' }, { status: 500 });
  }
}
