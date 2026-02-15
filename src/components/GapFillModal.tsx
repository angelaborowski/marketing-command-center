import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { ContentItem, Platform, Pillar, ExamLevel, ContentGap, Settings as SettingsType } from '../types';
import { PLATFORMS, PLATFORM_CONTENT_TYPES, PILLARS, DAYS, TIME_SLOTS } from '../types';

interface GapFillModalProps {
  gap: ContentGap;
  settings: SettingsType;
  onAdd: (item: Omit<ContentItem, 'id'>) => void;
  onClose: () => void;
}

export default function GapFillModal({ gap, settings, onAdd, onClose }: GapFillModalProps) {
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
  const [time, setTime] = useState<string>(TIME_SLOTS[0]);
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

          {/* Platform */}
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

          {/* Pillar */}
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
