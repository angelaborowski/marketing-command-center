/**
 * AgentResults Component
 *
 * Modal shown after a pipeline or agent run completes. Allows the user
 * to review generated content, insights, and a run summary. Follows
 * the ContentGapPanel modal pattern.
 */

import { useState, useMemo } from 'react';
import {
  X,
  Check,
  FileText,
  CheckSquare,
  Square,
  Plus,
  Clock,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import type {
  PipelineRun,
  AgentRun,
  WriterOutput,
  AgentId,
} from '../lib/agents/types';
import type { ContentItem, Platform } from '../types';
import { PLATFORMS } from '../types';

// ============================================================================
// Props
// ============================================================================

interface AgentResultsProps {
  isOpen: boolean;
  onClose: () => void;
  run: PipelineRun;
  onApproveContent: (
    items: Array<Omit<ContentItem, 'id' | 'filmed' | 'posted'>>
  ) => void;
}

// ============================================================================
// Types
// ============================================================================

type Tab = 'content' | 'summary';

interface ExtractedContent {
  items: Array<Omit<ContentItem, 'id' | 'filmed' | 'posted'>>;
  source: 'writer' | 'scheduler';
}

// ============================================================================
// Helpers
// ============================================================================

const AGENT_NAMES: Record<AgentId, string> = {
  writer: 'Mildred',
  scheduler: 'Bernard',
};

function extractContent(agentRuns: AgentRun[]): ExtractedContent | null {
  // Prefer scheduler output (has assigned times), fall back to writer output
  for (let i = agentRuns.length - 1; i >= 0; i--) {
    const run = agentRuns[i];
    if (run.agentId === 'scheduler' && run.status === 'completed' && run.output) {
      const output = run.output as { scheduledItems?: Array<Omit<ContentItem, 'id' | 'filmed' | 'posted'>> };
      if (output.scheduledItems && output.scheduledItems.length > 0) {
        return {
          items: output.scheduledItems,
          source: 'scheduler',
        };
      }
    }
  }

  for (let i = agentRuns.length - 1; i >= 0; i--) {
    const run = agentRuns[i];
    if (run.agentId === 'writer' && run.status === 'completed' && run.output) {
      const output = run.output as WriterOutput;
      if (output.contentItems && output.contentItems.length > 0) {
        return {
          items: output.contentItems,
          source: 'writer',
        };
      }
    }
  }

  return null;
}

function formatDuration(startedAt: string, completedAt?: string): string {
  if (!completedAt) return '--';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getPlatformBadgeClass(platform: Platform): string {
  switch (platform) {
    case 'tiktok':
      return 'bg-gradient-to-r from-pink-500 to-red-500 text-white';
    case 'shorts':
      return 'bg-red-500 text-white';
    case 'reels':
      return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    case 'facebook':
      return 'bg-blue-600 text-white';
    case 'linkedin':
      return 'bg-sky-700 text-white';
    case 'snapchat':
      return 'bg-yellow-400 text-black';
    case 'ytlong':
      return 'bg-red-600 text-white';
    default:
      return 'bg-[#f3f4f6] text-[#6b7280]';
  }
}

// ============================================================================
// Component
// ============================================================================

export default function AgentResults({
  isOpen,
  onClose,
  run,
  onApproveContent,
}: AgentResultsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Extract data from the pipeline run
  const content = useMemo(() => extractContent(run.agentRuns), [run.agentRuns]);

  // Auto-select all on mount
  useMemo(() => {
    if (content) {
      setSelectedIndices(new Set(content.items.map((_, i) => i)));
    }
  }, [content]);

  if (!isOpen) return null;

  // Determine which tab to show if content tab has no content
  const hasContent = content && content.items.length > 0;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'content', label: 'Content', count: content?.items.length },
    { id: 'summary', label: 'Summary' },
  ];

  // Selection handlers
  const toggleItem = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (content) {
      setSelectedIndices(new Set(content.items.map((_, i) => i)));
    }
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleApprove = () => {
    if (!content) return;
    const selected = content.items.filter((_, i) => selectedIndices.has(i));
    if (selected.length > 0) {
      onApproveContent(selected);
      onClose();
    }
  };

  // Summary stats
  const totalDuration = formatDuration(run.startedAt, run.completedAt);
  const agentsRun = run.agentRuns.length;
  const completedAgents = run.agentRuns.filter(
    (r) => r.status === 'completed'
  ).length;
  const failedAgents = run.agentRuns.filter(
    (r) => r.status === 'failed'
  ).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#1a1a1a]">
                Agent Results
              </h2>
              <p className="text-[11px] text-[#6b7280]">
                {run.status === 'completed'
                  ? 'Pipeline completed successfully'
                  : run.status === 'failed'
                  ? 'Pipeline encountered errors'
                  : 'Pipeline was cancelled'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f3f4f6] rounded-lg transition-colors"
          >
            <X size={20} className="text-[#6b7280]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-[#e5e7eb] flex gap-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-[12px] font-medium rounded-t-lg transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-[#211d1d] border-[#211d1d] bg-blue-50/50'
                  : 'text-[#6b7280] border-transparent hover:text-[#1a1a1a] hover:bg-[#f3f4f6]'
              }`}
            >
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span
                  className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-[#f3f4f6] text-[#9ca3af]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div>
              {!hasContent ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#f3f4f6] flex items-center justify-center">
                    <FileText size={20} className="text-[#9ca3af]" />
                  </div>
                  <p className="text-[13px] text-[#6b7280]">
                    No content items generated
                  </p>
                  <p className="text-[11px] text-[#9ca3af] mt-1">
                    This pipeline did not produce content items
                  </p>
                </div>
              ) : (
                <>
                  {/* Selection controls */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={selectAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#6b7280] hover:text-[#1a1a1a] bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-lg transition-colors"
                      >
                        <CheckSquare size={12} />
                        Select All
                      </button>
                      <button
                        onClick={deselectAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#6b7280] hover:text-[#1a1a1a] bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-lg transition-colors"
                      >
                        <Square size={12} />
                        Deselect All
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#9ca3af]">
                        {selectedIndices.size} of {content.items.length} selected
                      </span>
                      {content.qualityScore != null && (
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            content.qualityScore >= 80
                              ? 'bg-emerald-50 text-emerald-600'
                              : content.qualityScore >= 60
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          Quality: {content.qualityScore}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content items */}
                  <div className="space-y-2">
                    {content.items.map((item, idx) => {
                      const isSelected = selectedIndices.has(idx);

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleItem(idx)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-300 bg-blue-50/50'
                              : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {isSelected ? (
                                <CheckSquare
                                  size={16}
                                  className="text-[#211d1d]"
                                />
                              ) : (
                                <Square
                                  size={16}
                                  className="text-[#d1d5db]"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPlatformBadgeClass(
                                    item.platform
                                  )}`}
                                >
                                  {PLATFORMS[item.platform]?.name ||
                                    item.platform}
                                </span>
                                {item.day && (
                                  <span className="text-[10px] text-[#9ca3af]">
                                    {item.day}
                                  </span>
                                )}
                                {item.time && (
                                  <span className="text-[10px] text-[#9ca3af]">
                                    {item.time}
                                  </span>
                                )}
                                {item.level && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f3f4f6] text-[#6b7280]">
                                    {item.level}
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] font-medium text-[#1a1a1a] mb-1">
                                {item.hook}
                              </p>
                              {item.caption && (
                                <p className="text-[11px] text-[#6b7280] line-clamp-2">
                                  {item.caption}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Pipeline overview */}
              <div className="p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
                <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-4">
                  Run Overview
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg border border-[#e5e7eb]">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-[#9ca3af]" />
                      <span className="text-[11px] text-[#6b7280]">
                        Duration
                      </span>
                    </div>
                    <p className="text-[15px] font-semibold text-[#1a1a1a]">
                      {totalDuration}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-[#e5e7eb]">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot size={14} className="text-[#9ca3af]" />
                      <span className="text-[11px] text-[#6b7280]">
                        Agents Run
                      </span>
                    </div>
                    <p className="text-[15px] font-semibold text-[#1a1a1a]">
                      {completedAgents}/{agentsRun}
                      {failedAgents > 0 && (
                        <span className="text-[11px] text-red-500 ml-1">
                          ({failedAgents} failed)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-[#e5e7eb]">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-[#9ca3af]" />
                      <span className="text-[11px] text-[#6b7280]">
                        Items Generated
                      </span>
                    </div>
                    <p className="text-[15px] font-semibold text-[#1a1a1a]">
                      {content?.items.length ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-[#e5e7eb]">
                    <div className="flex items-center gap-2 mb-1">
                      <Check size={14} className="text-[#9ca3af]" />
                      <span className="text-[11px] text-[#6b7280]">
                        Quality Score
                      </span>
                    </div>
                    <p className="text-[15px] font-semibold text-[#1a1a1a]">
                      {content?.qualityScore != null
                        ? `${content.qualityScore}%`
                        : '--'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Agent breakdown */}
              <div>
                <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-3">
                  Agent Breakdown
                </h3>
                <div className="space-y-2">
                  {run.agentRuns.map((agentRun) => (
                    <div
                      key={agentRun.id}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#e5e7eb]"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          agentRun.status === 'completed'
                            ? 'bg-emerald-500'
                            : agentRun.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span className="text-[12px] font-medium text-[#1a1a1a] flex-1">
                        {AGENT_NAMES[agentRun.agentId] ?? agentRun.agentId}
                      </span>
                      <span className="text-[10px] text-[#9ca3af]">
                        {agentRun.steps.length} steps
                      </span>
                      <span className="text-[10px] text-[#9ca3af]">
                        {agentRun.durationMs != null
                          ? `${Math.round(agentRun.durationMs / 1000)}s`
                          : '--'}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          agentRun.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600'
                            : agentRun.status === 'failed'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {agentRun.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Errors */}
              {failedAgents > 0 && (
                <div>
                  <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500" />
                    Errors
                  </h3>
                  <div className="space-y-2">
                    {run.agentRuns
                      .filter((r) => r.status === 'failed' && r.error)
                      .map((r) => (
                        <div
                          key={r.id}
                          className="p-3 bg-red-50 rounded-lg border border-red-200"
                        >
                          <p className="text-[12px] font-medium text-red-700 mb-1">
                            {AGENT_NAMES[r.agentId] ?? r.agentId}
                          </p>
                          <p className="text-[11px] text-red-600">
                            {r.error}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e7eb] flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
          >
            Dismiss
          </button>

          {hasContent && selectedIndices.size > 0 && (
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 px-4 py-2 bg-[#211d1d] hover:bg-[#352f2f] text-white rounded-lg text-[12px] font-medium transition-colors"
            >
              <Plus size={14} />
              Add {selectedIndices.size} to Schedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
