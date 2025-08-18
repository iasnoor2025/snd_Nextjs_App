import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check all ERPNext related environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_ERPNEXT_URL: process.env.NEXT_PUBLIC_ERPNEXT_URL,
      NEXT_PUBLIC_ERPNEXT_API_KEY: process.env.NEXT_PUBLIC_ERPNEXT_API_KEY,
      NEXT_PUBLIC_ERPNEXT_API_SECRET: process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET,
      ERPNEXT_URL: process.env.ERPNEXT_URL,
      ERPNEXT_API_KEY: process.env.ERPNEXT_API_KEY,
      ERPNEXT_API_SECRET: process.env.ERPNEXT_API_SECRET,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    };

    // Check which variables are actually available
    const availableVars = Object.keys(process.env).filter(key => key.includes('ERPNEXT'));
    
    // Test ERPNext connection if variables are available
    let erpnextTest = null;
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || process.env.ERPNEXT_URL;
    const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY || process.env.ERPNEXT_API_KEY;
    const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET || process.env.ERPNEXT_API_SECRET;

    if (ERPNEXT_URL && ERPNEXT_API_KEY && ERPNEXT_API_SECRET) {
      try {
        const response = await fetch(`${ERPNEXT_URL}/api/method/frappe.auth.get_logged_user`, {
          headers: {
            Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
            'Content-Type': 'application/json',
          },
        });
        
        erpnextTest = {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: `${ERPNEXT_URL}/api/method/frappe.auth.get_logged_user`,
        };
      } catch (error) {
        erpnextTest = {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: `${ERPNEXT_URL}/api/method/frappe.auth.get_logged_user`,
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Environment variables check completed',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production',
      },
      environmentVariables: envVars,
      availableERPNextVars: availableVars,
      erpnextConnectionTest: erpnextTest,
      recommendations: {
        missingVars: Object.entries(envVars)
          .filter(([key, value]) => key.includes('ERPNEXT') && !value)
          .map(([key]) => key),
        actionRequired: Object.entries(envVars)
          .filter(([key, value]) => key.includes('ERPNEXT') && !value)
          .length > 0 ? 'Set missing ERPNext environment variables' : 'All ERPNext variables are set',
      }
    });
  } catch (error) {
    console.error('Error in environment test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check environment variables',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
