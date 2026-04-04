import { create } from 'zustand';
import {
  ToolId, LeftTab, Workspace, Track, Clip, Transition, Marker,
  HistoryEntry, ProjectFile, Keyframe,
  initTracks, initMarkers, MAX_HISTORY
} from '@/types/editor';

interface EditorState {
  // UI
  activeTool: ToolId;
  leftTab: LeftTab;
  workspace: Workspace;
  showExport: boolean;
  notification: string | null;
  isMobile: boolean;

  // Tracks & Markers & Files
  tracks: Track[];
  markers: Marker[];
  projectFiles: ProjectFile[];

  // History (clips + transitions live inside history entries)
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];

  // Playback
  isPlaying: boolean;
  playheadPos: number; // 0–100 percentage
  zoom: number;

  // Selection
  selectedClipIds: number[];
  selectedKeyframe: { clipId: number; prop: string; kfId: number } | null;
  snappingEnabled: boolean;

  // Source Monitor
  sourceClip: { label: string; color: string; type: 'video' | 'audio'; duration: number; url?: string } | null;
  sourceIsPlaying: boolean;
  sourcePlayheadPct: number;
  sourceInPct: number;
  sourceOutPct: number;

  // ── Actions ──
  setActiveTool(tool: ToolId): void;
  setLeftTab(tab: LeftTab): void;
  setWorkspace(ws: Workspace): void;
  setShowExport(v: boolean): void;
  notify(msg: string): void;
  setIsMobile(v: boolean): void;

  setTracks(tracks: Track[] | ((prev: Track[]) => Track[])): void;
  setMarkers(markers: Marker[]): void;
  addProjectFiles(files: ProjectFile[]): void;

  setIsPlaying(v: boolean): void;
  setPlayheadPos(v: number): void;
  setZoom(v: number): void;

  setSelectedClipIds(ids: number[]): void;
  setSelectedKeyframe(kf: { clipId: number; prop: string; kfId: number } | null): void;
  setSnappingEnabled(v: boolean): void;

  setSourceClip(clip: { label: string; color: string; type: 'video' | 'audio'; duration: number; url?: string } | null): void;
  setSourceIsPlaying(v: boolean): void;
  setSourcePlayheadPct(v: number): void;
  setSourceInPct(v: number): void;
  setSourceOutPct(v: number): void;

  // History
  setClips(clipsOrUpdater: Clip[] | ((prev: Clip[]) => Clip[])): void;
  setTransitions(trOrUpdater: Transition[] | ((prev: Transition[]) => Transition[])): void;
  applyAction(label: string, clips: Clip[], transitions?: Transition[]): void;
  undo(): void;
  redo(): void;
  jumpToHistory(index: number): void;
}

const initialPresent: HistoryEntry = {
  id: Date.now(),
  label: 'Initial State',
  clips: [],
  transitions: [],
  timestamp: Date.now(),
};

export const useEditorStore = create<EditorState>((set, get) => ({
  // UI
  activeTool: 'select',
  leftTab: 'media',
  workspace: 'editing',
  showExport: false,
  notification: null,
  isMobile: false,

  // Data
  tracks: initTracks(),
  markers: initMarkers(),
  projectFiles: [],

  // History
  past: [],
  present: initialPresent,
  future: [],

  // Playback
  isPlaying: false,
  playheadPos: 38,
  zoom: 1,

  // Selection
  selectedClipIds: [],
  selectedKeyframe: null,
  snappingEnabled: true,

  // Source Monitor
  sourceClip: null,
  sourceIsPlaying: false,
  sourcePlayheadPct: 0,
  sourceInPct: 0,
  sourceOutPct: 100,

  // ── Action implementations ──
  setActiveTool: (tool) => set({ activeTool: tool }),
  setLeftTab: (tab) => set({ leftTab: tab }),
  setWorkspace: (ws) => set({ workspace: ws }),
  setShowExport: (v) => set({ showExport: v }),
  notify: (msg) => {
    set({ notification: msg });
    setTimeout(() => set({ notification: null }), 2500);
  },
  setIsMobile: (v) => set({ isMobile: v }),

  setTracks: (tracksOrUpdater) => {
    if (typeof tracksOrUpdater === 'function') {
      set(state => ({ tracks: (tracksOrUpdater as (prev: Track[]) => Track[])(state.tracks) }));
    } else {
      set({ tracks: tracksOrUpdater });
    }
  },
  setMarkers: (markers) => set({ markers }),
  addProjectFiles: (files) => set(state => ({ projectFiles: [...state.projectFiles, ...files] })),

  setIsPlaying: (v) => set({ isPlaying: v }),
  setPlayheadPos: (v) => set({ playheadPos: v }),
  setZoom: (v) => set({ zoom: v }),

  setSelectedClipIds: (ids) => set({ selectedClipIds: ids }),
  setSelectedKeyframe: (kf) => set({ selectedKeyframe: kf }),
  setSnappingEnabled: (v) => set({ snappingEnabled: v }),

  setSourceClip: (clip) => set({ sourceClip: clip }),
  setSourceIsPlaying: (v) => set({ sourceIsPlaying: v }),
  setSourcePlayheadPct: (v) => set({ sourcePlayheadPct: v }),
  setSourceInPct: (v) => set({ sourceInPct: v }),
  setSourceOutPct: (v) => set({ sourceOutPct: v }),

  // History actions
  setClips: (clipsOrUpdater) => {
    const state = get();
    const nextClips = typeof clipsOrUpdater === 'function'
      ? (clipsOrUpdater as (prev: Clip[]) => Clip[])(state.present.clips)
      : clipsOrUpdater;
    set({ present: { ...state.present, clips: nextClips } });
  },

  setTransitions: (trOrUpdater) => {
    const state = get();
    const nextTr = typeof trOrUpdater === 'function'
      ? (trOrUpdater as (prev: Transition[]) => Transition[])(state.present.transitions)
      : trOrUpdater;
    set({ present: { ...state.present, transitions: nextTr } });
  },

  applyAction: (label, clips, transitions) => {
    const state = get();
    const newTransitions = transitions ?? state.present.transitions;
    const newPast = [...state.past, state.present].slice(-MAX_HISTORY);
    const newPresent: HistoryEntry = {
      id: Date.now(),
      label,
      clips,
      transitions: newTransitions,
      timestamp: Date.now(),
    };
    set({ past: newPast, present: newPresent, future: [] });
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    const prev = state.past[state.past.length - 1];
    set({
      past: state.past.slice(0, -1),
      present: prev,
      future: [state.present, ...state.future],
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    set({
      past: [...state.past, state.present],
      present: next,
      future: state.future.slice(1),
    });
  },

  jumpToHistory: (index) => {
    const state = get();
    const all = [...state.past, state.present, ...state.future];
    if (index < 0 || index >= all.length) return;
    set({
      past: all.slice(0, index),
      present: all[index],
      future: all.slice(index + 1),
    });
  },
}));

// Convenience selectors
export const selectClips = (s: EditorState) => s.present.clips;
export const selectTransitions = (s: EditorState) => s.present.transitions;
