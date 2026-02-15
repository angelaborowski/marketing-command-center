import { useState, useCallback } from 'react';
import { analyzeSchedule } from '../lib/scheduling';
import type { ContentItem, SchedulingSuggestion, SchedulingAnalysis } from '../types';

export interface UseSchedulingOptimizerReturn {
  showSchedulingPanel: boolean;
  setShowSchedulingPanel: (show: boolean) => void;
  schedulingAnalysis: SchedulingAnalysis | null;
  handleOptimizeSchedule: () => void;
  applySuggestion: (suggestion: SchedulingSuggestion) => void;
  applyAllSuggestions: () => void;
}

export function useSchedulingOptimizer(
  contentItems: ContentItem[],
  setContentItems: React.Dispatch<React.SetStateAction<ContentItem[]>>
): UseSchedulingOptimizerReturn {
  const [showSchedulingPanel, setShowSchedulingPanel] = useState(false);
  const [schedulingAnalysis, setSchedulingAnalysis] = useState<SchedulingAnalysis | null>(null);

  const handleOptimizeSchedule = useCallback(() => {
    const analysis = analyzeSchedule(contentItems);
    setSchedulingAnalysis(analysis);
    setShowSchedulingPanel(true);
  }, [contentItems]);

  const applySuggestion = useCallback((suggestion: SchedulingSuggestion) => {
    setContentItems(prev =>
      prev.map(item => {
        if (item.id === suggestion.itemId) {
          return {
            ...item,
            time: suggestion.suggestedTime,
            day: suggestion.suggestedDay || item.day,
          };
        }
        return item;
      })
    );

    setSchedulingAnalysis(prev => {
      if (!prev) return null;
      return {
        ...prev,
        suggestions: prev.suggestions.filter(s => s.itemId !== suggestion.itemId),
      };
    });
  }, [setContentItems]);

  const applyAllSuggestions = useCallback(() => {
    if (!schedulingAnalysis) return;

    setContentItems(prev =>
      prev.map(item => {
        const suggestion = schedulingAnalysis.suggestions.find(s => s.itemId === item.id);
        if (suggestion) {
          return {
            ...item,
            time: suggestion.suggestedTime,
            day: suggestion.suggestedDay || item.day,
          };
        }
        return item;
      })
    );

    setSchedulingAnalysis(prev => prev ? { ...prev, suggestions: [] } : null);
  }, [schedulingAnalysis, setContentItems]);

  return {
    showSchedulingPanel,
    setShowSchedulingPanel,
    schedulingAnalysis,
    handleOptimizeSchedule,
    applySuggestion,
    applyAllSuggestions,
  };
}
