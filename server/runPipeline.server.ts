/**
 * Server-Side Pipeline Runner
 *
 * Executes the writer+scheduler pipeline and saves the result
 * as a content batch for review/approval.
 */

import { registerAgent } from '../src/lib/agents/registry';
import { runPipeline } from '../src/lib/agents/orchestrator';
import { PIPELINES } from '../src/lib/agents/pipelines';
import { schedulerAgent } from '../src/lib/agents/implementations/schedulerAgent';
import { serverWriterAgent } from './writerAgent.server';
import {
  saveBatch,
  appendCronLog,
  loadServerSettings,
  type ContentBatch,
  type ContentBatchItem,
} from './store';
import type { AgentContext, SchedulerOutput } from '../src/lib/agents/types';
import type { Settings } from '../src/types';

// ============================================================================
// Helpers
// ============================================================================

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// Public API
// ============================================================================

export async function runContentPipeline(
  trigger: 'cron' | 'manual'
): Promise<ContentBatch> {
  console.log(`[PIPELINE] Starting content generation (trigger: ${trigger})...`);

  // Register the server-side writer agent (overrides any browser version)
  registerAgent(serverWriterAgent);
  registerAgent(schedulerAgent);

  // Build context from server settings
  const serverSettings = loadServerSettings();
  const settings: Settings = {
    claudeApiKey: process.env.CLAUDE_API_KEY || '',
    youtubeApiKey: '',
    creators: [],
    platforms: serverSettings.platforms as Settings['platforms'],
    levels: serverSettings.levels as Settings['levels'],
    subjects: serverSettings.subjects,
    batchDay: 'Friday',
    batchSize: serverSettings.batchSize,
  };

  const context: AgentContext = {
    settings,
    contentItems: [],
    performanceItems: [],
    gapAnalysis: null,
    schedulingAnalysis: null,
  };

  // Run the pipeline
  const pipelineRun = await runPipeline(
    PIPELINES['full-content'],
    {}, // Default writer input (uses context settings)
    context,
    {
      onPipelineUpdate: (run) => {
        const step = run.currentStepIndex;
        const status = run.status;
        console.log(`[PIPELINE] Step ${step + 1}/${PIPELINES['full-content'].steps.length} — ${status}`);
      },
      cancelSignal: { cancelled: false },
    }
  );

  // Check for pipeline failure
  if (pipelineRun.status !== 'completed') {
    const errorMsg = pipelineRun.agentRuns
      .filter(r => r.status === 'failed')
      .map(r => r.error)
      .join('; ') || 'Pipeline failed with unknown error';

    appendCronLog({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: errorMsg,
    });

    throw new Error(errorMsg);
  }

  // Extract scheduled items from the scheduler output
  const schedulerRun = pipelineRun.agentRuns.find(
    r => r.agentId === 'scheduler' && r.status === 'completed'
  );

  if (!schedulerRun?.output) {
    throw new Error('Scheduler agent did not produce output');
  }

  const schedulerOutput = schedulerRun.output as SchedulerOutput;

  // Build and save the batch
  const batchId = `batch-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;

  const items: ContentBatchItem[] = schedulerOutput.scheduledItems.map(item => ({
    tempId: generateId(),
    status: 'pending' as const,
    content: item,
  }));

  const batch: ContentBatch = {
    id: batchId,
    createdAt: new Date().toISOString(),
    trigger,
    status: 'pending',
    items,
    pipelineSummary: schedulerOutput.summary,
  };

  saveBatch(batch);

  appendCronLog({
    timestamp: new Date().toISOString(),
    status: 'success',
    batchId: batch.id,
    itemCount: items.length,
  });

  console.log(`[PIPELINE] Batch ${batchId} created with ${items.length} items`);

  return batch;
}
