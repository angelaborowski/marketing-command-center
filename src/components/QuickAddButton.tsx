import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import type { ContentItem, Platform, Pillar, ExamLevel, Settings as SettingsType } from '../types';
import { PLATFORMS, PLATFORM_CONTENT_TYPES, PILLARS, TIME_SLOTS } from '../types';

interface QuickAddButtonProps {
  day: string;
  settings: SettingsType;
  onAdd: (item: Omit<ContentItem, 'id'>) => void;
  variant?: 'default' | 'primary';
}

export default function QuickAddButton({ day, settings, onAdd, variant = 'default' }: QuickAddButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hook, setHook] = useState('');
  const [platform, setPlatform] = useState<Platform>(settings.platforms[0] || 'tiktok');
  const [time, setTime] = useState<string>(TIME_SLOTS[0]);
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
