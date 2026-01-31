import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Copy,
  Pencil,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Circle,
  Command,
} from 'lucide-react';

// Platform icons using simple text/emoji representations
const platformIcons: Record<string, { icon: string; color: string }> = {
  tiktok: { icon: '♪', color: '#ff6b9d' },
  ytshorts: { icon: '▶', color: '#ff4444' },
  reels: { icon: '◎', color: '#c77dff' },
  facebook: { icon: 'f', color: '#1877f2' },
  snapchat: { icon: '👻', color: '#fffc00' },
  linkedin: { icon: 'in', color: '#0a66c2' },
  ytlong: { icon: '▶', color: '#ff4444' },
  instagram: { icon: '📷', color: '#c77dff' },
  twitter: { icon: '𝕏', color: '#1da1f2' },
  youtube: { icon: '▶', color: '#ff4444' },
};

// Types
export interface ContentItem {
  id: string;
  platform: string;
  subject: string;
  hook: string;
  caption: string;
  scheduledTime: string;
  scheduledDay: string;
  filmed: boolean;
  posted: boolean;
}

interface WeekViewProps {
  content: ContentItem[];
  onGenerate: () => void;
  onEdit: (id: string, field: string, value: string) => void;
  onRegenerate: (id: string) => void;
  onCopy: (text: string) => void;
  onStatusChange: (id: string, field: 'filmed' | 'posted') => void;
  isGenerating: boolean;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayAbbrevs = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeekView({
  content,
  onGenerate,
  onEdit,
  onRegenerate,
  onCopy,
  onStatusChange,
  isGenerating,
}: WeekViewProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingCard, setEditingCard] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Group content by day
  const contentByDay = days.reduce((acc, day) => {
    acc[day] = content.filter((item) => item.scheduledDay === day);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  // Post counts per day
  const postCounts = days.map((day) => contentByDay[day].length);
  const totalPosts = content.length;

  // Keyboard shortcut for generate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command+G or Ctrl+G to generate
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        if (!isGenerating) {
          onGenerate();
        }
      }
      // Escape to cancel editing
      if (e.key === 'Escape' && editingCard) {
        setEditingCard(null);
        setEditValue('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, onGenerate, editingCard]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCard && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCard]);

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const startEditing = (id: string, field: string, currentValue: string) => {
    setEditingCard({ id, field });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingCard) {
      onEdit(editingCard.id, editingCard.field, editValue);
      setEditingCard(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setEditValue('');
  };

  const handleCopy = useCallback(
    (id: string, text: string) => {
      onCopy(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    },
    [onCopy]
  );

  const getPlatformInfo = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase().replace(/\s+/g, '');
    return (
      platformIcons[normalizedPlatform] || {
        icon: platform.charAt(0).toUpperCase(),
        color: '#6b7280',
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#fafafa]/95 backdrop-blur-sm border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[15px] font-semibold text-[#111827] tracking-[-0.01em]">
                Week View
              </h1>
              <p className="text-[13px] text-[#6b7280] mt-0.5">
                {totalPosts} posts scheduled this week
              </p>
            </div>

            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#1f2937] disabled:bg-[#9ca3af] text-white text-[13px] font-medium rounded-lg transition-all duration-150 shadow-sm hover:shadow disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate New Week
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Week Overview Bar */}
      <div className="border-b border-[#e5e7eb] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const count = postCounts[index];
              const isToday =
                new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;

              return (
                <div
                  key={day}
                  className={`text-center py-2 px-3 rounded-lg transition-all duration-150 ${
                    isToday
                      ? 'bg-[#111827] text-white'
                      : count > 0
                      ? 'bg-[#f3f4f6] text-[#111827]'
                      : 'bg-transparent text-[#9ca3af]'
                  }`}
                >
                  <div className="text-[11px] font-medium uppercase tracking-wider opacity-70">
                    {dayAbbrevs[index]}
                  </div>
                  <div className="text-[18px] font-semibold mt-0.5">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {days.map((day) => {
          const dayContent = contentByDay[day];
          if (dayContent.length === 0) return null;

          const isToday =
            new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;

          return (
            <section key={day} className="mb-8">
              {/* Day Header */}
              <div className="flex items-center gap-3 mb-4">
                <h2
                  className={`text-[13px] font-semibold tracking-[-0.01em] ${
                    isToday ? 'text-[#111827]' : 'text-[#6b7280]'
                  }`}
                >
                  {day}
                  {isToday && (
                    <span className="ml-2 text-[11px] font-medium text-[#059669] bg-[#d1fae5] px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </h2>
                <div className="flex-1 h-px bg-[#e5e7eb]" />
                <span className="text-[12px] text-[#9ca3af]">
                  {dayContent.length} post{dayContent.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Content Cards */}
              <div className="space-y-3">
                {dayContent.map((item) => {
                  const isExpanded = expandedCards.has(item.id);
                  const isEditing = editingCard?.id === item.id;
                  const platformInfo = getPlatformInfo(item.platform);
                  const isCopied = copiedId === item.id;

                  return (
                    <article
                      key={item.id}
                      className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Card Header */}
                      <div className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: Platform + Meta */}
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Platform Icon */}
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                              style={{
                                backgroundColor: `${platformInfo.color}15`,
                                color: platformInfo.color,
                              }}
                            >
                              {platformInfo.icon}
                            </div>

                            {/* Meta Info */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-[13px] font-medium capitalize"
                                  style={{ color: platformInfo.color }}
                                >
                                  {item.platform}
                                </span>
                                <span className="text-[12px] text-[#9ca3af]">
                                  {item.scheduledTime}
                                </span>
                              </div>
                              <div className="text-[13px] text-[#374151] font-medium truncate mt-0.5">
                                {item.subject}
                              </div>
                            </div>
                          </div>

                          {/* Right: Status Dots */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => onStatusChange(item.id, 'filmed')}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 ${
                                item.filmed
                                  ? 'bg-[#fef3c7] text-[#d97706]'
                                  : 'bg-[#f3f4f6] text-[#9ca3af] hover:bg-[#e5e7eb]'
                              }`}
                            >
                              {item.filmed ? (
                                <Check size={12} />
                              ) : (
                                <Circle size={10} className="opacity-50" />
                              )}
                              Filmed
                            </button>
                            <button
                              onClick={() => onStatusChange(item.id, 'posted')}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 ${
                                item.posted
                                  ? 'bg-[#d1fae5] text-[#059669]'
                                  : 'bg-[#f3f4f6] text-[#9ca3af] hover:bg-[#e5e7eb]'
                              }`}
                            >
                              {item.posted ? (
                                <Check size={12} />
                              ) : (
                                <Circle size={10} className="opacity-50" />
                              )}
                              Posted
                            </button>
                          </div>
                        </div>

                        {/* Hook Text */}
                        <div className="mt-4">
                          {isEditing && editingCard.field === 'hook' ? (
                            <div className="space-y-2">
                              <textarea
                                ref={editInputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full px-3 py-2 text-[14px] text-[#111827] bg-[#f9fafb] border border-[#d1d5db] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
                                rows={2}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    saveEdit();
                                  }
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={saveEdit}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#111827] text-white text-[12px] font-medium rounded-md hover:bg-[#1f2937] transition-colors"
                                >
                                  <Check size={12} />
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f3f4f6] text-[#6b7280] text-[12px] font-medium rounded-md hover:bg-[#e5e7eb] transition-colors"
                                >
                                  <X size={12} />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[14px] text-[#111827] leading-relaxed">
                              {item.hook}
                            </p>
                          )}
                        </div>

                        {/* Expandable Caption */}
                        {item.caption && (
                          <div className="mt-3">
                            <button
                              onClick={() => toggleExpand(item.id)}
                              className="flex items-center gap-1 text-[12px] text-[#6b7280] hover:text-[#111827] transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={14} />
                                  Hide caption
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={14} />
                                  Show caption
                                </>
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 p-4 bg-[#f9fafb] rounded-lg">
                                {isEditing && editingCard.field === 'caption' ? (
                                  <div className="space-y-2">
                                    <textarea
                                      ref={editInputRef}
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="w-full px-3 py-2 text-[13px] text-[#374151] bg-white border border-[#d1d5db] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
                                      rows={4}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.metaKey) {
                                          e.preventDefault();
                                          saveEdit();
                                        }
                                      }}
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={saveEdit}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#111827] text-white text-[12px] font-medium rounded-md hover:bg-[#1f2937] transition-colors"
                                      >
                                        <Check size={12} />
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-[#6b7280] text-[12px] font-medium rounded-md border border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors"
                                      >
                                        <X size={12} />
                                        Cancel
                                      </button>
                                      <span className="text-[11px] text-[#9ca3af] ml-2">
                                        Press <kbd className="px-1 py-0.5 bg-[#e5e7eb] rounded text-[10px]">Cmd</kbd>+<kbd className="px-1 py-0.5 bg-[#e5e7eb] rounded text-[10px]">Enter</kbd> to save
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[13px] text-[#374151] leading-relaxed whitespace-pre-wrap">
                                    {item.caption}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="px-5 py-3 bg-[#f9fafb] border-t border-[#e5e7eb] flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(item.id, `${item.hook}\n\n${item.caption}`)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-150 ${
                            isCopied
                              ? 'bg-[#d1fae5] text-[#059669]'
                              : 'text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#111827]'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check size={13} />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              Copy
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => startEditing(item.id, 'hook', item.hook)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#111827] rounded-md transition-all duration-150"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>

                        <button
                          onClick={() => onRegenerate(item.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#111827] rounded-md transition-all duration-150"
                        >
                          <RefreshCw size={13} />
                          Regenerate
                        </button>

                        {item.caption && isExpanded && !isEditing && (
                          <button
                            onClick={() => startEditing(item.id, 'caption', item.caption)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#111827] rounded-md transition-all duration-150 ml-auto"
                          >
                            <Pencil size={13} />
                            Edit Caption
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Empty State */}
        {totalPosts === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f3f4f6] flex items-center justify-center">
              <Sparkles size={24} className="text-[#9ca3af]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#111827] mb-1">
              No content scheduled
            </h3>
            <p className="text-[13px] text-[#6b7280] mb-6">
              Generate your first week of content to get started
            </p>
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111827] hover:bg-[#1f2937] disabled:bg-[#9ca3af] text-white text-[13px] font-medium rounded-lg transition-all duration-150 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate New Week
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {/* Keyboard Shortcuts Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#e5e7eb] py-3 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-[12px] text-[#6b7280]">
            <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-[#f3f4f6] border border-[#e5e7eb] rounded text-[11px] font-medium text-[#374151]">
              <Command size={11} />G
            </kbd>
            <span>Generate week</span>
          </div>
          <div className="w-px h-4 bg-[#e5e7eb]" />
          <div className="flex items-center gap-2 text-[12px] text-[#6b7280]">
            <kbd className="px-2 py-1 bg-[#f3f4f6] border border-[#e5e7eb] rounded text-[11px] font-medium text-[#374151]">
              Esc
            </kbd>
            <span>Cancel edit</span>
          </div>
          <div className="w-px h-4 bg-[#e5e7eb]" />
          <div className="flex items-center gap-2 text-[12px] text-[#6b7280]">
            <kbd className="px-2 py-1 bg-[#f3f4f6] border border-[#e5e7eb] rounded text-[11px] font-medium text-[#374151]">
              Enter
            </kbd>
            <span>Save edit</span>
          </div>
        </div>
      </footer>

      {/* Bottom padding for footer */}
      <div className="h-16" />
    </div>
  );
}
