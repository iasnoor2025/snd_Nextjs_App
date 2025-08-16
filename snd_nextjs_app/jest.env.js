// Jest environment setup file
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.ERPNEXT_URL = 'http://localhost:8000';
process.env.ERPNEXT_API_KEY = 'test-api-key';
process.env.ERPNEXT_API_SECRET = 'test-api-secret';
