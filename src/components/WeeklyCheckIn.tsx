import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  BarChart3,
  Eye,
  FileText,
  CheckCircle,
} from 'lucide-react';
import type { Goals, WeeklySnapshot, ContentItem, Platform } from '../types';
import { PLATFORMS } from '../types';

// ============================================================================
// Types
// ============================================================================

interface WeeklyCheckInProps {
  goals: Goals;
  lastSnapshot: WeeklySnapshot | null;
  contentItems: ContentItem[];
  onSubmit: (snapshot: Omit<WeeklySnapshot, 'id'>) => void;
  onDismiss: () => void;
}

interface PlatformDelta {
  platform: Platform;
  current: number;
  previous: number | null;
  delta: number | null;
  trend: 'up' | 'flat' | 'down';
}

interface VerdictLine {
  message: string;
  severity: 'green' | 'amber' | 'red';
}

// ============================================================================
// Helpers
// ============================================================================

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatMondayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' });
}

function isWithinThisWeek(dateStr: string, monday: Date): boolean {
  const date = new Date(dateStr);
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  return date >= monday && date < nextMonday;
}

function countPostsThisWeek(items: ContentItem[], monday: Date): number {
  return items.filter(
    (item) => item.posted && item.postedAt && isWithinThisWeek(item.postedAt, monday)
  ).length;
}

function sumViewsThisWeek(items: ContentItem[], monday: Date): number {
  return items
    .filter(
      (item) =>
        item.posted &&
        item.postedAt &&
        isWithinThisWeek(item.postedAt, monday) &&
        item.performance
    )
    .reduce((sum, item) => sum + (item.performance?.views || 0), 0);
}

function avgEngagementThisWeek(items: ContentItem[], monday: Date): number {
  const relevant = items.filter(
    (item) =>
      item.posted &&
      item.postedAt &&
      isWithinThisWeek(item.postedAt, monday) &&
      item.performance &&
      item.performance.views > 0
  );
  if (relevant.length === 0) return 0;
  const total = relevant.reduce(
    (sum, item) => sum + (item.performance?.engagementRate || 0),
    0
  );
  return Math.round((total / relevant.length) * 100) / 100;
}

function generateVerdict(
  deltas: PlatformDelta[],
  currentSubscribers: number,
  subscriberTarget: number,
  goals: Goals
): VerdictLine[] {
  const lines: VerdictLine[] = [];

  const growing = deltas.filter((d) => d.trend === 'up');
  const flat = deltas.filter((d) => d.trend === 'flat');
  const dropped = deltas.filter((d) => d.trend === 'down');

  if (dropped.length > 0) {
    dropped.forEach((d) => {
      const name = PLATFORMS[d.platform]?.name || d.platform;
      lines.push({
        message: `${name} dropped ${d.delta}. Figure out what changed.`,
        severity: 'red',
      });
    });
  }

  if (flat.length > 0) {
    flat.forEach((d) => {
      const name = PLATFORMS[d.platform]?.name || d.platform;
      lines.push({
        message: `${name} stalled. Same number as last week. Post more.`,
        severity: 'amber',
      });
    });
  }

  if (growing.length > 0 && dropped.length === 0 && flat.length === 0) {
    // All growing — find the biggest target gap for an estimate
    const tiktokGoal = goals.platformGoals.find((g) => g.platform === 'tiktok');
    const tiktokDelta = deltas.find((d) => d.platform === 'tiktok');
    if (tiktokGoal && tiktokDelta && tiktokDelta.delta && tiktokDelta.delta > 0) {
      const remaining = tiktokGoal.targetFollowers - tiktokDelta.current;
      const weeksToTarget = Math.ceil(remaining / tiktokDelta.delta);
      if (remaining > 0) {
        lines.push({
          message: `Momentum. Keep it up. You're ~${weeksToTarget} weeks from ${tiktokGoal.targetFollowers.toLocaleString()} on TikTok.`,
          severity: 'green',
        });
      } else {
        lines.push({
          message: `Momentum. All platforms growing. Keep pushing.`,
          severity: 'green',
        });
      }
    } else {
      lines.push({
        message: `Momentum. All platforms growing. Keep pushing.`,
        severity: 'green',
      });
    }
  } else if (growing.length > 0) {
    growing.forEach((d) => {
      const name = PLATFORMS[d.platform]?.name || d.platform;
      lines.push({
        message: `${name} up +${d.delta}. Good.`,
        severity: 'green',
      });
    });
  }

  // Subscriber line
  if (subscriberTarget > 0) {
    const pct = Math.round((currentSubscribers / subscriberTarget) * 100);
    lines.push({
      message: `${currentSubscribers} of ${subscriberTarget} subscribers. ${pct}% there.`,
      severity: pct >= 75 ? 'green' : pct >= 40 ? 'amber' : 'red',
    });
  }

  // If we have no deltas at all (first check-in)
  if (deltas.every((d) => d.previous === null)) {
    return [
      {
        message: 'First check-in recorded. Baseline set. Next week we compare.',
        severity: 'green',
      },
      ...lines.filter((l) => l.message.includes('subscribers')),
    ];
  }

  return lines;
}

// ============================================================================
// Platform icon color helper
// ============================================================================

const PLATFORM_BG_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-50 text-pink-500',
  shorts: 'bg-red-50 text-red-500',
  reels: 'bg-purple-50 text-purple-500',
  facebook: 'bg-blue-50 text-blue-600',
  linkedin: 'bg-blue-50 text-blue-700',
  snapchat: 'bg-yellow-50 text-yellow-500',
  ytlong: 'bg-red-50 text-red-600',
  reddit: 'bg-orange-50 text-orange-600',
  mumsnet: 'bg-teal-50 text-teal-600',
};

// ============================================================================
// Component
// ============================================================================

export default function WeeklyCheckIn({
  goals,
  lastSnapshot,
  contentItems,
  onSubmit,
  onDismiss,
}: WeeklyCheckInProps) {
  const monday = useMemo(() => getMondayOfWeek(new Date()), []);
  const mondayLabel = formatMondayDate(monday);

  // --- Follower count inputs: one per platform in goals.platformGoals ---
  const initialFollowers = useMemo(() => {
    const map: Record<string, number> = {};
    for (const pg of goals.platformGoals) {
      const lastValue = lastSnapshot?.followers[pg.platform];
      map[pg.platform] = lastValue ?? pg.currentFollowers;
    }
    return map;
  }, [goals.platformGoals, lastSnapshot]);

  const [followerInputs, setFollowerInputs] = useState<Record<string, number>>(initialFollowers);

  const initialSubscribers = lastSnapshot?.subscribers ?? goals.currentSubscribers;
  const [subscriberInput, setSubscriberInput] = useState<number>(initialSubscribers);

  const [showVerdict, setShowVerdict] = useState(false);
  const [verdictLines, setVerdictLines] = useState<VerdictLine[]>([]);

  // --- Auto-calculated stats ---
  const postsThisWeek = useMemo(() => countPostsThisWeek(contentItems, monday), [contentItems, monday]);
  const viewsThisWeek = useMemo(() => sumViewsThisWeek(contentItems, monday), [contentItems, monday]);
  const engagementThisWeek = useMemo(() => avgEngagementThisWeek(contentItems, monday), [contentItems, monday]);

  // --- Delta calculations ---
  const deltas: PlatformDelta[] = useMemo(() => {
    return goals.platformGoals.map((pg) => {
      const current = followerInputs[pg.platform] ?? 0;
      const previous = lastSnapshot?.followers[pg.platform] ?? null;
      const delta = previous !== null ? current - previous : null;
      let trend: 'up' | 'flat' | 'down' = 'flat';
      if (delta !== null) {
        if (delta > 0) trend = 'up';
        else if (delta < 0) trend = 'down';
      }
      return { platform: pg.platform, current, previous, delta, trend };
    });
  }, [goals.platformGoals, followerInputs, lastSnapshot]);

  // --- Handlers ---
  const updateFollower = (platform: string, value: string) => {
    const num = parseInt(value, 10);
    setFollowerInputs((prev) => ({
      ...prev,
      [platform]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSubmit = () => {
    const followers: Record<string, number> = {};
    for (const pg of goals.platformGoals) {
      followers[pg.platform] = followerInputs[pg.platform] ?? 0;
    }

    const snapshot: Omit<WeeklySnapshot, 'id'> = {
      weekOf: monday.toISOString(),
      recordedAt: new Date().toISOString(),
      followers,
      subscribers: subscriberInput,
      postsPublished: postsThisWeek,
      totalViews: viewsThisWeek,
      avgEngagementRate: engagementThisWeek,
    };

    // Generate verdict
    const lines = generateVerdict(deltas, subscriberInput, goals.subscriberTarget, goals);
    setVerdictLines(lines);
    setShowVerdict(true);

    onSubmit(snapshot);
  };

  // --- Verdict severity border color ---
  const verdictBorderColor = (severity: 'green' | 'amber' | 'red') => {
    if (severity === 'green') return 'border-l-green-500';
    if (severity === 'amber') return 'border-l-amber-500';
    return 'border-l-red-500';
  };

  // Overall verdict severity
  const overallSeverity: 'green' | 'amber' | 'red' = useMemo(() => {
    if (verdictLines.some((l) => l.severity === 'red')) return 'red';
    if (verdictLines.some((l) => l.severity === 'amber')) return 'amber';
    return 'green';
  }, [verdictLines]);

  const overallBorderColor =
    overallSeverity === 'green'
      ? 'border-green-500'
      : overallSeverity === 'amber'
        ? 'border-amber-500'
        : 'border-red-500';

  // ========================================================================
  // Render: Verdict Screen
  // ========================================================================

  if (showVerdict) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e5e7eb]">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle
                size={18}
                className={
                  overallSeverity === 'green'
                    ? 'text-green-500'
                    : overallSeverity === 'amber'
                      ? 'text-amber-500'
                      : 'text-red-500'
                }
              />
              <h2 className="text-[15px] font-bold text-[#1a1a1a] uppercase tracking-wide">
                Weekly Verdict
              </h2>
            </div>
            <p className="text-[12px] text-[#6b7280]">Week of {mondayLabel}</p>
          </div>

          {/* Verdict body */}
          <div className={`px-6 py-5 border-l-4 ${overallBorderColor} mx-4 my-4 rounded-r-lg bg-[#f9fafb]`}>
            <div className="space-y-3">
              {verdictLines.map((line, i) => (
                <div key={i} className={`flex items-start gap-2 border-l-2 ${verdictBorderColor(line.severity)} pl-3 py-1`}>
                  {line.severity === 'green' && <TrendingUp size={14} className="text-green-500 mt-0.5 flex-shrink-0" />}
                  {line.severity === 'amber' && <Minus size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />}
                  {line.severity === 'red' && <TrendingDown size={14} className="text-red-500 mt-0.5 flex-shrink-0" />}
                  <p className="text-[13px] text-[#1a1a1a] leading-snug">{line.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#e5e7eb] flex justify-end">
            <button
              onClick={onDismiss}
              className="bg-[#211d1d] text-white rounded-lg px-6 py-3 font-medium text-[13px] hover:bg-[#352f2f] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // Render: Input Screen
  // ========================================================================

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e5e7eb] flex-shrink-0">
          <h2 className="text-[15px] font-bold text-[#1a1a1a] uppercase tracking-wide">
            Weekly Check-In
          </h2>
          <p className="text-[12px] text-[#6b7280] mt-0.5">Week of {mondayLabel}</p>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-0">
          {/* ---- Section 1: Follower Counts ---- */}
          <div>
            <h3 className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
              <Users size={13} />
              Follower Counts
            </h3>
            <div className="space-y-2.5">
              {goals.platformGoals.map((pg) => {
                const info = PLATFORMS[pg.platform];
                const delta = deltas.find((d) => d.platform === pg.platform);
                const colorClasses = PLATFORM_BG_COLORS[pg.platform] || 'bg-gray-50 text-gray-500';

                return (
                  <div
                    key={pg.platform}
                    className="flex items-center gap-3"
                  >
                    {/* Platform badge */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                      <Users size={14} />
                    </div>
                    <span className="text-[13px] text-[#1a1a1a] font-medium w-20 flex-shrink-0">
                      {info?.name || pg.platform}
                    </span>

                    {/* Input */}
                    <input
                      type="number"
                      value={followerInputs[pg.platform] ?? 0}
                      onChange={(e) => updateFollower(pg.platform, e.target.value)}
                      className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-[13px] w-24 text-right focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
                    />

                    {/* Delta */}
                    <div className="w-16 flex-shrink-0 text-right">
                      {delta?.delta !== null && delta?.delta !== undefined ? (
                        <span
                          className={`text-[12px] font-medium ${
                            delta.trend === 'up'
                              ? 'text-green-600'
                              : delta.trend === 'down'
                                ? 'text-red-500'
                                : 'text-[#9ca3af]'
                          }`}
                        >
                          {delta.trend === 'up' && (
                            <TrendingUp size={12} className="inline mr-0.5 -mt-0.5" />
                          )}
                          {delta.trend === 'down' && (
                            <TrendingDown size={12} className="inline mr-0.5 -mt-0.5" />
                          )}
                          {delta.trend === 'flat' && (
                            <Minus size={12} className="inline mr-0.5 -mt-0.5" />
                          )}
                          {delta.delta > 0 ? `+${delta.delta}` : delta.delta === 0 ? '0' : `${delta.delta}`}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#d1d5db]">&mdash;</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e5e7eb] my-4" />

          {/* ---- Section 2: Paying Subscribers ---- */}
          <div>
            <h3 className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
              <BarChart3 size={13} />
              Paying Subscribers
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-[#1a1a1a] font-medium flex-1">
                Revise Right subscribers
              </span>
              <input
                type="number"
                value={subscriberInput}
                onChange={(e) => {
                  const num = parseInt(e.target.value, 10);
                  setSubscriberInput(isNaN(num) ? 0 : num);
                }}
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-[13px] w-24 text-right focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              />
            </div>
            <p className="text-[11px] text-[#9ca3af] mt-1.5">
              Target: {goals.subscriberTarget}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e5e7eb] my-4" />

          {/* ---- Section 3: Auto-calculated Stats ---- */}
          <div>
            <h3 className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
              <Eye size={13} />
              This Week (Auto-Calculated)
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-[#1a1a1a] flex items-center gap-2">
                  <FileText size={13} className="text-[#9ca3af]" />
                  Posts published this week
                </span>
                <span className="text-[13px] font-semibold text-[#1a1a1a]">
                  {postsThisWeek}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-[#1a1a1a] flex items-center gap-2">
                  <Eye size={13} className="text-[#9ca3af]" />
                  Total views this week
                </span>
                <span className="text-[13px] font-semibold text-[#1a1a1a]">
                  {viewsThisWeek.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e7eb] flex items-center justify-between flex-shrink-0">
          <button
            onClick={onDismiss}
            className="text-[13px] text-[#9ca3af] hover:text-[#6b7280] transition-colors"
          >
            Skip this week
          </button>
          <button
            onClick={handleSubmit}
            className="bg-[#211d1d] text-white rounded-lg px-6 py-3 font-medium text-[13px] hover:bg-[#352f2f] transition-colors"
          >
            SUBMIT CHECK-IN
          </button>
        </div>
      </div>
    </div>
  );
}
