'use client';

import { useEffect } from 'react';

/**
 * Registers global chunk-load listeners after mount (no <script> in the React tree).
 * Replaces inline script handlers from root layout for React 19 compatibility.
 */
export function ChunkErrorListeners() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (
        event.message &&
        (event.message.includes('ChunkLoadError') ||
          event.message.includes('Loading chunk') ||
          event.message.includes('Failed to fetch dynamically imported module'))
      ) {
        console.warn('Chunk loading error detected, will retry on next navigation');
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        reason && typeof reason === 'object' && 'message' in reason
          ? String((reason as { message?: unknown }).message)
          : String(reason);
      if (
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk') ||
        msg.includes('Failed to fetch dynamically imported module')
      ) {
        console.warn('Chunk loading promise rejection detected');
        event.preventDefault();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
