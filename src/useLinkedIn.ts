import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from './types';
import type { ContentItem } from './types';

interface LinkedInState {
  isConnected: boolean;
  isPosting: boolean;
  error: string | null;
}

interface PostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export function useLinkedIn() {
  const [state, setState] = useState<LinkedInState>(() => ({
    isConnected: !!localStorage.getItem(STORAGE_KEYS.linkedinToken),
    isPosting: false,
    error: null,
  }));

  // Check for OAuth callback params in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('linkedin_token');
    const sub = params.get('linkedin_sub');
    const expires = params.get('linkedin_expires');
    const error = params.get('linkedin_error');

    if (token && sub) {
      localStorage.setItem(STORAGE_KEYS.linkedinToken, token);
      localStorage.setItem(STORAGE_KEYS.linkedinSub, sub);
      if (expires) {
        const expiryTime = Date.now() + parseInt(expires) * 1000;
        localStorage.setItem(STORAGE_KEYS.linkedinTokenExpiry, expiryTime.toString());
      }
      setState(s => ({ ...s, isConnected: true, error: null }));

      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('linkedin_token');
      url.searchParams.delete('linkedin_sub');
      url.searchParams.delete('linkedin_expires');
      window.history.replaceState({}, '', url.pathname);
    } else if (error) {
      setState(s => ({ ...s, error: `LinkedIn connection failed: ${error}` }));
      const url = new URL(window.location.href);
      url.searchParams.delete('linkedin_error');
      window.history.replaceState({}, '', url.pathname);
    }
  }, []);

  // Check token expiry
  useEffect(() => {
    const expiry = localStorage.getItem(STORAGE_KEYS.linkedinTokenExpiry);
    if (expiry && Date.now() > parseInt(expiry)) {
      disconnect();
    }
  });

  const connect = useCallback(() => {
    // Redirect to backend OAuth endpoint
    window.location.href = '/api/linkedin/auth';
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.linkedinToken);
    localStorage.removeItem(STORAGE_KEYS.linkedinSub);
    localStorage.removeItem(STORAGE_KEYS.linkedinTokenExpiry);
    setState({ isConnected: false, isPosting: false, error: null });
  }, []);

  const postToLinkedIn = useCallback(async (
    item: ContentItem,
    options?: { postTarget?: 'personal' | 'company'; orgId?: string }
  ): Promise<PostResult> => {
    const accessToken = localStorage.getItem(STORAGE_KEYS.linkedinToken);
    const personUrn = localStorage.getItem(STORAGE_KEYS.linkedinSub);

    if (!accessToken || !personUrn) {
      return { success: false, error: 'Not connected to LinkedIn' };
    }

    const postTarget = options?.postTarget || 'personal';
    const authorUrn = postTarget === 'company' ? options?.orgId : personUrn;
    const authorType = postTarget === 'company' ? 'organization' : 'person';

    if (postTarget === 'company' && !authorUrn) {
      return { success: false, error: 'Company Organization ID not set. Add it in Settings.' };
    }

    setState(s => ({ ...s, isPosting: true, error: null }));

    try {
      // Build the post text: hook + caption + hashtags
      const parts: string[] = [];
      if (item.hook) parts.push(item.hook);
      if (item.caption) parts.push(item.caption);
      if (item.hashtags?.length) parts.push(item.hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' '));
      const text = parts.join('\n\n');

      const response = await fetch('/api/linkedin/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, authorUrn, authorType, text }),
      });

      if (response.status === 401) {
        disconnect();
        return { success: false, error: 'LinkedIn token expired. Please reconnect.' };
      }

      const data = await response.json();

      if (!response.ok) {
        setState(s => ({ ...s, isPosting: false, error: data.error || 'Failed to post' }));
        return { success: false, error: data.error || 'Failed to post' };
      }

      setState(s => ({ ...s, isPosting: false }));
      return { success: true, postId: data.postId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState(s => ({ ...s, isPosting: false, error: message }));
      return { success: false, error: message };
    }
  }, [disconnect]);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  return {
    isConnected: state.isConnected,
    isPosting: state.isPosting,
    error: state.error,
    connect,
    disconnect,
    postToLinkedIn,
    clearError,
  };
}
