/**
 * Pre-built Pipeline Configurations
 *
 * Defines the standard pipelines that chain agents together.
 * Each pipeline specifies its steps, optional input mappers
 * between agents, and whether steps are optional.
 */

import type {
  PipelineId,
  PipelineDefinition,
  WriterOutput,
  SchedulerInput,
} from './types';

// ============================================================================
// Pipeline Definitions
// ============================================================================

export const PIPELINES: Record<PipelineId, PipelineDefinition> = {
  /**
   * Default pipeline — Writer generates content, Scheduler assigns times.
   * Fast, cheap (1 Claude call), good enough.
   */
  'full-content': {
    id: 'full-content',
    name: 'Generate Content',
    description:
      'Generate content and schedule optimal posting times.',
    icon: 'Sparkles',
    steps: [
      {
        agentId: 'writer',
      },
      {
        agentId: 'scheduler',
        inputMapper: (previousOutput): SchedulerInput => {
          const writerOutput = previousOutput as WriterOutput;
          return {
            contentItems: writerOutput.contentItems,
          };
        },
      },
    ],
  },
};
