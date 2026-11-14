import { useState, useCallback, useRef, useEffect, type RefObject } from 'react';
import { CarVideoItem } from '../types/media';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Triggers a browser file download from a Blob or string payload.
 */
export function downloadBlob(
  content: Blob | string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8'
): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Formats seconds as mm:ss.
 */
export function formatSeconds(sec: number): string {
  const safe = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Formats a media duration in seconds or '--:--' when unknown.
 */
export function formatDurationOrUnknown(sec: number): string {
  return Number.isFinite(sec) && sec > 0 ? formatSeconds(sec) : '--:--';
}

/**
 * Handles Escape-to-close, initial focus, Tab focus trapping, and focus restoration for dialogs.
 */
export function useModalDialog(
  isOpen: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>
): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previousFocused = document.activeElement as HTMLElement | null;

    const rafId = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        panel.focus();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocused?.focus?.();
    };
  }, [isOpen, panelRef]);
}

/**
 * Deduplicates incoming videos against existing items by normalized title + artist.
 */
export function dedupeVideos(
  existing: CarVideoItem[],
  incoming: CarVideoItem[]
): { added: CarVideoItem[]; merged: CarVideoItem[] } {
  const seen = new Set(
    existing.map((v) => `${v.title.trim().toLowerCase()}|${v.artist.trim().toLowerCase()}`)
  );
  const added: CarVideoItem[] = [];
  for (const item of incoming) {
    const key = `${item.title.trim().toLowerCase()}|${item.artist.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      added.push(item);
    }
  }
  return {
    added,
    merged: [...added, ...existing],
  };
}

/**
 * Reusable clipboard copy state hook.
 */
export function useClipboard(resetMs = 2200) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string, key = 'default') => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setCopiedKey(null), resetMs);
      } catch {
        // Fallback ignore if clipboard permission blocked
      }
    },
    [resetMs]
  );

  return { copiedKey, copy };
}

export type NoticeTone = 'info' | 'success' | 'warning';

export interface NoticeState {
  message: string;
  tone: NoticeTone;
}

/**
 * Reusable temporary notice banner hook.
 */
export function useNotice(defaultDurationMs = 4500) {
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const showNotice = useCallback(
    (message: string, tone: NoticeTone = 'success', durationMs = defaultDurationMs) => {
      setNotice({ message, tone });
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (durationMs > 0) {
        timerRef.current = window.setTimeout(() => setNotice(null), durationMs);
      }
    },
    [defaultDurationMs]
  );

  const clearNotice = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setNotice(null);
  }, []);

  return { notice, showNotice, clearNotice };
}
