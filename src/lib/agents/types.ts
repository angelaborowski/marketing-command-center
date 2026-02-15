/**
 * Agent System Type Definitions
 * Core types for the agent framework, pipelines, and all agent-specific I/O
 */

import type {
  ContentItem,
  Settings,
  Platform,
  ExamLevel,
  ContentGapAnalysis,
  SchedulingAnalysis,
} from '../../types';

// ============================================================================
// Agent Identity & Status
// ============================================================================

export type AgentId = 'writer' | 'scheduler';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

// ============================================================================
// Agent Step (granular progress tracking)
// ============================================================================

export interface AgentStep {
  id: string;
  label: string;
  status: AgentStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  data?: unknown;
}

// ============================================================================
// Agent Run (single execution of one agent)
// ============================================================================

export interface AgentRun<TInput = unknown, TOutput = unknown> {
  id: string;
  agentId: AgentId;
  status: AgentStatus;
  steps: AgentStep[];
  input: TInput;
  output?: TOutput;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

// ============================================================================
// Agent Definition (the "class" for each agent)
// ============================================================================

export interface AgentDefinition<TInput = unknown, TOutput = unknown> {
  id: AgentId;
  name: string;
  description: string;
  icon: string;
  color: string;

  /** Check if agent can run given current state */
  canRun: (context: AgentContext) => { ok: boolean; reason?: string };

  /** Execute the agent */
  execute: (
    input: TInput,
    context: AgentContext,
    callbacks: AgentCallbacks
  ) => Promise<TOutput>;
}

// ============================================================================
// Agent Context (read-only snapshot of app state)
// ============================================================================

export interface AgentContext {
  settings: Settings;
  contentItems: ContentItem[];
  performanceItems: ContentItem[]; // items with performance data
  gapAnalysis: ContentGapAnalysis | null;
  schedulingAnalysis: SchedulingAnalysis | null;
}

// ============================================================================
// Agent Callbacks (for progress reporting)
// ============================================================================

export interface AgentCallbacks {
  onStepStart: (stepId: string, label: string) => void;
  onStepComplete: (stepId: string, data?: unknown) => void;
  onStepError: (stepId: string, error: string) => void;
  onProgress: (message: string) => void;
  shouldCancel: () => boolean;
}

// ============================================================================
// Pipeline Types
// ============================================================================

export type PipelineId = 'full-content';

export interface PipelineStep {
  agentId: AgentId;
  inputMapper?: (previousOutput: unknown, context: AgentContext) => unknown;
  optional?: boolean;
}

export interface PipelineDefinition {
  id: PipelineId;
  name: string;
  description: string;
  icon: string;
  steps: PipelineStep[];
}

export interface PipelineRun {
  id: string;
  pipelineId: PipelineId;
  status: AgentStatus;
  agentRuns: AgentRun[];
  currentStepIndex: number;
  startedAt: string;
  completedAt?: string;
}

// ============================================================================
// Writer Agent I/O
// ============================================================================

export interface WriterInput {
  count?: number;
  constraints?: {
    platforms?: Platform[];
    subjects?: string[];
    levels?: ExamLevel[];
    pillars?: Pillar[];
  };
  gapAnalysis?: ContentGapAnalysis;
}

export interface WriterOutput {
  contentItems: Array<Omit<ContentItem, 'id' | 'filmed' | 'posted'>>;
  summary: string;
}

// ============================================================================
// Scheduler Agent I/O
// ============================================================================

export interface SchedulerInput {
  contentItems: Array<Omit<ContentItem, 'id' | 'filmed' | 'posted'>>;
}

export interface SchedulerOutput {
  scheduledItems: Array<Omit<ContentItem, 'id' | 'filmed' | 'posted'>>;
  summary: string;
}

// ============================================================================
// Agent Result Store
// ============================================================================

export interface AgentResultEntry {
  id: string;
  pipelineRunId?: string;
  agentId: AgentId;
  timestamp: string;
  status: 'completed' | 'failed';
  output?: unknown;
  error?: string;
  durationMs: number;
  proactive?: boolean;
  triggerReason?: string;
}

// ============================================================================
// Storage Keys
// ============================================================================

export const AGENT_STORAGE_KEYS = {
  agentResults: 'mcc_agent_results',
  pipelineHistory: 'mcc_pipeline_history',
  agentLastRuns: 'mcc_agent_last_runs',
} as const;
