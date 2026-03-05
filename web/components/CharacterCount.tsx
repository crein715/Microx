interface CharacterCountProps {
  count: number;
}

export default function CharacterCount({ count }: CharacterCountProps) {
  const color =
    count > 280
      ? 'text-red-500 bg-red-500/10 border-red-500/30'
      : count > 250
        ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
        : 'text-success bg-success/10 border-success/30';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium border ${color}`}
    >
      📊 {count}/280
    </span>
  );
}
