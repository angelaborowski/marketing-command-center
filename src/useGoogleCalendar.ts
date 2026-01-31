import { useState, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_ID = 'primary';

interface CalendarEvent {
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

interface Post {
  platform: string;
  pillar: string;
  idea: string;
  time: string;
  calendarEventId?: string;
}

interface DayContent {
  day: string;
  batch: boolean;
  batchFocus: string;
  posts: Post[];
}

export function useGoogleCalendar() {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('google_access_token')
  );
  const [isConnected, setIsConnected] = useState(!!accessToken);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const login = useGoogleLogin({
    onSuccess: (response) => {
      setAccessToken(response.access_token);
      localStorage.setItem('google_access_token', response.access_token);
      setIsConnected(true);
    },
    onError: () => {
      console.error('Google login failed');
    },
    scope: 'https://www.googleapis.com/auth/calendar.events',
  });

  const disconnect = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('google_access_token');
    setIsConnected(false);
  }, []);

  const createEvent = useCallback(async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    if (!accessToken) return null;

    try {
      const response = await fetch(`${CALENDAR_API_BASE}/calendars/${CALENDAR_ID}/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (response.status === 401) {
        disconnect();
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  }, [accessToken, disconnect]);

  const updateEvent = useCallback(async (eventId: string, event: CalendarEvent): Promise<CalendarEvent | null> => {
    if (!accessToken) return null;

    try {
      const response = await fetch(`${CALENDAR_API_BASE}/calendars/${CALENDAR_ID}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (response.status === 401) {
        disconnect();
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      return null;
    }
  }, [accessToken, disconnect]);

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!accessToken) return false;

    try {
      const response = await fetch(`${CALENDAR_API_BASE}/calendars/${CALENDAR_ID}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        disconnect();
        return false;
      }

      return response.ok || response.status === 404;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }, [accessToken, disconnect]);

  const listEvents = useCallback(async (timeMin: string, timeMax: string): Promise<CalendarEvent[]> => {
    if (!accessToken) return [];

    try {
      const params = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const response = await fetch(
        `${CALENDAR_API_BASE}/calendars/${CALENDAR_ID}/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        disconnect();
        return [];
      }

      if (!response.ok) {
        throw new Error('Failed to list events');
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error listing events:', error);
      return [];
    }
  }, [accessToken, disconnect]);

  const getNextWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const parseTime = (timeStr: string, date: Date): Date => {
    const result = new Date(date);
    const match = timeStr.match(/(\d+)(am|pm)?/i);
    if (match) {
      let hours = parseInt(match[1]);
      const isPM = match[2]?.toLowerCase() === 'pm';
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      result.setHours(hours, 0, 0, 0);
    } else {
      result.setHours(9, 0, 0, 0);
    }
    return result;
  };

  const platformColors: Record<string, string> = {
    tiktok: '6',
    reels: '3',
    stories: '5',
    snapchat: '7',
    ytshorts: '11',
    ytlong: '11',
    linkedin: '9',
    twitter: '8',
  };

  const syncToCalendar = useCallback(async (
    weeklyContent: DayContent[],
    completedPosts: Record<string, boolean>,
    onUpdateEventId: (day: string, idx: number, eventId: string) => void
  ): Promise<{ success: number; failed: number }> => {
    if (!accessToken) return { success: 0, failed: 0 };

    setIsSyncing(true);
    const dates = getNextWeekDates();
    const dayMap: Record<string, Date> = {
      Monday: dates[0],
      Tuesday: dates[1],
      Wednesday: dates[2],
      Thursday: dates[3],
      Friday: dates[4],
      Saturday: dates[5],
      Sunday: dates[6],
    };

    let success = 0;
    let failed = 0;

    for (const day of weeklyContent) {
      const date = dayMap[day.day];
      if (!date) continue;

      for (let idx = 0; idx < day.posts.length; idx++) {
        const post = day.posts[idx];
        const isCompleted = completedPosts[`${day.day}-${idx}`];

        const startTime = parseTime(post.time, date);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);

        const event: CalendarEvent = {
          summary: `${isCompleted ? '✓ ' : ''}[${post.platform.toUpperCase()}] ${post.idea.slice(0, 50)}${post.idea.length > 50 ? '...' : ''}`,
          description: `Platform: ${post.platform}\nPillar: ${post.pillar}\n\n${post.idea}\n\n---\nManaged by Marketing Command Center`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          colorId: platformColors[post.platform] || '1',
          extendedProperties: {
            private: {
              mccPostId: `${day.day}-${idx}`,
              platform: post.platform,
              completed: isCompleted ? 'true' : 'false',
            },
          },
        };

        try {
          if (post.calendarEventId) {
            const updated = await updateEvent(post.calendarEventId, event);
            if (updated) {
              success++;
            } else {
              failed++;
            }
          } else {
            const created = await createEvent(event);
            if (created?.id) {
              onUpdateEventId(day.day, idx, created.id);
              success++;
            } else {
              failed++;
            }
          }
        } catch {
          failed++;
        }
      }
    }

    setIsSyncing(false);
    setLastSync(new Date());
    return { success, failed };
  }, [accessToken, createEvent, updateEvent]);

  const fetchCalendarStatus = useCallback(async (
    weeklyContent: DayContent[]
  ): Promise<Record<string, boolean>> => {
    if (!accessToken) return {};

    const dates = getNextWeekDates();
    const timeMin = dates[0].toISOString();
    const timeMax = new Date(dates[6].getTime() + 24 * 60 * 60 * 1000).toISOString();

    const events = await listEvents(timeMin, timeMax);
    const statusMap: Record<string, boolean> = {};

    for (const event of events) {
      const postId = event.extendedProperties?.private?.mccPostId;
      const completed = event.extendedProperties?.private?.completed === 'true';
      if (postId) {
        statusMap[postId] = completed;
      }
    }

    return statusMap;
  }, [accessToken, listEvents]);

  return {
    isConnected,
    isSyncing,
    lastSync,
    login,
    disconnect,
    syncToCalendar,
    fetchCalendarStatus,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
