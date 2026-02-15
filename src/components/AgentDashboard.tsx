/**
 * AgentDashboard Component
 *
 * Main agents view displaying available pipelines, individual agents,
 * and a history of recent runs. Follows the existing design system
 * with white cards, #e5e7eb borders, and 12-13px text.
 */

import { useState } from 'react';
import {
  Pen,
  Clock,
  Sparkles,
  ChevronDown,
  Play,
  Bot,
} from 'lucide-react';
import type { AgentId, PipelineId, AgentResultEntry } from '../lib/agents/types';
import type { PipelineRun } from '../lib/agents/types';
import type { Settings } from '../types';
import { PIPELINES } from '../lib/agents/pipelines';

// ============================================================================
// Props
// ============================================================================

interface AgentDashboardProps {
  currentRun: PipelineRun | null;
  isRunning: boolean;
  runHistory: AgentResultEntry[];
  onStartPipeline: (pipelineId: PipelineId) => void;
  onStartAgent: (agentId: AgentId, input: unknown) => void;
  onCancelRun: () => void;
  settings: Settings;
}

// ============================================================================
// Constants
// ============================================================================

const PIPELINE_ICONS: Record<string, typeof Sparkles> = {
  Sparkles,
};

const AGENT_CONFIG: Record<
  AgentId,
  { name: string; description: string; icon: typeof Pen; color: string; bgColor: string }
> = {
  writer: {
    name: 'Mildred',
    description: 'Generates hooks, scripts, captions, and text posts',
    icon: Pen,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  scheduler: {
    name: 'Bernard',
    description: 'Assigns optimal posting times across the week',
    icon: Clock,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
};

const AGENT_IDS: AgentId[] = ['writer', 'scheduler'];

// ============================================================================
// Helpers
// ============================================================================

function getAgentNames(pipelineId: PipelineId): string[] {
  const pipeline = PIPELINES[pipelineId];
  if (!pipeline) return [];
  return pipeline.steps.map((step) => AGENT_CONFIG[step.agentId]?.name ?? step.agentId);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  } catch {
    return iso;
  }
}

// ============================================================================
// Component
// ============================================================================

export default function AgentDashboard({
  currentRun,
  isRunning,
  runHistory,
  onStartPipeline,
  onStartAgent,
  onCancelRun,
  settings,
}: AgentDashboardProps) {
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const pipelineIds = Object.keys(PIPELINES) as PipelineId[];

  return (
    <div className="max-w-5xl mx-auto space-y-8 fade-in">
      {/* Pipelines Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-[#6b7280]" />
          <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Pipelines</h2>
          <span className="text-[11px] text-[#9ca3af]">
            Chain multiple agents together
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {pipelineIds.map((pipelineId) => {
            const pipeline = PIPELINES[pipelineId];
            const IconComponent = PIPELINE_ICONS[pipeline.icon] || Rocket;
            const agentNames = getAgentNames(pipelineId);

            return (
              <div
                key={pipelineId}
                className="bg-white rounded-xl border border-[#e5e7eb] p-5 card-hover"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <IconComponent size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
                        {pipeline.name}
                      </h3>
                      <p className="text-[11px] text-[#6b7280] mt-0.5 leading-relaxed">
                        {pipeline.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step preview */}
                <div className="flex items-center gap-1 mb-4 flex-wrap">
                  {agentNames.map((name, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#6b7280]">
                        {name}
                      </span>
                      {idx < agentNames.length - 1 && (
                        <span className="text-[#d1d5db] text-[10px]">&rarr;</span>
                      )}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => onStartPipeline(pipelineId)}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#211d1d] hover:bg-[#352f2f] disabled:bg-[#e5e7eb] disabled:text-[#9ca3af] text-white rounded-lg text-[12px] font-medium transition-colors w-full justify-center"
                >
                  <Play size={12} />
                  {isRunning ? 'Running...' : 'Run Pipeline'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Individual Agents Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Bot size={16} className="text-[#6b7280]" />
          <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Individual Agents</h2>
          <span className="text-[11px] text-[#9ca3af]">
            Run a single agent with custom input
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {AGENT_IDS.map((agentId) => {
            const config = AGENT_CONFIG[agentId];
            const IconComponent = config.icon;

            return (
              <div
                key={agentId}
                className="bg-white rounded-xl border border-[#e5e7eb] p-4 card-hover"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}
                  >
                    <IconComponent size={16} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[12px] font-semibold text-[#1a1a1a]">
                      {config.name}
                    </h3>
                    <p className="text-[10px] text-[#6b7280] mt-0.5 truncate">
                      {config.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onStartAgent(agentId, {})}
                  disabled={isRunning}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors w-full justify-center border ${
                    isRunning
                      ? 'bg-[#f3f4f6] text-[#9ca3af] border-[#e5e7eb] cursor-not-allowed'
                      : `${config.bgColor} ${config.color} border-transparent hover:border-current`
                  }`}
                >
                  <Play size={10} />
                  Run
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Runs Section */}
      <section>
        <button
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="flex items-center gap-2 mb-4 group"
        >
          <Clock size={16} className="text-[#6b7280]" />
          <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Recent Runs</h2>
          <span className="text-[11px] text-[#9ca3af]">
            {runHistory.length} runs
          </span>
          <ChevronDown
            size={14}
            className={`text-[#9ca3af] transition-transform ${historyExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {historyExpanded && (
          <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
            {runHistory.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#f3f4f6] flex items-center justify-center">
                  <Clock size={18} className="text-[#9ca3af]" />
                </div>
                <p className="text-[13px] text-[#6b7280]">No runs yet</p>
                <p className="text-[11px] text-[#9ca3af] mt-1">
                  Start a pipeline or agent to see results here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#e5e7eb]">
                {runHistory.map((entry) => {
                  const agentConfig = AGENT_CONFIG[entry.agentId];
                  const IconComponent = agentConfig?.icon || Bot;

                  return (
                    <div
                      key={entry.id}
                      className="px-5 py-3 flex items-center gap-4 hover:bg-[#fafafa] transition-colors"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg ${
                          agentConfig?.bgColor || 'bg-[#f3f4f6]'
                        } flex items-center justify-center`}
                      >
                        <IconComponent
                          size={14}
                          className={agentConfig?.color || 'text-[#6b7280]'}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#1a1a1a]">
                          {agentConfig?.name || entry.agentId}
                        </p>
                        <p className="text-[10px] text-[#9ca3af]">
                          {formatTimestamp(entry.timestamp)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[#9ca3af]">
                          {formatDuration(entry.durationMs)}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            entry.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
