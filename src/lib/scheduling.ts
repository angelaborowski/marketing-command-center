/**
 * Smart Scheduling utilities
 * Analyze content schedules and suggest optimal posting times based on research
 */

import type { Platform, ContentItem, SchedulingSuggestion, SchedulingAnalysis } from '../types';
import { DAYS } from '../types';

// Platform optimal posting times (research-based)
export const PLATFORM_OPTIMAL_TIMES: Record<Platform, { bestTimes: string[]; bestDays: string[] }> = {
  tiktok: { bestTimes: ['7:00 AM', '12:00 PM', '7:00 PM', '10:00 PM'], bestDays: ['Tuesday', 'Thursday', 'Saturday'] },
  shorts: { bestTimes: ['10:00 AM', '2:00 PM', '6:00 PM'], bestDays: ['Wednesday', 'Friday', 'Saturday'] },
  reels: { bestTimes: ['11:00 AM', '3:00 PM', '8:00 PM'], bestDays: ['Monday', 'Wednesday', 'Friday'] },
  facebook: { bestTimes: ['9:00 AM', '1:00 PM', '5:00 PM'], bestDays: ['Tuesday', 'Thursday'] },
  linkedin: { bestTimes: ['8:00 AM', '12:00 PM'], bestDays: ['Tuesday', 'Wednesday', 'Thursday'] },
  snapchat: { bestTimes: ['4:00 PM', '9:00 PM'], bestDays: ['Friday', 'Saturday'] },
  ytlong: { bestTimes: ['2:00 PM', '4:00 PM'], bestDays: ['Thursday', 'Saturday', 'Sunday'] },
};

/**
 * Parse time string to minutes since midnight for comparison
 */
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Calculate time difference in hours between two time strings
 */
function getTimeDifferenceHours(time1: string, time2: string): number {
  const minutes1 = parseTimeToMinutes(time1);
  const minutes2 = parseTimeToMinutes(time2);
  return Math.abs(minutes1 - minutes2) / 60;
}

/**
 * Find the closest optimal time for a given platform
 */
function findClosestOptimalTime(platform: Platform, currentTime: string): string {
  const optimalTimes = PLATFORM_OPTIMAL_TIMES[platform].bestTimes;
  let closestTime = optimalTimes[0];
  let minDiff = getTimeDifferenceHours(currentTime, closestTime);

  for (const time of optimalTimes) {
    const diff = getTimeDifferenceHours(currentTime, time);
    if (diff < minDiff) {
      minDiff = diff;
      closestTime = time;
    }
  }

  return closestTime;
}

/**
 * Check if a time is optimal for a platform
 */
function isOptimalTime(platform: Platform, time: string): boolean {
  const optimalTimes = PLATFORM_OPTIMAL_TIMES[platform].bestTimes;
  return optimalTimes.some(optTime => getTimeDifferenceHours(time, optTime) < 1);
}

/**
 * Check if a day is optimal for a platform
 */
function isOptimalDay(platform: Platform, day: string): boolean {
  return PLATFORM_OPTIMAL_TIMES[platform].bestDays.includes(day);
}

/**
 * Calculate confidence score based on how much better the suggestion is
 */
function calculateConfidence(platform: Platform, currentTime: string, currentDay: string, suggestedTime: string, suggestedDay?: string): number {
  let confidence = 50; // Base confidence

  const currentTimeDiff = Math.min(
    ...PLATFORM_OPTIMAL_TIMES[platform].bestTimes.map(t => getTimeDifferenceHours(currentTime, t))
  );
  const suggestedTimeDiff = Math.min(
    ...PLATFORM_OPTIMAL_TIMES[platform].bestTimes.map(t => getTimeDifferenceHours(suggestedTime, t))
  );

  // Add confidence based on time improvement
  const timeImprovement = currentTimeDiff - suggestedTimeDiff;
  confidence += Math.min(timeImprovement * 10, 30);

  // Add confidence for day optimization
  if (suggestedDay && isOptimalDay(platform, suggestedDay) && !isOptimalDay(platform, currentDay)) {
    confidence += 15;
  }

  // Bonus for hitting exact optimal times
  if (isOptimalTime(platform, suggestedTime)) {
    confidence += 5;
  }

  return Math.min(Math.round(confidence), 95);
}

/**
 * Get optimal time for a given platform and day combination
 */
export function getOptimalTimeForPlatform(platform: Platform, day: string): string {
  const optimalData = PLATFORM_OPTIMAL_TIMES[platform];

  // If the day is optimal, return the best time for that platform
  if (optimalData.bestDays.includes(day)) {
    return optimalData.bestTimes[0];
  }

  // Otherwise return the most versatile time (midday tends to work across days)
  return optimalData.bestTimes[Math.floor(optimalData.bestTimes.length / 2)];
}

/**
 * Generate scheduling suggestions for content items
 */
export function generateSuggestions(items: ContentItem[]): SchedulingSuggestion[] {
  const suggestions: SchedulingSuggestion[] = [];

  for (const item of items) {
    // Skip posted items
    if (item.posted) continue;

    const platform = item.platform;
    const currentTime = item.time;
    const currentDay = item.day;

    // Check if current time is already optimal
    if (isOptimalTime(platform, currentTime) && isOptimalDay(platform, currentDay)) {
      continue;
    }

    // Find better time
    const suggestedTime = findClosestOptimalTime(platform, currentTime);

    // Find better day if current isn't optimal
    let suggestedDay: string | undefined;
    if (!isOptimalDay(platform, currentDay)) {
      suggestedDay = PLATFORM_OPTIMAL_TIMES[platform].bestDays[0];
    }

    // Only suggest if there's a meaningful improvement
    const timeDiff = getTimeDifferenceHours(currentTime, suggestedTime);
    if (timeDiff < 0.5 && !suggestedDay) {
      continue;
    }

    const confidence = calculateConfidence(platform, currentTime, currentDay, suggestedTime, suggestedDay);

    // Generate reasoning
    let reasoning = '';
    if (timeDiff >= 1) {
      reasoning = `${platform} content performs best at ${suggestedTime}`;
    }
    if (suggestedDay) {
      reasoning += reasoning ? `. ${suggestedDay}` : `${suggestedDay}`;
      reasoning += ` is a high-engagement day for ${platform}`;
    }
    if (!reasoning) {
      reasoning = `Slight time optimization for better reach`;
    }

    suggestions.push({
      itemId: item.id,
      platform,
      currentTime,
      currentDay,
      suggestedTime,
      suggestedDay,
      confidence,
      reasoning,
    });
  }

  // Sort by confidence (highest first)
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calculate distribution of items across time slots
 */
function calculateTimeDistribution(items: ContentItem[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const item of items) {
    distribution[item.time] = (distribution[item.time] || 0) + 1;
  }

  return distribution;
}

/**
 * Calculate optimal distribution based on platform mix
 */
function calculateOptimalDistribution(items: ContentItem[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const item of items) {
    const optimalTimes = PLATFORM_OPTIMAL_TIMES[item.platform].bestTimes;
    for (const time of optimalTimes) {
      distribution[time] = (distribution[time] || 0) + (1 / optimalTimes.length);
    }
  }

  // Normalize
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
  for (const time of Object.keys(distribution)) {
    distribution[time] = Math.round((distribution[time] / total) * items.length);
  }

  return distribution;
}

/**
 * Calculate overall schedule score (0-100)
 */
function calculateScheduleScore(items: ContentItem[]): number {
  if (items.length === 0) return 100;

  let optimalCount = 0;

  for (const item of items) {
    if (item.posted) continue;

    const isTimeOptimal = isOptimalTime(item.platform, item.time);
    const isDayOptimal = isOptimalDay(item.platform, item.day);

    if (isTimeOptimal && isDayOptimal) {
      optimalCount += 1;
    } else if (isTimeOptimal || isDayOptimal) {
      optimalCount += 0.5;
    }
  }

  const unpostedItems = items.filter(i => !i.posted);
  if (unpostedItems.length === 0) return 100;

  return Math.round((optimalCount / unpostedItems.length) * 100);
}

/**
 * Analyze the current schedule and provide comprehensive analysis
 */
export function analyzeSchedule(items: ContentItem[]): SchedulingAnalysis {
  const suggestions = generateSuggestions(items);
  const currentDistribution = calculateTimeDistribution(items);
  const optimalDistribution = calculateOptimalDistribution(items);
  const overallScore = calculateScheduleScore(items);

  return {
    suggestions,
    currentDistribution,
    optimalDistribution,
    overallScore,
  };
}
