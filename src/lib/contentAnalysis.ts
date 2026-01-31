/**
 * Content Gap Analysis utilities
 * Analyze content coverage and identify gaps in subject, pillar, platform, and level distribution
 */

import type { ContentItem, ContentGap, ContentGapAnalysis, Settings, Pillar, Platform, ExamLevel } from '../types';
import { PILLARS, PLATFORMS } from '../types';

/**
 * Calculate content coverage across all dimensions
 */
export function calculateCoverage(items: ContentItem[]): {
  subjects: Record<string, number>;
  pillars: Record<string, number>;
  platforms: Record<string, number>;
  levels: Record<string, number>;
} {
  const subjects: Record<string, number> = {};
  const pillars: Record<string, number> = {};
  const platforms: Record<string, number> = {};
  const levels: Record<string, number> = {};

  for (const item of items) {
    // Count subjects
    subjects[item.subject] = (subjects[item.subject] || 0) + 1;

    // Count pillars
    pillars[item.pillar] = (pillars[item.pillar] || 0) + 1;

    // Count platforms
    platforms[item.platform] = (platforms[item.platform] || 0) + 1;

    // Count levels
    levels[item.level] = (levels[item.level] || 0) + 1;
  }

  return { subjects, pillars, platforms, levels };
}

/**
 * Calculate priority based on gap severity
 */
function calculatePriority(current: number, recommended: number): 'high' | 'medium' | 'low' {
  if (recommended === 0) return 'low';
  const ratio = current / recommended;
  if (ratio < 0.25) return 'high';
  if (ratio < 0.5) return 'medium';
  return 'low';
}

/**
 * Generate a helpful suggestion for filling the gap
 */
function generateSuggestion(type: ContentGap['type'], value: string, current: number, recommended: number): string {
  const deficit = recommended - current;

  switch (type) {
    case 'subject':
      return `Create ${deficit} more ${value} content pieces to balance your subject coverage.`;
    case 'pillar':
      const pillarInfo = PILLARS.find(p => p.id === value);
      return `Add ${deficit} more "${pillarInfo?.name || value}" (${pillarInfo?.desc || ''}) content to diversify your content mix.`;
    case 'platform':
      const platformInfo = PLATFORMS[value as Platform];
      return `Post ${deficit} more pieces on ${platformInfo?.name || value} to improve platform distribution.`;
    case 'level':
      return `Create ${deficit} more ${value} level content to serve all your target audiences.`;
    default:
      return `Add ${deficit} more pieces in this category.`;
  }
}

/**
 * Identify gaps in content coverage based on settings
 */
export function identifyGaps(items: ContentItem[], settings: Settings): ContentGap[] {
  const coverage = calculateCoverage(items);
  const gaps: ContentGap[] = [];
  const totalItems = items.length;

  // Calculate ideal distribution
  // Each subject should have roughly equal representation
  const subjectsCount = settings.subjects.length || 1;
  const recommendedPerSubject = Math.max(1, Math.ceil(totalItems / subjectsCount));

  // Each platform should have roughly equal representation
  const platformsCount = settings.platforms.length || 1;
  const recommendedPerPlatform = Math.max(1, Math.ceil(totalItems / platformsCount));

  // Each level should have roughly equal representation
  const levelsCount = settings.levels.length || 1;
  const recommendedPerLevel = Math.max(1, Math.ceil(totalItems / levelsCount));

  // Pillars should be distributed with teach/demo having more weight
  const pillarsCount = PILLARS.length;
  const recommendedPerPillar = Math.max(1, Math.ceil(totalItems / pillarsCount));

  // Check subject gaps
  for (const subject of settings.subjects) {
    const current = coverage.subjects[subject] || 0;
    if (current < recommendedPerSubject * 0.75) { // 75% threshold
      gaps.push({
        type: 'subject',
        value: subject,
        currentCount: current,
        recommendedCount: recommendedPerSubject,
        priority: calculatePriority(current, recommendedPerSubject),
        suggestion: generateSuggestion('subject', subject, current, recommendedPerSubject),
      });
    }
  }

  // Check pillar gaps
  for (const pillar of PILLARS) {
    const current = coverage.pillars[pillar.id] || 0;
    if (current < recommendedPerPillar * 0.5) { // 50% threshold for pillars (more flexible)
      gaps.push({
        type: 'pillar',
        value: pillar.id,
        currentCount: current,
        recommendedCount: recommendedPerPillar,
        priority: calculatePriority(current, recommendedPerPillar),
        suggestion: generateSuggestion('pillar', pillar.id, current, recommendedPerPillar),
      });
    }
  }

  // Check platform gaps
  for (const platform of settings.platforms) {
    const current = coverage.platforms[platform] || 0;
    if (current < recommendedPerPlatform * 0.5) { // 50% threshold
      gaps.push({
        type: 'platform',
        value: platform,
        currentCount: current,
        recommendedCount: recommendedPerPlatform,
        priority: calculatePriority(current, recommendedPerPlatform),
        suggestion: generateSuggestion('platform', platform, current, recommendedPerPlatform),
      });
    }
  }

  // Check level gaps
  for (const level of settings.levels) {
    const current = coverage.levels[level] || 0;
    if (current < recommendedPerLevel * 0.5) { // 50% threshold
      gaps.push({
        type: 'level',
        value: level,
        currentCount: current,
        recommendedCount: recommendedPerLevel,
        priority: calculatePriority(current, recommendedPerLevel),
        suggestion: generateSuggestion('level', level, current, recommendedPerLevel),
      });
    }
  }

  // Sort by priority (high first)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return gaps;
}

/**
 * Calculate balance score (0-100)
 * Higher score = more balanced content mix
 */
export function getBalanceScore(items: ContentItem[]): number {
  if (items.length === 0) return 100; // Empty is perfectly balanced

  const coverage = calculateCoverage(items);

  // Calculate variance for each dimension
  const calculateVariance = (counts: Record<string, number>): number => {
    const values = Object.values(counts);
    if (values.length <= 1) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;

    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

    // Normalize variance by mean squared (coefficient of variation squared)
    return variance / (mean * mean);
  };

  // Calculate variance for each dimension
  const subjectVariance = calculateVariance(coverage.subjects);
  const pillarVariance = calculateVariance(coverage.pillars);
  const platformVariance = calculateVariance(coverage.platforms);
  const levelVariance = calculateVariance(coverage.levels);

  // Average variance (weighted)
  const avgVariance = (subjectVariance * 0.3 + pillarVariance * 0.25 + platformVariance * 0.25 + levelVariance * 0.2);

  // Convert to 0-100 score (lower variance = higher score)
  // Using exponential decay: score = 100 * e^(-k * variance)
  const score = 100 * Math.exp(-2 * avgVariance);

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(gaps: ContentGap[], coverage: ContentGapAnalysis['coverage']): string[] {
  const recommendations: string[] = [];

  // High priority gaps
  const highPriorityGaps = gaps.filter(g => g.priority === 'high');
  if (highPriorityGaps.length > 0) {
    recommendations.push(`Focus on filling ${highPriorityGaps.length} high-priority gap${highPriorityGaps.length > 1 ? 's' : ''} first.`);
  }

  // Subject recommendations
  const subjects = Object.entries(coverage.subjects);
  if (subjects.length > 0) {
    const [topSubject] = subjects.sort((a, b) => b[1] - a[1]);
    const [bottomSubject] = subjects.sort((a, b) => a[1] - b[1]);
    if (topSubject[1] > bottomSubject[1] * 2) {
      recommendations.push(`You have ${topSubject[1]}x more ${topSubject[0]} content than ${bottomSubject[0]}. Consider balancing.`);
    }
  }

  // Pillar recommendations
  const pillars = Object.entries(coverage.pillars);
  const hasTrending = pillars.some(([p]) => p === 'trending');
  const hasProof = pillars.some(([p]) => p === 'proof');
  if (!hasTrending || coverage.pillars['trending'] === 0) {
    recommendations.push('Add some trending/viral format content to stay relevant.');
  }
  if (!hasProof || coverage.pillars['proof'] === 0) {
    recommendations.push('Include social proof content to build credibility.');
  }

  // General
  if (gaps.length === 0) {
    recommendations.push('Great job! Your content is well-balanced across all dimensions.');
  }

  return recommendations.slice(0, 5); // Max 5 recommendations
}

/**
 * Full content gap analysis combining all metrics
 */
export function analyzeContentGaps(items: ContentItem[], settings: Settings): ContentGapAnalysis {
  const coverage = calculateCoverage(items);
  const gaps = identifyGaps(items, settings);
  const balanceScore = getBalanceScore(items);
  const recommendations = generateRecommendations(gaps, coverage);

  return {
    gaps,
    coverage,
    balanceScore,
    recommendations,
  };
}
