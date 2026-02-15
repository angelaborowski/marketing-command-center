/**
 * Writer Agent Implementation
 *
 * Generates viral educational content items using Claude, guided by
 * content opportunities, viral formulas, and gap analysis directives.
 */

import {
  WRITER_SYSTEM_PROMPT,
  buildWriterUserPrompt,
} from '../prompts/writerPrompt';
import { callAgentClaude } from '../agentClaude';
import { validateContent } from '../../claude';
import type {
  AgentDefinition,
  AgentContext,
  AgentCallbacks,
  WriterInput,
  WriterOutput,
} from '../types';
import type { ContentItem, ContentType, Pillar, Platform, ExamLevel } from '../../../types';
import { PLATFORM_CONTENT_TYPES } from '../../../types';

// ============================================================================
// Helpers
// ============================================================================

type DraftItem = Omit<ContentItem, 'id' | 'filmed' | 'posted'>;

/**
 * Build gap directives from the gap analysis so the writer knows what to
 * prioritise.
 */
function buildGapDirectives(
  input: WriterInput
): Array<{ type: string; value: string; minimumPosts: number }> {
  if (!input.gapAnalysis) return [];

  return input.gapAnalysis.gaps
    .filter((g) => g.priority === 'high' || g.priority === 'medium')
    .map((g) => ({
      type: g.type,
      value: g.value,
      minimumPosts: Math.max(1, g.recommendedCount - g.currentCount),
    }));
}

// ============================================================================
// Agent Definition
// ============================================================================

export const writerAgent: AgentDefinition<WriterInput, WriterOutput> = {
  id: 'writer',
  name: 'Mildred',
  description:
    'Generates viral educational content items using AI, guided by gap analysis.',
  icon: 'pen-tool',
  color: 'text-purple-500',

  canRun(context: AgentContext) {
    if (!context.settings.claudeApiKey) {
      return { ok: false, reason: 'Claude API key is required. Add it in Settings.' };
    }
    return { ok: true };
  },

  async execute(
    input: WriterInput,
    context: AgentContext,
    callbacks: AgentCallbacks
  ): Promise<WriterOutput> {
    let contentItems: DraftItem[] = [];

    // ------------------------------------------------------------------
    // Step 1: Prepare the generation brief
    // ------------------------------------------------------------------
    callbacks.onStepStart('prepare-brief', 'Preparing content generation brief');
    try {
      const subjects =
        input.constraints?.subjects && input.constraints.subjects.length > 0
          ? input.constraints.subjects
          : context.settings.subjects;

      const platforms: Platform[] =
        input.constraints?.platforms && input.constraints.platforms.length > 0
          ? input.constraints.platforms
          : context.settings.platforms;

      const examLevels: ExamLevel[] =
        input.constraints?.levels && input.constraints.levels.length > 0
          ? input.constraints.levels
          : context.settings.levels;

      const pillars: Pillar[] =
        input.constraints?.pillars && input.constraints.pillars.length > 0
          ? input.constraints.pillars
          : ['teach', 'demo', 'psych', 'proof', 'founder', 'trending'];

      const gapDirectives = buildGapDirectives(input);

      // Store params for next step
      const brief = {
        subjects,
        examLevels,
        platforms,
        pillars,
        gapDirectives,
        count: input.count ?? 21,
      };

      callbacks.onStepComplete('prepare-brief', {
        subjects: brief.subjects,
        platforms: brief.platforms,
        count: brief.count,
        gapDirectiveCount: brief.gapDirectives.length,
      });

      if (callbacks.shouldCancel()) {
        return { contentItems: [], summary: 'Cancelled.' };
      }

      // ----------------------------------------------------------------
      // Step 2: Generate content via Claude
      // ----------------------------------------------------------------
      callbacks.onStepStart('generate-content', 'Generating content with AI');

      const batchSize = context.settings.batchSize || 40;

      const userPrompt = buildWriterUserPrompt({
        subjects: brief.subjects,
        examLevels: brief.examLevels,
        platforms: brief.platforms,
        pillars: brief.pillars,
        gapDirectives: brief.gapDirectives,
        batchSize,
      });

      const result = await callAgentClaude<{ contentItems: DraftItem[] }>({
        systemPrompt: WRITER_SYSTEM_PROMPT,
        userPrompt,
        maxTokens: 8192,
        expectJson: true,
      });

      contentItems = (result.contentItems ?? []).map((item) => {
        // Determine contentType from platform using PLATFORM_CONTENT_TYPES
        const platformTypes = PLATFORM_CONTENT_TYPES[item.platform as Platform];
        const resolvedContentType: ContentType =
          (item as Record<string, unknown>).contentType === 'text' && platformTypes?.includes('text')
            ? 'text'
            : platformTypes?.[0] ?? 'video';

        const processed: DraftItem = {
          ...item,
          contentType: resolvedContentType,
          // Preserve new fields from Claude output
          script: (item as Record<string, unknown>).script as string | undefined,
          estimatedDuration: (item as Record<string, unknown>).estimatedDuration as string | undefined,
          body: (item as Record<string, unknown>).body as string | undefined,
          subreddit: (item as Record<string, unknown>).subreddit as string | undefined,
        };

        return processed;
      });

      callbacks.onStepComplete('generate-content', {
        itemCount: contentItems.length,
      });

      if (callbacks.shouldCancel()) {
        return { contentItems, summary: 'Cancelled.' };
      }

      // ----------------------------------------------------------------
      // Step 3: Validate each item against platform constraints
      // ----------------------------------------------------------------
      callbacks.onStepStart('validate-output', 'Validating content against platform rules');

      const allWarnings: string[] = [];

      for (let i = 0; i < contentItems.length; i++) {
        const item = contentItems[i];
        // Build a temporary ContentItem-like object for validateContent
        const tempItem = {
          id: `temp-${i}`,
          day: item.day,
          time: item.time,
          platform: item.platform as string,
          hook: item.hook,
          caption: item.caption,
          hashtags: item.hashtags,
          topic: item.topic,
          subject: item.subject,
          level: item.level,
          pillar: item.pillar as string,
        };

        const validation = validateContent(tempItem);
        if (!validation.valid) {
          allWarnings.push(
            `Item ${i} (${item.platform}, "${item.hook.substring(0, 30)}..."): ${validation.warnings.join('; ')}`
          );
        }
      }

      callbacks.onStepComplete('validate-output', {
        totalItems: contentItems.length,
        itemsWithWarnings: allWarnings.length,
        warnings: allWarnings,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Determine which step is currently running and report the error
      callbacks.onStepError(
        contentItems.length === 0 ? 'generate-content' : 'validate-output',
        message
      );
    }

    // ------------------------------------------------------------------
    // Build summary
    // ------------------------------------------------------------------
    const platformCounts: Record<string, number> = {};
    for (const item of contentItems) {
      platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;
    }
    const platformSummary = Object.entries(platformCounts)
      .map(([p, c]) => `${p}: ${c}`)
      .join(', ');

    const summary = `Generated ${contentItems.length} content items. Platform breakdown: ${platformSummary || 'none'}.`;

    return { contentItems, summary };
  },
};
