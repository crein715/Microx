'use client';

import { useState } from 'react';
import CharacterCount from './CharacterCount';
import GifGrid from './GifGrid';

interface VersionCardProps {
  text: string;
  index: number;
  topic: string;
  onToast: (message: string) => void;
}

export default function VersionCard({ text, index, topic, onToast }: VersionCardProps) {
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const charCount = text.length;
  const isBest = index === 0;

  const copyText = async (includeGif: boolean = false) => {
    let content = text;
    if (includeGif && selectedGif) {
      content += `\n\n${selectedGif}`;
    }
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onToast(includeGif ? 'Copied tweet + GIF link!' : 'Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('Failed to copy');
    }
  };

  return (
    <div
      className="animate-slide-up rounded-xl border border-border bg-card p-4 md:p-5 transition-all duration-200 hover:border-border/80"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary">
            Version {index + 1}
          </span>
          {isBest && (
            <span className="text-xs font-semibold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
              ⭐ Best
            </span>
          )}
        </div>
        <CharacterCount count={charCount} />
      </div>

      <p className="text-[15px] leading-relaxed text-text-primary whitespace-pre-wrap mb-4">
        {text}
      </p>

      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={() => copyText(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary transition-all cursor-pointer"
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
        {selectedGif && (
          <button
            onClick={() => copyText(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all cursor-pointer"
          >
            📋 Copy with GIF
          </button>
        )}
      </div>

      <GifGrid
        topic={topic}
        selectedGifUrl={selectedGif}
        onSelectGif={setSelectedGif}
      />
    </div>
  );
}
