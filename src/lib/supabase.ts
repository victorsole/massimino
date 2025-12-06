// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uzuilceoxsxzkdsfvqtc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy initialization to avoid build-time errors when env vars aren't set
let _supabaseAdmin: SupabaseClient | null = null;
let _supabaseClient: SupabaseClient | null = null;

// Server-side client with service role (for admin operations)
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    }
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

// Client-side client with anon key (for public operations)
export function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    if (!supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
    }
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseClient;
}

// Legacy exports for backward compatibility (lazy initialized)
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});

export const supabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});

// Storage bucket name for exercise media
export const EXERCISE_MEDIA_BUCKET = 'exercise-media';

// Helper to get public URL for uploaded media
export function getPublicUrl(filePath: string): string {
  const { data } = getSupabaseAdmin().storage
    .from(EXERCISE_MEDIA_BUCKET)
    .getPublicUrl(filePath);
  return data.publicUrl;
}

// Helper to generate unique file path
export function generateFilePath(userId: string, exerciseId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${exerciseId}/${timestamp}-${sanitizedFileName}`;
}

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
export const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Max file size (50MB for videos, 10MB for images)
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export function getMaxFileSize(mimeType: string): number {
  return ALLOWED_VIDEO_TYPES.includes(mimeType) ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
}

export function isValidFileType(mimeType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(mimeType);
}

export function getMediaType(mimeType: string): 'image' | 'video' {
  return ALLOWED_VIDEO_TYPES.includes(mimeType) ? 'video' : 'image';
}
