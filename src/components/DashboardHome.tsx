/**
 * DashboardHome Component — Coach Mode Dashboard
 *
 * The main landing screen of the Marketing Command Center v2.
 * Five sections top-to-bottom:
 *   1. Coach Banner (mission / check-in / progress)
 *   2. Platform Progress Row (horizontal scroll)
 *   3. Quick Actions (2x2 grid)
 *   4. Content Health (collapsed by default)
 *   5. Agent Activity (collapsed by default)
 *
 * Follows the existing design system: white cards, #e5e7eb borders,
 * 11-13px text sizes, lucide-react icons.
 */

import { useMemo, useState } from 'react';
import {
  Sparkles,
  Film,
  FileText,
  ChevronRight,
  ChevronDown,
  Bot,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings as SettingsIcon,
} from 'lucide-react';
import type {
  ContentItem,
  Settings,
  ContentGapAnalysis,
  SchedulingAnalysis,
  Goals,
  GrowthMetrics,
  AccountabilityState,
} from '../types';
import { PLATFORMS } from '../types';
import type { AgentResultEntry, PipelineId } from '../lib/agents/types';
import { analyzeContentGaps } from '../lib/contentAnalysis';

// ============================================================================
// Types
// ============================================================================

export interface ProactiveNotification {
  id: string;
  agentId: string;
  timestamp: string;
  triggerReason: string;
  summary: string;
  dismissed: boolean;
}

type Section = 'home' | 'week' | 'shotlist' | 'textqueue' | 'post' | 'agents';

interface PostingScoreEntry {
  platform: string;
  posted: number;
  target: number;
  met: boolean;
}

interface DashboardHomeProps {
  contentItems: ContentItem[];
  settings: Settings;
  gapAnalysis: ContentGapAnalysis | null;
  schedulingAnalysis: SchedulingAnalysis | null;
  agentRunHistory: AgentResultEntry[];
  proactiveResults: ProactiveNotification[];
  isAgentRunning: boolean;
  onNavigate: (section: Section) => void;
  onStartPipeline: (pipelineId: PipelineId) => void;
  onAnalyzeGaps: () => void;
  // Goals props
  goals: Goals;
  growthMetrics: GrowthMetrics[];
  accountability: AccountabilityState;
  postingScore: PostingScoreEntry[];
  onOpenCheckIn: () => void;
  onOpenGoalSettings: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const AGENT_NAMES: Record<string, string> = {
  writer: 'Mildred',
  scheduler: 'Bernard',
};

/** What day of the week is it (0=Sun .. 6=Sat) */
function getDayOfWeek(): number {
  return new Date().getDay();
}

/** Monday=1, Tuesday=2 */
function isCheckInWindow(): boolean {
  const d = getDayOfWeek();
  return d === 1 || d === 2;
}

/** How far through the work-week (Mon-Sun) are we? 0-1 */
function weekProgress(): number {
  const d = getDayOfWeek();
  // Remap: Mon=1 -> 1/7, Tue=2 -> 2/7 ... Sun=0 -> 7/7
  const mapped = d === 0 ? 7 : d;
  return mapped / 7;
}

// ============================================================================
// Component
// ============================================================================

export default function DashboardHome({
  contentItems,
  settings,
  gapAnalysis,
  schedulingAnalysis,
  agentRunHistory,
  proactiveResults,
  isAgentRunning,
  onNavigate,
  onStartPipeline,
  onAnalyzeGaps,
  goals,
  growthMetrics,
  accountability,
  postingScore,
  onOpenCheckIn,
  onOpenGoalSettings,
}: DashboardHomeProps) {
  // ---- Collapsible sections ----
  const [healthExpanded, setHealthExpanded] = useState(false);
  const [agentExpanded, setAgentExpanded] = useState(false);

  // ---- Derived data ----
  const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const isBatchDay = today === settings.batchDay;

  // Posting score totals
  const totalPosted = postingScore.reduce((s, e) => s + e.posted, 0);
  const totalTarget = postingScore.reduce((s, e) => s + e.target, 0);
  const weekPct = totalTarget > 0 ? Math.round((totalPosted / totalTarget) * 100) : 0;
  const remaining = Math.max(0, totalTarget - totalPosted);

  // Progress color coding
  const progressColor =
    weekPct >= 80 ? '#22c55e' : weekPct >= 50 ? '#f59e0b' : '#ef4444';
  const progressBorderColor =
    weekPct >= 80 ? 'border-l-[#22c55e]' : weekPct >= 50 ? 'border-l-[#f59e0b]' : 'border-l-[#ef4444]';

  // Content health
  const analysis = useMemo(
    () => gapAnalysis || analyzeContentGaps(contentItems, settings),
    [gapAnalysis, contentItems, settings]
  );
  const topGaps = analysis.gaps.filter(g => g.priority === 'high').slice(0, 3);
  const displayGaps =
    topGaps.length < 3
      ? [...topGaps, ...analysis.gaps.filter(g => g.priority === 'medium').slice(0, 3 - topGaps.length)]
      : topGaps;

  // Agent activity
  const activeNotifications = proactiveResults.filter(n => !n.dismissed);
  const recentRuns = agentRunHistory.slice(0, 3);

  // Build a lookup for growth metrics by platform
  const metricsMap = useMemo(() => {
    const m: Record<string, GrowthMetrics> = {};
    for (const gm of growthMetrics) {
      m[gm.platform] = gm;
    }
    return m;
  }, [growthMetrics]);

  // ========================================================================
  // Coach Banner Logic
  // ========================================================================
  const noGoals = goals.platformGoals.length === 0;
  const checkInPending = accountability.pendingCheckIn && isCheckInWindow();

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ================================================================
          1. Coach Banner
          ================================================================ */}
      <section>
        {noGoals ? (
          /* --- No goals set --- */
          <div className="bg-white rounded-xl border border-[#e5e7eb] border-l-4 border-l-[#f59e0b] p-5 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-[#1a1a1a] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#f59e0b]" />
                SET YOUR MISSION
              </div>
              <div className="text-[11px] text-[#6b7280] mt-1">
                Define your platform goals and posting targets to unlock coaching.
              </div>
            </div>
            <button
              onClick={onOpenGoalSettings}
              className="flex items-center gap-2 bg-[#211d1d] text-white text-[12px] font-medium px-4 py-2 rounded-lg hover:bg-[#3a3535] transition-colors"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              Set Goals
            </button>
          </div>
        ) : checkInPending ? (
          /* --- Weekly check-in pending --- */
          <button
            onClick={onOpenCheckIn}
            className="w-full bg-white rounded-xl border border-[#e5e7eb] border-l-4 border-l-[#6366f1] p-5 flex items-center justify-between hover:border-[#c4c7cc] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-indigo-600" />
                </div>
                {/* Pulsing dot */}
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                </span>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#1a1a1a]">WEEKLY CHECK-IN</div>
                <div className="text-[11px] text-[#6b7280]">
                  Record this week's numbers and stay accountable.
                  {accountability.checkInStreak > 0 && (
                    <span className="ml-1 text-indigo-600 font-medium">
                      {accountability.checkInStreak}-week streak
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
          </button>
        ) : (
          /* --- Dynamic coach message --- */
          <div
            className={`bg-white rounded-xl border border-[#e5e7eb] border-l-4 ${progressBorderColor} p-5`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-semibold text-[#1a1a1a]">
                {remaining > 0
                  ? `You need to post ${remaining} more this week.`
                  : 'On track. Keep pushing.'}
              </div>
              <div className="text-[11px] text-[#6b7280]">
                {totalPosted}/{totalTarget} posts
              </div>
            </div>
            {/* Week progress bar */}
            <div className="relative">
              <div className="h-1.5 rounded-full bg-[#e5e7eb] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(weekPct, 100)}%`,
                    backgroundColor: progressColor,
                  }}
                />
              </div>
              {/* Week time marker */}
              <div
                className="absolute top-0 w-0.5 h-1.5 bg-[#6b7280] opacity-40"
                style={{ left: `${weekProgress() * 100}%` }}
                title="Today"
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div className="text-[10px] text-[#9ca3af]">Mon</div>
              <div className="text-[10px] text-[#9ca3af]">Sun</div>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          2. Platform Progress Row
          ================================================================ */}
      {goals.platformGoals.length > 0 && (
        <section>
          <h2 className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-3">
            Platform Progress
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {goals.platformGoals.map(pg => {
              const gm = metricsMap[pg.platform];
              const platformInfo = PLATFORMS[pg.platform];
              const pctToGoal = gm ? gm.percentToGoal : (pg.targetFollowers > 0 ? Math.round((pg.currentFollowers / pg.targetFollowers) * 100) : 0);
              const trend = gm?.trend ?? 'flat';
              const weeklyRate = gm?.weeklyGrowthRate ?? 0;

              return (
                <div
                  key={pg.platform}
                  className="bg-white rounded-xl border border-[#e5e7eb] p-4 min-w-[160px] flex-shrink-0"
                >
                  {/* Platform name */}
                  <div className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-2">
                    {platformInfo?.name ?? pg.platform}
                  </div>

                  {/* Current followers */}
                  <div className="text-[20px] font-semibold text-[#1a1a1a] leading-none">
                    {pg.currentFollowers.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#9ca3af] mb-2">
                    / {pg.targetFollowers.toLocaleString()}
                  </div>

                  {/* Mini progress bar */}
                  <div className="h-1.5 rounded-full bg-[#e5e7eb] overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(pctToGoal, 100)}%`,
                        backgroundColor: pctToGoal >= 80 ? '#22c55e' : pctToGoal >= 40 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>

                  {/* Growth rate + trend */}
                  <div className="flex items-center gap-1">
                    {trend === 'up' && <TrendingUp className="w-3 h-3 text-[#22c55e]" />}
                    {trend === 'flat' && <Minus className="w-3 h-3 text-[#9ca3af]" />}
                    {trend === 'down' && <TrendingDown className="w-3 h-3 text-[#ef4444]" />}
                    <span
                      className={`text-[11px] font-medium ${
                        trend === 'up'
                          ? 'text-[#22c55e]'
                          : trend === 'down'
                            ? 'text-[#ef4444]'
                            : 'text-[#9ca3af]'
                      }`}
                    >
                      {weeklyRate !== 0 ? `${weeklyRate > 0 ? '+' : ''}${weeklyRate}/wk` : '--'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================================================================
          3. Quick Actions — 2x2 grid
          ================================================================ */}
      <section>
        {/* Generate — full width */}
        <button
          onClick={() => onStartPipeline('full-content')}
          disabled={isAgentRunning}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-700 rounded-xl py-4 px-5 text-white font-medium flex items-center justify-center gap-2.5 hover:from-violet-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[14px]">{isAgentRunning ? 'Generating...' : 'Generate Content'}</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          {/* Shot List */}
          <button
            onClick={() => onNavigate('shotlist' as Section)}
            className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl py-4 px-4 text-white font-medium flex items-center gap-2 hover:from-amber-600 hover:to-amber-700 transition-all relative"
          >
            <Film className="w-5 h-5" />
            <span className="text-[13px]">Shot List</span>
            {isBatchDay && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
            )}
          </button>

          {/* Text Queue */}
          <button
            onClick={() => onNavigate('textqueue' as Section)}
            className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl py-4 px-4 text-white font-medium flex items-center gap-2 hover:from-teal-600 hover:to-teal-700 transition-all"
          >
            <FileText className="w-5 h-5" />
            <span className="text-[13px]">Text Queue</span>
          </button>
        </div>
      </section>

      {/* ================================================================
          4. Content Health — collapsed by default
          ================================================================ */}
      <section>
        <button
          onClick={() => setHealthExpanded(prev => !prev)}
          className="w-full bg-white rounded-xl border border-[#e5e7eb] p-4 flex items-center justify-between hover:border-[#c4c7cc] transition-colors"
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-[20px] font-semibold ${
                analysis.balanceScore >= 70
                  ? 'text-[#22c55e]'
                  : analysis.balanceScore >= 40
                    ? 'text-[#f59e0b]'
                    : 'text-[#ef4444]'
              }`}
            >
              {analysis.balanceScore}
            </span>
            <span className="text-[13px] text-[#1a1a1a] font-medium">Content Health</span>
          </div>
          {healthExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#9ca3af]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
          )}
        </button>

        {healthExpanded && (
          <div className="mt-2 space-y-2">
            {displayGaps.length > 0 ? (
              displayGaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-[#e5e7eb] p-3 flex items-start gap-2"
                >
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${
                      gap.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : gap.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {gap.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[#1a1a1a]">{gap.value}</div>
                    <div className="text-[11px] text-[#6b7280] truncate">{gap.suggestion}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 text-[13px] text-[#9ca3af] text-center">
                No content gaps detected.
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================================================================
          5. Agent Activity — collapsed by default
          ================================================================ */}
      <section>
        <button
          onClick={() => setAgentExpanded(prev => !prev)}
          className="w-full bg-white rounded-xl border border-[#e5e7eb] p-4 flex items-center justify-between hover:border-[#c4c7cc] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#6b7280]" />
            <span className="text-[13px] text-[#1a1a1a] font-medium">Agent Activity</span>
            {agentRunHistory.length > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-[#6b7280]">
                {agentRunHistory.length}
              </span>
            )}
          </div>
          {agentExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#9ca3af]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
          )}
        </button>

        {agentExpanded && (
          <div className="mt-2 bg-white rounded-xl border border-[#e5e7eb] p-4 space-y-3">
            {activeNotifications.length === 0 && recentRuns.length === 0 ? (
              <div className="text-center py-4 text-[13px] text-[#9ca3af]">
                No agent runs yet.
              </div>
            ) : (
              <>
                {/* Proactive notifications */}
                {activeNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className="border-l-4 border-blue-500 pl-3 py-2"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        Auto
                      </span>
                      <span className="text-[12px] font-medium text-[#1a1a1a]">
                        {AGENT_NAMES[notification.agentId] || notification.agentId}
                      </span>
                      <span className="text-[11px] text-[#9ca3af] ml-auto">
                        {timeAgo(notification.timestamp)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6b7280]">{notification.triggerReason}</div>
                  </div>
                ))}

                {/* Recent runs */}
                {recentRuns.map(run => (
                  <div
                    key={run.id}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[12px] font-medium text-[#1a1a1a]">
                        {AGENT_NAMES[run.agentId] || run.agentId}
                      </span>
                      {run.status === 'completed' ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" />
                          Done
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-0.5">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#9ca3af]">
                      <span>{timeAgo(run.timestamp)}</span>
                      <span className="text-[#d1d5db]">|</span>
                      <span>
                        {run.durationMs < 1000
                          ? `${run.durationMs}ms`
                          : `${(run.durationMs / 1000).toFixed(1)}s`}
                      </span>
                    </div>
                  </div>
                ))}

                {/* View all link */}
                <button
                  onClick={() => onNavigate('agents')}
                  className="text-[12px] text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1 pt-1"
                >
                  View All Agents
                  <ChevronRight className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
