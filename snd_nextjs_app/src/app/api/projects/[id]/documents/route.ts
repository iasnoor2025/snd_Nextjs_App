import { db } from '@/lib/drizzle';
import { projectDocuments, projects } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@/lib/redis/cache-service';
import { ensureHttps } from '@/lib/utils/url-utils';

export const GET = withPermission(PermissionConfigs.project.read)(async (_request: NextRequest, ...args: unknown[]) => {
  const { params } = args[0] as { params: Promise<{ id: string }> };
  let projectId: number | null = null;
  
  try {
    const resolvedParams = await params;

    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = resolvedParams;
    projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Try to get from cache first
    const cacheKey = `project:${projectId}:documents`;
    const cachedDocuments = await cacheService.get(cacheKey, 'documents');
    
    if (cachedDocuments) {
      return NextResponse.json(cachedDocuments);
    }

    // Check if project exists
    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!projectResult[0]) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get project documents
    const documentsRows = await db
      .select({
        id: projectDocuments.id,
        projectId: projectDocuments.projectId,
        documentType: projectDocuments.documentType,
        fileName: projectDocuments.fileName,
        filePath: projectDocuments.filePath,
        fileSize: projectDocuments.fileSize,
        mimeType: projectDocuments.mimeType,
        description: projectDocuments.description,
        createdAt: projectDocuments.createdAt,
        updatedAt: projectDocuments.updatedAt,
      })
      .from(projectDocuments)
      .where(eq(projectDocuments.projectId, projectId))
      .orderBy(desc(projectDocuments.createdAt));

    // Format response to match what DocumentManager expects
    const formattedDocuments = documentsRows.map(doc => {
      try {
        // Create a user-friendly display name from the document type
        const displayName = doc.documentType
          ? doc.documentType.replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          : 'Unknown Document';
        
        return {
          id: doc.id,
          name: displayName,
          file_name: doc.fileName || 'Unknown Document',
          file_type: doc.mimeType || 'application/octet-stream',
          size: doc.fileSize || 0,
          url: ensureHttps(doc.filePath),
          mime_type: doc.mimeType || '',
          document_type: doc.documentType || '',
          description: doc.description || '',
          created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
          updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
          // Also include the original field names for backward compatibility
          fileName: doc.fileName,
          filePath: doc.filePath,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          documentType: doc.documentType,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          typeLabel: displayName,
        };
      } catch (docError) {
        console.error('Error formatting document:', doc, docError);
        return {
          id: doc.id,
          name: 'Unknown Document',
          file_name: 'Unknown Document',
          file_type: 'application/octet-stream',
          size: 0,
          url: '',
          mime_type: '',
          document_type: '',
          description: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          fileName: doc.fileName,
          filePath: doc.filePath,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          documentType: doc.documentType,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          typeLabel: 'Unknown Document',
        };
      }
    });

    // Cache the formatted documents for 5 minutes
    await cacheService.set(cacheKey, formattedDocuments, {
      ttl: 300,
      prefix: 'documents',
      tags: [`project:${projectId}`, 'documents']
    });

    return NextResponse.json(formattedDocuments);
  } catch (error) {
    let errorMessage = 'Internal server error';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }

    console.error('Error in getProjectDocumentsHandler:', {
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      projectId: projectId
    });

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        projectId: projectId
      },
      { status: 500 }
    );
  }
});
