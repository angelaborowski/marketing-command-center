import {
  Check,
  Send,
  Copy,
  Hash,
  Loader2,
  Linkedin,
} from 'lucide-react';
import PostDuplicateButton from './PostDuplicateButton';
import type { ContentItem, Platform } from '../types';
import { PLATFORMS } from '../types';

export interface PostViewProps {
  items: ContentItem[];
  onTogglePosted: (id: string) => void;
  onDuplicate: (id: string, targetPlatform: Platform) => void;
  onPostToLinkedIn: (id: string) => void;
  linkedinConnected: boolean;
  linkedinPosting: boolean;
}

export default function PostView({
  items,
  onTogglePosted,
  onDuplicate,
  onPostToLinkedIn,
  linkedinConnected,
  linkedinPosting,
}: PostViewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Ready to Post</h2>
            <p className="text-[12px] text-[#6b7280] mt-0.5">
              {items.length} items ready to publish
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-[12px] text-blue-700 font-medium">
            <Send size={14} />
            {items.length} ready
          </div>
        </div>

        {/* Content list */}
        <div className="divide-y divide-[#e5e7eb]">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Send size={24} className="text-[#9ca3af]" />
              </div>
              <div className="text-[#1a1a1a] font-medium text-[14px] mb-1">Nothing to post</div>
              <div className="text-[#6b7280] text-[12px]">Film some content first, then come back here</div>
            </div>
          ) : (
            items.map(item => {
              const isTextContent = item.contentType === 'text';
              return (
                <div
                  key={item.id}
                  className="px-5 py-4 hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => onTogglePosted(item.id)}
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
                        <PostDuplicateButton
                          item={item}
                          onDuplicate={(targetPlatform) => onDuplicate(item.id, targetPlatform)}
                        />
                        {item.platform === 'linkedin' && linkedinConnected && !item.posted && (
                          <button
                            onClick={() => onPostToLinkedIn(item.id)}
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
  );
}
