import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Key,
  Youtube,
  Users,
  Layout,
  GraduationCap,
  BookOpen,
  Calendar,
  CalendarSync,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Clock,
  Bell,
  Video,
  Send,
} from 'lucide-react';
import type { Settings as SettingsType, Platform, ExamLevel, CalendarSyncSettings } from '../types';
import { PLATFORMS, DAYS, SUBJECTS, DEFAULT_SETTINGS, DEFAULT_CALENDAR_SETTINGS, STORAGE_KEYS } from '../types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  calendarConnected?: boolean;
  onCalendarConnect?: () => void;
  onCalendarDisconnect?: () => void;
}

export default function Settings({
  isOpen,
  onClose,
  settings,
  onSave,
  calendarConnected = false,
  onCalendarConnect,
  onCalendarDisconnect,
}: SettingsProps) {
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
  const [newCreatorId, setNewCreatorId] = useState('');
  const [newCreatorName, setNewCreatorName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'creators' | 'content' | 'schedule' | 'calendar'>('api');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Initialize calendar sync settings if not present
  useEffect(() => {
    if (!localSettings.calendarSync) {
      setLocalSettings(prev => ({
        ...prev,
        calendarSync: DEFAULT_CALENDAR_SETTINGS,
      }));
    }
  }, [localSettings.calendarSync]);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(localSettings));
    onSave(localSettings);
    onClose();
  };

  const addCreator = () => {
    if (newCreatorId.trim() && newCreatorName.trim()) {
      setLocalSettings(prev => ({
        ...prev,
        creators: [...prev.creators, {
          id: `creator-${Date.now()}`,
          name: newCreatorName.trim(),
          channelId: newCreatorId.trim(),
        }],
      }));
      setNewCreatorId('');
      setNewCreatorName('');
    }
  };

  const removeCreator = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      creators: prev.creators.filter(c => c.id !== id),
    }));
  };

  const togglePlatform = (platform: Platform) => {
    setLocalSettings(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const toggleLevel = (level: ExamLevel) => {
    setLocalSettings(prev => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter(l => l !== level)
        : [...prev.levels, level],
    }));
  };

  const toggleSubject = (subject: string) => {
    setLocalSettings(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const addCustomSubject = () => {
    if (newSubject.trim() && !localSettings.subjects.includes(newSubject.trim())) {
      setLocalSettings(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject.trim()],
      }));
      setNewSubject('');
    }
  };

  const updateCalendarSetting = <K extends keyof CalendarSyncSettings>(
    key: K,
    value: CalendarSyncSettings[K]
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      calendarSync: {
        ...(prev.calendarSync || DEFAULT_CALENDAR_SETTINGS),
        [key]: value,
      },
    }));
  };

  if (!isOpen) return null;

  const calendarSettings = localSettings.calendarSync || DEFAULT_CALENDAR_SETTINGS;

  const tabs = [
    { id: 'api' as const, label: 'API Keys', icon: Key },
    { id: 'creators' as const, label: 'Creators', icon: Users },
    { id: 'content' as const, label: 'Content', icon: Layout },
    { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
    { id: 'calendar' as const, label: 'Calendar', icon: CalendarSync },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              {/* Claude API Key */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Key size={16} className="text-gray-400" />
                  Claude API Key
                </label>
                <div className="relative">
                  <input
                    type={showClaudeKey ? 'text' : 'password'}
                    value={localSettings.claudeApiKey}
                    onChange={e => setLocalSettings(prev => ({ ...prev, claudeApiKey: e.target.value }))}
                    placeholder="sk-ant-..."
                    className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClaudeKey(!showClaudeKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showClaudeKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Used for generating hooks and analyzing competitor content
                </p>
              </div>

              {/* YouTube API Key */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Youtube size={16} className="text-red-500" />
                  YouTube API Key
                </label>
                <div className="relative">
                  <input
                    type={showYoutubeKey ? 'text' : 'password'}
                    value={localSettings.youtubeApiKey}
                    onChange={e => setLocalSettings(prev => ({ ...prev, youtubeApiKey: e.target.value }))}
                    placeholder="AIza..."
                    className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showYoutubeKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Used for fetching creator videos and extracting hook formulas
                </p>
              </div>
            </div>
          )}

          {/* Creators Tab */}
          {activeTab === 'creators' && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Users size={16} className="text-gray-400" />
                  Creators to Follow
                </label>
                <p className="text-xs text-gray-500 mb-4">
                  Add YouTube channel IDs to track and analyze their content
                </p>

                {/* Add creator form */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newCreatorName}
                    onChange={e => setNewCreatorName(e.target.value)}
                    placeholder="Creator name"
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <input
                    type="text"
                    value={newCreatorId}
                    onChange={e => setNewCreatorId(e.target.value)}
                    placeholder="Channel ID (UC...)"
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    onKeyDown={e => e.key === 'Enter' && addCreator()}
                  />
                  <button
                    onClick={addCreator}
                    disabled={!newCreatorId.trim() || !newCreatorName.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Creator list */}
                <div className="space-y-2">
                  {localSettings.creators.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      No creators added yet
                    </div>
                  ) : (
                    localSettings.creators.map(creator => (
                      <div
                        key={creator.id}
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg group"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">{creator.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{creator.channelId}</div>
                        </div>
                        <button
                          onClick={() => removeCreator(creator.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-8">
              {/* Platforms */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Layout size={16} className="text-gray-400" />
                  Default Platforms
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(PLATFORMS) as Platform[]).map(platform => (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        localSettings.platforms.includes(platform)
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {PLATFORMS[platform].name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exam Levels */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <GraduationCap size={16} className="text-gray-400" />
                  Exam Levels
                </label>
                <div className="flex gap-2">
                  {(['GCSE', 'A-Level', 'IB'] as ExamLevel[]).map(level => (
                    <button
                      key={level}
                      onClick={() => toggleLevel(level)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        localSettings.levels.includes(level)
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <BookOpen size={16} className="text-gray-400" />
                  Subjects to Cover
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SUBJECTS.map(subject => (
                    <button
                      key={subject}
                      onClick={() => toggleSubject(subject)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        localSettings.subjects.includes(subject)
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>

                {/* Custom subjects */}
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="Add custom subject..."
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    onKeyDown={e => e.key === 'Enter' && addCustomSubject()}
                  />
                  <button
                    onClick={addCustomSubject}
                    disabled={!newSubject.trim()}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Calendar size={16} className="text-gray-400" />
                  Batch Filming Day
                </label>
                <p className="text-xs text-gray-500 mb-4">
                  Select which day you want to batch film all your content
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => setLocalSettings(prev => ({ ...prev, batchDay: day }))}
                      className={`py-3 rounded-lg text-sm font-medium border transition-all ${
                        localSettings.batchDay === day
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Batch day info */}
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Calendar size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-emerald-900">
                      Batch filming set for {localSettings.batchDay}
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      All content scheduled for the week will be grouped for filming on this day
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Sync Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {/* Connection Status */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <CalendarSync size={16} className="text-gray-400" />
                  Google Calendar Connection
                </label>

                <div className={`p-4 rounded-lg border ${
                  calendarConnected
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {calendarConnected ? (
                        <CheckCircle size={20} className="text-emerald-600" />
                      ) : (
                        <XCircle size={20} className="text-gray-400" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${
                          calendarConnected ? 'text-emerald-900' : 'text-gray-700'
                        }`}>
                          {calendarConnected ? 'Connected to Google Calendar' : 'Not connected'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {calendarConnected
                            ? 'Your content will sync to your primary calendar'
                            : 'Connect to sync your content schedule'}
                        </p>
                      </div>
                    </div>

                    {calendarConnected ? (
                      <button
                        onClick={onCalendarDisconnect}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={onCalendarConnect}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <LogIn size={16} />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sync Settings - Only show when connected */}
              {calendarConnected && (
                <>
                  {/* Toggle Switches */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">Sync Options</label>

                    {/* Enable Calendar Sync */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CalendarSync size={18} className="text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Enable calendar sync</p>
                          <p className="text-xs text-gray-500">Sync your content to Google Calendar</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateCalendarSetting('enabled', !calendarSettings.enabled)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          calendarSettings.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            calendarSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Auto-sync on changes */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock size={18} className="text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Auto-sync on changes</p>
                          <p className="text-xs text-gray-500">Automatically sync when content is modified</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateCalendarSetting('autoSync', !calendarSettings.autoSync)}
                        disabled={!calendarSettings.enabled}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          calendarSettings.autoSync && calendarSettings.enabled
                            ? 'bg-blue-600'
                            : 'bg-gray-300'
                        } ${!calendarSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            calendarSettings.autoSync && calendarSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Create filming events */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Video size={18} className="text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Create filming events</p>
                          <p className="text-xs text-gray-500">Add batch filming events to your calendar</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateCalendarSetting('createFilmingEvents', !calendarSettings.createFilmingEvents)}
                        disabled={!calendarSettings.enabled}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          calendarSettings.createFilmingEvents && calendarSettings.enabled
                            ? 'bg-blue-600'
                            : 'bg-gray-300'
                        } ${!calendarSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            calendarSettings.createFilmingEvents && calendarSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Create posting events */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Send size={18} className="text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Create posting events</p>
                          <p className="text-xs text-gray-500">Add posting reminders for each content item</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateCalendarSetting('createPostingEvents', !calendarSettings.createPostingEvents)}
                        disabled={!calendarSettings.enabled}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          calendarSettings.createPostingEvents && calendarSettings.enabled
                            ? 'bg-blue-600'
                            : 'bg-gray-300'
                        } ${!calendarSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            calendarSettings.createPostingEvents && calendarSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Duration Settings */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">Event Settings</label>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Reminder minutes */}
                      <div>
                        <label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Bell size={14} />
                          Reminder (minutes before)
                        </label>
                        <input
                          type="number"
                          value={calendarSettings.reminderMinutesBefore}
                          onChange={e => updateCalendarSetting('reminderMinutesBefore', Math.max(0, parseInt(e.target.value) || 0))}
                          disabled={!calendarSettings.enabled}
                          min="0"
                          max="1440"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Filming event duration */}
                      <div>
                        <label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Video size={14} />
                          Filming duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={calendarSettings.filmingEventDuration}
                          onChange={e => updateCalendarSetting('filmingEventDuration', Math.max(15, parseInt(e.target.value) || 60))}
                          disabled={!calendarSettings.enabled}
                          min="15"
                          max="480"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Posting event duration */}
                      <div>
                        <label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Send size={14} />
                          Posting duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={calendarSettings.postingEventDuration}
                          onChange={e => updateCalendarSetting('postingEventDuration', Math.max(5, parseInt(e.target.value) || 15))}
                          disabled={!calendarSettings.enabled}
                          min="5"
                          max="120"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Info when not connected */}
              {!calendarConnected && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CalendarSync size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        Sync your content schedule
                      </h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Connect your Google Calendar to automatically create events for filming days and posting reminders. Never miss a posting time again!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setLocalSettings(DEFAULT_SETTINGS)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Reset to defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
