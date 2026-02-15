import { useState, useCallback, useEffect, useRef } from 'react';
import { buildFilmingEvent, buildPostingEvent } from '../lib/calendarHelpers';
import type { useGoogleCalendar } from '../useGoogleCalendar';
import type { ContentItem, Settings, CalendarSyncSettings } from '../types';
import { DEFAULT_CALENDAR_SETTINGS } from '../types';

export interface UseCalendarSyncReturn {
  calendarSyncStatus: { type: 'success' | 'error' | 'info' | null; message: string };
  calendarSettings: CalendarSyncSettings;
  syncToCalendar: () => Promise<void>;
}

export function useCalendarSync(
  contentItems: ContentItem[],
  settings: Settings,
  calendar: ReturnType<typeof useGoogleCalendar>,
  setContentItems: React.Dispatch<React.SetStateAction<ContentItem[]>>
): UseCalendarSyncReturn {
  const [calendarSyncStatus, setCalendarSyncStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const prevContentItemsRef = useRef<ContentItem[]>(contentItems);
  const calendarSettings: CalendarSyncSettings = settings.calendarSync || DEFAULT_CALENDAR_SETTINGS;

  const syncToCalendar = useCallback(async () => {
    if (!calendar.isConnected || !calendarSettings.enabled) {
      setCalendarSyncStatus({
        type: 'error',
        message: 'Calendar not connected or sync disabled',
      });
      return;
    }

    setCalendarSyncStatus({ type: 'info', message: 'Syncing to calendar...' });

    try {
      let successCount = 0;
      let errorCount = 0;

      if (calendarSettings.createFilmingEvents && settings.batchDay) {
        const itemsToFilm = contentItems.filter(item => !item.filmed);
        if (itemsToFilm.length > 0) {
          const filmingEvent = buildFilmingEvent(itemsToFilm, settings.batchDay, calendarSettings);
          const result = await calendar.createEvent(filmingEvent);
          if (result) {
            successCount++;
          } else {
            errorCount++;
          }
        }
      }

      if (calendarSettings.createPostingEvents) {
        for (const item of contentItems) {
          if (item.posted) continue;

          try {
            const postingEvent = buildPostingEvent(item, calendarSettings);

            if (item.postingEventId) {
              const result = await calendar.updateEvent(item.postingEventId, postingEvent);
              if (result) {
                successCount++;
              } else {
                errorCount++;
              }
            } else {
              const result = await calendar.createEvent(postingEvent);
              if (result?.id) {
                setContentItems(prev =>
                  prev.map(i =>
                    i.id === item.id ? { ...i, postingEventId: result.id } : i
                  )
                );
                successCount++;
              } else {
                errorCount++;
              }
            }
          } catch (err) {
            console.error('Error syncing item:', item.id, err);
            errorCount++;
          }
        }
      }

      if (errorCount === 0) {
        setCalendarSyncStatus({
          type: 'success',
          message: `Synced ${successCount} events to calendar`,
        });
      } else {
        setCalendarSyncStatus({
          type: 'error',
          message: `Synced ${successCount} events, ${errorCount} failed`,
        });
      }

      setTimeout(() => setCalendarSyncStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error('Calendar sync error:', error);
      setCalendarSyncStatus({
        type: 'error',
        message: 'Failed to sync to calendar',
      });
      setTimeout(() => setCalendarSyncStatus({ type: null, message: '' }), 3000);
    }
  }, [
    calendar,
    calendarSettings,
    contentItems,
    settings.batchDay,
    setContentItems,
  ]);

  // Auto-sync when content changes
  useEffect(() => {
    if (
      calendar.isConnected &&
      calendarSettings.enabled &&
      calendarSettings.autoSync &&
      prevContentItemsRef.current !== contentItems &&
      contentItems.length > 0
    ) {
      const timeout = setTimeout(() => {
        syncToCalendar();
      }, 2000);

      prevContentItemsRef.current = contentItems;
      return () => clearTimeout(timeout);
    }
  }, [contentItems, calendar.isConnected, calendarSettings, syncToCalendar]);

  return { calendarSyncStatus, calendarSettings, syncToCalendar };
}
