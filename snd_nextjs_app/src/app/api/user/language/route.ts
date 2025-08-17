import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized' 
        },
        { status: 401 }
      );
    }

    // For now, return a default language
    // You can extend this to fetch from user preferences in the database
    return NextResponse.json({
      success: true,
      language: 'en', // Default to English
      message: 'User language preference retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching user language:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch user language preference',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized' 
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { language } = body;

    if (!language) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Language is required' 
        },
        { status: 400 }
      );
    }

    // Validate language (you can extend this list)
    const validLanguages = ['en', 'ar'];
    if (!validLanguages.includes(language)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid language. Supported languages: en, ar' 
        },
        { status: 400 }
      );
    }

    // For now, just return success
    // You can extend this to save to user preferences in the database
    return NextResponse.json({
      success: true,
      language: language,
      message: 'User language preference updated successfully'
    });

  } catch (error) {
    console.error('Error updating user language:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update user language preference',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
      );
  }
}
