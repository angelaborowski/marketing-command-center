/**
 * Agent Registry
 *
 * Central catalogue of all available AgentDefinitions.  Agents register
 * themselves at module load time via `registerAgent()`, and consumers
 * (pipelines, UI) look them up by id through `getAgentDefinition()`.
 */

import type { AgentId, AgentDefinition } from './types';

// ============================================================================
// Internal Store
// ============================================================================

const agents: Map<AgentId, AgentDefinition> = new Map();

// ============================================================================
// Public API
// ============================================================================

/**
 * Register an agent definition.  Overwrites any previous registration
 * with the same id.
 *
 * @param agent - The AgentDefinition to register.
 */
export function registerAgent(agent: AgentDefinition): void {
  agents.set(agent.id, agent);
}

/**
 * Retrieve a registered agent definition by its id.
 *
 * @param id - The AgentId to look up.
 * @returns The matching AgentDefinition, or undefined if not registered.
 */
export function getAgentDefinition(id: AgentId): AgentDefinition | undefined {
  return agents.get(id);
}

/**
 * Return all registered agent definitions.
 *
 * @returns An array of every AgentDefinition currently in the registry.
 */
export function getAllAgents(): AgentDefinition[] {
  return Array.from(agents.values());
}
