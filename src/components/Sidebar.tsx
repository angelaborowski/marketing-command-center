import {
  Calendar,
  Film,
  FileText,
  Send,
  Settings as SettingsIcon,
  TrendingUp,
  Bot,
  Home,
  LogOut,
} from 'lucide-react';
import { formatViewCount, getEngagementColor } from '../lib/performance';
import type { ContentItem } from '../types';
import type { Section } from '../types';

const navItems = [
  { id: 'home' as const, label: 'Home', icon: Home, shortcut: '0' },
  { id: 'week' as const, label: 'Week', icon: Calendar, shortcut: '1' },
  { id: 'shotlist' as const, label: 'Shot List', icon: Film, shortcut: '2' },
  { id: 'textqueue' as const, label: 'Text Queue', icon: FileText, shortcut: '3' },
  { id: 'post' as const, label: 'Post', icon: Send, shortcut: '4' },
  { id: 'agents' as const, label: 'Agents', icon: Bot, shortcut: '5' },
];

export interface SidebarProps {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  totalItems: number;
  filmedCount: number;
  postedCount: number;
  itemsWithPerformance: ContentItem[];
  totalViews: number;
  avgEngagement: number;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  activeSection,
  onNavigate,
  totalItems,
  filmedCount,
  postedCount,
  itemsWithPerformance,
  totalViews,
  avgEngagement,
  onOpenSettings,
  onLogout,
}: SidebarProps) {
  return (
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
              onClick={() => onNavigate(item.id)}
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
          onClick={onOpenSettings}
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
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#6b7280] hover:bg-red-50 hover:text-red-600 transition-colors mt-1"
        >
          <LogOut size={16} />
          Lock
        </button>
      </div>
    </aside>
  );
}
