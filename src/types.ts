// Platform types for content distribution
export type Platform = 'tiktok' | 'shorts' | 'reels' | 'facebook' | 'linkedin' | 'snapchat' | 'ytlong';

// Content pillars for marketing strategy
export type Pillar = 'teach' | 'demo' | 'psych' | 'proof' | 'founder' | 'trending';

// Exam levels for education content
export type ExamLevel = 'GCSE' | 'A-Level' | 'IB';

// Performance metrics for tracking content engagement
export interface PerformanceMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  engagementRate: number; // (likes + comments + shares) / views * 100
  recordedAt: string;
}

// Content item representing a single piece of scheduled content
export interface ContentItem {
  id: string;
  day: string;
  time: string;
  platform: Platform;
  hook: string;
  caption: string;
  hashtags: string[];
  topic: string;
  subject: string;
  level: ExamLevel;
  pillar: Pillar;
  filmed: boolean;
  posted: boolean;
  // Performance tracking
  performance?: PerformanceMetrics;
  postedAt?: string;
  // Calendar sync
  filmingEventId?: string;
  postingEventId?: string;
}

// Content gap analysis
export interface ContentGap {
  type: 'subject' | 'pillar' | 'platform' | 'level';
  value: string;
  currentCount: number;
  recommendedCount: number;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface ContentGapAnalysis {
  gaps: ContentGap[];
  coverage: {
    subjects: Record<string, number>;
    pillars: Record<string, number>;
    platforms: Record<string, number>;
    levels: Record<string, number>;
  };
  balanceScore: number; // 0-100
  recommendations: string[];
}

// Smart scheduling
export interface SchedulingSuggestion {
  itemId: string;
  platform: Platform;
  currentTime: string;
  currentDay: string;
  suggestedTime: string;
  suggestedDay?: string;
  confidence: number; // 0-100
  reasoning: string;
}

export interface SchedulingAnalysis {
  suggestions: SchedulingSuggestion[];
  currentDistribution: Record<string, number>;
  optimalDistribution: Record<string, number>;
  overallScore: number; // 0-100
}

// Calendar sync settings
export interface CalendarSyncSettings {
  enabled: boolean;
  autoSync: boolean;
  createFilmingEvents: boolean;
  createPostingEvents: boolean;
  reminderMinutesBefore: number;
  filmingEventDuration: number; // minutes
  postingEventDuration: number; // minutes
}

// Performance insights from AI
export interface PerformanceInsights {
  topPerformingPillars: Array<{ pillar: Pillar; avgEngagement: number }>;
  topPerformingSubjects: Array<{ subject: string; avgEngagement: number }>;
  bestPostingTimes: Array<{ time: string; avgEngagement: number }>;
  recommendations: string[];
}

// Creator channel for tracking followed creators
export interface Creator {
  id: string;
  name: string;
  channelId: string;
}

// Application settings
export interface Settings {
  claudeApiKey: string;
  youtubeApiKey: string;
  creators: Creator[];
  platforms: Platform[];
  levels: ExamLevel[];
  subjects: string[];
  batchDay: string;
  // Calendar sync
  calendarSync?: CalendarSyncSettings;
}

// Default calendar sync settings
export const DEFAULT_CALENDAR_SETTINGS: CalendarSyncSettings = {
  enabled: false,
  autoSync: false,
  createFilmingEvents: true,
  createPostingEvents: true,
  reminderMinutesBefore: 30,
  filmingEventDuration: 120,
  postingEventDuration: 15,
};

// Platform metadata for display
export interface PlatformInfo {
  name: string;
  color: string;
  icon: string;
}

// Pillar metadata for display
export interface PillarInfo {
  id: Pillar;
  name: string;
  desc: string;
}

// Constants for platform configuration
export const PLATFORMS: Record<Platform, PlatformInfo> = {
  tiktok: { name: 'TikTok', color: 'text-pink-500', icon: 'music' },
  shorts: { name: 'Shorts', color: 'text-red-500', icon: 'play' },
  reels: { name: 'Reels', color: 'text-purple-500', icon: 'film' },
  facebook: { name: 'Facebook', color: 'text-blue-600', icon: 'facebook' },
  linkedin: { name: 'LinkedIn', color: 'text-blue-700', icon: 'linkedin' },
  snapchat: { name: 'Snapchat', color: 'text-yellow-400', icon: 'ghost' },
  ytlong: { name: 'YouTube', color: 'text-red-600', icon: 'youtube' },
};

// Constants for pillar configuration
export const PILLARS: PillarInfo[] = [
  { id: 'teach', name: 'Teach', desc: 'Educational content' },
  { id: 'demo', name: 'Demo', desc: 'Product demos' },
  { id: 'psych', name: 'Psych', desc: 'Motivation/fear' },
  { id: 'proof', name: 'Proof', desc: 'Social proof' },
  { id: 'founder', name: 'Founder', desc: 'Behind scenes' },
  { id: 'trending', name: 'Trend', desc: 'Viral formats' },
];

// Days of the week
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

// Available subjects
export const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'Maths', 'English', 'History', 'Geography'] as const;

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  claudeApiKey: '',
  youtubeApiKey: '',
  creators: [],
  platforms: ['tiktok', 'shorts', 'reels', 'facebook'],
  levels: ['GCSE', 'A-Level'],
  subjects: ['Biology', 'Chemistry', 'Physics', 'Maths'],
  batchDay: 'Friday',
};

// Storage keys for localStorage
export const STORAGE_KEYS = {
  settings: 'mcc_settings',
  contentItems: 'mcc_content_items',
  streak: 'mcc_streak',
  lastPostDate: 'mcc_last_post_date',
  performanceHistory: 'mcc_performance_history',
  calendarToken: 'mcc_calendar_token',
} as const;
