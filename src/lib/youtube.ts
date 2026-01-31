/**
 * YouTube Data API v3 Client
 * Fetches latest videos from specified channels for viral content analysis
 */

// ============================================================================
// Types
// ============================================================================

export interface YouTubeChannel {
  id: string;
  name: string;
  handle?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    default: YouTubeThumbnail;
    medium: YouTubeThumbnail;
    high: YouTubeThumbnail;
    standard?: YouTubeThumbnail;
    maxres?: YouTubeThumbnail;
  };
  statistics?: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
  };
  duration?: string;
  tags?: string[];
}

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeAPIResponse<T> {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: T[];
}

export interface YouTubeSearchItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: YouTubeVideo['thumbnails'];
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

export interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: YouTubeVideo['thumbnails'];
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: string;
    defaultLanguage?: string;
    localized: {
      title: string;
      description: string;
    };
    defaultAudioLanguage?: string;
  };
  contentDetails?: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    projection: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
}

export interface FetchVideosOptions {
  maxResultsPerChannel?: number;
  publishedAfter?: Date;
  includeStatistics?: boolean;
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
}

export interface YouTubeAPIError {
  code: number;
  message: string;
  errors?: Array<{
    message: string;
    domain: string;
    reason: string;
  }>;
}

// ============================================================================
// Default Channels to Analyze
// ============================================================================

export const DEFAULT_CHANNELS: YouTubeChannel[] = [
  { id: 'UCX6OQ3DkcsbYNE6H8uQQuVA', name: 'MrBeast', handle: '@MrBeast' },
  { id: 'UCY1kMZp36IQSyNx_9h4mpCg', name: 'Mark Rober', handle: '@MarkRober' },
  { id: 'UCHnyfMqiRRG1u-2MsSQLbXA', name: 'Veritasium', handle: '@veritasium' },
  { id: 'UCnmGIkw-KdI0W5siakKPKog', name: 'Ryan Trahan', handle: '@ryan' },
];

// ============================================================================
// API Configuration
// ============================================================================

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

function getApiKey(): string {
  // First check environment variables
  let apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  // If not in env, check localStorage (from Settings UI)
  if (!apiKey) {
    try {
      const settings = localStorage.getItem('mcc_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        apiKey = parsed.youtubeApiKey;
      }
    } catch {
      // ignore parsing errors
    }
  }

  if (!apiKey) {
    throw new Error(
      'YouTube API key not found. Please add it in Settings or set VITE_YOUTUBE_API_KEY in your .env file.'
    );
  }
  return apiKey;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetches latest videos from a single YouTube channel
 */
export async function fetchChannelVideos(
  channelId: string,
  options: FetchVideosOptions = {}
): Promise<YouTubeVideo[]> {
  const {
    maxResultsPerChannel = 10,
    publishedAfter,
    order = 'date',
  } = options;

  const apiKey = getApiKey();

  // Step 1: Search for videos from the channel
  const searchParams = new URLSearchParams({
    key: apiKey,
    channelId,
    part: 'snippet',
    type: 'video',
    order,
    maxResults: String(maxResultsPerChannel),
  });

  if (publishedAfter) {
    searchParams.set('publishedAfter', publishedAfter.toISOString());
  }

  const searchUrl = `${YOUTUBE_API_BASE_URL}/search?${searchParams}`;
  const searchResponse = await fetch(searchUrl);

  if (!searchResponse.ok) {
    const error = await searchResponse.json();
    throw new YouTubeAPIException(error.error);
  }

  const searchData: YouTubeAPIResponse<YouTubeSearchItem> = await searchResponse.json();
  const videoIds = searchData.items
    .filter((item) => item.id.videoId)
    .map((item) => item.id.videoId as string);

  if (videoIds.length === 0) {
    return [];
  }

  // Step 2: Get detailed video information including statistics
  const videosParams = new URLSearchParams({
    key: apiKey,
    id: videoIds.join(','),
    part: 'snippet,statistics,contentDetails',
  });

  const videosUrl = `${YOUTUBE_API_BASE_URL}/videos?${videosParams}`;
  const videosResponse = await fetch(videosUrl);

  if (!videosResponse.ok) {
    const error = await videosResponse.json();
    throw new YouTubeAPIException(error.error);
  }

  const videosData: YouTubeAPIResponse<YouTubeVideoItem> = await videosResponse.json();

  return videosData.items.map(transformVideoItem);
}

/**
 * Fetches latest videos from multiple YouTube channels
 */
export async function fetchVideosFromChannels(
  channels: YouTubeChannel[] = DEFAULT_CHANNELS,
  options: FetchVideosOptions = {}
): Promise<Map<string, YouTubeVideo[]>> {
  const results = new Map<string, YouTubeVideo[]>();

  // Fetch videos from all channels in parallel
  const promises = channels.map(async (channel) => {
    try {
      const videos = await fetchChannelVideos(channel.id, options);
      return { channelId: channel.id, videos };
    } catch (error) {
      console.error(`Error fetching videos for channel ${channel.name}:`, error);
      return { channelId: channel.id, videos: [] };
    }
  });

  const channelResults = await Promise.all(promises);

  for (const { channelId, videos } of channelResults) {
    results.set(channelId, videos);
  }

  return results;
}

/**
 * Fetches all videos from default channels and returns a flat array
 */
export async function fetchAllLatestVideos(
  options: FetchVideosOptions = {}
): Promise<YouTubeVideo[]> {
  const channelVideos = await fetchVideosFromChannels(DEFAULT_CHANNELS, options);
  const allVideos: YouTubeVideo[] = [];

  for (const videos of channelVideos.values()) {
    allVideos.push(...videos);
  }

  // Sort by publish date (newest first)
  allVideos.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return allVideos;
}

/**
 * Fetches video details by video ID
 */
export async function fetchVideoById(videoId: string): Promise<YouTubeVideo | null> {
  const apiKey = getApiKey();

  const params = new URLSearchParams({
    key: apiKey,
    id: videoId,
    part: 'snippet,statistics,contentDetails',
  });

  const url = `${YOUTUBE_API_BASE_URL}/videos?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new YouTubeAPIException(error.error);
  }

  const data: YouTubeAPIResponse<YouTubeVideoItem> = await response.json();

  if (data.items.length === 0) {
    return null;
  }

  return transformVideoItem(data.items[0]);
}

/**
 * Fetches multiple videos by their IDs
 */
export async function fetchVideosByIds(videoIds: string[]): Promise<YouTubeVideo[]> {
  if (videoIds.length === 0) {
    return [];
  }

  const apiKey = getApiKey();

  // YouTube API allows up to 50 IDs per request
  const batchSize = 50;
  const batches: string[][] = [];

  for (let i = 0; i < videoIds.length; i += batchSize) {
    batches.push(videoIds.slice(i, i + batchSize));
  }

  const allVideos: YouTubeVideo[] = [];

  for (const batch of batches) {
    const params = new URLSearchParams({
      key: apiKey,
      id: batch.join(','),
      part: 'snippet,statistics,contentDetails',
    });

    const url = `${YOUTUBE_API_BASE_URL}/videos?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new YouTubeAPIException(error.error);
    }

    const data: YouTubeAPIResponse<YouTubeVideoItem> = await response.json();
    allVideos.push(...data.items.map(transformVideoItem));
  }

  return allVideos;
}

/**
 * Search for videos across YouTube
 */
export async function searchVideos(
  query: string,
  options: {
    maxResults?: number;
    publishedAfter?: Date;
    order?: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount';
  } = {}
): Promise<YouTubeVideo[]> {
  const { maxResults = 25, publishedAfter, order = 'relevance' } = options;
  const apiKey = getApiKey();

  const searchParams = new URLSearchParams({
    key: apiKey,
    q: query,
    part: 'snippet',
    type: 'video',
    order,
    maxResults: String(maxResults),
  });

  if (publishedAfter) {
    searchParams.set('publishedAfter', publishedAfter.toISOString());
  }

  const searchUrl = `${YOUTUBE_API_BASE_URL}/search?${searchParams}`;
  const searchResponse = await fetch(searchUrl);

  if (!searchResponse.ok) {
    const error = await searchResponse.json();
    throw new YouTubeAPIException(error.error);
  }

  const searchData: YouTubeAPIResponse<YouTubeSearchItem> = await searchResponse.json();
  const videoIds = searchData.items
    .filter((item) => item.id.videoId)
    .map((item) => item.id.videoId as string);

  if (videoIds.length === 0) {
    return [];
  }

  return fetchVideosByIds(videoIds);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transforms a YouTube API video item to our internal format
 */
function transformVideoItem(item: YouTubeVideoItem): YouTubeVideo {
  return {
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    thumbnails: item.snippet.thumbnails,
    tags: item.snippet.tags,
    duration: item.contentDetails?.duration,
    statistics: item.statistics
      ? {
          viewCount: parseInt(item.statistics.viewCount, 10) || 0,
          likeCount: parseInt(item.statistics.likeCount, 10) || 0,
          commentCount: parseInt(item.statistics.commentCount, 10) || 0,
        }
      : undefined,
  };
}

/**
 * Formats view count for display (e.g., "1.2M views")
 */
export function formatViewCount(count: number): string {
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)}B`;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Parses ISO 8601 duration to human-readable format
 */
export function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Gets relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Gets the channel info from our default channels list
 */
export function getChannelInfo(channelId: string): YouTubeChannel | undefined {
  return DEFAULT_CHANNELS.find((channel) => channel.id === channelId);
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class YouTubeAPIException extends Error {
  code: number;
  errors?: YouTubeAPIError['errors'];

  constructor(apiError: YouTubeAPIError) {
    super(apiError.message);
    this.name = 'YouTubeAPIException';
    this.code = apiError.code;
    this.errors = apiError.errors;
  }

  isQuotaExceeded(): boolean {
    return this.errors?.some((e) => e.reason === 'quotaExceeded') ?? false;
  }

  isInvalidApiKey(): boolean {
    return this.code === 400 && (this.errors?.some((e) => e.reason === 'keyInvalid') ?? false);
  }

  isNotFound(): boolean {
    return this.code === 404;
  }
}

// ============================================================================
// Cache Layer (Optional - for reducing API calls)
// ============================================================================

const VIDEO_CACHE_KEY = 'youtube_video_cache';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function getCachedVideos(): YouTubeVideo[] | null {
  try {
    const cached = localStorage.getItem(VIDEO_CACHE_KEY);
    if (!cached) return null;

    const entry: CacheEntry<YouTubeVideo[]> = JSON.parse(cached);
    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION_MS;

    if (isExpired) {
      localStorage.removeItem(VIDEO_CACHE_KEY);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export function setCachedVideos(videos: YouTubeVideo[]): void {
  try {
    const entry: CacheEntry<YouTubeVideo[]> = {
      data: videos,
      timestamp: Date.now(),
    };
    localStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Failed to cache videos:', error);
  }
}

export function clearVideoCache(): void {
  localStorage.removeItem(VIDEO_CACHE_KEY);
}

/**
 * Fetches videos with caching support
 */
export async function fetchLatestVideosWithCache(
  options: FetchVideosOptions = {},
  forceRefresh = false
): Promise<YouTubeVideo[]> {
  if (!forceRefresh) {
    const cached = getCachedVideos();
    if (cached) {
      return cached;
    }
  }

  const videos = await fetchAllLatestVideos(options);
  setCachedVideos(videos);
  return videos;
}
