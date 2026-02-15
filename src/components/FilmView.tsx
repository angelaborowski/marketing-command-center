import { useState } from 'react';
import {
  Film,
  Check,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Printer,
  Clock,
} from 'lucide-react';
import type { ContentItem } from '../types.ts';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ShotListProps {
  items: ContentItem[];
  batchDay: string;
  onToggleFilmed: (itemId: string) => void;
  onMarkAllDone: () => void;
}

// ---------------------------------------------------------------------------
// Platform badge config
// ---------------------------------------------------------------------------
const PLATFORM_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  tiktok:   { label: 'TikTok',   bg: 'bg-pink-500/10',   text: 'text-pink-600' },
  shorts:   { label: 'YouTube',   bg: 'bg-red-500/10',    text: 'text-red-600' },
  reels:    { label: 'Instagram', bg: 'bg-purple-500/10', text: 'text-purple-600' },
  facebook: { label: 'Facebook', bg: 'bg-blue-600/10',   text: 'text-blue-700' },
  linkedin: { label: 'LinkedIn', bg: 'bg-blue-700/10',   text: 'text-blue-800' },
  snapchat: { label: 'Snapchat', bg: 'bg-yellow-400/10', text: 'text-yellow-600' },
  ytlong:   { label: 'YT Long',  bg: 'bg-red-600/10',    text: 'text-red-700' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse an estimatedDuration string into minutes. */
function parseDuration(d?: string): number {
  if (!d) return 0;
  const lower = d.toLowerCase().trim();
  // "30s" → 0.5
  const secMatch = lower.match(/^(\d+)\s*s$/);
  if (secMatch) return Number(secMatch[1]) / 60;
  // "3min" / "3 min" → 3
  const minMatch = lower.match(/^(\d+)\s*min$/);
  if (minMatch) return Number(minMatch[1]);
  // bare number → treat as minutes
  const num = parseFloat(lower);
  if (!isNaN(num)) return num;
  return 0;
}

/** Format total minutes as "~Xh Ym" */
function formatTotalTime(minutes: number): string {
  if (minutes <= 0) return '~0m total';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `~${m}m total`;
  if (m === 0) return `~${h}h total`;
  return `~${h}h ${m}m total`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FilmView({ items, batchDay, onToggleFilmed, onMarkAllDone }: ShotListProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // ---- Filter & sort ----
  const videoItems = items.filter(
    (item) => (item.contentType === 'video' || item.contentType === undefined)
  );
  const unfilmedItems = videoItems
    .filter((item) => !item.filmed)
    .sort((a, b) => {
      const aOrder = a.shotOrder ?? Infinity;
      const bOrder = b.shotOrder ?? Infinity;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // fallback to original array index (stable)
      return items.indexOf(a) - items.indexOf(b);
    });

  const totalVideoCount = videoItems.length;
  const filmedCount = videoItems.filter((item) => item.filmed).length;
  const allDone = totalVideoCount > 0 && filmedCount === totalVideoCount;

  // Total estimated time
  const totalMinutes = unfilmedItems.reduce((sum, item) => sum + parseDuration(item.estimatedDuration), 0);

  // Progress ratio for SVG
  const progressRatio = totalVideoCount > 0 ? filmedCount / totalVideoCount : 0;

  // Expand / collapse
  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ---- Empty state ----
  if (unfilmedItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Header (still shown even when empty) */}
        <Header
          batchDay={batchDay}
          filmedCount={filmedCount}
          totalCount={totalVideoCount}
          progressRatio={progressRatio}
          allDone={allDone}
          totalMinutes={0}
          onPrint={() => window.print()}
          onMarkAllDone={onMarkAllDone}
        />
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-12 text-center">
          <Film className="w-12 h-12 text-[#9ca3af] mx-auto mb-4" />
          <h3 className="text-[15px] font-medium text-[#1a1a1a] mb-1">All caught up!</h3>
          <p className="text-[13px] text-[#6b7280]">No videos to film right now.</p>
        </div>
      </div>
    );
  }

  // ---- Main render ----
  return (
    <div className="max-w-3xl mx-auto">
      <Header
        batchDay={batchDay}
        filmedCount={filmedCount}
        totalCount={totalVideoCount}
        progressRatio={progressRatio}
        allDone={allDone}
        totalMinutes={totalMinutes}
        onPrint={() => window.print()}
        onMarkAllDone={onMarkAllDone}
      />

      {/* Shot cards */}
      <div>
        {unfilmedItems.map((item, idx) => {
          const shotNumber = idx + 1;
          const isExpanded = expandedItems.has(item.id);
          const badge = PLATFORM_BADGE[item.platform];

          return (
            <div
              key={item.id}
              className={`shot-card bg-white rounded-xl border border-[#e5e7eb] p-4 mb-3 transition-all duration-200 hover:border-[#d1d5db] ${
                item.filmed ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Left: shot number circle */}
                <div className="w-10 h-10 rounded-full bg-[#f3f4f6] flex items-center justify-center flex-shrink-0">
                  <span className="text-[14px] font-semibold text-[#1a1a1a]">#{shotNumber}</span>
                </div>

                {/* Main area */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => toggleExpanded(item.id)}
                >
                  {/* Hook */}
                  <p className="text-[14px] font-bold text-[#1a1a1a] leading-relaxed">{item.hook}</p>

                  {/* Badge row */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {badge && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    )}
                    {item.estimatedDuration && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
                        ~{item.estimatedDuration}
                      </span>
                    )}
                    {item.level && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                        {item.level}
                      </span>
                    )}
                    {item.pillar && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                        {item.pillar}
                      </span>
                    )}
                  </div>

                  {/* Topic + Subject */}
                  <p className="text-[12px] text-[#9ca3af] mt-1.5">
                    {item.topic}{item.subject ? ` · ${item.subject}` : ''}
                  </p>

                  {/* Expand indicator */}
                  {item.script && (
                    <button className="flex items-center gap-1 mt-2 text-[11px] text-[#6b7280] hover:text-[#1a1a1a]">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                      Script
                    </button>
                  )}
                </div>

                {/* Right: filmed checkbox */}
                <button
                  onClick={() => onToggleFilmed(item.id)}
                  className="flex-shrink-0 mt-1"
                  aria-label={item.filmed ? 'Mark as not filmed' : 'Mark as filmed'}
                >
                  {item.filmed ? (
                    <CheckCircle2 className="w-6 h-6 text-[#22c55e]" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-[#d1d5db] hover:border-[#9ca3af] transition-colors" />
                  )}
                </button>
              </div>

              {/* Expanded script */}
              {isExpanded && item.script && (
                <div className="shot-script mt-3 ml-14">
                  <div className="bg-[#f9fafb] rounded-lg p-4 text-[13px] whitespace-pre-line text-[#374151]">
                    {item.script}
                  </div>
                </div>
              )}
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
interface HeaderProps {
  batchDay: string;
  filmedCount: number;
  totalCount: number;
  progressRatio: number;
  allDone: boolean;
  totalMinutes: number;
  onPrint: () => void;
  onMarkAllDone: () => void;
}

function Header({
  batchDay,
  filmedCount,
  totalCount,
  progressRatio,
  allDone,
  totalMinutes,
  onPrint,
  onMarkAllDone,
}: HeaderProps) {
  return (
    <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left: title + meta */}
        <div className="flex items-center gap-4">
          {/* Circular progress */}
          <div className="w-16 h-16 relative flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={allDone ? '#22c55e' : '#1a1a1a'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progressRatio * 176} 176`}
                className="transition-all duration-500"
              />
            </svg>
            {allDone && (
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#22c55e]" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-[18px] font-semibold text-[#1a1a1a] tracking-tight uppercase">
              {batchDay} SHOT LIST
            </h1>
            <p className="text-[13px] text-[#6b7280] mt-0.5">
              {filmedCount} of {totalCount} filmed
            </p>
            {totalMinutes > 0 && (
              <p className="text-[12px] text-[#9ca3af] mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTotalTime(totalMinutes)}
              </p>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrint}
            className="no-print flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium border border-[#e5e7eb] bg-white text-[#1a1a1a] hover:bg-[#f3f4f6] transition-all duration-200"
          >
            <Printer className="w-4 h-4" />
            Print Shot List
          </button>

          <button
            onClick={onMarkAllDone}
            disabled={allDone}
            className={`no-print flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
              allDone
                ? 'bg-[#22c55e]/10 text-[#22c55e] cursor-default'
                : 'bg-[#1a1a1a] text-white hover:bg-[#333] active:scale-[0.98]'
            }`}
          >
            {allDone ? (
              <>
                <Check className="w-4 h-4" />
                All Done
              </>
            ) : (
              'Mark All Done'
            )}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-5 h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            allDone ? 'bg-[#22c55e]' : 'bg-[#1a1a1a]'
          }`}
          style={{ width: `${progressRatio * 100}%` }}
        />
      </div>
    </div>
  );
}
