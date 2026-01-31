import { useState } from 'react';
import {
  Check,
  Copy,
  Clock,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Send,
  Sparkles
} from 'lucide-react';

// Types
export interface PlatformStatus {
  filmed: boolean;
  edited: boolean;
  posted: boolean;
}

export interface ScheduledPost {
  id: string;
  ideaId: string;
  hook: string;
  platform: string;
  scheduledTime: string; // e.g., "9:00 AM"
  caption: string;
  hashtags?: string[];
  status: PlatformStatus;
  pillar: string;
  topic: string;
}

export interface PostViewProps {
  posts: ScheduledPost[];
  date: Date;
  onMarkPosted: (postId: string) => void;
  onCopyCaption: (caption: string) => void;
}

// Platform config
const platforms: Record<string, { name: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  tiktok: {
    name: 'TikTok',
    color: 'text-[#ff6b9d]',
    bgColor: 'bg-[#ff6b9d]/10',
    borderColor: 'border-[#ff6b9d]/30',
    icon: '♪'
  },
  ytshorts: {
    name: 'YouTube Shorts',
    color: 'text-[#ff4444]',
    bgColor: 'bg-[#ff4444]/10',
    borderColor: 'border-[#ff4444]/30',
    icon: '▶'
  },
  reels: {
    name: 'Instagram Reels',
    color: 'text-[#c77dff]',
    bgColor: 'bg-[#c77dff]/10',
    borderColor: 'border-[#c77dff]/30',
    icon: '◎'
  },
  facebook: {
    name: 'Facebook',
    color: 'text-[#1877f2]',
    bgColor: 'bg-[#1877f2]/10',
    borderColor: 'border-[#1877f2]/30',
    icon: 'f'
  },
  snapchat: {
    name: 'Snapchat',
    color: 'text-[#fffc00]',
    bgColor: 'bg-[#fffc00]/10',
    borderColor: 'border-[#fffc00]/30',
    icon: '👻'
  },
  linkedin: {
    name: 'LinkedIn',
    color: 'text-[#0a66c2]',
    bgColor: 'bg-[#0a66c2]/10',
    borderColor: 'border-[#0a66c2]/30',
    icon: 'in'
  },
  ytlong: {
    name: 'YouTube',
    color: 'text-[#ff4444]',
    bgColor: 'bg-[#ff4444]/10',
    borderColor: 'border-[#ff4444]/30',
    icon: '▶'
  }
};

// Format date for display
const formatDate = (date: Date): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'TODAY';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'TOMORROW';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).toUpperCase();
};

export default function PostView({ posts, date, onMarkPosted, onCopyCaption }: PostViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Separate posted and pending
  const postedPosts = posts.filter(p => p.status.posted);
  const pendingPosts = posts.filter(p => !p.status.posted);

  // Get next post (first pending)
  const nextPost = pendingPosts[0];
  const upcomingPosts = pendingPosts.slice(1);

  const totalPosts = posts.length;
  const donePosts = postedPosts.length;

  const handleCopy = async (post: ScheduledPost) => {
    const fullCaption = post.hashtags
      ? `${post.caption}\n\n${post.hashtags.join(' ')}`
      : post.caption;

    await onCopyCaption(fullCaption);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-semibold text-[#1a1a1a] tracking-tight">
                {formatDate(date)}
              </h1>
              <p className="text-[13px] text-[#6b7280] mt-0.5">
                {totalPosts} posts · {donePosts} done
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(totalPosts, 8) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i < donePosts ? 'bg-[#22c55e]' : 'bg-[#e5e7eb]'
                  }`}
                />
              ))}
              {totalPosts > 8 && (
                <span className="text-[11px] text-[#9ca3af] ml-1">+{totalPosts - 8}</span>
              )}
            </div>
            <div className="text-right">
              <div className="text-[28px] font-semibold text-[#1a1a1a] tabular-nums leading-none">
                {donePosts}/{totalPosts}
              </div>
              <div className="text-[11px] text-[#9ca3af] uppercase tracking-wider mt-1">
                posted
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Up Card - Only show if there's a pending post */}
      {nextPost && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#fbbf24]" />
            <span className="text-[11px] font-semibold text-[#fbbf24] uppercase tracking-wider">
              Next Up
            </span>
          </div>

          <div className={`bg-white border-2 ${platforms[nextPost.platform]?.borderColor || 'border-[#e5e7eb]'} rounded-2xl p-6 shadow-sm`}>
            {/* Platform & Time */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${platforms[nextPost.platform]?.bgColor || 'bg-gray-100'} flex items-center justify-center`}>
                  <span className={`text-[18px] ${platforms[nextPost.platform]?.color || 'text-gray-600'}`}>
                    {platforms[nextPost.platform]?.icon || '?'}
                  </span>
                </div>
                <div>
                  <div className={`text-[14px] font-semibold ${platforms[nextPost.platform]?.color || 'text-gray-900'}`}>
                    {platforms[nextPost.platform]?.name || nextPost.platform}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#6b7280]">
                    <Clock className="w-3.5 h-3.5" />
                    {nextPost.scheduledTime}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#fbbf24]/10 text-[#b45309] text-[11px] font-semibold rounded-full uppercase tracking-wider">
                Post Now
              </span>
            </div>

            {/* Hook */}
            <div className="mb-4">
              <h3 className="text-[16px] font-semibold text-[#1a1a1a] leading-relaxed">
                {nextPost.hook}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-[#9ca3af] uppercase tracking-wider">
                  {nextPost.pillar}
                </span>
                <span className="text-[#d1d5db]">·</span>
                <span className="text-[11px] text-[#6b7280]">
                  {nextPost.topic}
                </span>
              </div>
            </div>

            {/* Caption */}
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 mb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[13px] text-[#374151] leading-relaxed whitespace-pre-wrap">
                    {nextPost.caption}
                  </p>
                  {nextPost.hashtags && nextPost.hashtags.length > 0 && (
                    <p className="text-[12px] text-[#6b7280] mt-3">
                      {nextPost.hashtags.join(' ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleCopy(nextPost)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 flex-shrink-0 ${
                    copiedId === nextPost.id
                      ? 'bg-[#22c55e]/10 text-[#22c55e]'
                      : 'bg-[#1a1a1a] text-white hover:bg-[#333] active:scale-[0.97]'
                  }`}
                >
                  {copiedId === nextPost.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Done button */}
            <button
              onClick={() => onMarkPosted(nextPost.id)}
              className="w-full py-3 bg-[#1a1a1a] hover:bg-[#333] text-white rounded-xl text-[14px] font-semibold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Mark as Posted
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Queue */}
      {upcomingPosts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#9ca3af]" />
            <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
              Coming Up ({upcomingPosts.length})
            </span>
          </div>

          <div className="space-y-2">
            {upcomingPosts.map((post) => {
              const platform = platforms[post.platform];

              return (
                <div
                  key={post.id}
                  className="bg-[#fafafa] border border-[#e5e7eb] rounded-xl p-4 hover:border-[#d1d5db] transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    {/* Platform icon */}
                    <div className={`w-10 h-10 rounded-lg ${platform?.bgColor || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-[16px] ${platform?.color || 'text-gray-600'}`}>
                        {platform?.icon || '?'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#1a1a1a] truncate">
                        {post.hook}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[11px] font-medium ${platform?.color || 'text-gray-600'}`}>
                          {platform?.name || post.platform}
                        </span>
                        <span className="text-[#d1d5db]">·</span>
                        <span className="text-[11px] text-[#9ca3af]">
                          {post.scheduledTime}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleCopy(post)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          copiedId === post.id
                            ? 'bg-[#22c55e]/10 text-[#22c55e]'
                            : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#1a1a1a]'
                        }`}
                        title="Copy caption"
                      >
                        {copiedId === post.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => onMarkPosted(post.id)}
                        className="p-2 rounded-lg bg-[#f3f4f6] text-[#6b7280] hover:bg-[#1a1a1a] hover:text-white transition-all duration-200"
                        title="Mark as posted"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    <ChevronRight className="w-5 h-5 text-[#d1d5db] flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Posted Today */}
      {postedPosts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
            <span className="text-[11px] font-semibold text-[#22c55e] uppercase tracking-wider">
              Posted ({postedPosts.length})
            </span>
          </div>

          <div className="space-y-2">
            {postedPosts.map((post) => {
              const platform = platforms[post.platform];

              return (
                <div
                  key={post.id}
                  className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 opacity-60"
                >
                  <div className="flex items-center gap-4">
                    {/* Checkmark */}
                    <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-[#22c55e]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#6b7280] truncate line-through">
                        {post.hook}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[11px] ${platform?.color || 'text-gray-600'}`}>
                          {platform?.name || post.platform}
                        </span>
                        <span className="text-[#d1d5db]">·</span>
                        <span className="text-[11px] text-[#9ca3af]">
                          {post.scheduledTime}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <span className="text-[11px] text-[#22c55e] font-medium">
                      Done
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && (
        <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f3f4f6] flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-[#9ca3af]" />
          </div>
          <h3 className="text-[15px] font-medium text-[#1a1a1a] mb-1">
            No posts scheduled
          </h3>
          <p className="text-[13px] text-[#6b7280]">
            Create content to see your posting queue
          </p>
        </div>
      )}

      {/* All done state */}
      {posts.length > 0 && pendingPosts.length === 0 && (
        <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-xl p-8 text-center mt-6">
          <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#22c55e]" />
          </div>
          <h3 className="text-[16px] font-semibold text-[#22c55e] mb-1">
            All done for today!
          </h3>
          <p className="text-[13px] text-[#6b7280]">
            You've posted all {donePosts} scheduled posts
          </p>
        </div>
      )}
    </div>
  );
}
