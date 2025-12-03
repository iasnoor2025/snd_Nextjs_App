import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { uploadToMinIO } from '@/lib/utils/file-upload';
import formidable from 'formidable';
import { promises as fs } from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    try {
      // Convert File to Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate filename with user ID and timestamp
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `profile-photos/${session.user.id}-${timestamp}.${fileExtension}`;

      // Upload to MinIO
      const uploadResult = await uploadToMinIO(
        buffer,
        fileName,
        file.type,
        'snd-documents'
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload file');
      }

      // Update user avatar in database
      await db.update(users)
        .set({ 
          avatar: uploadResult.url,
          updatedAt: new Date().toISOString().split('T')[0]
        })
        .where(eq(users.id, parseInt(session.user.id)));

      return NextResponse.json({
        success: true,
        message: 'Profile photo updated successfully',
        avatar_url: uploadResult.url
      });

    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Profile photo upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
