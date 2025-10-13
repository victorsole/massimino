// src/app/api/teams/[id]/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { TeamService } from '@/services/teams/team_service';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: team_id } = await params;
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    // RBAC: trainer/admin only and must manage the team
    const team = await TeamService.getById(team_id);
    if (!team) return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    const role = (session.user as any).role;
    const can_manage = role === 'ADMIN' || TeamService.canManage(team, session.user.id);
    if (!can_manage) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const content_type = request.headers.get('content-type') || '';
    if (!content_type.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get('file') as File | null;
    const kind = String(form.get('type') || 'image'); // 'image' | 'video'
    if (!file) return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });

    const mime = file.type || '';
    const is_image = mime.startsWith('image/');
    const is_video = mime.startsWith('video/');
    if (kind === 'image' && !is_image) return NextResponse.json({ success: false, error: 'Invalid image file' }, { status: 400 });
    if (kind === 'video' && !is_video) return NextResponse.json({ success: false, error: 'Invalid video file' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = mime.split('/')[1] || 'bin';
    const upload_dir = path.join(process.cwd(), 'public', 'uploads');
    try { fs.mkdirSync(upload_dir, { recursive: true }); } catch {}
    const filename = `team_${team_id}_${Date.now()}.${ext}`;
    const full_path = path.join(upload_dir, filename);
    fs.writeFileSync(full_path, buffer);

    const public_url = `/uploads/${filename}`;

    // Merge into aesthetic settings gallery
    const update = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/teams/${team_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aesthetic_settings: {
          gallery: [{ type: kind, url: public_url }]
        }
      })
    });
    // Ignore update result to avoid loops; media URL still returned

    return NextResponse.json({ success: true, url: public_url, type: kind });
  } catch (error) {
    console.error('[Team Media Upload] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

