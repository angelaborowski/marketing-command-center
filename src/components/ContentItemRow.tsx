import { useState, useRef } from 'react';
import {
  ChevronRight,
  Check,
  Circle,
  Copy,
  Plus,
  Clock,
  Loader2,
  Linkedin,
} from 'lucide-react';
import type { ContentItem, Platform } from '../types';
import { PLATFORMS, PILLARS } from '../types';
import { getPlatformIcon } from '../lib/platformUtils';

export interface ContentItemRowProps {
  item: ContentItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleFilmed: () => void;
  onTogglePosted: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<ContentItem>) => void;
  onDuplicate: (targetPlatform: Platform) => void;
  onPostToLinkedIn?: () => void;
  linkedinConnected?: boolean;
  linkedinPosting?: boolean;
}

export default function ContentItemRow({
  item,
  expanded,
  onToggleExpand,
  onToggleFilmed,
  onTogglePosted,
  onDelete,
  onUpdate,
  onDuplicate,
  onPostToLinkedIn,
  linkedinConnected,
  linkedinPosting,
}: ContentItemRowProps) {
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState(item.caption);
  const [hashtags, setHashtags] = useState(item.hashtags.join(', '));
  const [showDuplicateMenu, setShowDuplicateMenu] = useState(false);
  const duplicateRef = useRef<HTMLDivElement>(null);

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
              {/* Duplicate to platform */}
              <div className="relative" ref={duplicateRef}>
                <button
                  onClick={() => setShowDuplicateMenu(!showDuplicateMenu)}
                  className="flex items-center gap-1.5 text-[11px] text-[#6b7280] hover:text-[#211d1d] transition-colors"
                >
                  <Plus size={12} />
                  Duplicate to...
                </button>
                {showDuplicateMenu && (
                  <div className="absolute left-0 bottom-full mb-1 w-44 bg-white rounded-lg border border-[#e5e7eb] shadow-lg z-30 py-1">
                    {(Object.keys(PLATFORMS) as Platform[])
                      .filter(p => p !== item.platform)
                      .map(p => (
                        <button
                          key={p}
                          onClick={() => {
                            onDuplicate(p);
                            setShowDuplicateMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#374151] hover:bg-[#f3f4f6] transition-colors text-left"
                        >
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            p === 'tiktok' ? 'bg-pink-100 text-pink-600' :
                            p === 'shorts' ? 'bg-red-100 text-red-600' :
                            p === 'reels' ? 'bg-purple-100 text-purple-600' :
                            p === 'facebook' ? 'bg-blue-100 text-blue-600' :
                            p === 'linkedin' ? 'bg-sky-100 text-sky-600' :
                            p === 'snapchat' ? 'bg-yellow-100 text-yellow-600' :
                            p === 'ytlong' ? 'bg-red-100 text-red-600' :
                            p === 'reddit' ? 'bg-orange-100 text-orange-600' :
                            p === 'mumsnet' ? 'bg-teal-100 text-teal-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {getPlatformIcon(p)}
                          </span>
                          {PLATFORMS[p].name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
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
                className="flex items-center gap-1.5 text-[11px] text-red-400 hover:text-red-600 transition-colors ml-auto"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
