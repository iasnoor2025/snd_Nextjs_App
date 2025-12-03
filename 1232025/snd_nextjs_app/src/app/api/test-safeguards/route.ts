import { NextRequest, NextResponse } from 'next/server';
import { validateEmail, validateRequired, sanitizeString } from '@/lib/validation';

/**
 * Example API route demonstrating safe validation without breaking anything
 * This shows how to add validation to existing routes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, message } = body;

    // ADD validation (doesn't replace existing logic)
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      return NextResponse.json(
        { error: emailCheck.errors[0] },
        { status: 400 }
      );
    }

    // Validate required fields
    const nameCheck = validateRequired(name, 'Name');
    if (!nameCheck.isValid) {
      return NextResponse.json(
        { error: nameCheck.errors[0] },
        { status: 400 }
      );
    }

    // Sanitize inputs (prevents XSS)
    const sanitizedName = sanitizeString(name);
    const sanitizedMessage = sanitizeString(message || '');

    // Your existing business logic continues here
    // ... process the data as normal

    return NextResponse.json({
      success: true,
      message: 'Data validated and sanitized',
      data: {
        email,
        name: sanitizedName,
        message: sanitizedMessage,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

