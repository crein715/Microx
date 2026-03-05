'use client';

import { useState, useEffect, useCallback } from 'react';
import FeedCard from './FeedCard';

interface FeedPost {
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

interface XCredentials {
  authToken: string;
  csrfToken: string;
}

interface FeedSectionProps {
  credentials: XCredentials | null;
  onRewrite: (post: FeedPost) => void;
  onReply: (post: FeedPost) => void;
  onShowSettings: () => void;
}

export default function FeedSection({
  credentials,
  onRewrite,
  onReply,
  onShowSettings,
}: FeedSectionProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    if (!credentials?.authToken || !credentials?.csrfToken) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/feed', {
        headers: {
          'x-auth-token': credentials.authToken,
          'x-csrf-token': credentials.csrfToken,
        },
      });
      const data = await res.json();
      if (data.error && (!data.posts || data.posts.length === 0)) {
        setError(data.error);
      }
      setPosts(data.posts || []);
    } catch {
      setError('Failed to fetch your feed');
    } finally {
      setLoading(false);
    }
  }, [credentials]);

  useEffect(() => {
    if (credentials?.authToken && credentials?.csrfToken) {
      fetchFeed();
    }
  }, [credentials, fetchFeed]);

  const hasCreds = credentials?.authToken && credentials?.csrfToken;

  return (
    <section className="border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/30">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <span className="text-base">🔥</span> Viral From Your Feed
        </h2>
        {hasCreds && (
          <button
            onClick={fetchFeed}
            disabled={loading}
            className="text-text-secondary hover:text-accent transition-colors p-1.5 rounded-lg hover:bg-card cursor-pointer disabled:opacity-50"
            title="Refresh feed"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
      </div>

      {!hasCreds ? (
        <div className="px-4 md:px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-card border border-border mb-3">
            <span className="text-2xl">🔒</span>
          </div>
          <p className="text-sm text-text-primary mb-1">
            Connect your X account to load your feed
          </p>
          <p className="text-xs text-text-secondary mb-4">
            Your cookies stay in your browser. They&apos;re only used to fetch your timeline.
          </p>
          <button
            onClick={onShowSettings}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Add X Cookies
          </button>
        </div>
      ) : loading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-4 md:px-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full animate-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded animate-shimmer" />
                  <div className="h-4 w-full rounded animate-shimmer" />
                  <div className="h-4 w-3/4 rounded animate-shimmer" />
                  <div className="h-3 w-48 rounded animate-shimmer mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error && posts.length === 0 ? (
        <div className="px-4 md:px-6 py-8 text-center">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchFeed}
            className="text-xs text-accent hover:underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : posts.length > 0 ? (
        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {posts.map((post) => (
            <FeedCard
              key={post.id}
              id={post.id}
              text={post.text}
              authorName={post.author_name}
              authorHandle={post.author_handle}
              authorAvatar={post.author_avatar}
              likes={post.likes}
              retweets={post.retweets}
              replies={post.replies}
              views={post.views}
              onRewrite={() => onRewrite(post)}
              onReply={() => onReply(post)}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 md:px-6 py-8 text-center">
          <p className="text-sm text-text-secondary">
            No posts found. Try refreshing.
          </p>
        </div>
      )}
    </section>
  );
}
