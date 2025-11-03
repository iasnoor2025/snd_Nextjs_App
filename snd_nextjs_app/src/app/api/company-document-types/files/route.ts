import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// List files in company-documents bucket and map them to document types based on prefix: company-<documentTypeId>/
export async function GET(_request: NextRequest) {
  try {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ success: true, data: [] });
    }

    const s3 = new S3Client({
      endpoint,
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    const bucket = 'company-documents';
    const listed = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
    const baseUrl = (process.env.S3_ENDPOINT || '').replace(/\/$/, '');

    const items = (listed.Contents || [])
      .filter(obj => obj.Key)
      .map((obj, idx) => {
        const key = obj.Key as string;
        // Expect keys like: company-<id>/<filename>
        const match = key.match(/^company-(\d+)\/(.+)$/);
        const documentTypeId = match ? parseInt(match[1]) : 0;
        const fileName = match ? match[2] : key.split('/').pop() || key;
        const encodedKey = key.split('/').map(encodeURIComponent).join('/');
        return {
          id: idx + 1,
          documentTypeId,
          fileName,
          // Use proxy endpoint so bucket can remain private
          filePath: `/api/company-documents/${encodedKey}`,
          fileSize: Number(obj.Size || 0),
          mimeType: '',
          expiryDate: null,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'system',
        };
      });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('List company document files error:', error);
    return NextResponse.json({ success: false, message: 'Failed to list files' }, { status: 500 });
  }
}
