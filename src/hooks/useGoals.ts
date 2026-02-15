/**
 * useGoals Hook
 *
 * Manages goals, weekly snapshots, accountability state, and computed
 * growth metrics / posting scores. Follows the same localStorage-backed
 * pattern as useAgents.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Goals,
  WeeklySnapshot,
  AccountabilityState,
  GrowthMetrics,
  ContentItem,
} from '../types';
import { DEFAULT_GOALS, DEFAULT_ACCOUNTABILITY, STORAGE_KEYS } from '../types';
import {
  getMondayOfWeek,
  computeGrowthMetrics,
  computePostingScore,
} from '../lib/goalCalculations';

// ============================================================================
// Return Type
// ============================================================================

export interface UseGoalsReturn {
  /** Current goals configuration */
  goals: Goals;
  /** Replace the entire goals object */
  updateGoals: (goals: Goals) => void;
  /** Array of weekly check-in snapshots */
  snapshots: WeeklySnapshot[];
  /** Add a new snapshot (id generated automatically) */
  addSnapshot: (snapshot: Omit<WeeklySnapshot, 'id'>) => void;
  /** Current accountability state (streaks, check-in status) */
  accountability: AccountabilityState;
  /** Computed growth metrics per platform */
  growthMetrics: GrowthMetrics[];
  /** True if today is Mon/Tue and no check-in has been logged this week */
  isPendingCheckIn: boolean;
  /** Dismiss the check-in prompt for this week */
  dismissCheckIn: () => void;
  /** Posting score for the current week */
  postingScore: { platform: string; posted: number; target: number; met: boolean }[];
}

// ============================================================================
// Helpers
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // Ignore corrupt data
  }
  return fallback;
}

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useGoals(contentItems: ContentItem[]): UseGoalsReturn {
  // ---- State: Goals ----
  const [goals, setGoals] = useState<Goals>(() =>
    loadJSON<Goals>(STORAGE_KEYS.goals, DEFAULT_GOALS)
  );

  // ---- State: Snapshots ----
  const [snapshots, setSnapshots] = useState<WeeklySnapshot[]>(() =>
    loadJSON<WeeklySnapshot[]>(STORAGE_KEYS.weeklySnapshots, [])
  );

  // ---- State: Accountability ----
  const [accountability, setAccountability] = useState<AccountabilityState>(() =>
    loadJSON<AccountabilityState>(STORAGE_KEYS.accountabilityState, DEFAULT_ACCOUNTABILITY)
  );

  // ---- Persist goals ----
  useEffect(() => {
    saveJSON(STORAGE_KEYS.goals, goals);
  }, [goals]);

  // ---- Persist snapshots ----
  useEffect(() => {
    saveJSON(STORAGE_KEYS.weeklySnapshots, snapshots);
  }, [snapshots]);

  // ---- Persist accountability ----
  useEffect(() => {
    saveJSON(STORAGE_KEYS.accountabilityState, accountability);
  }, [accountability]);

  // ---- Actions ----

  const updateGoals = useCallback((newGoals: Goals) => {
    setGoals(newGoals);
  }, []);

  const addSnapshot = useCallback(
    (snapshot: Omit<WeeklySnapshot, 'id'>) => {
      const newSnapshot: WeeklySnapshot = {
        ...snapshot,
        id: generateId(),
      };

      setSnapshots((prev) => [...prev, newSnapshot]);

      // Update accountability: mark check-in complete, bump streak
      setAccountability((prev) => {
        const thisMonday = getMondayOfWeek(new Date()).toISOString();
        const lastMonday = prev.lastCheckInDate
          ? getMondayOfWeek(new Date(prev.lastCheckInDate)).toISOString()
          : null;

        // Was the previous check-in last week (consecutive)?
        const prevMondayDate = getMondayOfWeek(new Date());
        prevMondayDate.setDate(prevMondayDate.getDate() - 7);
        const isConsecutive = lastMonday === prevMondayDate.toISOString();

        return {
          checkInCompletedThisWeek: true,
          lastCheckInDate: new Date().toISOString(),
          checkInStreak: isConsecutive ? prev.checkInStreak + 1 : 1,
          pendingCheckIn: false,
        };
      });
    },
    []
  );

  // ---- Computed: Growth Metrics ----
  const growthMetrics = useMemo(
    () => computeGrowthMetrics(goals, snapshots),
    [goals, snapshots]
  );

  // ---- Computed: Posting Score ----
  const postingScore = useMemo(() => {
    const weekStart = getMondayOfWeek(new Date());
    return computePostingScore(contentItems, goals.postingTargets, weekStart);
  }, [contentItems, goals.postingTargets]);

  // ---- Computed: isPendingCheckIn ----
  const isPendingCheckIn = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, 2=Tue
    const isMonOrTue = dayOfWeek === 1 || dayOfWeek === 2;

    if (!isMonOrTue) return false;

    // Has a check-in been completed this week?
    const thisMondayStr = getMondayOfWeek(now).toISOString();
    if (!accountability.lastCheckInDate) return true;

    const lastCheckInMonday = getMondayOfWeek(
      new Date(accountability.lastCheckInDate)
    ).toISOString();

    return lastCheckInMonday !== thisMondayStr;
  }, [accountability.lastCheckInDate]);

  // ---- dismissCheckIn ----
  const dismissCheckIn = useCallback(() => {
    setAccountability((prev) => ({
      ...prev,
      pendingCheckIn: false,
      checkInCompletedThisWeek: true,
      lastCheckInDate: new Date().toISOString(),
    }));
  }, []);

  return {
    goals,
    updateGoals,
    snapshots,
    addSnapshot,
    accountability,
    growthMetrics,
    isPendingCheckIn,
    dismissCheckIn,
    postingScore,
  };
}
