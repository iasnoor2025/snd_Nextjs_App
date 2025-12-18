import { NextRequest, NextResponse } from 'next/server';
import { initializeRBACSystem } from '@/lib/rbac/rbac-initializer';
import { db } from '@/lib/drizzle';
import { roles } from '@/lib/drizzle/schema';

export async function POST(request: NextRequest) {
  try {
    // Initialize the RBAC system
    await initializeRBACSystem();
    
    return NextResponse.json({
      success: true,
      message: 'RBAC system initialized successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ RBAC initialization failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'RBAC system initialization failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if RBAC system is already initialized by checking the database directly
    // Select only essential columns to avoid issues with schema changes
    const existingRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(roles)
      .limit(1);
    const isInitialized = existingRoles.length > 0;
    return NextResponse.json({
      success: true,
      initialized: isInitialized,
      message: isInitialized ? 'RBAC system is already initialized' : 'RBAC system needs initialization',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ RBAC status check failed:', error);
    
    // Provide more detailed error information
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      name: error.name
    } : 'Unknown error type';
    
    return NextResponse.json(
      {
        success: false,
        message: 'RBAC system status check failed',
        error: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
