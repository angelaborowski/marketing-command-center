/**
 * Server-Side Content Validation
 *
 * Same validateContent logic as src/lib/claude.ts but without
 * the browser-dependent getApiKey/chatWithAssistant functions.
 */

import { PLATFORM_SPECS, type Platform } from '../src/lib/prompts';

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
