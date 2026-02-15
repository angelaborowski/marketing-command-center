import { useState } from 'react';
import {
  Copy,
  Check,
  FileText,
  MessageCircle,
  Users,
  CheckCircle2,
} from 'lucide-react';
import type { ContentItem } from '../types.ts';
import { DAYS } from '../types.ts';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface TextQueueProps {
  items: ContentItem[];
  onTogglePosted: (itemId: string) => void;
}

// ---------------------------------------------------------------------------
// Platform badge config for text platforms
// ---------------------------------------------------------------------------
const TEXT_PLATFORM_BADGE: Record<string, { label: string; bg: string; text: string; border: string; Icon: typeof MessageCircle }> = {
  reddit:  { label: 'Reddit',  bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-l-orange-500', Icon: MessageCircle },
  mumsnet: { label: 'Mumsnet', bg: 'bg-teal-500/10',   text: 'text-teal-600',   border: 'border-l-teal-500',   Icon: Users },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sort by day order then time string. */
function sortByDayAndTime(a: ContentItem, b: ContentItem): number {
  const dayOrder = (d: string) => {
    const idx = DAYS.indexOf(d as typeof DAYS[number]);
    return idx >= 0 ? idx : 999;
  };
  const da = dayOrder(a.day);
  const db = dayOrder(b.day);
  if (da !== db) return da - db;
  return (a.time || '').localeCompare(b.time || '');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TextQueue({ items, onTogglePosted }: TextQueueProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ---- Filter & sort ----
  const textItems = items
    .filter((item) => item.contentType === 'text')
    .sort(sortByDayAndTime);

  const unpostedItems = textItems.filter((item) => !item.posted);
  const postedItems = textItems.filter((item) => item.posted);

  // Combine: unposted first, then posted at bottom
  const orderedItems = [...unpostedItems, ...postedItems];

  // Copy handler
  const handleCopy = async (item: ContentItem) => {
    const content = `${item.hook}\n\n${item.body ?? ''}`.trim();
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback: ignore silently
    }
  };

  // ---- Empty state ----
  if (textItems.length === 0 || unpostedItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <QueueHeader count={0} />
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-[#9ca3af] mx-auto mb-4" />
          <h3 className="text-[15px] font-medium text-[#1a1a1a] mb-1">No text posts queued</h3>
          <p className="text-[13px] text-[#6b7280]">
            Generate content to get Reddit and Mumsnet posts.
          </p>
        </div>
      </div>
    );
  }

  // ---- Main render ----
  return (
    <div className="max-w-3xl mx-auto">
      <QueueHeader count={unpostedItems.length} />

      <div>
        {orderedItems.map((item) => {
          const badge = TEXT_PLATFORM_BADGE[item.platform];
          const isCopied = copiedId === item.id;
          const BadgeIcon = badge?.Icon ?? FileText;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border border-[#e5e7eb] p-5 mb-4 border-l-4 ${
                badge?.border ?? ''
              } ${item.posted ? 'opacity-40' : ''}`}
            >
              {/* Platform badge + subreddit */}
              <div className="flex items-center gap-2 mb-3">
                {badge && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium ${badge.bg} ${badge.text}`}>
                    <BadgeIcon className="w-3.5 h-3.5" />
                    {badge.label}
                  </span>
                )}
                {item.platform === 'reddit' && item.subreddit && (
                  <span className="text-[12px] text-[#9ca3af]">r/{item.subreddit}</span>
                )}
              </div>

              {/* Hook / title */}
              <p className="text-[14px] font-bold text-[#1a1a1a] leading-relaxed mb-3">{item.hook}</p>

              {/* Full body text */}
              {item.body && (
                <div className="bg-[#f9fafb] rounded-lg p-4 text-[13px] whitespace-pre-line text-[#374151] mb-3">
                  {item.body}
                </div>
              )}

              {/* Day + Time */}
              <p className="text-[12px] text-[#9ca3af] mb-3">
                {item.day}{item.time ? ` · ${item.time}` : ''}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between">
                {/* Copy to clipboard */}
                <button
                  onClick={() => handleCopy(item)}
                  className="bg-[#211d1d] text-white rounded-lg px-4 py-2 text-[12px] font-medium flex items-center gap-2 hover:bg-[#352f2f] transition-all duration-200 active:scale-[0.98]"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy to Clipboard
                    </>
                  )}
                </button>

                {/* Mark as posted */}
                <button
                  onClick={() => onTogglePosted(item.id)}
                  className="flex items-center gap-2 text-[12px] text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
                  aria-label={item.posted ? 'Mark as not posted' : 'Mark as posted'}
                >
                  {item.posted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#d1d5db] hover:border-[#9ca3af] transition-colors" />
                  )}
                  <span>{item.posted ? 'Posted' : 'Mark as Posted'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header sub-component
// ---------------------------------------------------------------------------
function QueueHeader({ count }: { count: number }) {
  return (
    <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-xl p-6 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-[18px] font-semibold text-[#1a1a1a] tracking-tight uppercase">
            TEXT QUEUE
          </h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">
            {count} {count === 1 ? 'post' : 'posts'} ready to publish
          </p>
        </div>
      </div>
    </div>
  );
}
