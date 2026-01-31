import type { ContentItem, CalendarSyncSettings } from '../types';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  colorId?: string;
  extendedProperties?: {
    private: Record<string, string>;
  };
}

// Platform color IDs for Google Calendar
const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '6',     // Tangerine
  shorts: '11',    // Red
  reels: '3',      // Purple
  facebook: '9',   // Blue
  linkedin: '7',   // Cyan
  snapchat: '5',   // Yellow
  ytlong: '11',    // Red
};

/**
 * Get the next occurrence of a given day name (e.g., "Friday")
 */
export function getNextOccurrenceOfDay(dayName: string): Date {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIndex = days.indexOf(dayName);

  if (targetDayIndex === -1) {
    throw new Error(`Invalid day name: ${dayName}`);
  }

  const today = new Date();
  const currentDayIndex = today.getDay();

  // Calculate days until target day
  let daysUntilTarget = targetDayIndex - currentDayIndex;

  // If target day is today or has passed this week, get next week's occurrence
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }

  const nextOccurrence = new Date(today);
  nextOccurrence.setDate(today.getDate() + daysUntilTarget);
  nextOccurrence.setHours(0, 0, 0, 0);

  return nextOccurrence;
}

/**
 * Parse a time string like "9:00 AM" into hours and minutes
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const match = timeStr.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);

  if (!match) {
    return { hours: 9, minutes: 0 }; // Default to 9 AM
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

/**
 * Get dates for each day of the current/next week
 */
export function getWeekDates(): Record<string, Date> {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Get Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dates: Record<string, Date> = {};

  days.forEach((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    dates[day] = date;
  });

  return dates;
}

/**
 * Build a filming event for a batch of content items
 */
export function buildFilmingEvent(
  items: ContentItem[],
  batchDay: string,
  settings: CalendarSyncSettings
): CalendarEvent {
  const batchDate = getNextOccurrenceOfDay(batchDay);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Set filming time to 9 AM by default
  const startTime = new Date(batchDate);
  startTime.setHours(9, 0, 0, 0);

  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + settings.filmingEventDuration);

  // Build description with all hooks to film
  const hooksList = items
    .map((item, idx) => `${idx + 1}. [${item.platform.toUpperCase()}] ${item.hook}`)
    .join('\n');

  const description = `Content to film:\n\n${hooksList}\n\n---\nManaged by Marketing Command Center`;

  const event: CalendarEvent = {
    summary: `Film Content - ${items.length} clips`,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone,
    },
    colorId: '10', // Green for filming
    extendedProperties: {
      private: {
        mccEventType: 'filming',
        mccItemCount: items.length.toString(),
        mccBatchDay: batchDay,
      },
    },
  };

  return event;
}

/**
 * Build a posting event for a single content item
 */
export function buildPostingEvent(
  item: ContentItem,
  settings: CalendarSyncSettings
): CalendarEvent {
  const weekDates = getWeekDates();
  const dayDate = weekDates[item.day];

  if (!dayDate) {
    throw new Error(`Invalid day: ${item.day}`);
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { hours, minutes } = parseTimeString(item.time);

  const startTime = new Date(dayDate);
  startTime.setHours(hours, minutes, 0, 0);

  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + settings.postingEventDuration);

  // Truncate hook for title if too long
  const hookPreview = item.hook.length > 40
    ? item.hook.slice(0, 40) + '...'
    : item.hook;

  const platformName = item.platform.toUpperCase();

  const description = `Platform: ${item.platform}
Subject: ${item.subject}
Level: ${item.level}
Topic: ${item.topic}
Pillar: ${item.pillar}

Hook: ${item.hook}

${item.caption ? `Caption:\n${item.caption}` : ''}

${item.hashtags.length > 0 ? `Hashtags: ${item.hashtags.map(t => `#${t}`).join(' ')}` : ''}

---
Managed by Marketing Command Center`;

  const event: CalendarEvent = {
    summary: `Post: ${platformName} - ${hookPreview}`,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone,
    },
    colorId: PLATFORM_COLORS[item.platform] || '1',
    extendedProperties: {
      private: {
        mccEventType: 'posting',
        mccContentId: item.id,
        mccPlatform: item.platform,
      },
    },
  };

  return event;
}

/**
 * Group content items by their filming status
 */
export function getItemsToFilm(items: ContentItem[]): ContentItem[] {
  return items.filter(item => !item.filmed);
}

/**
 * Get items that are filmed but not posted
 */
export function getItemsToPost(items: ContentItem[]): ContentItem[] {
  return items.filter(item => item.filmed && !item.posted);
}
