'use client';

import { useState, useEffect } from 'react';

interface XCredentials {
  authToken: string;
  csrfToken: string;
}

interface SettingsSectionProps {
  expanded: boolean;
  onToggle: () => void;
  credentials: XCredentials | null;
  onSave: (creds: XCredentials) => void;
}

export default function SettingsSection({
  expanded,
  onToggle,
  credentials,
  onSave,
}: SettingsSectionProps) {
  const [authToken, setAuthToken] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (credentials) {
      setAuthToken(credentials.authToken);
      setCsrfToken(credentials.csrfToken);
    }
  }, [credentials]);

  const handleSave = () => {
    if (!authToken.trim() || !csrfToken.trim()) return;
    onSave({ authToken: authToken.trim(), csrfToken: csrfToken.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setAuthToken('');
    setCsrfToken('');
    onSave({ authToken: '', csrfToken: '' });
  };

  return (
    <section className="px-4 md:px-6 py-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors cursor-pointer w-full"
      >
        <span className="text-base">⚙️</span>
        Settings
        <svg
          className={`w-4 h-4 transition-transform duration-200 ml-auto ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 rounded-xl border border-border bg-card p-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            X Account Connection
          </h3>
          <p className="text-xs text-text-secondary mb-4 leading-relaxed">
            Connect your X account to load your For You feed.
          </p>

          <ol className="text-xs text-text-secondary mb-5 space-y-1 list-decimal list-inside">
            <li>
              Open{' '}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                x.com
              </a>{' '}
              and log in
            </li>
            <li>
              Open DevTools (
              <kbd className="px-1 py-0.5 rounded bg-bg border border-border text-[10px]">F12</kbd>
              ) → Application → Cookies → https://x.com
            </li>
            <li>
              Copy the values for{' '}
              <code className="px-1 py-0.5 rounded bg-bg border border-border text-[10px] font-mono">auth_token</code>{' '}
              and{' '}
              <code className="px-1 py-0.5 rounded bg-bg border border-border text-[10px] font-mono">ct0</code>
            </li>
          </ol>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Auth Token
                <span className="text-text-secondary/40 ml-1">(auth_token cookie)</span>
              </label>
              <input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Paste auth_token value"
                className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                CSRF Token
                <span className="text-text-secondary/40 ml-1">(ct0 cookie)</span>
              </label>
              <input
                type="password"
                value={csrfToken}
                onChange={(e) => setCsrfToken(e.target.value)}
                placeholder="Paste ct0 value"
                className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={!authToken.trim() || !csrfToken.trim()}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saved ? '✓ Connected!' : 'Save & Connect'}
            </button>
            {credentials?.authToken && (
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            )}
          </div>

          <p className="text-[11px] text-text-secondary mt-3 flex items-start gap-1.5">
            <span>🔒</span>
            <span>
              Cookies are stored in your browser only (localStorage). They&apos;re sent
              to the server only to fetch your timeline — never stored server-side.
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
