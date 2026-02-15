/**
 * Claude API Client for the Agent Framework
 *
 * Thin wrapper around the Anthropic Messages API, replicating the same
 * patterns used in src/lib/claude.ts (auth, headers, JSON extraction).
 * Each agent calls this instead of building its own fetch logic.
 */

// ============================================================================
// Types
// ============================================================================

export interface AgentClaudeParams {
  /** The system prompt that defines agent behaviour */
  systemPrompt: string;
  /** The user-facing prompt (task description, data payload, etc.) */
  userPrompt: string;
  /** Maximum tokens to generate (default 4096) */
  maxTokens?: number;
  /** When true the response is parsed as JSON; when false the raw text is returned */
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

/**
 * Retrieve the Claude API key from environment variables or localStorage.
 * Mirrors the lookup order in src/lib/claude.ts.
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
 * Strip markdown code-fence wrappers and locate the outermost JSON object
 * in a raw response string.  Returns the cleaned JSON string.
 */
function extractJsonString(raw: string): string {
  let text = raw.trim();

  // Remove ```json and ``` markers if present
  if (text.startsWith('```json')) {
    text = text.slice(7);
  } else if (text.startsWith('```')) {
    text = text.slice(3);
  }

  if (text.endsWith('```')) {
    text = text.slice(0, -3);
  }

  text = text.trim();

  // Try to find JSON object in the response
  const jsonStartIndex = text.indexOf('{');
  const jsonEndIndex = text.lastIndexOf('}');

  if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
    text = text.substring(jsonStartIndex, jsonEndIndex + 1);
  }

  return text;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Call the Claude API on behalf of an agent.
 *
 * @template T - The expected return type. When `expectJson` is false the
 *   caller should use `{ text: string }` as T.
 * @param params - System prompt, user prompt, and optional configuration.
 * @returns Parsed JSON of type T, or `{ text: string }` when expectJson is
 *   false.
 */
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
      'anthropic-dangerous-direct-browser-access': 'true',
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

  // ---- Error handling (mirrors src/lib/claude.ts) ----
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: AgentClaudeError = {
      type: errorData.error?.type || 'api_error',
      message: errorData.error?.message || `API request failed: ${response.status}`,
      status: response.status,
    };

    if (response.status === 401) {
      error.message = 'Invalid API key. Please check your VITE_CLAUDE_API_KEY.';
    } else if (response.status === 429) {
      error.message = 'Rate limit exceeded. Please try again in a moment.';
    } else if (response.status === 500) {
      error.message = 'Claude API server error. Please try again.';
    }

    throw error;
  }

  // ---- Extract text content from response ----
  const data = await response.json();

  const textContent = data.content?.find(
    (block: { type: string }) => block.type === 'text'
  );

  if (!textContent?.text) {
    throw new Error('No text content in Claude response');
  }

  // ---- Return plain text when JSON is not expected ----
  if (!expectJson) {
    return { text: textContent.text } as unknown as T;
  }

  // ---- Parse JSON (same extraction logic as src/lib/claude.ts) ----
  try {
    const jsonString = extractJsonString(textContent.text);
    return JSON.parse(jsonString) as T;
  } catch (parseError) {
    console.error('Failed to parse Claude response:', textContent.text.substring(0, 1000));
    console.error('Parse error:', parseError);
    throw new Error('Failed to parse JSON response from Claude');
  }
}
