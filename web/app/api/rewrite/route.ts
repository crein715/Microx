import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a minute.' },
      { status: 429 }
    );
  }

  const client = getOpenAIClient();
  if (!client) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured. Add OPENAI_API_KEY to environment variables.' },
      { status: 503 }
    );
  }

  let body: {
    text: string;
    tone?: string;
    mode?: 'rewrite' | 'reply' | 'freeform';
    originalTweet?: string;
    author?: string;
    likes?: number;
    retweets?: number;
    replies?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    text,
    tone = 'cool',
    mode = 'freeform',
    originalTweet,
    author,
    likes = 0,
    retweets = 0,
    replies = 0,
  } = body;

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
  }

  let systemPrompt: string;

  if (mode === 'rewrite' && originalTweet) {
    systemPrompt = `You are a viral X/Twitter ghostwriter. You're helping rewrite someone else's viral tweet as original content.

Original viral tweet: "${originalTweet}"
It got ${likes} likes, ${retweets} RTs, ${replies} replies.

Your job:
1. Analyze what made this tweet go viral (hook, emotion, structure, topic).
2. Generate 5 completely REWRITTEN versions that convey the same idea/energy.
3. Each version must be DIFFERENT ENOUGH that it doesn't look like a copy.
4. Change the wording, structure, angle — but keep the core insight that made it viral.
5. Tone: ${tone} (spicy = edgy/provocative, cool = laid-back/smooth, smart = insightful/data-driven, funny = humorous/witty, pro = professional/authoritative)
6. Each tweet MUST be 280 characters or fewer.
7. Make them feel authentic and original, not like rephrases.
8. Use emojis, line breaks, and hooks naturally.
9. The first tweet should be your absolute best.
10. Return as a JSON array of 5 strings. Nothing else.`;
  } else if (mode === 'reply' && originalTweet) {
    systemPrompt = `You are an X/Twitter engagement expert. You craft replies that get likes and followers.

Viral tweet you're replying to: "${originalTweet}"
By: @${author || 'unknown'}
Engagement: ${likes} likes, ${retweets} RTs

Your job:
1. Generate 5 different reply options to this viral tweet.
2. Types of replies that work: witty one-liners, insightful additions, relatable takes, funny observations, contrarian hot takes.
3. Each reply should feel like it could be the top reply under the tweet.
4. Keep replies SHORT — 1-2 sentences max. The best replies are punchy.
5. Don't be sycophantic ("Great point!"). Be clever, add value, or be funny.
6. Tone: ${tone} (spicy = edgy/provocative, cool = laid-back/smooth, smart = insightful/data-driven, funny = humorous/witty, pro = professional/authoritative)
7. Each reply MUST be 280 characters or fewer.
8. The first reply should be your absolute best — most likely to get likes.
9. Return as a JSON array of 5 strings. Nothing else.`;
  } else {
    systemPrompt = `You are a viral X/Twitter content expert. Your job:
1. Take the user's input text or topic.
2. Generate exactly 5 different tweet versions about it.
3. Tone: ${tone} (spicy = edgy/provocative, cool = laid-back/smooth, smart = insightful/data-driven, funny = humorous/witty, pro = professional/authoritative)
4. Each tweet MUST be 280 characters or fewer.
5. Make them feel native to X — use line breaks, emojis strategically, create curiosity gaps, use hooks.
6. If the input is not in English, translate to English first.
7. Add 1-3 relevant hashtags where appropriate (not on every tweet).
8. The first tweet should be your absolute best — the most likely to go viral.
9. Return as a JSON array of 5 strings. Nothing else — no explanation, no labels.
10. Each tweet should take a DIFFERENT angle or approach to the same topic.`;
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.9,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    let versions: string[];

    try {
      const cleaned = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      versions = JSON.parse(cleaned);
      if (!Array.isArray(versions)) throw new Error('Not an array');
      versions = versions.filter((v) => typeof v === 'string').slice(0, 5);
    } catch {
      versions = content
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .slice(0, 5);
    }

    return NextResponse.json({
      versions,
      topic: originalTweet?.slice(0, 50) || text.slice(0, 50),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('OpenAI error:', message);
    return NextResponse.json(
      { error: `AI generation failed: ${message}` },
      { status: 500 }
    );
  }
}
