import { X, AlertTriangle, Target, TrendingUp, Lightbulb } from 'lucide-react';
import type { ContentGap, ContentGapAnalysis, Pillar, Platform, ExamLevel } from '../types';
import { PILLARS, PLATFORMS } from '../types';

interface ContentGapPanelProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: ContentGapAnalysis;
  onFillGap: (gap: ContentGap) => void;
}

/**
 * Circular meter component for balance score
 */
function BalanceMeter({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#1a1a1a]">{score}</span>
          <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Score</span>
        </div>
      </div>
      <div className="mt-2 text-[12px] font-medium" style={{ color: getScoreColor(score) }}>
        {getScoreLabel(score)}
      </div>
    </div>
  );
}

/**
 * Get friendly name for gap type/value
 */
function getGapDisplayName(gap: ContentGap): string {
  switch (gap.type) {
    case 'pillar':
      const pillar = PILLARS.find(p => p.id === gap.value);
      return pillar?.name || gap.value;
    case 'platform':
      const platform = PLATFORMS[gap.value as Platform];
      return platform?.name || gap.value;
    default:
      return gap.value;
  }
}

/**
 * Get icon/badge color for gap type
 */
function getGapTypeColor(type: ContentGap['type']): string {
  switch (type) {
    case 'subject': return 'bg-purple-100 text-purple-700';
    case 'pillar': return 'bg-blue-100 text-blue-700';
    case 'platform': return 'bg-pink-100 text-pink-700';
    case 'level': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Get priority color
 */
function getPriorityColor(priority: ContentGap['priority']): { bg: string; border: string; text: string } {
  switch (priority) {
    case 'high':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
    case 'medium':
      return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' };
    case 'low':
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
  }
}

/**
 * Gap card component
 */
function GapCard({ gap, onFillGap }: { gap: ContentGap; onFillGap: (gap: ContentGap) => void }) {
  const priorityColors = getPriorityColor(gap.priority);

  return (
    <div className={`p-4 rounded-lg border ${priorityColors.bg} ${priorityColors.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getGapTypeColor(gap.type)}`}>
              {gap.type.toUpperCase()}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColors.text} bg-white/50`}>
              {gap.priority.toUpperCase()}
            </span>
          </div>

          {/* Gap name */}
          <h4 className="text-[14px] font-semibold text-[#1a1a1a] mb-1">
            {getGapDisplayName(gap)}
          </h4>

          {/* Stats */}
          <div className="flex items-center gap-3 text-[11px] text-[#6b7280] mb-2">
            <span>Current: <strong className="text-[#1a1a1a]">{gap.currentCount}</strong></span>
            <span className="text-[#d1d5db]">|</span>
            <span>Recommended: <strong className="text-[#1a1a1a]">{gap.recommendedCount}</strong></span>
          </div>

          {/* Suggestion */}
          <p className="text-[12px] text-[#6b7280]">{gap.suggestion}</p>
        </div>

        {/* Fill Gap button */}
        <button
          onClick={() => onFillGap(gap)}
          className="shrink-0 px-3 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[11px] font-medium rounded-lg transition-colors"
        >
          Fill Gap
        </button>
      </div>
    </div>
  );
}

/**
 * Coverage breakdown section
 */
function CoverageBreakdown({ coverage }: { coverage: ContentGapAnalysis['coverage'] }) {
  const sections = [
    { label: 'Subjects', data: coverage.subjects, colorClass: 'bg-purple-500' },
    { label: 'Pillars', data: coverage.pillars, colorClass: 'bg-blue-500' },
    { label: 'Platforms', data: coverage.platforms, colorClass: 'bg-pink-500' },
    { label: 'Levels', data: coverage.levels, colorClass: 'bg-amber-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {sections.map(section => {
        const entries = Object.entries(section.data);
        const total = entries.reduce((sum, [, count]) => sum + count, 0);
        const max = Math.max(...entries.map(([, count]) => count), 1);

        return (
          <div key={section.label} className="p-3 bg-[#f9fafb] rounded-lg border border-[#e5e7eb]">
            <h4 className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-2">
              {section.label}
            </h4>
            <div className="space-y-1.5">
              {entries.length === 0 ? (
                <p className="text-[11px] text-[#9ca3af] italic">No data</p>
              ) : (
                entries.map(([name, count]) => {
                  let displayName = name;
                  if (section.label === 'Pillars') {
                    const pillar = PILLARS.find(p => p.id === name);
                    displayName = pillar?.name || name;
                  } else if (section.label === 'Platforms') {
                    const platform = PLATFORMS[name as Platform];
                    displayName = platform?.name || name;
                  }

                  return (
                    <div key={name} className="flex items-center gap-2">
                      <span className="text-[11px] text-[#6b7280] w-16 truncate">{displayName}</span>
                      <div className="flex-1 h-2 bg-[#e5e7eb] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${section.colorClass} rounded-full transition-all duration-300`}
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#9ca3af] w-6 text-right">{count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Content Gap Panel - Main component
 */
export default function ContentGapPanel({ isOpen, onClose, analysis, onFillGap }: ContentGapPanelProps) {
  if (!isOpen) return null;

  const { gaps, coverage, balanceScore, recommendations } = analysis;
  const highPriorityCount = gaps.filter(g => g.priority === 'high').length;
  const mediumPriorityCount = gaps.filter(g => g.priority === 'medium').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#1a1a1a]">Content Gap Analysis</h2>
              <p className="text-[12px] text-[#6b7280]">
                {gaps.length === 0 ? 'Your content is well-balanced!' : `${gaps.length} gap${gaps.length > 1 ? 's' : ''} identified`}
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

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Balance Score Section */}
          <div className="flex items-center gap-6 p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
            <BalanceMeter score={balanceScore} />
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#3b82f6]" />
                Balance Score
              </h3>
              <p className="text-[12px] text-[#6b7280] mb-3">
                This score measures how evenly your content is distributed across subjects, pillars, platforms, and levels.
              </p>
              <div className="flex items-center gap-4 text-[11px]">
                {highPriorityCount > 0 && (
                  <span className="flex items-center gap-1.5 text-red-600">
                    <AlertTriangle size={12} />
                    {highPriorityCount} high priority
                  </span>
                )}
                {mediumPriorityCount > 0 && (
                  <span className="flex items-center gap-1.5 text-yellow-600">
                    <AlertTriangle size={12} />
                    {mediumPriorityCount} medium priority
                  </span>
                )}
                {gaps.length === 0 && (
                  <span className="flex items-center gap-1.5 text-green-600">
                    All balanced!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="text-[13px] font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Lightbulb size={16} />
                Recommendations
              </h3>
              <ul className="space-y-1.5">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="text-[12px] text-blue-800 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">-</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Coverage Breakdown */}
          <div>
            <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-3">Coverage Breakdown</h3>
            <CoverageBreakdown coverage={coverage} />
          </div>

          {/* Gaps List */}
          {gaps.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-3">
                Content Gaps ({gaps.length})
              </h3>
              <div className="space-y-3">
                {gaps.map((gap, idx) => (
                  <GapCard key={`${gap.type}-${gap.value}-${idx}`} gap={gap} onFillGap={onFillGap} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e7eb] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#1a1a1a] text-[13px] font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
