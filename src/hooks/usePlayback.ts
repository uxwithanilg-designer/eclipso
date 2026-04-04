'use client';
import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';

/**
 * Drives the timeline playback loop using requestAnimationFrame.
 * Uses a ref for the playhead position internally (runs at 60fps)
 * but only updates React state every 4th frame (~15fps) to avoid
 * full re-renders on every frame.
 */
export function usePlayback() {
  const isPlaying   = useEditorStore(s => s.isPlaying);
  const playheadPos = useEditorStore(s => s.playheadPos);
  const zoom        = useEditorStore(s => s.zoom);
  const setPlayheadPos = useEditorStore(s => s.setPlayheadPos);

  // Internal ref: updated every frame without causing re-renders
  const playheadUnitsRef = useRef(playheadPos / (zoom * 0.14));

  useEffect(() => {
    if (!isPlaying) return;

    // Sync ref to current state when playback starts
    playheadUnitsRef.current = playheadPos / (zoom * 0.14);

    let req: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      // Ignore huge dt (tab was hidden / system lag recovery)
      if (dt > 0 && dt < 500) {
        playheadUnitsRef.current += (dt / 1000) * 15;
        const pct = playheadUnitsRef.current * (zoom * 0.14);
        if (pct > 100) {
          playheadUnitsRef.current = 0;
        }
        // Update React state only every 4 frames (~15fps) — prevents 60fps re-renders
        frameCount++;
        if (frameCount % 4 === 0) {
          const finalPct = playheadUnitsRef.current * (zoom * 0.14);
          setPlayheadPos(finalPct > 100 ? 0 : finalPct);
        }
      }
      req = requestAnimationFrame(loop);
    };

    req = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(req);
  }, [isPlaying, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  return playheadUnitsRef;
}
