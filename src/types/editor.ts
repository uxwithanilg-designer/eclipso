// ═══════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════
export type ToolId = 'select'|'track_fwd'|'ripple'|'rolling'|'rate'|'razor'|'slip'|'slide'|'hand'|'zoom'|'pen'|'text';
export type LeftTab = 'media'|'library'|'effects'|'transitions'|'color'|'sound'|'mixer'|'captions'|'ai'|'markers'|'history';
export type RightTab = 'effectcontrols'|'info';
export type Workspace = 'editing'|'color'|'audio'|'effects'|'all';
export type MobileTab = 'videos'|'music'|'titles'|null;
export type Interpolation = 'linear'|'ease-in'|'ease-out';

export type Track = {
  id: number;
  type: 'video'|'audio'|'caption';
  label: string;
  color: string;
  muted: boolean;
  solo: boolean;
  locked: boolean;
  height: number;
};

export type Keyframe = {
  id: number;
  time: number;
  value: number;
  interpolation: Interpolation;
};

export type Clip = {
  id: number;
  trackId: number;
  start: number;
  width: number;
  sourceWidth?: number;
  label: string;
  color: string;
  type: 'video'|'audio';
  speed?: number;
  proxy?: boolean;
  nested?: boolean;
  groupId?: number;
  url?: string;
  sourceOffset?: number;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  anchorX?: number;
  anchorY?: number;
  opacity?: number;
  keyframes?: Record<string, Keyframe[]>;
};

export type Marker = {
  id: number;
  time: number;
  label: string;
  color: string;
};

export type Transition = {
  id: number;
  trackId: number;
  startTime: number;
  duration: number;
  type: string;
  reversed?: boolean;
};

export type HistoryEntry = {
  id: number;
  label: string;
  clips: Clip[];
  transitions: Transition[];
  timestamp: number;
};

export type ProjectFile = {
  id: string;
  name: string;
  type: 'video'|'audio'|'image';
  duration?: number;
  color: string;
  url: string;
  thumbnailUrl?: string;
  hasAudio?: boolean;
};

// ═══════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════
export const MAX_HISTORY = 50;

export const TOOLS: {id:ToolId; icon:string; label:string; key:string; group:number}[] = [
  {id:'select',    icon:'↖', label:'Selection Tool',        key:'V', group:0},
  {id:'track_fwd', icon:'⇥', label:'Track Select Fwd',      key:'A', group:0},
  {id:'ripple',    icon:'⟪', label:'Ripple Edit Tool',       key:'B', group:0},
  {id:'rolling',   icon:'⟺', label:'Rolling Edit Tool',      key:'N', group:0},
  {id:'rate',      icon:'⧖', label:'Rate Stretch Tool',      key:'R', group:0},
  {id:'razor',     icon:'✂', label:'Razor Tool',             key:'C', group:1},
  {id:'slip',      icon:'⇄', label:'Slip Tool',              key:'Y', group:1},
  {id:'slide',     icon:'⇌', label:'Slide Tool',             key:'U', group:1},
  {id:'hand',      icon:'✋', label:'Hand Tool',              key:'H', group:2},
  {id:'zoom',      icon:'⊕', label:'Zoom Tool',              key:'Z', group:2},
  {id:'pen',       icon:'✏', label:'Pen Tool',               key:'P', group:3},
  {id:'text',      icon:'T', label:'Type Tool',              key:'T', group:3},
];

export const LEFT_TABS: {id:LeftTab; icon:string; label:string; badge?:string}[] = [
  {id:'media',       icon:'📁', label:'Media',           badge:'5'},
  {id:'library',     icon:'🎵', label:'Library',         badge:'1K+'},
  {id:'effects',     icon:'✨', label:'Effects'},
  {id:'transitions', icon:'🔀', label:'Transitions'},
  {id:'color',       icon:'🎨', label:'Lumetri Color'},
  {id:'sound',       icon:'🔊', label:'Essential Sound'},
  {id:'mixer',       icon:'🎚', label:'Audio Mixer'},
  {id:'captions',    icon:'💬', label:'Captions'},
  {id:'ai',          icon:'🤖', label:'AI Tools'},
  {id:'markers',     icon:'📍', label:'Markers'},
  {id:'history',     icon:'🕘', label:'History'},
];

export const WORKSPACES: {id:Workspace; label:string}[] = [
  {id:'editing',  label:'Editing'},
  {id:'color',    label:'Color'},
  {id:'audio',    label:'Audio'},
  {id:'effects',  label:'Effects'},
  {id:'all',      label:'All Panels'},
];

export const VIDEO_EFFECTS = [
  {name:'Gaussian Blur',     cat:'Blur',       icon:'◐'},
  {name:'Sharpen',           cat:'Blur',       icon:'◑'},
  {name:'Crop',              cat:'Transform',  icon:'⊡'},
  {name:'Transform',         cat:'Transform',  icon:'⊞'},
  {name:'Corner Pin',        cat:'Distort',    icon:'⬡'},
  {name:'Warp Stabilizer',   cat:'Distort',    icon:'〰'},
  {name:'Brightness&Contrast',cat:'Color',     icon:'☀'},
  {name:'Lumetri Color',     cat:'Color',      icon:'🎨'},
  {name:'Black & White',     cat:'Color',      icon:'◫'},
  {name:'Drop Shadow',       cat:'Stylize',    icon:'▣'},
  {name:'Glow',              cat:'Stylize',    icon:'✦'},
  {name:'Film Grain',        cat:'Stylize',    icon:'⁘'},
  {name:'Chromatic Aberration',cat:'Stylize',  icon:'⊛'},
  {name:'Vignette',          cat:'Stylize',    icon:'◉'},
  {name:'Ultra Key',         cat:'Keying',     icon:'🟩'},
  {name:'Motion Blur',       cat:'Time',       icon:'≋'},
  {name:'Basic 3D',          cat:'3D',         icon:'◆'},
  {name:'Noise Reduction',   cat:'Repair',     icon:'⊘'},
];

export const AUDIO_EFFECTS = [
  {name:'EQ / Parametric',  icon:'🎛'},{name:'Compressor',     icon:'📊'},
  {name:'Reverb',           icon:'〰'},{name:'Delay / Echo',   icon:'⧫'},
  {name:'Limiter',          icon:'⊓'},{name:'Noise Gate',     icon:'⊔'},
  {name:'De-Noise',         icon:'⊘'},{name:'Chorus',         icon:'≋'},
  {name:'Pitch Shift',      icon:'♪'},{name:'Stereo Expand',  icon:'⟺'},
];

export const TRANSITION_LIST = [
  {name:'Cross Dissolve',    cat:'Dissolve',   key:'Ctrl+D'},
  {name:'Dip to Black',      cat:'Dissolve',   key:''},
  {name:'Dip to White',      cat:'Dissolve',   key:''},
  {name:'Film Dissolve',     cat:'Dissolve',   key:''},
  {name:'Wipe Left→Right',   cat:'Wipe',       key:''},
  {name:'Wipe Right→Left',   cat:'Wipe',       key:''},
  {name:'Wipe Top→Bottom',   cat:'Wipe',       key:''},
  {name:'Clock Wipe',        cat:'Wipe',       key:''},
  {name:'Slide Left',        cat:'Slide',      key:''},
  {name:'Slide Right',       cat:'Slide',      key:''},
  {name:'Push Left',         cat:'Slide',      key:''},
  {name:'Zoom In',           cat:'Zoom',       key:''},
  {name:'Zoom Out',          cat:'Zoom',       key:''},
  {name:'Spin',              cat:'Special',    key:''},
  {name:'Flash',             cat:'Special',    key:''},
  {name:'Morph Cut',         cat:'Special',    key:''},
  {name:'Audio CrossFade',   cat:'Audio',      key:'Ctrl+Shift+D'},
  {name:'Constant Power',    cat:'Audio',      key:''},
];

export const LUT_PRESETS = ['Cinematic','Vintage','Cyberpunk','Teal & Orange','Bleach Bypass','Noir','Warm Sunset','Cold Arctic','Golden Hour','Neon Lights','Matte Fade'];

export const MUSIC_TRACKS_DATA = [
  {id:100, title:'Midnight Pulse', artist:'Kova',          dur:'2:34', bpm:128, accent:'#7C5CFF'},
  {id:101, title:'Golden Hour',    artist:'Nyx Audio',     dur:'3:12', bpm:96,  accent:'#00E5FF'},
  {id:102, title:'Neon Rain',      artist:'The Sound Lab', dur:'2:48', bpm:140, accent:'#FF3B82'},
  {id:103, title:'Crystal Caves',  artist:'Aether',        dur:'4:02', bpm:85,  accent:'#00FF94'},
  {id:104, title:'Urban Legends',  artist:'Drex',          dur:'3:33', bpm:110, accent:'#FF8C00'},
  {id:105, title:'Deep Space',     artist:'Solara',        dur:'5:15', bpm:72,  accent:'#FFD60A'},
];

export const CLIP_WAVE = [45,72,31,88,54,19,67,42,78,25,61,38,90,55,22,74,48,85,33,68,27,80,50,16,73,44,92,36,64,29,57,82,23,70,46,15,76,52,88,34,62,41,79,26,59,83,20,66,49,91,37,71,28,86,53,18,75,43,87,30];

export const COLOR_CONTROLS = [
  {label:'Exposure',    min:-5,  max:5,  step:0.1, color:'#FFD60A', def:0},
  {label:'Contrast',   min:-100,max:100,step:1,   color:'#FF8C00', def:0},
  {label:'Highlights', min:-100,max:100,step:1,   color:'#FFFFFF', def:0},
  {label:'Shadows',    min:-100,max:100,step:1,   color:'#7C5CFF', def:0},
  {label:'Whites',     min:-100,max:100,step:1,   color:'#F0F0FF', def:0},
  {label:'Blacks',     min:-100,max:100,step:1,   color:'#444466', def:0},
  {label:'Saturation', min:0,   max:200,step:1,   color:'#00FF94', def:100},
  {label:'Temperature',min:-100,max:100,step:1,   color:'#00E5FF', def:0},
  {label:'Tint',       min:-100,max:100,step:1,   color:'#FF3B82', def:0},
];

// ═══════════════════════════════════════════════════
//  INITIALIZERS
// ═══════════════════════════════════════════════════
export function initTracks(): Track[] {
  return [
    {id:1, type:'video',   label:'V3', color:'#5566EE', muted:false, solo:false, locked:false, height:48},
    {id:2, type:'video',   label:'V2', color:'#7C5CFF', muted:false, solo:false, locked:false, height:48},
    {id:3, type:'video',   label:'V1', color:'#9966FF', muted:false, solo:false, locked:false, height:52},
    {id:7, type:'caption', label:'CT', color:'#FFD60A', muted:false, solo:false, locked:false, height:28},
    {id:4, type:'audio',   label:'A1', color:'#00E5FF', muted:false, solo:false, locked:false, height:44},
    {id:5, type:'audio',   label:'A2', color:'#00FF94', muted:false, solo:false, locked:false, height:44},
    {id:6, type:'audio',   label:'A3', color:'#FF3B82', muted:false, solo:false, locked:false, height:36},
  ];
}

export function initMarkers(): Marker[] {
  return [
    {id:1, time:15,  label:'Intro End',    color:'#FFD60A'},
    {id:2, time:38,  label:'Key Moment',   color:'#FF3B82'},
    {id:3, time:60,  label:'Music Drop',   color:'#00E5FF'},
  ];
}

// ═══════════════════════════════════════════════════
//  HELPER: getClipValue (keyframe interpolation)
// ═══════════════════════════════════════════════════
export function getClipValue(clip: Clip, prop: string, sequenceTime: number): number {
  const kfs = clip.keyframes?.[prop];
  const staticVal = (clip as any)[prop] ?? (prop === 'scale' || prop === 'opacity' ? 100 : 0);
  if (!kfs || kfs.length === 0) return staticVal;

  const time = sequenceTime - clip.start;
  const sorted = [...kfs].sort((a, b) => a.time - b.time);

  const nextIdx = sorted.findIndex(k => k.time > time);
  if (nextIdx === -1) return sorted[sorted.length - 1].value;
  if (nextIdx === 0) return sorted[0].value;

  const prev = sorted[nextIdx - 1];
  const next = sorted[nextIdx];

  const t = (time - prev.time) / (next.time - prev.time);
  let easeT = t;
  if (next.interpolation === 'ease-in') easeT = t * t;
  else if (next.interpolation === 'ease-out') easeT = 1 - (1 - t) * (1 - t);

  return prev.value + (next.value - prev.value) * easeT;
}
