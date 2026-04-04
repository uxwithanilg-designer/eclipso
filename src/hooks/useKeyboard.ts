'use client';
import { useEffect, useRef } from 'react';
import { useEditorStore, selectClips, selectTransitions } from '@/store/editorStore';
import { Clip, Transition } from '@/types/editor';

/**
 * Registers all global keyboard shortcuts for the editor.
 * Must be called once at the top level (EditorShell).
 */
export function useKeyboard(fileInputRef: React.RefObject<HTMLInputElement | null>) {
  const store = useEditorStore();

  // Keep a mutable ref so keyboard handler always has fresh state
  // without stale closure issues.
  const stateRef = useRef({
    clips: [] as Clip[],
    transitions: [] as Transition[],
    selectedClipIds: [] as number[],
    selectedKeyframe: null as { clipId: number; prop: string; kfId: number } | null,
    snappingEnabled: true,
    sourcePlayheadPct: 0,
  });

  useEffect(() => {
    stateRef.current = {
      clips: store.present.clips,
      transitions: store.present.transitions,
      selectedClipIds: store.selectedClipIds,
      selectedKeyframe: store.selectedKeyframe,
      snappingEnabled: store.snappingEnabled,
      sourcePlayheadPct: store.sourcePlayheadPct,
    };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (!ctrl) {
        if (e.key === 'v' || e.key === 'V') { store.setActiveTool('select'); }
        if (e.key === 'a' || e.key === 'A') { store.setActiveTool('track_fwd'); }
        if (e.key === 'c' || e.key === 'C') { store.setActiveTool('razor'); }
        if (e.key === 'b' || e.key === 'B') { store.setActiveTool('ripple'); }
        if (e.key === 's' || e.key === 'S') {
          const next = !stateRef.current.snappingEnabled;
          store.setSnappingEnabled(next);
          store.notify(next ? '🧲 Snapping On' : '🧲 Snapping Off');
        }
        if (e.key === 'i' || e.key === 'I') {
          store.setSourceInPct(stateRef.current.sourcePlayheadPct);
        }
        if (e.key === 'o' || e.key === 'O') {
          store.setSourceOutPct(stateRef.current.sourcePlayheadPct);
        }
        if (e.code === 'Space') {
          e.preventDefault();
          store.setIsPlaying(!store.isPlaying);  // use store directly for instant toggle
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const { clips, selectedClipIds, selectedKeyframe } = stateRef.current;
          if (selectedKeyframe) {
            e.preventDefault();
            const nextClips = clips.map(c => {
              if (c.id !== selectedKeyframe.clipId || !c.keyframes?.[selectedKeyframe.prop]) return c;
              const nextKfs = { ...c.keyframes };
              nextKfs[selectedKeyframe.prop] = nextKfs[selectedKeyframe.prop].filter(k => k.id !== selectedKeyframe.kfId);
              if (nextKfs[selectedKeyframe.prop].length === 0) delete nextKfs[selectedKeyframe.prop];
              return { ...c, keyframes: Object.keys(nextKfs).length > 0 ? nextKfs : undefined };
            });
            store.applyAction('Delete keyframe', nextClips);
            store.setSelectedKeyframe(null);
            store.notify('Keyframe deleted');
          } else if (selectedClipIds.length > 0) {
            e.preventDefault();
            const newClips = clips.filter(c => !selectedClipIds.includes(c.id));
            store.applyAction(`Delete ${selectedClipIds.length} clip(s)`, newClips);
            store.setSelectedClipIds([]);
            store.notify(`Deleted ${selectedClipIds.length} clip(s)`);
          }
        }
      }

      if (ctrl) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) store.redo();
          else store.undo();
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          store.redo();
        } else if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          fileInputRef.current?.click();
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          store.setSelectedClipIds(stateRef.current.clips.map(c => c.id));
          store.notify('Selected all clips');
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          const { clips, transitions, selectedClipIds } = stateRef.current;
          if (selectedClipIds.length === 2) {
            const c1 = clips.find(c => c.id === selectedClipIds[0]);
            const c2 = clips.find(c => c.id === selectedClipIds[1]);
            if (c1 && c2 && c1.trackId === c2.trackId) {
              const ordered = [c1, c2].sort((a, b) => a.start - b.start);
              const gap = ordered[1].start - (ordered[0].start + ordered[0].width);
              if (Math.abs(gap) < 5) {
                const startTime = ordered[1].start - 7.5;
                const newTr: Transition = { id: Date.now(), trackId: c1.trackId, startTime, duration: 15, type: 'Cross Dissolve' };
                store.applyAction('Apply Cross Dissolve', clips, [...transitions, newTr]);
                store.notify('Cross Dissolve applied');
              }
            }
          }
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
