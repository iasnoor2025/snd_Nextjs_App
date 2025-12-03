import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// List files in company-documents bucket and map them to document types based on prefix: company-<documentTypeId>/
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
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
        // Supported keys: company-<docTypeId>/<filename> (legacy) OR company-<companyId>-<docTypeId>/<filename>
        let documentTypeId = 0;
        let fileName = key.split('/').pop() || key;
        let keyCompanyId: string | null = null;

        // New pattern with company scope
        const matchNew = key.match(/^company-(\d+)-(\d+)\/(.+)$/);
        if (matchNew) {
          keyCompanyId = matchNew[1];
          documentTypeId = parseInt(matchNew[2]);
          fileName = matchNew[3];
        } else {
          const matchLegacy = key.match(/^company-(\d+)\/(.+)$/);
          if (matchLegacy) {
            documentTypeId = parseInt(matchLegacy[1]);
            fileName = matchLegacy[2];
          }
        }

        // If companyId filter is provided, keep only matching new-pattern keys
        if (companyId && keyCompanyId !== companyId) {
          return null as any;
        }
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
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('List company document files error:', error);
    return NextResponse.json({ success: false, message: 'Failed to list files' }, { status: 500 });
  }
}
