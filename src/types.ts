// Platform types for content distribution
export type Platform = 'tiktok' | 'shorts' | 'reels' | 'facebook' | 'linkedin' | 'snapchat' | 'ytlong' | 'reddit' | 'mumsnet';

// Content type discrimination
export type ContentType = 'video' | 'avatar' | 'text';

// Content pillars for marketing strategy
export type Pillar = 'teach' | 'demo' | 'psych' | 'proof' | 'founder' | 'trending';

// Exam levels for education content
export type ExamLevel = 'GCSE' | 'A-Level' | 'IB';

// Which content types each platform supports
export const PLATFORM_CONTENT_TYPES: Record<Platform, ContentType[]> = {
  tiktok: ['video', 'avatar'],
  shorts: ['video', 'avatar'],
  reels: ['video', 'avatar'],
  facebook: ['video', 'avatar', 'text'],
  linkedin: ['video', 'avatar', 'text'],
  snapchat: ['video'],
  ytlong: ['video', 'avatar'],
  reddit: ['text'],
  mumsnet: ['text'],
};

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
  contentType: ContentType;
  hook: string;
  caption: string;
  hashtags: string[];
  topic: string;
  subject: string;
  level: ExamLevel;
  pillar: Pillar;
  filmed: boolean;
  posted: boolean;
  // Video/avatar content
  script?: string;
  estimatedDuration?: string;
  shotOrder?: number;
  // Text content (Reddit, Mumsnet)
  body?: string;
  subreddit?: string;
  // A/B testing
  variantGroup?: string;
  variantLabel?: 'A' | 'B';
  // Performance tracking
  performance?: PerformanceMetrics;
  postedAt?: string;
  // Calendar sync
  filmingEventId?: string;
  postingEventId?: string;
}

// ============================================================================
// Goals & Accountability
// ============================================================================

export interface PlatformGoal {
  platform: Platform;
  currentFollowers: number;
  targetFollowers: number;
  targetDate: string;
}

export interface Goals {
  subscriberTarget: number;
  currentSubscribers: number;
  platformGoals: PlatformGoal[];
  postingTargets: Record<string, number>;
  updatedAt: string;
}

export interface WeeklySnapshot {
  id: string;
  weekOf: string;
  recordedAt: string;
  followers: Record<string, number>;
  subscribers: number;
  postsPublished: number;
  totalViews: number;
  avgEngagementRate: number;
}

export interface AccountabilityState {
  checkInCompletedThisWeek: boolean;
  lastCheckInDate: string | null;
  checkInStreak: number;
  pendingCheckIn: boolean;
}

export interface GrowthMetrics {
  platform: string;
  currentFollowers: number;
  targetFollowers: number;
  percentToGoal: number;
  weeklyGrowthRate: number;
  weeksToTarget: number | null;
  onTrack: boolean;
  trend: 'up' | 'flat' | 'down';
}

export const DEFAULT_GOALS: Goals = {
  subscriberTarget: 200,
  currentSubscribers: 0,
  platformGoals: [
    { platform: 'tiktok', currentFollowers: 2800, targetFollowers: 10000, targetDate: '' },
    { platform: 'reels', currentFollowers: 600, targetFollowers: 10000, targetDate: '' },
    { platform: 'facebook', currentFollowers: 600, targetFollowers: 5000, targetDate: '' },
    { platform: 'ytlong', currentFollowers: 3, targetFollowers: 1000, targetDate: '' },
    { platform: 'linkedin', currentFollowers: 0, targetFollowers: 1000, targetDate: '' },
    { platform: 'reddit', currentFollowers: 0, targetFollowers: 500, targetDate: '' },
  ],
  postingTargets: {
    tiktok: 21,
    shorts: 21,
    reels: 21,
    facebook: 21,
    ytlong: 7,
    linkedin: 7,
    reddit: 7,
    mumsnet: 7,
  },
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_ACCOUNTABILITY: AccountabilityState = {
  checkInCompletedThisWeek: false,
  lastCheckInDate: null,
  checkInStreak: 0,
  pendingCheckIn: false,
};

// ============================================================================
// Content gap analysis
// ============================================================================

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
  balanceScore: number;
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
  confidence: number;
  reasoning: string;
}

export interface SchedulingAnalysis {
  suggestions: SchedulingSuggestion[];
  currentDistribution: Record<string, number>;
  optimalDistribution: Record<string, number>;
  overallScore: number;
}

// Calendar sync settings
export interface CalendarSyncSettings {
  enabled: boolean;
  autoSync: boolean;
  createFilmingEvents: boolean;
  createPostingEvents: boolean;
  reminderMinutesBefore: number;
  filmingEventDuration: number;
  postingEventDuration: number;
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
  batchSize: number;
  // Calendar sync
  calendarSync?: CalendarSyncSettings;
  // LinkedIn
  linkedinClientId?: string;
  linkedinOrgId?: string;
  linkedinPostTarget?: 'personal' | 'company';
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
  shorts: { name: 'YouTube', color: 'text-red-500', icon: 'play' },
  reels: { name: 'Instagram', color: 'text-purple-500', icon: 'film' },
  facebook: { name: 'Facebook', color: 'text-blue-600', icon: 'facebook' },
  linkedin: { name: 'LinkedIn', color: 'text-blue-700', icon: 'linkedin' },
  snapchat: { name: 'Snapchat', color: 'text-yellow-400', icon: 'ghost' },
  ytlong: { name: 'YouTube Long', color: 'text-red-600', icon: 'youtube' },
  reddit: { name: 'Reddit', color: 'text-orange-600', icon: 'message-circle' },
  mumsnet: { name: 'Mumsnet', color: 'text-teal-600', icon: 'users' },
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

// Navigation sections
export type Section = 'home' | 'week' | 'shotlist' | 'textqueue' | 'post' | 'agents';

// Days of the week
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

// Default time slots
export const TIME_SLOTS = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'] as const;

// Available subjects
export const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'Maths', 'English', 'History', 'Geography'] as const;

// Pre-loaded top education YouTubers (UK GCSE/A-Level focused + popular study creators)
export const DEFAULT_CREATORS: Creator[] = [
  // --- UK GCSE / A-Level Revision Channels ---
  { id: 'cognito', name: 'Cognito', channelId: 'UCaGEe4KXZrjou9kQx6ezG2w' },
  { id: 'freesciencelessons', name: 'FreeScienceLessons', channelId: 'UCqbOeHaAUXw9Il7sBVG3_bw' },
  { id: 'science-shorts', name: 'Science Shorts', channelId: 'UCkNRdK0q5KZssogiS--R4pQ' },
  { id: 'primrose-kitten', name: 'Primrose Kitten Academy', channelId: 'UCBgvmal8AR4QIK2e0EfJwaA' },
  { id: 'physics-online', name: 'Physics Online', channelId: 'UCZzatyx-xC-Dl_VVUVHYDYw' },
  { id: 'maths-genie', name: 'Maths Genie', channelId: 'UCTr7jsVuqZdRJDe2Nnvnxvw' },
  { id: 'tlmaths', name: 'TLMaths', channelId: 'UCCgGyPD6MYQcHuMIc-Kv-Uw' },
  { id: 'gcse-maths-tutor', name: 'The GCSE Maths Tutor', channelId: 'UCStPzCGyt5tlwdpDXffobxA' },
  { id: 'examsolutions', name: 'ExamSolutions', channelId: 'UCtuvpPNTY1lKAoaVzBrzcLg' },
  { id: 'allery-chemistry', name: 'Allery Chemistry', channelId: 'UCPtWS4fCi25YHw5SPGdPz0g' },
  { id: 'organic-chem-tutor', name: 'The Organic Chemistry Tutor', channelId: 'UCEWpbFLzoYGPfuWUMFPSaoA' },
  // --- Study / Productivity Creators ---
  { id: 'ali-abdaal', name: 'Ali Abdaal', channelId: 'UCoOae5nYA7VqaXzerajD0lg' },
  { id: 'unjaded-jade', name: 'UnJaded Jade', channelId: 'UC4-uObu-mfafJyxxZFEwbvQ' },
  { id: 'jack-edwards', name: 'Jack Edwards', channelId: 'UCBj244LMgn9I1JfPNeLMyew' },
  { id: 'vee-kativhu', name: 'Vee Kativhu', channelId: 'UC0a0jgB33-HHcAm84UFfPgw' },
  { id: 'ruby-granger', name: 'Ruby Granger', channelId: 'UCG-KntY7aVnIGXYEBQvmBAQ' },
  { id: 'eve-cornwell', name: 'Eve Cornwell', channelId: 'UCM8qRGoiaLwmMv31L7xeeEQ' },
  { id: 'ibz-mo', name: 'Ibz Mo', channelId: 'UCO7htXFTNy6UppWj9xePsDw' },
  // --- General Education / Explainer Channels ---
  { id: 'thomas-frank', name: 'Thomas Frank', channelId: 'UCG-KntY7aVnIGXYEBQvmBAQ' },
  { id: 'zach-star', name: 'Zach Star', channelId: 'UCpCSAcbqs-sjEVfk_hMfY9w' },
  { id: 'eddie-woo', name: 'Eddie Woo', channelId: 'UCq0EGvLTyy-LLT1oUSO_0FQ' },
  // --- Mega Viral Creators (study their hooks & formats) ---
  { id: 'mrbeast', name: 'MrBeast', channelId: 'UCX6OQ3DkcsbYNE6H8uQQuVA' },
  { id: 'pewdiepie', name: 'PewDiePie', channelId: 'UC-lHJZR3Gqxm24_Vd_AJ5Yw' },
  { id: 'mark-rober', name: 'Mark Rober', channelId: 'UCY1kMZp36IQSyNx_9h4mpCg' },
  { id: 'dude-perfect', name: 'Dude Perfect', channelId: 'UCRijo3ddMTht_IHyNSNXpNQ' },
  { id: 'sidemen', name: 'Sidemen', channelId: 'UCDogdKl7t7NHzQ95aEwkdMw' },
  { id: 'mkbhd', name: 'MKBHD', channelId: 'UCBJycsmduvYEL83R_U4JriQ' },
  { id: 'ryan-trahan', name: 'Ryan Trahan', channelId: 'UCnmGIkw-KdI0W5siakKPKog' },
  { id: 'airrack', name: 'Airrack', channelId: 'UCyps-v4WNjWDnYRKmZ4BUGw' },
  { id: 'zhc', name: 'ZHC', channelId: 'UClQubH2NeMmGLTLgNdLBwXg' },
  { id: 'ishowspeed', name: 'IShowSpeed', channelId: 'UCWsDFcIhY2DBi3GB5uykGXA' },
  { id: 'stokes-twins', name: 'Stokes Twins', channelId: 'UCbp9MyKCTEww4CxEzc_Tp0Q' },
  { id: 'sssniperwolf', name: 'SSSniperwolf', channelId: 'UCpB959t8iPrxQWj7G6n0ctQ' },
  { id: 'logan-paul', name: 'Logan Paul', channelId: 'UCG8rbF3g2AMX70yOd8vqIZg' },
  { id: 'unspeakable', name: 'Unspeakable', channelId: 'UCwIWAbIeu0xI0ReKWOcw3eg' },
  { id: 'preston', name: 'Preston', channelId: 'UC70Dib4MvFfT1tU6MqeyHpQ' },
  { id: 'alan-chikin-chow', name: 'Alan Chikin Chow', channelId: 'UC5gxP-2QqIh_09djvlm9Xcg' },
  { id: 'coryxkenshin', name: 'CoryxKenshin', channelId: 'UCiYcA0gJzg855iSKMrX3oHg' },
];

// Safe env access — works in both Vite (browser) and Node.js (server)
const _viteEnv: Record<string, string> = (import.meta as any).env ?? {};

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  claudeApiKey: _viteEnv.VITE_CLAUDE_API_KEY ?? '',
  youtubeApiKey: _viteEnv.VITE_YOUTUBE_API_KEY ?? '',
  creators: DEFAULT_CREATORS,
  platforms: ['tiktok', 'shorts', 'reels', 'facebook', 'linkedin', 'ytlong', 'reddit', 'mumsnet'],
  levels: ['GCSE', 'A-Level'],
  subjects: ['Biology', 'Chemistry', 'Physics', 'Maths'],
  batchDay: 'Friday',
  batchSize: 120,
};

// Storage keys for localStorage
export const STORAGE_KEYS = {
  settings: 'mcc_settings',
  contentItems: 'mcc_content_items',
  streak: 'mcc_streak',
  lastPostDate: 'mcc_last_post_date',
  performanceHistory: 'mcc_performance_history',
  calendarToken: 'mcc_calendar_token',
  passwordHash: 'mcc_password_hash',
  agentLastRuns: 'mcc_agent_last_runs',
  goals: 'mcc_goals',
  weeklySnapshots: 'mcc_weekly_snapshots',
  accountabilityState: 'mcc_accountability_state',
  linkedinToken: 'mcc_linkedin_token',
  linkedinSub: 'mcc_linkedin_sub',
  linkedinTokenExpiry: 'mcc_linkedin_token_expiry',
} as const;
