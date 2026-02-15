/**
 * Agent Executor
 *
 * Runs a single AgentDefinition against its input, producing an AgentRun
 * record that captures every step, timing data, and the final output or error.
 * The caller receives real-time updates via the `onRunUpdate` callback.
 */

import type {
  AgentDefinition,
  AgentContext,
  AgentCallbacks,
  AgentRun,
  AgentStep,
} from './types';

// ============================================================================
// Types
// ============================================================================

export interface ExecutorOptions {
  /** Called whenever the run state changes (step start, complete, error, etc.) */
  onRunUpdate: (run: AgentRun) => void;
  /** Cooperative cancellation signal. Set `cancelled` to true to request stop. */
  cancelSignal: { cancelled: boolean };
}

// ============================================================================
// Helpers
// ============================================================================

/** Generate a short unique id for runs and steps */
function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Return an ISO-8601 timestamp for the current instant */
function now(): string {
  return new Date().toISOString();
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Execute a single agent and return the completed AgentRun.
 *
 * @template TInput  - The agent's input type.
 * @template TOutput - The agent's output type.
 * @param agent   - The AgentDefinition to execute.
 * @param input   - Input data for the agent.
 * @param context - Read-only snapshot of app state.
 * @param options - Callbacks and cancellation signal.
 * @returns A fully populated AgentRun (status will be 'completed' or 'failed').
 */
export async function executeAgent<TInput, TOutput>(
  agent: AgentDefinition<TInput, TOutput>,
  input: TInput,
  context: AgentContext,
  options: ExecutorOptions
): Promise<AgentRun<TInput, TOutput>> {
  const { onRunUpdate, cancelSignal } = options;

  // ---- Initialise the run record ----
  const run: AgentRun<TInput, TOutput> = {
    id: `run-${agent.id}-${uid()}`,
    agentId: agent.id,
    status: 'running',
    steps: [],
    input,
    startedAt: now(),
  };

  /** Convenience: push the current snapshot to the caller */
  const emitUpdate = () => onRunUpdate(run as AgentRun);

  emitUpdate();

  // ---- Pre-flight check ----
  const canRun = agent.canRun(context);
  if (!canRun.ok) {
    run.status = 'failed';
    run.error = canRun.reason ?? 'Agent cannot run in the current context';
    run.completedAt = now();
    run.durationMs = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();
    emitUpdate();
    throw new Error(run.error);
  }

  // ---- Build callbacks that mutate the run in real-time ----
  const findStep = (stepId: string): AgentStep | undefined =>
    run.steps.find((s) => s.id === stepId);

  const callbacks: AgentCallbacks = {
    onStepStart(stepId: string, label: string) {
      const step: AgentStep = {
        id: stepId,
        label,
        status: 'running',
        startedAt: now(),
      };
      run.steps.push(step);
      emitUpdate();
    },

    onStepComplete(stepId: string, data?: unknown) {
      const step = findStep(stepId);
      if (step) {
        step.status = 'completed';
        step.completedAt = now();
        step.data = data;
      }
      emitUpdate();
    },

    onStepError(stepId: string, error: string) {
      const step = findStep(stepId);
      if (step) {
        step.status = 'failed';
        step.completedAt = now();
        step.error = error;
      }
      emitUpdate();
    },

    onProgress(_message: string) {
      // Progress messages are informational; the caller already receives
      // step-level updates via onRunUpdate.
      emitUpdate();
    },

    shouldCancel() {
      return cancelSignal.cancelled;
    },
  };

  // ---- Execute the agent ----
  try {
    const output = await agent.execute(input, context, callbacks);

    // Check for cancellation after execution
    if (cancelSignal.cancelled) {
      run.status = 'cancelled';
      run.error = 'Agent execution was cancelled';
    } else {
      run.status = 'completed';
      run.output = output;
    }
  } catch (err) {
    run.status = 'failed';
    run.error = err instanceof Error ? err.message : String(err);
  }

  // ---- Finalise timing ----
  run.completedAt = now();
  run.durationMs = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();

  emitUpdate();

  return run;
}
