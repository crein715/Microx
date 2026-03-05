'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import FeedSection from '@/components/FeedSection';
import ResultsSection from '@/components/ResultsSection';
import QuickWrite from '@/components/QuickWrite';
import SettingsSection from '@/components/SettingsSection';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';

interface XCredentials {
  authToken: string;
  csrfToken: string;
}

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

const STORAGE_KEY = 'microx_x_credentials';

export default function Home() {
  const [credentials, setCredentials] = useState<XCredentials | null>(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const [mode, setMode] = useState<'rewrite' | 'reply' | 'freeform'>('freeform');
  const [tone, setTone] = useState('cool');
  const [versions, setVersions] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [hasOpenAIKey, setHasOpenAIKey] = useState(true);

  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [quickText, setQuickText] = useState('');

  const resultsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.authToken) setCredentials(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveCredentials = (creds: XCredentials) => {
    if (creds.authToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
      setCredentials(creds);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setCredentials(null);
    }
  };

  const generate = useCallback(
    async (
      genMode: 'rewrite' | 'reply' | 'freeform',
      text: string,
      post?: FeedPost | null,
      genTone?: string
    ) => {
      if (!text.trim() || loading) return;

      setMode(genMode);
      setSelectedPost(post || null);
      setLoading(true);
      setError(null);
      setVersions([]);

      try {
        const body: Record<string, unknown> = {
          text,
          tone: genTone || tone,
          mode: genMode,
        };

        if (post && (genMode === 'rewrite' || genMode === 'reply')) {
          body.originalTweet = post.text;
          body.author = post.author_handle;
          body.likes = post.likes;
          body.retweets = post.retweets;
          body.replies = post.replies;
        }

        const res = await fetch('/api/rewrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 503) setHasOpenAIKey(false);
          throw new Error(data.error || 'Generation failed');
        }

        setVersions(data.versions || []);
        setTopic(data.topic || text.slice(0, 50));

        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [tone, loading]
  );

  const handleRewrite = (post: FeedPost) => {
    generate('rewrite', post.text, post);
  };

  const handleReply = (post: FeedPost) => {
    generate('reply', post.text, post);
  };

  const handleQuickGenerate = () => {
    generate('freeform', quickText);
  };

  const handleToneChange = (newTone: string) => {
    setTone(newTone);
    if (selectedPost && versions.length > 0) {
      generate(mode, selectedPost.text, selectedPost, newTone);
    }
  };

  const showToast = useCallback((message: string) => {
    setToast(null);
    setTimeout(() => setToast(message), 10);
  }, []);

  const handleShowSettings = () => {
    setSettingsExpanded(true);
    setTimeout(() => {
      settingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto border-x border-border">
      <Header onToggleSettings={() => setSettingsExpanded((p) => !p)} />

      {!hasOpenAIKey && (
        <div className="mx-4 md:mx-6 mt-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
          <p className="text-sm text-yellow-400">
            Add your OpenAI API key to{' '}
            <code className="font-mono text-xs bg-bg px-1 py-0.5 rounded">.env.local</code>{' '}
            to start generating
          </p>
        </div>
      )}

      <FeedSection
        credentials={credentials}
        onRewrite={handleRewrite}
        onReply={handleReply}
        onShowSettings={handleShowSettings}
      />

      <div ref={resultsRef}>
        <ResultsSection
          versions={versions}
          topic={topic}
          loading={loading}
          error={error}
          mode={mode}
          originalPreview={selectedPost?.text}
          authorHandle={selectedPost?.author_handle}
          tone={tone}
          onToneChange={handleToneChange}
          onToast={showToast}
        />
      </div>

      <QuickWrite
        text={quickText}
        tone={tone}
        loading={loading && mode === 'freeform'}
        onTextChange={setQuickText}
        onToneChange={setTone}
        onGenerate={handleQuickGenerate}
      />

      <div ref={settingsRef} className="mt-auto">
        <SettingsSection
          expanded={settingsExpanded}
          onToggle={() => setSettingsExpanded((p) => !p)}
          credentials={credentials}
          onSave={saveCredentials}
        />
        <Footer />
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
