import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pdfUrl = searchParams.get('url');

    if (!pdfUrl) {
      return NextResponse.json(
        { error: 'PDF URL is required' },
        { status: 400 }
      );
    }

    // Validate and normalize the URL
    let urlToFetch: string;
    try {
      const urlObj = new URL(pdfUrl);
      
      // Ensure HTTPS for MinIO/S3 endpoints
      if (urlObj.hostname.includes('minio') || urlObj.hostname.includes('s3')) {
        urlObj.protocol = 'https:';
      }
      
      urlToFetch = urlObj.toString();
    } catch (urlError) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the PDF from the URL
    const response = await fetch(urlToFetch, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
      // Don't follow redirects automatically, handle them manually
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`Failed to fetch PDF from ${urlToFetch}: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    // Return the PDF with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error proxying PDF:', error);
    return NextResponse.json(
      { error: 'Failed to proxy PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

