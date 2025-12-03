import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    const s3 = new S3Client({
      endpoint,
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    const bucket = 'company-documents';
    const { key } = await params;
    const objectKey = (key || []).map(segment => decodeURIComponent(segment)).join('/');

    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }));

    // Readable stream to web stream
    const body = res.Body as any;
    const stream = body?.transformToWebStream ? body.transformToWebStream() : body;

    const headers = new Headers();
    if (res.ContentType) headers.set('Content-Type', res.ContentType);
    if (res.ContentLength) headers.set('Content-Length', String(res.ContentLength));

    const url = new URL(request.url);
    if (url.searchParams.has('download')) {
      const filename = objectKey.split('/').pop() || 'document';
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      // inline
      headers.set('Content-Disposition', 'inline');
    }

    return new NextResponse(stream as unknown as BodyInit, { status: 200, headers });
  } catch (error) {
    console.error('Company doc proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    const s3 = new S3Client({
      endpoint,
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    const bucket = 'company-documents';
    const { key } = await params;
    const objectKey = (key || []).map(segment => decodeURIComponent(segment)).join('/');

    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));

    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('Company doc delete error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}


