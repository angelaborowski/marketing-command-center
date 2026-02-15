/**
 * goalCalculations.ts
 *
 * Pure functions for goal tracking, growth metrics, posting scores,
 * and coach messages. No React dependencies.
 */

import type {
  Goals,
  WeeklySnapshot,
  GrowthMetrics,
  ContentItem,
  AccountabilityState,
} from '../types';

// ============================================================================
// Date Helpers
// ============================================================================

/**
 * Returns the Monday (start of week) for the given date.
 * If the date is already Monday, returns that date at 00:00:00.
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the number of full weeks from now until the target date string.
 * Returns 0 if the target date is in the past or invalid.
 */
export function weeksUntil(targetDate: string): number {
  if (!targetDate) return 0;
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) return 0;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

// ============================================================================
// Growth Metrics
// ============================================================================

/**
 * For each platformGoal, calculates growth metrics based on snapshot history.
 *
 * - percentToGoal: how far along from current to target (0..100+)
 * - weeklyGrowthRate: average weekly follower gain over last 4 snapshots
 * - weeksToTarget: estimated weeks to reach target at current rate (null if no growth)
 * - onTrack: whether current rate will hit target by targetDate
 * - trend: up/flat/down based on last 4 data points
 */
export function computeGrowthMetrics(
  goals: Goals,
  snapshots: WeeklySnapshot[]
): GrowthMetrics[] {
  // Sort snapshots oldest first
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime()
  );

  return goals.platformGoals.map((pg) => {
    const platform = pg.platform;
    const current = pg.currentFollowers;
    const target = pg.targetFollowers;

    // Calculate percent to goal
    const totalGap = target - 0; // from zero to target
    const percentToGoal =
      target > 0 ? Math.min((current / target) * 100, 100) : 0;

    // Extract follower counts for this platform from last 4 snapshots
    const recentSnapshots = sorted.slice(-4);
    const followerValues = recentSnapshots
      .map((s) => s.followers[platform])
      .filter((v) => v !== undefined && v !== null) as number[];

    // Weekly growth rate: average week-over-week change
    let weeklyGrowthRate = 0;
    if (followerValues.length >= 2) {
      const changes: number[] = [];
      for (let i = 1; i < followerValues.length; i++) {
        changes.push(followerValues[i] - followerValues[i - 1]);
      }
      weeklyGrowthRate =
        changes.reduce((sum, c) => sum + c, 0) / changes.length;
    }

    // Weeks to target
    const remaining = target - current;
    let weeksToTarget: number | null = null;
    if (weeklyGrowthRate > 0 && remaining > 0) {
      weeksToTarget = Math.ceil(remaining / weeklyGrowthRate);
    } else if (remaining <= 0) {
      weeksToTarget = 0;
    }

    // On track: will hit target by targetDate at current rate?
    const weeksLeft = weeksUntil(pg.targetDate);
    let onTrack = false;
    if (remaining <= 0) {
      onTrack = true;
    } else if (weeklyGrowthRate > 0 && weeksLeft > 0 && weeksToTarget !== null) {
      onTrack = weeksToTarget <= weeksLeft;
    }

    // Trend from last 4 data points
    let trend: 'up' | 'flat' | 'down' = 'flat';
    if (followerValues.length >= 2) {
      const first = followerValues[0];
      const last = followerValues[followerValues.length - 1];
      const diff = last - first;
      const threshold = Math.max(first * 0.01, 1); // 1% or at least 1
      if (diff > threshold) {
        trend = 'up';
      } else if (diff < -threshold) {
        trend = 'down';
      }
    }

    return {
      platform,
      currentFollowers: current,
      targetFollowers: target,
      percentToGoal: Math.round(percentToGoal * 10) / 10,
      weeklyGrowthRate: Math.round(weeklyGrowthRate * 10) / 10,
      weeksToTarget,
      onTrack,
      trend,
    };
  });
}

// ============================================================================
// Posting Score
// ============================================================================

/**
 * Counts items posted this week (from weekStart to weekStart+7 days)
 * per platform against the posting targets.
 */
export function computePostingScore(
  contentItems: ContentItem[],
  postingTargets: Record<string, number>,
  weekStart: Date
): { platform: string; posted: number; target: number; met: boolean }[] {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Count posted items per platform this week
  const counts: Record<string, number> = {};
  for (const item of contentItems) {
    if (!item.posted || !item.postedAt) continue;
    const postedDate = new Date(item.postedAt);
    if (postedDate >= weekStart && postedDate < weekEnd) {
      const p = item.platform;
      counts[p] = (counts[p] || 0) + 1;
    }
  }

  // Build score for each platform that has a target
  return Object.entries(postingTargets).map(([platform, target]) => {
    const posted = counts[platform] || 0;
    return {
      platform,
      posted,
      target,
      met: posted >= target,
    };
  });
}

// ============================================================================
// Coach Message
// ============================================================================

/**
 * Generates a blunt, direct coach message based on growth metrics and posting score.
 * Not mean, but no-nonsense.
 */
export function generateCoachMessage(
  growthMetrics: GrowthMetrics[],
  postingScore: { platform: string; posted: number; target: number; met: boolean }[]
): { message: string; severity: 'success' | 'warning' | 'danger' } {
  const totalPlatforms = postingScore.length;
  const metCount = postingScore.filter((s) => s.met).length;
  const metRatio = totalPlatforms > 0 ? metCount / totalPlatforms : 0;

  const onTrackCount = growthMetrics.filter((m) => m.onTrack).length;
  const totalGoals = growthMetrics.length;
  const onTrackRatio = totalGoals > 0 ? onTrackCount / totalGoals : 0;

  const downTrends = growthMetrics.filter((m) => m.trend === 'down');
  const missedPlatforms = postingScore
    .filter((s) => !s.met)
    .map((s) => s.platform);

  // Danger: less than half targets met OR majority off track
  if (metRatio < 0.5 || onTrackRatio < 0.3) {
    const missed = missedPlatforms.slice(0, 3).join(', ');
    const message =
      missedPlatforms.length > 0
        ? `You hit ${metCount}/${totalPlatforms} posting targets this week. Missing: ${missed}. Goals don't hit themselves. Block time, sit down, and get the posts out.`
        : `Only ${onTrackCount}/${totalGoals} growth targets are on track. The numbers don't lie. Time to adjust your strategy or put in more reps.`;
    return { message, severity: 'danger' };
  }

  // Warning: some targets missed or some off track
  if (metRatio < 1 || onTrackRatio < 0.7) {
    const parts: string[] = [];
    if (metRatio < 1) {
      parts.push(
        `${metCount}/${totalPlatforms} posting targets met.`
      );
    }
    if (downTrends.length > 0) {
      parts.push(
        `${downTrends.map((d) => d.platform).join(', ')} trending down.`
      );
    }
    if (onTrackRatio < 0.7) {
      parts.push(
        `${onTrackCount}/${totalGoals} growth goals on pace.`
      );
    }
    parts.push('Close, but close doesn\'t count. Tighten up next week.');
    return { message: parts.join(' '), severity: 'warning' };
  }

  // Success: all targets met and on track
  return {
    message: `All ${totalPlatforms} posting targets hit. ${onTrackCount}/${totalGoals} growth goals on track. Solid week. Keep this pace and the numbers will take care of themselves.`,
    severity: 'success',
  };
}
