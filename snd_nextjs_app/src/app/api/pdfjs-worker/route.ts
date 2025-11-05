import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read the worker file from node_modules (using legacy build for compatibility)
    const workerPath = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs');
    const workerContent = readFileSync(workerPath, 'utf-8');

    // Return the worker file with proper headers
    return new NextResponse(workerContent, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving PDF.js worker:', error);
    return NextResponse.json(
      { error: 'Failed to load PDF.js worker' },
      { status: 500 }
    );
  }
}

