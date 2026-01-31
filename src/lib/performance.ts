/**
 * Performance tracking utilities
 * Calculate engagement rates, aggregate performance data, and identify top performers
 */

import type { ContentItem, PerformanceMetrics, Pillar, Platform, PerformanceInsights } from '../types';

/**
 * Calculate engagement rate from metrics
 * Formula: (likes + comments + shares) / views * 100
 */
export function calculateEngagementRate(metrics: Omit<PerformanceMetrics, 'engagementRate' | 'recordedAt'>): number {
  if (metrics.views === 0) return 0;
  const engagement = metrics.likes + metrics.comments + metrics.shares + (metrics.saves || 0);
  return Math.round((engagement / metrics.views) * 10000) / 100; // 2 decimal places
}

/**
 * Create a complete PerformanceMetrics object
 */
export function createPerformanceMetrics(
  views: number,
  likes: number,
  comments: number,
  shares: number,
  saves?: number
): PerformanceMetrics {
  return {
    views,
    likes,
    comments,
    shares,
    saves,
    engagementRate: calculateEngagementRate({ views, likes, comments, shares, saves }),
    recordedAt: new Date().toISOString(),
  };
}

/**
 * Get engagement level label based on rate
 */
export function getEngagementLevel(rate: number): 'viral' | 'high' | 'good' | 'average' | 'low' {
  if (rate >= 10) return 'viral';
  if (rate >= 5) return 'high';
  if (rate >= 2) return 'good';
  if (rate >= 1) return 'average';
  return 'low';
}

/**
 * Get color class for engagement level
 */
export function getEngagementColor(rate: number): string {
  const level = getEngagementLevel(rate);
  switch (level) {
    case 'viral': return 'text-purple-500';
    case 'high': return 'text-green-500';
    case 'good': return 'text-blue-500';
    case 'average': return 'text-yellow-500';
    case 'low': return 'text-gray-400';
  }
}

/**
 * Format view count for display (e.g., 1.2K, 3.5M)
 */
export function formatViewCount(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
}

/**
 * Get items with performance data
 */
export function getItemsWithPerformance(items: ContentItem[]): ContentItem[] {
  return items.filter(item => item.performance && item.performance.views > 0);
}

/**
 * Aggregate performance by pillar
 */
export function aggregateByPillar(items: ContentItem[]): Record<Pillar, { count: number; avgEngagement: number; totalViews: number }> {
  const pillars: Pillar[] = ['teach', 'demo', 'psych', 'proof', 'founder', 'trending'];
  const result: Record<Pillar, { count: number; avgEngagement: number; totalViews: number }> = {} as any;

  for (const pillar of pillars) {
    const pillarItems = getItemsWithPerformance(items).filter(item => item.pillar === pillar);
    const totalEngagement = pillarItems.reduce((sum, item) => sum + (item.performance?.engagementRate || 0), 0);
    const totalViews = pillarItems.reduce((sum, item) => sum + (item.performance?.views || 0), 0);

    result[pillar] = {
      count: pillarItems.length,
      avgEngagement: pillarItems.length > 0 ? Math.round((totalEngagement / pillarItems.length) * 100) / 100 : 0,
      totalViews,
    };
  }

  return result;
}

/**
 * Aggregate performance by subject
 */
export function aggregateBySubject(items: ContentItem[]): Record<string, { count: number; avgEngagement: number; totalViews: number }> {
  const result: Record<string, { count: number; avgEngagement: number; totalViews: number }> = {};
  const itemsWithPerf = getItemsWithPerformance(items);

  for (const item of itemsWithPerf) {
    if (!result[item.subject]) {
      result[item.subject] = { count: 0, avgEngagement: 0, totalViews: 0 };
    }
    result[item.subject].count++;
    result[item.subject].totalViews += item.performance?.views || 0;
  }

  // Calculate averages
  for (const subject of Object.keys(result)) {
    const subjectItems = itemsWithPerf.filter(item => item.subject === subject);
    const totalEngagement = subjectItems.reduce((sum, item) => sum + (item.performance?.engagementRate || 0), 0);
    result[subject].avgEngagement = subjectItems.length > 0
      ? Math.round((totalEngagement / subjectItems.length) * 100) / 100
      : 0;
  }

  return result;
}

/**
 * Aggregate performance by platform
 */
export function aggregateByPlatform(items: ContentItem[]): Record<Platform, { count: number; avgEngagement: number; totalViews: number }> {
  const platforms: Platform[] = ['tiktok', 'shorts', 'reels', 'facebook', 'linkedin', 'snapchat', 'ytlong'];
  const result: Record<Platform, { count: number; avgEngagement: number; totalViews: number }> = {} as any;

  for (const platform of platforms) {
    const platformItems = getItemsWithPerformance(items).filter(item => item.platform === platform);
    const totalEngagement = platformItems.reduce((sum, item) => sum + (item.performance?.engagementRate || 0), 0);
    const totalViews = platformItems.reduce((sum, item) => sum + (item.performance?.views || 0), 0);

    result[platform] = {
      count: platformItems.length,
      avgEngagement: platformItems.length > 0 ? Math.round((totalEngagement / platformItems.length) * 100) / 100 : 0,
      totalViews,
    };
  }

  return result;
}

/**
 * Aggregate performance by posting time
 */
export function aggregateByTime(items: ContentItem[]): Record<string, { count: number; avgEngagement: number }> {
  const result: Record<string, { count: number; avgEngagement: number }> = {};
  const itemsWithPerf = getItemsWithPerformance(items);

  for (const item of itemsWithPerf) {
    if (!result[item.time]) {
      result[item.time] = { count: 0, avgEngagement: 0 };
    }
    result[item.time].count++;
  }

  // Calculate averages
  for (const time of Object.keys(result)) {
    const timeItems = itemsWithPerf.filter(item => item.time === time);
    const totalEngagement = timeItems.reduce((sum, item) => sum + (item.performance?.engagementRate || 0), 0);
    result[time].avgEngagement = timeItems.length > 0
      ? Math.round((totalEngagement / timeItems.length) * 100) / 100
      : 0;
  }

  return result;
}

/**
 * Identify top performing content items
 */
export function identifyTopPerformers(items: ContentItem[], limit: number = 5): ContentItem[] {
  return getItemsWithPerformance(items)
    .sort((a, b) => (b.performance?.engagementRate || 0) - (a.performance?.engagementRate || 0))
    .slice(0, limit);
}

/**
 * Identify worst performing content items
 */
export function identifyWorstPerformers(items: ContentItem[], limit: number = 5): ContentItem[] {
  return getItemsWithPerformance(items)
    .sort((a, b) => (a.performance?.engagementRate || 0) - (b.performance?.engagementRate || 0))
    .slice(0, limit);
}

/**
 * Calculate overall average engagement rate
 */
export function calculateOverallEngagement(items: ContentItem[]): number {
  const itemsWithPerf = getItemsWithPerformance(items);
  if (itemsWithPerf.length === 0) return 0;

  const totalEngagement = itemsWithPerf.reduce((sum, item) => sum + (item.performance?.engagementRate || 0), 0);
  return Math.round((totalEngagement / itemsWithPerf.length) * 100) / 100;
}

/**
 * Calculate total views across all content
 */
export function calculateTotalViews(items: ContentItem[]): number {
  return getItemsWithPerformance(items).reduce((sum, item) => sum + (item.performance?.views || 0), 0);
}

/**
 * Generate basic performance insights (without AI)
 */
export function generateBasicInsights(items: ContentItem[]): PerformanceInsights {
  const byPillar = aggregateByPillar(items);
  const bySubject = aggregateBySubject(items);
  const byTime = aggregateByTime(items);

  // Sort pillars by engagement
  const topPillars = (Object.entries(byPillar) as [Pillar, { avgEngagement: number }][])
    .filter(([_, data]) => data.avgEngagement > 0)
    .sort((a, b) => b[1].avgEngagement - a[1].avgEngagement)
    .slice(0, 3)
    .map(([pillar, data]) => ({ pillar, avgEngagement: data.avgEngagement }));

  // Sort subjects by engagement
  const topSubjects = Object.entries(bySubject)
    .filter(([_, data]) => data.avgEngagement > 0)
    .sort((a, b) => b[1].avgEngagement - a[1].avgEngagement)
    .slice(0, 3)
    .map(([subject, data]) => ({ subject, avgEngagement: data.avgEngagement }));

  // Sort times by engagement
  const bestTimes = Object.entries(byTime)
    .filter(([_, data]) => data.avgEngagement > 0)
    .sort((a, b) => b[1].avgEngagement - a[1].avgEngagement)
    .slice(0, 3)
    .map(([time, data]) => ({ time, avgEngagement: data.avgEngagement }));

  // Generate recommendations
  const recommendations: string[] = [];

  if (topPillars.length > 0) {
    recommendations.push(`Your "${topPillars[0].pillar}" content gets ${topPillars[0].avgEngagement.toFixed(1)}% engagement - make more of it!`);
  }

  if (topSubjects.length > 0) {
    recommendations.push(`${topSubjects[0].subject} content performs best - consider focusing here.`);
  }

  if (bestTimes.length > 0) {
    recommendations.push(`Posts at ${bestTimes[0].time} get the most engagement.`);
  }

  const itemsWithPerf = getItemsWithPerformance(items);
  if (itemsWithPerf.length < 10) {
    recommendations.push('Track more posts to get better insights!');
  }

  return {
    topPerformingPillars: topPillars,
    topPerformingSubjects: topSubjects,
    bestPostingTimes: bestTimes,
    recommendations,
  };
}
