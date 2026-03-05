'use client';

interface ToneSelectorProps {
  selected: string;
  onChange: (tone: string) => void;
}

const TONES = [
  { id: 'spicy', label: '🔥 Spicy', desc: 'Edgy & provocative' },
  { id: 'cool', label: '😎 Cool', desc: 'Laid-back & smooth' },
  { id: 'smart', label: '🧠 Smart', desc: 'Insightful & data-driven' },
  { id: 'funny', label: '😂 Funny', desc: 'Humorous & witty' },
  { id: 'pro', label: '💼 Pro', desc: 'Professional & authoritative' },
];

export default function ToneSelector({ selected, onChange }: ToneSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TONES.map((tone) => (
        <button
          key={tone.id}
          onClick={() => onChange(tone.id)}
          title={tone.desc}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
            selected === tone.id
              ? 'bg-accent text-white shadow-lg shadow-accent/20'
              : 'bg-card border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary'
          }`}
        >
          {tone.label}
        </button>
      ))}
    </div>
  );
}
