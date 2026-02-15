import { useState, useEffect, useCallback } from 'react';
import type { useLinkedIn } from '../useLinkedIn';
import type { ContentItem, Settings, Platform, PerformanceMetrics } from '../types';
import { PLATFORM_CONTENT_TYPES, STORAGE_KEYS } from '../types';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export interface UseContentItemsReturn {
  contentItems: ContentItem[];
  setContentItems: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  addContentItem: (item: Omit<ContentItem, 'id'>) => void;
  updateContentItem: (id: string, updates: Partial<ContentItem>) => void;
  deleteContentItem: (id: string) => void;
  duplicateContentItem: (id: string, targetPlatform: Platform) => void;
  toggleFilmed: (id: string) => void;
  togglePosted: (id: string) => void;
  markAllFilmed: () => void;
  handlePostToLinkedIn: (id: string) => Promise<void>;
  handleSavePerformance: (itemId: string, metrics: PerformanceMetrics) => void;
  performanceModalItem: ContentItem | null;
  setPerformanceModalItem: (item: ContentItem | null) => void;
  openPerformanceModal: (item: ContentItem) => void;
  getItemsByDay: (day: string) => ContentItem[];
  getItemsToFilm: () => ContentItem[];
  getItemsToPost: () => ContentItem[];
  totalItems: number;
  filmedCount: number;
  postedCount: number;
  itemsWithPerformance: ContentItem[];
  totalViews: number;
  avgEngagement: number;
}

export function useContentItems(
  linkedin: ReturnType<typeof useLinkedIn>,
  settings: Settings
): UseContentItemsReturn {
  const [contentItems, setContentItems] = useState<ContentItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.contentItems);
    return saved ? JSON.parse(saved) : [];
  });

  const [performanceModalItem, setPerformanceModalItem] = useState<ContentItem | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.contentItems, JSON.stringify(contentItems));
  }, [contentItems]);

  // CRUD operations
  const addContentItem = useCallback((item: Omit<ContentItem, 'id'>) => {
    const newItem: ContentItem = { ...item, id: generateId() };
    setContentItems(prev => [...prev, newItem]);
  }, []);

  const updateContentItem = useCallback((id: string, updates: Partial<ContentItem>) => {
    setContentItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const deleteContentItem = useCallback((id: string) => {
    setContentItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const duplicateContentItem = useCallback((id: string, targetPlatform: Platform) => {
    const item = contentItems.find(i => i.id === id);
    if (!item) return;

    const targetContentType = (PLATFORM_CONTENT_TYPES[targetPlatform]?.[0] ?? 'video') as ContentItem['contentType'];
    const newItem: ContentItem = {
      ...item,
      id: generateId(),
      platform: targetPlatform,
      contentType: targetContentType,
      filmed: targetContentType === 'text' ? true : item.filmed,
      posted: false,
      postedAt: undefined,
      performance: undefined,
      filmingEventId: undefined,
      postingEventId: undefined,
    };
    setContentItems(prev => [...prev, newItem]);
  }, [contentItems]);

  const toggleFilmed = useCallback((id: string) => {
    setContentItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, filmed: !item.filmed } : item
      )
    );
  }, []);

  const togglePosted = useCallback((id: string) => {
    const item = contentItems.find(i => i.id === id);
    if (!item) return;

    if (!item.posted && !item.performance) {
      setPerformanceModalItem(item);
      return;
    }

    setContentItems(prev =>
      prev.map(i =>
        i.id === id ? { ...i, posted: !i.posted, postedAt: !i.posted ? new Date().toISOString() : undefined } : i
      )
    );
  }, [contentItems]);

  const markAllFilmed = useCallback(() => {
    setContentItems(prev =>
      prev.map(item =>
        (item.contentType === 'video' || item.contentType === undefined) && !item.filmed
          ? { ...item, filmed: true }
          : item
      )
    );
  }, []);

  // LinkedIn posting
  const handlePostToLinkedIn = useCallback(async (id: string) => {
    const item = contentItems.find(i => i.id === id);
    if (!item) return;

    const result = await linkedin.postToLinkedIn(item, {
      postTarget: settings.linkedinPostTarget || 'personal',
      orgId: settings.linkedinOrgId,
    });
    if (result.success) {
      setContentItems(prev =>
        prev.map(i =>
          i.id === id ? { ...i, posted: true, postedAt: new Date().toISOString() } : i
        )
      );
    }
  }, [contentItems, linkedin, settings.linkedinPostTarget, settings.linkedinOrgId]);

  // Performance
  const handleSavePerformance = useCallback((itemId: string, metrics: PerformanceMetrics) => {
    setContentItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, posted: true, postedAt: new Date().toISOString(), performance: metrics }
          : item
      )
    );
    setPerformanceModalItem(null);
  }, []);

  const openPerformanceModal = useCallback((item: ContentItem) => {
    setPerformanceModalItem(item);
  }, []);

  // Filters
  const getItemsByDay = (day: string) =>
    contentItems.filter(item => item.day === day);

  const getItemsToFilm = () =>
    contentItems.filter(item => !item.filmed);

  const getItemsToPost = () =>
    contentItems.filter(item => item.filmed && !item.posted);

  // Stats
  const totalItems = contentItems.length;
  const filmedCount = contentItems.filter(item => item.filmed).length;
  const postedCount = contentItems.filter(item => item.posted).length;
  const itemsWithPerformance = contentItems.filter(item => item.performance && item.performance.views > 0);
  const totalViews = itemsWithPerformance.reduce((sum, item) => sum + (item.performance?.views || 0), 0);
  const avgEngagement = itemsWithPerformance.length > 0
    ? itemsWithPerformance.reduce((sum, item) => sum + (item.performance?.engagementRate || 0), 0) / itemsWithPerformance.length
    : 0;

  return {
    contentItems,
    setContentItems,
    addContentItem,
    updateContentItem,
    deleteContentItem,
    duplicateContentItem,
    toggleFilmed,
    togglePosted,
    markAllFilmed,
    handlePostToLinkedIn,
    handleSavePerformance,
    performanceModalItem,
    setPerformanceModalItem,
    openPerformanceModal,
    getItemsByDay,
    getItemsToFilm,
    getItemsToPost,
    totalItems,
    filmedCount,
    postedCount,
    itemsWithPerformance,
    totalViews,
    avgEngagement,
  };
}
