import { useEffect } from 'react';
import type { Section } from '../types';

export function useKeyboardShortcuts(
  setActiveSection: (section: Section) => void,
  setSettingsOpen: (open: boolean) => void,
  setExpandedItem: (id: string | null) => void
): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        switch (e.key) {
          case '0':
            e.preventDefault();
            setActiveSection('home');
            break;
          case '1':
            e.preventDefault();
            setActiveSection('week');
            break;
          case '2':
            e.preventDefault();
            setActiveSection('shotlist');
            break;
          case '3':
            e.preventDefault();
            setActiveSection('textqueue');
            break;
          case '4':
            e.preventDefault();
            setActiveSection('post');
            break;
          case '5':
            e.preventDefault();
            setActiveSection('agents');
            break;
          case ',':
            e.preventDefault();
            setSettingsOpen(true);
            break;
        }
      }

      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setExpandedItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveSection, setSettingsOpen, setExpandedItem]);
}
