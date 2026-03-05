'use client';

import { useState, useEffect } from 'react';

interface Gif {
  id: string;
  url: string;
  preview: string;
  title: string;
}

interface GifGridProps {
  topic: string;
  selectedGifUrl: string | null;
  onSelectGif: (url: string | null) => void;
}

export default function GifGrid({ topic, selectedGifUrl, onSelectGif }: GifGridProps) {
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [noKey, setNoKey] = useState(false);

  const fetchGifs = async (newOffset: number = 0) => {
    if (!topic) return;
    setLoading(true);
    try {
      const q = encodeURIComponent(topic.replace(/#/g, '').trim());
      const res = await fetch(`/api/gifs?q=${q}&limit=4&offset=${newOffset}`);
      const data = await res.json();
      if (data.message?.includes('not configured')) {
        setNoKey(true);
        return;
      }
      if (newOffset === 0) {
        setGifs(data.gifs || []);
      } else {
        setGifs((prev) => [...prev.slice(-4), ...(data.gifs || [])]);
      }
      setOffset(newOffset);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setGifs([]);
    setOffset(0);
    setNoKey(false);
    if (topic) fetchGifs(0);
  }, [topic]);

  if (noKey) {
    return (
      <p className="text-xs text-text-secondary italic mt-2">
        Add GIPHY API key to enable GIF suggestions
      </p>
    );
  }

  const displayGifs = gifs.slice(-4);

  return (
    <div className="mt-3">
      <p className="text-xs text-text-secondary mb-2">Suggested GIFs:</p>
      <div className="flex gap-2 flex-wrap">
        {loading && displayGifs.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-[80px] h-[60px] rounded-lg animate-shimmer flex-shrink-0"
              />
            ))
          : displayGifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() =>
                  onSelectGif(selectedGifUrl === gif.url ? null : gif.url)
                }
                className={`relative w-[80px] h-[60px] rounded-lg overflow-hidden flex-shrink-0 transition-all duration-150 cursor-pointer group ${
                  selectedGifUrl === gif.url
                    ? 'ring-2 ring-accent shadow-lg shadow-accent/20 scale-105'
                    : 'hover:scale-105 hover:shadow-md'
                }`}
                title={gif.title}
              >
                <img
                  src={gif.preview}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {selectedGifUrl === gif.url && (
                  <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                    <span className="text-white text-lg">✓</span>
                  </div>
                )}
              </button>
            ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {displayGifs.length > 0 && (
          <button
            onClick={() => fetchGifs(offset + 4)}
            disabled={loading}
            className="text-xs text-accent hover:text-accent-hover transition-colors cursor-pointer disabled:opacity-50"
          >
            🔄 More GIFs
          </button>
        )}
        {selectedGifUrl && (
          <span className="text-xs text-text-secondary">
            Click a GIF to deselect
          </span>
        )}
      </div>
    </div>
  );
}
