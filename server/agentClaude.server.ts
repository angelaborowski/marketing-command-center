/**
 * Server-Side Claude API Client
 *
 * Same signature as src/lib/agents/agentClaude.ts but reads the API key
 * from process.env and does NOT use the dangerous-direct-browser-access header.
 */

// ============================================================================
// Types
// ============================================================================

export interface AgentClaudeParams {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  expectJson?: boolean;
}

export interface AgentClaudeError {
  type: string;
  message: string;
  status?: number;
}

// ============================================================================
// Constants
// ============================================================================

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const API_VERSION = '2023-06-01';
const DEFAULT_MAX_TOKENS = 4096;

// ============================================================================
// Internals
// ============================================================================

function getApiKey(): string {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'CLAUDE_API_KEY not set in environment. Add it to your .env file.'
    );
  }
  return apiKey;
}

function extractJsonString(raw: string): string {
  let text = raw.trim();

  if (text.startsWith('```json')) {
    text = text.slice(7);
  } else if (text.startsWith('```')) {
    text = text.slice(3);
  }

  if (text.endsWith('```')) {
    text = text.slice(0, -3);
  }

  text = text.trim();

  const jsonStartIndex = text.indexOf('{');
  const jsonEndIndex = text.lastIndexOf('}');

  if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
    text = text.substring(jsonStartIndex, jsonEndIndex + 1);
  }

  return text;
}

/**
 * Try to recover a truncated JSON array response.
 * If the response was cut off mid-array, close the array/object
 * and parse what we have.
 */
function tryRecoverTruncatedJson<T>(raw: string): T | null {
  let text = raw.trim();

  // Strip code fences
  if (text.startsWith('```json')) text = text.slice(7);
  else if (text.startsWith('```')) text = text.slice(3);
  if (text.endsWith('```')) text = text.slice(0, -3);
  text = text.trim();

  // Find the start of the JSON object
  const start = text.indexOf('{');
  if (start === -1) return null;
  text = text.substring(start);

  // Find the last complete object in the array (ends with })
  const lastCompleteObj = text.lastIndexOf('}');
  if (lastCompleteObj === -1) return null;

  text = text.substring(0, lastCompleteObj + 1);

  // Close any unclosed arrays and objects
  const openBrackets = (text.match(/\[/g) || []).length;
  const closeBrackets = (text.match(/\]/g) || []).length;
  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;

  // Add missing closing brackets/braces
  for (let i = 0; i < openBrackets - closeBrackets; i++) text += ']';
  for (let i = 0; i < openBraces - closeBraces; i++) text += '}';

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ============================================================================
// Public API
// ============================================================================

export async function callAgentClaude<T>(params: AgentClaudeParams): Promise<T> {
  const {
    systemPrompt,
    userPrompt,
    maxTokens = DEFAULT_MAX_TOKENS,
    expectJson = true,
  } = params;

  const apiKey = getApiKey();

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
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
    const error: AgentClaudeError = {
      type: errorData.error?.type || 'api_error',
      message: errorData.error?.message || `API request failed: ${response.status}`,
      status: response.status,
    };

    if (response.status === 401) {
      error.message = 'Invalid API key. Please check your CLAUDE_API_KEY.';
    } else if (response.status === 429) {
      error.message = 'Rate limit exceeded. Please try again in a moment.';
    } else if (response.status === 500) {
      error.message = 'Claude API server error. Please try again.';
    }

    throw error;
  }

  const data = await response.json();

  const textContent = data.content?.find(
    (block: { type: string }) => block.type === 'text'
  );

  if (!textContent?.text) {
    throw new Error('No text content in Claude response');
  }

  if (!expectJson) {
    return { text: textContent.text } as unknown as T;
  }

  try {
    const jsonString = extractJsonString(textContent.text);
    return JSON.parse(jsonString) as T;
  } catch (parseError) {
    // Try to recover truncated JSON (common with large batch responses)
    console.warn('[SERVER] Standard JSON parse failed, attempting truncation recovery...');
    const recovered = tryRecoverTruncatedJson<T>(textContent.text);
    if (recovered) {
      console.log('[SERVER] Successfully recovered truncated JSON response');
      return recovered;
    }
    console.error('[SERVER] Failed to parse Claude response:', textContent.text.substring(0, 500));
    console.error('[SERVER] Parse error:', parseError);
    throw new Error('Failed to parse JSON response from Claude');
  }
}
