import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const limit = searchParams.get('limit') || '4';
  const offset = searchParams.get('offset') || '0';

  const apiKey = process.env.GIPHY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ gifs: [], message: 'GIPHY API key not configured' });
  }

  if (!q) {
    return NextResponse.json({ gifs: [], message: 'Query parameter required' });
  }

  try {
    const url = new URL('https://api.giphy.com/v1/gifs/search');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('q', q);
    url.searchParams.set('limit', limit);
    url.searchParams.set('offset', offset);
    url.searchParams.set('rating', 'pg');
    url.searchParams.set('lang', 'en');

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`GIPHY API error: ${res.status}`);

    const data = await res.json();

    const gifs = data.data.map((gif: Record<string, unknown>) => ({
      id: gif.id,
      url: (gif.images as Record<string, Record<string, string>>).original.url,
      preview: (gif.images as Record<string, Record<string, string>>).fixed_height_small.url,
      title: gif.title,
    }));

    return NextResponse.json({ gifs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('GIPHY error:', message);
    return NextResponse.json({ gifs: [], error: message }, { status: 500 });
  }
}
