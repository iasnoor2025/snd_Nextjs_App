import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Test API route is working',
    timestamp: new Date().toISOString(),
  });
}
