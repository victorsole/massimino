import { NextRequest, NextResponse } from 'next/server';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_BASE_URL = 'https://api.pexels.com/v1';

export async function GET(request: NextRequest) {
  if (!PEXELS_API_KEY) {
    return NextResponse.json({ error: 'Pexels API key not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || 'fitness';
  const perPage = Math.min(Number(searchParams.get('per_page')) || 10, 30);
  const page = Number(searchParams.get('page')) || 1;

  try {
    const res = await fetch(
      `${PEXELS_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape`,
      {
        headers: { Authorization: PEXELS_API_KEY },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Pexels API error' }, { status: res.status });
    }

    const data = await res.json();

    const photos = data.photos.map((photo: any) => ({
      id: photo.id,
      alt: photo.alt || query,
      photographer: photo.photographer,
      src: {
        original: photo.src.original,
        large2x: photo.src.large2x,
        large: photo.src.large,
        medium: photo.src.medium,
      },
    }));

    return NextResponse.json({ photos, total_results: data.total_results });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch from Pexels' }, { status: 500 });
  }
}
