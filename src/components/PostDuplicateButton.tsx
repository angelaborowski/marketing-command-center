import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { ContentItem, Platform } from '../types';
import { PLATFORMS } from '../types';
import { getPlatformIcon } from '../lib/platformUtils';

interface PostDuplicateButtonProps {
  item: ContentItem;
  onDuplicate: (targetPlatform: Platform) => void;
}

export default function PostDuplicateButton({ item, onDuplicate }: PostDuplicateButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] text-[#6b7280] hover:text-[#211d1d] transition-colors"
      >
        <Plus size={12} />
        Duplicate to...
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-1 w-44 bg-white rounded-lg border border-[#e5e7eb] shadow-lg z-30 py-1">
          {(Object.keys(PLATFORMS) as Platform[])
            .filter(p => p !== item.platform)
            .map(p => (
              <button
                key={p}
                onClick={() => {
                  onDuplicate(p);
                  setOpen(false);
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
  );
}
