import { useState, useEffect } from 'react';
import {
  X,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import type { ContentItem, PerformanceMetrics, Platform } from '../types';
import { PLATFORMS } from '../types';
import { createPerformanceMetrics, getEngagementLevel, getEngagementColor } from '../lib/performance';

interface PerformanceInputProps {
  isOpen: boolean;
  onClose: () => void;
  item: ContentItem | null;
  onSave: (itemId: string, metrics: PerformanceMetrics) => void;
}

export default function PerformanceInput({ isOpen, onClose, item, onSave }: PerformanceInputProps) {
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [saves, setSaves] = useState('');

  // Reset form when item changes
  useEffect(() => {
    if (item?.performance) {
      setViews(item.performance.views.toString());
      setLikes(item.performance.likes.toString());
      setComments(item.performance.comments.toString());
      setShares(item.performance.shares.toString());
      setSaves(item.performance.saves?.toString() || '');
    } else {
      setViews('');
      setLikes('');
      setComments('');
      setShares('');
      setSaves('');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const parseNumber = (val: string): number => {
    const num = parseInt(val.replace(/,/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const currentMetrics = createPerformanceMetrics(
    parseNumber(views),
    parseNumber(likes),
    parseNumber(comments),
    parseNumber(shares),
    parseNumber(saves) || undefined
  );

  const handleSave = () => {
    if (parseNumber(views) > 0) {
      onSave(item.id, currentMetrics);
      onClose();
    }
  };

  const platformInfo = PLATFORMS[item.platform];
  const engagementLevel = getEngagementLevel(currentMetrics.engagementRate);
  const engagementColor = getEngagementColor(currentMetrics.engagementRate);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1a1a1a]">Track Performance</h2>
            <p className="text-[12px] text-[#6b7280] mt-0.5">
              Enter metrics from {platformInfo?.name || item.platform}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f3f4f6] rounded-lg transition-colors"
          >
            <X size={18} className="text-[#6b7280]" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="px-5 py-3 bg-[#f9fafb] border-b border-[#e5e7eb]">
          <div className="flex items-start gap-3">
            <span className={`text-[10px] font-medium px-2 py-1 rounded ${platformInfo?.color || 'text-gray-500'} bg-opacity-10 bg-current`}>
              {platformInfo?.name || item.platform}
            </span>
            <p className="text-[12px] text-[#374151] line-clamp-2 flex-1">{item.hook}</p>
          </div>
        </div>

        {/* Metrics Form */}
        <div className="p-5 space-y-4">
          {/* Views */}
          <div>
            <label className="flex items-center gap-2 text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5">
              <Eye size={14} />
              Views
            </label>
            <input
              type="text"
              value={views}
              onChange={e => setViews(e.target.value)}
              placeholder="e.g., 10,000"
              className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              autoFocus
            />
          </div>

          {/* Engagement Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5">
                <Heart size={14} />
                Likes
              </label>
              <input
                type="text"
                value={likes}
                onChange={e => setLikes(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5">
                <MessageCircle size={14} />
                Comments
              </label>
              <input
                type="text"
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5">
                <Share2 size={14} />
                Shares
              </label>
              <input
                type="text"
                value={shares}
                onChange={e => setShares(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5">
                <Bookmark size={14} />
                Saves (optional)
              </label>
              <input
                type="text"
                value={saves}
                onChange={e => setSaves(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 transition-all"
              />
            </div>
          </div>

          {/* Live Engagement Preview */}
          {parseNumber(views) > 0 && (
            <div className="mt-4 p-4 bg-[#f9fafb] rounded-lg border border-[#e5e7eb]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className={engagementColor} />
                  <span className="text-[12px] text-[#6b7280]">Engagement Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[15px] font-semibold ${engagementColor}`}>
                    {currentMetrics.engagementRate.toFixed(2)}%
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    engagementLevel === 'viral' ? 'bg-purple-100 text-purple-700' :
                    engagementLevel === 'high' ? 'bg-green-100 text-green-700' :
                    engagementLevel === 'good' ? 'bg-blue-100 text-blue-700' :
                    engagementLevel === 'average' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {engagementLevel === 'viral' && <Sparkles size={10} className="inline mr-1" />}
                    {engagementLevel.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e5e7eb] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={parseNumber(views) === 0}
            className="px-4 py-2 bg-[#211d1d] text-white text-[13px] font-medium rounded-lg hover:bg-[#352f2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Metrics
          </button>
        </div>
      </div>
    </div>
  );
}
