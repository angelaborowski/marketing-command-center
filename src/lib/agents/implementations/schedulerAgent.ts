/**
 * Scheduler Agent Implementation
 *
 * Pure algorithmic agent (no Claude calls) that assigns optimal posting
 * times, resolves scheduling conflicts, and distributes content evenly
 * across the week.
 */

import {
  PLATFORM_OPTIMAL_TIMES,
  getOptimalTimeForPlatform,
} from '../../scheduling';
import { DAYS } from '../../../types';
import type {
  AgentDefinition,
  AgentContext,
  AgentCallbacks,
  SchedulerInput,
  SchedulerOutput,
} from '../types';
import type { ContentItem, Platform } from '../../../types';

// ============================================================================
// Types
// ============================================================================

type DraftItem = Omit<ContentItem, 'id' | 'filmed' | 'posted'>;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Parse a time string like "7:00 AM" or "7am" into minutes since midnight.
 */
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):?(\d*)\s*(AM|PM|am|pm)?/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2] || '0', 10);
  const period = (match[3] || '').toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight back to a formatted time string.
 */
function minutesToTimeString(mins: number): string {
  const totalMinutes = ((mins % 1440) + 1440) % 1440; // wrap around
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';

  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;

  return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Create a unique key for day + time collision detection.
 */
function slotKey(day: string, time: string): string {
  return `${day}|${parseTimeToMinutes(time)}`;
}

// ============================================================================
// Agent Definition
// ============================================================================

export const schedulerAgent: AgentDefinition<SchedulerInput, SchedulerOutput> = {
  id: 'scheduler',
  name: 'Bernard',
  description:
    'Assigns optimal posting times, resolves conflicts, and distributes content evenly across the week.',
  icon: 'calendar',
  color: 'text-teal-500',

  canRun(_context: AgentContext) {
    // Pure algorithmic agent, no API keys needed
    return { ok: true };
  },

  async execute(
    input: SchedulerInput,
    _context: AgentContext,
    callbacks: AgentCallbacks
  ): Promise<SchedulerOutput> {
    let scheduledItems: DraftItem[] = input.contentItems.map((item) => ({ ...item }));

    // ------------------------------------------------------------------
    // Step 1: Assign optimal times per platform
    // ------------------------------------------------------------------
    callbacks.onStepStart('assign-times', 'Assigning optimal posting times');
    try {
      let assignedCount = 0;

      for (let i = 0; i < scheduledItems.length; i++) {
        const item = scheduledItems[i];
        const platform = item.platform as Platform;

        // Ensure the item has a valid day
        if (!DAYS.includes(item.day as typeof DAYS[number])) {
          // Assign a day based on index for even distribution
          item.day = DAYS[i % DAYS.length] as string;
        }

        // Get the optimal time for this platform + day combination
        const optimalTime = getOptimalTimeForPlatform(platform, item.day);
        item.time = optimalTime;
        assignedCount++;
      }

      callbacks.onStepComplete('assign-times', { assignedCount });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      callbacks.onStepError('assign-times', message);
    }

    if (callbacks.shouldCancel()) {
      return { scheduledItems, summary: 'Cancelled.' };
    }

    // ------------------------------------------------------------------
    // Step 2: Resolve conflicts (same day + same time)
    // ------------------------------------------------------------------
    callbacks.onStepStart('resolve-conflicts', 'Resolving scheduling conflicts');
    try {
      let conflictsResolved = 0;

      // Group items by day+time slot
      const slotMap = new Map<string, number[]>();
      for (let i = 0; i < scheduledItems.length; i++) {
        const key = slotKey(scheduledItems[i].day, scheduledItems[i].time);
        const existing = slotMap.get(key) || [];
        existing.push(i);
        slotMap.set(key, existing);
      }

      // For each slot with more than one item, spread them out
      for (const [, indices] of slotMap) {
        if (indices.length <= 1) continue;

        // Keep the first item at the optimal time; shift others by 1-hour increments
        for (let j = 1; j < indices.length; j++) {
          const idx = indices[j];
          const item = scheduledItems[idx];
          const platform = item.platform as Platform;

          // Try alternative optimal times for this platform
          const altTimes = PLATFORM_OPTIMAL_TIMES[platform]?.bestTimes ?? [];
          const currentMinutes = parseTimeToMinutes(item.time);

          // Find an alternative time that is not already taken on this day
          let foundAlt = false;
          for (const altTime of altTimes) {
            const altKey = slotKey(item.day, altTime);
            const altSlot = slotMap.get(altKey);
            if (!altSlot || altSlot.length === 0) {
              item.time = altTime;
              // Update slot map
              const altList = slotMap.get(altKey) || [];
              altList.push(idx);
              slotMap.set(altKey, altList);
              foundAlt = true;
              conflictsResolved++;
              break;
            }
          }

          // If no alternative optimal time is free, offset by 1 hour
          if (!foundAlt) {
            const newMinutes = currentMinutes + j * 60;
            item.time = minutesToTimeString(newMinutes);
            conflictsResolved++;
          }
        }
      }

      callbacks.onStepComplete('resolve-conflicts', { conflictsResolved });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      callbacks.onStepError('resolve-conflicts', message);
    }

    if (callbacks.shouldCancel()) {
      return { scheduledItems, summary: 'Cancelled.' };
    }

    // ------------------------------------------------------------------
    // Step 3: Distribute evenly across days of the week
    // ------------------------------------------------------------------
    callbacks.onStepStart('distribute', 'Distributing content across the week');
    try {
      let redistributed = 0;

      // Count items per day
      const dayCounts: Record<string, number> = {};
      for (const day of DAYS) {
        dayCounts[day] = 0;
      }
      for (const item of scheduledItems) {
        dayCounts[item.day] = (dayCounts[item.day] || 0) + 1;
      }

      // Target: even distribution across 7 days
      const targetPerDay = Math.ceil(scheduledItems.length / DAYS.length);
      const maxPerDay = targetPerDay + 1; // allow slight overflow

      // Find overloaded days and underloaded days
      const overloadedDays = Object.entries(dayCounts)
        .filter(([, count]) => count > maxPerDay)
        .sort((a, b) => b[1] - a[1]);

      if (overloadedDays.length > 0) {
        for (const [overDay] of overloadedDays) {
          // Get items on this day
          const dayItems = scheduledItems
            .map((item, idx) => ({ item, idx }))
            .filter(({ item }) => item.day === overDay);

          // Move excess items to underloaded days
          const excessCount = dayCounts[overDay] - targetPerDay;
          let moved = 0;

          for (let i = dayItems.length - 1; i >= 0 && moved < excessCount; i--) {
            // Find the day with the fewest items
            const underDay = DAYS.reduce((best, d) => {
              if (dayCounts[d] < dayCounts[best]) return d;
              return best;
            });

            if (dayCounts[underDay] >= targetPerDay) break; // All days are balanced

            const { item, idx } = dayItems[i];
            const platform = item.platform as Platform;

            // Move to underloaded day
            scheduledItems[idx] = {
              ...item,
              day: underDay,
              time: getOptimalTimeForPlatform(platform, underDay),
            };

            dayCounts[overDay]--;
            dayCounts[underDay]++;
            moved++;
            redistributed++;
          }
        }
      }

      callbacks.onStepComplete('distribute', {
        redistributed,
        finalDistribution: { ...dayCounts },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      callbacks.onStepError('distribute', message);
    }

    // ------------------------------------------------------------------
    // Build summary
    // ------------------------------------------------------------------
    const dayCounts: Record<string, number> = {};
    for (const item of scheduledItems) {
      dayCounts[item.day] = (dayCounts[item.day] || 0) + 1;
    }
    const distribution = DAYS
      .map((d) => `${d}: ${dayCounts[d] || 0}`)
      .join(', ');

    const summary = `Scheduled ${scheduledItems.length} items across the week. Distribution: ${distribution}.`;

    return {
      scheduledItems,
      summary,
    };
  },
};
