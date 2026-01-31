/**
 * Claude API Client for Marketing Command Center
 * Generates viral educational content using Anthropic's Claude API
 */

import {
  SYSTEM_PROMPT,
  CONTENT_GENERATION_PROMPT,
  SINGLE_POST_PROMPT,
  HOOK_VARIATIONS_PROMPT,
  HASHTAG_RESEARCH_PROMPT,
  fillPromptTemplate,
  DEFAULT_VIRAL_FORMULAS,
  PLATFORM_SPECS,
  type Platform,
  type ExamLevel,
  type ContentPillar,
} from './prompts';

// ============================================================================
// Types
// ============================================================================

export interface ContentItem {
  id: string;
  day: string;
  time: string;
  platform: string;
  hook: string;
  caption: string;
  hashtags: string[];
  topic: string;
  subject: string;
  level: ExamLevel;
  pillar: string;
}

export interface WeekSummary {
  totalPosts: number;
  platformBreakdown: Record<string, number>;
  subjectCoverage: string[];
  pillarDistribution: Record<string, number>;
}

export interface WeeklyContentResponse {
  weeklyContent: ContentItem[];
  weekSummary: WeekSummary;
}

export interface ViralFormula {
  creator: string;
  formula: string;
  adaptation?: string;
  title?: string;
  pattern?: string;
}

export interface HookVariation {
  type: string;
  hook: string;
  explanation: string;
}

export interface SinglePostResponse {
  id: string;
  hook: string;
  caption: string;
  hashtags: string[];
  estimatedEngagement: 'high' | 'medium' | 'low';
  viralElements: string[];
}

export interface HashtagResponse {
  highVolume: string[];
  mediumVolume: string[];
  lowVolume: string[];
  recommended: string[];
}

export interface ContentGenerationParams {
  viralFormulas?: ViralFormula[];
  subjects: string[];
  examLevel: ExamLevel;
  platforms: Platform[];
  pillars?: ContentPillar[];
}

export interface ClaudeAPIError {
  type: string;
  message: string;
  status?: number;
}

// ============================================================================
// Constants
// ============================================================================

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 16384; // Increased for larger content generation
const API_VERSION = '2023-06-01';

// ============================================================================
// API Client
// ============================================================================

/**
 * Get the Claude API key from environment variables or localStorage
 */
function getApiKey(): string {
  // First check environment variables
  let apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

  // If not in env, check localStorage (from Settings UI)
  if (!apiKey) {
    try {
      const settings = localStorage.getItem('mcc_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        apiKey = parsed.claudeApiKey;
      }
    } catch {
      // ignore parsing errors
    }
  }

  if (!apiKey) {
    throw new Error(
      'Claude API key not found. Please add it in Settings or set VITE_CLAUDE_API_KEY in your .env file.'
    );
  }

  return apiKey;
}

/**
 * Make a request to the Claude API
 */
async function callClaudeAPI<T>(
  userPrompt: string,
  systemPrompt: string = SYSTEM_PROMPT
): Promise<T> {
  const apiKey = getApiKey();

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ClaudeAPIError = {
      type: errorData.error?.type || 'api_error',
      message: errorData.error?.message || `API request failed: ${response.status}`,
      status: response.status,
    };

    // Handle specific error types
    if (response.status === 401) {
      error.message = 'Invalid API key. Please check your VITE_CLAUDE_API_KEY.';
    } else if (response.status === 429) {
      error.message = 'Rate limit exceeded. Please try again in a moment.';
    } else if (response.status === 500) {
      error.message = 'Claude API server error. Please try again.';
    }

    throw error;
  }

  const data = await response.json();

  // Extract the text content from the response
  const textContent = data.content?.find(
    (block: { type: string }) => block.type === 'text'
  );

  if (!textContent?.text) {
    throw new Error('No text content in Claude response');
  }

  // Parse the JSON response
  try {
    // Clean the response - remove markdown code blocks if present
    let jsonString = textContent.text.trim();

    console.log('Raw Claude response:', jsonString.substring(0, 500) + '...');

    // Remove ```json and ``` markers if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3);
    }

    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3);
    }

    jsonString = jsonString.trim();

    // Try to find JSON object in the response
    const jsonStartIndex = jsonString.indexOf('{');
    const jsonEndIndex = jsonString.lastIndexOf('}');

    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
      jsonString = jsonString.substring(jsonStartIndex, jsonEndIndex + 1);
    }

    return JSON.parse(jsonString) as T;
  } catch (parseError) {
    console.error('Failed to parse Claude response:', textContent.text.substring(0, 1000));
    console.error('Parse error:', parseError);
    throw new Error('Failed to parse JSON response from Claude');
  }
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Generate a full week of viral educational content
 */
export async function generateWeeklyContent(
  params: ContentGenerationParams
): Promise<WeeklyContentResponse> {
  const {
    viralFormulas = DEFAULT_VIRAL_FORMULAS,
    subjects,
    examLevel,
    platforms,
    pillars = [
      'Exam Hacks',
      'Mind-Blown Moments',
      'Common Mistakes',
      'Quick Wins',
      'Motivation',
      'Deep Dives',
    ],
  } = params;

  // Format viral formulas for the prompt
  const formulasText = viralFormulas
    .map(
      (f, i) =>
        `${i + 1}. ${f.creator}: "${f.formula}"${f.adaptation ? ` - Example: "${f.adaptation}"` : ''}`
    )
    .join('\n');

  const prompt = fillPromptTemplate(CONTENT_GENERATION_PROMPT, {
    viralFormulas: formulasText,
    subjects: subjects,
    examLevel: examLevel,
    platforms: platforms,
    pillars: pillars,
  });

  const response = await callClaudeAPI<WeeklyContentResponse>(prompt);

  // Validate and enrich response with unique IDs if needed
  response.weeklyContent = response.weeklyContent.map((item, index) => ({
    ...item,
    id: item.id || `content-${Date.now()}-${index}`,
    level: item.level || examLevel,
  }));

  return response;
}

/**
 * Generate a single viral post
 */
export async function generateSinglePost(params: {
  platform: Platform;
  subject: string;
  topic: string;
  level: ExamLevel;
  pillar: ContentPillar;
  viralFormula?: ViralFormula;
}): Promise<SinglePostResponse> {
  const { platform, subject, topic, level, pillar, viralFormula } = params;

  const formula = viralFormula || DEFAULT_VIRAL_FORMULAS[0];

  const prompt = fillPromptTemplate(SINGLE_POST_PROMPT, {
    platform: platform,
    subject: subject,
    topic: topic,
    level: level,
    pillar: pillar,
    viralFormula: `${formula.creator}: "${formula.formula}"`,
  });

  return callClaudeAPI<SinglePostResponse>(prompt);
}

/**
 * Generate multiple hook variations for A/B testing
 */
export async function generateHookVariations(params: {
  topic: string;
  subject: string;
  level: ExamLevel;
  platform: Platform;
}): Promise<{ hooks: HookVariation[] }> {
  const { topic, subject, level, platform } = params;

  const prompt = fillPromptTemplate(HOOK_VARIATIONS_PROMPT, {
    topic,
    subject,
    level,
    platform,
  });

  return callClaudeAPI<{ hooks: HookVariation[] }>(prompt);
}

/**
 * Get optimized hashtags for a post
 */
export async function generateHashtags(params: {
  subject: string;
  topic: string;
  platform: Platform;
  level: ExamLevel;
}): Promise<HashtagResponse> {
  const { subject, topic, platform, level } = params;

  const prompt = fillPromptTemplate(HASHTAG_RESEARCH_PROMPT, {
    subject,
    topic,
    platform,
    level,
  });

  return callClaudeAPI<HashtagResponse>(prompt);
}

/**
 * Regenerate content for a specific item with new parameters
 */
export async function regenerateContent(
  originalContent: ContentItem,
  tweaks?: {
    newViralFormula?: ViralFormula;
    adjustTone?: string;
    focusOn?: string;
  }
): Promise<SinglePostResponse> {
  let additionalContext = '';

  if (tweaks?.newViralFormula) {
    additionalContext += `\nUse this viral formula: ${tweaks.newViralFormula.creator} - "${tweaks.newViralFormula.formula}"`;
  }

  if (tweaks?.adjustTone) {
    additionalContext += `\nAdjust the tone to be more: ${tweaks.adjustTone}`;
  }

  if (tweaks?.focusOn) {
    additionalContext += `\nFocus more on: ${tweaks.focusOn}`;
  }

  const prompt = `Regenerate this content with improvements:

Original:
- Platform: ${originalContent.platform}
- Topic: ${originalContent.topic}
- Subject: ${originalContent.subject}
- Level: ${originalContent.level}
- Hook: "${originalContent.hook}"
- Caption: "${originalContent.caption}"
${additionalContext}

Create an improved version that:
1. Has a stronger, more scroll-stopping hook
2. Delivers more value in the caption
3. Better hashtag strategy

RESPOND WITH VALID JSON ONLY:
{
  "id": "${originalContent.id}-v2",
  "hook": "New improved hook",
  "caption": "New improved caption",
  "hashtags": ["better", "hashtags"],
  "estimatedEngagement": "high/medium/low",
  "viralElements": ["elements", "used"]
}`;

  return callClaudeAPI<SinglePostResponse>(prompt);
}

/**
 * Check if the API is configured and working
 */
export async function healthCheck(): Promise<{
  status: 'ok' | 'error';
  message: string;
}> {
  try {
    getApiKey();

    // Make a minimal API call to verify the key works
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getApiKey(),
        'anthropic-version': API_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    if (response.ok) {
      return { status: 'ok', message: 'Claude API is configured and working' };
    } else if (response.status === 401) {
      return { status: 'error', message: 'Invalid API key' };
    } else {
      return {
        status: 'error',
        message: `API returned status ${response.status}`,
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get platform specifications
 */
export function getPlatformSpecs(platform: Platform) {
  return PLATFORM_SPECS[platform];
}

/**
 * Get all available platforms
 */
export function getAvailablePlatforms(): Platform[] {
  return Object.keys(PLATFORM_SPECS) as Platform[];
}

/**
 * Get default viral formulas
 */
export function getDefaultViralFormulas(): ViralFormula[] {
  return DEFAULT_VIRAL_FORMULAS;
}

/**
 * Validate content against platform constraints
 */
export function validateContent(
  content: ContentItem
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const specs = PLATFORM_SPECS[content.platform as Platform];

  if (!specs) {
    return { valid: true, warnings: ['Unknown platform'] };
  }

  if (content.caption.length > specs.maxCaptionLength) {
    warnings.push(
      `Caption exceeds ${specs.maxCaptionLength} characters for ${content.platform}`
    );
  }

  if (content.hashtags.length > specs.maxHashtags) {
    warnings.push(
      `Too many hashtags (${content.hashtags.length}) for ${content.platform}. Max: ${specs.maxHashtags}`
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// ============================================================================
// Export Types
// ============================================================================

export type {
  Platform,
  ExamLevel,
  ContentPillar,
};
