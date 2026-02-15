/**
 * Agent Implementations Index
 *
 * Imports all agent definitions and registers them with the central
 * agent registry. Consumers should import this module to ensure all
 * agents are available for lookup.
 */

import { registerAgent } from '../registry';
import { writerAgent } from './writerAgent';
import { schedulerAgent } from './schedulerAgent';

// ============================================================================
// Registration
// ============================================================================

/**
 * Register all agent definitions with the central registry.
 * Safe to call multiple times; each call overwrites previous registrations
 * for the same agent id.
 */
export function registerAllAgents(): void {
  registerAgent(writerAgent);
  registerAgent(schedulerAgent);
}

// Register all agents on module import so they are immediately available
registerAllAgents();

// ============================================================================
// Re-exports for convenience
// ============================================================================

export { writerAgent } from './writerAgent';
export { schedulerAgent } from './schedulerAgent';
