/**
 * AgentProgress Component
 *
 * Fixed right-side panel displayed during pipeline/agent execution.
 * Shows real-time step progress with animated status indicators.
 * Follows the scheduling panel pattern from MarketingCommandCenter.
 */

import { useState, useEffect } from 'react';
import {
  X,
  Check,
  Loader2,
  Circle,
  AlertCircle,
  ChevronDown,
  StopCircle,
  Bot,
  Clock,
} from 'lucide-react';
import type { PipelineRun, AgentRun, AgentStep, AgentId } from '../lib/agents/types';

// ============================================================================
// Props
// ============================================================================

interface AgentProgressProps {
  run: PipelineRun;
  onCancel: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const AGENT_NAMES: Record<AgentId, string> = {
  writer: 'Mildred (Writer)',
  scheduler: 'Bernard (Scheduler)',
};

// ============================================================================
// Helpers
// ============================================================================

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <Check size={14} className="text-emerald-600" />;
    case 'running':
      return <Loader2 size={14} className="text-blue-600 animate-spin" />;
    case 'failed':
      return <AlertCircle size={14} className="text-red-500" />;
    case 'cancelled':
      return <StopCircle size={14} className="text-amber-500" />;
    default:
      return <Circle size={14} className="text-[#d1d5db]" />;
  }
}

function getStatusBgColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50 border-emerald-200';
    case 'running':
      return 'bg-blue-50 border-blue-200';
    case 'failed':
      return 'bg-red-50 border-red-200';
    case 'cancelled':
      return 'bg-amber-50 border-amber-200';
    default:
      return 'bg-[#f3f4f6] border-[#e5e7eb]';
  }
}

function formatElapsed(startedAt: string): string {
  const startMs = new Date(startedAt).getTime();
  const elapsed = Date.now() - startMs;
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// ============================================================================
// Sub-components
// ============================================================================

function StepList({ steps }: { steps: AgentStep[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="ml-4 mt-2 space-y-1.5">
      {steps.map((step) => (
        <div
          key={step.id}
          className="flex items-center gap-2 text-[11px]"
        >
          {getStatusIcon(step.status)}
          <span
            className={`${
              step.status === 'running'
                ? 'text-blue-700 font-medium'
                : step.status === 'completed'
                ? 'text-[#6b7280]'
                : step.status === 'failed'
                ? 'text-red-600'
                : 'text-[#9ca3af]'
            }`}
          >
            {step.label}
          </span>
          {step.error && (
            <span className="text-[10px] text-red-500 truncate max-w-[150px]">
              {step.error}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function AgentRunCard({ agentRun }: { agentRun: AgentRun }) {
  const [expanded, setExpanded] = useState(
    agentRun.status === 'running' || agentRun.status === 'failed'
  );

  // Auto-expand when running
  useEffect(() => {
    if (agentRun.status === 'running') {
      setExpanded(true);
    }
  }, [agentRun.status]);

  const agentName = AGENT_NAMES[agentRun.agentId] ?? agentRun.agentId;
  const hasSteps = agentRun.steps.length > 0;

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${getStatusBgColor(
        agentRun.status
      )}`}
    >
      <button
        onClick={() => hasSteps && setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left"
      >
        {getStatusIcon(agentRun.status)}
        <span className="text-[12px] font-medium text-[#1a1a1a] flex-1">
          {agentName}
        </span>
        {agentRun.durationMs != null && agentRun.status !== 'running' && (
          <span className="text-[10px] text-[#9ca3af]">
            {Math.round(agentRun.durationMs / 1000)}s
          </span>
        )}
        {hasSteps && (
          <ChevronDown
            size={12}
            className={`text-[#9ca3af] transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {expanded && hasSteps && <StepList steps={agentRun.steps} />}

      {agentRun.error && (
        <p className="mt-2 text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded">
          {agentRun.error}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AgentProgress({ run, onCancel }: AgentProgressProps) {
  const [elapsed, setElapsed] = useState('0s');

  // Update elapsed timer every second while running
  useEffect(() => {
    if (run.status !== 'running') return;

    const update = () => setElapsed(formatElapsed(run.startedAt));
    update();

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [run.status, run.startedAt]);

  const isActive = run.status === 'running';
  const pipelineLabel = run.pipelineId
    ? run.pipelineId
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'Agent Run';

  return (
    <div className="fixed right-6 top-20 w-80 bg-white rounded-xl border border-[#e5e7eb] shadow-xl z-50 flex flex-col max-h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {isActive ? (
            <Loader2 size={16} className="text-blue-600 animate-spin" />
          ) : (
            <Bot size={16} className="text-[#6b7280]" />
          )}
          <div>
            <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
              {pipelineLabel}
            </h3>
            <p className="text-[10px] text-[#6b7280] mt-0.5">
              {isActive
                ? `Running step ${run.currentStepIndex + 1}...`
                : run.status === 'completed'
                ? 'Completed'
                : run.status === 'failed'
                ? 'Failed'
                : 'Cancelled'}
            </p>
          </div>
        </div>
        {!isActive && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-[#f3f4f6] rounded-lg transition-colors"
          >
            <X size={16} className="text-[#6b7280]" />
          </button>
        )}
      </div>

      {/* Agent runs */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {run.agentRuns.length === 0 && isActive && (
          <div className="py-6 text-center">
            <Loader2 size={20} className="text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-[11px] text-[#6b7280]">Initializing...</p>
          </div>
        )}

        {run.agentRuns.map((agentRun) => (
          <AgentRunCard key={agentRun.id} agentRun={agentRun} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#e5e7eb] bg-[#fafafa] rounded-b-xl flex items-center justify-between shrink-0">
        <span className="text-[11px] text-[#6b7280] flex items-center gap-1.5">
          <Clock size={12} />
          {elapsed}
        </span>

        {isActive ? (
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[11px] font-medium transition-colors border border-red-200"
          >
            <StopCircle size={12} />
            Cancel
          </button>
        ) : (
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              run.status === 'completed'
                ? 'bg-emerald-50 text-emerald-600'
                : run.status === 'failed'
                ? 'bg-red-50 text-red-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            {run.status}
          </span>
        )}
      </div>
    </div>
  );
}

