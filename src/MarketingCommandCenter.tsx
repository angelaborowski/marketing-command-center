import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useGoogleCalendar } from './useGoogleCalendar';
import { useLinkedIn } from './useLinkedIn';
import ContentGapPanel from './components/ContentGapPanel';
import ContentAssistant from './components/ContentAssistant';
import AgentDashboard from './components/AgentDashboard';
import AgentProgress from './components/AgentProgress';
import AgentResults from './components/AgentResults';
import ContentItemRow from './components/ContentItemRow';
import DashboardHome from './components/DashboardHome';
import FilmView from './components/FilmView';
import GapFillModal from './components/GapFillModal';
import Header from './components/Header';
import PostView from './components/PostView';
import QuickAddButton from './components/QuickAddButton';
import Sidebar from './components/Sidebar';
import TextQueue from './components/TextQueue';
import WeeklyCheckIn from './components/WeeklyCheckIn';
import { AuthContext } from './components/PasswordGate';
import { useAgents } from './hooks/useAgents';
import { useGoals } from './hooks/useGoals';
import { useProactiveAgents } from './hooks/useProactiveAgents';
import { useSettings } from './hooks/useSettings';
import { useContentItems } from './hooks/useContentItems';
import { useCalendarSync } from './hooks/useCalendarSync';
import { useSchedulingOptimizer } from './hooks/useSchedulingOptimizer';
import { useGapAnalysis } from './hooks/useGapAnalysis';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import Settings from './components/Settings';
import PerformanceInput from './components/PerformanceInput';
import type { Section } from './types';
import { DAYS } from './types';

export default function MarketingCommandCenter() {
  // Navigation & UI state
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[0]);

  // Core hooks
  const { settings, updateSettings } = useSettings();
  const linkedin = useLinkedIn();
  const calendar = useGoogleCalendar();

  const {
    isConnected: calendarConnected,
    isSyncing: calendarSyncing,
    lastSync: calendarLastSync,
    login: calendarLogin,
    disconnect: calendarDisconnect,
  } = calendar;

  // Content items (CRUD, filters, stats, performance)
  const content = useContentItems(linkedin, settings);
  const {
    contentItems, setContentItems,
    addContentItem, updateContentItem, duplicateContentItem,
    toggleFilmed, togglePosted, markAllFilmed,
    handlePostToLinkedIn, handleSavePerformance,
    performanceModalItem, setPerformanceModalItem,
    getItemsByDay, getItemsToPost,
    totalItems, filmedCount, postedCount,
    itemsWithPerformance, totalViews, avgEngagement,
  } = content;

  // Wrap deleteContentItem to also clear expanded state
  const deleteContentItem = useCallback((id: string) => {
    content.deleteContentItem(id);
    setExpandedItem(null);
  }, [content.deleteContentItem]);

  // Calendar sync
  const { calendarSyncStatus, calendarSettings, syncToCalendar } = useCalendarSync(
    contentItems, settings, calendar, setContentItems
  );

  // Scheduling optimizer
  const {
    showSchedulingPanel, setShowSchedulingPanel, schedulingAnalysis,
    handleOptimizeSchedule, applySuggestion, applyAllSuggestions,
  } = useSchedulingOptimizer(contentItems, setContentItems);

  // Content gap analysis
  const {
    showGapAnalysis, setShowGapAnalysis, gapAnalysis,
    gapToFill, setGapToFill, handleAnalyzeGaps, handleFillGap,
  } = useGapAnalysis(contentItems, settings);

  // Agent system
  const agents = useAgents(settings, contentItems, gapAnalysis, schedulingAnalysis);
  const [showAgentResults, setShowAgentResults] = useState(false);

  // Proactive agents
  const proactive = useProactiveAgents(
    settings,
    contentItems,
    agents.isRunning,
    agents.startAgent,
    agents.startPipeline,
    agents.runHistory,
  );

  // Goals system
  const {
    goals,
    updateGoals,
    snapshots,
    addSnapshot,
    accountability,
    growthMetrics,
    isPendingCheckIn,
    dismissCheckIn,
    postingScore,
  } = useGoals(contentItems);

  const [showCheckIn, setShowCheckIn] = useState(false);

  // Show check-in modal automatically when pending
  useEffect(() => {
    if (isPendingCheckIn) {
      setShowCheckIn(true);
    }
  }, [isPendingCheckIn]);

  // Auth context for logout
  const { logout } = useContext(AuthContext);

  // Keyboard shortcuts
  useKeyboardShortcuts(setActiveSection, setSettingsOpen, setExpandedItem);

  // Show agent results modal when a run finishes
  const prevRunStatusRef = useRef<string | null>(null);
  useEffect(() => {
    const currentStatus = agents.currentRun?.status ?? null;
    if (
      prevRunStatusRef.current === 'running' &&
      currentStatus &&
      currentStatus !== 'running'
    ) {
      setShowAgentResults(true);
    }
    prevRunStatusRef.current = currentStatus;
  }, [agents.currentRun?.status]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        totalItems={totalItems}
        filmedCount={filmedCount}
        postedCount={postedCount}
        itemsWithPerformance={itemsWithPerformance}
        totalViews={totalViews}
        avgEngagement={avgEngagement}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={logout}
      />

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Header
          activeSection={activeSection}
          calendarSyncStatus={calendarSyncStatus}
          linkedinError={linkedin.error}
          onClearLinkedInError={linkedin.clearError}
          calendarConnected={calendarConnected}
          calendarSyncing={calendarSyncing}
          calendarLastSync={calendarLastSync}
          calendarSettings={calendarSettings}
          onSyncCalendar={syncToCalendar}
          onOpenSettings={() => setSettingsOpen(true)}
          contentItems={contentItems}
          onOptimizeSchedule={handleOptimizeSchedule}
          showSchedulingPanel={showSchedulingPanel}
          onCloseSchedulingPanel={() => setShowSchedulingPanel(false)}
          schedulingAnalysis={schedulingAnalysis}
          onApplySuggestion={applySuggestion}
          onApplyAllSuggestions={applyAllSuggestions}
          onAnalyzeGaps={handleAnalyzeGaps}
          batchDay={settings.batchDay}
        />

        {/* Content area */}
        <div className="flex-1 overflow-auto p-6">
          {/* HOME VIEW */}
          {activeSection === 'home' && (
            <DashboardHome
              contentItems={contentItems}
              settings={settings}
              gapAnalysis={gapAnalysis}
              schedulingAnalysis={schedulingAnalysis}
              agentRunHistory={agents.runHistory}
              proactiveResults={proactive.notifications}
              isAgentRunning={agents.isRunning}
              onNavigate={setActiveSection}
              onStartPipeline={(pipelineId) => agents.startPipeline(pipelineId)}
              onAnalyzeGaps={handleAnalyzeGaps}
              goals={goals}
              growthMetrics={growthMetrics}
              accountability={accountability}
              postingScore={postingScore}
              onOpenCheckIn={() => setShowCheckIn(true)}
              onOpenGoalSettings={() => setSettingsOpen(true)}
            />
          )}

          {/* WEEK VIEW */}
          {activeSection === 'week' && (
            <div className="max-w-5xl mx-auto">
              {/* Day tabs */}
              <div className="flex gap-2 mb-6">
                {DAYS.map(day => {
                  const dayItems = getItemsByDay(day);
                  const isBatchDay = day === settings.batchDay;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`flex-1 py-3 px-2 rounded-lg text-center transition-all ${
                        selectedDay === day
                          ? 'bg-[#211d1d] text-white'
                          : isBatchDay
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:border-[#d1d5db]'
                      }`}
                    >
                      <div className="text-[12px] font-medium">{day.slice(0, 3)}</div>
                      <div className={`text-[10px] mt-0.5 ${
                        selectedDay === day ? 'text-white/70' : 'text-[#9ca3af]'
                      }`}>
                        {dayItems.length} items
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Content for selected day */}
              <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
                {/* Day header */}
                <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
                  <div>
                    <h2 className="text-[14px] font-semibold text-[#1a1a1a]">{selectedDay}</h2>
                    <p className="text-[12px] text-[#6b7280] mt-0.5">
                      {getItemsByDay(selectedDay).length} content items scheduled
                    </p>
                  </div>
                  <QuickAddButton
                    day={selectedDay}
                    settings={settings}
                    onAdd={addContentItem}
                  />
                </div>

                {/* Content list */}
                <div className="divide-y divide-[#e5e7eb]">
                  {getItemsByDay(selectedDay).length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="text-[#9ca3af] text-[13px] mb-4">No content scheduled for {selectedDay}</div>
                      <QuickAddButton
                        day={selectedDay}
                        settings={settings}
                        onAdd={addContentItem}
                        variant="primary"
                      />
                    </div>
                  ) : (
                    getItemsByDay(selectedDay).map(item => (
                      <ContentItemRow
                        key={item.id}
                        item={item}
                        expanded={expandedItem === item.id}
                        onToggleExpand={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                        onToggleFilmed={() => toggleFilmed(item.id)}
                        onTogglePosted={() => togglePosted(item.id)}
                        onDelete={() => deleteContentItem(item.id)}
                        onUpdate={(updates) => updateContentItem(item.id, updates)}
                        onDuplicate={(targetPlatform) => duplicateContentItem(item.id, targetPlatform)}
                        onPostToLinkedIn={() => handlePostToLinkedIn(item.id)}
                        linkedinConnected={linkedin.isConnected}
                        linkedinPosting={linkedin.isPosting}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SHOT LIST VIEW */}
          {activeSection === 'shotlist' && (
            <FilmView
              items={contentItems}
              batchDay={settings.batchDay || 'Saturday'}
              onToggleFilmed={toggleFilmed}
              onMarkAllDone={markAllFilmed}
            />
          )}

          {/* TEXT QUEUE VIEW */}
          {activeSection === 'textqueue' && (
            <TextQueue
              items={contentItems}
              onTogglePosted={togglePosted}
            />
          )}

          {/* POST VIEW */}
          {activeSection === 'post' && (
            <PostView
              items={getItemsToPost()}
              onTogglePosted={togglePosted}
              onDuplicate={duplicateContentItem}
              onPostToLinkedIn={handlePostToLinkedIn}
              linkedinConnected={linkedin.isConnected}
              linkedinPosting={linkedin.isPosting}
            />
          )}

          {/* AGENTS VIEW */}
          {activeSection === 'agents' && (
            <AgentDashboard
              currentRun={agents.currentRun}
              isRunning={agents.isRunning}
              runHistory={agents.runHistory}
              onStartPipeline={(pipelineId) => agents.startPipeline(pipelineId)}
              onStartAgent={(agentId, input) => agents.startAgent(agentId, input)}
              onCancelRun={agents.cancelRun}
              settings={settings}
            />
          )}
        </div>
      </main>

      {/* Settings Modal */}
      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
        calendarConnected={calendarConnected}
        onCalendarConnect={calendarLogin}
        onCalendarDisconnect={calendarDisconnect}
        linkedinConnected={linkedin.isConnected}
        onLinkedInConnect={linkedin.connect}
        onLinkedInDisconnect={linkedin.disconnect}
        goals={goals}
        onSaveGoals={updateGoals}
      />

      {/* Performance Input Modal */}
      <PerformanceInput
        isOpen={performanceModalItem !== null}
        onClose={() => setPerformanceModalItem(null)}
        item={performanceModalItem}
        onSave={handleSavePerformance}
      />

      {/* Content Gap Analysis Panel */}
      {gapAnalysis && (
        <ContentGapPanel
          isOpen={showGapAnalysis}
          onClose={() => setShowGapAnalysis(false)}
          analysis={gapAnalysis}
          onFillGap={handleFillGap}
        />
      )}

      {/* Gap Fill Modal - QuickAddButton pre-filled with gap values */}
      {gapToFill && (
        <GapFillModal
          gap={gapToFill}
          settings={settings}
          onAdd={(item) => {
            addContentItem(item);
            setGapToFill(null);
          }}
          onClose={() => setGapToFill(null)}
        />
      )}

      {/* Content Assistant Chatbot */}
      <ContentAssistant />

      {/* Agent Progress Panel - visible during runs */}
      {agents.isRunning && agents.currentRun && (
        <div className="fixed top-4 right-4 z-50 w-96">
          <AgentProgress
            run={agents.currentRun}
            onCancel={agents.cancelRun}
          />
        </div>
      )}

      {/* Weekly Check-In Modal */}
      {showCheckIn && (
        <WeeklyCheckIn
          goals={goals}
          lastSnapshot={snapshots.length > 0 ? snapshots[snapshots.length - 1] : null}
          contentItems={contentItems}
          onSubmit={(snapshot) => {
            addSnapshot(snapshot);
            const updatedGoals = {
              ...goals,
              currentSubscribers: snapshot.subscribers,
              platformGoals: goals.platformGoals.map(pg => ({
                ...pg,
                currentFollowers: snapshot.followers[pg.platform] ?? pg.currentFollowers,
              })),
              updatedAt: new Date().toISOString(),
            };
            updateGoals(updatedGoals);
            setShowCheckIn(false);
          }}
          onDismiss={() => {
            dismissCheckIn();
            setShowCheckIn(false);
          }}
        />
      )}

      {/* Agent Results Modal - shown when a run completes */}
      {agents.currentRun && agents.currentRun.status !== 'running' && showAgentResults && (
        <AgentResults
          isOpen={showAgentResults}
          onClose={() => setShowAgentResults(false)}
          run={agents.currentRun}
          onApproveContent={(items) => {
            const approved = agents.approveContent(items);
            setContentItems(prev => [...prev, ...approved]);
            setShowAgentResults(false);
          }}
        />
      )}
    </div>
  );
}
