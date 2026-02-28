import { NextResponse } from 'next/server';

/**
 * Health check endpoint for monitoring and load balancers.
 * Returns 200 when the app is running. Does not check DB to avoid coupling.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
    },
    { status: 200 }
  );
}
