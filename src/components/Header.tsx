import {
  Calendar,
  CalendarSync,
  Check,
  Film,
  Zap,
  X,
  ArrowRight,
  Target,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { ContentItem, CalendarSyncSettings, SchedulingAnalysis, SchedulingSuggestion } from '../types';
import type { Section } from '../types';
import { PLATFORMS } from '../types';

export interface HeaderProps {
  activeSection: Section;
  calendarSyncStatus: { type: 'success' | 'error' | 'info' | null; message: string };
  linkedinError: string | null;
  onClearLinkedInError: () => void;
  calendarConnected: boolean;
  calendarSyncing: boolean;
  calendarLastSync: Date | null;
  calendarSettings: CalendarSyncSettings;
  onSyncCalendar: () => void;
  onOpenSettings: () => void;
  contentItems: ContentItem[];
  onOptimizeSchedule: () => void;
  showSchedulingPanel: boolean;
  onCloseSchedulingPanel: () => void;
  schedulingAnalysis: SchedulingAnalysis | null;
  onApplySuggestion: (suggestion: SchedulingSuggestion) => void;
  onApplyAllSuggestions: () => void;
  onAnalyzeGaps: () => void;
  batchDay?: string;
}

export default function Header({
  activeSection,
  calendarSyncStatus,
  linkedinError,
  onClearLinkedInError,
  calendarConnected,
  calendarSyncing,
  calendarLastSync,
  calendarSettings,
  onSyncCalendar,
  onOpenSettings,
  contentItems,
  onOptimizeSchedule,
  showSchedulingPanel,
  onCloseSchedulingPanel,
  schedulingAnalysis,
  onApplySuggestion,
  onApplyAllSuggestions,
  onAnalyzeGaps,
  batchDay,
}: HeaderProps) {
  return (
    <header className="h-14 px-6 flex items-center justify-between bg-white border-b border-[#e5e7eb]">
      <div className="flex items-center gap-4">
        <h1 className="text-[15px] font-semibold text-[#1a1a1a] capitalize">
          {activeSection === 'home' ? 'Dashboard' : activeSection === 'week' ? 'Weekly Schedule' : activeSection === 'shotlist' ? 'Shot List' : activeSection === 'textqueue' ? 'Text Queue' : activeSection === 'post' ? 'To Post' : 'AI Agents'}
        </h1>
        {calendarSyncStatus.type && (
          <span className={`flex items-center gap-1.5 text-[12px] ${
            calendarSyncStatus.type === 'success' ? 'text-emerald-600' :
            calendarSyncStatus.type === 'error' ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {calendarSyncStatus.type === 'success' && <CheckCircle size={14} />}
            {calendarSyncStatus.type === 'error' && <AlertCircle size={14} />}
            {calendarSyncStatus.type === 'info' && <Loader2 size={14} className="animate-spin" />}
            {calendarSyncStatus.message}
          </span>
        )}
        {linkedinError && (
          <button
            onClick={onClearLinkedInError}
            className="flex items-center gap-1.5 text-[12px] text-red-600"
          >
            <AlertCircle size={14} />
            {linkedinError}
            <X size={12} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* Calendar Sync Button */}
        {calendarConnected && calendarSettings.enabled && (
          <button
            onClick={onSyncCalendar}
            disabled={calendarSyncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${
              calendarSyncing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-[#e5e7eb] hover:border-blue-300 hover:bg-blue-50 text-[#374151]'
            }`}
            title={calendarLastSync ? `Last synced: ${calendarLastSync.toLocaleTimeString()}` : 'Sync to calendar'}
          >
            {calendarSyncing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CalendarSync size={14} />
            )}
            {calendarSyncing ? 'Syncing...' : 'Sync Calendar'}
          </button>
        )}
        {/* Calendar status indicator */}
        {!calendarConnected && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-[11px] text-gray-500 hover:bg-gray-100 transition-colors"
            title="Connect Google Calendar in Settings"
          >
            <Calendar size={14} />
            Calendar not connected
          </button>
        )}
        {activeSection === 'week' && (
          <>
            <div className="relative">
              <button
                onClick={onOptimizeSchedule}
                disabled={contentItems.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 disabled:bg-gray-50 disabled:text-gray-400 text-amber-700 border border-amber-200 hover:border-amber-300 disabled:border-gray-200 rounded-lg text-[12px] font-medium transition-all"
              >
                <Zap size={14} />
                Optimize Schedule
              </button>

              {/* Scheduling suggestions panel */}
              {showSchedulingPanel && schedulingAnalysis && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-[#e5e7eb] shadow-xl z-50">
                  {/* Panel header */}
                  <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
                    <div>
                      <h3 className="text-[13px] font-semibold text-[#1a1a1a]">Schedule Optimization</h3>
                      <p className="text-[11px] text-[#6b7280] mt-0.5">
                        Score: <span className={`font-medium ${schedulingAnalysis.overallScore >= 70 ? 'text-emerald-600' : schedulingAnalysis.overallScore >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{schedulingAnalysis.overallScore}%</span>
                      </p>
                    </div>
                    <button
                      onClick={onCloseSchedulingPanel}
                      className="p-1 hover:bg-[#f3f4f6] rounded-lg transition-colors"
                    >
                      <X size={16} className="text-[#6b7280]" />
                    </button>
                  </div>

                  {/* Suggestions list */}
                  <div className="max-h-80 overflow-y-auto">
                    {schedulingAnalysis.suggestions.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
                          <Check size={20} className="text-emerald-600" />
                        </div>
                        <p className="text-[13px] font-medium text-[#1a1a1a]">Schedule optimized!</p>
                        <p className="text-[11px] text-[#6b7280] mt-1">All content is scheduled at optimal times</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#e5e7eb]">
                        {schedulingAnalysis.suggestions.slice(0, 5).map((suggestion) => {
                          const item = contentItems.find(i => i.id === suggestion.itemId);
                          if (!item) return null;

                          return (
                            <div key={suggestion.itemId} className="px-4 py-3 hover:bg-[#fafafa] transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] text-[#1a1a1a] truncate mb-1">{item.hook}</p>
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <span className={`font-medium px-1.5 py-0.5 rounded ${
                                      suggestion.platform === 'tiktok' ? 'bg-pink-50 text-pink-600' :
                                      suggestion.platform === 'shorts' ? 'bg-red-50 text-red-600' :
                                      suggestion.platform === 'reels' ? 'bg-purple-50 text-purple-600' :
                                      suggestion.platform === 'facebook' ? 'bg-blue-50 text-blue-600' :
                                      suggestion.platform === 'linkedin' ? 'bg-sky-50 text-sky-600' :
                                      suggestion.platform === 'snapchat' ? 'bg-yellow-50 text-yellow-600' :
                                      'bg-red-50 text-red-600'
                                    }`}>
                                      {PLATFORMS[suggestion.platform]?.name}
                                    </span>
                                    <span className="text-[#9ca3af]">{suggestion.currentDay}</span>
                                    <span className="text-[#6b7280]">{suggestion.currentTime}</span>
                                    <ArrowRight size={12} className="text-[#9ca3af]" />
                                    {suggestion.suggestedDay && suggestion.suggestedDay !== suggestion.currentDay && (
                                      <span className="text-emerald-600 font-medium">{suggestion.suggestedDay}</span>
                                    )}
                                    <span className="text-emerald-600 font-medium">{suggestion.suggestedTime}</span>
                                  </div>
                                  <p className="text-[10px] text-[#9ca3af] mt-1">{suggestion.reasoning}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                    suggestion.confidence >= 70 ? 'bg-emerald-50 text-emerald-600' :
                                    suggestion.confidence >= 50 ? 'bg-amber-50 text-amber-600' :
                                    'bg-gray-50 text-gray-500'
                                  }`}>
                                    {suggestion.confidence}%
                                  </span>
                                  <button
                                    onClick={() => onApplySuggestion(suggestion)}
                                    className="text-[10px] font-medium text-[#211d1d] hover:text-[#352f2f] transition-colors"
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Panel footer */}
                  {schedulingAnalysis.suggestions.length > 0 && (
                    <div className="px-4 py-3 border-t border-[#e5e7eb] bg-[#fafafa] rounded-b-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#6b7280]">
                          {schedulingAnalysis.suggestions.length} suggestion{schedulingAnalysis.suggestions.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={onApplyAllSuggestions}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#211d1d] hover:bg-[#352f2f] text-white rounded-lg text-[11px] font-medium transition-colors"
                        >
                          <Zap size={12} />
                          Apply All
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onAnalyzeGaps}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb] text-[#374151] rounded-lg text-[12px] font-medium transition-all"
            >
              <Target size={14} />
              Analyze Gaps
            </button>
          </>
        )}
        {batchDay && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg text-[12px] text-emerald-700 font-medium">
            <Film size={14} />
            Batch: {batchDay}
          </div>
        )}
      </div>
    </header>
  );
}
