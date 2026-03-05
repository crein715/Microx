'use client';

import ToneSelector from './ToneSelector';

interface QuickWriteProps {
  text: string;
  tone: string;
  loading: boolean;
  onTextChange: (text: string) => void;
  onToneChange: (tone: string) => void;
  onGenerate: () => void;
}

export default function QuickWrite({
  text,
  tone,
  loading,
  onTextChange,
  onToneChange,
  onGenerate,
}: QuickWriteProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim() && !loading) {
      onGenerate();
    }
  };

  return (
    <section className="px-4 md:px-6 py-5 border-b border-border">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2 mb-3">
        <span className="text-base">✏️</span> Quick Write
      </h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write something from scratch..."
          rows={3}
          className="w-full bg-transparent px-4 pt-3 pb-2 text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none text-sm leading-relaxed"
        />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 pb-3">
          <ToneSelector selected={tone} onChange={onToneChange} />
          <button
            onClick={onGenerate}
            disabled={!text.trim() || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-white font-semibold text-xs transition-all hover:bg-accent-hover active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-accent/20 whitespace-nowrap"
          >
            {loading ? (
              <>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full bg-white/80 inline-block"
                      style={{
                        animation: 'pulse-dot 1.4s infinite',
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </span>
                Generating...
              </>
            ) : (
              <>✨ Generate</>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
