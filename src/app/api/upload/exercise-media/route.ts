// src/app/api/upload/exercise-media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { addExerciseMediaDB } from '@/core/database';
import {
  supabaseAdmin,
  EXERCISE_MEDIA_BUCKET,
  generateFilePath,
  getPublicUrl,
  isValidFileType,
  getMaxFileSize,
  getMediaType,
} from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const exerciseId = formData.get('exerciseId') as string | null;
    const title = formData.get('title') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!exerciseId) {
      return NextResponse.json({ error: 'Exercise ID is required' }, { status: 400 });
    }

    // Validate file type
    if (!isValidFileType(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, MP4, MOV, WebM, AVI' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = getMaxFileSize(file.type);
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / 1024 / 1024;
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Generate unique file path
    const filePath = generateFilePath(session.user.id, exerciseId, file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(EXERCISE_MEDIA_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file. Please try again.' },
        { status: 500 }
      );
    }

    // Get public URL
    const publicUrl = getPublicUrl(filePath);
    const mediaType = getMediaType(file.type);

    // Create media record in database
    const mediaRecord = await addExerciseMediaDB(
      exerciseId,
      {
        provider: 'upload',
        url: publicUrl,
        title: title || file.name,
        thumbnailUrl: mediaType === 'image' ? publicUrl : undefined,
      },
      {
        kind: 'global',
        userId: session.user.id,
      }
    );

    return NextResponse.json({
      success: true,
      media: mediaRecord,
      url: publicUrl,
      mediaType,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
