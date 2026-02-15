import { useState, useCallback } from 'react';
import { analyzeContentGaps } from '../lib/contentAnalysis';
import type { ContentItem, Settings, ContentGap, ContentGapAnalysis } from '../types';

export interface UseGapAnalysisReturn {
  showGapAnalysis: boolean;
  setShowGapAnalysis: (show: boolean) => void;
  gapAnalysis: ContentGapAnalysis | null;
  gapToFill: ContentGap | null;
  setGapToFill: (gap: ContentGap | null) => void;
  handleAnalyzeGaps: () => void;
  handleFillGap: (gap: ContentGap) => void;
}

export function useGapAnalysis(
  contentItems: ContentItem[],
  settings: Settings
): UseGapAnalysisReturn {
  const [showGapAnalysis, setShowGapAnalysis] = useState(false);
  const [gapAnalysis, setGapAnalysis] = useState<ContentGapAnalysis | null>(null);
  const [gapToFill, setGapToFill] = useState<ContentGap | null>(null);

  const handleAnalyzeGaps = useCallback(() => {
    const analysis = analyzeContentGaps(contentItems, settings);
    setGapAnalysis(analysis);
    setShowGapAnalysis(true);
  }, [contentItems, settings]);

  const handleFillGap = useCallback((gap: ContentGap) => {
    setGapToFill(gap);
    setShowGapAnalysis(false);
  }, []);

  return {
    showGapAnalysis,
    setShowGapAnalysis,
    gapAnalysis,
    gapToFill,
    setGapToFill,
    handleAnalyzeGaps,
    handleFillGap,
  };
}
