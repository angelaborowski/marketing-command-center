import { useState, useEffect } from 'react';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../types';

export interface UseSettingsReturn {
  settings: Settings;
  updateSettings: (settings: Settings) => void;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.settings);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  return { settings, updateSettings: setSettings };
}
