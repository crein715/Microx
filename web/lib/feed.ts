export interface FeedPost {
  id: string;
  text: string;
  author_name: string;
  author_handle: string;
  author_avatar: string;
  likes: number;
  retweets: number;
  replies: number;
  views?: number;
  score: number;
}

interface CacheEntry {
  posts: FeedPost[];
  timestamp: number;
}

const CACHE_DURATION = 15 * 60 * 1000;
const feedCache = new Map<string, CacheEntry>();

const BEARER_TOKEN =
  'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

function buildHeaders(authToken: string, csrfToken: string) {
  return {
    Cookie: `auth_token=${authToken}; ct0=${csrfToken}`,
    'x-csrf-token': csrfToken,
    Authorization: `Bearer ${BEARER_TOKEN}`,
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };
}

function extractPost(tweet: Record<string, unknown>): FeedPost | null {
  const user = tweet.user as Record<string, unknown> | undefined;
  if (!user) return null;

  const text =
    (tweet.full_text as string) || (tweet.text as string) || '';
  if (!text) return null;

  const likes = (tweet.favorite_count as number) || 0;
  const retweets = (tweet.retweet_count as number) || 0;
  const replies = (tweet.reply_count as number) || 0;
  const score = likes + retweets * 2 + replies * 1.5;

  return {
    id: (tweet.id_str as string) || String(tweet.id),
    text,
    author_name: (user.name as string) || '',
    author_handle: (user.screen_name as string) || '',
    author_avatar: (user.profile_image_url_https as string) || '',
    likes,
    retweets,
    replies,
    views: undefined,
    score,
  };
}

async function tryHomeTimeline(
  authToken: string,
  csrfToken: string
): Promise<FeedPost[]> {
  const url = new URL(
    'https://x.com/i/api/1.1/statuses/home_timeline.json'
  );
  url.searchParams.set('count', '40');
  url.searchParams.set('tweet_mode', 'extended');
  url.searchParams.set('include_reply_count', '1');

  const res = await fetch(url.toString(), {
    headers: buildHeaders(authToken, csrfToken),
  });

  if (!res.ok) throw new Error(`home_timeline ${res.status}`);

  const tweets = await res.json();
  if (!Array.isArray(tweets)) throw new Error('unexpected format');

  return tweets.map(extractPost).filter((p): p is FeedPost => p !== null);
}

async function tryViralSearch(
  authToken: string,
  csrfToken: string
): Promise<FeedPost[]> {
  const url = new URL(
    'https://x.com/i/api/2/search/adaptive.json'
  );
  url.searchParams.set('q', 'min_faves:500 lang:en');
  url.searchParams.set('tweet_mode', 'extended');
  url.searchParams.set('count', '40');

  const res = await fetch(url.toString(), {
    headers: buildHeaders(authToken, csrfToken),
  });

  if (!res.ok) throw new Error(`search ${res.status}`);

  const data = await res.json();

  const globalTweets =
    (data.globalObjects?.tweets as Record<string, Record<string, unknown>>) ||
    {};
  const globalUsers =
    (data.globalObjects?.users as Record<string, Record<string, unknown>>) ||
    {};

  const posts: FeedPost[] = [];

  for (const tweet of Object.values(globalTweets)) {
    const userId = (tweet.user_id_str as string) || String(tweet.user_id);
    const user = globalUsers[userId];
    if (user) {
      (tweet as Record<string, unknown>).user = user;
    }
    const post = extractPost(tweet as Record<string, unknown>);
    if (post) posts.push(post);
  }

  return posts;
}

export async function getFeed(
  authToken: string,
  csrfToken: string
): Promise<FeedPost[]> {
  const cacheKey = authToken.slice(0, 8);
  const cached = feedCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.posts;
  }

  let posts: FeedPost[] = [];

  try {
    posts = await tryHomeTimeline(authToken, csrfToken);
  } catch {
    try {
      posts = await tryViralSearch(authToken, csrfToken);
    } catch (e) {
      if (cached) return cached.posts;
      throw e;
    }
  }

  posts.sort((a, b) => b.score - a.score);
  posts = posts.slice(0, 20);

  feedCache.set(cacheKey, { posts, timestamp: Date.now() });
  return posts;
}
