import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadToMinIO(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  bucketName: string = 'snd-documents'
): Promise<UploadResult> {
  try {
    // Initialize MinIO S3 client
    const s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT!,
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    // Upload file to MinIO
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Generate MinIO public URL - Force HTTPS for production
    const baseUrl = process.env.S3_ENDPOINT?.replace(/\/$/, '');
    const secureUrl = baseUrl?.replace(/^http:\/\//, 'https://') || baseUrl;
    const minioUrl = `${secureUrl}/${bucketName}/${fileName}`;

    return {
      success: true,
      url: minioUrl
    };

  } catch (error) {
    console.error('MinIO upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}
