import { useState } from 'react';
import {
  Check,
  Circle,
  Film,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Video
} from 'lucide-react';

// Types
export interface PlatformStatus {
  filmed: boolean;
  edited: boolean;
  posted: boolean;
}

export interface ContentItem {
  id: string;
  hook: string;
  pillar: string;
  subject: string;
  topic: string;
  level: string;
  createdAt: string;
  platforms: {
    tiktok?: PlatformStatus;
    ytshorts?: PlatformStatus;
    reels?: PlatformStatus;
    facebook?: PlatformStatus;
    linkedin?: PlatformStatus;
    snapchat?: PlatformStatus;
    ytlong?: PlatformStatus;
  };
  scheduledDay?: string;
  calendarEventId?: string;
}

export interface FilmViewProps {
  items: ContentItem[];
  batchDay: string;
  onToggleFilmed: (ideaId: string, platform: string) => void;
  onMarkAllDone: () => void;
}

// Platform config
const platforms: Record<string, { name: string; color: string; bgColor: string; icon: string }> = {
  tiktok: { name: 'TikTok', color: 'text-[#ff6b9d]', bgColor: 'bg-[#ff6b9d]/10', icon: '♪' },
  ytshorts: { name: 'Shorts', color: 'text-[#ff4444]', bgColor: 'bg-[#ff4444]/10', icon: '▶' },
  reels: { name: 'Reels', color: 'text-[#c77dff]', bgColor: 'bg-[#c77dff]/10', icon: '◎' },
  facebook: { name: 'Facebook', color: 'text-[#1877f2]', bgColor: 'bg-[#1877f2]/10', icon: 'f' },
  snapchat: { name: 'Snap', color: 'text-[#fffc00]', bgColor: 'bg-[#fffc00]/10', icon: '👻' },
  linkedin: { name: 'LinkedIn', color: 'text-[#0a66c2]', bgColor: 'bg-[#0a66c2]/10', icon: 'in' },
  ytlong: { name: 'YouTube', color: 'text-[#ff4444]', bgColor: 'bg-[#ff4444]/10', icon: '▶' }
};

export default function FilmView({ items, batchDay, onToggleFilmed, onMarkAllDone }: FilmViewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Calculate totals
  const totalClips = items.reduce((sum, item) => sum + Object.keys(item.platforms).length, 0);
  const filmedClips = items.reduce((sum, item) =>
    sum + Object.values(item.platforms).filter(p => p?.filmed).length, 0
  );
  const allDone = totalClips > 0 && filmedClips === totalClips;

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isItemComplete = (item: ContentItem) => {
    return Object.values(item.platforms).every(p => p?.filmed);
  };

  const getItemProgress = (item: ContentItem) => {
    const total = Object.keys(item.platforms).length;
    const done = Object.values(item.platforms).filter(p => p?.filmed).length;
    return { total, done };
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-semibold text-[#1a1a1a] tracking-tight">
                {batchDay.toUpperCase()} BATCH
              </h1>
              <p className="text-[13px] text-[#6b7280] mt-0.5">
                {totalClips - filmedClips} clips to film
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress indicator */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[24px] font-semibold text-[#1a1a1a] tabular-nums">
                  {filmedClips}/{totalClips}
                </div>
                <div className="text-[11px] text-[#9ca3af] uppercase tracking-wider">
                  filmed
                </div>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke={allDone ? '#22c55e' : '#1a1a1a'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(filmedClips / Math.max(totalClips, 1)) * 176} 176`}
                    className="transition-all duration-500"
                  />
                </svg>
                {allDone && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-[#22c55e]" />
                  </div>
                )}
              </div>
            </div>

            {/* Mark all done button */}
            <button
              onClick={onMarkAllDone}
              disabled={allDone}
              className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                allDone
                  ? 'bg-[#22c55e]/10 text-[#22c55e] cursor-default'
                  : 'bg-[#1a1a1a] text-white hover:bg-[#333] active:scale-[0.98]'
              }`}
            >
              {allDone ? (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  All Done
                </span>
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
            style={{ width: `${(filmedClips / Math.max(totalClips, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Content list */}
      {items.length === 0 ? (
        <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f3f4f6] flex items-center justify-center mx-auto mb-4">
            <Video className="w-7 h-7 text-[#9ca3af]" />
          </div>
          <h3 className="text-[15px] font-medium text-[#1a1a1a] mb-1">
            No content scheduled
          </h3>
          <p className="text-[13px] text-[#6b7280]">
            Schedule content for {batchDay} to see it here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const isExpanded = expandedItems.has(item.id);
            const isComplete = isItemComplete(item);
            const { total, done } = getItemProgress(item);

            return (
              <div
                key={item.id}
                className={`bg-[#fafafa] border rounded-xl overflow-hidden transition-all duration-200 ${
                  isComplete
                    ? 'border-[#22c55e]/30 bg-[#22c55e]/[0.02]'
                    : 'border-[#e5e7eb] hover:border-[#d1d5db]'
                }`}
              >
                {/* Item header */}
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="w-full flex items-start gap-4 p-4 text-left"
                >
                  {/* Number / Check */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 ${
                    isComplete
                      ? 'bg-[#22c55e] text-white'
                      : done > 0
                        ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                        : 'bg-[#f3f4f6] text-[#6b7280]'
                  }`}>
                    {isComplete ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-[13px] font-medium">{index + 1}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] leading-relaxed transition-all duration-200 ${
                      isComplete
                        ? 'text-[#9ca3af] line-through'
                        : 'text-[#1a1a1a]'
                    }`}>
                      {item.hook}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-[#9ca3af] uppercase tracking-wider">
                        {item.level}
                      </span>
                      <span className="text-[#d1d5db]">·</span>
                      <span className="text-[11px] text-[#6b7280]">
                        {item.topic}
                      </span>
                    </div>

                    {/* Platform pills - always visible */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {Object.entries(item.platforms).map(([platformId, status]) => {
                        const platform = platforms[platformId];
                        const isFilmed = status?.filmed;

                        return (
                          <span
                            key={platformId}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                              isFilmed
                                ? 'bg-[#22c55e]/10 text-[#22c55e]'
                                : `${platform.bgColor} ${platform.color}`
                            }`}
                          >
                            {isFilmed && <Check className="w-3 h-3" />}
                            {platform.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progress & expand */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[12px] text-[#9ca3af] tabular-nums">
                      {done}/{total}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-[#9ca3af]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[#9ca3af]" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#e5e7eb]">
                    <div className="ml-12 space-y-2">
                      {Object.entries(item.platforms).map(([platformId, status]) => {
                        const platform = platforms[platformId];
                        const isFilmed = status?.filmed;

                        return (
                          <button
                            key={platformId}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFilmed(item.id, platformId);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                              isFilmed
                                ? 'bg-[#22c55e]/5 border border-[#22c55e]/20'
                                : 'bg-white border border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb]'
                            }`}
                          >
                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 ${
                              isFilmed
                                ? 'bg-[#22c55e] text-white'
                                : 'border-2 border-[#d1d5db]'
                            }`}>
                              {isFilmed && <Check className="w-3 h-3" />}
                            </div>

                            {/* Platform info */}
                            <div className="flex items-center gap-2 flex-1">
                              <span className={`text-[14px] ${platform.color}`}>
                                {platform.icon}
                              </span>
                              <span className={`text-[13px] font-medium ${
                                isFilmed ? 'text-[#22c55e]' : 'text-[#1a1a1a]'
                              }`}>
                                {platform.name}
                              </span>
                            </div>

                            {/* Status */}
                            {isFilmed ? (
                              <span className="text-[11px] text-[#22c55e] font-medium">
                                Filmed
                              </span>
                            ) : (
                              <Circle className="w-4 h-4 text-[#d1d5db]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary footer */}
      {items.length > 0 && (
        <div className="mt-6 p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[#6b7280]">
              {items.length} content {items.length === 1 ? 'piece' : 'pieces'} scheduled for {batchDay}
            </span>
            <span className="text-[#1a1a1a] font-medium">
              {filmedClips === totalClips
                ? 'All clips filmed!'
                : `${totalClips - filmedClips} clips remaining`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
