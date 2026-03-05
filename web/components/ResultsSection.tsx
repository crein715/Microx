'use client';

import VersionCard from './VersionCard';
import ToneSelector from './ToneSelector';

interface ResultsSectionProps {
  versions: string[];
  topic: string;
  loading: boolean;
  error: string | null;
  mode: 'rewrite' | 'reply' | 'freeform';
  originalPreview?: string;
  authorHandle?: string;
  tone: string;
  onToneChange: (tone: string) => void;
  onToast: (message: string) => void;
}

export default function ResultsSection({
  versions,
  topic,
  loading,
  error,
  mode,
  originalPreview,
  authorHandle,
  tone,
  onToneChange,
  onToast,
}: ResultsSectionProps) {
  const hasContent = loading || error || versions.length > 0;
  if (!hasContent) return null;

  const modeLabel =
    mode === 'rewrite'
      ? `✍️ Rewriting: "${originalPreview?.slice(0, 60)}${(originalPreview?.length || 0) > 60 ? '...' : ''}"`
      : mode === 'reply'
        ? `💬 Replying to: @${authorHandle || 'unknown'}'s tweet`
        : '✨ Generated Versions';

  return (
    <section className="px-4 md:px-6 py-5 border-b border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className="text-sm font-medium text-text-secondary">{modeLabel}</p>
        <ToneSelector selected={tone} onChange={onToneChange} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-accent inline-block"
                style={{
                  animation: 'pulse-dot 1.4s infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <p className="text-sm text-text-secondary">
            {mode === 'reply'
              ? '💬 Crafting killer replies...'
              : mode === 'rewrite'
                ? '✍️ Rewriting as your own...'
                : '✨ Generating 5 fire versions...'}
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {versions.map((version, i) => (
            <VersionCard
              key={`${i}-${version.slice(0, 20)}`}
              text={version}
              index={i}
              topic={topic}
              onToast={onToast}
            />
          ))}
        </div>
      )}
    </section>
  );
}
