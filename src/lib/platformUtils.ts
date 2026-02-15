import type { Platform } from '../types';

const PLATFORM_ICON_MAP: Record<Platform, string> = {
  tiktok: 'TT',
  shorts: 'YS',
  reels: 'IG',
  facebook: 'FB',
  linkedin: 'LI',
  snapchat: 'SC',
  ytlong: 'YT',
  reddit: 'RD',
  mumsnet: 'MN',
};

export const getPlatformIcon = (platform: Platform): string =>
  PLATFORM_ICON_MAP[platform];
