import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      NEXT_PUBLIC_ERPNEXT_URL: process.env.NEXT_PUBLIC_ERPNEXT_URL,
      NEXT_PUBLIC_ERPNEXT_API_KEY: process.env.NEXT_PUBLIC_ERPNEXT_API_KEY ? '***' + process.env.NEXT_PUBLIC_ERPNEXT_API_KEY.slice(-4) : null,
      NEXT_PUBLIC_ERPNEXT_API_SECRET: process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET ? '***' + process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET.slice(-4) : null,
      ERPNEXT_API_KEY: process.env.ERPNEXT_API_KEY ? '***' + process.env.ERPNEXT_API_KEY.slice(-4) : null,
      ERPNEXT_API_SECRET: process.env.ERPNEXT_API_SECRET ? '***' + process.env.ERPNEXT_API_SECRET.slice(-4) : null,
      DATABASE_URL: process.env.DATABASE_URL ? '***' + process.env.DATABASE_URL.slice(-20) : null,
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json({
      success: true,
      environment: envVars,
      hasRequiredVars: {
        hasUrl: !!process.env.NEXT_PUBLIC_ERPNEXT_URL,
        hasKey: !!process.env.NEXT_PUBLIC_ERPNEXT_API_KEY,
        hasSecret: !!process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 