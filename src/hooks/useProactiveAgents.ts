/**
 * useProactiveAgents Hook
 *
 * Watches for trigger conditions and auto-starts agent runs when appropriate.
 * Currently only auto-triggers the Scheduler when new content is added.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ContentItem, Settings } from '../types';
import type { AgentId, PipelineId, AgentResultEntry } from '../lib/agents/types';
import { AGENT_STORAGE_KEYS } from '../lib/agents/types';

// ============================================================================
// Constants
// ============================================================================

const SCHEDULER_COOLDOWN = 60 * 60 * 1000; // 1 hour

const PROACTIVE_CLAIM_WINDOW_MS = 30_000; // 30 seconds
const DEBOUNCE_MS = 3_000; // 3 seconds

// ============================================================================
// Types
// ============================================================================

export interface ProactiveNotification {
  id: string;
  agentId: AgentId;
  timestamp: string;
  triggerReason: string;
  summary: string;
  dismissed: boolean;
}

export interface UseProactiveAgentsReturn {
  notifications: ProactiveNotification[];
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  lastRunTimestamps: Record<string, string>;
}

// ============================================================================
// Helpers
// ============================================================================

function extractSummary(agentId: AgentId, output: unknown): string {
  if (!output || typeof output !== 'object') return 'Completed successfully';
  const o = output as Record<string, unknown>;
  if (agentId === 'scheduler' && Array.isArray(o.scheduledItems)) return `Optimized ${o.scheduledItems.length} items`;
  if (o.summary && typeof o.summary === 'string') return o.summary.slice(0, 100);
  return 'Completed successfully';
}

function loadLastRunTimestamps(): Record<string, string> {
  try {
    const raw = localStorage.getItem(AGENT_STORAGE_KEYS.agentLastRuns);
    if (raw) {
      return JSON.parse(raw) as Record<string, string>;
    }
  } catch {
    // Ignore corrupt data
  }
  return {};
}

function saveLastRunTimestamps(timestamps: Record<string, string>): void {
  try {
    localStorage.setItem(AGENT_STORAGE_KEYS.agentLastRuns, JSON.stringify(timestamps));
  } catch {
    // Ignore storage errors
  }
}

function isCooldownExpired(lastTimestamp: string | undefined, cooldownMs: number): boolean {
  if (!lastTimestamp) return true;
  return Date.now() - new Date(lastTimestamp).getTime() > cooldownMs;
}

// ============================================================================
// Hook
// ============================================================================

export function useProactiveAgents(
  settings: Settings,
  contentItems: ContentItem[],
  isRunning: boolean,
  startAgent: (agentId: AgentId, input: unknown) => void,
  startPipeline: (pipelineId: PipelineId, input?: unknown) => void,
  runHistory: AgentResultEntry[],
): UseProactiveAgentsReturn {
  // ---- State ----
  const [notifications, setNotifications] = useState<ProactiveNotification[]>([]);
  const [lastRunTimestamps, setLastRunTimestamps] = useState<Record<string, string>>(loadLastRunTimestamps);

  // ---- Refs ----
  const lastRunTimestampsRef = useRef<Record<string, string>>(lastRunTimestamps);
  const triggeredThisSession = useRef<Set<AgentId>>(new Set());
  const pendingProactiveRuns = useRef<Map<AgentId, { timestamp: number; triggerReason: string }>>(new Map());
  const prevContentCountRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRunHistoryLengthRef = useRef<number>(runHistory.length);
  const wasRunningRef = useRef<boolean>(isRunning);

  // Keep ref in sync with state
  useEffect(() => {
    lastRunTimestampsRef.current = lastRunTimestamps;
  }, [lastRunTimestamps]);

  // ---- Track run history for last-run timestamps and proactive run attribution ----
  useEffect(() => {
    if (runHistory.length <= prevRunHistoryLengthRef.current) {
      prevRunHistoryLengthRef.current = runHistory.length;
      return;
    }

    // Find new entries (they are prepended to the array in useAgents)
    const newCount = runHistory.length - prevRunHistoryLengthRef.current;
    const newEntries = runHistory.slice(0, newCount);
    prevRunHistoryLengthRef.current = runHistory.length;

    // Update last-run timestamps for completed entries
    const updatedTimestamps = { ...lastRunTimestampsRef.current };
    let timestampsChanged = false;

    for (const entry of newEntries) {
      if (entry.status === 'completed') {
        updatedTimestamps[entry.agentId] = entry.timestamp;
        timestampsChanged = true;
      }

      // Check if this entry was a proactive run
      const pending = pendingProactiveRuns.current.get(entry.agentId);
      if (pending) {
        const entryTime = new Date(entry.timestamp).getTime();
        if (Math.abs(entryTime - pending.timestamp) < PROACTIVE_CLAIM_WINDOW_MS) {
          // Claim this entry as proactive
          const notification: ProactiveNotification = {
            id: `proactive-${entry.id}`,
            agentId: entry.agentId,
            timestamp: entry.timestamp,
            triggerReason: pending.triggerReason,
            summary: extractSummary(entry.agentId, entry.output),
            dismissed: false,
          };
          setNotifications((prev) => [notification, ...prev]);
          pendingProactiveRuns.current.delete(entry.agentId);
        }
      }
    }

    if (timestampsChanged) {
      setLastRunTimestamps(updatedTimestamps);
      saveLastRunTimestamps(updatedTimestamps);
    }
  }, [runHistory]);

  // ---- Trigger evaluation ----
  const evaluateTriggers = useCallback(() => {
    if (isRunning) return;

    const timestamps = lastRunTimestampsRef.current;
    const contentCount = contentItems.length;

    // SCHEDULER TRIGGER: auto-schedule when new content is added
    if (
      contentCount > prevContentCountRef.current &&
      contentCount > 5 &&
      isCooldownExpired(timestamps['scheduler'], SCHEDULER_COOLDOWN) &&
      !triggeredThisSession.current.has('scheduler')
    ) {
      pendingProactiveRuns.current.set('scheduler', {
        timestamp: Date.now(),
        triggerReason: 'New content items added',
      });
      startAgent('scheduler', { contentItems });
      triggeredThisSession.current.add('scheduler');
      prevContentCountRef.current = contentCount;
      return;
    }

    // Update prev counts after evaluation (no trigger fired)
    prevContentCountRef.current = contentCount;
  }, [isRunning, settings, contentItems, startAgent]);

  // ---- Main effect: debounce on mount, re-evaluate on dependency change ----
  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      evaluateTriggers();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [isRunning, settings, contentItems.length, runHistory.length, evaluateTriggers]);

  // ---- Re-evaluate when a proactive run completes (isRunning transitions from true to false) ----
  useEffect(() => {
    if (wasRunningRef.current && !isRunning) {
      // A run just completed — schedule re-evaluation for queued triggers
      const timer = setTimeout(() => {
        evaluateTriggers();
      }, DEBOUNCE_MS);

      wasRunningRef.current = isRunning;
      return () => clearTimeout(timer);
    }
    wasRunningRef.current = isRunning;
  }, [isRunning, evaluateTriggers]);

  // ---- Notification actions ----
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n)),
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    dismissNotification,
    clearAll,
    lastRunTimestamps,
  };
}
