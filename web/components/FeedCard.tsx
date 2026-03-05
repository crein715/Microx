'use client';

interface FeedCardProps {
  id: string;
  text: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  likes: number;
  retweets: number;
  replies: number;
  views?: number;
  onRewrite: () => void;
  onReply: () => void;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function FeedCard({
  text,
  authorName,
  authorHandle,
  authorAvatar,
  likes,
  retweets,
  replies,
  views,
  onRewrite,
  onReply,
}: FeedCardProps) {
  return (
    <div className="border-b border-border px-4 py-4 md:px-6 transition-colors hover:bg-card/50">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {authorAvatar ? (
            <img
              src={authorAvatar.replace('_normal', '_bigger')}
              alt={authorName}
              className="w-10 h-10 rounded-full bg-card"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-text-secondary text-sm font-bold">
              {authorName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm font-bold text-text-primary truncate">
              {authorName}
            </span>
            <span className="text-sm text-text-secondary truncate">
              @{authorHandle}
            </span>
          </div>

          <p className="text-[15px] leading-relaxed text-text-primary whitespace-pre-wrap mb-3">
            {text}
          </p>

          <div className="flex items-center gap-4 text-xs text-text-secondary mb-3">
            <span className="flex items-center gap-1">
              <span className="text-hot/70">❤️</span> {formatNum(likes)}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-success/70">🔄</span> {formatNum(retweets)}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-accent/70">💬</span> {formatNum(replies)}
            </span>
            {views !== undefined && views > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-text-secondary/70">👁️</span> {formatNum(views)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRewrite}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all cursor-pointer active:scale-[0.97]"
            >
              ✍️ Rewrite as Mine
            </button>
            <button
              onClick={onReply}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-hot/10 text-hot border border-hot/20 hover:bg-hot/20 transition-all cursor-pointer active:scale-[0.97]"
            >
              💬 Generate Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
