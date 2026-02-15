/**
 * Pipeline Orchestrator
 *
 * Chains agents sequentially according to a PipelineDefinition.
 * Each step's output becomes the next step's input (optionally
 * transformed via a step-level inputMapper).  The caller receives
 * real-time updates through the `onPipelineUpdate` callback.
 */

import type {
  PipelineDefinition,
  PipelineRun,
  AgentRun,
  AgentContext,
  AgentStatus,
} from './types';
import { getAgentDefinition } from './registry';
import { executeAgent } from './executor';

// ============================================================================
// Types
// ============================================================================

export interface PipelineOptions {
  /** Called whenever the pipeline run state changes */
  onPipelineUpdate: (run: PipelineRun) => void;
  /** Cooperative cancellation signal */
  cancelSignal: { cancelled: boolean };
}

// ============================================================================
// Helpers
// ============================================================================

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Execute a full pipeline by running each step's agent in sequence.
 *
 * @param pipeline     - The PipelineDefinition describing which agents to run.
 * @param initialInput - The input for the first agent in the pipeline.
 * @param context      - Read-only snapshot of the current app state.
 * @param options      - Update callback and cancellation signal.
 * @returns The completed PipelineRun record.
 */
export async function runPipeline(
  pipeline: PipelineDefinition,
  initialInput: unknown,
  context: AgentContext,
  options: PipelineOptions
): Promise<PipelineRun> {
  const { onPipelineUpdate, cancelSignal } = options;

  // ---- Initialise the pipeline run ----
  const pipelineRun: PipelineRun = {
    id: `pipeline-${pipeline.id}-${uid()}`,
    pipelineId: pipeline.id,
    status: 'running',
    agentRuns: [],
    currentStepIndex: 0,
    startedAt: now(),
  };

  const emitUpdate = () => onPipelineUpdate({ ...pipelineRun });

  emitUpdate();

  let previousOutput: unknown = initialInput;

  // ---- Iterate through pipeline steps ----
  for (let i = 0; i < pipeline.steps.length; i++) {
    // Check for cancellation between steps
    if (cancelSignal.cancelled) {
      pipelineRun.status = 'cancelled';
      pipelineRun.completedAt = now();
      emitUpdate();
      return pipelineRun;
    }

    const step = pipeline.steps[i];
    pipelineRun.currentStepIndex = i;
    emitUpdate();

    // Look up the agent definition
    const agent = getAgentDefinition(step.agentId);
    if (!agent) {
      const errorMsg = `Agent "${step.agentId}" not found in registry`;
      if (step.optional) {
        // Skip optional step with missing agent
        const skippedRun: AgentRun = {
          id: `run-${step.agentId}-${uid()}`,
          agentId: step.agentId,
          status: 'failed',
          steps: [],
          input: null,
          error: errorMsg,
          startedAt: now(),
          completedAt: now(),
          durationMs: 0,
        };
        pipelineRun.agentRuns.push(skippedRun);
        emitUpdate();
        continue;
      }
      // Non-optional step: fail the pipeline
      pipelineRun.status = 'failed';
      pipelineRun.completedAt = now();
      const failedRun: AgentRun = {
        id: `run-${step.agentId}-${uid()}`,
        agentId: step.agentId,
        status: 'failed',
        steps: [],
        input: null,
        error: errorMsg,
        startedAt: now(),
        completedAt: now(),
        durationMs: 0,
      };
      pipelineRun.agentRuns.push(failedRun);
      emitUpdate();
      return pipelineRun;
    }

    // Build input for this step
    let stepInput: unknown;
    if (step.inputMapper && i > 0) {
      try {
        stepInput = step.inputMapper(previousOutput, context);
      } catch (mapErr) {
        const errorMsg = `Input mapping failed: ${mapErr instanceof Error ? mapErr.message : String(mapErr)}`;
        if (step.optional) {
          const skippedRun: AgentRun = {
            id: `run-${step.agentId}-${uid()}`,
            agentId: step.agentId,
            status: 'failed',
            steps: [],
            input: null,
            error: errorMsg,
            startedAt: now(),
            completedAt: now(),
            durationMs: 0,
          };
          pipelineRun.agentRuns.push(skippedRun);
          emitUpdate();
          continue;
        }
        pipelineRun.status = 'failed';
        pipelineRun.completedAt = now();
        emitUpdate();
        return pipelineRun;
      }
    } else if (i === 0) {
      stepInput = initialInput;
    } else {
      stepInput = previousOutput;
    }

    // Execute the agent
    try {
      const agentRun = await executeAgent(
        agent,
        stepInput,
        context,
        {
          onRunUpdate: (run: AgentRun) => {
            // Replace or add the current agent run in the pipeline
            const existingIndex = pipelineRun.agentRuns.findIndex(
              (r) => r.id === run.id
            );
            if (existingIndex >= 0) {
              pipelineRun.agentRuns[existingIndex] = run;
            } else {
              pipelineRun.agentRuns.push(run);
            }
            emitUpdate();
          },
          cancelSignal,
        }
      );

      if (agentRun.status === 'completed') {
        previousOutput = agentRun.output;
      } else if (agentRun.status === 'cancelled') {
        pipelineRun.status = 'cancelled';
        pipelineRun.completedAt = now();
        emitUpdate();
        return pipelineRun;
      } else {
        // Agent failed
        if (step.optional) {
          // Continue with previous output for optional steps
          continue;
        }
        // Non-optional step failed: stop the pipeline
        pipelineRun.status = 'failed';
        pipelineRun.completedAt = now();
        emitUpdate();
        return pipelineRun;
      }
    } catch (err) {
      // Execution threw (e.g. canRun check failed)
      if (step.optional) {
        // Add the failed run if not already added via callback
        const failedRun: AgentRun = {
          id: `run-${step.agentId}-${uid()}`,
          agentId: step.agentId,
          status: 'failed',
          steps: [],
          input: stepInput,
          error: err instanceof Error ? err.message : String(err),
          startedAt: now(),
          completedAt: now(),
          durationMs: 0,
        };
        // Only add if not already present from the executor callback
        if (!pipelineRun.agentRuns.find((r) => r.agentId === step.agentId && r.status === 'failed')) {
          pipelineRun.agentRuns.push(failedRun);
        }
        emitUpdate();
        continue;
      }
      pipelineRun.status = 'failed';
      pipelineRun.completedAt = now();
      emitUpdate();
      return pipelineRun;
    }
  }

  // ---- All steps completed ----
  pipelineRun.status = 'completed';
  pipelineRun.completedAt = now();
  emitUpdate();

  return pipelineRun;
}
