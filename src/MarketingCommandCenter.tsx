import { useState, useEffect, useCallback, useRef, useContext, Component, type ErrorInfo, type ReactNode } from 'react';
import { analyzeSchedule, PLATFORM_OPTIMAL_TIMES } from './lib/scheduling';
import { analyzeContentGaps } from './lib/contentAnalysis';
import { useGoogleCalendar } from './useGoogleCalendar';
import { useLinkedIn } from './useLinkedIn';
import { buildFilmingEvent, buildPostingEvent } from './lib/calendarHelpers';
import ContentGapPanel from './components/ContentGapPanel';
import ContentAssistant from './components/ContentAssistant';
import AgentDashboard from './components/AgentDashboard';
import AgentProgress from './components/AgentProgress';
import AgentResults from './components/AgentResults';
import DashboardHome from './components/DashboardHome';
import FilmView from './components/FilmView';
import TextQueue from './components/TextQueue';
import WeeklyCheckIn from './components/WeeklyCheckIn';
import { AuthContext } from './components/PasswordGate';
import { useAgents } from './hooks/useAgents';
import { useGoals } from './hooks/useGoals';
import { useProactiveAgents } from './hooks/useProactiveAgents';
import type { SchedulingSuggestion, SchedulingAnalysis, ContentGap, ContentGapAnalysis, CalendarSyncSettings } from './types';
import { DEFAULT_CALENDAR_SETTINGS } from './types';

// Error Boundary to catch rendering errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MarketingCommandCenter Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', background: '#fee', color: '#c00' }}>
          <h1>Something went wrong!</h1>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export { ErrorBoundary };
import {
  Calendar,
  CalendarSync,
  Check,
  ChevronRight,
  Plus,
  Sparkles,
  Video,
  Send,
  Settings as SettingsIcon,
  Circle,
  Trash2,
  Copy,
  Film,
  FileText,
  Clock,
  Hash,
  TrendingUp,
  Eye,
  Zap,
  X,
  ArrowRight,
  Target,
  Loader2,
  CheckCircle,
  AlertCircle,
  Bot,
  Home,
  LogOut,
  Linkedin,
} from 'lucide-react';
import Settings from './components/Settings';
import PerformanceInput from './components/PerformanceInput';
import { formatViewCount, getEngagementColor } from './lib/performance';
import type {
  ContentItem,
  Settings as SettingsType,
  Platform,
  Pillar,
  ExamLevel,
  PerformanceMetrics,
} from './types';
import {
  PLATFORMS,
  PLATFORM_CONTENT_TYPES,
  PILLARS,
  DAYS,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
} from './types';

// Section type for navigation
type Section = 'home' | 'week' | 'shotlist' | 'textqueue' | 'post' | 'agents';

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default time slots
const TIME_SLOTS = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'];

export default function MarketingCommandCenter() {
  // Navigation state
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<SettingsType>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.settings);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Content items state
  const [contentItems, setContentItems] = useState<ContentItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.contentItems);
    return saved ? JSON.parse(saved) : [];
  });

  // UI state
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[0]);

  // Performance tracking state
  const [performanceModalItem, setPerformanceModalItem] = useState<ContentItem | null>(null);

  // Scheduling optimization state
  const [showSchedulingPanel, setShowSchedulingPanel] = useState(false);
  const [schedulingAnalysis, setSchedulingAnalysis] = useState<SchedulingAnalysis | null>(null);

  // Content gap analysis state
  const [showGapAnalysis, setShowGapAnalysis] = useState(false);
  const [gapAnalysis, setGapAnalysis] = useState<ContentGapAnalysis | null>(null);
  const [gapToFill, setGapToFill] = useState<ContentGap | null>(null);

  // Calendar sync state
  const {
    isConnected: calendarConnected,
    isSyncing: calendarSyncing,
    lastSync: calendarLastSync,
    login: calendarLogin,
    disconnect: calendarDisconnect,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useGoogleCalendar();

  // LinkedIn auto-post
  const linkedin = useLinkedIn();

  const [calendarSyncStatus, setCalendarSyncStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

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

  // Track previous content items for auto-sync
  const prevContentItemsRef = useRef<ContentItem[]>(contentItems);

  // Get calendar settings with defaults
  const calendarSettings: CalendarSyncSettings = settings.calendarSync || DEFAULT_CALENDAR_SETTINGS;

  // Sync content to Google Calendar
  const syncToCalendar = useCallback(async () => {
    if (!calendarConnected || !calendarSettings.enabled) {
      setCalendarSyncStatus({
        type: 'error',
        message: 'Calendar not connected or sync disabled',
      });
      return;
    }

    setCalendarSyncStatus({ type: 'info', message: 'Syncing to calendar...' });

    try {
      let successCount = 0;
      let errorCount = 0;

      // Create filming event if enabled
      if (calendarSettings.createFilmingEvents && settings.batchDay) {
        const itemsToFilm = contentItems.filter(item => !item.filmed);
        if (itemsToFilm.length > 0) {
          const filmingEvent = buildFilmingEvent(itemsToFilm, settings.batchDay, calendarSettings);
          const result = await createEvent(filmingEvent);
          if (result) {
            successCount++;
          } else {
            errorCount++;
          }
        }
      }

      // Create posting events if enabled
      if (calendarSettings.createPostingEvents) {
        for (const item of contentItems) {
          if (item.posted) continue; // Skip already posted items

          try {
            const postingEvent = buildPostingEvent(item, calendarSettings);

            if (item.postingEventId) {
              // Update existing event
              const result = await updateEvent(item.postingEventId, postingEvent);
              if (result) {
                successCount++;
              } else {
                errorCount++;
              }
            } else {
              // Create new event
              const result = await createEvent(postingEvent);
              if (result?.id) {
                // Update the content item with the event ID
                setContentItems(prev =>
                  prev.map(i =>
                    i.id === item.id ? { ...i, postingEventId: result.id } : i
                  )
                );
                successCount++;
              } else {
                errorCount++;
              }
            }
          } catch (err) {
            console.error('Error syncing item:', item.id, err);
            errorCount++;
          }
        }
      }

      if (errorCount === 0) {
        setCalendarSyncStatus({
          type: 'success',
          message: `Synced ${successCount} events to calendar`,
        });
      } else {
        setCalendarSyncStatus({
          type: 'error',
          message: `Synced ${successCount} events, ${errorCount} failed`,
        });
      }

      // Clear status after 3 seconds
      setTimeout(() => setCalendarSyncStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error('Calendar sync error:', error);
      setCalendarSyncStatus({
        type: 'error',
        message: 'Failed to sync to calendar',
      });
      setTimeout(() => setCalendarSyncStatus({ type: null, message: '' }), 3000);
    }
  }, [
    calendarConnected,
    calendarSettings,
    contentItems,
    settings.batchDay,
    createEvent,
    updateEvent,
  ]);

  // Auto-sync when content changes (if enabled)
  useEffect(() => {
    if (
      calendarConnected &&
      calendarSettings.enabled &&
      calendarSettings.autoSync &&
      prevContentItemsRef.current !== contentItems &&
      contentItems.length > 0
    ) {
      // Debounce auto-sync to avoid too many API calls
      const timeout = setTimeout(() => {
        syncToCalendar();
      }, 2000);

      prevContentItemsRef.current = contentItems;
      return () => clearTimeout(timeout);
    }
  }, [contentItems, calendarConnected, calendarSettings, syncToCalendar]);

  // Persist content items
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.contentItems, JSON.stringify(contentItems));
  }, [contentItems]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Cmd/Ctrl + number for section switching
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        switch (e.key) {
          case '0':
            e.preventDefault();
            setActiveSection('home');
            break;
          case '1':
            e.preventDefault();
            setActiveSection('week');
            break;
          case '2':
            e.preventDefault();
            setActiveSection('shotlist');
            break;
          case '3':
            e.preventDefault();
            setActiveSection('textqueue');
            break;
          case '4':
            e.preventDefault();
            setActiveSection('post');
            break;
          case '5':
            e.preventDefault();
            setActiveSection('agents');
            break;
          case ',':
            e.preventDefault();
            setSettingsOpen(true);
            break;
        }
      }

      // Escape to close settings
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setExpandedItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Content item actions
  const addContentItem = useCallback((item: Omit<ContentItem, 'id'>) => {
    const newItem: ContentItem = {
      ...item,
      id: generateId(),
    };
    setContentItems(prev => [...prev, newItem]);
  }, []);

  const updateContentItem = useCallback((id: string, updates: Partial<ContentItem>) => {
    setContentItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const deleteContentItem = useCallback((id: string) => {
    setContentItems(prev => prev.filter(item => item.id !== id));
    setExpandedItem(null);
  }, []);

  const toggleFilmed = useCallback((id: string) => {
    setContentItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, filmed: !item.filmed } : item
      )
    );
  }, []);

  const togglePosted = useCallback((id: string) => {
    const item = contentItems.find(i => i.id === id);
    if (!item) return;

    // If marking as posted and no performance data yet, show the modal
    if (!item.posted && !item.performance) {
      setPerformanceModalItem(item);
      return;
    }

    // Otherwise just toggle the status
    setContentItems(prev =>
      prev.map(i =>
        i.id === id ? { ...i, posted: !i.posted, postedAt: !i.posted ? new Date().toISOString() : undefined } : i
      )
    );
  }, [contentItems]);

  // Post to LinkedIn
  const handlePostToLinkedIn = useCallback(async (id: string) => {
    const item = contentItems.find(i => i.id === id);
    if (!item) return;

    const result = await linkedin.postToLinkedIn(item, {
      postTarget: settings.linkedinPostTarget || 'personal',
      orgId: settings.linkedinOrgId,
    });
    if (result.success) {
      setContentItems(prev =>
        prev.map(i =>
          i.id === id ? { ...i, posted: true, postedAt: new Date().toISOString() } : i
        )
      );
    }
  }, [contentItems, linkedin, settings.linkedinPostTarget, settings.linkedinOrgId]);

  // Save performance metrics
  const handleSavePerformance = useCallback((itemId: string, metrics: PerformanceMetrics) => {
    setContentItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, posted: true, postedAt: new Date().toISOString(), performance: metrics }
          : item
      )
    );
    setPerformanceModalItem(null);
  }, []);

  // Update performance for already posted item
  const openPerformanceModal = useCallback((item: ContentItem) => {
    setPerformanceModalItem(item);
  }, []);

  // Analyze schedule and show optimization panel
  const handleOptimizeSchedule = useCallback(() => {
    const analysis = analyzeSchedule(contentItems);
    setSchedulingAnalysis(analysis);
    setShowSchedulingPanel(true);
  }, [contentItems]);

  // Apply a single scheduling suggestion
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

    // Update analysis after applying
    setSchedulingAnalysis(prev => {
      if (!prev) return null;
      return {
        ...prev,
        suggestions: prev.suggestions.filter(s => s.itemId !== suggestion.itemId),
      };
    });
  }, []);

  // Apply all scheduling suggestions
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
  }, [schedulingAnalysis]);

  // Content gap analysis handlers
  const handleAnalyzeGaps = useCallback(() => {
    const analysis = analyzeContentGaps(contentItems, settings);
    setGapAnalysis(analysis);
    setShowGapAnalysis(true);
  }, [contentItems, settings]);

  const handleFillGap = useCallback((gap: ContentGap) => {
    setGapToFill(gap);
    setShowGapAnalysis(false);
  }, []);

  // Filter helpers
  const getItemsByDay = (day: string) =>
    contentItems.filter(item => item.day === day);

  const getItemsToFilm = () =>
    contentItems.filter(item => !item.filmed);

  const getItemsToPost = () =>
    contentItems.filter(item => item.filmed && !item.posted);

  // Stats
  const totalItems = contentItems.length;
  const filmedCount = contentItems.filter(item => item.filmed).length;
  const postedCount = contentItems.filter(item => item.posted).length;

  // Performance stats
  const itemsWithPerformance = contentItems.filter(item => item.performance && item.performance.views > 0);
  const totalViews = itemsWithPerformance.reduce((sum, item) => sum + (item.performance?.views || 0), 0);
  const avgEngagement = itemsWithPerformance.length > 0
    ? itemsWithPerformance.reduce((sum, item) => sum + (item.performance?.engagementRate || 0), 0) / itemsWithPerformance.length
    : 0;

  // Platform icon helper
  const getPlatformIcon = (platform: Platform) => {
    const iconMap: Record<Platform, string> = {
      tiktok: 'TT',
      shorts: 'YS',
      reels: 'IG',
      facebook: 'FB',
      linkedin: 'LI',
      snapchat: 'SC',
      ytlong: 'YT',
      reddit: 'RD',
      mumsnet: 'MN',
    };
    return iconMap[platform];
  };

  // Navigation items
  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home, shortcut: '0' },
    { id: 'week' as const, label: 'Week', icon: Calendar, shortcut: '1' },
    { id: 'shotlist' as const, label: 'Shot List', icon: Film, shortcut: '2' },
    { id: 'textqueue' as const, label: 'Text Queue', icon: FileText, shortcut: '3' },
    { id: 'post' as const, label: 'Post', icon: Send, shortcut: '4' },
    { id: 'agents' as const, label: 'Agents', icon: Bot, shortcut: '5' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-[#e5e7eb] flex flex-col">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[#e5e7eb]">
          <div className="text-sm font-semibold text-[#1a1a1a]">revise.right</div>
          <div className="text-[11px] text-[#6b7280] mt-0.5">Marketing Command Center</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <div className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  activeSection === item.id
                    ? 'bg-[#211d1d] text-white'
                    : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1a1a1a]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={16} />
                  {item.label}
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  activeSection === item.id
                    ? 'bg-white/20 text-white'
                    : 'bg-[#f3f4f6] text-[#9ca3af]'
                }`}>
                  {item.shortcut}
                </span>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-6 pt-4 border-t border-[#e5e7eb]">
            <div className="px-3 mb-3 text-[10px] text-[#9ca3af] uppercase tracking-wider font-medium">
              This Week
            </div>
            <div className="space-y-2 px-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#6b7280]">Total</span>
                <span className="font-medium text-[#1a1a1a]">{totalItems}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#6b7280]">Filmed</span>
                <span className="font-medium text-[#1a1a1a]">{filmedCount}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#6b7280]">Posted</span>
                <span className="font-medium text-[#1a1a1a]">{postedCount}</span>
              </div>
            </div>

            {/* Performance Stats */}
            {itemsWithPerformance.length > 0 && (
              <>
                <div className="px-3 mt-6 mb-3 text-[10px] text-[#9ca3af] uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <TrendingUp size={12} />
                  Performance
                </div>
                <div className="space-y-2 px-3">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#6b7280]">Total Views</span>
                    <span className="font-medium text-[#1a1a1a]">{formatViewCount(totalViews)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#6b7280]">Avg Engagement</span>
                    <span className={`font-medium ${getEngagementColor(avgEngagement)}`}>{avgEngagement.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#6b7280]">Tracked</span>
                    <span className="font-medium text-[#1a1a1a]">{itemsWithPerformance.length}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Settings button */}
        <div className="p-3 border-t border-[#e5e7eb]">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1a1a1a] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <SettingsIcon size={16} />
              Settings
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f3f4f6] text-[#9ca3af]">
              ,
            </span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#6b7280] hover:bg-red-50 hover:text-red-600 transition-colors mt-1"
          >
            <LogOut size={16} />
            Lock
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
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
            {linkedin.error && (
              <button
                onClick={linkedin.clearError}
                className="flex items-center gap-1.5 text-[12px] text-red-600"
              >
                <AlertCircle size={14} />
                {linkedin.error}
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Calendar Sync Button */}
            {calendarConnected && calendarSettings.enabled && (
              <button
                onClick={syncToCalendar}
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
                onClick={() => setSettingsOpen(true)}
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
                    onClick={handleOptimizeSchedule}
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
                          onClick={() => setShowSchedulingPanel(false)}
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
                                        onClick={() => applySuggestion(suggestion)}
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
                              onClick={applyAllSuggestions}
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
                  onClick={handleAnalyzeGaps}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb] text-[#374151] rounded-lg text-[12px] font-medium transition-all"
                >
                  <Target size={14} />
                  Analyze Gaps
                </button>
              </>
            )}
            {settings.batchDay && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg text-[12px] text-emerald-700 font-medium">
                <Film size={14} />
                Batch: {settings.batchDay}
              </div>
            )}
          </div>
        </header>

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
                        getPlatformIcon={getPlatformIcon}
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
              onMarkAllDone={() => {
                setContentItems(prev =>
                  prev.map(item =>
                    (item.contentType === 'video' || item.contentType === undefined) && !item.filmed
                      ? { ...item, filmed: true }
                      : item
                  )
                );
              }}
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
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
                  <div>
                    <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Ready to Post</h2>
                    <p className="text-[12px] text-[#6b7280] mt-0.5">
                      {getItemsToPost().length} items ready to publish
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-[12px] text-blue-700 font-medium">
                    <Send size={14} />
                    {getItemsToPost().length} ready
                  </div>
                </div>

                {/* Content list */}
                <div className="divide-y divide-[#e5e7eb]">
                  {getItemsToPost().length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Send size={24} className="text-[#9ca3af]" />
                      </div>
                      <div className="text-[#1a1a1a] font-medium text-[14px] mb-1">Nothing to post</div>
                      <div className="text-[#6b7280] text-[12px]">Film some content first, then come back here</div>
                    </div>
                  ) : (
                    getItemsToPost().map(item => {
                      const isTextContent = item.contentType === 'text';
                      return (
                        <div
                          key={item.id}
                          className="px-5 py-4 hover:bg-[#fafafa] transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => togglePosted(item.id)}
                              className="mt-0.5 w-5 h-5 rounded border-2 border-[#d1d5db] flex items-center justify-center hover:border-[#211d1d] transition-colors"
                            >
                              {item.posted && <Check size={12} className="text-[#211d1d]" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.platform === 'tiktok' ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white' :
                                  item.platform === 'shorts' ? 'bg-red-500 text-white' :
                                  item.platform === 'reels' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                                  item.platform === 'facebook' ? 'bg-blue-600 text-white' :
                                  item.platform === 'linkedin' ? 'bg-sky-700 text-white' :
                                  item.platform === 'snapchat' ? 'bg-yellow-400 text-black' :
                                  item.platform === 'reddit' ? 'bg-orange-500 text-white' :
                                  item.platform === 'mumsnet' ? 'bg-teal-600 text-white' :
                                  'bg-red-600 text-white'
                                }`}>
                                  {PLATFORMS[item.platform]?.name || item.platform}
                                </span>
                                {isTextContent && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Text</span>
                                )}
                                <span className="text-[10px] text-[#9ca3af]">{item.day} at {item.time}</span>
                              </div>
                              <p className="text-[13px] text-[#1a1a1a] mb-2">{item.hook}</p>
                              {/* Text content: show body */}
                              {isTextContent && item.body && (
                                <div className="bg-[#f9fafb] rounded-lg p-3 text-[12px] whitespace-pre-line text-[#374151] mb-2 max-h-32 overflow-y-auto">
                                  {item.body}
                                </div>
                              )}
                              {/* Video content: show caption + hashtags */}
                              {!isTextContent && item.caption && (
                                <p className="text-[12px] text-[#6b7280] mb-2">{item.caption}</p>
                              )}
                              {!isTextContent && item.hashtags.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <Hash size={12} className="text-[#9ca3af]" />
                                  {item.hashtags.map((tag, i) => (
                                    <span key={i} className="text-[11px] text-[#211d1d]">#{tag}</span>
                                  ))}
                                </div>
                              )}
                              <div className="mt-3 flex items-center gap-4">
                                <button
                                  onClick={() => {
                                    const text = isTextContent
                                      ? `${item.hook}\n\n${item.body ?? ''}`
                                      : `${item.hook}\n\n${item.caption}\n\n${item.hashtags.map(t => `#${t}`).join(' ')}`;
                                    navigator.clipboard.writeText(text.trim());
                                  }}
                                  className="flex items-center gap-1.5 text-[11px] text-[#6b7280] hover:text-[#211d1d] transition-colors"
                                >
                                  <Copy size={12} />
                                  Copy to clipboard
                                </button>
                                {item.platform === 'linkedin' && linkedin.isConnected && !item.posted && (
                                  <button
                                    onClick={() => handlePostToLinkedIn(item.id)}
                                    disabled={linkedin.isPosting}
                                    className="flex items-center gap-1.5 text-[11px] font-medium text-[#0a66c2] hover:text-[#004182] transition-colors disabled:opacity-50"
                                  >
                                    {linkedin.isPosting ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <Linkedin size={12} />
                                    )}
                                    {linkedin.isPosting ? 'Posting...' : 'Post to LinkedIn'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
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
        onSave={setSettings}
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
            // Also update platform goals' current followers from snapshot data
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

// Gap Fill Modal Component - Pre-filled form for filling content gaps
interface GapFillModalProps {
  gap: ContentGap;
  settings: SettingsType;
  onAdd: (item: Omit<ContentItem, 'id'>) => void;
  onClose: () => void;
}

function GapFillModal({ gap, settings, onAdd, onClose }: GapFillModalProps) {
  // Pre-fill values based on gap type
  const getInitialPlatform = (): Platform => {
    if (gap.type === 'platform') return gap.value as Platform;
    return settings.platforms[0] || 'tiktok';
  };

  const getInitialPillar = (): Pillar => {
    if (gap.type === 'pillar') return gap.value as Pillar;
    return 'teach';
  };

  const getInitialLevel = (): ExamLevel => {
    if (gap.type === 'level') return gap.value as ExamLevel;
    return settings.levels[0] || 'GCSE';
  };

  const getInitialSubject = (): string => {
    if (gap.type === 'subject') return gap.value;
    return settings.subjects[0] || 'Biology';
  };

  const [hook, setHook] = useState('');
  const [platform, setPlatform] = useState<Platform>(getInitialPlatform());
  const [time, setTime] = useState(TIME_SLOTS[0]);
  const [pillar, setPillar] = useState<Pillar>(getInitialPillar());
  const [level, setLevel] = useState<ExamLevel>(getInitialLevel());
  const [subject, setSubject] = useState(getInitialSubject());
  const [topic, setTopic] = useState('');
  const [day, setDay] = useState<string>(DAYS[0]);

  const handleAdd = () => {
    if (!hook.trim()) return;

    const itemContentType = (PLATFORM_CONTENT_TYPES[platform]?.[0] ?? 'video') as ContentItem['contentType'];
    onAdd({
      day,
      time,
      platform,
      contentType: itemContentType,
      hook: hook.trim(),
      caption: '',
      hashtags: [],
      topic: topic.trim() || subject,
      subject,
      level,
      pillar,
      filmed: itemContentType === 'text',
      posted: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl p-6">
        <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-2">Fill Content Gap</h3>
        <p className="text-[12px] text-[#6b7280] mb-4">{gap.suggestion}</p>

        <div className="space-y-4">
          {/* Hook */}
          <div>
            <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
              Hook / Title
            </label>
            <input
              type="text"
              value={hook}
              onChange={e => setHook(e.target.value)}
              placeholder="the trick your teacher never told you about..."
              className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              autoFocus
            />
          </div>

          {/* Day & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
                Day
              </label>
              <select
                value={day}
                onChange={e => setDay(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              >
                {DAYS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
                Time
              </label>
              <select
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              >
                {TIME_SLOTS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Platform (pre-filled if gap type is platform) */}
          <div>
            <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
              Platform {gap.type === 'platform' && <span className="text-amber-600">(gap target)</span>}
            </label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value as Platform)}
              className={`w-full px-3 py-2.5 border rounded-lg text-[13px] text-[#1a1a1a] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all ${
                gap.type === 'platform' ? 'bg-amber-50 border-amber-200' : 'bg-[#f9fafb] border-[#e5e7eb]'
              }`}
            >
              {(Object.keys(PLATFORMS) as Platform[]).map(p => (
                <option key={p} value={p}>{PLATFORMS[p].name}</option>
              ))}
            </select>
          </div>

          {/* Pillar (pre-filled if gap type is pillar) */}
          <div>
            <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
              Content Pillar {gap.type === 'pillar' && <span className="text-amber-600">(gap target)</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {PILLARS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPillar(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                    pillar === p.id
                      ? gap.type === 'pillar' && gap.value === p.id
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-[#211d1d] text-white border-[#211d1d]'
                      : 'bg-[#f9fafb] text-[#6b7280] border-[#e5e7eb] hover:border-[#d1d5db]'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Level & Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
                Level {gap.type === 'level' && <span className="text-amber-600">(gap target)</span>}
              </label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as ExamLevel)}
                className={`w-full px-3 py-2.5 border rounded-lg text-[13px] text-[#1a1a1a] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all ${
                  gap.type === 'level' ? 'bg-amber-50 border-amber-200' : 'bg-[#f9fafb] border-[#e5e7eb]'
                }`}
              >
                {(['GCSE', 'A-Level', 'IB'] as ExamLevel[]).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
                Subject {gap.type === 'subject' && <span className="text-amber-600">(gap target)</span>}
              </label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-[13px] text-[#1a1a1a] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all ${
                  gap.type === 'subject' ? 'bg-amber-50 border-amber-200' : 'bg-[#f9fafb] border-[#e5e7eb]'
                }`}
              >
                {settings.subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
              Topic (optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis, Quadratic Equations..."
              className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#e5e7eb]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!hook.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-[#e5e7eb] disabled:text-[#9ca3af] text-white rounded-lg text-[12px] font-medium transition-colors"
          >
            <Plus size={14} />
            Fill Gap
          </button>
        </div>
      </div>
    </div>
  );
}

// Quick Add Button Component
interface QuickAddButtonProps {
  day: string;
  settings: SettingsType;
  onAdd: (item: Omit<ContentItem, 'id'>) => void;
  variant?: 'default' | 'primary';
}

function QuickAddButton({ day, settings, onAdd, variant = 'default' }: QuickAddButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hook, setHook] = useState('');
  const [platform, setPlatform] = useState<Platform>(settings.platforms[0] || 'tiktok');
  const [time, setTime] = useState(TIME_SLOTS[0]);
  const [pillar, setPillar] = useState<Pillar>('teach');
  const [level, setLevel] = useState<ExamLevel>(settings.levels[0] || 'GCSE');
  const [subject, setSubject] = useState(settings.subjects[0] || 'Biology');
  const [topic, setTopic] = useState('');

  const handleAdd = () => {
    if (!hook.trim()) return;

    const itemContentType = (PLATFORM_CONTENT_TYPES[platform]?.[0] ?? 'video') as ContentItem['contentType'];
    onAdd({
      day,
      time,
      platform,
      contentType: itemContentType,
      hook: hook.trim(),
      caption: '',
      hashtags: [],
      topic: topic.trim() || subject,
      subject,
      level,
      pillar,
      filmed: itemContentType === 'text',
      posted: false,
    });

    // Reset
    setHook('');
    setTopic('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${
          variant === 'primary'
            ? 'bg-[#211d1d] text-white hover:bg-[#352f2f]'
            : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#1a1a1a]'
        }`}
      >
        <Plus size={14} />
        Add Content
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl p-6">
        <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-4">Add Content for {day}</h3>

        <div className="space-y-4">
          {/* Hook */}
          <div>
            <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
              Hook / Title
            </label>
            <input
              type="text"
              value={hook}
              onChange={e => setHook(e.target.value)}
              placeholder="the trick your teacher never told you about..."
              className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              autoFocus
            />
          </div>

          {/* Platform & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
                Platform
              </label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value as Platform)}
                className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              >
                {(Object.keys(PLATFORMS) as Platform[]).map(p => (
                  <option key={p} value={p}>{PLATFORMS[p].name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
                Time
              </label>
              <select
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              >
                {TIME_SLOTS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pillar */}
          <div>
            <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
              Content Pillar
            </label>
            <div className="flex flex-wrap gap-2">
              {PILLARS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPillar(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                    pillar === p.id
                      ? 'bg-[#211d1d] text-white border-[#211d1d]'
                      : 'bg-[#f9fafb] text-[#6b7280] border-[#e5e7eb] hover:border-[#d1d5db]'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Level & Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
                Level
              </label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as ExamLevel)}
                className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              >
                {(['GCSE', 'A-Level', 'IB'] as ExamLevel[]).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
                Subject
              </label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              >
                {settings.subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
              Topic (optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis, Quadratic Equations..."
              className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#e5e7eb]">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-[12px] font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!hook.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#211d1d] hover:bg-[#352f2f] disabled:bg-[#e5e7eb] disabled:text-[#9ca3af] text-white rounded-lg text-[12px] font-medium transition-colors"
          >
            <Sparkles size={14} />
            Add Content
          </button>
        </div>
      </div>
    </div>
  );
}

// Content Item Row Component
interface ContentItemRowProps {
  item: ContentItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleFilmed: () => void;
  onTogglePosted: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<ContentItem>) => void;
  getPlatformIcon: (platform: Platform) => string;
  onPostToLinkedIn?: () => void;
  linkedinConnected?: boolean;
  linkedinPosting?: boolean;
}

function ContentItemRow({
  item,
  expanded,
  onToggleExpand,
  onToggleFilmed,
  onTogglePosted,
  onDelete,
  onUpdate,
  getPlatformIcon,
  onPostToLinkedIn,
  linkedinConnected,
  linkedinPosting,
}: ContentItemRowProps) {
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState(item.caption);
  const [hashtags, setHashtags] = useState(item.hashtags.join(', '));

  const handleSaveCaption = () => {
    onUpdate({
      caption,
      hashtags: hashtags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setEditingCaption(false);
  };

  return (
    <div className="group">
      {/* Main row */}
      <button
        onClick={onToggleExpand}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#fafafa] transition-colors text-left"
      >
        <ChevronRight
          size={16}
          className={`text-[#9ca3af] transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              item.platform === 'tiktok' ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white' :
              item.platform === 'shorts' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
              item.platform === 'reels' ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white' :
              item.platform === 'facebook' ? 'bg-blue-600 text-white' :
              item.platform === 'linkedin' ? 'bg-sky-700 text-white' :
              item.platform === 'snapchat' ? 'bg-yellow-400 text-black' :
              'bg-red-600 text-white'
            }`}>
              {item.platform === 'tiktok' && '♪'}
              {item.platform === 'shorts' && '▶'}
              {item.platform === 'reels' && '◎'}
              {item.platform === 'facebook' && 'f'}
              {item.platform === 'linkedin' && 'in'}
              {item.platform === 'snapchat' && '👻'}
              {item.platform === 'ytlong' && '▶'}
              {PLATFORMS[item.platform]?.name || item.platform}
            </span>
            <span className="text-[11px] text-[#6b7280] flex items-center gap-1">
              <Clock size={10} />
              {item.time}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f3f4f6] text-[#6b7280]">
              {item.level}
            </span>
            <span className="text-[10px] text-[#9ca3af]">{item.topic}</span>
          </div>
          <p className="text-[13px] text-[#1a1a1a] truncate">{item.hook}</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            onClick={(e) => { e.stopPropagation(); onToggleFilmed(); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-all ${
              item.filmed
                ? 'bg-amber-100 text-amber-700'
                : 'bg-[#f3f4f6] text-[#9ca3af] hover:bg-amber-50 hover:text-amber-600'
            }`}
          >
            {item.filmed ? <Check size={12} /> : <Circle size={12} />}
            Filmed
          </div>
          <div
            onClick={(e) => { e.stopPropagation(); onTogglePosted(); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-all ${
              item.posted
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-[#f3f4f6] text-[#9ca3af] hover:bg-emerald-50 hover:text-emerald-600'
            }`}
          >
            {item.posted ? <Check size={12} /> : <Circle size={12} />}
            Posted
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-4 ml-10 border-l-2 border-[#e5e7eb]">
          <div className="pl-4 space-y-4">
            {/* Pillar tag */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Pillar:</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#211d1d]/10 text-[#211d1d]">
                {PILLARS.find(p => p.id === item.pillar)?.name}
              </span>
            </div>

            {/* Caption */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Caption</span>
                {!editingCaption && (
                  <button
                    onClick={() => setEditingCaption(true)}
                    className="text-[10px] text-[#211d1d] hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              {editingCaption ? (
                <div className="space-y-3">
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Write your caption here..."
                    className="w-full px-3 py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all resize-none"
                    rows={3}
                  />
                  <input
                    type="text"
                    value={hashtags}
                    onChange={e => setHashtags(e.target.value)}
                    placeholder="Hashtags (comma-separated)"
                    className="w-full px-3 py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveCaption}
                      className="px-3 py-1.5 bg-[#211d1d] text-white rounded text-[11px] font-medium hover:bg-[#352f2f] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setCaption(item.caption);
                        setHashtags(item.hashtags.join(', '));
                        setEditingCaption(false);
                      }}
                      className="px-3 py-1.5 text-[11px] text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {item.caption ? (
                    <p className="text-[12px] text-[#6b7280]">{item.caption}</p>
                  ) : (
                    <p className="text-[12px] text-[#9ca3af] italic">No caption yet</p>
                  )}
                  {item.hashtags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {item.hashtags.map((tag, i) => (
                        <span key={i} className="text-[11px] text-[#211d1d]">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => {
                  const text = `${item.hook}\n\n${item.caption}\n\n${item.hashtags.map(t => `#${t}`).join(' ')}`;
                  navigator.clipboard.writeText(text);
                }}
                className="flex items-center gap-1.5 text-[11px] text-[#6b7280] hover:text-[#211d1d] transition-colors"
              >
                <Copy size={12} />
                Copy all
              </button>
              {item.platform === 'linkedin' && linkedinConnected && !item.posted && onPostToLinkedIn && (
                <button
                  onClick={onPostToLinkedIn}
                  disabled={linkedinPosting}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-[#0a66c2] hover:text-[#004182] transition-colors disabled:opacity-50"
                >
                  {linkedinPosting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Linkedin size={12} />
                  )}
                  {linkedinPosting ? 'Posting...' : 'Post to LinkedIn'}
                </button>
              )}
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 text-[11px] text-[#6b7280] hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
