import { NextRequest, NextResponse } from 'next/server';
import { getFeed } from '@/lib/feed';

export async function GET(request: NextRequest) {
  const authToken =
    request.headers.get('x-auth-token') || process.env.X_AUTH_TOKEN || '';
  const csrfToken =
    request.headers.get('x-csrf-token') || process.env.X_CSRF_TOKEN || '';

  if (!authToken || !csrfToken) {
    return NextResponse.json({
      posts: [],
      error:
        'X credentials not configured. Add your auth_token and ct0 cookies to connect.',
    });
  }

  try {
    const posts = await getFeed(authToken, csrfToken);
    return NextResponse.json({ posts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Feed fetch error:', message);
    return NextResponse.json(
      { posts: [], error: `Failed to fetch feed: ${message}` },
      { status: 500 }
    );
  }
}
