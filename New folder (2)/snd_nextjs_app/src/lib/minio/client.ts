import { S3Client } from '@aws-sdk/client-s3';

// Storage bucket constants
export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  EMPLOYEE_DOCUMENTS: 'employee-documents',
  EQUIPMENT_DOCUMENTS: 'equipment-documents',
  GENERAL: 'general',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

// Check if MinIO is configured
export function isMinIOConfigured(): boolean {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

// Create S3 client instance
export function createS3Client(): S3Client {
  if (!isMinIOConfigured()) {
    throw new Error('MinIO is not configured. Please set S3_ENDPOINT, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.');
  }

  return new S3Client({ 
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true, // Required for MinIO
  });
}

// Global S3 client instance
let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = createS3Client();
  }
  return s3ClientInstance;
}

// Export the client instance for backward compatibility (lazy-loaded)
export const s3Client = {
  send: (command: any) => getS3Client().send(command)
};