/**
 * useAgents Hook
 *
 * Manages all agent/pipeline state for the Marketing Command Center.
 * Provides methods to start pipelines, run individual agents,
 * cancel runs, and persist run history to localStorage.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  PipelineId,
  PipelineRun,
  AgentId,
  AgentContext,
  AgentResultEntry,
  AGENT_STORAGE_KEYS as AgentStorageKeysType,
} from '../lib/agents/types';
import { AGENT_STORAGE_KEYS } from '../lib/agents/types';
import type { ContentItem, Settings, ContentGapAnalysis, SchedulingAnalysis } from '../types';
import { PIPELINES } from '../lib/agents/pipelines';
import { runPipeline } from '../lib/agents/orchestrator';
import { executeAgent } from '../lib/agents/executor';
import { getAgentDefinition } from '../lib/agents/registry';

// ============================================================================
// Constants
// ============================================================================

const MAX_HISTORY = 30;

// ============================================================================
// Return Type
// ============================================================================

export interface UseAgentsReturn {
  /** The currently active pipeline/agent run, if any */
  currentRun: PipelineRun | null;
  /** Whether an agent or pipeline is currently executing */
  isRunning: boolean;
  /** Historical run results loaded from localStorage */
  runHistory: AgentResultEntry[];
  /** The output from the most recent completed run */
  lastOutput: unknown;
  /** Start a pipeline by id, optionally providing initial input */
  startPipeline: (pipelineId: PipelineId, initialInput?: unknown) => void;
  /** Run a single agent by id with the given input */
  startAgent: (agentId: AgentId, input: unknown) => void;
  /** Cancel the current run */
  cancelRun: () => void;
  /** Clear all run history from localStorage */
  clearHistory: () => void;
  /** Helper: stamp content items with generated IDs for approval */
  approveContent: (
    items: Array<Omit<ContentItem, 'id' | 'filmed' | 'posted'>>
  ) => ContentItem[];
}

// ============================================================================
// Helpers
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function loadHistory(): AgentResultEntry[] {
  try {
    const raw = localStorage.getItem(AGENT_STORAGE_KEYS.agentResults);
    if (raw) {
      return JSON.parse(raw) as AgentResultEntry[];
    }
  } catch {
    // Ignore corrupt data
  }
  return [];
}

function saveHistory(entries: AgentResultEntry[]): void {
  try {
    localStorage.setItem(AGENT_STORAGE_KEYS.agentResults, JSON.stringify(entries));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useAgents(
  settings: Settings,
  contentItems: ContentItem[],
  gapAnalysis: ContentGapAnalysis | null,
  schedulingAnalysis: SchedulingAnalysis | null
): UseAgentsReturn {
  // ---- State ----
  const [currentRun, setCurrentRun] = useState<PipelineRun | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runHistory, setRunHistory] = useState<AgentResultEntry[]>(loadHistory);
  const [lastOutput, setLastOutput] = useState<unknown>(null);

  // ---- Refs ----
  const cancelSignalRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const registeredRef = useRef(false);

  // ---- Register all agents on first render ----
  useEffect(() => {
    if (registeredRef.current) return;
    registeredRef.current = true;

    // Dynamic import to avoid circular deps and allow tree-shaking
    import('../lib/agents/implementations/index').then((mod) => {
      if (typeof mod.registerAllAgents === 'function') {
        mod.registerAllAgents();
      }
    }).catch((err) => {
      console.warn('Failed to register agents:', err);
    });
  }, []);

  // ---- Build context from hook params ----
  const buildContext = useCallback((): AgentContext => {
    const performanceItems = contentItems.filter(
      (item) => item.performance && item.performance.views > 0
    );
    return {
      settings,
      contentItems,
      performanceItems,
      gapAnalysis,
      schedulingAnalysis,
    };
  }, [settings, contentItems, gapAnalysis, schedulingAnalysis]);

  // ---- Persist completed runs to history ----
  const addToHistory = useCallback(
    (pipelineRun: PipelineRun) => {
      const newEntries: AgentResultEntry[] = pipelineRun.agentRuns
        .filter((ar) => ar.status === 'completed' || ar.status === 'failed')
        .map((ar) => ({
          id: ar.id,
          pipelineRunId: pipelineRun.id,
          agentId: ar.agentId,
          timestamp: ar.completedAt || ar.startedAt,
          status: ar.status === 'completed' ? ('completed' as const) : ('failed' as const),
          output: ar.output,
          error: ar.error,
          durationMs: ar.durationMs || 0,
        }));

      if (newEntries.length === 0) return;

      setRunHistory((prev) => {
        const updated = [...newEntries, ...prev].slice(0, MAX_HISTORY);
        saveHistory(updated);
        return updated;
      });
    },
    []
  );

  // ---- Start a pipeline ----
  const startPipeline = useCallback(
    (pipelineId: PipelineId, initialInput?: unknown) => {
      if (isRunning) return;

      const pipeline = PIPELINES[pipelineId];
      if (!pipeline) {
        console.error(`Pipeline "${pipelineId}" not found`);
        return;
      }

      // Reset cancel signal
      cancelSignalRef.current = { cancelled: false };
      setIsRunning(true);

      const context = buildContext();

      runPipeline(pipeline, initialInput ?? {}, context, {
        onPipelineUpdate: (run) => {
          setCurrentRun({ ...run });
        },
        cancelSignal: cancelSignalRef.current,
      })
        .then((finalRun) => {
          setCurrentRun({ ...finalRun });

          // Extract last output
          const lastCompleted = [...finalRun.agentRuns]
            .reverse()
            .find((ar) => ar.status === 'completed');
          if (lastCompleted?.output) {
            setLastOutput(lastCompleted.output);
          }

          // Persist to history
          addToHistory(finalRun);
        })
        .catch((err) => {
          console.error('Pipeline execution error:', err);
        })
        .finally(() => {
          setIsRunning(false);
        });
    },
    [isRunning, buildContext, addToHistory]
  );

  // ---- Start a single agent ----
  const startAgent = useCallback(
    (agentId: AgentId, input: unknown) => {
      if (isRunning) return;

      const agent = getAgentDefinition(agentId);
      if (!agent) {
        console.error(`Agent "${agentId}" not found in registry`);
        return;
      }

      // Reset cancel signal
      cancelSignalRef.current = { cancelled: false };
      setIsRunning(true);

      const context = buildContext();

      // Create a synthetic PipelineRun wrapper for single-agent execution
      const syntheticPipelineRun: PipelineRun = {
        id: `single-${agentId}-${generateId()}`,
        pipelineId: 'full-content', // Default pipeline for single-agent runs
        status: 'running',
        agentRuns: [],
        currentStepIndex: 0,
        startedAt: new Date().toISOString(),
      };

      setCurrentRun({ ...syntheticPipelineRun });

      executeAgent(agent, input, context, {
        onRunUpdate: (run) => {
          syntheticPipelineRun.agentRuns = [run];
          setCurrentRun({ ...syntheticPipelineRun });
        },
        cancelSignal: cancelSignalRef.current,
      })
        .then((agentRun) => {
          syntheticPipelineRun.agentRuns = [agentRun];
          syntheticPipelineRun.status = agentRun.status === 'completed' ? 'completed' : 'failed';
          syntheticPipelineRun.completedAt = new Date().toISOString();
          setCurrentRun({ ...syntheticPipelineRun });

          if (agentRun.output) {
            setLastOutput(agentRun.output);
          }

          // Persist to history
          addToHistory(syntheticPipelineRun);
        })
        .catch((err) => {
          syntheticPipelineRun.status = 'failed';
          syntheticPipelineRun.completedAt = new Date().toISOString();
          setCurrentRun({ ...syntheticPipelineRun });
          console.error('Agent execution error:', err);
        })
        .finally(() => {
          setIsRunning(false);
        });
    },
    [isRunning, buildContext, addToHistory]
  );

  // ---- Cancel ----
  const cancelRun = useCallback(() => {
    cancelSignalRef.current.cancelled = true;
  }, []);

  // ---- Clear history ----
  const clearHistory = useCallback(() => {
    setRunHistory([]);
    try {
      localStorage.removeItem(AGENT_STORAGE_KEYS.agentResults);
    } catch {
      // Ignore
    }
  }, []);

  // ---- Approve content helper ----
  const approveContent = useCallback(
    (items: Array<Omit<ContentItem, 'id' | 'filmed' | 'posted'>>): ContentItem[] => {
      return items.map((item) => ({
        ...item,
        id: generateId(),
        // Text content (Reddit, Mumsnet) skips filming, so mark as filmed
        filmed: item.contentType === 'text',
        posted: false,
      }));
    },
    []
  );

  return {
    currentRun,
    isRunning,
    runHistory,
    lastOutput,
    startPipeline,
    startAgent,
    cancelRun,
    clearHistory,
    approveContent,
  };
}
