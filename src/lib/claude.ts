/**
 * Claude API Client for Marketing Command Center
 * Handles content validation and the content assistant chat.
 */

import { PLATFORM_SPECS, type Platform } from './prompts';
import { CONTENT_ASSISTANT_PROMPT } from './assistantPrompts';

// ============================================================================
// Types
// ============================================================================

export interface ClaudeAPIError {
  type: string;
  message: string;
  status?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ============================================================================
// Constants
// ============================================================================

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const API_VERSION = '2023-06-01';

// ============================================================================
// Internal Helpers
// ============================================================================

function getApiKey(): string {
  let apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

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

// ============================================================================
// Content Validation
// ============================================================================

export function validateContent(
  content: { platform: string; caption: string; hashtags: string[] }
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
// Content Assistant Chat
// ============================================================================

export async function chatWithAssistant(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const apiKey = getApiKey();

  const messages = [
    ...history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: message },
  ];

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
      max_tokens: 2048,
      system: CONTENT_ASSISTANT_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
  }

  const data = await response.json();
  const textContent = data.content?.find(
    (block: { type: string }) => block.type === 'text'
  );

  if (!textContent?.text) {
    throw new Error('No response from assistant');
  }

  return textContent.text;
}
